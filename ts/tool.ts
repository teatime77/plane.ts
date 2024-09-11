namespace planets {
//
export abstract class Builder {
    static tool : Builder;

    static changeTool(tool_name : string){
        Builder.tool = this.makeToolByType(tool_name);
    }

    static makeToolByType(tool_name: string): Builder {    
        switch(tool_name){
            case "select":        return new SelectTool();
            // case "Distance":      return new Distance();
            case "Point":         return new PointBuilder();
            case "LineSegment":   return new LineSegmentBuilder();
            // case "StraightLine":  return new StraightLine();
            // case "HalfLine":      return new HalfLine();
            // case "BSpline":       return new BSpline();
            // case "Rect":          return new Rect();
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

        throw new MyError();
    }

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){        
    }

    pointerdown(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
    }

    pointerup(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
    }

    makePointOnClick(view : View, position : Vec2, shape : Shape | undefined) : Point {
        if(shape instanceof Point){
            return shape;
        }
        else{
            if(shape instanceof Line || shape instanceof CircleArc){

                return Point.fromArgs(position, shape);
            }
            else{

                return Point.fromArgs(position);
            }
        }

    }
}

export class SelectTool extends Builder {
    downOffset : Vec2 | undefined;

    selectedShape : Shape | undefined;
    minSave : Vec2 | undefined;
    maxSave : Vec2 | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){        
        if(shape != undefined){
            showProperty(shape, 0);
        }
    }

    pointerdown(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        this.downOffset = new Vec2(event.offsetX, event.offsetY);

        this.selectedShape = shape;
        this.minSave = view.min.copy();
        this.maxSave = view.max.copy();

        if(shape != undefined){

            shape.shapePointerdown(position);
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){

        if(this.downOffset != undefined){
            const offset = new Vec2(event.offsetX, event.offsetY);
            const diff   = view.fromPix(offset.sub(this.downOffset));

            diff.y *= -1;

            if(this.selectedShape == undefined){

                view.min = this.minSave!.sub(diff);
                view.max = this.maxSave!.sub(diff);

                view.allShapes().forEach(x => x.updateCaption());
            }
            else{

                view.changed.clear();

                this.selectedShape.shapePointermove(position, diff);

                view.updateShapes();
            }

            view.dirty = true;
        }
    }

    pointerup(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        this.downOffset    = undefined;
        this.selectedShape = undefined;
        this.minSave = undefined;
        this.maxSave = undefined;
}
}

class PointBuilder extends Builder {
    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){  
        if(shape == undefined || shape instanceof LineSegment || shape instanceof Circle){

            const new_point = Point.fromArgs(position, shape);
            view.addShape(new_point);

            showProperty(new_point, 0);
        }
    }
}

class Circle1Builder extends Builder {
    circle : CircleByPoint | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.circle == undefined){

            if(shape == undefined || !(shape instanceof Point)){
                shape = Point.fromArgs(position);
            }

            const point = Point.fromArgs(position);
            this.circle = CircleByPoint.fromArgs(shape as Point, point);

            view.addShape(this.circle);
        }
        else{
            if(shape instanceof Point){

                this.circle.point = shape;
            }
            else{

                this.circle.point.setPosition(position);
            }

            this.circle = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.circle != undefined){
            if(shape instanceof Point && shape != this.circle.center){

                this.circle.point = shape;
            }
            else{

                this.circle.point.setPosition(position);
            }
        }
    }
}


class Circle2Builder extends Builder {
    circle : CircleByRadius | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.circle == undefined){

            if(shape == undefined || !(shape instanceof Point)){
                shape = Point.fromArgs(position);
            }

            this.circle = new CircleByRadius({ center : (shape as Point) , radius : 0 });

            view.addShape(this.circle);
        }
        else{
            this.circle = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, point : Shape | undefined){
        if(this.circle != undefined){
            this.circle.setRadius( position.distance(this.circle.center.position) );
        }
    }
}

class EllipseBuilder extends Builder {
    ellipse : Ellipse | undefined;
    center : Point | undefined;
    xPoint : Point | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){
            this.center = this.makePointOnClick(view, position, shape);
        }
        else if(this.xPoint == undefined){
            this.xPoint = this.makePointOnClick(view, position, shape);

            this.ellipse = new Ellipse({ center : this.center, x_point : this.xPoint, radius_y : 0 });
            view.addShape(this.ellipse);
        }
        else{
            this.ellipse!.radiusY = this.getRadiusY(position);

            this.ellipse = undefined;
            this.center = undefined;
            this.xPoint = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.ellipse != undefined && this.center != undefined && this.xPoint != undefined){
            this.ellipse.radiusY = this.getRadiusY(position);
        }
    }

    getRadiusY(position : Vec2) : number {
        if(this.center == undefined || this.xPoint == undefined){
            throw new MyError();
        }

        const foot = calcFootFrom2Pos(position, this.center.position, this.xPoint.position);
        const radius_y = foot.distance(position);

        return radius_y;
    }
}


