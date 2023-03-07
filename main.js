import {advect} from './solverFunctions.js';
import {project} from './solverFunctions.js';
import {diffuse} from './solverFunctions.js';
import {setBoundary} from './solverFunctions.js';
import {dissolve} from './solverFunctions.js';

const fluidCanvas=document.getElementById("fluidCanvas");

const gridSize=64;
const cellSize=512 / gridSize;

const utils = new Utils(gridSize, cellSize);
var particle = new Particle(gridSize, cellSize);

let particles = [];
const numParticles = 20;
for (let i=0; i<numParticles; i++) {
    particles.push(new Particle(gridSize, cellSize));
}

let visc = 0.000000001;
let diff = 0.0000000001;
const dt = 0.01;
let dissolveRate = 0.001;

fluidCanvas.width=gridSize*cellSize;
fluidCanvas.height=gridSize*cellSize;

const fluidCtx=fluidCanvas.getContext("2d");
let viscSlider = document.getElementById("viscRange");
let diffSlider = document.getElementById("diffRange");
let dissolveSlider = document.getElementById("dissolveRange")

let dye = utils.createArray();
let dye_n = utils.createArray();
let vx = utils.createArray();
let vx_n = utils.createArray();
let vy = utils.createArray();
let vy_n = utils.createArray();

let mousePosX = 0;
let mousePosY = 0;

animate();

function animate() {
    readSliders();
    stepVel();
    stepDye();
    drawDensity();
    stepParticles();
    requestAnimationFrame(animate);
}

function stepParticles() {
    for (let i=0; i<numParticles; i++) {
        particles[i].drawParticle(fluidCtx);
        particles[i].moveParticle(vx, vy, cellSize, dt);
    }
}

function addDye(xIdx, yIdx, densityAmount) {
    dye[xIdx][yIdx] += densityAmount;
}

function setVelocity(xIdx, yIdx, dx, dy) {
    vx[xIdx][yIdx] += dx * 1000;
    vy[xIdx][yIdx] += dy * 1000;
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

function stepVel() {
    diffuse(vx, vx_n, visc, true, false);
    diffuse(vy, vy_n, visc, false, true);
    project(vx, vy);
    setBoundary(vx, true, false);
    setBoundary(vy, false, true);
    
    advect(vx, vx_n, vx, vy);
    advect(vy, vy_n, vx, vy);
    project(vx, vy);
    setBoundary(vx, true, false);
    setBoundary(vy, false, true);
}

function stepDye() {
    diffuse(dye, dye_n, diff);
    setBoundary(dye);
    advect(dye, dye_n, vx, vy);
    setBoundary(dye);

    dissolve(dye, dissolveRate);
}

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