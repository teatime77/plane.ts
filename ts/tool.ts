///<reference path="inference.ts" />

namespace plane_ts {
//
const TT = i18n_ts.TT;

export class Builder {
    static tool : Builder;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){        
    }

    pointerdown(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
    }

    pointerup(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
    }

    getPosition(position : Vec2, shape : Shape | undefined) : Vec2 {
        if(shape instanceof Point){
            return shape.position;
        }
        else{
            return position;
        }
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

    drawTool(view : View){        
    }

    drawPendingShape(shape : Shape){
        const shapes : Shape[] = [];
        shape.getAllShapes(shapes);
        shapes.forEach(x => x.draw());
    }

    resetTool(shape : MathEntity | undefined){
        View.current.resetMode();

        if(shape != undefined){

            showProperty(shape, 0);
        }
    }
}

export class SelectionTool extends Builder {
    downOffset : Vec2 | undefined;

    selectedShape : Shape | undefined;
    minSave : Vec2 | undefined;
    maxSave : Vec2 | undefined;
    oldPosition? : Vec2;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){ 
        this.resetTool(undefined);
        if(shape != undefined){

            shape.setMode(Mode.target);
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

            if(shape instanceof Point){
                this.oldPosition = shape.position;
            }
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

                view.allRealShapes().forEach(x => x.updateCaption());
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
        if(this instanceof MotionBuilder && this.selectedShape instanceof Point && !this.selectedShape.position.equals(this.oldPosition!)){
            msg(`position changed:`)
            this.animation.addPropertyChange(this.selectedShape, "position", this.oldPosition, this.selectedShape.position);
        }

        this.downOffset    = undefined;
        this.selectedShape = undefined;
        this.minSave = undefined;
        this.maxSave = undefined;
    }
}

export class RangeTool extends Builder {
    selections : Shape[] = [];
    downPosition? : Vec2;
    movePosition? : Vec2;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){ 
        msg("range click");
        if(event.ctrlKey){

        }
        else{

        }
    }

    pointerdown(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        msg("range down");
        this.resetTool(undefined);
        this.downPosition = position;
        this.movePosition = undefined;
        this.selections = [];
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        msg(`move ${event.buttons}`)
        if(this.downPosition == undefined || event.buttons != 1){
            return;
        }

        this.movePosition = position;

        const [ min_x, min_y, max_x, max_y ] = MinMaxXY(this.downPosition, this.movePosition);
        this.selections = [];
        for(const shape of View.current.allShapes()){
            if(shape instanceof Point){
                const pos = shape.position;
                if(min_x <= pos.x && pos.x <= max_x && min_y <= pos.y && pos.y <= max_y){
                    this.selections.push(shape);
                    shape.setMode(Mode.depend);
                }
            }
        }

        view.dirty = true;
    }

    pointerup(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        msg("range up");
        if(this.selections.length != 0){

            showProperty(this.selections, 0);
        }
    }

    drawTool(view: View): void {
        if(this.downPosition == undefined || this.movePosition == undefined){
            return;
        }

        View.current.canvas.drawRect(undefined, this.downPosition, this.movePosition);
    }
}

class PointBuilder extends Builder {
    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){  
        if(shape == undefined || shape instanceof AbstractLine || shape instanceof Circle){

            const new_point = Point.fromArgs(position);
            new_point.setBound(shape);
            new_point.updateCaption();

            view.addShape(new_point);

            this.resetTool(new_point);
        }
    }
}

class MidpointBuilder extends Builder {
    pointA : Point | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.pointA == undefined){

            if(shape instanceof Point){
                this.pointA = shape;
                this.pointA.setMode(Mode.depend);
            }
        }
        else if(shape instanceof Point){
            const mid_point = new Midpoint( { position:Vec2.zero(), pointA : this.pointA, pointB : shape  } );
            view.addShape(mid_point);
            this.pointA      = undefined;
            this.resetTool(mid_point);
        }
    }
}

