
namespace plane_ts {
//
const TT = i18n_ts.TT;

abstract class ShapeSelector {
    prompts : string[];
    finished : boolean = false;
    abstract shapes() : AbstractShape[];
    abstract selectShape(shape : Shape) : void;

    constructor(prompts : string | string[]){
        if(typeof prompts == "string"){

            this.prompts = [ prompts ];
        }
        else{

            this.prompts = prompts;
        }
    }

    clear(){
        this.finished = false;
    }
}

class LineSelector extends ShapeSelector {
    line? : AbstractLine;

    clear(){
        super.clear();
        this.line = undefined;
    }

    shapes() : AbstractShape[] {
        return [ this.line! ];
    }

    selectShape(shape : Shape) : void {
        if(shape instanceof AbstractLine){
            this.line = shape;
            this.finished = true;
        }
    }
}

class AngleSelector extends ShapeSelector {
    angle? : Angle;

    clear(){
        super.clear();
        this.angle = undefined;
    }

    shapes() : AbstractShape[] {
        return [ this.angle! ];
    }

    selectShape(shape : Shape) : void {
        if(shape instanceof Angle){
            this.angle = shape;
            this.finished = true;
        }
    }
}

class PointSelector extends ShapeSelector {
    point? : Point;

    clear(){
        super.clear();
        this.point = undefined;
    }

    shapes() : AbstractShape[] {
        return [ this.point! ];
    }

    selectShape(shape : Shape) : void {
        if(shape instanceof Point){
            this.point = shape;
            this.finished = true;
        }
    }
}

class TriangleSelector extends ShapeSelector {
    points : Point[] = [];


    clear(){
        super.clear();
        this.points = [];
    }

    shapes() : AbstractShape[] {
        return this.points;
    }

    selectShape(shape : Shape) : void {
        if(shape instanceof Point){
            this.points.push(shape);
            if(this.points.length < 3){

                msg(`triangle prompt: ${this.prompts[ this.points.length ]}`);
            }
            else{

                this.finished = true;
            }
        }
    }
}

/*
export class StatementSelectorTool extends Builder {
    narration : string;
    selectors : ShapeSelector[];

    constructor(text : string, selectors : ShapeSelector[]){
        super();
        this.narration = text;
        this.selectors = selectors;
        this.selectors.forEach(x => x.clear());

        msg(`new statement: ${this.selectors[0].prompts[0]}`);
    }

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){        
        if(shape != undefined){
            const selector = this.selectors.find(x => !x.finished)!;

            selector.selectShape(shape);
            if(selector.finished){

                msg(`selector finished:${selector.constructor.name}`);
                if(last(this.selectors) == selector){

                    msg(`statement finished`);
                    const shapes = this.selectors.map(x => x.shapes()).flat();
                    const statement = new Statement({ narration : this.narration, shapes });
                    View.current.addShape(statement);
                }
            }
        }
    }
}
*/

export class Statement extends AbstractShape {
    selectedShapes : AbstractShape[];

    constructor(obj : { narration? : string, shapes : AbstractShape[] }){
        super(obj);
        this.selectedShapes = obj.shapes;
    }

    dependencies() : Shape[] {
        return this.selectedShapes as Shape[];
    }

    getProperties(){
        return super.getProperties().concat([
            "selectedShapes"
        ]);
    }

    reading() : Reading {
        return new Reading(this, this.narration, []);
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            shapes : this.selectedShapes.map(x => x.toObj())
        });

        return obj;
    }
}

export function getStatementInfos() : { text : string, selectors : ShapeSelector[] }[] {
    const statement_info_list : [ string, ShapeSelector[]][] = [
        [
            TT('These two lines are parallel.'),
            [ 
                new LineSelector(TT("Click the first line.")), 
                new LineSelector(TT("Click the second line.")) 
            ]
        ]
        ,
        [
            TT('These two angles are equal.'),
            [ 
                new AngleSelector(TT("Click the first angle.")), 
                new AngleSelector(TT("Click the second angle.")) 
            ]
        ]
        ,
        [
            TT('The sum of these two angles is 180 degrees.'),
            [ 
                new AngleSelector(TT("Click the first angle.")),
                new AngleSelector(TT("Click the second angle.")) 
            ]
        ]
        ,
        [
            TT('These two lines are radii of a circle.'),
            [  
                new LineSelector(TT("Click the first line.")), 
                new LineSelector(TT("Click the second line."))
                ,
            ]
        ]
        ,
        [
            TT('These two lines are equal in length.'),
            [ 
                new LineSelector(""), 
                new LineSelector("") 
            ]
        ]
        ,
        [
            TT('The two triangles are congruent.'),
            [ 
                new TriangleSelector([
                    TT("Click the first point of the first triangle."),
                    TT("Click the second point of the first triangle."),
                    TT("Click the third point of the first triangle."),
                ])
                , 
                new TriangleSelector([
                    TT("Click the first point of the second triangle."),
                    TT("Click the second point of the second triangle."),
                    TT("Click the third point of the second triangle."),
                ]) 
            ]
        ]
    ];

    return statement_info_list.map(x=>{ return { text : x[0], selectors: x[1] }; });
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