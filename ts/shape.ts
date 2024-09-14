///<reference path="json.ts" />

namespace planets {
//
const fgColor = "black";
let captionDownPos : Vec2 | undefined;
let offsetDown : Vec2;

abstract class AbstractShape extends Widget {
    constructor(obj : any){
        super(obj);
        
        View.current.dirty = true;
    }
}

export class TextBlock extends AbstractShape {
    x! : number;
    y! : number;
    text : string;
    isTex : boolean;
    div       : HTMLDivElement;

    offset : Vec2 = new Vec2(0, 0);

    constructor(obj : { text : string, isTex : boolean, offset : Vec2 }){
        super(obj);
        this.text  = obj.text;
        this.isTex = obj.isTex;
        this.offset = obj.offset;

        this.div   = document.createElement("div");
        this.div.className = "tex_div";
        if(obj.isTex){

            renderKatexSub(this.div, obj.text);
        }
        else{

            this.div.innerText = obj.text;
        }

        View.current.board.parentElement!.append(this.div);
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            text   : this.text,
            isTex  : this.isTex,
            offset : this.offset
        });

        return obj;
    }

    getProperties(){
        return super.getProperties().concat([
            "text", "isTex", "offset"
        ]);
    }

    setText(text : string){
        this.text = text;
        if(this.isTex){

            renderKatexSub(this.div, text);
        }
        else{

            this.div.innerText = text;
        }
    }

    setTextPosition(x : number, y : number){
        this.x = x;
        this.y = y;

        this.div.style.left = `${this.x + this.offset.x}px`;
        this.div.style.top  = `${this.y + this.offset.y}px`;
    }

    setRotation(degree : number){
        this.div.style.transform = `rotate(${degree}deg)`;
    }

    getSize() : [number, number] {
        return [ this.div.offsetWidth, this.div.offsetHeight ];
    }

    captionPointerdown(event : PointerEvent){
        this.div.setPointerCapture(event.pointerId);

        captionDownPos = new Vec2(event.screenX, event.screenY);
        offsetDown = this.offset.copy();
        const x = this.div.style.left;
        const y = this.div.style.top;
        const [x2, y2] = [this.div.offsetLeft, this.div.offsetTop];
        msg(`caption : ${x} ${y} ${x2} ${y2}`);

    }

    captionPointermove(event : PointerEvent){
        if(captionDownPos == undefined){
            return;
        }
        const diff = new Vec2(event.screenX, event.screenY).sub(captionDownPos);
        this.offset = offsetDown.add(diff);
        
        this.div.style.left = `${this.x + this.offset.x}px`;
        this.div.style.top  = `${this.y + this.offset.y}px`;
    }

    captionPointerup(event : PointerEvent){
        this.div.releasePointerCapture(event.pointerId);
        captionDownPos = undefined;
    }

}

export abstract class Shape extends AbstractShape {
    name      : string = "";
    color     : string = fgColor;
    lineWidth : number = 1;
    caption   : TextBlock | undefined;
    depends   : Shape[] = [];

    isOver : boolean = false;
    selected : boolean = false;

    abstract draw() : void;

    constructor(obj : any){
        super(obj);
        if(obj.color != undefined){
            this.color = obj.color;
        }
        if(obj.lineWidth != undefined){
            this.lineWidth = obj.lineWidth;
        }
    }

    copy() : Shape {
        throw new MyError();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            name : this.name
        });

        if(this.color != fgColor){
            obj.color = this.color;
        }

        if(this.lineWidth != 1){
            obj.lineWidth = this.lineWidth;
        }

        if(this.caption != undefined){
            obj.caption = this.caption.makeObj();
        }

        if(this.depends.length != 0){
            obj.depends = this.depends.map(x => x.id);
        }

        return obj;
    }

    getProperties(){
        return super.getProperties().concat([
            "name", "caption", "color", "lineWidth"
        ]);
    }

    isNear(position : Vec2) : boolean {        
        return false;
    }

    getAllShapes(shapes : Shape[]){
        shapes.push(this);
    }

    dependencies() : Shape[] {
        return [];
    }

    calc(){        
    }

    updateCaption(){ 
    }

    select(){
        this.selected = true;
    }

    unselect(){
        this.selected = false;
    }

    shapePointerdown(position : Vec2){
    }

    shapePointermove(position : Vec2, diff : Vec2){
    }

    shapePointerup(position : Vec2){
    }
}

export class Point extends Shape {
    static tempPoints : Point[] = [];

    static radiusPix = 4;
    static radius : number;

    position! : Vec2;
    positionSave : Vec2 | undefined;
    bound : AbstractLine | CircleArc | undefined;

    origin : Point | undefined;

    static zero() : Point {
        return Point.fromArgs(Vec2.zero());
    }

