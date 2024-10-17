///<reference path="tool.ts" />

namespace plane_ts {
//
const T = i18n_ts.T;

abstract class ShapeSelector {
    prompts : string[];
    finished : boolean = false;
    abstract shapes() : AbstractShape[];
    abstract selectShape(shape : Shape) : void;

    constructor(obj : { prompts : string[] }){
        this.prompts = obj.prompts;
    }
}

class LineSelector extends ShapeSelector {
    line? : AbstractLine;

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

export class StatementTool extends Builder {
    statement : Statement;

    constructor(statement : Statement){
        super();
        this.statement = statement;
        msg(`new statement: ${this.statement.selectors[0].prompts[0]}`);
    }

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){        
        if(shape != undefined){
            const selector = this.statement.selectors.find(x => !x.finished)!;

            selector.selectShape(shape);
            if(selector.finished){

                msg(`selector finished:${selector.constructor.name}`);
                if(last(this.statement.selectors) == selector){

                    msg(`statement finished`);
                    View.current.addShape(this.statement);
                }
            }
        }
    }
}

export class Statement extends AbstractShape {
    text : string;
    selectors : ShapeSelector[];

    constructor(obj : { text : string, selectors : ShapeSelector[] }){
        super(obj);
        this.text = obj.text;
        this.selectors = obj.selectors;
    }

    shapes() : AbstractShape[]{
        return this.selectors.map(x => x.shapes()).flat();
    }

    dependencies() : Shape[] {
        return this.shapes() as Shape[];
    }

    reading() : Reading {
        return new Reading(this, this.text, []);
    }
}

export function initStatements() : Statement[] {
    const statements = [
        new Statement({
            text : T('These two lines are parallel.'),
            selectors: [ 
                new LineSelector({
                    prompts : [
                        T("Click the first line.")
                    ]
                })
                , 
                new LineSelector({
                    prompts : [
                        T("Click the second line.")
                    ]
                }) 
            ]
        })
        ,
        new Statement({
            text : T('These two angles are equal.'),
            selectors: [ 
                new AngleSelector({
                    prompts : [
                        T("Click the first angle.")
                    ]
               })
                , 
                new AngleSelector({
                    prompts : [
                        T("Click the second angle.")
                    ]
               }) 
            ]
        })
        ,
        new Statement({
            text : T('The sum of these two angles is 180 degrees.'),
            selectors: [ 
                new AngleSelector({
                    prompts : [
                        T("Click the first angle.")
                    ]
                })
                , 
                new AngleSelector({
                    prompts : [
                        T("Click the second angle.")
                    ]
               }) 
            ]
        })
        ,
        new Statement({
            text : T('These two lines are radii of a circle.'),
            selectors: [  
                new LineSelector({
                    prompts : [
                        T("Click the first line.")
                    ]
                })
                , 
                new LineSelector({
                    prompts : [
                        T("Click the second line.")
                    ]
                })
                ,
            ]
        })
        ,
        new Statement({
            text : T('These two lines are equal in length.'),
            selectors: [ 
                new LineSelector({
                    prompts : [
                    ]
                })
                , 
                new LineSelector({
                    prompts : [
                    ]
               }) 
            ]
        })
        ,
        new Statement({
            text : T('The two triangles are congruent.'),
            selectors: [ 
                new TriangleSelector({
                    prompts : [
                        T("Click the first point of the first triangle."),
                        T("Click the second point of the first triangle."),
                        T("Click the third point of the first triangle."),
                    ]
                })
                , 
                new TriangleSelector({
                    prompts : [
                        T("Click the first point of the second triangle."),
                        T("Click the second point of the second triangle."),
                        T("Click the third point of the second triangle."),
                    ]
               }) 
            ]
        })
    ];

    return statements;
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