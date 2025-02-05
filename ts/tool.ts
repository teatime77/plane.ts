///<reference path="inference.ts" />
///<reference path="deduction/length_equality.ts" />
///<reference path="deduction/angle_equality.ts" />
///<reference path="deduction/quadrilateral.ts" />
///<reference path="deduction/parallel_detector.ts" />
///<reference path="deduction/triangle_similarity.ts" />
///<reference path="deduction/shape_equation.ts" />
///<reference path="deduction/expr_transform.ts" />
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
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
        View.current.canvas.drawPartialPolygon(this.points, Mode.depend);
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

    triangles() : [Triangle, Triangle] {
        return [ this.triangleA!, this.triangleB! ];
    }

    clear(){
        this.selector.clear();
        this.triangleA = undefined;
        this.triangleB = undefined;
    }

    async click(view : View, position : Vec2, shape : Shape | undefined){
        this.selector.click(view, position, shape);
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
        this.selector.drawTool(view);
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
export let circleArcsSelector = new CircleArcsSelector(2);
export let quadrilateralSelector = new QuadrilateralSelector();

export class Builder {
    static toolName : string;
    static tool : Builder;

    done : boolean = false;

    static async setToolByName(tool_name : string, record_operation : boolean){
        Builder.toolName = tool_name;
        Builder.tool = makeToolByType(tool_name);

        if(record_operation){
            if(tool_name != "SelectionTool" && tool_name != "RangeTool"){
                View.current.addOperation(new ToolSelection(tool_name))
            }    
        }

        await Builder.tool.init();
        if(tool_name == "RangeTool"){
            msg(`dump:\n${View.current.operations.map(x => x.dump()).join("\n")}`);
        }
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

    static async builderResetTool(view : View){
        while(view.operations.length != 0){
            if(last(view.operations) instanceof ToolSelection){
                break;
            }
            view.operations.pop();
        }
        view.operations.forEach(x => msg(x.dump()));

        Builder.tool.resetTool(undefined);
        
        await Builder.setToolByName(Builder.toolName, false);
    }

    async init(){        
    }

    async click(view : View, position : Vec2, shape : Shape | undefined){        
    }

    async finish(view : View){
        throw new MyError();
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

            if(view.operations.length != 0){
                const last_operation = last(view.operations);
                if(last_operation instanceof ClickShape && last_operation.position === position){
                    last_operation.createdPoint = point;
                    // msg(`point is created.`);
                }
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
        if(View.current.operations.length != 0){
            const last_operation = last(View.current.operations);
            last_operation.maxId = Widget.maxId;
            last_operation.shapesLength = View.current.shapes.length;
        }
        View.current.resetMode();

        if(shape != undefined){

            showProperty(shape, 0);
        }

        this.done = true;
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

    async click(view : View, position : Vec2, shape : Shape | undefined){ 
        msg(`selection click:${position}`);
        this.resetTool(undefined);
        if(shape != undefined){

            shape.setMode(Mode.target);
            showProperty(shape, 0);
        }
    }

    pointerdown(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        msg(`selection pointerdown:${position}`);
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
        msg(`selection pointerup:${position}`);
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

    async click(view : View, position : Vec2, shape : Shape | undefined){ 
        msg("range click");
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

export class PointBuilder extends Builder {
    async click(view : View, position : Vec2, shape : Shape | undefined){  
        if(shape == undefined || shape instanceof AbstractLine || shape instanceof Circle){

            const new_point = this.makePointOnClick(view, position, shape);
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
        if(this.pointA == undefined){

            if(shape instanceof Point){
                this.pointA = shape;
                this.pointA.setMode(Mode.depend);
            }
        }
        else if(shape instanceof Point){
            const mid_point = new Midpoint( { position:Vec2.zero(), pointA : this.pointA, pointB : shape  } );

            const lengthSymbolA = new LengthSymbol({pointA : this.pointA, pointB : mid_point, lengthKind : 0});
            const lengthSymbolB = new LengthSymbol({pointA : mid_point  , pointB : shape    , lengthKind : 0});

            const lengthEquality = new LengthEquality({
                reason : LengthEqualityReason.midpoint,
                auxiliaryShapes : [ mid_point ],
                shapes : [ lengthSymbolA, lengthSymbolB ]
            });

            addShapeSetRelations(view, mid_point);
            addShapeSetRelations(view, lengthSymbolA);
            addShapeSetRelations(view, lengthSymbolB);
            addShapeSetRelations(view, lengthEquality);

            this.pointA      = undefined;
            this.resetTool(mid_point);
        }
    }
}

class CircleByPointBuilder extends Builder {
    center? : Point;
    position? : Vec2;

    async click(view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);

            this.position = position;
        }
        else{
            const point = this.makePointOnClick(view, position, shape);

            const circle = new CircleByPoint({ center : this.center, point });

            addShapeSetRelations(view, circle);

            this.resetTool(circle);
            this.center = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        this.position = position;
        View.current.dirty = true;
    }

    drawTool(view : View){        
        if(this.center != undefined){

            const radius = this.position!.distance(this.center.position);
            View.current.canvas.drawCircleRaw(this.center.position, radius, fgColor, defaultLineWidth);
        }
    }
}


class CircleByRadiusBuilder extends Builder {
    center?   : Point;
    position? : Vec2;

    async click(view : View, position : Vec2, shape : Shape | undefined){   
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
    center : Point | undefined;
    xPoint : Point | undefined;
    radiusY = 0;

    async click(view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);
        }
        else if(this.xPoint == undefined){
            this.xPoint = this.makePointOnClick(view, position, shape);
            this.xPoint.setMode(Mode.depend);

        }
        else{
            this.radiusY = this.getRadiusY(position);
            const ellipse = new Ellipse({ center : this.center, xPoint : this.xPoint, radiusY : this.radiusY });
            addShapeSetRelations(view, ellipse);


            this.resetTool(ellipse);
            this.center = undefined;
            this.xPoint = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.center != undefined && this.xPoint != undefined){
            this.radiusY = this.getRadiusY(position);
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
    center : Point | undefined;
    pointA : Point | undefined;
    lastPosition : Vec2 | undefined;

    async click(view : View, position : Vec2, shape : Shape | undefined){   
        if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);
        }
        else if(this.pointA == undefined){
            this.pointA = this.makePointOnClick(view, position, shape);
            this.pointA.setMode(Mode.depend);

            this.lastPosition = position;
        }
        else{

            const pointB = this.makePointOnClick(view, position, shape);

            const arc = new ArcByPoint({ center : this.center, pointA : this.pointA, pointB });

            addShapeSetRelations(view, arc);

            this.resetTool(arc);

            this.center = undefined;
            this.pointA = undefined;
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        this.lastPosition = position;
        view.dirty = true;
    }

    drawTool(view: View): void {
        [this.center, this.pointA].filter(x => x != undefined).forEach(x => x.draw());
        if(this.pointA != undefined){

            const radius = this.center!.position.distance(this.pointA.position)
            const [startAngle, endAngle] = Arc.getAngles(this.center!, this.pointA, this.lastPosition!);
            View.current.canvas.drawArcRaw(this.center!.position, radius, startAngle, endAngle, fgColor, defaultLineWidth);
                
        }
    }
}

class ArcByRadiusBuilder extends Builder {
    center?   : Point;
    lengthSymbol? : LengthSymbol;
    circle? : CircleArc;
    pointA? : Point;
    position? : Vec2;

    async click(view : View, position : Vec2, shape : Shape | undefined){   
        if(shape instanceof LengthSymbol){
            this.lengthSymbol = shape;
            shape.setMode(Mode.depend);

            this.circle = undefined;
        }
        else if(shape instanceof CircleArc){
            this.circle = shape;
            shape.setMode(Mode.depend);

            this.lengthSymbol = undefined;
        }        
        else if(this.center == undefined){

            this.center = this.makePointOnClick(view, position, shape);
            this.center.setMode(Mode.depend);
        }
        else if((this.lengthSymbol != undefined || this.circle != undefined) && this.center != undefined){
            this.position = position;

            if(this.pointA == undefined){
                this.pointA = this.makePointOnClick(view, position, shape);
                this.pointA.setMode(Mode.depend);
            }
            else{

                const [startAngle, endAngle] = Arc.getAngles(this.center!, this.pointA, position);

                let arc : ArcByLengthSymbol | ArcByCircle;
                if(this.lengthSymbol != undefined){

                    arc = new ArcByLengthSymbol({ center : this.center , lengthSymbol : this.lengthSymbol, startAngle, endAngle });
                }   
                else{

                    arc = new ArcByCircle({ center : this.center , circle : this.circle!, startAngle, endAngle });
                }

                addShapeSetRelations(view, arc);
        
                this.center = undefined;
                this.lengthSymbol = undefined;
                this.circle = undefined;
                this.pointA = undefined;
    
                this.resetTool(arc);
            }
        }
    }

    pointermove(event : PointerEvent, view : View, position : Vec2, shape : Shape | undefined){
        if(this.pointA != undefined){
             this.position = position;
            view.dirty = true;
       }
    }

    drawTool(view: View): void {
        [this.center, this.lengthSymbol, this.circle, this.pointA].filter(x => x != undefined).forEach(x => x.draw());

        if((this.lengthSymbol != undefined || this.circle != undefined) && this.center != undefined && this.pointA != undefined){
            const radius = (this.lengthSymbol != undefined ? this.lengthSymbol.length(): this.circle!.radius());
            const [startAngle, endAngle] = Arc.getAngles(this.center!, this.pointA, this.position!);
            View.current.canvas.drawArcRaw(this.center.position, radius, startAngle, endAngle, fgColor, defaultLineWidth);
        }        
    }
}

class LineByPointsBuilder extends Builder {
    pointA? : Point;
    position? : Vec2;

    async click(view : View, position : Vec2, shape : Shape | undefined){   
        if(this.pointA == undefined){

            this.pointA = this.makePointOnClick(view, position, shape);
            this.pointA.setMode(Mode.depend);

            this.position = position;
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

            this.pointA   = undefined;
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

            view.dirty = true;
        }
    }

    drawTool(view : View){
        if(this.pointA != undefined){

            this.pointA.draw();
            view.canvas.drawLineRaw(this.pointA.position, this.position!, fgColor, defaultLineWidth);
        }
    }
}

class LineSegmentBuilder extends LineByPointsBuilder {
}

class PolygonBuilder extends Builder {
    points : Point[] = [];
    lines  : AbstractLine[] = [];
    lastPosition : Vec2 | undefined;

    pendingShapes() : Shape[] {
        return this.points;
    }

    async click(view : View, position : Vec2, shape : Shape | undefined){   

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

    async click(view : View, position : Vec2, shape : Shape | undefined){   
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
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

                    let angleMark = 1;
                    if(isPerpendicular(lineA, lineB)){
                        angleMark = Angle.RightAngleMark;
                    }
                    
                    target = new Angle({ angleMark, lineA, directionA, lineB, directionB });

                    addShapeSetRelations(view, target);
                }
                else{

                    target = new AngleBisector({ lineKind : 0, lineA, directionA, lineB, directionB });

                    addShapeSetRelations(view, target);

                    const angleA = new Angle({ angleMark : 1, lineA, directionA, lineB : target, directionB : 1 });
                    const angleB = new Angle({ angleMark : 1, lineA : target, directionA : 1, lineB, directionB });

                    const angleEquality = makeAngleEqualityByAngleBisector(angleA, angleB, target);

                    addShapeSetRelations(view, angleA);
                    addShapeSetRelations(view, angleB);
                    addShapeSetRelations(view, angleEquality);
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
        if(this.dimLine == undefined){
            if(shape instanceof Point){

                if(this.pointA == undefined){
                    this.pointA = this.makePointOnClick(view, position, shape);
                    this.pointA.setMode(Mode.depend);
                }
                else{
                    this.pointB = this.makePointOnClick(view, position, shape);
                    this.pointB.setMode(Mode.depend);

                    const caption = new TextBlock({ text : "\\int \\frac{1}{2}", isTex : true, offset : Vec2.zero() });

                    this.dimLine = new DimensionLine({ caption, pointA: this.pointA, pointB: this.pointB, shift : 0 });
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof LineByPoints){
            const symbol = new LengthSymbol({pointA : shape.pointA, pointB : shape.pointB, lengthKind : 0});
            addShapeSetRelations(view, symbol);
        }
        else{
            if(this.pointA == undefined){
                this.pointA = this.makePointOnClick(view, position, shape);
                this.position = position;
            }
            else{
                const clicked_point = this.makePointOnClick(view, position, shape);
                const [pointA, pointB] = sortShape<Point>([ this.pointA, clicked_point ]);

                let line = getCommonLineOfPoints(pointA, pointB);
                if(line == undefined){

                    line = makeLineSegment(pointA, pointB);
                    // msg(`make line:${pointA.id} - ${line.id} - ${pointB.id}`);
                    addShapeSetRelations(view, line);
                }

                const symbol = new LengthSymbol({ pointA, pointB, lengthKind : 0});
                addShapeSetRelations(view, symbol);

                this.pointA   = undefined;
                this.position = undefined;

                this.resetTool(symbol);
            }    
        }
    }
}


class TextBlockBuilder extends Builder {
    async click(view : View, position : Vec2, shape : Shape | undefined){   
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

    async clickWithMouseEvent(event : MouseEvent, view : View, position : Vec2, shape : MathEntity | undefined){        
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

                        this.statement.selectedShapes.push(... this.specifiedShapes);

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

            ShapesProperty.one.span.append(button.button);
        }
    }
}


abstract class TriangleCongruenceSimilarityBuilder extends Builder { 
    trianglePairSelector = new TrianglePairSelector();

    async click(view : View, position : Vec2, shape : Shape | undefined){
        this.trianglePairSelector.click(view, position, shape);
        if(this.trianglePairSelector.done()){

            const triangle_statement = this.makeTriangleCongruenceSimilarity(this.trianglePairSelector.triangleA!, this.trianglePairSelector.triangleB!);
            if(triangle_statement != undefined){

                addShapeSetRelations(view, triangle_statement);

                this.resetTool(triangle_statement);
            }
            else{

                this.resetTool(undefined);
            }

            this.trianglePairSelector.clear();
        }
    }

    drawTool(view : View){  
        this.trianglePairSelector.drawTool(view);
    }

    abstract makeTriangleCongruenceSimilarity(A : Triangle, B : Triangle) : Statement | undefined;
}


export class TriangleCongruenceBuilder extends TriangleCongruenceSimilarityBuilder { 
    constructor(triangleCongruence? : TriangleCongruence){
        super();
    }

    makeTriangleCongruenceSimilarity(A : Triangle, B : Triangle) : Statement | undefined {
        return makeTriangleCongruence(A, B);
    }
}

export class TriangleSimilarityBuilder extends TriangleCongruenceSimilarityBuilder {
    constructor(triangleSimilarity? : TriangleSimilarity){
        super();
    }

    makeTriangleCongruenceSimilarity(A : Triangle, B : Triangle) : Statement | undefined {
        return makeTriangleSimilarity(A, B);
    }
}

export class LengthEqualityBuilder extends Builder {
    lengthSymbolA? : LengthSymbol;
    lengthSymbolB? : LengthSymbol;
    lengthEqualityReason : LengthEqualityReason = LengthEqualityReason.none;

    trianglePairSelector : TrianglePairSelector | undefined;

    constructor(lengthEquality? : LengthEquality){
        super();
    }

    clear(){
        this.lengthSymbolA = undefined;
        this.lengthSymbolB = undefined;
        this.lengthEqualityReason = LengthEqualityReason.none;
    }

    async click(view : View, position : Vec2, shape : Shape | undefined){
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

                    this.lengthEqualityReason = await showMenu(lengthEqualityReasonDlg);

                    switch(this.lengthEqualityReason){
                    case LengthEqualityReason.radii_equal:
                        lengthEquality = makeEqualLengthByRadiiEqual(this.lengthSymbolA, this.lengthSymbolB);
                        break;
                    case LengthEqualityReason.common_circle:
                        showPrompt(TT("click the common circle. "));
                        break;
                    case LengthEqualityReason.parallel_lines_distance:
                        linesSelector_2.clear();
                        showPrompt(TT("click two parallel lines. "));
                        break;
                    case LengthEqualityReason.circle_by_radius:
                        lengthEquality = makeEqualLengthByCircleByRadius(this.lengthSymbolA, this.lengthSymbolB);
                        break;
                    case LengthEqualityReason.congruent_triangles:
                        lengthEquality = makeEqualLengthByCongruentTriangles(this.lengthSymbolA, this.lengthSymbolB);
                        break;
                    case LengthEqualityReason.parallelogram_opposite_sides:
                        lengthEquality = makeEqualLengthByParallelogramOppositeSides(this.lengthSymbolA, this.lengthSymbolB);
                        break;
                    case LengthEqualityReason.parallelogram_diagonal_bisection:
                        lengthEquality = makeEqualLengthByParallelogramDiagonalBisection(this.lengthSymbolA, this.lengthSymbolB);
                        break;
                    case LengthEqualityReason.equivalence_class:
                        lengthEquality = makeEqualLengthByEquivalenceClass(this.lengthSymbolA, this.lengthSymbolB);
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
            case LengthEqualityReason.parallel_lines_distance:
                linesSelector_2.click(view, position, shape);
                if(linesSelector_2.done()){
                    lengthEquality = makeEqualLengthByParallelLines(this.lengthSymbolA, this.lengthSymbolB, linesSelector_2.shapes as AbstractLine[]);
                    linesSelector_2.clear();
                }
                break;
            // case LengthEqualityReason.circle_by_radius:
            case LengthEqualityReason.congruent_triangles:
                break;
            case LengthEqualityReason.parallelogram_opposite_sides:
                break;
            case LengthEqualityReason.parallelogram_diagonal_bisection:
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

    drawTool(view : View){  
        if(this.trianglePairSelector != undefined){

            this.trianglePairSelector.drawTool(view);
        }
    }
}

export class AngleEqualityBuilder extends Builder {
    angleA? : Angle;
    angleB? : Angle;
    angleEqualityReason : AngleEqualityReason = AngleEqualityReason.none;

    trianglePairSelector : TrianglePairSelector | undefined;

    constructor(angleEquality? : AngleEquality){
        super();
    }

    clear(){
        this.angleA = undefined;
        this.angleB = undefined;
        this.angleEqualityReason = AngleEqualityReason.none;
        this.trianglePairSelector = undefined;
    }

    async click(view : View, position : Vec2, shape : Shape | undefined){
        let angleEquality : AngleEquality | undefined;

        if(this.angleA == undefined || this.angleB == undefined){

            if(shape instanceof Angle){
                if(this.angleA == undefined){
                    this.angleA = shape;
                    shape.setMode(Mode.depend);
                }
                else if(this.angleB == undefined){
                    this.angleB = shape;
                    shape.setMode(Mode.depend);

                    this.angleEqualityReason = await showMenu(angleEqualityReasonDlg);

                    switch(this.angleEqualityReason){
                    case AngleEqualityReason.vertical_angles:
                        angleEquality = makeAngleEqualityByVertical_angles(this.angleA, this.angleB);
                        break;
                    case AngleEqualityReason.parallel_lines:
                        angleEquality = makeAngleEqualityByParallelLines(this.angleA, this.angleB);
                        break;
                    case AngleEqualityReason.angle_bisector:
                        break;
                    case AngleEqualityReason.congruent_triangles:
                        angleEquality = makeAngleEqualityByCongruentTriangles(this.angleA, this.angleB);
                        break;
                    case AngleEqualityReason.parallelogram_opposite_angles:
                        quadrilateralSelector.clear();
                        break;
                    case AngleEqualityReason.similar_triangles:
                        angleEquality = makeAngleEqualityBySimilarTriangles(this.angleA, this.angleB);
                        break;
                    default:
                        throw new MyError();
                    }
                }
            }        
        }
        else{

            switch(this.angleEqualityReason){
            case AngleEqualityReason.vertical_angles:
                break;

            case AngleEqualityReason.parallel_lines:
                break;

            case AngleEqualityReason.angle_bisector:
                break;

            case AngleEqualityReason.congruent_triangles:
                break;
                
            case AngleEqualityReason.parallelogram_opposite_angles:
                quadrilateralSelector.click(view, position, shape);
                if(quadrilateralSelector.done()){
                    const parallelogram = quadrilateralSelector.polygon as Quadrilateral;
                    angleEquality = makeAngleEqualityByParallelogramOppositeAngles(this.angleA, this.angleB, parallelogram);
                }
                break;

            case AngleEqualityReason.similar_triangles:
                break;
    
            default:
                throw new MyError();
            }
        }

        if(angleEquality != undefined){

            addShapeSetRelations(view, angleEquality);
            this.resetTool(angleEquality);

            this.clear();
        }
    }

    drawTool(view : View){  
        if(this.trianglePairSelector != undefined){

            this.trianglePairSelector.drawTool(view);
        }
    }
}

export class ParallelDetectorBuilder extends Builder {
    parallelReason? : ParallelReason;
    lineA? : AbstractLine;

    clear(){
        this.lineA = undefined;
    }

    async click(view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof AbstractLine){
            if(this.lineA == undefined){
                this.lineA = shape;
                shape.setMode(Mode.depend);
            }
            else{
                shape.setMode(Mode.depend);

                this.parallelReason = await showMenu(parallelReasonDlg);

                let detector : ParallelDetector | undefined;

                switch(this.parallelReason){
                case ParallelReason.parallelogram:
                    detector = makeParallelDetectorByParallelogram(this.lineA, shape);        
    
                    break;
                default:
                    throw new MyError();
                }
                        
                if(detector != undefined){
                    addShapeSetRelations(view, detector);
                    this.resetTool(detector);
                    this.clear();    
                }
            }
        }
    }
}


export class EqualityConstraintBuilder extends Builder {
    lengthSymbolA? : LengthSymbol;
    angleA? : Angle;

    async click(view : View, position : Vec2, shape : Shape | undefined){
        let constraint : Constraint | undefined;

        if(shape instanceof LengthSymbol){
            if(this.lengthSymbolA == undefined){
                this.lengthSymbolA = shape;
                shape.setMode(Mode.depend);
            }
            else{

                constraint = new LengthEqualityConstraint({
                    lengthSymbolA : this.lengthSymbolA,
                    lengthSymbolB : shape
                });
            }
        }
        else if(shape instanceof Angle){
            if(this.angleA == undefined){
                this.angleA = shape;
                shape.setMode(Mode.depend);
            }
            else{

                constraint = new AngleEqualityConstraint({
                    shapes : [ this.angleA, shape ]
                });
            }
        }

        if(constraint != undefined){

            addShapeSetRelations(view, constraint);
            this.resetTool(constraint);

            this.lengthSymbolA = undefined;
            this.angleA = undefined;
        }
    }
}


abstract class ParallelPerpendicularLineBuilder extends Builder {
    line  : AbstractLine | undefined;

    async click(view : View, position : Vec2, shape : Shape | undefined){   
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

    async click(view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Point){
            this.points.push(shape);
            shape.setMode(Mode.depend);
            if(this.points.length == 4){
                const shapeType = await showMenu(shapeTypeDlg);
                

                let reason : ParallelogramReason | RhombusReason;

                switch(shapeType){
                case ShapeType.parallelogram:
                    reason = await showMenu(parallelogramReasonDlg);
                    break;

                case ShapeType.rhombus:
                    reason = await showMenu(rhombusReasonDlg);
                    break;

                default:
                    throw new MyError();
                }

                // msg(`reason:[${reason}]`);

                const classifier = makeQuadrilateralClassifier(this.points, reason);
                if(classifier != undefined){

                    addShapeSetRelations(view, classifier);
                    this.resetTool(classifier);    
                }

                this.points = [];
            }
        }
    }
}

export class ShapeEquationBuilder extends Builder {
    reason : ShapeEquationReason = ShapeEquationReason.none;
    shapes : Shape[] = [];

    async init(){        
        this.reason  = await showMenu(shapeEquationReasonDlg);
    }

    async click(view : View, position : Vec2, shape : Shape | undefined){
        if(shape instanceof Angle){
            if(shape.name == ""){
                msg(TT("The name of the shape is blank."))
                return;
            }

            if(! this.shapes.includes(shape)){

                this.shapes.push(shape);
                shape.setMode(Mode.depend);
            }
            msg(`click eq ${this.shapes.length}`);
        }
    }

    async finish(view : View){        
        msg(`finish shapes ${this.shapes.length}`);

        const shapeEquation = makeShapeEquation(this.reason, this.shapes);
        if(shapeEquation != undefined){
            addShapeSetRelations(view, shapeEquation);
            this.resetTool(shapeEquation);    
        }

        this.shapes = [];
    }
}

export class ExprTransformBuilder extends Builder {
    reason : ExprTransformReason = ExprTransformReason.none;
    terms : Term[] = [];

    async init(){        
        this.reason  = await showMenu(exprTransformReasonDlg);
    }

    async click(view : View, position : Vec2, shape : Shape | undefined){
        msg(`click eq ${this.terms.length}`);
    }

    async dblclick(view : View, position : Vec2, shape : Shape | undefined){
        msg(`dblclick eq ${this.terms.length}`);
    }

    termClick(term : Term){
        msg(`term click ${this.terms.length}`);

        if(! this.terms.includes(term)){
            this.terms.push(term);
        }
    }

    async finish(view : View){
        msg(`finish terms ${this.terms.length}`);

        if(this.terms.length == 1){
            const exprTransform = makeExprTransformByTransposition(this.terms[0]);
            addShapeSetRelations(view, exprTransform);
            this.resetTool(exprTransform);    
        }
        else{
            msg(`terms length != 1`);
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
    [ AngleBuilder              , "angle"              , TT("angle")              , [ Angle ] ],
    [ LengthSymbolBuilder       , "length-symbol"      , TT("length symbol")      , [ LengthSymbol ] ],
    [ TriangleCongruenceBuilder , "triangle-congruence", TT("triangle congruence"), [ TriangleCongruence ] ],
    [ TriangleSimilarityBuilder , "triangle-similarity", TT("triangle similarity"), [ TriangleSimilarity ] ],
    [ LengthEqualityBuilder     , "equal-length"       , TT("equal length")       , [ LengthEquality ] ],
    [ AngleEqualityBuilder      , "equal-angle"        , TT("equal angle")        , [ AngleEquality ] ],
    [ ParallelDetectorBuilder   , "parallel-detector"  , TT("parallel detector")  , [ ParallelDetector ] ],
    [ EqualityConstraintBuilder , "equality-constraint", TT("equality constraint"), [ LengthEqualityConstraint, AngleEqualityConstraint ] ],
    [ ParallelConstraintBuilder , "parallel-constraint"      , TT("parallel constraint"), [ ParallelConstraint ]],
    [ PerpendicularConstraintBuilder , "perpendicular-constraint" , TT("perpendicular constraint"), [ PerpendicularConstraint ]],
    [ QuadrilateralClassifierBuilder, "quadrilateral-classifier", TT("quadrilateral classifier"), [ ParallelogramClassifier, RhombusClassifier ]],
    [ ShapeEquationBuilder, "shape-equation", TT("shape equation"), [ ShapeEquation ] ],
    [ ExprTransformBuilder, "expr-transform", TT("expression transformation"), [ ExprTransform ] ],
];

const editToolList : [typeof Builder, string, string, (typeof MathEntity)[]][] = [
    [ RangeTool                 , "range"              , TT("range")              , [  ] ],
    [ EllipseBuilder            , "ellipse"            , TT("ellipse")            , [ Ellipse ] ],
    [ CirclePointTangentBuilder , "tangent-point"      , TT("tangent point")      , [ CirclePointTangent ] ],
    [ CircleCircleTangentBuilder, "tangent-circles"    , TT("tangent circles")    , [ CircleCircleTangent ] ],
    [ DimensionLineBuilder      , "dimension-line"     , TT("dimension line")     , [ DimensionLine ] ],
    [ TextBlockBuilder          , "text"               , TT("text")               , [ TextBlock ] ],
    [ StatementBuilder          , "statement"          , TT("statement")          , [ Statement ] ],
    [ MotionBuilder             , "animation"          , TT("animation")          , [ Motion ] ],
];

function initToolList(){
    if(i18n_ts.appMode == i18n_ts.AppMode.edit){
        toolList.push(... editToolList);
    }
}

export function makeShapeButton(shape : MathEntity, add_to_view_shapes : boolean) : layout_ts.Button {
    let shape_img_name : string | undefined;

    for(const [ tool, img_name, title, shape_classes] of toolList){
        if(shape_classes.some(x => x.name == shape.constructor.name)){

            shape_img_name = img_name;
            break;
        }
    }

    if(shape_img_name == undefined){
        if(shape instanceof Polygon){
            shape_img_name = "polygon";
        }
        else{

            throw new MyError(`unknown shape class name:[${shape.constructor.name}]`);
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

export function clearShapeList(){
    Plane.one.shapes_block.clear();
    layout_ts.Layout.root.updateRootLayout();
}

export function makeToolButtons() : layout_ts.RadioButton[] {
    initToolList();

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