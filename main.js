const fluidCanvas=document.getElementById("fluidCanvas");

const gridSize=64;
const cellSize=512 / gridSize;

const utils = new Utils(gridSize, cellSize);

let visc = 0.000000001;
let diff = 0.0000000001;
const dt = 0.01;
let dissolveRate = 0.001;

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

let setVelocityFlag = false;

let mousePosX = 32;
let mousePosY = 32;

let delay = 0;
let viscSlider = document.getElementById("myRange");

animate();

function animate() {
    readSliders();
    stepVel();
    stepDye();
    drawDensity();
    requestAnimationFrame(animate);
}

function readSliders() {
    if (!document.getElementById("viscRange")) {
        return
    } else {
        viscSlider = document.getElementById("viscRange");
        var x = viscSlider.value;
        visc = 1e-1 / 10000 * x**2 + 1e-7 / 50 * x + 1e-9;
    }
    if (!document.getElementById("diffRange")) {
        return
    } else {
        diffSlider = document.getElementById("diffRange");
        var x = diffSlider.value;
        diff = 1e-4 / 10000 * x**2 + 1e-8 / 50 * x + 1e-9;
    }
    if (!document.getElementById("dissolveRange")) {
        return
    } else {
        dissolveSlider = document.getElementById("dissolveRange");
        var x = dissolveSlider.value;
        dissolveRate = 1e-2 / 10000 * x**2 + 1e-6 / 50 * x + 1e-7;
    }
}

function addDye(xIdx, yIdx, densityAmount) {
    dye[xIdx][yIdx] += densityAmount;
}

function setVelocity(xIdx, yIdx, dx, dy) {
    vx[xIdx][yIdx] += dx * 1000;
    vy[xIdx][yIdx] += dy * 1000;
}

function dissolve(arr, rate) {
    for (let i = 0; i < gridSize - 1; i++) {
        for (let j = 0; j < gridSize - 1; j++) {
            arr[i][j] *= 1 - rate;
        }
    }
}

function idxLimiter(idx) {
    if (idx < 0) {
        idx = 0;
    }
    if (idx > gridSize - 2) {
        idx = gridSize - 2;
    }
    return idx;
}

function locLimiter(loc) {
    if (loc > cellSize * gridSize) {
        loc = cellSize * gridSize;
    }
    if (loc < 0) {
        loc = 0;
    }
    return loc;
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

function advect(arr, arr_n) {
    for ( let i=1; i < gridSize - 1; i++ ) {
        for ( let j=1; j < gridSize - 1; j++ ) {
            let advX = cellCenter[i][j][0] - vx[i][j] * dt;
            let advY = cellCenter[i][j][1] - vy[i][j] * dt;
            //Subtracting cellSize/2 puts the interpolation on the correct cells
            advX = locLimiter(advX);
            advY = locLimiter(advY);
            let xi = Math.floor((advX - cellSize / 2) / cellSize);
            let yi = Math.floor((advY - cellSize / 2) / cellSize);
            xi = idxLimiter(xi);
            yi = idxLimiter(yi);
            // If it needs the limiter, maybe reduce the resulting advection
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

function setBoundary(arr, isVx = false, isVy = false) {
    let idxLast = gridSize - 1;
    let vxSign = 1;
    let vySign = 1;
    if (isVx) {
        vxSign = 0;
    }
    if (isVy) {
        vySign = 0;
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

function stepVel() {
    diffuse(vx, vx_n, visc, true, false);
    diffuse(vy, vy_n, visc, false, true);
    project(vx, vy);
    setBoundary(vx, true, false);
    setBoundary(vy, false, true);
    
    advect(vx, vx_n);
    advect(vy, vy_n);
    project(vx, vy);
    setBoundary(vx, true, false);
    setBoundary(vy, false, true);
}

function stepDye() {
    diffuse(dye, dye_n, diff);
    setBoundary(dye);
    advect(dye, dye_n);
    setBoundary(dye);

    dissolve(dye, dissolveRate);
}



// TODO: Look for index of maximum velocity, that'll give a hint as to where the instability is starting

//Going to ditch the mouse controls for now, instead, one of the cells in the center will be a source of dye and velocity, switching to a random direction every ~2 seconds
//Event handler property. When the mouse is moved, it passes the event to the function expression below

onmousemove = function(event) {
    let leftBound = fluidCanvas.getBoundingClientRect().left;
    let topBound = fluidCanvas.getBoundingClientRect().top;
    if (event.clientX > leftBound && event.clientX < leftBound + gridSize * cellSize &&
        event.clientY > topBound && event.clientY < topBound + gridSize * cellSize) {
        let lastMousePosX = mousePosX;
        let lastMousePosY = mousePosY;
        mousePosX = event.clientX - leftBound;
        mousePosY = event.clientY - topBound;
        let xIdx = Math.floor(mousePosX / cellSize);
        let yIdx = Math.floor(mousePosY / cellSize);
        let dx = mousePosX - lastMousePosX;
        let dy = mousePosY - lastMousePosY;
        addDye(xIdx, yIdx, 1000);
        setVelocity(xIdx, yIdx, dx, dy);
    }
}