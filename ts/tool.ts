namespace planets {
//
export abstract class Builder {
    static tool : Builder | undefined;

    static changeTool(tool_name : string){
        Builder.tool = this.makeToolByType(tool_name);
    }

    static makeToolByType(tool_name: string): Builder | undefined {    
        switch(tool_name){
            case "select":        return new SelectTool();
            // case "Distance":      return new Distance();
            case "Point":         return new PointBuilder();
            case "LineSegment":   return new LineSegmentBuilder();
            // case "StraightLine":  return new StraightLine();
            // case "HalfLine":      return new HalfLine();
            // case "BSpline":       return new BSpline();
            // case "Rect":          return new Rect().make({isSquare:(arg == "2")}) as Shape;
            case "Circle.1":        return new Circle1Builder();
            case "Circle.2":        return new Circle2Builder();
            // case "Arc":           return new Arc();
            // case "DimensionLine": return new DimensionLine();
            // case "Triangle":      return new Triangle();
            // case "Midpoint":      return new Midpoint();
            case "Perpendicular": return new PerpendicularBuilder()
            // case "ParallelLine":  return new ParallelLine()
            // case "Intersection":  return new Intersection();
            // case "Angle":         return new Angle();
            // case "Image":         return new Image({fileName:"./img/teatime77.png"});
            // case "FuncLine":      return new FuncLine();
        }

        return undefined;
        // throw new MyError();
    }

    click(view : View, pos : Vec2, shape : Shape | undefined){        
    }

    pointerdown(view : View, pos : Vec2){
    }

    pointermove(view : View, pos : Vec2, shape : Shape | undefined){
    }
}

export class SelectTool extends Builder {
    downPos : Map<Point, Vec2> = new Map<Point, Vec2>();

    pointerdown(view : View, pos : Vec2){
        this.downPos.clear();

        const pts = view.selections.filter(x => x instanceof Point) as Point[];
        for(const pt of pts){
            this.downPos.set(pt, pt.pos.copy());
        }
    }

    pointermove(view : View, pos : Vec2, shape : Shape | undefined){
        if(view.downPos != undefined){
            const diff = pos.sub(view.downPos);

            for(const [pt, down_pos] of this.downPos.entries()){
                if(pt.bound instanceof LineSegment){

                    pt.pos = calcFootOfPerpendicular(pt.bound, pos);
                }
                else if(pt.bound instanceof Circle){
                    
                }
                else{

                    pt.pos = down_pos.add(diff)
                }
            }
        }
    }
}

class PointBuilder extends Builder {
    click(view : View, pos : Vec2, shape : Shape | undefined){  
        if(shape == undefined || shape instanceof LineSegment || shape instanceof Circle){

            const new_point = new Point(pos, shape);
            view.addShape(new_point);
        }
    }
}

class Circle1Builder extends Builder {
    circle : Circle1 | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){   
        if(this.circle == undefined){

            if(shape == undefined || !(shape instanceof Point)){
                shape = new Point(pos);
            }

            const p = new Point(pos);
            this.circle = new Circle1(shape as Point, p);

            view.addShape(this.circle);
        }
        else{
            if(shape instanceof Point){

                this.circle.p = shape;
            }
            else{

                this.circle.p.pos = pos;
            }

            this.circle = undefined;
        }
    }

    pointermove(view : View, pos : Vec2, shape : Shape | undefined){
        if(this.circle != undefined){
            if(shape instanceof Point && shape != this.circle.center){

                this.circle.p = shape;
            }
            else{

                this.circle.p.pos = pos;
            }
        }
    }
}


class Circle2Builder extends Builder {
    circle : Circle2 | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){   
        if(this.circle == undefined){

            if(shape == undefined || !(shape instanceof Point)){
                shape = new Point(pos);
            }

            this.circle = new Circle2(shape as Point, 0);

            view.addShape(this.circle);
        }
        else{
            this.circle = undefined;
        }
    }

    pointermove(view : View, pos : Vec2, point : Shape | undefined){
        if(this.circle != undefined){
            this.circle.setRadius( pos.dist(this.circle.center.pos) );
        }
    }
}


class LineSegmentBuilder extends Builder {
    line : LineSegment | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){   
        if(this.line == undefined){

            if(shape == undefined || !(shape instanceof Point)){
                shape = new Point(pos);
            }

            const p2 = new Point(pos);
            this.line = new LineSegment(shape as Point, p2);


            view.addShape(this.line);
        }
        else{
            if(shape instanceof Point){
                this.line.p2 = shape;
            }

            this.line = undefined;
        }
    }

    pointermove(view : View, pos : Vec2, shape : Shape | undefined){
        if(this.line != undefined){
            if(shape instanceof Point && shape != this.line.p1){

                this.line.p2 = shape;
            }
            else{

                this.line.p2.pos = pos;
            }
        }
    }

}

class PerpendicularBuilder extends Builder {

}

}