namespace plane_ts {
//

export type Term = parser_ts.Term;
export const Term = parser_ts.Term;

export type  RefVar = parser_ts.RefVar;
export const RefVar = parser_ts.RefVar;

export type App = parser_ts.App;
export const App = parser_ts.App;

export function makeEquationTextBlock(equation : App) : TextBlock {
    const text_block = new TextBlock( {
        text : equation.tex(),
        isTex : true,
        offset : Vec2.zero(),
        app : equation
    });

    const view = View.current;
    text_block.setTextPosition(view.textBase.x, view.textBase.y);
    text_block.updateTextDiv();

    const rect = text_block.div.children[0].getBoundingClientRect();
    view.textBase.y -= view.fromYPixScale(rect.height + 10);

    return text_block;
}

function makeShapeEquationByEquationText(reason : ShapeEquationReason, auxiliaryShapes : MathEntity[], text : string) : ShapeEquation | undefined {
    msg(`angles eq: ${text}`);

    const equation = parser_ts.parseMath(text) as App;
    if(! equation.isEq()){
        msg(`can not make an equation: ${text}`);
        return undefined;
    }

    const text_block = makeEquationTextBlock(equation);

    return new ShapeEquation({
        reason,
        auxiliaryShapes,
        shapes : [ text_block ],
        equation
    });

}

export function makeSumOfAnglesIsPi(angles_arg: Angle[]) : ShapeEquation | undefined {
    const angles_list = permutation(angles_arg);
    for(const angles of angles_list){
        if( range(angles.length - 1).every( i => angles[i].commonLineBA(angles[i + 1]) ) ){
            const [first_angle, last_angle] = [ angles[0], last(angles) ];
            if(first_angle.lineA == last_angle.lineB && first_angle.directionA == - last_angle.directionB){

                const text = angles.map(x => x.name).join(" + ") + " = pi";
                return makeShapeEquationByEquationText(ShapeEquationReason.sum_of_angles_is_pi, angles, text);
            }
        }
    }

    return undefined;
}


export function makeSumOfAnglesIsEqual(angles_arg: Angle[]) : ShapeEquation | undefined {
    check(3 <= angles_arg.length);
    const angles_list = permutation(angles_arg);
    for(const angles of angles_list){
        const outer_angle = angles[0];
        const inner_angles = angles.slice(1);
        if(outer_angle.commonLineAA(inner_angles[0]) && outer_angle.commonLineBB(last(inner_angles))){
            if(range(inner_angles.length - 1).every(i => inner_angles[i].commonLineBA(inner_angles[i + 1]))){
                const text = `${outer_angle.name} = ` + inner_angles.map(x => x.name).join(" + ");
                return makeShapeEquationByEquationText(ShapeEquationReason.sum_of_angles_is_equal, angles, text);
            }
        }
    }

    return undefined;
}

export function makeShapeEquationByExteriorAngleTheorem(angles: Angle[]) : ShapeEquation | undefined {
    for(const [angle1, angle2, angle3] of permutation(angles)){
        if(angle1.lineA == angle2.lineB && angle1.directionA == - angle2.directionB){
            const intersection = getCommonPointOfLines(angle1.lineB, angle2.lineA);
            if(angle3.intersection == intersection){
                if(areSetsEqual([angle1.lineB, angle2.lineA], [angle3.lineA, angle3.lineB])){

                    const text = `${angle1.name} + ${angle2.name} = ${angle3.name}`;
                    return makeShapeEquationByEquationText(ShapeEquationReason.exterior_angle_theorem, angles, text);    
                }
            }
        }
    }

    return undefined;
}

export function makeSumOfTriangleQuadrilateralAngles(angles: Angle[], reason : ShapeEquationReason) : ShapeEquation | undefined {
    let num_vertices : number;
    let sum_angles : string;
    if(reason == ShapeEquationReason.sum_of_interior_angles_of_triangle_is_pi){
        num_vertices = 3;
        sum_angles   = "pi";
    }
    else{
        num_vertices = 4;
        sum_angles   = "2 * pi";
    }

    check(angles.length == num_vertices);
    check(angles.every(x => x.name != ""));

    const text = angles.map(x => x.name).join(" + ") + " = " + sum_angles;
    return makeShapeEquationByEquationText(reason, angles, text);
}


export function makeShapeEquation(reason : ShapeEquationReason, shapes: Shape[]) : ShapeEquation | undefined {
    switch(reason){
    case ShapeEquationReason.sum_of_angles_is_pi:
    case ShapeEquationReason.sum_of_angles_is_equal:
    case ShapeEquationReason.exterior_angle_theorem:{
        check(shapes.every(x => x instanceof Angle && x.name != ""), TT("The selected shapes are not names angles."));
        const angles = shapes as Angle[];

        if(reason == ShapeEquationReason.exterior_angle_theorem){
            return makeShapeEquationByExteriorAngleTheorem(angles);
        }

        const intersections = unique(angles.map(x => intersection));
        if(intersections.length != 1){
            msg(TT("Corner vertices do not match."));
            return undefined;
        }

        if(reason == ShapeEquationReason.sum_of_angles_is_pi){

            return makeSumOfAnglesIsPi(angles);
        }
        else{

            return makeSumOfAnglesIsEqual(angles);
        }
    }

    case ShapeEquationReason.sum_of_interior_angles_of_triangle_is_pi:
    case ShapeEquationReason.sum_of_interior_angles_of_quadrilateral_is_2pi:{

        assert(shapes.every(x => x instanceof Point));
        const angles = findAnglesInPolygon(shapes as Point[]);

        return makeSumOfTriangleQuadrilateralAngles(angles, reason);
    }

    default:
        throw new MyError();
    }
}

export interface Equation {
    equation  : App;
    textBlock : TextBlock;
}

export class ShapeEquation extends Statement implements Equation {
    equation : App;
    textBlock : TextBlock;
    
    constructor(obj : { reason? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[], equation : App }){
        super(obj);
        this.equation = obj.equation;

        assert(this.selectedShapes.length == 1 && this.selectedShapes[0] instanceof TextBlock);
        this.textBlock = this.selectedShapes[0] as TextBlock;

        if(this.reason == ShapeEquationReason.sum_of_angles_is_pi && this.auxiliaryShapes.length == 2){
            assert(this.auxiliaryShapes.every(x => x instanceof Angle));

            const [angle1, angle2] = this.auxiliaryShapes as Angle[];
            addSupplementaryAngles(angle1, angle2);
            msg(`add-Supplementary-Angles ${angle1.name} ${angle2.name}`);
        }
    }
}
}