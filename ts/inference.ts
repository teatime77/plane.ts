///<reference path="statement.ts" />

namespace plane_ts {
//
export let perpendicularPairs : [Set<AbstractLine>, Set<AbstractLine>][] = [];
export const centerOfCircleArcs = new Map<Point,Set<CircleArc>>();
export const pointOnCircleArcs = new Map<Point,Set<CircleArc>>();
export const pointOnLines = new Map<Point,Set<AbstractLine>>();
export let equalCircleArcs : Set<CircleArc>[] = [];

function addSetMap<T, V>(a : T, b : V, map:Map<T, Set<V>>){
    let set = map.get(a);
    if(set == undefined){
        set = new Set<V>();
        map.set(a, set);
    }
    set.add(b);
}

export function initRelations(){
    perpendicularPairs = [];
    centerOfCircleArcs.clear();
    pointOnCircleArcs.clear();
    pointOnLines.clear();
    equalCircleArcs = [];
}

export function recalcRelations(view : View){
    initRelations();
    view.shapes.forEach(x => x.setRelations());
}

export function addCenterOfCircleArcs(point : Point, circle : CircleArc){
    addSetMap<Point,CircleArc>(point, circle, centerOfCircleArcs);
    assert(centerOfCircleArcs.get(point) != undefined);
}

export function addPointOnCircleArcs(point : Point, circle : CircleArc){
    addSetMap<Point,CircleArc>(point, circle, pointOnCircleArcs);
    assert(pointOnCircleArcs.get(point) != undefined);
}

export function addPointOnLines(point : Point, line : AbstractLine){
    addSetMap<Point,AbstractLine>(point, line, pointOnLines);
    assert(pointOnLines.get(point) != undefined);
}

export function addPerpendicularPairs(line1 : AbstractLine, line2 : AbstractLine){
    if(perpendicularPairs.some(x => x[0].has(line1) && x[1].has(line2) || x[0].has(line2) && x[1].has(line1)) ){
        return;
    }
    const pair = perpendicularPairs.find(x => x[0].has(line1) || x[0].has(line2) || x[1].has(line1) || x[1].has(line2));
    if(pair != undefined){
        const lines = [line1, line2];
        for(const [i, line_set] of pair.entries()){
            for(const [j, line] of lines.entries()){
                if(line_set.has(line)){
                    pair[1 - i].add( lines[1 - j] );
                    return;
                }
            }
        }
    }

    perpendicularPairs.push([ new Set<AbstractLine>([line1]), new Set<AbstractLine>([line2])  ])    
}

export function addParallelLines(line1 : AbstractLine, line2 : AbstractLine){
    const line_sets = perpendicularPairs.flat().filter(x => x.has(line1) || x.has(line2));

    let line_set : Set<AbstractLine>; 

    switch(line_sets.length){
    case 0 : 
        line_set = new Set<AbstractLine>(); 
        perpendicularPairs.push([line_set, new Set<AbstractLine>()]);
        break;

    case 1 : 
        line_set = line_sets[0]; 
        break;
    default : 
        throw new MyError();
    }

    line_set.add(line1);
    line_set.add(line2);
}

function isParallel(lineA : AbstractLine, lineB : AbstractLine) : boolean {
    for(const line_set of perpendicularPairs.flat()){
        if(line_set.has(lineA)){
            return line_set.has(lineB);
        }
    }

    return false;
}

export function addEqualCircleArcs(circle1 : CircleArc, circle2 : CircleArc){
    const circle_set1 = equalCircleArcs.find(x => x.has(circle1));
    const circle_set2 = equalCircleArcs.find(x => x.has(circle2));

    if(circle_set1 != undefined){
        if(circle_set2 != undefined){
            list(circle_set2).forEach(x => circle_set1.add(x));
            remove(equalCircleArcs, circle_set2);
        }
        else{
            circle_set1.add(circle2);
        }
    }
    else{
        if(circle_set2 != undefined){
            circle_set2.add(circle1);
        }
        else{
            const new_set = new Set<CircleArc>([ circle1, circle2 ]);
            equalCircleArcs.push(new_set);
        }
    }
}

export class TriangleCongruence extends Statement {

