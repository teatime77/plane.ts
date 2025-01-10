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

export function makeEqualLengthByCongruentTriangles(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol, triangleA : Triangle, triangleB : Triangle) : LengthEquality{
    msg(`equal length:congruent triangles`);
    return new LengthEquality({
        reason          : LengthEqualityReason.congruent_triangles,
        auxiliaryShapes : [ triangleA!, triangleB! ],
        shapes          : [ lengthSymbolA, lengthSymbolB ]
    });
}

export function makeEqualLengthByCongruentTrianglesSub(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    const triangle_pairs = pairs<Triangle>(trianglePairSelector.triangleA!, trianglePairSelector.triangleB!);
    for(const [triangleA, triangleB] of triangle_pairs){

        const idxA = triangleA.lengthSymbolIndex(lengthSymbolA);
        const idxB = triangleB.lengthSymbolIndex(lengthSymbolB);

        if(idxA != -1 && idxB != -1 && idxA == idxB){
            return makeEqualLengthByCongruentTriangles(lengthSymbolA, lengthSymbolB, triangleA, triangleB);
        }
    }

    return undefined;
}

export function makeEqualLengthByRadiiEqual(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    if(lengthSymbolA.circle != undefined && lengthSymbolB.circle != undefined && areEqualCircleArcs(lengthSymbolA.circle, lengthSymbolB.circle)){
        msg(`radii-equal`);
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

            msg(`common-circle`);
            return new LengthEquality({
                reason : LengthEqualityReason.common_circle,
                auxiliaryShapes : [ circle ],
                shapes : [ lengthSymbolA, lengthSymbolB ]
            });
        }
    }

    return undefined;
}

