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

function getParallelLinesByPointsPair(As : [Point, Point], Bs : [Point, Point]) : [AbstractLine, AbstractLine] | undefined {
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

export function makeEqualLength(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : LengthEquality | undefined {
    for(const map of congruentTriangles.values()){
        let idxA : number = -1;
        let idxB : number = -1;
        let triangleA : Triangle;
        let triangleB : Triangle;

        for(const triangle of map.values()){
            if(idxA == -1){
                idxA = triangle.lengthSymbolIndex(lengthSymbolA);
                triangleA = triangle;
            }
            if(idxB == -1){
                idxB = triangle.lengthSymbolIndex(lengthSymbolB);
                triangleB = triangle;
            }

            if(idxA != -1 && idxB != -1 && idxA == idxB){
                msg(`equal length:congruent triangles`);
                return new LengthEquality({
                    reason          : LengthEqualityReason.congruent_triangles,
                    auxiliaryShapes : [ triangleA!, triangleB! ],
                    shapes          : [ lengthSymbolA, lengthSymbolB ]
                });
            }
        }
    }


    const all_shapes = View.current.allRealShapes();
    const all_circle_arcs = all_shapes.filter(x => x instanceof CircleArc) as CircleArc[];

    const ABC = getCommonPoint(lengthSymbolA, lengthSymbolB);
    if(ABC != undefined){
        const [A, B, C] = ABC;

        const circle_arc_center_As = all_circle_arcs.filter(x => x.center == A);
        if(circle_arc_center_As.length != 0){

            const circle_arc_center_A_includes_B_C = circle_arc_center_As.find(x => x.includesPoint(B) && x.includesPoint(C));
            if(circle_arc_center_A_includes_B_C != undefined){
                // if A is the center of the circle which includes B and C

                msg(`common-circle`);
                return new LengthEquality({
                    reason : LengthEqualityReason.common_circle,
                    auxiliaryShapes : [ circle_arc_center_A_includes_B_C ],
                    shapes : [ lengthSymbolA, lengthSymbolB ]
                });
            }
        }
    }

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

    if(lengthSymbolA.circle != undefined && lengthSymbolB.circle != undefined){
        const circle = equalCircleArcs.find(x => x.has(lengthSymbolA.circle!) && x.has(lengthSymbolB.circle!) );
        if(circle != undefined){
            msg(`radii-equal`);
            return new LengthEquality({
                reason : LengthEqualityReason.radii_equal,
                auxiliaryShapes : [ lengthSymbolA.circle, lengthSymbolB.circle ],
                shapes : [ lengthSymbolA, lengthSymbolB ]                
            });
        }
    }

    const parallel_lines = findParallelLinesOfLengthSymbols(lengthSymbolA, lengthSymbolB);
    if(parallel_lines != undefined){
        msg(`parallel-lines`);
        return new LengthEquality({
            reason : LengthEqualityReason.parallel_lines,
            auxiliaryShapes : parallel_lines,
            shapes : [ lengthSymbolA, lengthSymbolB ]            
        });
    }

    msg(`can not make Equal-Length`)
    return undefined;
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
}

export function isEqualLength(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : boolean {
    if(lengthSymbolA == lengthSymbolB){
        return true;
    }

    return equalLengths.find(x => x.has(lengthSymbolA) && x.has(lengthSymbolB)) != undefined;
    
}

}