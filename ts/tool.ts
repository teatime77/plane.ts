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
            case "DimensionLine": return new DimensionLineBuilder();
            // case "Triangle":      return new Triangle();
            // case "Midpoint":      return new Midpoint();
            case "Perpendicular": return new PerpendicularBuilder()
            // case "ParallelLine":  return new ParallelLine()
            case "Intersection":  return new IntersectionBuilder();
            case "Angle":         return new AngleBuilder();
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

            view.changed.clear();

            for(const [pt, down_pos] of this.downPos.entries()){
                if(pt.bound instanceof LineSegment){

                    pt.setPos(calcFootOfPerpendicular(pos, pt.bound));
                }
                else if(pt.bound instanceof Circle){
                    const circle = pt.bound;

                    const v = pos.sub(circle.center.pos);
                    const theta = Math.atan2(v.y, v.x);
                    const x = circle.radius() * Math.cos(theta);
                    const y = circle.radius() * Math.sin(theta);
                    
                    const new_pos = circle.center.pos.add( new Vec2(x, y) );
                    pt.setPos(new_pos);
                }
                else{

                    pt.setPos(down_pos.add(diff));
                }
            }

            view.updateShapes();
        }
    }
}

class PointBuilder extends Builder {
    click(view : View, pos : Vec2, shape : Shape | undefined){  
        if(shape == undefined || shape instanceof LineSegment || shape instanceof Circle){

            const new_point = new Point(view, pos, shape);
            view.addShape(new_point);

            new_point.showProperty();
        }
    }
}

class Circle1Builder extends Builder {
    circle : Circle1 | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){   
        if(this.circle == undefined){

            if(shape == undefined || !(shape instanceof Point)){
                shape = new Point(view, pos);
            }

            const p = new Point(view, pos);
            this.circle = new Circle1(view, shape as Point, p);

            view.addShape(this.circle);
        }
        else{
            if(shape instanceof Point){

                this.circle.p = shape;
            }
            else{

                this.circle.p.setPos(pos);
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

                this.circle.p.setPos(pos);
            }
        }
    }
}


class Circle2Builder extends Builder {
    circle : Circle2 | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){   
        if(this.circle == undefined){

            if(shape == undefined || !(shape instanceof Point)){
                shape = new Point(view, pos);
            }

            this.circle = new Circle2(view, shape as Point, 0);

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
                shape = new Point(view, pos);
            }

            const p2 = new Point(view, pos);
            this.line = new LineSegment(view, shape as Point, p2);

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

                this.line.p2.setPos(pos);
            }
        }
    }

}

class PerpendicularBuilder extends Builder {
    point : Point | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){
        if(this.point == undefined){
            if(shape instanceof Point){

                this.point = shape;
            }
        }
        else{
            if(shape instanceof Line){
                const foot = new FootOfPerpendicular(view, this.point, shape);
                view.addShape(foot);

                this.point = undefined;
            }
        }
    }
}

class IntersectionBuilder extends Builder {
    shape1 : Line | CircleArc | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){
        if(shape instanceof Line || shape instanceof CircleArc){
            if(this.shape1 == undefined){
                this.shape1 = shape;
                this.shape1.select();
            }
            else{
                this.shape1.unselect();

                let new_shape : Shape;
                if(this.shape1 instanceof Line && shape instanceof Line){
                    new_shape = new LinesIntersection(view, this.shape1, shape);
                }
                else if(this.shape1 instanceof CircleArc && shape instanceof CircleArc){
                    new_shape = new ArcArcIntersection(view, this.shape1, shape);
                }
                else{
                    let line : Line;
                    let circle : CircleArc;

                    if(this.shape1 instanceof Line){
                        line = this.shape1;
                        circle = shape as CircleArc;
                    }
                    else{
                        circle = this.shape1;
                        line = shape as Line;
                    }

                    new_shape = new LineArcIntersection(view, line, circle);
                }

                view.addShape(new_shape);

                this.shape1 = undefined;
            }

        }

    }
}

class AngleBuilder extends Builder {
    line1 : Line | undefined;
    pos1  : Vec2 | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){
        if(shape instanceof Line){
            if(this.line1 == undefined){
                this.line1 = shape;
                this.pos1  = pos;
            }
            else{
                const [line1, pos1, line2, pos2] = [this.line1, this.pos1!, shape, pos];

                line1.setVecs();
                line2.setVecs();

                const inter = new LinesIntersection(view, line1, line2);
                view.addShape(inter);

                const dir1 = Math.sign(pos1.sub(inter.point.pos).dot(line1.e));
                const dir2 = Math.sign(pos2.sub(inter.point.pos).dot(line2.e));

                const angle = new Angle(view, line1, dir1, line2, dir2, inter.point.pos);
                view.addShape(angle);

                this.line1 = undefined;
            }
        }
    }
}

class DimensionLineBuilder extends Builder {
    p1 : Point | undefined;
    p2 : Point | undefined;
    dimLine : DimensionLine | undefined;

    click(view : View, pos : Vec2, shape : Shape | undefined){
        if(this.p1 == undefined){
            if(shape instanceof Point){
                this.p1 = shape;
            }
        }
        else if(this.p2 == undefined && shape instanceof Point){
            this.p2 = shape;

            const foot   = calcFootFrom2Pos(pos, this.p1.pos, this.p2.pos);
            const shift  = pos.sub(foot);
            this.dimLine = new DimensionLine(view, this.p1, this.p2, shift);
            view.addShape(this.dimLine);
        }
        else if(this.dimLine != undefined){
            this.p1      = undefined;
            this.p2      = undefined;
            this.dimLine = undefined;
        }
    }

    pointermove(view : View, pos : Vec2, shape : Shape | undefined){
        if(this.p1 != undefined && this.p2 != undefined && this.dimLine != undefined){
            const foot = calcFootFrom2Pos(pos, this.p1.pos, this.p2.pos);
            this.dimLine.shift = pos.sub(foot);
        }
    }
}

}