    static fromArgs(position : Vec2, bound : AbstractLine | CircleArc | undefined = undefined){
        const caption = new TextBlock( { text : "", isTex : false, offset : new Vec2(10, -20) });
        return new Point( { name : undefined, color : fgColor, position : position, bound : bound, caption } );
    }

    constructor(obj : { name : string | undefined, color : string, position : Vec2, bound : AbstractLine | CircleArc | undefined, caption : TextBlock }){
        super(obj);
        this.bound = obj.bound;

        if(obj.name != undefined){
            this.name = obj.name;
        }
        else{

            const points = View.current.allShapes().filter(x => x instanceof Point).concat(Point.tempPoints);
            const idxes = points.map(x => upperLatinLetters.indexOf(x.name));
            if(idxes.length == 0){
                this.name = upperLatinLetters[0];
            }
            else{
                const max_idx = Math.max(...idxes);
                if(max_idx == -1){
                    this.name = upperLatinLetters[0];
                }
                else if(max_idx + 1 < upperLatinLetters.length){
                    this.name = upperLatinLetters[max_idx + 1];
                }
                else{
                    throw new MyError();
                }
            }
        }

        Point.tempPoints.push(this);

        this.caption = obj.caption;
        this.caption.setText(this.name);
        setCaptionEvent(this.caption);

        if(obj.bound instanceof LineSegment){

            this.setPosition(calcFootOfPerpendicular(obj.position, obj.bound));
        }
        else{

            this.setPosition(obj.position);
        }

        msg(`point:${this.name}`);
    }

    copy() : Point {
        return Point.fromArgs(this.position.copy());
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            position : this.position
        });

        return obj;
    }

    setPosition(position : Vec2){
        this.position = position;

        this.updateCaption();

        View.current.changed.add(this);
        View.current.dirty = true;
    }

    setName(name : string){
        this.name = name;
        this.caption!.setText(name);
        View.current.dirty = true;
    }

    updateCaption(){
        const position_pix = View.current.toPixPosition(this.position);

        const x = View.current.board.offsetLeft + position_pix.x;
        const y = View.current.board.offsetTop  + position_pix.y;

        this.caption!.setTextPosition(x, y);
    }

    getProperties(){
        return super.getProperties().concat([
            "position"
        ]);
    }

    isNear(position : Vec2) : boolean {
        return View.current.isNear(position.distance(this.position));
    }

    draw() : void {
        const color = (this.isOver ? "red" : this.color);

        View.current.canvas.drawCircle(this.position, Point.radius, color, null, 0);
        
        if(this.isOver){

            View.current.canvas.drawCircle(this.position, 3 * Point.radius, null, "gray", 1);
        }
    }

    sub(point : Point) : Vec2 {
        return this.position.sub(point.position);
    }

    dot(point : Point) : number {
        return this.position.dot(point.position);
    }

    distance(p : Point | Vec2) : number {
        if(p instanceof Point){
            return this.position.distance(p.position);
        }
        else{
            return this.position.distance(p);
        }
    }

    shapePointerdown(position : Vec2){
        this.positionSave = this.position.copy();
    }

    shapePointermove(position : Vec2, diff : Vec2){
        if(this.bound instanceof LineSegment){

            this.setPosition(calcFootOfPerpendicular(position, this.bound));
        }
        else if(this.bound instanceof CircleArc){
            this.bound.adjustPosition(this, position);
        }
        else{

            if(this.positionSave != undefined){

                this.setPosition(this.positionSave.add(diff));
            }
        }
    }

    shapePointerup(position : Vec2){
        this.positionSave = undefined;
    }
}

export abstract class AbstractLine extends Shape {
    pointA : Point;
    e!     : Vec2;

    constructor(obj : { pointA: Point }){
        super(obj);
        this.pointA = obj.pointA;
    }


    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            pointA : this.pointA.toObj()
        });

        return obj;
    }    

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.pointA ]);
    }

    normal() : Vec2 {
        return this.e.rot90();
    }

    isNear(position : Vec2) : boolean {
        const distance = Math.abs( this.normal().dot(position.sub(this.pointA.position)) );
        return View.current.isNear(distance);
    }
}

export class Line extends AbstractLine {
    draw() : void {
        const l = View.current.max.distance(View.current.min);
        const p1 = this.pointA.position.add(this.e.mul(-l));
        const p2 = this.pointA.position.add(this.e.mul( l));
        View.current.canvas.drawLine(this, p1, p2);
    }
}

export class LineSegment extends AbstractLine {    
    pointB   : Point;

