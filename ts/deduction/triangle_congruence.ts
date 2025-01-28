namespace plane_ts {
//
export function makeTriangleCongruence(A : Triangle, B : Triangle) : TriangleCongruence | undefined {
    const sidesA = range(3).map(i => [ A.points[i], A.points[(i+1) % 3]]);
    const sidesB = range(3).map(i => [ B.points[i], B.points[(i+1) % 3]]);

    const auxiliaryShapes : Shape[] = [];
    const equal_side = [ false, false, false ];
    for(const idx of range(3)){
        const sideA = sidesA[idx];
        const sideB = sidesB[idx];

        const keyA = pairKey(sideA[0], sideA[1]);
        const keyB = pairKey(sideB[0], sideB[1]);

        const lengthSymbolA = pointsToLengthSymbol.get(keyA);
        const lengthSymbolB = pointsToLengthSymbol.get(keyB);

        if(lengthSymbolA != undefined && lengthSymbolB != undefined){
            if(isEqualLength(lengthSymbolA, lengthSymbolB)){

                auxiliaryShapes.push(lengthSymbolA, lengthSymbolB);
                equal_side[idx] = true;
            }
        }
    }

    const equal_side_count = equal_side.filter(x => x).length;
    msg(`equal side count:${equal_side_count}`);

    if(equal_side_count == 3){
        return new TriangleCongruence({ shapes:[A, B], reason : TriangleCongruenceReason.side_side_side, auxiliaryShapes : auxiliaryShapes })
    }
    else if(equal_side_count == 2){
        const idx = equal_side.indexOf(false);
        const angle_pointsA = [A.points[(idx + 1) % 3], A.points[(idx + 2) % 3], A.points[idx] ];
        const angle_pointsB = [B.points[(idx + 1) % 3], B.points[(idx + 2) % 3], B.points[idx] ];

        const angleA = findAngle(angle_pointsA);
        const angleB = findAngle(angle_pointsB);
    
        if(angleA != undefined && angleB != undefined && isEqualAngle(angleA, angleB)){
            auxiliaryShapes.push(angleA, angleB);
            return new TriangleCongruence({ shapes : [A, B], reason : TriangleCongruenceReason.side_angle_side, auxiliaryShapes : auxiliaryShapes });
        }
    }
    else if(equal_side_count == 1){
        const eq_idx = equal_side.indexOf(true);
        for(const idx of [eq_idx, (eq_idx + 2) % 3]){

            const angle_pointsA = [ A.points[idx], A.points[(idx + 1) % 3], A.points[(idx + 2) % 3] ];
            const angle_pointsB = [ B.points[idx], B.points[(idx + 1) % 3], B.points[(idx + 2) % 3] ];

            const angleA = findAngle(angle_pointsA);
            if(angleA == undefined){
                return undefined;
            }

            const angleB = findAngle(angle_pointsB);
            if(angleB == undefined){
                return undefined;
            }
                
            if(isEqualAngle(angleA, angleB)){
                auxiliaryShapes.push(angleA, angleB);
            }                
            else{
                return undefined;
            }
        }

        return new TriangleCongruence({ shapes : [A, B], reason : TriangleCongruenceReason.angle_side_angle, auxiliaryShapes : auxiliaryShapes });
    }

    return undefined;
}

export class TriangleCongruence extends Statement {
    constructor(obj : { reason? : number, shapes : MathEntity[], auxiliaryShapes? : MathEntity[] }){
        super(obj);
    }

    reading(): Reading {
        return this.textReading(TT("the two triangles are congruent."));
    }

    setRelations(): void {
        super.setRelations();
        const triangles = this.selectedShapes as Triangle[];
        addCongruentTriangles(triangles[0], triangles[1]);
    }
}

}