///<reference path="statement.ts" />
///<reference path="deduction/triangle_congruence.ts" />

namespace plane_ts {
//
export let perpendicularPairs : [Set<AbstractLine>, Set<AbstractLine>][] = [];
export let supplementaryAngles : [Set<Angle>, Set<Angle>][];
export const rightAngles = new Set<Angle>();

export const pointsToLengthSymbol = new Map<string, LengthSymbol>();
export const centerOfCircleArcs = new Map<Point,Set<CircleArc>>();
export const pointOnCircleArcs = new Map<Point,Set<CircleArc>>();
export const pointOnLines = new Map<Point,Set<AbstractLine>>();
export const angleMap = new Map<string,Angle>();

export let parallelogramClassifiers = new Set<ParallelogramClassifier>();

export let equalLengths : Set<LengthSymbol>[] = [];
export let equalCircleArcs : Set<CircleArc>[] = [];
export let congruentTriangles : Triangle[][] = [];
export let similarTriangles : Triangle[][] = [];
export let isoscelesTriangle : Triangle[] = [];

export const reasonToDoc = new Map<number, number>([
    [ ShapeEquationReason.sum_of_interior_angles_of_triangle_is_pi, 18 ],
    [ ShapeEquationReason.sum_of_interior_angles_of_quadrilateral_is_2pi, 21 ],
    [ ShapeEquationReason.sum_of_interior_angles_of_quadrilateral_is_2pi, 23 ],

    [ AngleEqualityReason.vertical_angles, 17 ],
    [ AngleEqualityReason.parallelogram_opposite_angles, 10 ],
    [ AngleEqualityReason.angle_bisector, 2 ],
    [ AngleEqualityReason.isosceles_triangle_base_angles, 3 ],

    [ LengthEqualityReason.parallel_lines_distance, 16 ],
    [ LengthEqualityReason.parallelogram_opposite_sides, 10 ],
    [ LengthEqualityReason.parallelogram_diagonal_bisection, 11 ],

    [ ParallelogramReason.each_opposite_sides_are_equal, 1],
    [ ParallelogramReason.each_opposite_angles_are_equal, 22],
    [ ParallelogramReason.one_opposite_sides_are_parallel_and_equal, 12],
    [ ParallelogramReason.each_diagonal_bisections, 9],
]);

export const usedReasons = new Set<number>();

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
    rightAngles.clear();

    pointsToLengthSymbol.clear();
    centerOfCircleArcs.clear();
    pointOnCircleArcs.clear();
    pointOnLines.clear();
    angleMap.clear();

    parallelogramClassifiers.clear();

    equalLengths = [];
    equalCircleArcs = [];
    congruentTriangles = [];
    similarTriangles = [];
    isoscelesTriangle = [];
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
    // msg(`add-Point-On-Lines point${point.id} line:${line.id}`);
    assert(pointOnLines.get(point) != undefined);
}

export function getLinesByPoint(point : Point) : AbstractLine[] {
    const lines = pointOnLines.get(point);
    if(lines == undefined){
        return [];
    }
    else{
        return Array.from(lines);
    }
}

