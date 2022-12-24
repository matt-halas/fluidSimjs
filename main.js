const fluidCanvas=document.getElementById("fluidCanvas")

const gridSize=64;
const cellSize=8;

const utils = new Utils(gridSize, cellSize);

const visc = 0.0001;
const diff = 0.0001;
const dt = 0.1;
const dissolveRate = 0.01;

fluidCanvas.width=gridSize*cellSize;
fluidCanvas.height=gridSize*cellSize;

const fluidCtx=fluidCanvas.getContext("2d");

let dye = utils.createArray();
let dye_n = utils.createArray();
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

function animate() {
    addDye(32, 32, 255);
    diffuse(dye, dye_n, diff);
    dye = dye_n;
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
