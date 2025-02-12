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

export function makeSumOfAnglesIsPi(angles_arg: Angle[]) : ShapeEquation | undefined {
    const angles_list = permutation(angles_arg);
    for(const angles of angles_list){
        if( range(angles.length - 1).every( i => angles[i].commonLineBA(angles[i + 1]) ) ){
            const [first_angle, last_angle] = [ angles[0], last(angles) ];
            if(first_angle.lineA == last_angle.lineB && first_angle.directionA == - last_angle.directionB){

                const text = angles.map(x => x.name).join(" + ") + " = pi";
                msg(`angles eq: ${text}`);

                const equation = parser_ts.parseMath(text) as App;
                if(! equation.isEq()){
                    msg(`can not make an equation: ${text}`);
                    return undefined;
                }

                const text_block = makeEquationTextBlock(equation);

                return new ShapeEquation({
                    reason : ShapeEquationReason.sum_of_angles_is_pi,
                    auxiliaryShapes : angles,
                    shapes : [ text_block ],
                    equation
                });
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
                msg(`angles sum eq: ${text}`);
                const equation = parser_ts.parseMath(text) as App;
                if(! equation.isEq()){
                    msg(`can not make an equation: ${text}`);
                    return undefined;
                }

                const text_block = makeEquationTextBlock(equation);

                return new ShapeEquation({
                    reason : ShapeEquationReason.sum_of_angles_is_equal,
                    auxiliaryShapes : angles,
                    shapes : [ text_block ],
                    equation
                });
                
            }
        }
    }

    return undefined;
}

export function makeSumOfTriangleAnglesIsPi(angles_arg: Angle[]) : ShapeEquation | undefined {
    check(angles_arg.length == 3);
    check(unique(angles_arg.map(x => x.intersection)).length == 3);

    for(const indexes of [ [0, 1, 2], [0, 2, 1] ]){
        const angles = indexes.map(i => angles_arg[i]);
        if( range(3).every( i => angles[i].commonLineConnect(angles[(i + 1) % 3]) ) ){
            const text = angles.map(x => x.name).join(" + ") + " = pi";
            msg(`angles eq: ${text}`);

            const equation = parser_ts.parseMath(text) as App;
            if(! equation.isEq()){
                msg(`can not make an equation: ${text}`);
                return undefined;
            }

            const text_block = makeEquationTextBlock(equation);

            return new ShapeEquation({
                reason : ShapeEquationReason.sum_of_interior_angles_of_triangle_is_pi,
                auxiliaryShapes : angles,
                shapes : [ text_block ],
                equation
            });
        }
    }

    return undefined;
}


export function makeShapeEquation(reason : ShapeEquationReason, shapes: Shape[]) : ShapeEquation | undefined {
    switch(reason){
    case ShapeEquationReason.sum_of_angles_is_pi:
    case ShapeEquationReason.sum_of_angles_is_equal:
    case ShapeEquationReason.sum_of_interior_angles_of_triangle_is_pi:{
        check(shapes.every(x => x instanceof Angle && x.name != ""), TT("The selected shapes are not names angles."));
        const angles = shapes as Angle[];

        if(reason == ShapeEquationReason.sum_of_interior_angles_of_triangle_is_pi){

            return makeSumOfTriangleAnglesIsPi(angles);
        }
        else{

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
    }
    default:
        throw new MyError();
    }
}

export class ShapeEquation extends Statement {
    equation : App;
    
    constructor(obj : { reason? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[], equation : App }){
        super(obj);
        this.equation = obj.equation;
    }
}
}