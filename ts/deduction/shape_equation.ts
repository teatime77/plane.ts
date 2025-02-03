namespace plane_ts {
//
export function makeAngleEquation(angles_arg: Angle[]) : ShapeEquation | undefined {
    const angles_list = permutation(angles_arg);
    for(const angles of angles_list){
        if( range(angles.length - 1).every(i => angles[i].lineB == angles[i + 1].lineA && angles[i].directionB == angles[i + 1].directionA) ){
            const [first_angle, last_angle] = [ angles[0], last(angles) ];
            if(first_angle.lineA == last_angle.lineB && first_angle.directionA == - last_angle.directionB){

                const text = angles.map(x => x.name).join(" + ") + " = π";
                msg(`angles eq: ${text}`);
            }
        }
    }

    return undefined;
}
export class ShapeEquation extends Statement {
    constructor(obj : { reason? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[] }){
        super(obj);
    }

}
}