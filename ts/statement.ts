namespace plane_ts {
//
type Term = parser_ts.Term;
const parseMath = parser_ts.parseMath;

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
    parallel_lines,
    circle_by_radius,
}

export enum AngleEqualityReason {
    none = 200,
    vertical_angle,
    parallel_lines,
    angle_bisector,
}

export enum ImplicationCode {
    none,
    equal_angles,
    equal_lengths,
};

export const ImplicationTexts : string[] = [
    "none",
    "equal-angles",
    "equal-lengths",
];

export const textMap = new Map<number,string>([
    [ TriangleCongruenceReason.none, "none" ],
    [ TriangleCongruenceReason.side_side_side, "side_side_side" ],
    [ TriangleCongruenceReason.side_angle_side, "side_angle_side" ],
    [ TriangleCongruenceReason.angle_side_angle, "angle_side_angle" ],

    [ LengthEqualityReason.none, "none" ],
    [ LengthEqualityReason.radii_equal, "radii_equal" ],
    [ LengthEqualityReason.common_circle, "common_circle" ],
    [ LengthEqualityReason.parallel_lines, "parallel_lines" ],
    [ LengthEqualityReason.circle_by_radius, "circle_by_radius" ],

    [ AngleEqualityReason.none, "none" ],
    [ AngleEqualityReason.vertical_angle, "vertical_angle" ],
    [ AngleEqualityReason.parallel_lines, "parallel_lines" ],
    [ AngleEqualityReason.angle_bisector, "angle_bisector" ],
]);

export class Statement extends MathEntity {
    static idTimeout : number | undefined;

    reason : number = 0;
    implication : number = 0;
    mathText : string = "";
    latexBox? : layout_ts.LaTeXBox;
    auxiliaryShapes : MathEntity[] = [];
    selectedShapes : MathEntity[];

    constructor(obj : { narration? : string, reason? : number, implication? : number, shapes : MathEntity[], auxiliaryShapes? : MathEntity[], mathText? : string }){
        super(obj);
        this.selectedShapes = obj.shapes;

        if(obj.reason != undefined){
            this.reason = obj.reason;
        }

        if(obj.implication != undefined){
            this.implication = obj.implication;
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
            "reason", "implication", "selectedShapes", "auxiliaryShapes", "mathText"
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

        if(this.implication != 0){
            obj.implication = this.implication;
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
            let color : string;

            switch(mode){
            case Mode.none   : color = "transparent"; break;
            case Mode.depend : color = "blue"       ; break;
            case Mode.target : color = "red"        ; break;
            }

            this.latexBox.setBorderColor(color);
        }
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