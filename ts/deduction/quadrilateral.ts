namespace plane_ts {
//
export function makeQuadrilateralClassifier(points : Point[], reason : ParallelogramReason | RhombusReason ){
    let equalSideLengthSymbolsA : LengthSymbol[] | undefined;
    let equalSideLengthSymbolsB : LengthSymbol[] | undefined;

    let parallelLinesA : AbstractLine[] | undefined;
    let parallelLinesB : AbstractLine[] | undefined;

    let equalAnglesA : Angle[] | undefined;
    let equalAnglesB : Angle[] | undefined;

    let diagonalBisectionLengthSymbolsA : LengthSymbol[] | undefined;
    let diagonalBisectionLengthSymbolsB : LengthSymbol[] | undefined;

    equalSideLengthSymbolsA = findEqualLengthsByPointsPair([points[0], points[1]], [points[2], points[3]]);
    equalSideLengthSymbolsB = findEqualLengthsByPointsPair([points[1], points[2]], [points[3], points[0]]);

    parallelLinesA = getParallelLinesByPointsPair([points[0], points[1]], [points[2], points[3]]);
    parallelLinesB = getParallelLinesByPointsPair([points[1], points[2]], [points[3], points[0]]);

    equalAnglesA = findEqualAnglesBy3pointsPair([points[0], points[1], points[2]], [points[2], points[3], points[0]]);
    equalAnglesB = findEqualAnglesBy3pointsPair([points[1], points[2], points[3]], [points[3], points[0], points[1]]);

    diagonalBisectionLengthSymbolsA = undefined;
    diagonalBisectionLengthSymbolsB = undefined;

    const diagonalA = getCommonLineOfPoints(points[0], points[2]);
    const diagonalB = getCommonLineOfPoints(points[1], points[3]);
    if(diagonalA != undefined && diagonalB != undefined){
        const intersection = getCommonPointOfLines(diagonalA, diagonalB);
        if(intersection != undefined){
            diagonalBisectionLengthSymbolsA = findEqualLengthsByPointsPair([points[0], intersection], [points[2], intersection]);
            diagonalBisectionLengthSymbolsB = findEqualLengthsByPointsPair([points[1], intersection], [points[3], intersection]);
        }
    }

    const lines = range(4).map(i => getCommonLineOfPoints(points[i], points[(i + 1) % 4])) as AbstractLine[];
    if(lines.some(x => x == undefined)){
        throw new MyError();
    }

    const quadrilateral = new Quadrilateral({points, lines});

    switch(reason){
    case ParallelogramReason.each_opposite_sides_are_equal:
        if(equalSideLengthSymbolsA != undefined && equalSideLengthSymbolsB != undefined){
            return new ParallelogramClassifier({
                reason : reason,
                auxiliaryShapes : equalSideLengthSymbolsA.concat(equalSideLengthSymbolsB),
                shapes : [ quadrilateral ]
            });
        }
        break;

    case ParallelogramReason.each_opposite_sides_are_parallel:
        if(parallelLinesA != undefined && parallelLinesB != undefined){
            return new ParallelogramClassifier({
                reason : reason,
                auxiliaryShapes : parallelLinesA.concat(parallelLinesB),
                shapes : [ quadrilateral ]
            });
        }
        break;

    case ParallelogramReason.each_opposite_angles_are_equal:
        if(equalAnglesA != undefined && equalAnglesB != undefined){

            return new ParallelogramClassifier({
                reason : reason,
                auxiliaryShapes : equalAnglesA.concat(equalAnglesB),
                shapes : [ quadrilateral ]
            });
        }

    case ParallelogramReason.one_opposite_sides_are_parallel_and_equal:{
            let auxiliaryShapes : MathEntity[] = [];

            if(parallelLinesA != undefined && equalSideLengthSymbolsA != undefined){
                auxiliaryShapes.push(...parallelLinesA, ...equalSideLengthSymbolsA);
            }
            else if(parallelLinesB != undefined && equalSideLengthSymbolsB != undefined){

                auxiliaryShapes.push(...parallelLinesB, ...equalSideLengthSymbolsB);
            }
            else{
                break;
            }
            return new ParallelogramClassifier({
                reason,
                auxiliaryShapes,
                shapes : [ quadrilateral ]
            });
        }

    case ParallelogramReason.each_diagonal_bisections:
        if(diagonalBisectionLengthSymbolsA != undefined && diagonalBisectionLengthSymbolsB != undefined){
            return new ParallelogramClassifier({
                reason,
                auxiliaryShapes : diagonalBisectionLengthSymbolsA.concat(diagonalBisectionLengthSymbolsB),
                shapes : [ quadrilateral ]
            });
        }
        break;
    
    case RhombusReason.all_sides_are_equal:
        if(equalSideLengthSymbolsA != undefined && equalSideLengthSymbolsB != undefined){
            if(isEqualLength(equalSideLengthSymbolsA[0], equalSideLengthSymbolsB[0])){
                return new RhombusClassifier({
                    reason : reason,
                    auxiliaryShapes : equalSideLengthSymbolsA.concat(equalSideLengthSymbolsB),
                    shapes : [ quadrilateral ]
                });    
            }
        }
        break;
    
    }

    return undefined;
}

abstract class QuadrilateralClassifier extends Statement {
    shapeClass! : QuadrilateralClass;

    quadrilateral() : Quadrilateral {
        assert(this.selectedShapes.length == 1 && this.selectedShapes[0] instanceof Quadrilateral);
        return this.selectedShapes[0] as Quadrilateral;
    }

    isParallelogram() : boolean {
        return this.shapeClass == QuadrilateralClass.parallelogram || this.shapeClass == QuadrilateralClass.rhombus;
    }

    setRelations(): void {
        super.setRelations();

        parallelogramClassifiers.add(this);
    }
}

export class ParallelogramClassifier extends QuadrilateralClassifier {    
}

export class RhombusClassifier extends ParallelogramClassifier {    
}

}