namespace plane_ts {
//
type Term = parser_ts.Term;
const parseMath = parser_ts.parseMath;
const TT = i18n_ts.TT;

export class Statement extends AbstractShape {
    expression_str : string = "";
    expression? : Term;
    texDiv? : HTMLDivElement;
    selectedShapes : AbstractShape[];

    constructor(obj : { narration? : string, shapes : AbstractShape[], expression_str? : string }){
        super(obj);
        this.selectedShapes = obj.shapes;
        if(obj.expression_str != undefined){
            this.expression_str = obj.expression_str;
            this.expression = parseMath(this.expression_str);

            this.texDiv = document.createElement("div");
            // layout_ts.renderKatexSub(this.texDiv, this.text);
        }
    }

    dependencies() : Shape[] {
        return this.selectedShapes as Shape[];
    }

    getProperties(){
        return super.getProperties().concat([
            "selectedShapes", "expression_str"
        ]);
    }

    reading() : Reading {
        return new Reading(this, this.narration, []);
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            shapes : this.selectedShapes.map(x => x.toObj())
        });

        if(this.expression_str != ""){
            obj.expression_str = this.expression_str;
        }

        return obj;
    }

    setExpression_str(str : string){
        
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