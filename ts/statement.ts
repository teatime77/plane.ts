namespace plane_ts {
//
type Term = parser_ts.Term;
const parseMath = parser_ts.parseMath;
export let lengthEqualityReasonDlg : HTMLDialogElement;
export let angleEqualityReasonDlg : HTMLDialogElement;
export let parallelReasonDlg : HTMLDialogElement;


export let shapeTypeDlg : HTMLDialogElement;
export let parallelogramReasonDlg : HTMLDialogElement;
export let rhombusReasonDlg : HTMLDialogElement;

export enum TriangleCongruenceReason {
    none,
    side_side_side,
    side_angle_side,
    angle_side_angle,
};

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
}

export enum ShapeType {
    parallelogram,
    rhombus
}

export enum AngleEqualityReason {
    none = 200,
    vertical_angles,
    parallel_lines,
    angle_bisector,
    congruent_triangles,
    parallelogram_opposite_angles
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

export enum ImplicationCode {
    none,
    equal_angles,
    equal_lengths,
};

export function makeSelectionDlg(){
    const titles = [ "reason for length equality", "reason for angle equality", "shape type", "reason for parallelogram", "reason for rhombus", "reason for parallel" ];
    const span_id_prefixes = [ "length-equality-reason", "angle-equality-reason", "shape-type", "parallelogram-reason", "rhombus-reason", "parallel-reason" ]

    for(const [idx, dic] of [ LengthEqualityReason, AngleEqualityReason, ShapeType, ParallelogramReason, RhombusReason, ParallelReason ].entries()){
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
                console.log(`of key:[${key}]${typeof key} value:[${value}]${typeof value} dic[value]:[${dic[value]}]`); 
                const span = document.createElement("span");
                span.id = `${span_id_prefixes[idx]}-${key}`;
                span.innerText = key;
                span.className = "menu_item";

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
                (Builder.tool as StatementBuilder).click(ev, View.current, position, this);
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

    setIndex(){
        const selected_shapes =  this.selectedShapes.filter(x => x instanceof SelectedShape) as SelectedShape[];
        for(const [idx, shape] of selected_shapes.entries()){
            shape.index = idx;
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

            await this.showAuxiliaryShapes();

            await speech.waitEnd();
        }

        const reading = this.reading();
        await speech.speak(reading.text);

        for(const shape of this.selectedShapes){
            shape.setMode(Mode.target);
            sleep(500);
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