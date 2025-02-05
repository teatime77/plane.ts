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
        equation : equation, 
        terms : refvars
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