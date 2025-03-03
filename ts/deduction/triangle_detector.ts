namespace plane_ts {
//

export class TriangleDetector extends TriangleQuadrilateralDetector {
    constructor(obj : { reason? : number, shapes : MathEntity[], auxiliaryShapes? : MathEntity[], mathText? : string }){
        super(obj);
        const triangle = this.selectedShapes[0] as Triangle;
        assert(triangle instanceof Triangle);
        if(this.reason == IsoscelesTriangleReason.two_sides_are_equal){
            isoscelesTriangle.push(triangle);
        }
    }

    reading(): Reading {
        switch(this.reason){
        case IsoscelesTriangleReason.two_sides_are_equal:
            return this.textReading(TT("The triangle is an isosceles triangle."));
        }

        throw new MyError();
    }

}

export function makeIsoscelesTriangleDetector(points : Point[], reason : IsoscelesTriangleReason ) : TriangleDetector | undefined {
    switch(reason){
    case IsoscelesTriangleReason.two_sides_are_equal:
        for(const length_symbol_set of equalLengths){
            const length_symbols = Array.from(length_symbol_set).filter(x => points.includes(x.pointA) && points.includes(x.pointB));
            if(length_symbols.length == 3){
                const triangle = Triangle.fromPoints(points);

                return new TriangleDetector({
                    reason : reason,
                    auxiliaryShapes : length_symbols,
                    shapes : [ triangle ]
                });    
            }
            else if(length_symbols.length == 2){
                const points_list = length_symbols.map(x => [x.pointA, x.pointB]);

                const vertex_idx = range(3).find(i => points_list.every(pts => pts.includes(points[i])))!;
                assert(vertex_idx != undefined);
                const points2 = [points[vertex_idx], points[(vertex_idx + 1) % 3], points[(vertex_idx + 2) % 3]]
                const triangle = Triangle.fromPoints(points2);

                return new TriangleDetector({
                    reason : reason,
                    auxiliaryShapes : length_symbols,
                    shapes : [ triangle ]
                });    
            }
        }    
        break;

    default:
        throw new MyError();
    }


    return undefined;
}


}