class CircleByPointBuilder extends Builder {
    circle : CircleByPoint | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.circle == undefined){

            const center = this.makePointOnClick(view, position, shape);
            center.setMode(Mode.depend);

            const point = Point.fromArgs(position);
            this.circle = CircleByPoint.fromArgs(center, point);

            view.addShape(this.circle);
        }
        else{
            if(shape instanceof Point){

                this.circle.point = shape;
            }
            else{

                this.circle.point.setPosition(position);
            }

            this.resetTool(this.circle);
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


class CircleByRadiusBuilder extends Builder {
    center?   : Point;
    position? : Vec2;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);

            this.position = this.center.position;
        }
        else{
            if(shape instanceof LengthSymbol){

                const circle = new CircleByRadius({ center : this.center , lengthSymbol : shape });
                view.addShape(circle);
    
                this.center = undefined;
                this.position = undefined;
    
                this.resetTool(circle);
            }            
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.center != undefined){

            this.position = this.getPosition(position, shape);
            View.current.dirty = true;
        }
    }

    drawTool(view : View){
        if(this.center != undefined){
            const radius = this.center.position.distance(this.position!);
            View.current.canvas.drawCircleRaw(this.center.position, radius, fgColor, defaultLineWidth);
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
            this.center.setMode(Mode.depend);
        }
        else if(this.xPoint == undefined){
            this.xPoint = this.makePointOnClick(view, position, shape);
            this.xPoint.setMode(Mode.depend);

            this.ellipse = new Ellipse({ center : this.center, xPoint : this.xPoint, radiusY : 0 });
            view.addShape(this.ellipse);
        }
        else{
            this.ellipse!.radiusY = this.getRadiusY(position);

            this.resetTool(this.ellipse);
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

class ArcByPointBuilder extends Builder {
    arc    : ArcByPoint   | undefined;
    center : Point | undefined;
    pointA : Point | undefined;
    pointB : Point | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);
        }
        else if(this.pointA == undefined){
            this.pointA = this.makePointOnClick(view, position, shape);
            this.pointA.setMode(Mode.depend);

            this.pointB = Point.fromArgs(position);

            this.arc = new ArcByPoint({ center : this.center, pointA : this.pointA, pointB : this.pointB });
            this.pointB.bound = this.arc;

            view.addShape(this.arc);
        }
        else{

            this.resetTool(this.arc);

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

class ArcByRadiusBuilder extends Builder {
    center?   : Point;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);
        }
        else{
            if(shape instanceof LengthSymbol){

                const startAngle = Math.PI * 1 / 6;
                const endAngle   = Math.PI * 2 / 6;

                const arc = new ArcByRadius({ center : this.center , lengthSymbol : shape, startAngle, endAngle });
                view.addShape(arc);
    
                this.center = undefined;
    
                this.resetTool(arc);
            }            
        }
    }
}


export function drawTentativeLine(tool : Builder, pointA? : Point, position? : Vec2){
    if(pointA != undefined && position != undefined){
        pointA.draw();

        let p2 : Vec2;

        if(tool instanceof LineSegmentBuilder || tool instanceof LengthSymbolBuilder){
            p2 = position;
        }
        else{
            const l = View.current.max.distance(View.current.min);
            const e = position.sub(pointA.position).unit();
            p2 = pointA.position.add(e.mul( l));
        }

        View.current.canvas.drawLine(undefined, pointA.position, p2);
    }
}

class LineByPointsBuilder extends Builder {
    pointA? : Point;
    position? : Vec2;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.pointA == undefined){

            this.pointA = this.makePointOnClick(view, position, shape);
            this.pointA.setMode(Mode.depend);
        }
        else{
            const pointB = this.makePointOnClick(view, position, shape);

            let line : LineByPoints;

            if(this instanceof LineSegmentBuilder){

                line = makeLineSegment(this.pointA, pointB);
            }
            else{

                line = makeRay(this.pointA, pointB);
            }

            view.addShape(line);

            this.pointA = undefined;
            this.position = undefined;

            this.resetTool(line);
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.pointA != undefined){
            if(shape instanceof Point){

                this.position = shape.position;
            }
            else{

                this.position = position;
            }

            View.current.dirty = true;
        }
    }

    drawTool(view : View){
        drawTentativeLine(this, this.pointA, this.position);
    }
}

class LineSegmentBuilder extends LineByPointsBuilder {
}

class RayBuilder extends LineByPointsBuilder {
}

