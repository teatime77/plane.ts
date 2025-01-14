namespace plane_ts {
//
export function angleKey(lineA : AbstractLine, directionA : number, lineB : AbstractLine, directionB : number, intersection : Point) : string {
    return `${lineA.id}:${directionA}:${lineB.id}:${directionB}:${intersection.id}`;
}

export function findAngleBy3points(angles : Angle[], angle_points_arg : Point[]) : Angle | undefined {
    const points = toClockwisePoints(angle_points_arg);

    return angles.find(x => x.intersection == points[1] && x.lineA.includesPoint(points[2]) && x.lineB.includesPoint(points[0]));
}

export function findEqualAnglesBy3pointsPair(points_arg_1 : Point[], points_arg_2 : Point[]) : [Angle, Angle] | undefined {
    const points1 = toClockwisePoints(points_arg_1);
    const points2 = toClockwisePoints(points_arg_2);

    for(const angle_set of supplementaryAngles.flat()){
        const angles = Array.from(angle_set);
        const angle1 = findAngleBy3points(angles, points1);
        if(angle1 != undefined){
            const angle2 = findAngleBy3points(angles, points2);
            if(angle2 != undefined){
                return [angle1, angle2];
            }
            else{
                return undefined;
            }
        }
    }

    return undefined;
}

export function findAngle(angle_points_arg : Point[]) : Angle | undefined {
    let angle_points =angle_points_arg.slice();
    if(! isClockwise(angle_points)){
        angle_points = [2, 1, 0].map(i => angle_points_arg[i]);
    }

    const [B, C, A] = angle_points;
    const lineA = getCommonLineOfPoints(C, A);
    const lineB = getCommonLineOfPoints(C, B);
    if(lineA == undefined || lineB == undefined){
        return undefined;
    }
    const CA = A.sub(C);
    const CB = B.sub(C);
    const directionA = Math.sign(CA.dot(lineA.e));
    const directionB = Math.sign(CB.dot(lineB.e));

    const key = angleKey(lineA, directionA, lineB, directionB, C);
    const angle = angleMap.get(key);
    if(angle == undefined){
        const point_ids = angle_points.map(x => `${x.id}`).join(", ");
        msg(`point ids:${point_ids}  key:${key}`);
        for(const map_key of angleMap.keys()){
            msg(`map key:${map_key}`);
        }
    }

    return angle;
}


export function addSupplementaryAngles(angle1 : Angle, angle2 : Angle){
    if(supplementaryAngles.some(x => x[0].has(angle1) && x[1].has(angle2) || x[0].has(angle2) && x[1].has(angle1)) ){
        return;
    }
    const pair = supplementaryAngles.find(x => x[0].has(angle1) || x[0].has(angle2) || x[1].has(angle1) || x[1].has(angle2));
    if(pair != undefined){
        const angles = [angle1, angle2];
        for(const [i, line_set] of pair.entries()){
            for(const [j, line] of angles.entries()){
                if(line_set.has(line)){
                    pair[1 - i].add( angles[1 - j] );
                    return;
                }
            }
        }
    }

    supplementaryAngles.push([ new Set<Angle>([angle1]), new Set<Angle>([angle2])  ])    
}

function addEqualAngles(angle1 : Angle, angle2 : Angle){
    const angle_sets = supplementaryAngles.flat().filter(x => x.has(angle1) || x.has(angle2));

    let angle_set : Set<Angle>; 

    switch(angle_sets.length){
    case 0 : 
        angle_set = new Set<Angle>(); 
        supplementaryAngles.push([angle_set, new Set<Angle>()]);
        break;

    case 1 : 
        angle_set = angle_sets[0]; 
        break;
    default : 
        throw new MyError();
    }

    angle_set.add(angle1);
    angle_set.add(angle2);
}

export function isEqualAngle(angleA : Angle, angleB : Angle) : boolean {
    for(const angle_set of supplementaryAngles.flat()){
        if(angle_set.has(angleA)){
            return angle_set.has(angleB);
        }
    }

    return false;
}

export function isEqualAnglePoints(angle_pointsA : Point[], angle_pointsB : Point[]) : boolean {
    const angleA = findAngle(angle_pointsA);
    const angleB = findAngle(angle_pointsB);

    if(angleA != undefined && angleB != undefined){
        return isEqualAngle(angleA, angleB);
    }

    return false;
}

export function makeAngleEqualityByCongruentTriangles(angleA : Angle, angleB : Angle, triangleA : Triangle, triangleB : Triangle) : AngleEquality | undefined {
    if(triangleA.isCongruent(triangleB)){

        const idxA = triangleA.angleIndex(angleA);
        const idxB = triangleB.angleIndex(angleB);

        if(idxA != -1 && idxB != -1 && idxA == idxB){
            msg(`equal angle:congruent triangles`);
            return new AngleEquality({
                reason : AngleEqualityReason.congruent_triangles,
                auxiliaryShapes : [
                    triangleA!, triangleB!
                ],
                shapes : [
                    angleA, angleB
                ]
            });
        }
    }

    return undefined;
}

function getAngleUnitVectors(angleA : Angle, angleB : Angle) : [Vec2, Vec2, Vec2, Vec2]{
    const e_AA = angleA.lineA.e.mul(angleA.directionA);
    const e_AB = angleA.lineB.e.mul(angleA.directionB);
    const e_BA = angleB.lineA.e.mul(angleB.directionA);
    const e_BB = angleB.lineB.e.mul(angleB.directionB);

    return [ e_AA, e_AB, e_BA, e_BB ];
}

export function makeAngleEqualityByVertical_angles(angleA : Angle, angleB : Angle) : AngleEquality | undefined {
    if(angleA.intersection == angleB.intersection){
        msg("intersectionA == intersectionB");
        if(angleA.lineA == angleB.lineA && angleA.lineB == angleB.lineB){
            msg("lineAA == lineBB & lineAB == lineBB");

            const [ e_AA, e_AB, e_BA, e_BB ] = getAngleUnitVectors(angleA, angleB);
            if(Math.sign(e_AA.dot(e_BA)) == -1 && Math.sign(e_AB.dot(e_BB)) == -1){
                msg(`equal angle:vertical angle`);
                return new AngleEquality({
                    reason : AngleEqualityReason.vertical_angles,
                    auxiliaryShapes : [
                        angleA.lineA, angleA.lineB
                    ],
                    shapes : [
                        angleA, angleB
                    ]
                });
            }
            else{
                msg(`AA.BA = ${(e_AA.dot(e_BA)).toFixed(1)} : AB.BB = ${(e_AB.dot(e_BB)).toFixed(1)}`)                
            }
        }
        return undefined;
    }

    return undefined;
}

export function makeAngleEqualityByParallelLines(angleA : Angle, angleB : Angle, parallel_lines : AbstractLine[], cross_line : AbstractLine) : AngleEquality | undefined {
    if(! isParallel(parallel_lines[0], parallel_lines[1])){
        msg("not parallel");
        return undefined;
    }

    let cross_sign : number;
    let parallel_sign : number;

    const [ e_AA, e_AB, e_BA, e_BB ] = getAngleUnitVectors(angleA, angleB);

    if(angleA.lineA == angleB.lineA && angleA.lineA == cross_line && areSetsEqual(parallel_lines, [angleA.lineB, angleB.lineB])){
        msg("lineA == lineA");
    
        cross_sign    = Math.sign(e_AA.dot(e_BA));
        parallel_sign = Math.sign(e_AB.dot(e_BB));
    }
    else if(angleA.lineB == angleB.lineB && angleA.lineB == cross_line && areSetsEqual(parallel_lines, [angleA.lineA, angleB.lineA])){
        msg("lineB == lineB");

        cross_sign    = Math.sign(e_AB.dot(e_BB));
        parallel_sign = Math.sign(e_AA.dot(e_BA));
    }
    else{
        msg("illegal angle");
        return undefined;
    }

    if(cross_sign * parallel_sign == 1){
        msg(`equal ange:parallel lines`);
        return new AngleEquality({
            reason : AngleEqualityReason.parallel_lines,
            auxiliaryShapes : parallel_lines.concat(cross_line),
            shapes : [
                angleA, angleB
            ]
        });
    }
    else{
        msg("make-Equal-Angle:cross_sign * parallel_sign != 1");
        return undefined;
    }
}

export function makeAngleEqualityByAngleBisector(angleA : Angle, angleB : Angle, angle_bisector : AngleBisector) : AngleEquality {
    const [ lineA, lineB ] = [ angleA.lineA, angleB.lineB ];

    return new AngleEquality({
        reason          : AngleEqualityReason.angle_bisector,
        auxiliaryShapes : [ lineA, lineB, angle_bisector ],
        shapes          : [ angleA, angleB ]
    });
}

export function makeAngleEqualityByParallelogramOppositeAngles(angleA : Angle, angleB : Angle, parallelogram : Quadrilateral) : AngleEquality | undefined {
    if(! parallelogram.isParallelogram()){
        return undefined;
    }

    const intersections = [angleA.intersection, angleB.intersection];
    const [pt0, pt1, pt2, pt3] = parallelogram.points;

    if( areSetsEqual([pt0, pt2], intersections) || areSetsEqual([pt1, pt3], intersections ) ){

        const points = toClockwisePoints(parallelogram.points);
        let triad_pair : Point[][];
        if(intersections.includes(points[0])){
            triad_pair = [[points[3], points[0], points[1]], [points[1], points[2], points[3]]]
        }
        else{
            triad_pair = [[points[0], points[1], points[2]], [points[2], points[3], points[0]]]
        }

        const angles = [angleA, angleB];
        if(triad_pair[0][1] == angleB.intersection){
            triad_pair.reverse();
        }
        for(const [idx, triad] of triad_pair.entries()){
            const angle = angles[idx];
            assert(triad[1] == angle.intersection);
            if(angle.lineA.includesPoint(triad[2]) && angle.lineB.includesPoint(triad[0])){
                msg(`equal ange:parallelogram`);
                return new AngleEquality({
                    reason : AngleEqualityReason.parallelogram_opposite_angles,
                    auxiliaryShapes : [parallelogram],
                    shapes : [
                        angleA, angleB
                    ]
                });        
            }
        }
    }

    return undefined;
}

export class AngleEquality extends Statement {
    constructor(obj : { narration? : string, reason? : number, implication? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[], mathText? : string }){
        super(obj);
    }

    async asyncPlay(speech : i18n_ts.AbstractSpeech){
    }

    setRelations(): void {
        super.setRelations();

        const [angleA, angleB] = this.selectedShapes as Angle[];
        addEqualAngles(angleA, angleB);
    }

    verify() : AngleEquality | undefined {
        let angleEquality : AngleEquality | undefined;

        const [angleA, angleB] = this.selectedShapes as Angle[];

        const reason_str = enumToStr(AngleEqualityReason, this.reason);
        switch(this.reason){
        case AngleEqualityReason.vertical_angles:
            angleEquality = makeAngleEqualityByVertical_angles(angleA, angleB);
            break;

        case AngleEqualityReason.parallel_lines:{
                const parallel_lines = this.auxiliaryShapes.slice(0, 2) as AbstractLine[];
                const cross_line = this.auxiliaryShapes[2] as AbstractLine;
                angleEquality = makeAngleEqualityByParallelLines(angleA, angleB, parallel_lines, cross_line);
            }
            break;
            
        case AngleEqualityReason.angle_bisector:{

                const angle_bisector = this.auxiliaryShapes[2] as AngleBisector;
                angleEquality = makeAngleEqualityByAngleBisector(angleA, angleB, angle_bisector);
            }
            break;

        case AngleEqualityReason.congruent_triangles:{
                const [triangleA, triangleB] = this.auxiliaryShapes as Triangle[];
                angleEquality = makeAngleEqualityByCongruentTriangles(angleA, angleB, triangleA, triangleB);
            }
            break;

        case AngleEqualityReason.parallelogram_opposite_angles:{
                const parallelogram = this.auxiliaryShapes[0] as Quadrilateral;
                angleEquality = makeAngleEqualityByParallelogramOppositeAngles(angleA, angleB, parallelogram);
            }
            break;

        default:
            throw new MyError(`unknown Angle-Equality reason: ${this.reason} ${reason_str}`);
        }

        if(angleEquality == undefined){
            throw new MyError(`can not make Angle-Equality: ${reason_str}`)
        }
        else{

            msg(`make Angle-Equality OK: ${reason_str}`)
        }

        return angleEquality;
    }
}


}