///<reference path="inference.ts" />
///<reference path="deduction/equal_length.ts" />
///<reference path="deduction/equal_angle.ts" />
///<reference path="deduction/quadrilateral.ts" />
///<reference path="constraint.ts" />

namespace plane_ts {
//

function addShapeSetRelations(view : View, shape : MathEntity){
    view.addShape(shape);
    shape.setRelations();
}

abstract class shapesSelector{
    numShapes : number;
    shapes     : Shape[] = [];

    constructor(numShapes : number){
        this.numShapes = numShapes;
    }

    abstract isInstanceof(shape : Shape | undefined) : boolean;

    clear(){
        this.shapes = [];
    }

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.isInstanceof(shape)){
            this.shapes.push(shape as Shape);
        }
    }

    drawTool(view : View){  
        this.shapes.forEach(x => x.draw());
    }

    done() : boolean {
        return this.shapes.length == this.numShapes;
    }
}

class LinesSelector extends shapesSelector {
    isInstanceof(shape : Shape | undefined) : boolean {
        return shape instanceof AbstractLine;
    }
}

class CircleArcsSelector extends shapesSelector {
    isInstanceof(shape : Shape | undefined) : boolean {
        return shape instanceof CircleArc;
    }
}

class PolygonsSelector {
    numVertices : number;
    points  : Point[] = [];
    polygon? : Polygon;

    constructor(numVertices : number){
        this.numVertices = numVertices;
    }

    clear(){
        this.points    = [];
        this.polygon  = undefined;
    }

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Point){
            shape.setMode(Mode.depend);

            this.points.push(shape);
            if(this.points.length == this.numVertices){

                if(this.numVertices == 3){

                    this.polygon = new Triangle({
                        points : this.points,
                        lines : []
                    });
                }
                else if(this.numVertices == 4){
                    this.polygon = new Quadrilateral({
                        points : this.points,
                        lines : []
                    });
                }
                else{
                    throw new MyError();
                }
            }
        }
    }

    drawTool(view : View){  
        if(this.polygon != undefined){
            this.polygon.draw();
        }
    }

    done() : boolean {
        return this.polygon != undefined;
    }
}

class TrianglePairSelector {
    selector = new PolygonsSelector(3);
    triangleA? : Triangle;
    triangleB? : Triangle;

    constructor(){
        this.selector
    }

    clear(){
        this.selector.clear();
        this.triangleA = undefined;
        this.triangleB = undefined;
    }

    click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        this.selector.click(event, view, position, shape);
        if(this.selector.done()){
            this.selector.polygon!.setMode(Mode.depend);
            if(this.triangleA == undefined){
                this.triangleA = this.selector.polygon as Triangle;
            }
            else{

                this.triangleB = this.selector.polygon as Triangle;
            }

            this.selector.clear();
        }
    }    

    done() : boolean {
        return this.triangleA != undefined && this.triangleB != undefined;
    }

    drawTool(view : View){  
        [this.triangleA, this.triangleB].filter(x => x != undefined).forEach(x => x.draw());
    }

    areCongruentTriangles() : boolean {
        if(this.triangleA != undefined && this.triangleB != undefined){
            return this.triangleA.isCongruent(this.triangleB);
        }

        throw new MyError();
    }
}

class QuadrilateralSelector extends PolygonsSelector {
    constructor(){
        super(4);
    }
}

export let linesSelector_2 = new LinesSelector(2);
export let linesSelector_3 = new LinesSelector(3);
export let circleArcsSelector = new CircleArcsSelector(2);
export let trianglePairSelector = new TrianglePairSelector();
export let quadrilateralSelector = new QuadrilateralSelector();

export class Builder {
    static toolName : string;
    static tool : Builder;
    static shape : Statement | undefined;

    static setToolByName(tool_name : string){
        Builder.shape = undefined;
        Builder.toolName = tool_name;
        Builder.tool = makeToolByType(tool_name);
    }