class PolygonBuilder extends Builder {
    polygon : Polygon | undefined;
    lastPosition : Vec2 | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.polygon == undefined){

            this.polygon = new Polygon({ points : [], lines : [] });
            view.addShape(this.polygon);
        }

        const point = this.makePointOnClick(view, position, shape);

        if(3 <= this.polygon.points.length && this.polygon.points[0] == point){

            const pointA = last(this.polygon.points);
            const line = makeLineSegment(pointA, point);

            this.polygon.lines.push(line);

            this.resetTool(this.polygon);
            this.polygon = undefined;
        }
        else{
            point.setMode(Mode.depend);

            this.polygon.points.push(point);

            if(2 <= this.polygon.points.length){
                const [pointA, pointB] = this.polygon.points.slice(this.polygon.points.length - 2);
                const line = makeLineSegment(pointA, pointB);

                this.polygon.lines.push(line);
            }
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.polygon != undefined){

            this.lastPosition = position;
            View.current.dirty = true;
        }
    }    

    drawTool(view: View): void {
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

            this.point  = this.makePointOnClick(view, position, shape);
            this.point.setMode(Mode.depend);
        }
        else if(shape instanceof AbstractLine){
            this.line = shape;
            this.line.setMode(Mode.depend);
        }

        if(this.line != undefined && this.point != undefined){

            const parallel_line = new ParallelLine( { lineKind : LineKind.line, pointA : this.point, line : this.line } );
            view.addShape(parallel_line);

            this.line  = undefined;
            this.point = undefined;

            this.resetTool(parallel_line);
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
    }
}

class PerpendicularBuilder extends Builder {
    point : Point | undefined;
    line  : AbstractLine | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.point == undefined && shape instanceof Point){
            this.point  = this.makePointOnClick(view, position, shape);
            this.point.setMode(Mode.depend);
        }
        else if(shape instanceof AbstractLine){
            this.line = shape;
        }

        if(this.point != undefined && this.line != undefined){

            const foot = new FootOfPerpendicular({ lineKind : 3, pointA : this.point, line : this.line });
            view.addShape(foot);

            this.point = undefined;
            this.line  = undefined;

            this.resetTool(foot);
    }
    }
}

class PerpendicularLineBuilder extends Builder {
    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Point){

            const pointA = this.makePointOnClick(view, position, shape);
            const line = new PerpendicularLine({ lineKind : LineKind.line, pointA });
            view.addShape(line);

            this.resetTool(line);
        }
    }
}

class IntersectionBuilder extends Builder {
    shape1 : AbstractLine | CircleArc | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof AbstractLine || shape instanceof CircleArc){
            if(this.shape1 == undefined){
                this.shape1 = shape;
                this.shape1.setMode(Mode.depend);
            }
            else{
                this.shape1.setMode(Mode.none);

                let new_shape : Shape;
                if(this.shape1 instanceof AbstractLine && shape instanceof AbstractLine){

                    const [ lineA, lineB ] = [ this.shape1, shape ];
                    const position = calcLineLineIntersection(lineA, lineB);

                    new_shape = new LineLineIntersection({ lineA, lineB, position });
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
                this.resetTool(new_shape);
            }

        }

    }
}


class CirclePointTangentBuilder extends Builder {
    circle : Circle | undefined;
    point  : Point  | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Circle){

            this.circle = shape;
        }

        if(shape instanceof Point){
            this.point = this.makePointOnClick(view, position, shape);
        }

        if(this.circle != undefined && this.point != undefined){

            const tangent = new CirclePointTangent( { circle : this.circle, point : this.point });
            view.addShape(tangent);

            this.circle = undefined;
            this.point  = undefined;
            this.resetTool(tangent);
        }
    }
}


class CircleCircleTangentBuilder extends Builder {
    circle : Circle | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Circle){

            if(this.circle == undefined){
                this.circle = shape;
            }
            else{
                const tangent = new CircleCircleTangent( { circle1 : this.circle, circle2 : shape });
                view.addShape(tangent);
    
                this.circle = undefined;
                this.resetTool(tangent);
            }
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
                this.line1.setMode(Mode.depend);

                this.pos1  = position;
            }
            else{
                const [lineA, pos1, lineB, pos2] = [this.line1, this.pos1!, shape, position];
                lineB.setMode(Mode.depend);

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
                this.resetTool(angle);
            }
        }
    }
}

