namespace plane_ts {
//
export async function makeExprTransformByTransposition(term : Term, textBlock : TextBlock, speech : Speech){
    const [equation, term_cp] = term.cloneRoot();
    await algebra_ts.transpose(equation, term_cp, textBlock.div, speech);

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
        // msg(`eq angles:${ref_shapes.map(x => x.name).join(" = ")}`);
        for(const i of range(ref_shapes.length - 1)){
            const angleA = ref_shapes[i] as Angle;
            const angleB = ref_shapes[i+1] as Angle;
            addEqualAngles(angleA, angleB);
        }
    }
}

/*
    a = e , b = e ⇒ a = b
*/
export async function makeExprTransformByEquality(terms : Term[], textBlocks : TextBlock[], speech : Speech) : Promise<ExprTransform | undefined> {
    const refvars : RefVar[] = [];
    let   eq_expr : Term | undefined;    
    let   roots : App[] = [];

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
        roots.push(term.getRoot());
    }

    for(const [idx, term] of terms.entries()){
        term.colorName = "blue";
        renderKatexSub(textBlocks[idx].div, roots[idx].tex());
    }
    await sleep(1000);
    refvars.forEach(x => x.colorName = undefined);

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

export async function makeExprTransformByAddEquation(terms : Term[], textBlocks : TextBlock[], speech : Speech) : Promise<ExprTransform | undefined> {
    const divs = textBlocks.map(x => x.div);
    const equation = await algebra_ts.addEquations(terms, divs, speech);

    const exprTransform = new ExprTransform({
        reason   : ExprTransformReason.add_equation,
        equation : equation, 
        terms
    });

    return exprTransform;
}

export async function makeExprTransformBySubstitution(terms : Term[], textBlocks : TextBlock[], speech : Speech) : Promise<ExprTransform | undefined> {
    const equation = await algebra_ts.substitute(terms[0], terms[1], textBlocks[0].div, textBlocks[1].div, speech);

    const exprTransform = new ExprTransform({
        reason   : ExprTransformReason.substitution,
        equation : equation, 
        terms
    });

    return exprTransform;
}

export async function makeExprTransformByDividingEquation(root : App, mathText : string, textBlock : TextBlock, speech : Speech) : Promise<ExprTransform | undefined> {
    const term = parser_ts.parseMath(mathText);
    const equation = await algebra_ts.divideEquation(root, term, textBlock.div, speech);

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

    getProperties(){
        return super.getProperties().concat([
            "reason", "equation", "terms"
        ]);
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.textBlock);
    }

    reading() : Reading {
        // msg(`empty reading:${this.constructor.name}`);
        return new Reading(this, "", []);
    }

    async speakExprTransform(speech : i18n_ts.AbstractSpeech){
        const text = reasonMsg(this.reason);

        await speech.speak(text);
    }
}
}