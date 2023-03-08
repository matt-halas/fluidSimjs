const dt = 0.01;
const gridSize=64;
const cellSize=512 / gridSize;
let a;
let cRecip;

const utils = new Utils(gridSize, cellSize);

let p = utils.createArray();
let div = utils.createArray();
let cellCenter = utils.populateCellCenter();

function diffuse(arr, arr_n, diff, isVx, isVy) {
    a = diff * dt * gridSize**2;
    cRecip = 1 / (1 + 4 * a);
    for ( let k = 0; k < 20; k++ ) {
        for ( let i = 1; i < gridSize - 1; i++ ) {
            for ( let j = 1; j < gridSize - 1; j++) {
                arr_n[i][j] = (arr[i][j] + a * (arr_n[i+1][j] + arr_n[i-1][j]
                    + arr_n[i][j+1] + arr_n[i][j-1])) * cRecip;
            }
        }
        setBoundary(arr_n, isVx, isVy);
    }
    for ( let i = 1; i < gridSize - 1; i++ ) {
        for ( let j = 1; j < gridSize - 1; j++) {
            arr[i][j] = arr_n[i][j];
        }
    }
}

function advect(arr, arr_n, vx, vy) {
    for ( let i=1; i < gridSize - 1; i++ ) {
        for ( let j=1; j < gridSize - 1; j++ ) {
            let advX = cellCenter[i][j][0] - vx[i][j] * dt;
            let advY = cellCenter[i][j][1] - vy[i][j] * dt;
            advX = utils.locLimiter(advX);
            advY = utils.locLimiter(advY);
            //Subtracting cellSize/2 puts the interpolation on the correct cells
            let xi = Math.floor((advX - cellSize / 2) / cellSize);
            let yi = Math.floor((advY - cellSize / 2) / cellSize);
            //Limits xi and yi to be within the canvas
            xi = utils.idxLimiter(xi);
            yi = utils.idxLimiter(yi);
            let interpX1 = utils.linearInterp(cellCenter[xi][yi][0],
                cellCenter[xi+1][yi][0], advX, arr[xi][yi], arr[xi+1][yi]);
            let interpX2 = utils.linearInterp(cellCenter[xi][yi+1][0],
                cellCenter[xi+1][yi+1][0], advX, arr[xi][yi+1], arr[xi+1][yi+1]);
            arr_n[i][j] = utils.linearInterp(cellCenter[xi][yi][1],
                cellCenter[xi][yi+1][1], advY, interpX1, interpX2);
            if (arr_n[i][j] > 1000) {
                arr_n[i][j] = 1000;
            }
        }
    }
    for ( let i = 1; i < gridSize - 1; i++ ) {
        for ( let j = 1; j < gridSize - 1; j++) {
            arr[i][j] = arr_n[i][j];
        }
    }
}

function project(vx, vy) {
    let idxLast = gridSize - 1;
    let h = cellSize / gridSize;

    for (let i = 1; i < idxLast; i++) {
        for (let j = 1; j < idxLast; j++) {
            div[i][j] = 0.5 * ((vx[i+1][j] - vx[i-1][j])
                + (vy[i][j+1] - vy[i][j-1]));
            p[i][j] = 0;
        }
    }
    
    setBoundary(div);
    setBoundary(p);

    for (let k = 0; k < 20; k++) {
        for (let i = 1; i < idxLast; i++) {
            for (let j = 1; j < idxLast; j++) {
                p[i][j] = (div[i][j] + p[i+1][j] + p[i-1][j] 
                    + p[i][j+1] + p[i][j-1]) / 4;
            }
        }
        setBoundary(p);
    }

    for (let i = 1; i < idxLast; i++) {
        for (let j = 1; j < idxLast; j++) {
            vx[i][j] += (p[i+1][j] - p[i-1][j]) / 2;
            vy[i][j] += (p[i][j+1] - p[i][j-1]) / 2;
        }
    }
}

function setBoundary(arr, isVx = false, isVy = false, visc = null) {
    let idxLast = gridSize - 1;
    let vxSign = 1;
    let vySign = 1;
    // For vx, left and right boundaries are set to 
    if (isVx) {
        vxSign = -1;
        vySign = 1 - visc * 100;
    }
    if (isVy) {
        vySign = -1;
        vxSign = 1 - visc * 100;
    }
    for (let i = 1; i < idxLast; i++) {
        // Top and bottom boundaries
        arr[i][0] = vySign * arr[i][1];
        arr[i][idxLast] = vySign * arr[i][idxLast - 1];
        // Left and right boundaries
        arr[0][i] = vxSign * arr[1][i];
        arr[idxLast][i] = vxSign * arr[idxLast - 1][i];
    }
    arr[0][0] = (arr[0][1] + arr[1][0]) / 2;
    arr[idxLast][0] = (arr[idxLast - 1][0] + arr[idxLast][1]) / 2;
    arr[0][idxLast] = (arr[0][idxLast - 1] + arr[1][idxLast]) / 2;
    arr[idxLast][idxLast] = (arr[idxLast - 1][idxLast] + arr[idxLast][idxLast - 1]) / 2;
}

function dissolve(arr, rate) {
    for (let i = 0; i < gridSize - 1; i++) {
        for (let j = 0; j < gridSize - 1; j++) {
            arr[i][j] *= 1 - rate;
        }
    }
}

export {advect, project, diffuse, setBoundary, dissolve};