    static setToolByShape(shape : Statement){
        if(shape instanceof TriangleCongruence){

            msg("set Triangle Congruence Builder");
            Builder.tool = new TriangleCongruenceBuilder(shape);
        }
        else if(shape instanceof LengthEquality){

            msg("set Equal Length Builder");
            Builder.tool = new LengthEqualityBuilder(shape);
        }
        else{

            msg("set Statement Builder");
            Builder.tool = new StatementBuilder(shape);
        }
    }

    static resetTool(){
        Builder.tool.resetTool(undefined);
        
        if(Builder.shape != undefined){
            Builder.setToolByShape(Builder.shape);
        }
        else{
            Builder.setToolByName(Builder.toolName);
        }
    }

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){        
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

    pendingShapes() : Shape[] {
        return [];
    }
}

export class SelectionTool extends Builder {
    downOffset : Vec2 | undefined;

    selectedShape : Shape | undefined;
    minSave : Vec2 | undefined;
    maxSave : Vec2 | undefined;
    oldPosition? : Vec2;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){ 
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

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){ 
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
    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){  
        if(shape == undefined || shape instanceof AbstractLine || shape instanceof Circle){

            const new_point = Point.fromArgs(position);
            if(shape != undefined){
                new_point.setBound(shape);
            }
            new_point.updateCaption();

            addShapeSetRelations(view, new_point);

            this.resetTool(new_point);
        }
    }
}

class MidpointBuilder extends Builder {
    pointA : Point | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.pointA == undefined){

            if(shape instanceof Point){
                this.pointA = shape;
                this.pointA.setMode(Mode.depend);
            }
        }
        else if(shape instanceof Point){
            const mid_point = new Midpoint( { position:Vec2.zero(), pointA : this.pointA, pointB : shape  } );
            addShapeSetRelations(view, mid_point);
            this.pointA      = undefined;
            this.resetTool(mid_point);
        }
    }
}

class CircleByPointBuilder extends Builder {
    circle : CircleByPoint | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.circle == undefined){

            const center = this.makePointOnClick(view, position, shape);
            center.setMode(Mode.depend);

            const point = Point.fromArgs(position);
            this.circle = CircleByPoint.fromArgs(center, point);

            addShapeSetRelations(view, this.circle);
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

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);

            this.position = this.center.position;
        }
        else{
            if(shape instanceof LengthSymbol){

                const circle = new CircleByRadius({ center : this.center , lengthSymbol : shape });
                addShapeSetRelations(view, circle);
    
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

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);
        }
        else if(this.xPoint == undefined){
            this.xPoint = this.makePointOnClick(view, position, shape);
            this.xPoint.setMode(Mode.depend);

            this.ellipse = new Ellipse({ center : this.center, xPoint : this.xPoint, radiusY : 0 });
            addShapeSetRelations(view, this.ellipse);
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

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);
        }
        else if(this.pointA == undefined){
            this.pointA = this.makePointOnClick(view, position, shape);
            this.pointA.setMode(Mode.depend);

            this.pointB = Point.fromArgs(position);

            this.arc = new ArcByPoint({ center : this.center, pointA : this.pointA, pointB : this.pointB });
            this.arc.setMode(Mode.depend);
        }
        else{

            addShapeSetRelations(view, this.arc!);

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

    drawTool(view: View): void {
        [this.center, this.pointA, this.pointB, this.arc].filter(x => x != undefined).forEach(x => x.draw());
    }
}

