namespace plane_ts {
//
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

function findParallelLinesOfLengthSymbols(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : [AbstractLine, AbstractLine] | undefined{
    const As = [lengthSymbolA.pointA, lengthSymbolA.pointB];
    const Bs = [lengthSymbolB.pointA, lengthSymbolB.pointB];

    for(const line_set_pair of perpendicularPairs){
        for(const [lines1, lines2] of pairs(line_set_pair[0], line_set_pair[1])){
            const lineA = getLineFromPoints(list(lines1), As[0], As[1]);
            if(lineA == undefined){
                continue;
            }

            const lineB = getLineFromPoints(list(lines1), Bs[0], Bs[1]);
            if(lineB == undefined){
                continue;
            }

            for(const [i, j] of [[0, 1], [1, 0]]){
                const A0Bi = getLineFromPoints(list(lines2), As[0], Bs[i]);
                if(A0Bi == undefined){
                    continue
                }

                const A1Bj = getLineFromPoints(list(lines2), As[1], Bs[j]);
                if(A1Bj == undefined){
                    continue
                }

                return [A0Bi, A1Bj];
            }
        }
    }

    return undefined;
}

export function makeEqualLength(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : EqualLength | undefined {
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
                return new EqualLength({
                    reason : EqualLengthReason.common_circle,
                    auxiliary_shapes : [ circle_arc_center_A_includes_B_C ],
                    shapes : [ lengthSymbolA, lengthSymbolB ]
                });
            }
        }
    }

    if(lengthSymbolA.circle != undefined && lengthSymbolB.circle != undefined){
        const circle = equalCircleArcs.find(x => x.has(lengthSymbolA.circle!) && x.has(lengthSymbolB.circle!) );
        if(circle != undefined){
            msg(`radii-equal`);
            return new EqualLength({
                reason : EqualLengthReason.radii_equal,
                auxiliary_shapes : [ lengthSymbolA.circle, lengthSymbolB.circle ],
                shapes : [ lengthSymbolA, lengthSymbolB ]                
            });
        }
    }

    const parallel_lines = findParallelLinesOfLengthSymbols(lengthSymbolA, lengthSymbolB);
    if(parallel_lines != undefined){
        msg(`parallel-lines`);
        return new EqualLength({
            reason : EqualLengthReason.parallel_lines,
            auxiliary_shapes : parallel_lines,
            shapes : [ lengthSymbolA, lengthSymbolB ]            
        });
    }

    msg(`can not make Equal-Length`)
    return undefined;
}

export class EqualLength extends Statement {
    constructor(obj : { narration? : string, reason? : number, implication? : number, auxiliary_shapes? : MathEntity[], shapes : MathEntity[], mathText? : string }){
        super(obj);
    }

    async asyncPlay(speech : i18n_ts.AbstractSpeech){
    }
}

}