class LineSegmentBuilder extends Builder {
    line : LineSegment | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.line == undefined){

            let pointA : Point;
            if(shape instanceof Point){

                pointA = shape;
            }
            else{
                pointA = Point.fromArgs(position);
            }

            const pointB = Point.fromArgs(position);
            this.line = new LineSegment({ pointA, pointB });

            view.addShape(this.line);
        }
        else{
            if(shape instanceof Point){
                this.line.pointB = shape;
            }

            this.line = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.line != undefined){
            if(shape instanceof Point && shape != this.line.pointA){

                this.line.pointB = shape;
            }
            else{

                this.line.pointB.setPosition(position);
            }
        }
    }

}

class PerpendicularBuilder extends Builder {
    point : Point | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.point == undefined){
            if(shape instanceof Point){

                this.point = shape;
            }
        }
        else{
            if(shape instanceof Line){
                const foot = new FootOfPerpendicular({ point : this.point, line : shape });
                view.addShape(foot);

                this.point = undefined;
            }
        }
    }
}

class IntersectionBuilder extends Builder {
    shape1 : Line | CircleArc | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Line || shape instanceof CircleArc){
            if(this.shape1 == undefined){
                this.shape1 = shape;
                this.shape1.select();
            }
            else{
                this.shape1.unselect();

                let new_shape : Shape;
                if(this.shape1 instanceof Line && shape instanceof Line){
                    new_shape = new LinesIntersection({ lineA : this.shape1, lineB : shape });
                }
                else if(this.shape1 instanceof CircleArc && shape instanceof CircleArc){
                    new_shape = new ArcArcIntersection({ arc1 : this.shape1, arc2 : shape });
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

                    new_shape = new LineArcIntersection( { line, arc : circle });
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

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Circle){

            if(this.circle == undefined){
                this.circle = shape;
            }
            else{
                const tangent = new CircleCircleTangent( { circle1 : this.circle, circle2 : shape });
                view.addShape(tangent);
    
                this.circle = undefined;
                this.point  = undefined;
            }
        }

        if(this.point == undefined && shape instanceof Point){
            this.point = shape;
        }

        if(this.circle != undefined && this.point != undefined){

            const tangent = new CirclePointTangent( { circle : this.circle, point : this.point });
            view.addShape(tangent);

            this.circle = undefined;
            this.point  = undefined;
        }
    }
}


class AngleBuilder extends Builder {
    line1 : Line | undefined;
    pos1  : Vec2 | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Line){
            if(this.line1 == undefined){
                this.line1 = shape;
                this.pos1  = position;
            }
            else{
                const [line1, pos1, line2, pos2] = [this.line1, this.pos1!, shape, position];

                line1.setVecs();
                line2.setVecs();

                const intersection = new LinesIntersection({ lineA : line1, lineB : line2 });
                view.addShape(intersection);

                const dir1 = Math.sign(pos1.sub(intersection.point.position).dot(line1.e));
                const dir2 = Math.sign(pos2.sub(intersection.point.position).dot(line2.e));

                const angle = new Angle({ lineA: line1, dir1, lineB: line2, dir2, intersection : intersection.point.position });
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

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.p1 == undefined){
            if(shape instanceof Point){
                this.p1 = shape;
            }
        }
        else if(this.p2 == undefined && shape instanceof Point){
            this.p2 = shape;

            const foot   = calcFootFrom2Pos(position, this.p1.position, this.p2.position);
            const shift  = position.sub(foot);
            this.dimLine = new DimensionLine({ pointA: this.p1, pointB: this.p2, shift : shift });
            view.addShape(this.dimLine);
        }
        else if(this.dimLine != undefined){
            this.p1      = undefined;
            this.p2      = undefined;
            this.dimLine = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.p1 != undefined && this.p2 != undefined && this.dimLine != undefined){
            const foot = calcFootFrom2Pos(position, this.p1.position, this.p2.position);
            this.dimLine.shift = position.sub(foot);
        }
    }
}

}