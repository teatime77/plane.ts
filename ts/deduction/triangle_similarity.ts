namespace plane_ts {
//
export function makeTriangleSimilarity(A : Triangle, B : Triangle) : TriangleSimilarity | undefined {

    const equal_angle_pairs : Angle[] = [];

    for(const idx of range(3)){

        const angle_pointsA = [ A.points[idx], A.points[(idx + 1) % 3], A.points[(idx + 2) % 3] ];
        const angle_pointsB = [ B.points[idx], B.points[(idx + 1) % 3], B.points[(idx + 2) % 3] ];

        const angleA = findAngle(angle_pointsA);
        if(angleA != undefined){
            const angleB = findAngle(angle_pointsB);
            if(angleB != undefined){
                    
                if(isEqualAngle(angleA, angleB)){
                    equal_angle_pairs.push(angleA, angleB);
                }                
            }
        }
    }

    if(equal_angle_pairs.length == 4){

        return new TriangleSimilarity({
            reason : TriangleSimilarityReason.two_equal_angle_pairs,
            shapes : [A, B], 
            auxiliaryShapes : equal_angle_pairs
        })
    }

    return undefined;
}

export class TriangleSimilarity extends Statement {
    constructor(obj : { reason? : number, shapes : MathEntity[], auxiliaryShapes? : MathEntity[] }){
        super(obj);
    }

    reading(): Reading {
        return this.textReading(TT("the two triangles are similar."));
    }

    setRelations(): void {
        super.setRelations();
        const triangles = this.selectedShapes as Triangle[];
        addSimilarTriangles(triangles[0], triangles[1]);
    }
}

}