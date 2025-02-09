namespace plane_ts {
//

const parseMath = parser_ts.parseMath;

export const enumSelectionClassName = "enum_selection_item";

export let lengthEqualityReasonDlg : HTMLDialogElement;
export let angleEqualityReasonDlg : HTMLDialogElement;
export let parallelReasonDlg : HTMLDialogElement;


export let shapeTypeDlg : HTMLDialogElement;
export let parallelogramReasonDlg : HTMLDialogElement;
export let rhombusReasonDlg : HTMLDialogElement;

export let shapeEquationReasonDlg : HTMLDialogElement;
export let exprTransformReasonDlg : HTMLDialogElement;

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
}

export enum LengthEqualityReason {
    none = 100,
    radii_equal,
    common_circle,
    parallel_lines_distance,
    circle_by_radius,
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
}

export enum AngleEqualityReason {
    none = 200,
    vertical_angles,
    parallel_lines,
    angle_bisector,
    congruent_triangles,
    parallelogram_opposite_angles,
    similar_triangles,
}

export enum QuadrilateralClass {
    none = 300,
    trapezoid,
    parallelogram,
    rhombus
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

export enum ParallelReason {
    none = 600,
    parallelogram
}

export enum TriangleSimilarityReason {
    none = 700,
    two_equal_angle_pairs,
};

export enum ShapeType {
    parallelogram = 800,
    rhombus
}


export function makeSelectionDlg(){    
    const data : [string, string, (typeof LengthEqualityReason | typeof AngleEqualityReason | typeof ShapeType | 
        typeof ParallelogramReason | typeof RhombusReason | typeof ParallelReason | typeof ShapeEquationReason | typeof ExprTransformReason)][] = [ 
        [ "reason for length equality", "length-equality-reason", LengthEqualityReason ],
        [ "reason for angle equality" , "angle-equality-reason" , AngleEqualityReason ],
        [ "shape type"                , "shape-type"            , ShapeType ],
        [ "reason for parallelogram"  , "parallelogram-reason"  , ParallelogramReason ],
        [ "reason for rhombus"        , "rhombus-reason"        , RhombusReason ], 
        [ "reason for parallel"       , "parallel-reason"       , ParallelReason ], 
        [ "reason for shape equation"       , "shape-equation-reason"       , ShapeEquationReason ], 
        [ "reason for expression transformation", "expr-transform-reason", ExprTransformReason ], 
    ];

    const titles = data.map(x => x[0]);
    const span_id_prefixes = data.map(x => x[1]);
    const dics = data.map(x => x[2]);

    for(const [idx, dic] of dics.entries()){
        const dlg = document.createElement("dialog");
        dlg.className = "menu_dlg";

        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.flexDirection = "column";

        const title = document.createElement("span");
        title.innerText = titles[idx];
        div.append(title);

        for(const [key, value] of Object.entries(dic)){
            if (isNaN(Number(key))){
                // console.log(`of key:[${key}]${typeof key} value:[${value}]${typeof value} dic[value]:[${dic[value]}]`); 
                const span = document.createElement("span");
                span.id = `${span_id_prefixes[idx]}-${key}`;
                span.innerText = key;
                span.className = enumSelectionClassName;
                span.dataset.enum_value = `${value}`;

                div.append(span);
            }
        }

        switch(idx){
        case 0:
            lengthEqualityReasonDlg = dlg;
            break;
        case 1:
            angleEqualityReasonDlg = dlg;
            break;
        case 2:
            shapeTypeDlg = dlg;
            break;
        case 3:
            parallelogramReasonDlg = dlg;
            break;
        case 4:
            rhombusReasonDlg = dlg;
            break;
        case 5:
            parallelReasonDlg = dlg;
            break;
        case 6:
            shapeEquationReasonDlg = dlg;
            break;
        case 7:
            exprTransformReasonDlg = dlg;
        }

        dlg.append(div);
        document.body.append(dlg);
    }
}

export class Statement extends Shape {
    static idTimeout : number | undefined;

    reason : number = 0;
    mathText : string = "";
    latexBox? : layout_ts.LaTeXBox;
    auxiliaryShapes : MathEntity[] = [];
    selectedShapes : MathEntity[];

    constructor(obj : { narration? : string, reason? : number, shapes : MathEntity[], auxiliaryShapes? : MathEntity[], mathText? : string }){
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
        return new Reading(this, this.narration, []);
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

    async showAuxiliaryShapes(){
        for(const shape of this.auxiliaryShapes){
            shape.setMode(Mode.depend);
            await sleep(500);
        }
    }

    async showReasonAndStatement(speech : i18n_ts.AbstractSpeech){
        if(this.reason != 0){

            const reason_msg = reasonMsg(this.reason);
            await speech.speak(reason_msg);

            if([LengthEqualityReason.congruent_triangles, AngleEqualityReason.congruent_triangles].includes(this.reason)){
                assert( this.auxiliaryShapes.every(x => x instanceof Triangle) );

                for(const [i, shape] of this.auxiliaryShapes.entries()){
                    shape.setMode(i == 0 ? Mode.target1 : Mode.target2);
                    await sleep(500);
                }    
            }
            else{

                await this.showAuxiliaryShapes();
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
    }
}

/*
These two lines are parallel.
These two angles are equal.
The sum of these two angles is 180 degrees.
These two lines are equal in length.
The two triangles are congruent.

These two lines are radii of a circle.

therefore



The radii of these two circles are equal

For two triangles

The three sides of the two triangles are equal in length.

We now prove the following.

Two corresponding angles are equal.

The sum of the two angles is 180 degrees, so each angle is 90 degrees.

Angle bisector

Perpendicular bisector

The two corresponding sides of a triangle are equal.

The angles between the two sides are equal

*/
}