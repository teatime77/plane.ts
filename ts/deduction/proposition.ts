namespace plane_ts {
//
export abstract class Proposition extends Statement {
    constructor(obj : { reason? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[] }){
        super(obj);

        propositions.push(this);
    }
}

export class ShapeProposition extends Statement {
    constructor(obj : { reason? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[] }){
        super(obj);
    }
}

export class EquationProposition extends Statement implements EquationTextBlock {
    equation  : App;
    textBlock : TextBlock;

    constructor(obj : { reason? : number, auxiliaryShapes? : MathEntity[], shapes : MathEntity[], equation : App }){
        super(obj);

        this.equation = obj.equation;

        assert(this.selectedShapes.length == 1 && this.selectedShapes[0] instanceof TextBlock);
        this.textBlock = this.selectedShapes[0] as TextBlock;
    }
}

export function makeShapeProposition(reason : PropositionReason, shapes: (Angle | LengthSymbol)[]) : ShapeProposition {
    return new ShapeProposition({
        reason,
        auxiliaryShapes : [],
        shapes,
    });
}


export function makeEquationProposition(reason : PropositionReason, mathText : string) : EquationProposition | undefined {
    const equation = parser_ts.parseMath(mathText) as App;
    assert(equation.isRootEq());

    return new EquationProposition({
        reason,
        auxiliaryShapes : [],
        shapes : [],
        equation
    });
}

}