class DimensionLineBuilder extends Builder {
    pointA : Point | undefined;
    pointB : Point | undefined;
    dimLine : DimensionLine | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.dimLine == undefined){
            if(shape instanceof Point){

                if(this.pointA == undefined){
                    this.pointA = this.makePointOnClick(view, position, shape);
                    this.pointA.setMode(Mode.depend);
                }
                else{
                    this.pointB = this.makePointOnClick(view, position, shape);
                    this.pointB.setMode(Mode.depend);

                    const normal = this.pointB.sub(this.pointA).rot90().unit();
                    const shift  = position.sub(this.pointB.position).dot(normal);
                    const caption = new TextBlock({ text : "\\int \\frac{1}{2}", isTex : true, offset : Vec2.zero() });

                    this.dimLine = new DimensionLine({ caption, pointA: this.pointA, pointB: this.pointB, shift });
                }

                View.current.dirty = true;
            }
        }
        else{

            view.addShape(this.dimLine);
            this.resetTool(this.dimLine);

            this.pointA  = undefined;
            this.pointB  = undefined;
            this.dimLine = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.dimLine != undefined){

            const normal = this.pointB!.sub(this.pointA!).rot90().unit();
            const shift  = position.sub(this.pointB!.position).dot(normal);
            this.dimLine.setShift( shift );
        }
    }

    drawTool(view: View): void {
        if(this.dimLine != undefined){
            this.dimLine.draw();
        }
    }
}


class LengthSymbolBuilder extends LineByPointsBuilder {

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof LineByPoints){
            const symbol = new LengthSymbol({pointA : shape.pointA, pointB : shape.pointB, lengthKind : 0});
            view.addShape(symbol);
        }
        else{
            if(this.pointA == undefined){
                this.pointA = this.makePointOnClick(view, position, shape);
            }
            else{
                const pointB = this.makePointOnClick(view, position, shape);

                const symbol = new LengthSymbol({ pointA : this.pointA, pointB, lengthKind : 0});
                view.addShape(symbol);

                this.pointA      = undefined;

                this.resetTool(symbol);
            }    
        }
    }
}


class TextBlockBuilder extends Builder {
    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        const text_block = new TextBlock({ text : "Text", isTex : false, offset : position });
        text_block.updateTextPosition();

        view.addShape(text_block);
        this.resetTool(text_block);
    }
}


export class StatementBuilder extends Builder {
    statement : Statement;
    specifiedShapes : Shape[] = [];

    constructor(statement? : Statement){
        super();

        if(statement == undefined){

            if(this instanceof TriangleCongruenceBuilder){

                this.statement = new TriangleCongruence({ shapes : [] });
            }
            else{

                this.statement = new Statement({ shapes : [] });
            }

            View.current.addShape(this.statement);
        }
        else{
            this.statement = statement;
        }

        showProperty(this.statement, 0);
    }

    click(event : MouseEvent, view : View, position : Vec2, shape : MathEntity | undefined){        
        if(shape != undefined){
            let selected_shape = shape;

            if(event.ctrlKey){

                if(shape instanceof Shape){
                    shape.setMode(Mode.depend);
                    this.specifiedShapes.push(shape);
                }

                return;
            }
            else{

                if(this.specifiedShapes.length != 0){

                    if(shape instanceof Shape){

                        this.specifiedShapes.push(shape);

                        selected_shape = new SelectedShape({ specifiedShapes : this.specifiedShapes });
                        this.statement.selectedShapes.push(selected_shape);

                        this.specifiedShapes.forEach(x => x.setMode(Mode.none));
                        this.specifiedShapes = [];
                    }
                    else{
                        return;
                    }
                }
                else{

                    this.statement.selectedShapes.push(shape);
                }
            }

            const button = makeShapeButton(selected_shape);
            button.button.style.position = "";

            SelectedShapesProperty.one.span.append(button.button);
        }
    }
}

export class TriangleCongruenceBuilder extends StatementBuilder { 
}

export class MotionBuilder extends SelectionTool { 
    animation : Motion;

    constructor(){
        super();

        this.animation = new Motion({ propertyChanges : [] });
        View.current.addShape(this.animation);

        showProperty(this.animation, 0);
    }


}

