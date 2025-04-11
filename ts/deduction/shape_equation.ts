namespace plane_ts {
//

export type Term = parser_ts.Term;
export const Term = parser_ts.Term;

export type  RefVar = parser_ts.RefVar;
export const RefVar = parser_ts.RefVar;

export type App = parser_ts.App;
export const App = parser_ts.App;

export type EquationTextBlockClass = AngleEqualityConstraint | Assumption | ExprTransform | ShapeEquation;

export function isEquationTextBlock(x : MathEntity | undefined){
    if(x == undefined){
        return false;
    }

    const classes = [AngleEqualityConstraint , Assumption , ExprTransform , ShapeEquation];
    return classes.some(c => x instanceof c);
}

export function makeEquationTextBlock(parent : EquationTextBlockClass, equation : App) : TextBlock {
    const view = View.current;

    const text_block = new TextBlock( {
        parent,
        text : equation.tex(),
        isTex : true,
        offset : Vec2.zero(),
    });

    text_block.setTextPosition(view.textBase.x, view.textBase.y);
    text_block.updateTextDiv();

    const rect = text_block.div.children[0].getBoundingClientRect();
    view.textBase.y -= view.fromYPixScale(rect.height + 10);

    return text_block;
}

async function makeShapeEquationByEquationText(reason : ShapeEquationReason, auxiliaryShapes : MathEntity[], text : string) : Promise<ShapeEquation | undefined> {
    // msg(`angles eq: ${text}`);

    const equation = parser_ts.parseMath(text) as App;
    if(! equation.isEq()){
        msg(`can not make an equation: ${text}`);
        return undefined;
    }

    if(View.isPlayBack){
        const speech = AbstractSpeech.one;
        await speakReason(speech, reason);
        await showAuxiliaryShapes(reason, auxiliaryShapes);
        await speech.waitEnd();
    }
    
    return new ShapeEquation({
        reason,
        auxiliaryShapes,
        shapes : [],
        equation
    });

}

export async function makeSumOfAnglesIsPi(angles_arg: Angle[]) : Promise<ShapeEquation | undefined>  {
    const angles_list = permutation(angles_arg);
    for(const angles of angles_list){
        if( range(angles.length - 1).every( i => angles[i].commonLineBA(angles[i + 1]) ) ){
            const [first_angle, last_angle] = [ angles[0], last(angles) ];
            if(first_angle.lineA == last_angle.lineB && first_angle.directionA == - last_angle.directionB){

                const text = angles.map(x => x.name).join(" + ") + " = pi";
                return await makeShapeEquationByEquationText(ShapeEquationReason.sum_of_angles_is_pi, angles, text);
            }
        }
    }

    return undefined;
}


export async function makeSumOfAnglesIsEqual(angles_arg: Angle[]) : Promise<ShapeEquation | undefined>  {
    check(3 <= angles_arg.length);
    const angles_list = permutation(angles_arg);
    for(const angles of angles_list){
        const outer_angle = angles[0];
        const inner_angles = angles.slice(1);
        if(outer_angle.commonLineAA(inner_angles[0]) && outer_angle.commonLineBB(last(inner_angles))){
            if(range(inner_angles.length - 1).every(i => inner_angles[i].commonLineBA(inner_angles[i + 1]))){
                const text = `${outer_angle.name} = ` + inner_angles.map(x => x.name).join(" + ");
                return await makeShapeEquationByEquationText(ShapeEquationReason.sum_of_angles_is_equal, angles, text);
            }
        }
    }

    return undefined;
}

export async function makeShapeEquationByExteriorAngleTheorem(angles: Angle[]) : Promise<ShapeEquation | undefined>  {
    for(const [angle1, angle2, angle3] of permutation(angles)){
        if(angle1.lineA == angle2.lineB && angle1.directionA == - angle2.directionB){
            const intersection = getCommonPointOfLines(angle1.lineB, angle2.lineA);
            if(angle3.intersection == intersection){
                if(areSetsEqual([angle1.lineB, angle2.lineA], [angle3.lineA, angle3.lineB])){

                    const text = `${angle1.name} + ${angle2.name} = ${angle3.name}`;
                    return await makeShapeEquationByEquationText(ShapeEquationReason.exterior_angle_theorem, angles, text);    
                }
            }
        }
    }

    return undefined;
}

export async function makeSumOfTriangleQuadrilateralAngles(angles: Angle[], reason : ShapeEquationReason) : Promise<ShapeEquation | undefined>  {
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
    return await makeShapeEquationByEquationText(reason, angles, text);
}


export async function makeShapeEquation(reason : ShapeEquationReason, shapes: Shape[]) : Promise<ShapeEquation | undefined>  {
    switch(reason){
    case ShapeEquationReason.sum_of_angles_is_pi:
    case ShapeEquationReason.sum_of_angles_is_equal:
    case ShapeEquationReason.exterior_angle_theorem:{
        check(shapes.every(x => x instanceof Angle && x.name != ""), TT("The selected shapes are not named angles."));
        const angles = shapes as Angle[];

        if(reason == ShapeEquationReason.exterior_angle_theorem){
            return await makeShapeEquationByExteriorAngleTheorem(angles);
        }

        const intersections = unique(angles.map(x => intersection));
        if(intersections.length != 1){
            msg(TT("The vertices of the angles do not match."));
            return undefined;
        }

        if(reason == ShapeEquationReason.sum_of_angles_is_pi){

            return await makeSumOfAnglesIsPi(angles);
        }
        else{

            return await makeSumOfAnglesIsEqual(angles);
        }
    }

    case ShapeEquationReason.sum_of_interior_angles_of_triangle_is_pi:
    case ShapeEquationReason.sum_of_interior_angles_of_quadrilateral_is_2pi:{

        assert(shapes.every(x => x instanceof Point));
        const angles = findAnglesInPolygon(shapes as Point[]);

        return await makeSumOfTriangleQuadrilateralAngles(angles, reason);
    }

    default:
        throw new MyError();
    }
}

export interface EquationTextBlock {
    equation  : App;
    textBlock : TextBlock;
}

export class ShapeEquation extends Statement implements EquationTextBlock {
    equation : App;
    textBlock : TextBlock;
    
    constructor(obj : { reason? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[], equation : App }){
        super(obj);
        this.equation = obj.equation;

        this.textBlock = makeEquationTextBlock(this, this.equation);

        if(this.reason == ShapeEquationReason.sum_of_angles_is_pi && this.auxiliaryShapes.length == 2){
            assert(this.auxiliaryShapes.every(x => x instanceof Angle));

            const [angle1, angle2] = this.auxiliaryShapes as Angle[];
            addSupplementaryAngles(angle1, angle2);
            // msg(`add-Supplementary-Angles ${angle1.name} ${angle2.name}`);
        }
    }


    reading(): Reading {
        // msg(`empty reading:${this.constructor.name}`);
        return this.textReading(TT(""));
    }

    show(){        
        this.textBlock.show();
    }

    hide(){        
        this.textBlock.hide();
    }
}

export async function simplifyEquationTextBlock(eqText : EquationTextBlock){
    const textBlock = eqText.textBlock;
    const speech = new Speech()
    eqText.equation = await algebra_ts.simplify(speech, textBlock.div, eqText.equation) as App;

    textBlock.text = eqText.equation.tex();
    textBlock.updateTextDiv();

    checkSupplementaryAngles(eqText.equation);

}

}