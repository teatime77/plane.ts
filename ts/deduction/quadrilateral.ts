namespace plane_ts {
//
export function makeQuadrilateralClassifier(points : Point[], reason : ParallelogramReason | RhombusReason ) : ParallelogramClassifier | RhombusClassifier | undefined{
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
            let auxiliaryShapes : MathEntity[];

            if(parallelLinesA != undefined && equalSideLengthSymbolsA != undefined){
                assert(range(2).every(i => parallelLinesA[i] == equalSideLengthSymbolsA[i].line));

                auxiliaryShapes = equalSideLengthSymbolsA;
            }
            else if(parallelLinesB != undefined && equalSideLengthSymbolsB != undefined){
                assert(range(2).every(i => parallelLinesB[i] == equalSideLengthSymbolsB[i].line));

                auxiliaryShapes = equalSideLengthSymbolsB;
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

export abstract class TriangleQuadrilateralDetector extends Statement {
    shapeClass! : TriangleQuadrilateralClass;
}

abstract class QuadrilateralClassifier extends TriangleQuadrilateralDetector {
    quadrilateral() : Quadrilateral {
        assert(this.selectedShapes.length == 1 && this.selectedShapes[0] instanceof Quadrilateral);
        return this.selectedShapes[0] as Quadrilateral;
    }

    isParallelogram() : boolean {
        return this.shapeClass == TriangleQuadrilateralClass.parallelogram || this.shapeClass == TriangleQuadrilateralClass.rhombus;
    }

    setRelations(): void {
        super.setRelations();

        parallelogramClassifiers.add(this);
    }

    draw() : void {
        assert(this.selectedShapes.length == 1 && this.selectedShapes[0] instanceof Quadrilateral);
        const quadrilateral = this.selectedShapes[0] as Quadrilateral;

        const shapes = this.auxiliaryShapes.filter(x => x.mode != Mode.none) as Shape[];
        for(const shape of shapes){
            let p1 : Point;
            let p2 : Point;

            if(shape instanceof LengthSymbol){

                [p1, p2] = [ shape.pointA, shape.pointB ];
            }
            else if(shape instanceof AbstractLine){
                const line = shape;

                const idx = quadrilateral.lines.indexOf(line);
                if(idx == -1){
                    msg(`Quadrilateral-Classifier error:${this.id} shape:${shape.id}:${shape.constructor.name}`);
                    continue;
                }
                assert(idx != -1);
                [p1, p2] = [quadrilateral.points[idx], quadrilateral.points[(idx + 1) % quadrilateral.points.length]];
            }
            else{
                shape.draw();
                continue;
            }

            const color = shape.modeColor();
            const line_width = shape.modeLineWidth();
            View.current.canvas.drawLineRaw(p1.position, p2.position, color, line_width);
        }
    }
}

export class ParallelogramClassifier extends QuadrilateralClassifier {   
    async showAuxiliaryShapes(){

        switch(this.reason){
        case ParallelogramReason.each_opposite_sides_are_equal:
        case ParallelogramReason.each_opposite_sides_are_parallel:
        case ParallelogramReason.each_opposite_angles_are_equal:
        case ParallelogramReason.each_diagonal_bisections:
            assert(this.auxiliaryShapes.length == 4);

            for(const shape of this.auxiliaryShapes.slice(0, 2)){
                shape.setMode(Mode.depend1);
            }
            await sleep(500);

            for(const shape of this.auxiliaryShapes.slice(2)){
                shape.setMode(Mode.depend2);
            }
            break;

        case ParallelogramReason.one_opposite_sides_are_parallel_and_equal:
        case RhombusReason.all_sides_are_equal:
            this.auxiliaryShapes.forEach(x => x.setMode(Mode.depend));
            break;

        default:
            throw new MyError();
        }

        await sleep(500);
    } 

    reading(): Reading {
        return this.textReading(TT("this is a parallelogram."));
    }
}

export class RhombusClassifier extends ParallelogramClassifier {    
    reading(): Reading {
        return this.textReading(TT("this is a rhombus."));
    }
}

}