class ArcByRadiusBuilder extends Builder {
    center?   : Point;
    lengthSymbol? : LengthSymbol;
    circle? : CircleArc;
    pointA? : Point;
    arc? : ArcByLengthSymbol | ArcByCircle;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(shape instanceof LengthSymbol){
            this.lengthSymbol = shape;
            shape.setMode(Mode.depend);
        }
        else if(shape instanceof CircleArc){
            this.circle = shape;
            shape.setMode(Mode.depend);
        }        
        else if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);
        }
        else if((this.lengthSymbol != undefined || this.circle != undefined) && this.center != undefined){
            if(this.pointA == undefined){
                this.pointA = this.makePointOnClick(view, position, shape);
                this.pointA.setMode(Mode.depend);

                const [startAngle, endAngle] = Arc.getAngles(this.center!, this.pointA, this.pointA);
                if(this.lengthSymbol != undefined){

                    this.arc = new ArcByLengthSymbol({ center : this.center , lengthSymbol : this.lengthSymbol, startAngle, endAngle });
                }   
                else{

                    this.arc = new ArcByCircle({ center : this.center , circle : this.circle!, startAngle, endAngle });
                }

                this.arc.adjustPosition(this.arc.pointA, position);

                this.arc.setMode(Mode.depend);
            }
            else{

                addShapeSetRelations(view, this.arc!);
        
                this.arc = undefined;
                this.center = undefined;
                this.lengthSymbol = undefined;
                this.circle = undefined;
                this.pointA = undefined;
    
                this.resetTool(this.arc);
            }
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.arc != undefined){

            this.arc.adjustPosition(this.arc.pointB, position);
        }
    }

    drawTool(view: View): void {
        const shapes : (Shape | undefined)[] = [this.center, this.pointA];

        if(this.arc != undefined){
            shapes.push(this.arc, this.arc.pointB)
        }

        shapes.filter(x => x != undefined).forEach(x => x.draw());
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

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
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

            addShapeSetRelations(view, line);

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
    points : Point[] = [];
    lines  : AbstractLine[] = [];
    lastPosition : Vec2 | undefined;

    pendingShapes() : Shape[] {
        return this.points;
    }

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   

        const point = this.makePointOnClick(view, position, shape);

        if(this.points.length != 0){

            const pointA = last(this.points);
            let line = getCommonLineOfPoints(pointA, point);
            if(line == undefined){

                line = makeLineSegment(pointA, point);
            }

            this.lines.push(line);
        }

        if(3 <= this.points.length && this.points[0] == point){

            const polygon = new Polygon({ points : this.points, lines : this.lines });
            addShapeSetRelations(view, polygon);

            this.resetTool(polygon);
            this.points = [];
            this.lines  = [];
        }
        else{
            point.setMode(Mode.depend);

            this.points.push(point);
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.points.length != 0){

            this.lastPosition = position;
            View.current.dirty = true;
        }
    }    

    drawTool(view: View): void {
        if(this.points.length != 0 && this.lastPosition != undefined){
            
            this.points.forEach(x => x.draw());
            
            for(const [idx, point] of this.points.entries()){
                let position : Vec2;
                
                if(idx + 1 < this.points.length){
                    position = this.points[idx + 1].position;
                }
                else{
                    position = this.lastPosition;
                }
                
                view.canvas.drawLineRaw(point.position, position, dependColor, defaultLineWidth);
            }
        }
    }
}

class ParallelLineBuilder extends Builder {
    line  : AbstractLine | undefined;
    point : Point | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
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
            addShapeSetRelations(view, parallel_line);

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

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.point == undefined && shape instanceof Point){
            this.point  = this.makePointOnClick(view, position, shape);
            this.point.setMode(Mode.depend);
        }
        else if(shape instanceof AbstractLine){
            this.line = shape;
        }

        if(this.point != undefined && this.line != undefined){

            const foot  = Point.fromArgs(Vec2.nan());
            const perpendicular = new FootOfPerpendicular({ lineKind : 3, pointA : this.point, line : this.line, foot });
            addShapeSetRelations(view, perpendicular);

            this.point = undefined;
            this.line  = undefined;

            this.resetTool(perpendicular);
    }
    }
}