    constructor(obj : { pointA: Point, pointB: Point }){
        super(obj);
        this.pointB = obj.pointB;

        this.calc();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            pointB : this.pointB.toObj()
        });

        return obj;
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.pointB ]);
    }

    calc(){
        this.e = this.pointB.sub(this.pointA).unit();
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA, this.pointB);
    }

    isNear(position : Vec2) : boolean {
        if(!super.isNear(position)){
            return false;
        }

        const AB = this.pointA.distance(this.pointB);

        const n = this.e.dot(position.sub(this.pointA.position));

        return 0 <= n && n <= AB;
    }

    draw() : void {
        View.current.canvas.drawLine(this, this.pointA.position, this.pointB.position);
    }
}



export class ParallelLine extends Line {   
    line : AbstractLine;

    constructor(obj : { pointA: Point, line: AbstractLine }){
        super(obj);
        this.e = obj.line.e.copy();

        this.line = obj.line;

        this.calc();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            line : this.line.toObj()
        });

        return obj;
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.line ]);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.line);
    }

    calc(){
        this.e = this.line.e.copy();
    }

}



export abstract class CircleArcEllipse extends Shape {
    center : Point;

    constructor(obj : { center : Point }){
        super(obj);
        this.center = obj.center;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            center : this.center.toObj(),
        });

        return obj;
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.center);
    }

    dependencies() : Shape[] {
        return [ this.center ];
    }
}

export abstract class CircleArc extends CircleArcEllipse {
    abstract radius() : number;

    adjustPosition(point : Point, position : Vec2){
        const v = position.sub(this.center.position);
        const theta = Math.atan2(v.y, v.x);
        const x = this.radius() * Math.cos(theta);
        const y = this.radius() * Math.sin(theta);
        
        const new_pos = this.center.position.add( new Vec2(x, y) );
        point.setPosition(new_pos);
    }
}

export abstract class Circle extends CircleArc {
    constructor(obj : { center : Point }){
        super(obj);
    }

    isNear(position : Vec2) : boolean {
        const r = position.distance(this.center.position);
        return View.current.isNear( Math.abs(r - this.radius()) );
    }

    draw() : void {
        const stroke_color = (this.isOver ? "red" : this.color);
        const line_width = (this.selected ? 3 : this.lineWidth)
        View.current.canvas.drawCircle(this.center.position, this.radius(), null, stroke_color, line_width)
    }
}

export class CircleByPoint extends Circle {
    point : Point;

    constructor(obj : { center : Point, point : Point, color : string }){
        super(obj);
        this.point = obj.point;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            point : this.point.toObj(),
        });

        return obj;
    }

    static fromArgs(center : Point, point : Point, color : string = fgColor){
        return new CircleByPoint({ center : center, point : point, color : color })
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.point);
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.point ]);
    }

    calc(){        
    }

    radius() : number {
        return this.center.position.distance(this.point.position);
    }
}

export class CircleByRadius extends Circle {
    private radius_ : number;

    constructor(obj : { center : Point, radius : number }){
        super(obj);
        this.radius_ = obj.radius;
    }

    calc(){        
    }

    radius() : number {
        return this.radius_;
    }

    setRadius(radius : number){
        this.radius_ = radius;
    }
}

export class Ellipse extends CircleArcEllipse {
    xPoint  : Point;
    radiusY : number;

    constructor(obj : { center : Point, xPoint : Point, radiusY : number }){
        super(obj);
        this.xPoint  = obj.xPoint;
        this.radiusY = obj.radiusY;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            xPoint : this.xPoint.toObj(),
            radiusY : this.radiusY
        });

        return obj;
    }

    setRadiusY(radiusY : number){
        this.radiusY = radiusY;
        View.current.dirty = true;
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.xPoint);
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.center, this.xPoint ]);
    }

    draw() : void {
        const radius_x = this.xPoint.position.distance(this.center.position);

        const center_to_x = this.xPoint.sub(this.center)
        const rotation = Math.atan2(- center_to_x.y, center_to_x.x);

        const color = (this.isOver ? "red" : this.color);
        const line_width = (this.selected ? 3 : 1);

        View.current.canvas.drawEllipse(this.center.position, radius_x, this.radiusY, rotation, color, line_width);
    }
}


export class Arc extends CircleArc {
    pointA : Point;
    pointB : Point;

