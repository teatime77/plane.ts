namespace plane_ts {
//

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

export function addEqualAngles(angle1 : Angle, angle2 : Angle){
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

function isEqualAngle(lineA : Angle, lineB : Angle) : boolean {
    for(const line_set of supplementaryAngles.flat()){
        if(line_set.has(lineA)){
            return line_set.has(lineB);
        }
    }

    return false;
}

export function makeEqualAngle(angleA : Angle, angleB : Angle){
    const e_AA = angleA.lineA.e.mul(angleA.directionA);
    const e_AB = angleA.lineB.e.mul(angleA.directionB);
    const e_BA = angleB.lineA.e.mul(angleB.directionA);
    const e_BB = angleB.lineB.e.mul(angleB.directionB);

    let cross_sign : number;
    let parallel_sign : number;

    if(angleA.intersection == angleB.intersection){
        msg("intersectionA == intersectionB");
        if(angleA.lineA == angleB.lineA && angleA.lineB == angleB.lineB){
            msg("lineAA == lineBB & lineAB == lineBB");
            if(Math.sign(e_AA.dot(e_BA)) == -1 && Math.sign(e_AB.dot(e_BB)) == -1){
                msg(`equal ange:vertical angle`);
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