class PerpendicularLineBuilder extends Builder {
    line   : AbstractLine | undefined;
    pointA : Point | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof AbstractLine){
            this.line = shape;
        }
        else if(shape instanceof Point){

            this.pointA = shape;
        }

        if(this.line != undefined && this.pointA != undefined){

            if(this.line.includesPoint(this.pointA)){

                const line = new PerpendicularLine({ lineKind : LineKind.line, line : this.line, pointA : this.pointA });
                addShapeSetRelations(view, line);

                this.line  = undefined;
                this.pointA = undefined;
                
                this.resetTool(line);
            }
            else{

                msg("The point is not on the line.");
            }
        }
    }
}

class IntersectionBuilder extends Builder {
    shape1 : AbstractLine | CircleArc | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
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

                addShapeSetRelations(view, new_shape);

                this.shape1 = undefined;
                this.resetTool(new_shape);
            }

        }

    }
}


class CirclePointTangentBuilder extends Builder {
    circle : Circle | undefined;
    point  : Point  | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Circle){

            this.circle = shape;
        }

        if(shape instanceof Point){
            this.point = this.makePointOnClick(view, position, shape);
        }

        if(this.circle != undefined && this.point != undefined){

            const tangent = new CirclePointTangent( { circle : this.circle, point : this.point });
            addShapeSetRelations(view, tangent);

            this.circle = undefined;
            this.point  = undefined;
            this.resetTool(tangent);
        }
    }
}


class CircleCircleTangentBuilder extends Builder {
    circle : Circle | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Circle){

            if(this.circle == undefined){
                this.circle = shape;
            }
            else{
                const tangent = new CircleCircleTangent( { circle1 : this.circle, circle2 : shape });
                addShapeSetRelations(view, tangent);
    
                this.circle = undefined;
                this.resetTool(tangent);
            }
        }
    }
}


abstract class AbstractAngleBuilder extends Builder {
    line1 : AbstractLine | undefined;
    pos1  : Vec2 | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
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

                let target : Angle | AngleBisector;

                if(this instanceof AngleBuilder){

                    target = new Angle({ angleMark : 1, lineA, directionA, lineB, directionB });

                    addShapeSetRelations(view, target);
                }
                else{

                    target = new AngleBisector({ lineKind : 0, lineA, directionA, lineB, directionB });

                    addShapeSetRelations(view, target);

                    const angleA = new Angle({ angleMark : 1, lineA, directionA, lineB : target, directionB : 1 });
                    const angleB = new Angle({ angleMark : 1, lineA : target, directionA : 1, lineB, directionB });

                    const angle_bisector = new AngleEquality({
                        reason          : AngleEqualityReason.angle_bisector,
                        auxiliaryShapes : [ lineA, lineB, target ],
                        shapes          : [ angleA, angleB ]
                    });

                    addShapeSetRelations(view, angleA);
                    addShapeSetRelations(view, angleB);
                    addShapeSetRelations(view, angle_bisector);
                }

                this.line1 = undefined;
                this.resetTool(target);
            }
        }
    }
}

class AngleBuilder extends AbstractAngleBuilder {
}

class AngleBisectorBuilder extends AbstractAngleBuilder {
}

class DimensionLineBuilder extends Builder {
    pointA : Point | undefined;
    pointB : Point | undefined;
    dimLine : DimensionLine | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
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

            addShapeSetRelations(view, this.dimLine);
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

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof LineByPoints){
            const symbol = new LengthSymbol({pointA : shape.pointA, pointB : shape.pointB, lengthKind : 0});
            addShapeSetRelations(view, symbol);
        }
        else{
            if(this.pointA == undefined){
                this.pointA = this.makePointOnClick(view, position, shape);
            }
            else{
                const clicked_point = this.makePointOnClick(view, position, shape);
                const [pointA, pointB] = sortShape<Point>([ this.pointA, clicked_point ]);

                let line = getCommonLineOfPoints(pointA, pointB);
                if(line == undefined){

                    line = makeLineSegment(pointA, pointB);
                    addShapeSetRelations(view, line);
                }

                const symbol = new LengthSymbol({ pointA, pointB, lengthKind : 0});
                addShapeSetRelations(view, symbol);

                this.pointA      = undefined;

                this.resetTool(symbol);
            }    
        }
    }
}


