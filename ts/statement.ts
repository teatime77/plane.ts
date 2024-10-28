namespace plane_ts {
//
type Term = parser_ts.Term;
const parseMath = parser_ts.parseMath;
const TT = i18n_ts.TT;

export class Statement extends AbstractShape {
    static idTimeout : number | undefined;

    mathText : string = "";
    texDiv? : HTMLDivElement;
    selectedShapes : AbstractShape[];

    constructor(obj : { narration? : string, shapes : AbstractShape[], mathText? : string }){
        super(obj);
        this.selectedShapes = obj.shapes;
        if(obj.mathText != undefined){
            this.mathText = obj.mathText;
        }
    }

    dependencies() : Shape[] {
        return this.selectedShapes as Shape[];
    }

    getProperties(){
        return super.getProperties().concat([
            "selectedShapes", "mathText"
        ]);
    }

    reading() : Reading {
        return new Reading(this, this.narration, []);
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            shapes : this.selectedShapes.map(x => x.toObj())
        });

        if(this.mathText != ""){
            obj.mathText = this.mathText;
        }

        return obj;
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

        if(this.texDiv == undefined){
            this.texDiv = document.createElement("div");
            Plane.one.text_block.div.append(this.texDiv);    
        }

        parser_ts.renderKatexSub(this.texDiv, tex_text);
    }

    setMathText(value : string){
        this.mathText = value;

        if(Statement.idTimeout != undefined){
            clearTimeout(Statement.idTimeout);
        }
        
        Statement.idTimeout = setTimeout(this.showMathText.bind(this), 500);
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