const fluidCanvas=document.getElementById("fluidCanvas")

const gridSize=64;
const cellSize=8;

const utils = new Utils(gridSize, cellSize);

const visc = 0.001;
const diff = 0.00001;
const dt = 0.01;
const dissolveRate = 0.00001;
const slowRate = 0.001;

fluidCanvas.width=gridSize*cellSize;
fluidCanvas.height=gridSize*cellSize;

const fluidCtx=fluidCanvas.getContext("2d");

let dye = utils.createArray();
let dye_n = utils.createArray();
let vx = utils.createArray();
let vx_n = utils.createArray();
let vy = utils.createArray();
let vy_n = utils.createArray();
let p = utils.createArray();
let div = utils.createArray();
let cellCenter = utils.populateCellCenter();

let angle = Math.random() * 2 * Math.PI;
let velSet = 10;

animate();

function addDye(xIdx, yIdx, densityAmount = 500) {
    dye[xIdx][yIdx] += densityAmount;
    vx[xIdx][yIdx] = Math.cos(angle) * velSet;
    vy[xIdx][yIdx] = Math.sin(angle) * velSet;
}

function dissolve(arr, rate) {
    for (let i = 0; i < gridSize - 1; i++) {
        for (let j = 0; j < gridSize - 1; j++) {
            arr[i][j] *= 1 - rate;
        }
    }
}

function drawDensity() {
    for ( let i=0; i<gridSize; i++ ) {
        for ( let j=0; j<gridSize; j++ ) {
            let color = dye[i][j];
            if (color > 255) {color = 255}
            fluidCtx.fillStyle = `rgb(${color}, ${color}, ${color}`;
            fluidCtx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
}

function diffuse(arr, arr_n, diff) {
    a = diff * dt * gridSize**2;
    cRecip = 1 / (1 + 4 * a);
    for ( let k = 0; k < 20; k++ ) {
        for ( let i = 1; i < gridSize - 1; i++ ) {
            for ( let j = 1; j < gridSize - 1; j++) {
                arr_n[i][j] = (arr[i][j] + a * (arr_n[i+1][j] + arr_n[i-1][j]
                    + arr_n[i][j+1] + arr_n[i][j-1])) * cRecip
            }
        }
    }
    arr = arr_n;
}

function advect(arr, arr_n) {
    for ( let i=1; i < gridSize - 1; i++ ) {
        for ( let j=1; j < gridSize - 1; j++ ) {
            let cellX = cellCenter[i][j][0];
            let cellY = cellCenter[i][j][1];
            let advX = cellX - vx[i][j] * dt;
            let advY = cellY - vy[i][j] * dt;
            //Subtracting cellSize/2 puts the interpolation on the correct cells
            let xi = Math.floor((advX - cellSize/2) / cellSize);
            let yi = Math.floor((advY - cellSize / 2) / cellSize);
            if (xi > 63 || xi < 0) {
                console.log('oops');
            }
            let interpX1 = utils.linearInterp(cellCenter[xi][yi][0],
                cellCenter[xi+1][yi][0], advX, arr[xi][yi], arr[xi+1][yi]);
            let interpX2 = utils.linearInterp(cellCenter[xi][yi+1][0],
                cellCenter[xi+1][yi+1][0], advX, arr[xi][yi+1], arr[xi+1][yi+1]);
            arr_n[i][j] = utils.linearInterp(cellCenter[xi][yi][1],
                cellCenter[xi][yi+1][1], advY, interpX1, interpX2);
        }
    }
}

function project(vx, vy) {
    let idxLast = gridSize - 1;

    for (let i = 1; i < idxLast; i++) {
        for (let j = 1; j < idxLast; j++) {
            div[i][j] = ((vx[i+1][j] - vx[i-1][j]) / (2 * cellSize)
                + (vy[i][j+1] - vy[i][j-1]) / (2 * cellSize));
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
    }

    setBoundary(p);
    
    for (let i = 1; i < idxLast; i++) {
        for (let j = 1; j < idxLast; j++) {
            vx[i][j] -= (p[i+1][j] - p[i-1][j]) / 2;
            vy[i][j] -= (p[i][j+1] - p[i][j-1]) / 2;
        }
    }
}

function setBoundary(arr, isVx = false, isVy = false) {
    //left and right boundaries
    let idxLast = gridSize - 1;
    let vxSign = 1;
    let vySign = 1;
    if (isVx) {
        vxSign = -1;
    }
    if (isVy) {
        vySign = -1;
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

function addVelocity(arr, xIdx, yIdx, amount) {
    arr[xIdx][yIdx] += amount;
}

function stepVel() {
    diffuse(vx, vx_n, visc);
    diffuse(vy, vy_n, visc);
    vx = vx_n;
    vy = vy_n;
    project(vx, vy);
    setBoundary(vx, true, false);
    setBoundary(vy, false, true);
    
    advect(vx, vx_n);
    advect(vy, vy_n);
    vx = vx_n;
    vy = vy_n;
    project(vx, vy);
    setBoundary(vx, true, false);
    setBoundary(vy, false, true);

    dissolve(vx, slowRate);
    dissolve(vy, slowRate);
}

function stepDye() {
    diffuse(dye, dye_n, diff);
    dye = dye_n;
    setBoundary(dye);
    advect(dye, dye_n);
    dye = dye_n;
    setBoundary(dye);

    dissolve(dye, dissolveRate);
}

function animate() {
    addDye(32, 32, 100);
    stepVel();
    stepDye();
    drawDensity();
    requestAnimationFrame(animate);
}

//Going to ditch the mouse controls for now, instead, one of the cells in the center will be a source of dye and velocity, switching to a random direction every ~2 seconds
//Event handler property. When the mouse is moved, it passes the event to the function expression below
/*
onmousemove = function(event) {
    mousePosX = event.clientX;
    mousePosY = event.clientY;
}

onmousedown = function(event) {
    mouseIdx = [Math.floor(event.clientX / cellSize), Math.floor(event.clientY / cellSize)]
}
*/
