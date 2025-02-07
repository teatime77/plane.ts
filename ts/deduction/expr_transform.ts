namespace plane_ts {
//
export function makeExprTransformByTransposition(term : Term){
    const [equation, term_cp] = term.cloneRoot();
    algebra_ts.transpose(equation, term_cp);

    const exprTransform = new ExprTransform({
        reason   : ExprTransformReason.transposition,
        equation : equation, 
        terms : [term_cp]
    });

    return exprTransform;
}

export function makeExprTransformByEquality(terms : Term[]) : ExprTransform | undefined {
    const refvars : RefVar[] = [];
    let   eq_expr : Term | undefined;    

    for(const term of terms){
        const [equation, term_cp] = term.cloneRoot();
        if(!(term_cp instanceof RefVar)){
            return undefined;
        }


        if(!equation.isEq() || equation.args.length != 2){
            return undefined;
        }

        const term_idx = equation.args.indexOf(term_cp);
        if(term_idx == -1){
            return undefined;
        }

        const expr = equation.args[1 - term_idx];
        if(eq_expr == undefined){
            eq_expr = expr;
        }
        else{
            if(!eq_expr.equal(expr)){
                return undefined;
            }
        }

        refvars.push(term_cp);
    }

    const text = refvars.map(x => x.name).join(" = ");
    const equation = parser_ts.parseMath(text) as App;

    const exprTransform = new ExprTransform({
        reason   : ExprTransformReason.equality,
        equation : equation, 
        terms : refvars
    });

    return exprTransform;
}

export class ExprTransform extends MathEntity {
    reason : ExprTransformReason;
    equation : App;
    terms : Term[];
    textBlock : TextBlock;

    constructor(obj : { reason : ExprTransformReason, equation : App, terms : Term[]} ){
        super(obj);
        this.reason   = obj.reason;
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

    async speakExprTransform(speech : i18n_ts.AbstractSpeech){
        let text : string;
        switch(this.reason){
        case ExprTransformReason.transposition:
            text = TT("Transpose the term.");
            break;

        case ExprTransformReason.equality:
            text = TT("From the above equations,");
            break;

        default:
            throw new MyError();
        }        

        await speech.speak(text);
    }
}
}