const toolList : [typeof Builder, string, string, (typeof MathEntity)[]][] = [
    [ SelectionTool             , "selection"          , TT("selection")          , [  ] ],
    [ RangeTool                 , "range"              , TT("range")              , [  ] ],
    [ PointBuilder              , "point"              , TT("point")              , [ Point ] ],
    [ MidpointBuilder           , "mid-point"          , TT("mid point")          , [ Midpoint ] ],
    [ IntersectionBuilder       , "intersection"       , TT("intersection")       , [ LineLineIntersection, LineArcIntersection, ArcArcIntersection ] ],
    [ LineSegmentBuilder        , "line-segment"       , TT("line segment")       , [ LineByPoints ] ],
    [ PolygonBuilder            , "polygon"            , TT("polygon")            , [ Polygon ] ],
    [ PerpendicularBuilder      , "perpendicular"      , TT("perpendicular")      , [ FootOfPerpendicular ] ],
    [ PerpendicularLineBuilder  , "perpendicular-line" , TT("perpendicular")      , [ PerpendicularLine ] ],
    [ ParallelLineBuilder       , "parallel-line"      , TT("parallel line")      , [ ParallelLine ] ],
    [ CircleByPointBuilder      , "circle-by-point"    , TT("circle by point")    , [ CircleByPoint ] ],
    [ CircleByRadiusBuilder     , "circle-by-radius"   , TT("circle by radius")   , [ CircleByRadius ] ],
    [ ArcByPointBuilder         , "arc-by-point"       , TT("arc by point")       , [ ArcByPoint ] ],
    [ ArcByRadiusBuilder        , "arc-by-radius"      , TT("arc by radius")      , [ ArcByRadius ] ],
    [ EllipseBuilder            , "ellipse"            , TT("ellipse")            , [ Ellipse ] ],
    [ CirclePointTangentBuilder , "tangent-point"      , TT("tangent point")      , [ CirclePointTangent ] ],
    [ CircleCircleTangentBuilder, "tangent-circles"    , TT("tangent circles")    , [ CircleCircleTangent ] ],
    [ AngleBuilder              , "angle"              , TT("angle")              , [ Angle ] ],
    [ DimensionLineBuilder      , "dimension-line"     , TT("dimension line")     , [ DimensionLine ] ],
    [ LengthSymbolBuilder       , "length-symbol"      , TT("length symbol")      , [ LengthSymbol ] ],
    [ TextBlockBuilder          , "text"               , TT("text")               , [ TextBlock ] ],
    [ StatementBuilder          , "statement"          , TT("statement")          , [ Statement ] ],
    [ TriangleCongruenceBuilder , "triangle-congruence", TT("triangle congruence"), [ TriangleCongruence ] ],
    [ MotionBuilder             , "animation"          , TT("animation")          , [ Motion ] ],
];

export function makeShapeButton(shape : MathEntity) : layout_ts.Button {
    let shape_img_name : string | undefined;

    if(shape instanceof SelectedShape){

        shape_img_name = "selected-shape";
    }
    else{

        for(const [ tool, img_name, title, shapes] of toolList){
            if(shapes.some(x => shape instanceof x)){

                shape_img_name = img_name;
                break;
            }
        }

        if(shape_img_name == undefined){
            throw new MyError();
        }
    }

    const button = layout_ts.$button({
        url    : `${urlOrigin}/lib/plane/img/${shape_img_name}.png`,
        width  : "20px",
        height : "20px",
    });

    button.click = async (ev : MouseEvent)=>{
        if(button.parent == Plane.one.shapes_block && shape instanceof Statement){
            if(shape instanceof TriangleCongruence){

                msg("set Triangle Congruence Builder");
                Builder.tool = new TriangleCongruenceBuilder(shape);
            }
            else{

                msg("set Statement Builder");
                Builder.tool = new StatementBuilder(shape);
            }
        }

        showProperty(shape, 0);
    };

    return button;
}

export function addShapeList(shape : MathEntity){
    const button = makeShapeButton(shape);
    
    Plane.one.shapes_block.addChild(button);
    Plane.one.shapes_block.updateLayout();
}

export function popShapeList(){
    Plane.one.shapes_block.popChild();
    Plane.one.shapes_block.updateLayout();
}

export function makeToolButtons() : layout_ts.RadioButton[] {
    const tool_buttons : layout_ts.RadioButton[] = [];

    for(const [ tool, img_name, title, shapes] of toolList){
        const radio = layout_ts.$radio({
            value : tool.name,
            title : title,
            url   : `${urlOrigin}/lib/plane/img/${img_name}.png`,
            width : "36px",
            height : "36px",
        });

        tool_buttons.push(radio);
    }    

    return tool_buttons;
}

export function makeToolByType(tool_name: string): Builder {
    for(const [ tool, img_name, title, shapes] of toolList){
        if(tool.name == tool_name){
            return new tool()
        }
    }

    throw new MyError();
}

}