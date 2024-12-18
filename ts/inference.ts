///<reference path="statement.ts" />
///<reference path="deduction/triangle_congruence.ts" />

namespace plane_ts {
//
export let perpendicularPairs : [Set<AbstractLine>, Set<AbstractLine>][] = [];
export let supplementaryAngles : [Set<Angle>, Set<Angle>][];

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
    supplementaryAngles = [];

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

//------------------------------------------------------------ perpendicular / parallel lines

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

export function isParallel(lineA : AbstractLine, lineB : AbstractLine) : boolean {
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

export function getLineFromPoints(lines : AbstractLine[], pointA : Point, pointB : Point) : AbstractLine | undefined {
    return lines.find(x => x.includesPoint(pointA) && x.includesPoint(pointB));
}





}