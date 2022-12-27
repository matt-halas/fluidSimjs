const fluidCanvas=document.getElementById("fluidCanvas")

const gridSize=64;
const cellSize=8;

const utils = new Utils(gridSize, cellSize);

const visc = 0.0001;
const diff = 0.0000001;
const dt = 1;
const dissolveRate = 0.01;

fluidCanvas.width=gridSize*cellSize;
fluidCanvas.height=gridSize*cellSize;

const fluidCtx=fluidCanvas.getContext("2d");

let dye = utils.createArray();
let dye_n = utils.createArray();
let vx = utils.createArray();
let vx_n = utils.createArray();
let vy = utils.createArray();
let vy_n = utils.createArray();
let cellCenter = utils.populateCellCenter();

animate();

function addDye(xIdx, yIdx, densityAmount = 100) {
    dye[xIdx][yIdx] += densityAmount;
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

function advect(arr, arr_n) {
    for ( let i=1; i < gridSize - 1; i++ ) {
        for ( let j=1; j < gridSize - 1; j++ ) {
            let cellX = cellCenter[i][j][0];
            let cellY = cellCenter[i][j][1];
            let advX = cellX - vx[i][j] * dt;
            let advY = cellY - vy[i][j] * dt;
            let xi = Math.floor(advX / cellSize);
            let yi = Math.floor(advY / cellSize);
            let interpX1 = utils.linearInterp(cellCenter[xi][yi][0],
                cellCenter[xi+1][yi][0], advX, arr[xi][yi], arr[xi+1][yi]);
            let interpX2 = utils.linearInterp(cellCenter[xi][yi+1][0],
                cellCenter[xi+1][yi+1][0], advX, arr[xi][yi+1], arr[xi+1][yi+1]);
            arr_n[i][j] = utils.linearInterp(cellCenter[xi][yi][1],
                cellCenter[xi][yi+1][1], advY, interpX1, interpX2);
        }
    }
}

function addVelocity(arr, amount) {
    for ( let i=0; i<gridSize; i++ ) {
        for ( let j=0; j<gridSize; j++ ) {
            arr[i][j] += amount;
        }
    }
}

function animate() {
    addDye(32, 32, 255);
    diffuse(dye, dye_n, diff);
    dye = dye_n;
    advect(dye, dye_n);
    drawDensity();
    dye = dye_n;
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
