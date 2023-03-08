class Particle {
    constructor(gridSize, cellSize) {
        this.x = Math.random() * gridSize * cellSize;
        this.y = Math.random() * gridSize * cellSize;
        this.utils = new Utils(gridSize, cellSize);
    }

    drawParticle(fluidCtx) {
        fluidCtx.beginPath();
        fluidCtx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        fluidCtx.fillStyle = "blue";
        fluidCtx.fill();
        fluidCtx.stroke();
    }

    moveParticle(vx, vy, cellSize, dt) {
        let xi = Math.floor(this.x / cellSize);
        let yi = Math.floor(this.y / cellSize);
        xi = this.utils.idxLimiter(xi);
        yi = this.utils.idxLimiter(yi);
        this.x += vx[xi][yi] * dt;
        this.y += vy[xi][yi] * dt;
    }

    
}