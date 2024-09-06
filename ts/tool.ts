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
            case "Ellipse":           return new EllipseBuilder();
            // case "Arc":           return new Arc();
            case "DimensionLine": return new DimensionLineBuilder();
            // case "Midpoint":      return new Midpoint();
            case "Perpendicular": return new PerpendicularBuilder()
            // case "ParallelLine":  return new ParallelLine()
            case "Intersection":  return new IntersectionBuilder();
            case "Tangent":       return new TangentBuilder();
            case "Angle":         return new AngleBuilder();
            // case "Image":         return new Image({fileName:"./img/teatime77.png"});
            // case "FuncLine":      return new FuncLine();
        }

        return undefined;
        // throw new MyError();
    }

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){        
    }

    pointerdown(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
    }

    pointermove(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
    }

    pointerup(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
    }

    makePointOnClick(view : View, pos : Vec2, shape : Shape | undefined) : Point {
        if(shape instanceof Point){
            return shape;
        }
        else{
            if(shape instanceof Line || shape instanceof CircleArc){

                return new Point(view, pos, shape);
            }
            else{

                return new Point(view, pos);
            }
        }

    }
}

export class SelectTool extends Builder {
    downOffset : Vec2 | undefined;

    selectedShape : Shape | undefined;
    minSave : Vec2 | undefined;
    maxSave : Vec2 | undefined;

    pointerdown(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
        this.downOffset = new Vec2(ev.offsetX, ev.offsetY);

        this.selectedShape = shape;
        this.minSave = view.min.copy();
        this.maxSave = view.max.copy();

        if(shape != undefined){

            shape.shapePointerdown(pos);
        }
    }

    pointermove(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){

        if(this.downOffset != undefined){
            const offset = new Vec2(ev.offsetX, ev.offsetY);
            const diff   = view.fromPix(offset.sub(this.downOffset));

            diff.y *= -1;

            if(this.selectedShape == undefined){

                view.min = this.minSave!.sub(diff);
                view.max = this.maxSave!.sub(diff);

                view.allShapes().forEach(x => x.updateCaption());
            }
            else{

                view.changed.clear();

                this.selectedShape.shapePointermove(pos, diff);

                view.updateShapes();
            }
        }
    }

    pointerup(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
        this.downOffset    = undefined;
        this.selectedShape = undefined;
        this.minSave = undefined;
        this.maxSave = undefined;
}
}

class PointBuilder extends Builder {
    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){  
        if(shape == undefined || shape instanceof LineSegment || shape instanceof Circle){

            const new_point = new Point(view, pos, shape);
            view.addShape(new_point);

            new_point.showProperty();
        }
    }
}

class Circle1Builder extends Builder {
    circle : Circle1 | undefined;

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){   
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

    pointermove(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
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

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){   
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

    pointermove(ev : PointerEvent, view : View, pos : Vec2, point : Shape | undefined){
        if(this.circle != undefined){
            this.circle.setRadius( pos.dist(this.circle.center.pos) );
        }
    }
}

class EllipseBuilder extends Builder {
    ellipse : Ellipse | undefined;
    center : Point | undefined;
    xPoint : Point | undefined;

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){
            this.center = this.makePointOnClick(view, pos, shape);
        }
        else if(this.xPoint == undefined){
            this.xPoint = this.makePointOnClick(view, pos, shape);

            this.ellipse = new Ellipse(view, this.center, this.xPoint, 0);
            view.addShape(this.ellipse);
        }
        else{
            this.ellipse!.radiusY = this.getRadiusY(pos);

            this.ellipse = undefined;
            this.center = undefined;
            this.xPoint = undefined;
        }
    }

    pointermove(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
        if(this.ellipse != undefined && this.center != undefined && this.xPoint != undefined){
            this.ellipse.radiusY = this.getRadiusY(pos);
        }
    }

    getRadiusY(pos : Vec2) : number {
        if(this.center == undefined || this.xPoint == undefined){
            throw new MyError();
        }

        const foot = calcFootFrom2Pos(pos, this.center.pos, this.xPoint.pos);
        const radius_y = foot.dist(pos);

        return radius_y;
    }
}


class LineSegmentBuilder extends Builder {
    line : LineSegment | undefined;

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){   
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

    pointermove(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
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

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){
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

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){
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


class TangentBuilder extends Builder {
    circle : Circle | undefined;
    point  : Point  | undefined;

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){
        if(shape instanceof Circle){

            if(this.circle == undefined){
                this.circle = shape;
            }
            else{
                const tangent = new CircleCircleTangent(view, this.circle, shape);
                view.addShape(tangent);
    
                this.circle = undefined;
                this.point  = undefined;
            }
        }

        if(this.point == undefined && shape instanceof Point){
            this.point = shape;
        }

        if(this.circle != undefined && this.point != undefined){

            const tangent = new CirclePointTangent(view, this.circle, this.point);
            view.addShape(tangent);

            this.circle = undefined;
            this.point  = undefined;
        }
    }
}


class AngleBuilder extends Builder {
    line1 : Line | undefined;
    pos1  : Vec2 | undefined;

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){
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

    click(ev : MouseEvent, view : View, pos : Vec2, shape : Shape | undefined){
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

    pointermove(ev : PointerEvent, view : View, pos : Vec2, shape : Shape | undefined){
        if(this.p1 != undefined && this.p2 != undefined && this.dimLine != undefined){
            const foot = calcFootFrom2Pos(pos, this.p1.pos, this.p2.pos);
            this.dimLine.shift = pos.sub(foot);
        }
    }
}

}