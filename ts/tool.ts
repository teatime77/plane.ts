namespace plane_ts {
//
export abstract class Builder {
    static tool : Builder;

    static changeTool(tool_name : string){
        Builder.tool = this.makeToolByType(tool_name);
    }

    static makeToolByType(tool_name: string): Builder {    
        switch(tool_name){
            case "Selection":        return new SelectionTool();
            // case "Distance":      return new Distance();
            case "Point":         return new PointBuilder();
            case "LineSegment":   return new LineSegmentBuilder();
            case "Polygon":       return new PolygonBuilder();
            // case "StraightLine":  return new StraightLine();
            // case "HalfLine":      return new HalfLine();
            // case "BSpline":       return new BSpline();
            // case "Rect":          return new Rect();
            case "Circle1":        return new Circle1Builder();
            case "Circle2":        return new Circle2Builder();
            case "Ellipse":           return new EllipseBuilder();
            case "Arc":           return new ArcBuilder();
            case "DimensionLine": return new DimensionLineBuilder();
            case "LengthSymbol":  return new LengthSymbolBuilder();
            case "Midpoint":      return new MidpointBuilder();
            case "Perpendicular": return new PerpendicularBuilder()
            case "ParallelLine":  return new ParallelLineBuilder();
            case "Intersection":  return new IntersectionBuilder();
            case "Tangent":       return new TangentBuilder();
            case "Angle":         return new AngleBuilder();
            case "Text":         return new TextBlockBuilder();
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
            const point = Point.fromArgs(position);
            if(shape instanceof AbstractLine || shape instanceof CircleArc){

                point.setBound(shape);
            }
            return point;
        }
    }

    draw(view : View){        
    }

    drawPendingShape(shape : Shape){
        const shapes : Shape[] = [];
        shape.getAllShapes(shapes);
        shapes.forEach(x => x.draw());
    }
}

export class SelectionTool extends Builder {
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

            const new_point = Point.fromArgs(position);
            new_point.setBound(shape)
            view.addShape(new_point);

            showProperty(new_point, 0);
        }
    }
}

class MidpointBuilder extends Builder {
    pointA : Point | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.pointA == undefined){
            if(shape instanceof Point){
                this.pointA = shape;
            }
        }
        else if(shape instanceof Point){
            const mid_point = new Midpoint( { position:Vec2.zero(), pointA : this.pointA, pointB : shape  } );
            view.addShape(mid_point);
            this.pointA      = undefined;
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
                this.line.calc();
            }
        }
    }
}

class PolygonBuilder extends Builder {
    polygon : Polygon | undefined;
    lastPosition : Vec2 | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.polygon == undefined){
            this.polygon = new Polygon({ points : [], lines : [] });
            view.addShape(this.polygon);
        }

        let point : Point;
        if(shape instanceof Point){

            point = shape;
        }
        else{
            point = Point.fromArgs(position);
        }

        this.polygon.points.push(point);

        if(2 <= this.polygon.points.length){
            const [pointA, pointB] = this.polygon.points.slice(this.polygon.points.length - 2);
            const line = new LineSegment({ pointA, pointB });

            this.polygon.lines.push(line);

            if(this.polygon.points[0] == pointB){

                this.polygon = undefined;
            }
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.polygon != undefined){

            this.lastPosition = position;
            View.current.dirty = true;
        }
    }    

    draw(view: View): void {
        if(this.polygon != undefined && this.lastPosition != undefined){
            
            const point = last(this.polygon.points);
            view.canvas.drawLine(this.polygon, point.position, this.lastPosition);
        }
    }
}

class ParallelLineBuilder extends Builder {
    line  : AbstractLine | undefined;
    point : Point | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(shape instanceof Point){

            this.point = shape;
        }
        else if(shape instanceof AbstractLine){
            this.line = shape;
        }

        if(this.line != undefined && this.point != undefined){

            const parallel_line = new ParallelLine( { pointA : this.point, line : this.line } );
            view.addShape(parallel_line);

            this.line  = undefined;
            this.point = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
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
            if(shape instanceof AbstractLine){
                const foot = new FootOfPerpendicular({ point : this.point, line : shape });
                view.addShape(foot);

                this.point = undefined;
            }
        }
    }
}

class IntersectionBuilder extends Builder {
    shape1 : AbstractLine | CircleArc | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof AbstractLine || shape instanceof CircleArc){
            if(this.shape1 == undefined){
                this.shape1 = shape;
                this.shape1.select();
            }
            else{
                this.shape1.unselect();

                let new_shape : Shape;
                if(this.shape1 instanceof AbstractLine && shape instanceof AbstractLine){
                    const point = Point.fromArgs(Vec2.zero());
                    new_shape = new LineLineIntersection({ lineA : this.shape1, lineB : shape, point });
                }
                else if(this.shape1 instanceof CircleArc && shape instanceof CircleArc){
                    const pointA = Point.fromArgs(Vec2.zero())
                    const pointB = Point.fromArgs(Vec2.zero())
                    new_shape = new ArcArcIntersection({ arc1 : this.shape1, arc2 : shape, pointA, pointB });
                }
                else{
                    let line : AbstractLine;
                    let circle : CircleArc;

                    if(this.shape1 instanceof AbstractLine){
                        line = this.shape1;
                        circle = shape as CircleArc;
                    }
                    else{
                        circle = this.shape1;
                        line = shape as AbstractLine;
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
    line1 : AbstractLine | undefined;
    pos1  : Vec2 | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof AbstractLine){
            if(this.line1 == undefined){
                this.line1 = shape;
                this.pos1  = position;
            }
            else{
                const [lineA, pos1, lineB, pos2] = [this.line1, this.pos1!, shape, position];

                lineA.calc();
                lineB.calc();

                const common_point = getCommonPointOfLines(lineA, lineB);
                if(common_point == undefined){
                    throw new MyError();
                }

                const directionA = Math.sign(pos1.sub(common_point.position).dot(lineA.e));
                const directionB = Math.sign(pos2.sub(common_point.position).dot(lineB.e));

                const angle = new Angle({ angleMark : 0, lineA, directionA, lineB, directionB });
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

            this.dimLine = new DimensionLine({ caption, pointA: this.pointA, pointB: this.pointB, shift });
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


class LengthSymbolBuilder extends Builder {
    pointA : Point | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof LineByPoints){
            const symbol = new LengthSymbol({line : shape, kind : 0});
            view.addShape(symbol);
        }
        else if(shape instanceof Point){
            if(this.pointA == undefined){
                this.pointA = shape;
            }
            else{
                const pointB = shape;

                const line = new LineSegment({ pointA : this.pointA, pointB });
                const symbol = new LengthSymbol({ line, kind : 0});
                view.addShape(symbol);

                this.pointA      = undefined;
            }    
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
    }
}


class TextBlockBuilder extends Builder {
    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        const text_block = new TextBlock({ text : "Text", isTex : false, offset : position });
        text_block.updateTextPosition();

        view.addShape(text_block);

    }
}


}