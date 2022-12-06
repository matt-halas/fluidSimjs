const fluidCanvas=document.getElementById("fluidCanvas")

const gridSize=64;
const cellSize=8;

fluidCanvas.width=gridSize*cellSize;
fluidCanvas.height=gridSize*cellSize;

const fluidCtx=fluidCanvas.getContext("2d");

fluidCtx.fillStyle="rgb(200, 0, 0)"
fluidCtx.fillRect(10, 10, 50, 50)

function drawGrid(){
    for (let i=0; i<gridSize; i++){
        for (let j=0; j<gridSize; j++){
            fluidCtx.strokeStyle="white";
            fluidCtx.lineWidth=0.3;
            fluidCtx.strokeRect(i*cellSize, j*cellSize, cellSize, cellSize)
        }
    }
}

drawGrid()