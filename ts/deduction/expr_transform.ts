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

function setEqualShapes(refvars : RefVar[]){
    const map = new Map<string, Shape>();
    View.current.allRealShapes().filter(x => x.name != "").forEach(x => map.set(x.name, x));
    const ref_shapes = refvars.map(x => map.get(x.name)).filter(x => x != undefined);
    if(ref_shapes.every(x => x instanceof Angle)){
        msg(`eq angles:${ref_shapes.map(x => x.name).join(" = ")}`);
        for(const i of range(ref_shapes.length - 1)){
            const angleA = ref_shapes[i] as Angle;
            const angleB = ref_shapes[i+1] as Angle;
            addEqualAngles(angleA, angleB);
        }
    }
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

    setEqualShapes(refvars);

    const exprTransform = new ExprTransform({
        reason   : ExprTransformReason.equality,
        equation : equation, 
        terms : refvars
    });

    return exprTransform;
}

export function makeExprTransformByAddEquation(terms : Term[]) : ExprTransform | undefined {
    const equation = algebra_ts.addEquations(terms);

    const exprTransform = new ExprTransform({
        reason   : ExprTransformReason.add_equation,
        equation : equation, 
        terms
    });

    return exprTransform;
}

export function makeExprTransformBySubstitution(terms : Term[]) : ExprTransform | undefined {
    const equation = algebra_ts.substitute(terms[0], terms[1]);

    const exprTransform = new ExprTransform({
        reason   : ExprTransformReason.substitution,
        equation : equation, 
        terms
    });

    return exprTransform;
}

export function makeExprTransformByDividingEquation(root : App, mathText : string) : ExprTransform | undefined {
    const term = parser_ts.parseMath(mathText);
    const equation = algebra_ts.divideEquation(root, term);

    const exprTransform = new ExprTransform({
        reason   : ExprTransformReason.dividing_equation,
        equation, 
        terms    : [root, term]
    });

    return exprTransform;
}

export class ExprTransform extends MathEntity implements EquationTextBlock {
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
        msg(`empty reading:${this.constructor.name}`);
        return new Reading(this, "", []);
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

        case ExprTransformReason.add_equation:
            text = TT("Add two equations together.");
            break;

        case ExprTransformReason.substitution:
            text = TT("Substitute the term.");
            break;

        case ExprTransformReason.dividing_equation:
            text = TT("Dividing an equation by the same term.");
            break;

        default:
            throw new MyError();
        }        

        await speech.speak(text);
    }
}
}