export function makeEqualLengthByCircleByRadius(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    for(const [lengthSymbol1, lengthSymbol2] of [[lengthSymbolA, lengthSymbolB], [lengthSymbolB, lengthSymbolA]]){
        if((lengthSymbol1.circle instanceof ArcByLengthSymbol || lengthSymbol1.circle instanceof CircleByRadius) && lengthSymbol1.circle.lengthSymbol == lengthSymbol2){

            msg(`circle-by-radius`);
            return new LengthEquality({
                reason : LengthEqualityReason.circle_by_radius,
                auxiliaryShapes : [ lengthSymbol1.circle ],
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
        reason : LengthEqualityReason.parallel_lines,
        auxiliaryShapes : parallel_lines,
        shapes : [ lengthSymbolA, lengthSymbolB ]            
    });
}

export function makeEqualLengthByParallelLinesAuto(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    const parallel_lines = findParallelLinesOfLengthSymbols(lengthSymbolA, lengthSymbolB);
    if(parallel_lines != undefined){
        msg(`parallel-lines`);
        return new LengthEquality({
            reason : LengthEqualityReason.parallel_lines,
            auxiliaryShapes : parallel_lines,
            shapes : [ lengthSymbolA, lengthSymbolB ]            
        });
    }

    return undefined;
}

export function makeEqualLengthByParallelogramSides(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol, parallelogram : Quadrilateral) : LengthEquality | undefined {
    if(parallelogram.isParallelogram()){

        const points =  [lengthSymbolA.pointA, lengthSymbolA.pointB, lengthSymbolB.pointA, lengthSymbolB.pointB];
        if(areSetsEqual(parallelogram.points, points)){

            msg(`parallelogram-sides`);
            return new LengthEquality({
                reason : LengthEqualityReason.parallelogram_sides,
                auxiliaryShapes : [parallelogram],
                shapes : [ lengthSymbolA, lengthSymbolB ]            
            });
        }
    }

    return undefined;
}

export function makeEqualLengthByParallelogramDiagonalBisection(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol, parallelogram : Quadrilateral) : LengthEquality | undefined {
    if(parallelogram.isParallelogram()){
        const bisection_lengthSymbols = [parallelogram.diagonalBisectionLengthSymbolsA, parallelogram.diagonalBisectionLengthSymbolsB];
        if(bisection_lengthSymbols.some(x => x != undefined && areSetsEqual(x, [lengthSymbolA, lengthSymbolB]))){
            msg(`parallelogram-diagonal-bisection`);
            return new LengthEquality({
                reason : LengthEqualityReason.parallelogram_diagonal_bisection,
                auxiliaryShapes : [parallelogram],
                shapes : [ lengthSymbolA, lengthSymbolB ]            
            });
        }

    }

    return undefined;
}

function makeEqualLength(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    const all_shapes = View.current.allRealShapes();
    const all_circle_arcs = all_shapes.filter(x => x instanceof CircleArc) as CircleArc[];

    const points =  [lengthSymbolA.pointA, lengthSymbolA.pointB, lengthSymbolB.pointA, lengthSymbolB.pointB];
    const parallelograms = Array.from(quadrilaterals).filter(x => x.shapeClass == QuadrilateralClass.parallelogram || QuadrilateralClass.rhombus);
    {
        const parallelogram = parallelograms.find(x => areSetsEqual(points, x.points));
        if(parallelogram != undefined){
            msg(`parallelogram-sides`);
            return new LengthEquality({
                reason : LengthEqualityReason.parallelogram_sides,
                auxiliaryShapes : [parallelogram],
                shapes : [ lengthSymbolA, lengthSymbolB ]            
            });
        }
    }

    {
        const parallelogram = parallelograms.find(x => 
            x.diagonalBisectionLengthSymbolsA != undefined && areSetsEqual(x.diagonalBisectionLengthSymbolsA, [lengthSymbolA, lengthSymbolB]) ||
            x.diagonalBisectionLengthSymbolsB != undefined && areSetsEqual(x.diagonalBisectionLengthSymbolsB, [lengthSymbolA, lengthSymbolB])
        );
        if(parallelogram != undefined){
            msg(`parallelogram-diagonal-bisection`);
            return new LengthEquality({
                reason : LengthEqualityReason.parallelogram_diagonal_bisection,
                auxiliaryShapes : [parallelogram],
                shapes : [ lengthSymbolA, lengthSymbolB ]            
            });
        }
    }

    msg(`can not make Equal-Length`)
    return undefined;
}

export function showPrompt(text : string){
    const dlg = $dlg("help-dlg");
    $("help-msg").innerText = text;

    // dlg.remove();
    // document.body.append(dlg);

    dlg.show();
    setTimeout(()=>{
        dlg.close();
    }, 3000);
}

export class LengthEquality extends Statement {
    constructor(obj : { narration? : string, reason? : number, implication? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[], mathText? : string }){
        super(obj);
    }

    async asyncPlay(speech : i18n_ts.AbstractSpeech){
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
            }
            break;

        case LengthEqualityReason.parallel_lines:{
                const parallel_lines = this.auxiliaryShapes as AbstractLine[];
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByParallelLines(lengthSymbolA, lengthSymbolB, parallel_lines);
                linesSelector_2.clear();
            }
            break;

        case LengthEqualityReason.circle_by_radius:{
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByCircleByRadius(lengthSymbolA, lengthSymbolB);
            }
            break;

        case LengthEqualityReason.congruent_triangles:{
                const [ triangleA, triangleB ] = this.auxiliaryShapes as Triangle[];
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByCongruentTriangles(lengthSymbolA, lengthSymbolB, triangleA, triangleB);
            }
            break;

        case LengthEqualityReason.parallelogram_sides:{
                const parallelogram = this.auxiliaryShapes[0] as Quadrilateral;
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByParallelogramSides(lengthSymbolA, lengthSymbolB, parallelogram);
            }
            break;

        case LengthEqualityReason.parallelogram_diagonal_bisection:
            quadrilateralSelector.clear();{
                const parallelogram = this.auxiliaryShapes[0] as Quadrilateral;
                const [lengthSymbolA, lengthSymbolB] = this.selectedShapes as LengthSymbol[];
                lengthEquality = makeEqualLengthByParallelogramDiagonalBisection(lengthSymbolA, lengthSymbolB, parallelogram);
            }
            break;

        default:
            throw new MyError();
        }

        const reason_str = enumToStr(LengthEqualityReason, this.reason);
        if(lengthEquality == undefined){
            msg(`can not make Length-Equality: ${reason_str}`)
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