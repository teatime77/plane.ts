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

    resetTool(){
        View.current.resetMode();
    }
}

export class SelectionTool extends Builder {
    downOffset : Vec2 | undefined;

    selectedShape : Shape | undefined;
    minSave : Vec2 | undefined;
    maxSave : Vec2 | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){ 
        this.resetTool();
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
            new_point.setBound(shape);
            new_point.updateCaption();

            view.addShape(new_point);

            showProperty(new_point, 0);
            this.resetTool();
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
            this.resetTool();
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
            shape.setMode(Mode.depend);

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
            this.resetTool();
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
            shape.setMode(Mode.depend);

            this.circle = new CircleByRadius({ center : (shape as Point) , radius : 0 });

            view.addShape(this.circle);
        }
        else{
            this.circle = undefined;
            this.resetTool();
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

            this.ellipse = undefined;
            this.center = undefined;
            this.xPoint = undefined;
            this.resetTool();
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
            this.center.setMode(Mode.depend);
        }
        else if(this.pointA == undefined){
            this.pointA = this.makePointOnClick(view, position, shape);
            this.pointA.setMode(Mode.depend);

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
            this.resetTool();
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.arc != undefined && this.pointB != undefined){
            this.arc.adjustPosition(this.pointB, position);
        }
    }
}

