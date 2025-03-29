namespace plane_ts {
//

const parseMath = parser_ts.parseMath;

export const enumSelectionClassName = "enum_selection_item";

export type menuDialogType = typeof LengthEqualityReason | typeof AngleEqualityReason | typeof ShapeType | 
typeof ParallelogramReason | typeof RhombusReason | typeof IsoscelesTriangleReason | typeof ParallelReason | typeof ShapeEquationReason | typeof ExprTransformReason | typeof PropositionReason;
export const menuDialogs = new Map<menuDialogType, layout_ts.Dialog>();

export enum TriangleCongruenceReason {
    none,
    side_side_side,
    side_angle_side,
    angle_side_angle,
};

export enum ShapeEquationReason {
    none = 50,
    sum_of_angles_is_pi,
    sum_of_angles_is_equal,
    sum_of_lengths_is_equal,
    sum_of_interior_angles_of_triangle_is_pi,
    sum_of_interior_angles_of_quadrilateral_is_2pi,
    exterior_angle_theorem,
}

export enum LengthEqualityReason {
    none = 100,
    radii_equal,
    common_circle,
    parallel_lines_distance,
    not_used,
    congruent_triangles,
    parallelogram_opposite_sides,
    parallelogram_diagonal_bisection,
    equivalence_class,
    midpoint,
};

export enum ExprTransformReason {
    none = 150,
    transposition,
    equality,
    add_equation,
    substitution,
    dividing_equation,
    arg_shift,
}

export enum AngleEqualityReason {
    none = 200,
    vertical_angles,
    parallel_line_angles,
    angle_bisector,
    congruent_triangles,
    parallelogram_opposite_angles,
    similar_triangles,
    isosceles_triangle_base_angles,
}

export enum PropositionReason {
    none = 250,
    angle_equality,
    length_equality,
    equation,
}

export enum TriangleQuadrilateralClass {
    none = 300,
    trapezoid,
    parallelogram,
    rhombus,
    isoscelesTriangle,
}

export enum ParallelogramReason {
    none = 400,
    each_opposite_sides_are_equal,
    each_opposite_sides_are_parallel,
    each_opposite_angles_are_equal,
    one_opposite_sides_are_parallel_and_equal,
    each_diagonal_bisections,
}

export enum RhombusReason {
    none = 500,
    all_sides_are_equal,
}

export enum IsoscelesTriangleReason {
    none = 520,
    two_sides_are_equal,
}

export enum ParallelReason {
    none = 600,
    parallelogram,
    corresponding_angles_or_alternate_angles_are_equal,
    supplementary_angles,
}

export enum TriangleSimilarityReason {
    none = 700,
    two_equal_angle_pairs,
};

export enum ShapeType {
    parallelogram = 800,
    rhombus,
    isosceles_triangle,
}

export const enumToImgName = new Map<number, string>([
    [ TriangleCongruenceReason.side_side_side, "side_side_side" ],
    [ TriangleCongruenceReason.side_angle_side, "side_angle_side" ],
    [ TriangleCongruenceReason.angle_side_angle, "angle_side_angle" ],

    [ ShapeEquationReason.sum_of_angles_is_pi, "sum_of_angles_is_pi" ],
    [ ShapeEquationReason.sum_of_angles_is_equal, "sum_of_angles_is_equal" ],
    [ ShapeEquationReason.sum_of_lengths_is_equal, "sum_of_lengths_is_equal" ],
    [ ShapeEquationReason.sum_of_interior_angles_of_triangle_is_pi, "sum_of_interior_angles_of_triangle_is_pi" ],
    [ ShapeEquationReason.sum_of_interior_angles_of_quadrilateral_is_2pi, "sum_of_interior_angles_of_quadrilateral_is_2pi" ],
    [ ShapeEquationReason.exterior_angle_theorem, "exterior_angle_theorem" ],

    [ LengthEqualityReason.radii_equal, "radii_equal" ],
    [ LengthEqualityReason.common_circle, "common_circle" ],
    [ LengthEqualityReason.parallel_lines_distance, "parallel_lines_distance" ],
    [ LengthEqualityReason.congruent_triangles, "triangle_congruence" ],
    [ LengthEqualityReason.parallelogram_opposite_sides, "each_opposite_sides_are_equal" ],
    [ LengthEqualityReason.parallelogram_diagonal_bisection, "each_diagonal_bisections" ],
    [ LengthEqualityReason.equivalence_class, "equivalence_class" ],
    [ LengthEqualityReason.midpoint, "midpoint" ],

    [ ExprTransformReason.transposition, "transposition" ],
    [ ExprTransformReason.equality, "equality" ],
    [ ExprTransformReason.add_equation, "add_equation" ],
    [ ExprTransformReason.substitution, "substitution" ],
    [ ExprTransformReason.dividing_equation, "dividing_equation" ],
    [ ExprTransformReason.arg_shift, "arg_shift" ],

    [ AngleEqualityReason.vertical_angles, "vertical_angles" ],
    [ AngleEqualityReason.parallel_line_angles, "parallel_line_angles" ],
    [ AngleEqualityReason.angle_bisector, "angle_bisector" ],
    [ AngleEqualityReason.congruent_triangles, "triangle_congruence" ],
    [ AngleEqualityReason.parallelogram_opposite_angles, "each_opposite_angles_are_equal" ],
    [ AngleEqualityReason.similar_triangles, "triangle_similarity" ],
    [ AngleEqualityReason.isosceles_triangle_base_angles, "isosceles_triangle_base_angles" ],

    [ TriangleQuadrilateralClass.trapezoid, "" ],
    [ TriangleQuadrilateralClass.parallelogram, "quadrilateral_classifier" ],
    [ TriangleQuadrilateralClass.rhombus, "all_sides_are_equal" ],

    [ ParallelogramReason.each_opposite_sides_are_equal, "each_opposite_sides_are_equal" ],
    [ ParallelogramReason.each_opposite_sides_are_parallel, "each_opposite_sides_are_parallel" ],
    [ ParallelogramReason.each_opposite_angles_are_equal, "each_opposite_angles_are_equal" ],
    [ ParallelogramReason.one_opposite_sides_are_parallel_and_equal, "one_opposite_sides_are_parallel_and_equal" ],
    [ ParallelogramReason.each_diagonal_bisections, "each_diagonal_bisections" ],

    [ RhombusReason.all_sides_are_equal, "all_sides_are_equal" ],

    [ IsoscelesTriangleReason.two_sides_are_equal, "isosceles_triangle" ],

    [ ParallelReason.parallelogram, "quadrilateral_classifier" ],
    [ ParallelReason.corresponding_angles_or_alternate_angles_are_equal, "parallel_line_angles" ],
    [ ParallelReason.supplementary_angles, "parallel_by_supplementary_angles" ],

    [ TriangleSimilarityReason.two_equal_angle_pairs, "two_equal_angle_pairs" ],

    [ ShapeType.parallelogram, "quadrilateral_classifier" ],
    [ ShapeType.rhombus, "all_sides_are_equal" ],
    [ ShapeType.isosceles_triangle, "isosceles_triangle"],

    [ PropositionReason.angle_equality, "equal_angle" ],
    [ PropositionReason.length_equality, "equal_length" ],
    [ PropositionReason.equation, "expr_transform" ],
]);

export async function makeSelectionDlg(){    
    const data : [string, string, (typeof LengthEqualityReason | typeof AngleEqualityReason | typeof ShapeType | 
        typeof ParallelogramReason | typeof RhombusReason | typeof IsoscelesTriangleReason | typeof ParallelReason | typeof ShapeEquationReason | typeof ExprTransformReason | typeof PropositionReason)][] = [ 
        [ TT("Reason for length equality"), "length-equality-reason", LengthEqualityReason ],
        [ TT("Reason for angle equality" ), "angle-equality-reason" , AngleEqualityReason ],
        [ TT("Shape type"                ), "shape-type"            , ShapeType ],
        [ TT("Reason for parallelogram"  ), "parallelogram-reason"  , ParallelogramReason ],
        [ TT("Reason for rhombus"        ), "rhombus-reason"        , RhombusReason ], 
        [ TT("Reason for isosceles triangle"), "isosceles-triangle-reason", IsoscelesTriangleReason ],
        [ TT("Reason for parallel"       ), "parallel-reason"       , ParallelReason ], 
        [ TT("Equation derived from shapes" ), "shape-equation-reason"       , ShapeEquationReason ], 
        [ TT("Types of formula transformation"), "expr-transform-reason", ExprTransformReason ], 
        [ TT("Types of proposition"), "proposition-reason", PropositionReason ], 
    ];

    const titles = data.map(x => x[0]);
    const span_id_prefixes = data.map(x => x[1]);
    const dics = data.map(x => x[2]);

    menuDialogs.clear();
    for(const [idx, dic] of dics.entries()){
        const children : layout_ts.UI[] = [];

        const title = layout_ts.$label({
            text : titles[idx],
            borderWidth : 5,
            borderStyle : "ridge",
            padding : 5,
        });
        children.push(title);

        for(const [key, value] of Object.entries(dic)){
            if (isNaN(Number(key))){
                if(["none", "not_used"].includes(key)){
                    continue;
                }

                let img_name = enumToImgName.get(value);
                assert(img_name != undefined && img_name != "");

                // console.log(`of key:[${key}]${typeof key} value:[${value}]${typeof value} dic[value]:[${dic[value]}]`); 
                const img = layout_ts.$img({
                    id     : `${span_id_prefixes[idx]}-${key}`,
                    className : enumSelectionClassName,
                    imgUrl : `./lib/plane/img/${img_name}.png`,
                    width  : "64px",
                    height : "64px",
                    borderWidth : 5,
                    borderStyle : "ridge",
                    horizontalAlign : "center",
                });
                img.html().dataset.operation_value = `${value}`;
                // img.html().style.position = "";

                children.push(img);
            }
        }

        const grid = layout_ts.$grid({
            children : children
        });

        const dlg = layout_ts.$dialog({
            content : grid
        });

        menuDialogs.set(dic, dlg);
    }
}

export class Assumption extends MathEntity {
    mathText : string = "";
    expression! : App;
    textBlock : TextBlock | undefined;

    constructor(){
        super({});
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        if(this.textBlock != undefined){
            shapes.push(this.textBlock!);
        }
    }

    reading() : Reading {
        // msg(`empty reading:${this.constructor.name}`);
        return new Reading(this, "", []);
    }

    setMathText(value : string){
        this.mathText = value;
        this.expression = parser_ts.parseMath(this.mathText) as App;

        if(this.textBlock == undefined){
            this.textBlock = makeEquationTextBlock(this.expression);
        }
        else{
            this.textBlock.setTextApp(this.mathText, this.expression);
        }
    }
}

export class Statement extends Shape {
    static idTimeout : number | undefined;

    reason : number = 0;
    mathText : string = "";
    latexBox? : layout_ts.LaTeXBox;
    auxiliaryShapes : MathEntity[] = [];
    selectedShapes : MathEntity[];

    constructor(obj : { reason? : number, shapes : MathEntity[], auxiliaryShapes? : MathEntity[], mathText? : string }){
        super(obj);
        this.selectedShapes = obj.shapes;

        if(obj.reason != undefined){
            this.reason = obj.reason;
        }

        if(obj.auxiliaryShapes != undefined){
            this.auxiliaryShapes = obj.auxiliaryShapes;
        }

        if(obj.mathText != undefined){
            this.mathText = obj.mathText;
        }
    }

    dependencies() : MathEntity[] {
        return this.selectedShapes as Shape[];
    }

    getProperties(){
        return super.getProperties().concat([
            "reason", "selectedShapes", "auxiliaryShapes", "mathText"
        ]);
    }

    reading() : Reading {
        // msg(`empty reading:${this.constructor.name}`);
        return new Reading(this, "", []);
    }    

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            shapes : this.selectedShapes.map(x => x.toObj())
        });

        if(this.reason != 0){
            obj.reason = this.reason;
        }

        if(this.auxiliaryShapes.length != 0){
            obj.auxiliaryShapes = this.auxiliaryShapes.map(x => x.toObj());
        }

        if(this.mathText != ""){
            obj.mathText = this.mathText;
        }

        return obj;
    }

    makeTexUI() : layout_ts.LaTeXBox {
        return new layout_ts.LaTeXBox({
            parent : Plane.one.text_block,
            text : "",
            click : async (ev : MouseEvent)=>{
                const position = View.current.eventPosition(ev);
                await (Builder.tool as StatementBuilder).clickWithMouseEvent(ev, View.current, position, this);
            }
        });
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(... this.selectedShapes);
        shapes.push(... this.auxiliaryShapes);
    }

    showMathText(){
        Statement.idTimeout = undefined;

        let term : Term;
        try{

            term = parseMath(this.mathText);
        }
        catch(e){
            if(e instanceof parser_ts.SyntaxError){
                return;
            }

            throw e;
        }
        const tex_text = term.tex();

        if(this.latexBox == undefined){
            this.latexBox = this.makeTexUI();
        }

        this.latexBox.setText(tex_text);
    }

    setMathText(value : string){
        this.mathText = value;

        if(Statement.idTimeout != undefined){
            clearTimeout(Statement.idTimeout);
        }
        
        Statement.idTimeout = setTimeout(this.showMathText.bind(this), 500);
    }

    setMode(mode : Mode){
        super.setMode(mode);
        if(this.latexBox != undefined){
            const color = (mode == Mode.none ? "transparent" : getModeColor(mode));

            this.latexBox.setBorderColor(color);
        }
    }

    draw() : void {
        const shapes = this.auxiliaryShapes.concat(this.selectedShapes).filter(x => x instanceof Shape) as Shape[];
        shapes.filter(x => x.mode != Mode.none).forEach(x => x.draw());
    }

    show(){    
        if(this.latexBox != undefined){
            this.latexBox.show();
        }
    }

    hide(){        
        if(this.latexBox != undefined){
            this.latexBox.hide();
        }
    }

    async showReasonAndStatement(speech : AbstractSpeech){
        if(this.reason != 0){

            await speakReason(speech, this.reason);

            if([LengthEqualityReason.congruent_triangles, AngleEqualityReason.congruent_triangles].includes(this.reason)){
                assert( this.auxiliaryShapes.every(x => x instanceof Triangle) );

                for(const [i, shape] of this.auxiliaryShapes.entries()){
                    shape.setMode(i == 0 ? Mode.target1 : Mode.target2);
                    await sleep(500);
                }    
            }
            else{

                await showAuxiliaryShapes(this.reason, this.auxiliaryShapes);
            }

            await speech.waitEnd();
        }

        const reading = this.reading();
        await speech.speak(reading.text);

        if(this instanceof TriangleCongruence){
            assert( this.selectedShapes.every(x => x instanceof Triangle) );

            for(const [i, shape] of this.selectedShapes.entries()){
                shape.setMode(i == 0 ? Mode.target1 : Mode.target2);
                await sleep(500);
            }
        }
        else{
            for(const shape of this.selectedShapes){
                shape.setMode(Mode.target);
                await sleep(500);
            }
        }
        
        await speech.waitEnd();
    }

    setRelations(): void {
        super.setRelations();

        this.auxiliaryShapes.forEach(x => x.setRelations());
        this.selectedShapes.forEach(x => x.setRelations());

        usedReasons.add(this.reason);
        // if(this.reason == 0){

        //     msg(`used 0 [${this.constructor.name}]`);
        // }
        // else{

        //     msg(`used [${reasonMsg(this.reason)}]`);
        // }
    }
}

export async function speakReason(speech : AbstractSpeech, reason : number) {
    const reason_msg = reasonMsg(reason);
    await speech.speak(reason_msg);
}

export async function showAuxiliaryShapes(reason : number, auxiliaryShapes : MathEntity[]){
    switch(reason){
    case ParallelogramReason.each_opposite_sides_are_equal:
    case ParallelogramReason.each_opposite_sides_are_parallel:
    case ParallelogramReason.each_opposite_angles_are_equal:
    case ParallelogramReason.each_diagonal_bisections:
        assert(auxiliaryShapes.length == 4);

        for(const shape of auxiliaryShapes.slice(0, 2)){
            shape.setMode(Mode.depend1);
        }
        await sleep(500);

        for(const shape of auxiliaryShapes.slice(2)){
            shape.setMode(Mode.depend2);
        }
        break;

    case ParallelogramReason.one_opposite_sides_are_parallel_and_equal:
    case RhombusReason.all_sides_are_equal:
        auxiliaryShapes.forEach(x => x.setMode(Mode.depend));
        break;

    default:
        for(const shape of auxiliaryShapes){
            shape.setMode(Mode.depend);
            await sleep(500);
        }
        break;
    }

    await sleep(500);
}


}