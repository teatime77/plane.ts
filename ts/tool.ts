namespace planets {
//
export abstract class Builder {
    static tool : Builder | undefined;

    static changeTool(tool_name : string){
        Builder.tool = this.makeToolByType(tool_name);
    }

    static makeToolByType(tool_name: string): Builder | undefined {    
        switch(tool_name){
            // case "Distance":      return new Distance();
            case "Point":         return new PointBuilder();
            // case "LineSegment":   return new LineSegment();
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
            // case "Perpendicular": return new Perpendicular()
            // case "ParallelLine":  return new ParallelLine()
            // case "Intersection":  return new Intersection();
            // case "Angle":         return new Angle();
            // case "Image":         return new Image({fileName:"./img/teatime77.png"});
            // case "FuncLine":      return new FuncLine();
        }

        return undefined;
        // throw new MyError();
    }

    click(view : View, pos : Vec2){        
    }

    pointermove(view : View, pos : Vec2){
    }
}

class PointBuilder extends Builder {
    click(view : View, pos : Vec2){   
        const point = new Point(pos);
        view.addShape(point);
        msg(`add point`);
    }
}

class Circle1Builder extends Builder {
    circle : Circle1 | undefined;

    click(view : View, pos : Vec2){   
        if(this.circle == undefined){

            const center = new Point(pos);
            const p = new Point(pos);
            this.circle = new Circle1(center, p);


            view.addShape(center);
            view.addShape(p);
            view.addShape(this.circle);
            msg(`add circle1`);
        }
        else{
            this.circle = undefined;
        }
    }

    pointermove(view : View, pos : Vec2){
        if(this.circle != undefined){
            this.circle.p.pos = pos;
        }
    }

}


class Circle2Builder extends Builder {
    circle : Circle2 | undefined;

    click(view : View, pos : Vec2){   
        if(this.circle == undefined){

            const center = new Point(pos);
            this.circle = new Circle2(center, 0);


            view.addShape(center);
            view.addShape(this.circle);
            msg(`add circle2`);
        }
        else{
            this.circle = undefined;
        }
    }

    pointermove(view : View, pos : Vec2){
        if(this.circle != undefined){
            this.circle.setRadius( pos.dist(this.circle.center.pos) );
        }
    }

}

}