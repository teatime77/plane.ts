namespace plane_ts {
//

export class Quadrilateral extends Polygon {
    shapeClass! : QuadrilateralClass;

    equalSideLengthSymbolsA : LengthSymbol[] | undefined;
    equalSideLengthSymbolsB : LengthSymbol[] | undefined;

    parallelLinesA : AbstractLine[] | undefined;
    parallelLinesB : AbstractLine[] | undefined;

    equalAnglesA : Angle[] | undefined;
    equalAnglesB : Angle[] | undefined;

    diagonalBisectionLengthSymbolsA : LengthSymbol[] | undefined;
    diagonalBisectionLengthSymbolsB : LengthSymbol[] | undefined;

    isParallelogram() : boolean {
        return this.shapeClass == QuadrilateralClass.parallelogram || this.shapeClass == QuadrilateralClass.rhombus;
    }

    calc(){
        const points = this.points;
    
        this.equalSideLengthSymbolsA = findEqualLengthsByPointsPair([points[0], points[1]], [points[2], points[3]]);
        this.equalSideLengthSymbolsB = findEqualLengthsByPointsPair([points[1], points[2]], [points[3], points[0]]);

        this.parallelLinesA = getParallelLinesByPointsPair([points[0], points[1]], [points[2], points[3]]);
        this.parallelLinesB = getParallelLinesByPointsPair([points[1], points[2]], [points[3], points[0]]);
    
        this.equalAnglesA = findEqualAnglesBy3pointsPair([points[0], points[1], points[2]], [points[2], points[3], points[0]]);
        this.equalAnglesB = findEqualAnglesBy3pointsPair([points[1], points[2], points[3]], [points[3], points[0], points[1]]);
    
        this.diagonalBisectionLengthSymbolsA = undefined;
        this.diagonalBisectionLengthSymbolsB = undefined;

        const diagonalA = getCommonLineOfPoints(points[0], points[2]);
        const diagonalB = getCommonLineOfPoints(points[1], points[3]);
        if(diagonalA != undefined && diagonalB != undefined){
            const intersection = getCommonPointOfLines(diagonalA, diagonalB);
            if(intersection != undefined){
                this.diagonalBisectionLengthSymbolsA = findEqualLengthsByPointsPair([points[0], intersection], [points[2], intersection]);
                this.diagonalBisectionLengthSymbolsB = findEqualLengthsByPointsPair([points[1], intersection], [points[3], intersection]);
            }
        }

        this.setShapeClass();
    }

    setShapeClass(){
        this.shapeClass = QuadrilateralClass.none;

        if(this.equalSideLengthSymbolsA != undefined && this.equalSideLengthSymbolsB != undefined){
            if(isEqualLength(this.equalSideLengthSymbolsA[0], this.equalSideLengthSymbolsB[0])){

                this.shapeClass = QuadrilateralClass.rhombus;
            }
            else{

                this.shapeClass = QuadrilateralClass.parallelogram;
            }

            return;
        }

        if(this.parallelLinesA != undefined || this.parallelLinesB != undefined){
    
            if(this.parallelLinesA != undefined && (this.parallelLinesB != undefined || this.equalSideLengthSymbolsA != undefined) ||
               this.parallelLinesB != undefined && this.equalSideLengthSymbolsB != undefined  ){

                this.shapeClass = QuadrilateralClass.parallelogram;
                return;
            }
            else{

                this.shapeClass = QuadrilateralClass.trapezoid;
            }
        }

        if(this.equalAnglesA != undefined || this.equalAnglesB != undefined){
            this.shapeClass = QuadrilateralClass.parallelogram;
        }
        else if(this.diagonalBisectionLengthSymbolsA != undefined || this.diagonalBisectionLengthSymbolsA != undefined){
            this.shapeClass = QuadrilateralClass.parallelogram;
        }
    }

    setRelations(): void {
        super.setRelations();

        quadrilaterals.add(this);
    }
}

}