class TextBlockBuilder extends Builder {
    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        const text_block = new TextBlock({ text : "Text", isTex : false, offset : position });
        text_block.updateTextPosition();

        addShapeSetRelations(view, text_block);
        this.resetTool(text_block);
    }
}


export class StatementBuilder extends Builder {
    statement : Statement;
    specifiedShapes : Shape[] = [];

    constructor(statement? : Statement){
        super();

        if(statement == undefined){

            this.statement = new Statement({ shapes : [] });

            View.current.addShape(this.statement);
        }
        else{
            this.statement = statement;
        }

        showProperty(this.statement, 0);
    }

    async click(event : MouseEvent, view : View, position : Vec2, shape : MathEntity | undefined){        
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

            const button = makeShapeButton(selected_shape, false);
            button.button.style.position = "";

            SelectedShapesProperty.one.span.append(button.button);
        }
    }
}


export class TriangleCongruenceBuilder extends Builder { 
    constructor(triangleCongruence? : TriangleCongruence){
        super();
        trianglePairSelector = new TrianglePairSelector();
    }

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        trianglePairSelector.click(event, view, position, shape);
        if(trianglePairSelector.done()){

            const triangleCongruence = makeTriangleCongruence(trianglePairSelector.triangleA!, trianglePairSelector.triangleB!);
            if(triangleCongruence != undefined){

                addShapeSetRelations(view, triangleCongruence);

                this.resetTool(triangleCongruence);
            }
            else{

                this.resetTool(undefined);
            }

            trianglePairSelector = new TrianglePairSelector();
        }
    }

    drawTool(view : View){  
        trianglePairSelector.drawTool(view);
    }
}

export class LengthEqualityBuilder extends Builder {
    lengthSymbolA? : LengthSymbol;
    lengthSymbolB? : LengthSymbol;
    lengthEqualityReason : LengthEqualityReason = LengthEqualityReason.none;

    constructor(lengthEquality? : LengthEquality){
        super();
    }

    clear(){
        this.lengthSymbolA = undefined;
        this.lengthSymbolB = undefined;
        this.lengthEqualityReason = LengthEqualityReason.none;
    }

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        let lengthEquality : LengthEquality | undefined;