export function getCircleArcsByPoint(point : Point) : CircleArc[] {
    const circles = pointOnCircleArcs.get(point);
    if(circles == undefined){
        return [];
    }
    else{
        return Array.from(circles);
    }
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

export function getPerpendicularLines(line : AbstractLine) : Set<AbstractLine> | undefined {
    for(const [lines1, lines2] of perpendicularPairs){
        if(lines1.has(line)){
            return lines2;
        }
        else if(lines2.has(line)){
            return lines1;
        }
    }

    return undefined;
}

export function getParallelLines(line : AbstractLine) : Set<AbstractLine> | undefined {
    return perpendicularPairs.flat().find(x => x.has(line));
}

export function isParallel(lineA : AbstractLine, lineB : AbstractLine) : boolean {
    const line_set = getParallelLines(lineA);
    return line_set != undefined && line_set.has(lineB);
}

export function isPerpendicular(lineA : AbstractLine, lineB : AbstractLine) : boolean {
    const perpendicular_lines = getPerpendicularLines(lineA);
    
    if(perpendicular_lines == undefined){
        return false;
    }
    else{
        return perpendicular_lines.has(lineB);
    }
}

export function areEqualCircleArcs(circle1 : CircleArc, circle2 : CircleArc) : boolean {
    if(circle1 == circle2){
        return true;
    }
    
    const circle_set1 = equalCircleArcs.find(x => x.has(circle1));
    const circle_set2 = equalCircleArcs.find(x => x.has(circle2));

    return circle_set1 != undefined && circle_set1 == circle_set2;
}

export function addEqualCircleArcs(circle1 : CircleArc, circle2 : CircleArc){
    const circle_set1 = equalCircleArcs.find(x => x.has(circle1));
    const circle_set2 = equalCircleArcs.find(x => x.has(circle2));

    if(circle_set1 != undefined){
        if(circle_set2 != undefined){
            if(circle_set1 != circle_set2){

                list(circle_set2).forEach(x => circle_set1.add(x));
                remove(equalCircleArcs, circle_set2);
            }
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

export function getPointsFromLine(line : AbstractLine) : Set<Point>{
    const points = Array.from(pointOnLines.entries()).filter(x => x[1].has(line)).map(x => x[0]);
    return new Set<Point>(points);
}

export function getCommonPointOfLines(lineA : AbstractLine, lineB : AbstractLine) : Point | undefined {
    const pointsA = getPointsFromLine(lineA);
    const pointsB = getPointsFromLine(lineB);
    const common_points = intersection<Point>(pointsA, pointsB);
    if(common_points.length == 1){
        return common_points[0];
    }

    return undefined;
}

export function getLineFromPoints(lines : AbstractLine[], pointA : Point, pointB : Point) : AbstractLine | undefined {
    return lines.find(x => x.includesPoint(pointA) && x.includesPoint(pointB));
}

export function addCongruentSimilarTriangles(is_congruent : boolean, triangle1 : Triangle, triangle2 : Triangle){
    if(!(triangle1 instanceof Triangle && triangle2 instanceof Triangle)){
        msg("old Congruent Triangles")
        return;
    }

    const triangles_list = is_congruent ? congruentTriangles : similarTriangles;

    for(const triangles of triangles_list){
        let equal_triangle1 = triangles.find(x => x.isEqual(triangle1));
        let equal_triangle2 = triangles.find(x => x.isEqual(triangle2));

        let indexes1 : number[] | undefined;
        let indexes2 : number[] | undefined;
        if(equal_triangle1 != undefined){
            indexes1 = triangle1.points.map(p => equal_triangle1.points.indexOf(p)) ;
        }

        if(equal_triangle2 != undefined){
            indexes2 = triangle2.points.map(p => equal_triangle2.points.indexOf(p)) ;
        }

        if(indexes1 != undefined){
            if(indexes2 != undefined){
                if(range(3).every(i => indexes1[i] == indexes2[i])){
                    return;
                }
                else{
                    throw new MyError();
                }
            }
            else{
                if(range(3).every(i => indexes1[i] == i)){
                    triangles.push(triangle2);
                    return;
                }
                else{
                    throw new MyError();
                }
            }
        }
        else if(indexes2 != undefined){
            if(range(3).every(i => indexes2[i] == i)){
                triangles.push(triangle1);
                return;
            }
            else{
                throw new MyError();
            }

        }
    }

    triangles_list.push([triangle1, triangle2]);
}

export function addCongruentTriangles(triangle1 : Triangle, triangle2 : Triangle){
    return addCongruentSimilarTriangles(true, triangle1, triangle2);
}

export function addSimilarTriangles(triangle1 : Triangle, triangle2 : Triangle){
    return addCongruentSimilarTriangles(false, triangle1, triangle2);
}

export function findEqualLengthsByPointsPair(As : [Point, Point], Bs : [Point, Point]) : [LengthSymbol, LengthSymbol] | undefined {
    for(const length_symbol_set of equalLengths){
        const length_symbols = Array.from(length_symbol_set);

        const length_symbolA = length_symbols.find(x => areSetsEqual<Point>([x.pointA, x.pointB], [As[0], As[1]]));
        if(length_symbolA != undefined){

            const length_symbolB = length_symbols.find(x => areSetsEqual<Point>([x.pointA, x.pointB], [Bs[0], Bs[1]]));
            if(length_symbolB != undefined){
                return [length_symbolA, length_symbolB];
            }
            else{
                return undefined;
            }
        }
    }

    return undefined;
}

export function getParallelogramClassifier(points : Point[]) : ParallelogramClassifier | undefined {
    return list(parallelogramClassifiers).find(x => areSetsEqual(x.quadrilateral().points, points) );
}

export function getParallelogramsByDiagonalLengthSymbols(lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol) : Quadrilateral[]{
    if(lengthSymbolA.line == undefined || lengthSymbolA.line != lengthSymbolB.line){
        msg(TT("length symbols are not on the same line."));
        return [];
    }

    const connection_point = lengthSymbolA.points().find(x => lengthSymbolB.points().includes(x));
    if(connection_point == undefined){
        msg(TT("no connection point of two length symbols"));
        return [];
    }

    const pointA = lengthSymbolA.points().find(x => x != connection_point);
    const pointB = lengthSymbolB.points().find(x => x != connection_point);

    const parallelograms : Quadrilateral[] = [];
    for(const parallelogramClassifier of parallelogramClassifiers){
        const parallelogram = parallelogramClassifier.quadrilateral();
        const points = parallelogram.points;
        if(areSetsEqual([points[0], points[2]], [pointA, pointB]) || areSetsEqual([points[1], points[3]], [pointA, pointB]) ){
            parallelograms.push(parallelogram);
        }
    }

    return parallelograms;
}

export function isParallelogramPoints(points : Point[]) : boolean {
    return getParallelogramClassifier(points) != undefined;
}

export function getTrianglesByAngle(angle : Angle, triangles : Triangle[]) : Triangle[] {
    const triangles_with_inner_angle : Triangle[] = [];

    LA : for(const triangle of triangles){
        const angle_points : Point[] = [ angle.intersection ];

        for(const line of [angle.lineA, angle.lineB]){
            const points = triangle.points.filter(point => line.includesPoint(point));
            if(points.length != 2){
                continue LA;
            }

            if(points[0] == angle.intersection){
                angle_points.push(points[1]);
            }
            else if(points[1] == angle.intersection){
                angle_points.push(points[0]);
            }
            else{
                continue LA;
            }
        }
        assert(angle_points.length == 3);

        if(isClockwise(angle_points)){
            triangles_with_inner_angle.push(triangle);
        }
    }

    return triangles_with_inner_angle;
}


export function getTrianglesByLengthSymbol(length_symbol : LengthSymbol, triangles : Triangle[]) : Triangle[] {
    const triangles_with_length_symbol : Triangle[] = [];

    const Length_symbol_points = [ length_symbol.pointA, length_symbol.pointB ];

    for(const triangle of triangles){
        const points = triangle.points.filter(point => Length_symbol_points.includes(point) );
        if(points.length == 2){
            triangles_with_length_symbol.push(triangle);
        }
    }

    return triangles_with_length_symbol;
}



}