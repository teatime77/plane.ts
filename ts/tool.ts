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
            case "Arc":           return new ArcBuilder();
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

            this.ellipse = new Ellipse({ center : this.center, xPoint : this.xPoint, radiusY : 0 });
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
            this.ellipse.setRadiusY(this.getRadiusY(position));
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

class ArcBuilder extends Builder {
    arc    : Arc   | undefined;
    center : Point | undefined;
    pointA : Point | undefined;
    pointB : Point | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){
            this.center = this.makePointOnClick(view, position, shape);
        }
        else if(this.pointA == undefined){
            this.pointA = this.makePointOnClick(view, position, shape);
            this.pointB = Point.fromArgs(position);

            this.arc = new Arc({ center : this.center, pointA : this.pointA, pointB : this.pointB });
            this.pointB.bound = this.arc;

            view.addShape(this.arc);
        }
        else{

            this.arc = undefined;
            this.center = undefined;
            this.pointA = undefined;
            this.pointB = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.arc != undefined && this.pointB != undefined){
            this.arc.adjustPosition(this.pointB, position);
        }
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
                    const point = Point.fromArgs(Vec2.zero());
                    new_shape = new LineLineIntersection({ lineA : this.shape1, lineB : shape, point });
                }
                else if(this.shape1 instanceof CircleArc && shape instanceof CircleArc){
                    const pointA = Point.fromArgs(Vec2.zero())
                    const pointB = Point.fromArgs(Vec2.zero())
                    new_shape = new ArcArcIntersection({ arc1 : this.shape1, arc2 : shape, pointA, pointB });
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

                    const pointA = Point.fromArgs(Vec2.zero());
                    const pointB = Point.fromArgs(Vec2.zero());
                    new_shape = new LineArcIntersection( { line, arc : circle, pointA, pointB });
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
                const [lineA, pos1, lineB, pos2] = [this.line1, this.pos1!, shape, position];

                lineA.setVecs();
                lineB.setVecs();

                const points = View.current.relation.getIntersections(lineA, lineB);
                if(points.length != 1){
                    throw new MyError();
                }
                const intersection_position = points[0].position;

                const directionA = Math.sign(pos1.sub(intersection_position).dot(lineA.e));
                const directionB = Math.sign(pos2.sub(intersection_position).dot(lineB.e));

                const angle = new Angle({ lineA, directionA, lineB, directionB });
                view.addShape(angle);

                this.line1 = undefined;
            }
        }
    }
}

class DimensionLineBuilder extends Builder {
    pointA : Point | undefined;
    pointB : Point | undefined;
    dimLine : DimensionLine | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.pointA == undefined){
            if(shape instanceof Point){
                this.pointA = shape;
            }
        }
        else if(this.pointB == undefined && shape instanceof Point){
            this.pointB = shape;

            const normal = this.pointB.sub(this.pointA).rot90().unit();
            const shift  = position.sub(this.pointB.position).dot(normal);
            const caption = new TextBlock({ text : "\\int \\frac{1}{2}", isTex : true, offset : Vec2.zero() });

            this.dimLine = new DimensionLine({ pointA: this.pointA, pointB: this.pointB, shift, caption });
            view.addShape(this.dimLine);
        }
        else if(this.dimLine != undefined){
            this.pointA      = undefined;
            this.pointB      = undefined;
            this.dimLine = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.pointA != undefined && this.pointB != undefined && this.dimLine != undefined){

            const normal = this.pointB.sub(this.pointA).rot90().unit();
            const shift  = position.sub(this.pointB.position).dot(normal);
            this.dimLine.setShift( shift );
        }
    }
}

}