        if(this.lengthEqualityReason == LengthEqualityReason.none){

            if(shape instanceof LengthSymbol){
                if(this.lengthSymbolA == undefined){
                    this.lengthSymbolA = shape;
                    shape.setMode(Mode.depend);
                }
                else if(this.lengthSymbolB == undefined){
                    this.lengthSymbolB = shape;
                    shape.setMode(Mode.depend);

                    const id = await showMenu(lengthEqualityReasonDlg);

                    const key = id.replace("length-equality-reason-", "");
                    this.lengthEqualityReason = LengthEqualityReason[key as keyof typeof LengthEqualityReason];
                    msg(`id:${id} [${key}] [${this.lengthEqualityReason}]`);

                    switch(this.lengthEqualityReason){
                    case LengthEqualityReason.radii_equal:
                        lengthEquality = makeEqualLengthByRadiiEqual(this.lengthSymbolA, this.lengthSymbolB);
                        break;
                    case LengthEqualityReason.common_circle:
                        showPrompt(TT("click the common circle. "));
                        break;
                    case LengthEqualityReason.parallel_lines:
                        linesSelector_2.clear();
                        showPrompt(TT("click two parallel lines. "));
                        break;
                    case LengthEqualityReason.circle_by_radius:
                        lengthEquality = makeEqualLengthByCircleByRadius(this.lengthSymbolA, this.lengthSymbolB);
                        break;
                    case LengthEqualityReason.congruent_triangles:
                        trianglePairSelector.clear();
                        break;
                    case LengthEqualityReason.parallelogram_sides:
                    case LengthEqualityReason.parallelogram_diagonal_bisection:
                        quadrilateralSelector.clear();
                        break;
                    default:
                        throw new MyError();
                    }
                }
            }        
        }
        else{
            if(this.lengthSymbolA == undefined || this.lengthSymbolB == undefined){
                throw new MyError();
            }
            
            switch(this.lengthEqualityReason){
            // case LengthEqualityReason.radii_equal:
            case LengthEqualityReason.common_circle:
                if(shape instanceof CircleArc){
                    lengthEquality = makeEqualLengthByCommonCircle(this.lengthSymbolA, this.lengthSymbolB, shape);
                }
                break;
            case LengthEqualityReason.parallel_lines:
                linesSelector_2.click(event, view, position, shape);
                if(linesSelector_2.done()){
                    lengthEquality = makeEqualLengthByParallelLines(this.lengthSymbolA, this.lengthSymbolB, linesSelector_2.shapes as AbstractLine[]);
                    linesSelector_2.clear();
                }
                break;
            // case LengthEqualityReason.circle_by_radius:
            case LengthEqualityReason.congruent_triangles:
                trianglePairSelector.click(event, view, position, shape);
                if(trianglePairSelector.done()){
                    if(trianglePairSelector.areCongruentTriangles()){
                        lengthEquality = makeEqualLengthByCongruentTrianglesSub(this.lengthSymbolA, this.lengthSymbolB);
                        trianglePairSelector.clear();
                    }
                    else{
                        throw new MyError();
                    }
                }
                break;
            case LengthEqualityReason.parallelogram_sides:
                quadrilateralSelector.click(event, view, position, shape);
                if(quadrilateralSelector.done()){
                    lengthEquality = makeEqualLengthByParallelogramSides(this.lengthSymbolA, this.lengthSymbolB, quadrilateralSelector.polygon as Quadrilateral);
                }
                break;
            case LengthEqualityReason.parallelogram_diagonal_bisection:
                quadrilateralSelector.click(event, view, position, shape);
                if(quadrilateralSelector.done()){
                    lengthEquality = makeEqualLengthByParallelogramDiagonalBisection(this.lengthSymbolA, this.lengthSymbolB, quadrilateralSelector.polygon as Quadrilateral);
                }
                break;
            default:
                throw new MyError();
            }
        }

        if(lengthEquality != undefined){
            addShapeSetRelations(view, lengthEquality);
            this.resetTool(lengthEquality);
            this.clear();
        }
    }
}

export class AngleEqualityBuilder extends Builder {
    angleA? : Angle;
    angleB? : Angle;
    angleEqualityReason : AngleEqualityReason = AngleEqualityReason.none;

    constructor(angleEquality? : AngleEquality){
        super();
    }

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        let angleEquality : AngleEquality | undefined;

