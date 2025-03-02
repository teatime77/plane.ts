namespace plane_ts {
//
export function addEqualLengths(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol){
    let set = equalLengths.find(x => x.has(lengthSymbolA) || x.has(lengthSymbolB));
    if(set == undefined){
        set = new Set<LengthSymbol>([ lengthSymbolA, lengthSymbolB ]);
        equalLengths.push(set);
    }
    else{
        set.add(lengthSymbolA);
        set.add(lengthSymbolB);
    }
}

function getCommonPoint(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : [Point, Point, Point] | undefined {
    const [AA, AB] = [ lengthSymbolA.pointA, lengthSymbolA.pointB ];
    const [BA, BB] = [ lengthSymbolB.pointA, lengthSymbolB.pointB ];

    if(AA == BA){
        return [ AA, AB, BB ];
    }
    else if(AA == BB){
        return [ AA, AB, BA ];        
    }
    else if(AB == BA){
        return [ AB, AA, BB ];
    }
    else if(AB == BB){
        return [ AB, AA, BA ];        
    }
    else{
        return undefined;
    }
}

export function getParallelLinesByPointsPair(As : [Point, Point], Bs : [Point, Point]) : [AbstractLine, AbstractLine] | undefined {
    const lineA = getCommonLineOfPoints(As[0], As[1]);
    const lineB = getCommonLineOfPoints(Bs[0], Bs[1]);
    if(lineA == undefined || lineB == undefined){
        return undefined;
    }

    if(isParallel(lineA, lineB)){
        return [lineA, lineB];
    }
    else{
        return undefined;
    }
}

function findParallelLinesOfLengthSymbols(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : [AbstractLine, AbstractLine] | undefined{
    const As : [Point, Point] = [lengthSymbolA.pointA, lengthSymbolA.pointB];
    const Bs : [Point, Point] = [lengthSymbolB.pointA, lengthSymbolB.pointB];

    const line_pair1 = getParallelLinesByPointsPair(As, Bs);
    if(line_pair1 == undefined){
        return undefined;
    }
    
    for(const idx of [0, 1]){        
        let Cs : [Point, Point];
        let Ds : [Point, Point];

        if(idx == 0){
            Cs = [As[0], Bs[0]];
            Ds = [As[1], Bs[1]];
        }
        else{
            Cs = [As[0], Bs[1]];
            Ds = [As[1], Bs[0]];
        }

        const line_pair2 = getParallelLinesByPointsPair(Cs, Ds);
        if(line_pair2 != undefined){
            return line_pair2;
        }
    }

    return undefined;
}

function findTrianglePairByLengthSymbols(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol, triangles_list : Triangle[][]) : [Triangle, Triangle] | undefined {
    for(const triangles of triangles_list){
        const trianglesA = getTrianglesByLengthSymbol(lengthSymbolA, triangles);
        if(trianglesA.length == 0){
            continue;
        }

        const trianglesB = getTrianglesByLengthSymbol(lengthSymbolB, triangles);
        if(trianglesB.length == 0){
            continue;
        }

        for(const triangleA of trianglesA){
            const idxA = triangleA.lines.indexOf(lengthSymbolA.line!);
            assert(idxA != -1);

            for(const triangleB of trianglesB){
                const idxB = triangleB.lines.indexOf(lengthSymbolB.line!);
                assert(idxB != -1);

                if(idxA == idxB){

                    return [triangleA, triangleB];

                }
                else{
                    msg(`make Angle Equality By Congruent Triangles : idx-A:${idxA} != idx-B:${idxB}`);
                }
            }
        }
    }

}

export function makeEqualLengthByCongruentTriangles(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    const triangleAB = findTrianglePairByLengthSymbols(lengthSymbolA, lengthSymbolB, congruentTriangles);
    if(triangleAB != undefined){
        const [triangleA, triangleB] = triangleAB;

        // msg(`equal length:congruent triangles`);
        return new LengthEquality({
            reason          : LengthEqualityReason.congruent_triangles,
            auxiliaryShapes : [ triangleA, triangleB ],
            shapes          : [ lengthSymbolA, lengthSymbolB ]
        });
    }
    else{

        msg(`can not find congruent triangles`);

        return undefined;
    }
}

export function makeEqualLengthByRadiiEqual(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    if(lengthSymbolA.circle != undefined && lengthSymbolB.circle != undefined && areEqualCircleArcs(lengthSymbolA.circle, lengthSymbolB.circle)){
        // msg(`radii-equal`);
        return new LengthEquality({
            reason : LengthEqualityReason.radii_equal,
            auxiliaryShapes : [ lengthSymbolA.circle, lengthSymbolB.circle ],
            shapes : [ lengthSymbolA, lengthSymbolB ]                
        });
    }

    return undefined;
}

export function makeEqualLengthByCommonCircle(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol, circle : CircleArc) : LengthEquality | undefined {
    const ABC = getCommonPoint(lengthSymbolA, lengthSymbolB);
    if(ABC != undefined){
        const [A, B, C] = ABC;

        if(circle.center == A && circle.includesPoint(B) && circle.includesPoint(C)){

            // msg(`common-circle`);
            return new LengthEquality({
                reason : LengthEqualityReason.common_circle,
                auxiliaryShapes : [ circle ],
                shapes : [ lengthSymbolA, lengthSymbolB ]
            });
        }
    }

    return undefined;
}

export function makeEqualLengthByParallelLines(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol, parallel_lines : AbstractLine[]) : LengthEquality | undefined {
    if(!isParallel(parallel_lines[0], parallel_lines[1])){
        return undefined;
    }

    if(lengthSymbolA.line != undefined && lengthSymbolB.line != undefined && isParallel(lengthSymbolA.line, lengthSymbolB.line)){
    }
    else{
        return undefined;
    }

    const [line1, line2] = parallel_lines;
    for(const lengthSymbol of [lengthSymbolA, lengthSymbolB] ){
        const [A, B] = [ lengthSymbol.pointA, lengthSymbol.pointB ];
        if(line1.includesPoint(A) && line2.includesPoint(B) || line1.includesPoint(B) && line2.includesPoint(A)){        
            continue;    
        }

        return undefined;
    }

    msg(`parallel-lines`);
    return new LengthEquality({
        reason : LengthEqualityReason.parallel_lines_distance,
        auxiliaryShapes : parallel_lines,
        shapes : [ lengthSymbolA, lengthSymbolB ]            
    });
}

export function makeEqualLengthByParallelLinesAuto(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    const parallel_lines = findParallelLinesOfLengthSymbols(lengthSymbolA, lengthSymbolB);
    if(parallel_lines != undefined){
        msg(`parallel-lines`);
        return new LengthEquality({
            reason : LengthEqualityReason.parallel_lines_distance,
            auxiliaryShapes : parallel_lines,
            shapes : [ lengthSymbolA, lengthSymbolB ]            
        });
    }

    return undefined;
}

export function makeEqualLengthByParallelogramOppositeSides(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    let points = [ lengthSymbolA.pointA, lengthSymbolA.pointB, lengthSymbolB.pointA, lengthSymbolB.pointB];
    points = toClockwisePoints(points);

    const parallelogramClassifier =  getParallelogramClassifier(points);
    if(parallelogramClassifier == undefined){
        msg(`no parallelogram`);
        return undefined;
    }

    const parallelogram = new Quadrilateral({
        points,
        lines : []
    });

    // msg(`parallelogram-sides`);
    return new LengthEquality({
        reason : LengthEqualityReason.parallelogram_opposite_sides,
        auxiliaryShapes : [parallelogram],
        shapes : [ lengthSymbolA, lengthSymbolB ]            
    });
}

export function makeEqualLengthByParallelogramDiagonalBisection(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    const parallelograms = getParallelogramsByDiagonalLengthSymbols(lengthSymbolA, lengthSymbolB);
    for(const parallelogram of parallelograms){
        const diagonal_intersection = parallelogram.diagonalIntersection();
        if(diagonal_intersection != undefined){
            let lengthSymbol_points_pair = [lengthSymbolA.points(), lengthSymbolB.points()];
            if(lengthSymbol_points_pair.every(x => x.includes(diagonal_intersection))){

                let lengthSymbol_vertices = lengthSymbol_points_pair.map(x=> x[0] == diagonal_intersection ? x[1] : x[0]);

                if(areSetsEqual(lengthSymbol_vertices, [parallelogram.points[0], parallelogram.points[2]]) ||
                   areSetsEqual(lengthSymbol_vertices, [parallelogram.points[1], parallelogram.points[3]]) ){

                    msg(`parallelogram-diagonal-bisection`);
                    return new LengthEquality({
                        reason : LengthEqualityReason.parallelogram_diagonal_bisection,
                        auxiliaryShapes : [parallelogram],
                        shapes : [ lengthSymbolA, lengthSymbolB ]            
                    });
                }
            }
        }
    }

    return undefined;
}

export function makeEqualLengthByEquivalenceClass(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    if(lengthSymbolA.isEqual(lengthSymbolB)){
        return new LengthEquality({
            reason : LengthEqualityReason.equivalence_class,
            shapes : [ lengthSymbolA, lengthSymbolB ]                
        });
    }

    return undefined;
}


export function showPrompt(text : string){
    const dlg = $dlg("help-dlg");
    $("help-msg").innerText = text;

    // dlg.remove();
    // document.body.append(dlg);

    dlg.show();
    const timeout = (Plane.one.playMode == PlayMode.fastForward ? 50 : 3000);
    setTimeout(()=>{
        dlg.close();
    }, timeout);
}

export class LengthEquality extends Statement {
    constructor(obj : { reason? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[], mathText? : string }){
        super(obj);

        LengthSymbol.setEqualLengthKinds(this.selectedShapes as LengthSymbol[]);
    }

    reading(): Reading {
        return this.textReading(TT("the two length symbols are of equal length."));
    }

    setRelations(): void {
        super.setRelations();

        const [ lengthSymbolA, lengthSymbolB ] = this.selectedShapes as LengthSymbol[];
        addEqualLengths(lengthSymbolA, lengthSymbolB);
    }

    verify() : LengthEquality | undefined {
        let lengthEquality : LengthEquality | undefined;
        switch(this.reason){
        case LengthEqualityReason.radii_equal:{
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];

                lengthEquality = makeEqualLengthByRadiiEqual(lengthSymbolA, lengthSymbolB);
            }
            break;

        case LengthEqualityReason.common_circle:{
                const circle = this.auxiliaryShapes[0] as Circle;
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByCommonCircle(lengthSymbolA, lengthSymbolB, circle);
                if(lengthEquality == undefined){
                    lengthEquality = makeEqualLengthByCommonCircle(lengthSymbolA, lengthSymbolB, circle);
                }
            }
            break;

        case LengthEqualityReason.parallel_lines_distance:{
                const parallel_lines = this.auxiliaryShapes as AbstractLine[];
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByParallelLines(lengthSymbolA, lengthSymbolB, parallel_lines);
                linesSelector_2.clear();
            }
            break;

        case LengthEqualityReason.congruent_triangles:{
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByCongruentTriangles(lengthSymbolA, lengthSymbolB);
            }
            break;

        case LengthEqualityReason.parallelogram_opposite_sides:{
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByParallelogramOppositeSides(lengthSymbolA, lengthSymbolB);
            }
            break;

        case LengthEqualityReason.parallelogram_diagonal_bisection:{
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByParallelogramDiagonalBisection(lengthSymbolA, lengthSymbolB);
            }
            break;

        case LengthEqualityReason.equivalence_class:{
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByEquivalenceClass(lengthSymbolA, lengthSymbolB);
            }
            break;

        case LengthEqualityReason.midpoint:

        case LengthEqualityReason.not_used:
        default:
            throw new MyError();
        }

        const reason_str = reasonMsg(this.reason);
        if(lengthEquality == undefined){
            throw new MyError(`can not make Length-Equality: ${reason_str}`)
        }
        else{

            msg(`make Length-Equality OK: ${reason_str}`)
        }

        return lengthEquality;
    }
}

export function isEqualLength(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : boolean {
    if(lengthSymbolA == lengthSymbolB){
        return true;
    }

    return equalLengths.find(x => x.has(lengthSymbolA) && x.has(lengthSymbolB)) != undefined;
}

}