class LineByPointsBuilder extends Builder {
    line : LineByPoints | undefined;

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.line == undefined){

            let pointA : Point;
            if(shape instanceof Point){

                pointA = shape;
            }
            else{
                pointA = Point.fromArgs(position);
            }
            pointA.setMode(Mode.depend);

            const pointB = Point.fromArgs(position);
            if(this instanceof LineSegmentBuilder){

                this.line = new LineSegment({ pointA, pointB });
            }
            else{

                this.line = new Ray({ pointA, pointB });
            }

            view.addShape(this.line);
        }
        else{
            if(shape instanceof Point){
                this.line.pointB = shape;
            }

            this.line = undefined;
            this.resetTool();
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

        let point : Point;
        if(shape instanceof Point){

            point = shape;
        }
        else{
            point = Point.fromArgs(position);
        }

        if(3 <= this.polygon.points.length && this.polygon.points[0] == point){

            const pointA = last(this.polygon.points);
            const line = new LineSegment({ pointA, pointB : point });

            this.polygon.lines.push(line);

            this.polygon = undefined;
            this.resetTool();
        }
        else{
            point.setMode(Mode.depend);

            this.polygon.points.push(point);

            if(2 <= this.polygon.points.length){
                const [pointA, pointB] = this.polygon.points.slice(this.polygon.points.length - 2);
                const line = new LineSegment({ pointA, pointB });

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
            this.point.setMode(Mode.depend);
        }
        else if(shape instanceof AbstractLine){
            this.line = shape;
            this.line.setMode(Mode.depend);
        }

        if(this.line != undefined && this.point != undefined){

            const parallel_line = new ParallelLine( { pointA : this.point, line : this.line } );
            view.addShape(parallel_line);

            this.line  = undefined;
            this.point = undefined;
            this.resetTool();
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
                this.point.setMode(Mode.depend);
            }
        }
        else{
            if(shape instanceof AbstractLine){
                const foot = new FootOfPerpendicular({ point : this.point, line : shape });
                view.addShape(foot);

                this.point = undefined;
                this.resetTool();
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
                this.resetTool();
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
            this.point = shape;
        }

        if(this.circle != undefined && this.point != undefined){

            const tangent = new CirclePointTangent( { circle : this.circle, point : this.point });
            view.addShape(tangent);

            this.circle = undefined;
            this.point  = undefined;
            this.resetTool();
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
                this.resetTool();
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
                this.resetTool();
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
                    this.pointA = shape;
                    this.pointA.setMode(Mode.depend);
                }
                else{
                    this.pointB = shape;
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

            this.pointA  = undefined;
            this.pointB  = undefined;
            this.dimLine = undefined;
            this.resetTool();
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.dimLine != undefined){

            const normal = this.pointB!.sub(this.pointA!).rot90().unit();
            const shift  = position.sub(this.pointB!.position).dot(normal);
            this.dimLine.setShift( shift );
        }
    }

    draw(view: View): void {
        if(this.dimLine != undefined){
            this.dimLine.draw();
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
                this.resetTool();
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
        this.resetTool();
    }
}


export class StatementBuilder extends Builder {
    statement : Statement;

    constructor(){
        super();

        this.statement = new Statement({ shapes : [] });
        View.current.addShape(this.statement);

        showProperty(this.statement, 0);
    }

    click(event : MouseEvent, view : View, position : Vec2, shape : MathEntity | undefined){        
        if(shape != undefined){

            this.statement.selectedShapes.push(shape);

            const button = makeShapeButton(shape);
            button.button.style.position = "";

            SelectedShapesProperty.one.span.append(button.button);
        }
    }
}

const toolList : [typeof Builder, string, string, (typeof MathEntity)[]][] = [
    [ SelectionTool             , "selection"       , TT("selection")        , [  ] ],
    [ PointBuilder              , "point"           , TT("point")            , [ Point ] ],
    [ MidpointBuilder           , "mid-point"       , TT("mid point")        , [ Midpoint ] ],
    [ IntersectionBuilder       , "intersection"    , TT("intersection")     , [ LineLineIntersection, LineArcIntersection, ArcArcIntersection ] ],
    [ LineSegmentBuilder        , "line-segment"    , TT("line segment")     , [ LineSegment ] ],
    [ RayBuilder                , "ray"             , TT("ray")              , [ Ray ] ],
    [ PolygonBuilder            , "polygon"         , TT("polygon")          , [ Polygon ] ],
    [ PerpendicularBuilder      , "perpendicular"   , TT("perpendicular")    , [ FootOfPerpendicular ] ],
    [ ParallelLineBuilder       , "parallel-line"   , TT("parallel line")    , [ ParallelLine ] ],
    [ Circle1Builder            , "circle-by-point" , TT("circle by point")  , [ CircleByPoint ] ],
    [ Circle2Builder            , "circle-by-radius", TT("circle by radius") , [ CircleByRadius ] ],
    [ ArcBuilder                , "arc"             , TT("arc")              , [ Arc ] ],
    [ EllipseBuilder            , "ellipse"         , TT("ellipse")          , [ Ellipse ] ],
    [ CirclePointTangentBuilder , "tangent-point"   , TT("tangent point")    , [ CirclePointTangent ] ],
    [ CircleCircleTangentBuilder, "tangent-circles" , TT("tangent circles")  , [ CircleCircleTangent ] ],
    [ AngleBuilder              , "angle"           , TT("angle")            , [ Angle ] ],
    [ DimensionLineBuilder      , "dimension-line"  , TT("dimension line")   , [ DimensionLine ] ],
    [ LengthSymbolBuilder       , "length-symbol"   , TT("length symbol")    , [ LengthSymbol ] ],
    [ TextBlockBuilder          , "text"            , TT("text")             , [ TextBlock ] ],
    [ StatementBuilder          , "statement"       , TT("statement")        , [ Statement ] ],
];

export function makeShapeButton(shape : MathEntity) : layout_ts.Button {
    let shape_img_name : string | undefined;

    for(const [ tool, img_name, title, shapes] of toolList){
        if(shapes.some(x => shape instanceof x)){

            shape_img_name = img_name;
            break;
        }
    }

    if(shape_img_name == undefined){
        throw new MyError();
    }

    const button = layout_ts.$button({
        url    : `${urlOrigin}/lib/plane/img/${shape_img_name}.png`,
        width  : "20px",
        height : "20px",
        click : async (ev : MouseEvent)=>{
            showProperty(shape, 0);
        }
    });

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