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
        if( range(angles.length - 1).every(i => angles[i].lineB == angles[i + 1].lineA && angles[i].directionB == angles[i + 1].directionA) ){
            const [first_angle, last_angle] = [ angles[0], last(angles) ];
            if(first_angle.lineA == last_angle.lineB && first_angle.directionA == - last_angle.directionB){

                const text = angles.map(x => x.name).join(" + ") + " = pi";
                // const s = angles.map(x => x.name).join(" + ");
                // const text =  `(${s})/(${s}) = pi`;
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

export function makeShapeEquation(reason : ShapeEquationReason, shapes: Shape[]) : ShapeEquation | undefined {
    switch(reason){
    case ShapeEquationReason.sum_of_angles_is_pi:{
        if(! shapes.every(x => x instanceof Angle)){
            msg(TT("The selected shape is not an angle."));
            return undefined;
        }
        const angles = shapes as Angle[];

        const intersections = unique(angles.map(x => intersection));
        if(intersections.length != 1){
            msg(TT("Corner vertices do not match."));
            return undefined;
        }

        return makeSumOfAnglesIsPi(shapes as Angle[]);
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