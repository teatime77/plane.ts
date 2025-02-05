namespace plane_ts {
//
export function makeExprTransformByTransposition(term : Term){
    const [equation, term_cp] = term.cloneRoot();
    algebra_ts.transpose(equation, term_cp);

    const exprTransform = new ExprTransform({
        equation : equation, 
        terms : [term_cp]
    });

    return exprTransform;
}

export class ExprTransform extends MathEntity {
    equation : App;
    terms : Term[];
    textBlock : TextBlock;

    constructor(obj : {equation : App, terms : Term[]} ){
        super(obj);
        this.equation = obj.equation;
        this.terms    = obj.terms;
        this.textBlock = makeEquationTextBlock(this.equation);
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.textBlock);
    }

    reading() : Reading {
        throw new MyError();
    }

    async speakExprTransform(){

    }
}
}