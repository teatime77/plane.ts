namespace plane_ts {
//
export function angleKey(lineA : AbstractLine, directionA : number, lineB : AbstractLine, directionB : number, intersection : Point) : string {
    return `${lineA.id}:${directionA}:${lineB.id}:${directionB}:${intersection.id}`;
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
    const line_sets = supplementaryAngles.flat().filter(x => x.has(angle1) || x.has(angle2));

    let line_set : Set<Angle>; 

    switch(line_sets.length){
    case 0 : 
        line_set = new Set<Angle>(); 
        supplementaryAngles.push([line_set, new Set<Angle>()]);
        break;

    case 1 : 
        line_set = line_sets[0]; 
        break;
    default : 
        throw new MyError();
    }

    line_set.add(angle1);
    line_set.add(angle2);
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

export function makeEqualAngle(angleA : Angle, angleB : Angle) : AngleEquality | undefined {
    const e_AA = angleA.lineA.e.mul(angleA.directionA);
    const e_AB = angleA.lineB.e.mul(angleA.directionB);
    const e_BA = angleB.lineA.e.mul(angleB.directionA);
    const e_BB = angleB.lineB.e.mul(angleB.directionB);

    let cross_sign : number;
    let parallel_sign : number;

    let parallel_lines : AbstractLine[];
    let cross_line : AbstractLine;

    if(angleA.intersection == angleB.intersection){
        msg("intersectionA == intersectionB");
        if(angleA.lineA == angleB.lineA && angleA.lineB == angleB.lineB){
            msg("lineAA == lineBB & lineAB == lineBB");
            if(Math.sign(e_AA.dot(e_BA)) == -1 && Math.sign(e_AB.dot(e_BB)) == -1){
                msg(`equal ange:vertical angle`);
                return new AngleEquality({
                    reason : AngleEqualityReason.vertical_angle,
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
    else if(angleA.lineA == angleB.lineA){
        msg("lineA == lineA");
        if(! isParallel(angleA.lineB, angleB.lineB)){
            msg("not parallel");
            return undefined;
        }
    
        cross_sign    = Math.sign(e_AA.dot(e_BA));
        parallel_sign = Math.sign(e_AB.dot(e_BB));

        parallel_lines = [angleA.lineB, angleB.lineB];
        cross_line = angleA.lineA;
    }
    else if(angleA.lineB == angleB.lineB){
        msg("lineB == lineB");
        if(! isParallel(angleA.lineA, angleB.lineA)){
            msg("not parallel");
            return undefined;
        }

        cross_sign    = Math.sign(e_AB.dot(e_BB));
        parallel_sign = Math.sign(e_AA.dot(e_BA));

        parallel_lines = [angleA.lineA, angleB.lineA];
        cross_line     = angleA.lineB;
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
}


}