class Particle {
    constructor(gridSize, cellSize) {
        this.x = Math.random() * gridSize * cellSize;
        this.y = Math.random() * gridSize * cellSize;
    }

    drawParticle(fluidCtx) {
        fluidCtx.beginPath();
        fluidCtx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        fluidCtx.fillStyle = "blue";
        fluidCtx.fill();
        fluidCtx.stroke();
    }

    moveParticle(vx, vy, cellSize, dt) {
        let xIdx = Math.floor(this.x / cellSize);
        let yIdx = Math.floor(this.y / cellSize);
        this.x += vx[xIdx][yIdx] * dt;
        this.y += vy[xIdx][yIdx] * dt;
    }
}