        if(shape instanceof Angle){
            if(this.angleA == undefined){
                this.angleA = shape;
                shape.setMode(Mode.depend);
            }
            else if(this.angleB == undefined){
                this.angleB = shape;
                shape.setMode(Mode.depend);

                const id = await showMenu(angleEqualityReasonDlg);
                const key = id.replace("angle-equality-reason-", "");
                this.angleEqualityReason = AngleEqualityReason[key as keyof typeof AngleEqualityReason];
                msg(`id:${id} [${key}] [${this.angleEqualityReason}]`);
                switch(this.angleEqualityReason){
                case AngleEqualityReason.vertical_angles:
                    angleEquality = makeAngleEqualityByVertical_angles(this.angleA, this.angleB);
                    break;
                case AngleEqualityReason.parallel_lines:
                    linesSelector_3.clear();
                    break;
                case AngleEqualityReason.angle_bisector:
                    break;
                case AngleEqualityReason.congruent_triangles:
                    trianglePairSelector.clear();
                    break;
                case AngleEqualityReason.parallelogram_opposite_angles:
                    quadrilateralSelector.clear();
                    break;
                default:
                    throw new MyError();
                }
            }
            else{

                switch(this.angleEqualityReason){
                case AngleEqualityReason.vertical_angles:
                    break;

                case AngleEqualityReason.parallel_lines:
                    linesSelector_3.click(event, view, position, shape);
                    if(linesSelector_3.done()){
                        const parallel_lines = linesSelector_3.shapes.slice(0, 2) as AbstractLine[];
                        const cross_line = linesSelector_3.shapes[2] as AbstractLine;
                        angleEquality = makeAngleEqualityByParallelLines(this.angleA, this.angleB, parallel_lines, cross_line);
                        linesSelector_3.clear();
                    }
                    break;

                case AngleEqualityReason.angle_bisector:
                    break;

                case AngleEqualityReason.congruent_triangles:
                    trianglePairSelector.click(event, view, position, shape);
                    if(trianglePairSelector.done()){
                        if(trianglePairSelector.areCongruentTriangles()){
                            const [triangleA, triangleB] = [trianglePairSelector.triangleA!, trianglePairSelector.triangleB!];
                            angleEquality = makeAngleEqualityByCongruentTriangles(this.angleA, this.angleB, triangleA, triangleB);
                            trianglePairSelector.clear();
                        }
                        else{
                            throw new MyError();
                        }
                    }
                    break;

                case AngleEqualityReason.parallelogram_opposite_angles:
                    quadrilateralSelector.click(event, view, position, shape);
                    if(quadrilateralSelector.done()){
                        const parallelogram = quadrilateralSelector.polygon as Quadrilateral;
                        angleEquality = makeAngleEqualityByParallelogramOppositeAngles(this.angleA, this.angleB, parallelogram);
                    }
                    break;

                default:
                    throw new MyError();
                }
    
                if(angleEquality != undefined){

                    addShapeSetRelations(view, angleEquality);
                    this.resetTool(angleEquality);
                }
                else{

                    this.resetTool(undefined);
                }

                this.angleA = undefined;
                this.angleB = undefined;
            }
        }
    }
}


export class EqualityConstraintBuilder extends Builder {
    lengthSymbolA? : LengthSymbol;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof LengthSymbol){
            if(this.lengthSymbolA == undefined){
                this.lengthSymbolA = shape;
                shape.setMode(Mode.depend);
            }
            else{

                const constraint = new LengthEqualityConstraint({
                    lengthSymbolA : this.lengthSymbolA,
                    lengthSymbolB : shape
                });

                addShapeSetRelations(view, constraint);
                this.lengthSymbolA = undefined;
                this.resetTool(constraint);
            }
        }
    }
}


abstract class ParallelPerpendicularLineBuilder extends Builder {
    line  : AbstractLine | undefined;

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){   
        if(shape instanceof AbstractLine){
            if(this.line == undefined){

                this.line = shape;
                this.line.setMode(Mode.depend);
            }
            else{
                const [lineA, lineB] = sortShape<AbstractLine>([this.line, shape]);
                if(lineB instanceof LineByPoints){

                    let constraint : ParallelPerpendicularConstraint;

                    if(this instanceof ParallelConstraintBuilder){

                        constraint = new ParallelConstraint({ lineA, lineB });
                    }
                    else{
                        constraint = new PerpendicularConstraint({ lineA, lineB });
                    }

                    addShapeSetRelations(view, constraint);

                    this.line  = undefined;
        
                    this.resetTool(constraint);    
                }
                else{
                    this.line.setMode(Mode.none);
                    this.line = undefined;
                }

            }
        }
    }
}

class ParallelConstraintBuilder extends ParallelPerpendicularLineBuilder {
}

class PerpendicularConstraintBuilder extends ParallelPerpendicularLineBuilder {
}

abstract class ClassifierBuilder extends Builder {
}

class QuadrilateralClassifierBuilder extends ClassifierBuilder {
    points : Point[] = [];