    constructor(obj : { center : Point, pointA : Point, pointB : Point }){
        super(obj);
        this.pointA = obj.pointA;
        this.pointB = obj.pointB;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            pointA : this.pointA.toObj(),
            pointB : this.pointB.toObj()
        });

        return obj;
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA, this.pointB);
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.pointA, this.pointB ]);
    }

    calc(){        
        this.adjustPosition(this.pointB, this.pointB.position);
    }

    isNear(position : Vec2) : boolean {
        const r = position.distance(this.center.position);
        if(View.current.isNear( Math.abs(r - this.radius()) )){

            const v = position.sub(this.center.position);
            const th = Math.atan2(v.y, v.x);

            const [th1, th2] = this.angles();
            return th1 <= th && th <= th2;
        }

        return false;
    }

    angles() : [number, number] {
        const v1 = this.pointA.sub(this.center);
        const th1 = Math.atan2(v1.y, v1.x);

        const v2 = this.pointB.sub(this.center);
        const th2 = Math.atan2(v2.y, v2.x);

        return [th1, th2];
    }

    draw(): void {
        const [th1, th2] = this.angles();
        const color = (this.isOver ? "red" : this.color);
        View.current.canvas.drawArc(this.center.position, this.radius(), null, color, this.lineWidth, th1, th2);
    }

    radius() : number {
        return this.center.position.distance(this.pointA.position);
    }
}


export class Angle extends Shape {
    static radius1Pix = 20;
    static radius1 : number;

    lineA       : AbstractLine;
    directionA  : number;

    lineB       : AbstractLine;
    directionB  : number;

    intersection : Point;

    constructor(obj : { lineA : AbstractLine, directionA : number, lineB : AbstractLine, directionB : number }){
        super(obj);
        this.lineA       = obj.lineA;
        this.directionA  = obj.directionA;

        this.lineB       = obj.lineB;
        this.directionB  = obj.directionB;

        const points = View.current.relation.getIntersections(this.lineA, this.lineB);
        assert(points.length == 1);
        
        this.intersection = points[0];
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            lineA      : this.lineA.toObj(),
            directionA : this.directionA,
            lineB      : this.lineB.toObj(),
            directionB : this.directionB
        });

        return obj;
    }

    dependencies() : Shape[] {
        return [ this.lineA, this.lineB ];
    }

    calc(){        
    }

    draw() : void {
        const e1 = this.lineA.e.mul(this.directionA);
        const e2 = this.lineB.e.mul(this.directionB);

        const th1 = Math.atan2(e1.y, e1.x);
        const th2 = Math.atan2(e2.y, e2.x);

        const color = (this.isOver ? "red" : this.color);
        const line_width = (this.selected ? 3 : 1);

        View.current.canvas.drawArc(this.intersection.position, Angle.radius1, null, color, line_width, th1, th2);
    }
}


export class DimensionLine extends Shape {
    pointA : Point;
    pointB : Point;
    shift  : number;
    center! : Vec2;
    text : string = "";

    constructor(obj : { pointA : Point, pointB : Point, shift : number, caption : TextBlock }){
        super(obj);
        this.pointA    = obj.pointA;
        this.pointB    = obj.pointB;
        this.shift     = obj.shift;

        this.caption = obj.caption;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            pointA : this.pointA.toObj(),
            pointB : this.pointB.toObj(),
            shift  : this.shift
        });

        return obj;
    }

    setShift(shift : number){
        this.shift = shift;
        View.current.dirty = true;
    }

    getProperties(){
        return super.getProperties().concat([
            "text"
        ])
    }

    dependencies() : Shape[] {
        return [ this.pointA, this.pointB ];
    }

    calc(){        
    }

    updateCaption(){ 
        const center_pix = View.current.toPixPosition(this.center);

        const [text_width, text_height] = this.caption!.getSize();
        const x = View.current.board.offsetLeft + center_pix.x - 0.5 * text_width;
        const y = View.current.board.offsetTop  + center_pix.y - 0.5 * text_height;

        this.caption!.setTextPosition(x, y);
    }

    draw() : void {
        if(this.caption == undefined){
            throw new MyError();
        }

        const A = this.pointA.position;
        const B = this.pointB.position;

        const AB = B.sub(A);
        const normal = AB.rot90().unit();
        const shift_vec = normal.mul(this.shift);

        const A_shift = A.add(shift_vec);
        const B_shift = B.add(shift_vec);

        const shift_pix_len = View.current.toPix(Math.abs(this.shift));
        const ratio = (shift_pix_len + 5) / shift_pix_len;
        const shift_plus = shift_vec.mul(ratio);
        const A_shift_plus = A.add(shift_plus);
        const B_shift_plus = B.add(shift_plus);

        const A_shift_inside = A_shift.add(AB.mul( 1/3));
        const B_shift_inside = B_shift.add(AB.mul(-1/3));

        this.center = A.add(B).mul(0.5).add(shift_vec);
        this.updateCaption();

        const degree = toDegree( Math.atan2(-AB.y, AB.x) );
        this.caption.setRotation(degree);

        View.current.canvas.drawLine(this, A, A_shift_plus);
        View.current.canvas.drawLine(this, B, B_shift_plus);

        View.current.canvas.drawLine(this, A_shift, A_shift_inside);
        View.current.canvas.drawLine(this, B_shift, B_shift_inside);
    }
}

}