    async asyncPlay(speech : i18n_ts.AbstractSpeech){
        this.setIndex();

        switch(this.reason){
        case Reason.side_side_side:
        case Reason.side_angle_side:
        case Reason.angle_side_angle:
            if(2 <= this.selectedShapes.length && this.selectedShapes.slice(0, 2).every(x => x instanceof SelectedShape && x.isTriangle())){
                break;
            }
            throw new MyError();
        default:
            throw new MyError();
        }

        const triangles = this.selectedShapes.slice(0, 2) as SelectedShape[] 
        triangles.forEach(x => x.mode = 0);
        speech.speak(TT("We show that the two triangles are congruent."));
        for(const selected of triangles){
            View.current.attentionShapes.push(selected);
            View.current.dirty = true;
            if(Plane.one.playMode == PlayMode.normal){
                await sleep(1000);
            }
        }
        await speech.waitEnd();

        if(this.reason == Reason.side_side_side){
            const texts = [
                TT("These two sides are equal."),
                TT("These two sides are equal."),
                TT("This side is common."),
            ];

            for(const [i, highlight_mode] of [1, 2, 3].entries()){
                speech.speak(texts[i]);
                triangles.forEach(x => x.highlightMode = highlight_mode);
                View.current.dirty = true;
                await speech.waitEnd();
            }

            triangles.forEach(x => x.highlightMode = 0);
            View.current.dirty = true;
            
            for(const s of TTs("Because the three corresponding sides are equal,\nthe two triangles are congruent.")){
                await speech.speak_waitEnd(s);
            }
        }

        if(this.implication == ImplicationCode.equal_angles && 4 <= this.selectedShapes.length && this.selectedShapes.slice(2, 4).every(x => x instanceof Angle)){
            const angles = this.selectedShapes.slice(2, 4) as Angle[];
            angles.forEach(x => { x.visible2 = true; x.setMode(Mode.depend)});
            await speech.speak_waitEnd(TT("These corresponding angles are equal."));
        }
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


export function getCommonLineOfPoints(pointA : Point, pointB : Point) : AbstractLine | undefined {
    const linesA = pointOnLines.get(pointA);
    const linesB = pointOnLines.get(pointB);
    if(linesA == undefined || linesB == undefined){
        return undefined;
    }

    const common_lines = intersection<AbstractLine>(linesA, linesB);
    switch(common_lines.length){
    case 0: return undefined;
    case 1: return common_lines[0];
    default : throw new MyError();
    }
}

function getPointsFromLine(line : AbstractLine) : Set<Point>{
    const points = Array.from(pointOnLines.entries()).filter(x => x[1].has(line)).map(x => x[0]);
    return new Set<Point>(points);
}

export function getCommonPointOfLines(lineA : AbstractLine, lineB : AbstractLine) : Point {
    const pointsA = getPointsFromLine(lineA);
    const pointsB = getPointsFromLine(lineB);
    const common_points = intersection<Point>(pointsA, pointsB);
    if(common_points.length == 1){
        return common_points[0];
    }

    throw new MyError();
}

function getLineFromPoints(lines : AbstractLine[], pointA : Point, pointB : Point) : AbstractLine | undefined {
    return lines.find(x => x.includesPoint(pointA) && x.includesPoint(pointB));
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

export function makeEqualAngle(angleA : Angle, angleB : Angle){
    const e_AA = angleA.lineA.e.mul(angleA.directionA);
    const e_AB = angleA.lineB.e.mul(angleA.directionB);
    const e_BA = angleB.lineA.e.mul(angleB.directionA);
    const e_BB = angleB.lineB.e.mul(angleB.directionB);

    let cross_sign : number;
    let parallel_sign : number;

    if(angleA.lineA == angleB.lineA){
        msg("lineA == lineA");
        if(! isParallel(angleA.lineB, angleB.lineB)){
            msg("");
            return undefined;
        }
    
        cross_sign    = Math.sign(e_AA.dot(e_BA));
        parallel_sign = Math.sign(e_AB.dot(e_BB));
    }
    else if(angleA.lineB == angleB.lineB){
        msg("lineB == lineB");
        if(! isParallel(angleA.lineA, angleB.lineA)){
            msg("");
            return undefined;
        }

        cross_sign    = Math.sign(e_AB.dot(e_BB));
        parallel_sign = Math.sign(e_AA.dot(e_BA));
    }
    else{
        msg("illegal angle");
        return undefined;
    }

    if(cross_sign * parallel_sign == 1){
        msg(`equal ange:parallel lines`);
    }
    else{
        msg("");
        return undefined;
    }
}

export class EqualAngle extends Statement {
    constructor(obj : { narration? : string, reason? : number, implication? : number, auxiliary_shapes? : MathEntity[], shapes : MathEntity[], mathText? : string }){
        super(obj);
    }

    async asyncPlay(speech : i18n_ts.AbstractSpeech){
    }
}

}