    async click(event : MouseEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Point){
            this.points.push(shape);
            shape.setMode(Mode.depend);
            if(this.points.length == 4){
                const lines = range(4).map(i => getCommonLineOfPoints(this.points[i], this.points[(i + 1) % 4])) as AbstractLine[];
                if(lines.some(x => x == undefined)){
                    throw new MyError();
                }
                const quadrilateral = new Quadrilateral({points : this.points, lines});
                if(quadrilateral.shapeClass != QuadrilateralClass.none){

                    addShapeSetRelations(view, quadrilateral);
                    this.resetTool(quadrilateral);    
                }

                this.points = [];
            }
        }
    }

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
    [ AngleBisectorBuilder      , "angle-bisector"     , TT("angle bisector")     , [ AngleBisector ]],
    [ CircleByPointBuilder      , "circle-by-point"    , TT("circle by point")    , [ CircleByPoint ] ],
    [ CircleByRadiusBuilder     , "circle-by-radius"   , TT("circle by radius")   , [ CircleByRadius ] ],
    [ ArcByPointBuilder         , "arc-by-point"       , TT("arc by point")       , [ ArcByPoint ] ],
    [ ArcByRadiusBuilder        , "arc-by-radius"      , TT("arc by radius")      , [ ArcByLengthSymbol, ArcByCircle ] ],
    [ EllipseBuilder            , "ellipse"            , TT("ellipse")            , [ Ellipse ] ],
    [ CirclePointTangentBuilder , "tangent-point"      , TT("tangent point")      , [ CirclePointTangent ] ],
    [ CircleCircleTangentBuilder, "tangent-circles"    , TT("tangent circles")    , [ CircleCircleTangent ] ],
    [ AngleBuilder              , "angle"              , TT("angle")              , [ Angle ] ],
    [ DimensionLineBuilder      , "dimension-line"     , TT("dimension line")     , [ DimensionLine ] ],
    [ LengthSymbolBuilder       , "length-symbol"      , TT("length symbol")      , [ LengthSymbol ] ],
    [ TextBlockBuilder          , "text"               , TT("text")               , [ TextBlock ] ],
    [ TriangleCongruenceBuilder , "triangle-congruence", TT("triangle congruence"), [ TriangleCongruence ] ],
    [ LengthEqualityBuilder     , "equal-length"       , TT("equal length")       , [ LengthEquality ] ],
    [ AngleEqualityBuilder      , "equal-angle"        , TT("equal angle")        , [ AngleEquality ] ],
    [ EqualityConstraintBuilder , "equality-constraint", TT("equality constraint"), [ LengthEqualityConstraint ] ],
    [ ParallelConstraintBuilder , "parallel-constraint"      , TT("parallel constraint"), [ ParallelConstraint ]],
    [ PerpendicularConstraintBuilder , "perpendicular-constraint" , TT("perpendicular constraint"), [ PerpendicularConstraint ]],
    [ StatementBuilder          , "statement"          , TT("statement")          , [ Statement ] ],
    [ QuadrilateralClassifierBuilder, "quadrilateral-classifier", TT("quadrilateral classifier"), [ Quadrilateral ]],
    [ MotionBuilder             , "animation"          , TT("animation")          , [ Motion ] ],
];

export function makeShapeButton(shape : MathEntity, add_to_view_shapes : boolean) : layout_ts.Button {
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
        if(add_to_view_shapes){

            if(button.parent == Plane.one.shapes_block && shape instanceof Statement){
                Builder.setToolByShape(shape);
            }

            showProperty(shape, 0);
        }

        View.current.resetMode();
        shape.setMode(Mode.target);
    };

    return button;
}

export function addToViewShapesList(shape : MathEntity){
    const button = makeShapeButton(shape, true);
    
    Plane.one.shapes_block.addChild(button);
    layout_ts.Layout.root.updateRootLayout();
}

export function popShapeList(){
    Plane.one.shapes_block.popChild();
    layout_ts.Layout.root.updateRootLayout();
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