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

    constructor(obj : { text : string, is_tex : boolean, offset : Vec2 }){
        super(obj);
        this.text  = obj.text;
        this.isTex = obj.is_tex;
        this.offset = obj.offset;

        this.div   = document.createElement("div");
        this.div.className = "tex_div";
        if(obj.is_tex){

            renderKatexSub(this.div, obj.text);
        }
        else{

            this.div.innerText = obj.text;
        }

        View.current.board.append(this.div);
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
        const any_data = obj as any;
        if(any_data.color != undefined){
            this.color = any_data.color;
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
    bound : LineSegment | Circle | undefined;

    origin : Point | undefined;

    static fromArgs(position : Vec2, bound : LineSegment | Circle | undefined = undefined){
        const caption = new TextBlock( { text : "", is_tex : false, offset : new Vec2(10, -20) });
        return new Point( { name : undefined, color : fgColor, position : position, bound : bound, caption } );
    }

    constructor(obj : { name : string | undefined, color : string, position : Vec2, bound : LineSegment | Circle | undefined, caption : TextBlock }){
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

    shapePointerdown(position : Vec2){
        this.positionSave = this.position.copy();
    }

    shapePointermove(position : Vec2, diff : Vec2){
        if(this.bound instanceof LineSegment){

            this.setPosition(calcFootOfPerpendicular(position, this.bound));
        }
        else if(this.bound instanceof Circle){
            const circle = this.bound;

            const v = position.sub(circle.center.position);
            const theta = Math.atan2(v.y, v.x);
            const x = circle.radius() * Math.cos(theta);
            const y = circle.radius() * Math.sin(theta);
            
            const new_pos = circle.center.position.add( new Vec2(x, y) );
            this.setPosition(new_pos);
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

export abstract class Line extends Shape {
    pointA   : Point;
    pointB   : Point;
    p12! : Vec2;
    e!   : Vec2;

    constructor(obj : { pointA: Point, pointB: Point }){
        super(obj);
        this.pointA = obj.pointA;
        this.pointB = obj.pointB;

        this.setVecs();
    }

    dependencies() : Shape[] {
        return [ this.pointA, this.pointB ];
    }

    calc(){     
        this.setVecs();
    }

    setVecs(){
        this.p12 = this.pointB.sub(this.pointA);
        this.e = this.p12.unit();
    }
}

export class LineSegment extends Line {    

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

    isNear(position : Vec2) : boolean {
        const foot = calcFootOfPerpendicular(position, this);        
        const d = position.distance(foot);
        if(View.current.isNear(d)){

            const p1 = this.pointA.position;
            const p2 = this.pointB.position;
            const p12 = p2.sub(p1);
            const n = p12.dot( foot.sub(p1) );
            if(0 <= n && n <= p12.len2()){
                return true;
            }
        }

        return false;
    }

    draw() : void {
        View.current.canvas.drawLine(this, this.pointA.position, this.pointB.position);
    }
}

export abstract class CircleArc extends Shape {
    center : Point;

    constructor(obj : { center : Point }){
        super(obj);
        this.center = obj.center;
    }

    dependencies() : Shape[] {
        return [ this.center ];
    }

    abstract radius() : number;
}

export abstract class Circle extends CircleArc {
    constructor(obj : { center : Point }){
        super(obj);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.center);
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

export class Ellipse extends Shape {
    center : Point;

    xPoint  : Point;
    radiusY : number;

    constructor(obj : { center : Point, x_point : Point, radius_y : number }){
        super(obj);
        this.center  = obj.center;        
        this.xPoint  = obj.x_point;
        this.radiusY = obj.radius_y;
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.center, this.xPoint);
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

export class Angle extends Shape {
    static radius1Pix = 20;
    static radius1 : number;

    lineA : Line;
    dir1  : number;

    lineB : Line;
    dir2  : number;

    intersection : Vec2;

    constructor(obj : { lineA : Line, dir1 : number, lineB : Line, dir2 : number, intersection : Vec2 }){
        super(obj);
        this.lineA = obj.lineA;
        this.dir1  = obj.dir1;

        this.lineB = obj.lineB;
        this.dir2  = obj.dir2;
        
        this.intersection = obj.intersection;
    }

    dependencies() : Shape[] {
        return [ this.lineA, this.lineB ];
    }

    calc(){        
    }

    draw() : void {
        const e1 = this.lineA.e.mul(this.dir1);
        const e2 = this.lineB.e.mul(this.dir2);

        const th1 = Math.atan2(-e1.y, e1.x);
        const th2 = Math.atan2(-e2.y, e2.x);

        const color = (this.isOver ? "red" : this.color);
        const line_width = (this.selected ? 3 : 1);

        View.current.canvas.drawArc(this.intersection, Angle.radius1, null, color, line_width, th1, th2);
    }
}


export class DimensionLine extends Shape {
    pointA : Point;
    pointB : Point;
    center! : Vec2;
    shift : Vec2;
    text : string = "";

    constructor(obj : { pointA : Point, pointB : Point, shift : Vec2 }){
        super(obj);
        this.pointA    = obj.pointA;
        this.pointB    = obj.pointB;
        this.shift = obj.shift;

        this.caption = new TextBlock({ text : "\\int \\frac{1}{2}", is_tex : true, offset : Vec2.zero() });
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

        const p1 = this.pointA.position;
        const p2 = this.pointB.position;

        const p1a = this.pointA.position.add(this.shift);
        const p2a = this.pointB.position.add(this.shift);

        const shift_pix_len = View.current.toPix(this.shift.len());
        const ratio = (shift_pix_len + 5) / shift_pix_len;
        const shift_plus = this.shift.mul(ratio);
        const p1b = this.pointA.position.add(shift_plus);
        const p2b = this.pointB.position.add(shift_plus);

        const p12 = p2.sub(p1);
        const p1c = p1a.add(p12.mul( 1/3));
        const p2c = p2a.add(p12.mul(-1/3));

        this.center = p1a.add(p12.mul(0.5));
        this.updateCaption();

        const degree = toDegree( Math.atan2(-p12.y, p12.x) );
        this.caption.setRotation(degree);

        View.current.canvas.drawLine(this, p1, p1b);
        View.current.canvas.drawLine(this, p2, p2b);

        View.current.canvas.drawLine(this, p1a, p1c);
        View.current.canvas.drawLine(this, p2a, p2c);
    }
}

}
