class Utils {
    constructor(gridSize, cellSize){
        this.gridSize = gridSize;
        this.cellSize = cellSize;
    }

    createArray() {
        let arr = [];
        for ( let i=0; i<this.gridSize; i++ ) {
            let row = [];
            for ( let j=0; j<this.gridSize; j++ ) {
                row.push(0);
            }
            arr.push(row);
        }
        return arr;
    }
    
    populateCellCenter() {
        let cellCenters = [];
        for (let i = 0; i < this.gridSize; i++) {
            let dummy = [];
            for (let j = 0; j < this.gridSize; j++) {
                let dummy_filler = [];
                for (let k = 0; k < 2; k++) {
                    dummy_filler.push(0);
                }
                dummy.push(dummy_filler);
            }
            cellCenters.push(dummy);
        }
        let centers = [];
        for (let i = 0; i < this.gridSize; i++) {centers.push((0.5 + i) * this.cellSize)}
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                cellCenters[i][j] = [centers[i], centers[j]];
            }
        }
        return cellCenters;
    }    
}
