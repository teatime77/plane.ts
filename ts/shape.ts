namespace planets {
//
export abstract class Shape {
    static maxId = 0;
    id : number;
    color : string = "black";
    isOver : boolean = false;
    selected : boolean = false;

    depends : Shape[] = [];

    abstract draw(view : View) : void;

    constructor(color : string = "black"){
        this.id = Shape.maxId++;
        this.color = color;
    }

    copy() : Shape {
        throw new MyError();
    }

    isNear(view : View, pos : Vec2) : boolean {        
        return false;
    }

    getAllShapes(shapes : Shape[]){
        shapes.push(this);
    }

    select(){
        this.selected = true;
    }

    unselect(){
        this.selected = false;
    }

    drawLine(view : View, p1 : Vec2, p2 : Vec2){
        const color = (this.isOver ? "red" : this.color);

        const pix1 = view.toPixPos(p1);
        const pix2 = view.toPixPos(p2);

        const ctx = view.ctx;
        ctx.beginPath();
        ctx.moveTo(pix1.x, pix1.y);
        ctx.lineTo(pix2.x, pix2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = (this.selected ? 3 : 1);
        ctx.stroke();   
    }
    
}

export class Point extends Shape {
    static radius = 4;

    pos : Vec2;
    bound : LineSegment | Circle | undefined;

    constructor(pos : Vec2, bound : LineSegment | Circle | undefined = undefined){
        super();
        this.bound = bound;
        if(bound instanceof LineSegment){

            this.pos = calcFootOfPerpendicular(pos, bound);
        }
        else{

            this.pos = pos;
        }
    }

    copy() : Point {
        return new Point(this.pos.copy());
    }

    isNear(view : View, pos : Vec2) : boolean {
        return view.isNear(pos.dist(this.pos));
    }

    draw(view : View) : void {
        const ctx = view.ctx;

        const pix = view.toPixPos(this.pos);

        const color = (this.isOver ? "red" : this.color);

        ctx.beginPath();
        ctx.arc(pix.x, pix.y, Point.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.stroke();
        
        if(this.isOver){
            ctx.beginPath();
            ctx.arc(pix.x, pix.y, 3 * Point.radius, 0, 2 * Math.PI, false);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "gray";
            ctx.stroke();    
        }
    }

    sub(p : Point) : Vec2 {
        return this.pos.sub(p.pos);
    }

    dot(p : Point) : number {
        return this.pos.dot(p.pos);
    }
}

export abstract class Line extends Shape {
    p1   : Point;
    p2   : Point;
    p12! : Vec2;
    e!   : Vec2;

    constructor(p1: Point, p2: Point, color : string = "black"){
        super(color);
        this.p1 = p1;
        this.p2 = p2;

        this.setVecs();
    }

    abstract copy() : Line;

    setVecs(){
        this.p12 = this.p2.sub(this.p1);
        this.e = this.p12.unit();
    }
}

export class LineSegment extends Line {    

    copy() : LineSegment {
        return new LineSegment(this.p1.copy(), this.p2.copy(), this.color);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.p1, this.p2);
    }

    isNear(view : View, pos : Vec2) : boolean {
        const foot = calcFootOfPerpendicular(pos, this);        
        const d = pos.dist(foot);
        if(view.isNear(d)){

            const p1 = this.p1.pos;
            const p2 = this.p2.pos;
            const p12 = p2.sub(p1);
            const n = p12.dot( foot.sub(p1) );
            if(0 <= n && n <= p12.len2()){
                return true;
            }
        }

        return false;
    }

    draw(view : View) : void {
        const ctx = view.ctx;

        const p1 = view.toPixPos(this.p1.pos);
        const p2 = view.toPixPos(this.p2.pos);

        const color = (this.isOver ? "red" : this.color);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = (this.selected ? 3 : 1);
        ctx.stroke();   
    }
}

export abstract class CircleArc extends Shape {
    center : Point;
    color : string;

    constructor(center : Point, color : string = "black"){
        super();
        this.center = center;
        this.color = color;
    }

    abstract radius() : number;
}

export abstract class Circle extends CircleArc {
    constructor(center : Point, color : string = "black"){
        super(center, color);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.center);
    }

    isNear(view : View, pos : Vec2) : boolean {
        const r = pos.dist(this.center.pos);
        return view.isNear( Math.abs(r - this.radius()) );
    }

    draw(view : View) : void {
        const ctx = view.ctx;

        const pix = view.toPixPos(this.center.pos);

        const color = (this.isOver ? "red" : this.color);

        ctx.beginPath();
        ctx.arc(pix.x, pix.y, view.toPix(this.radius()), 0, 2 * Math.PI, false);
        // ctx.fillStyle = color;
        // ctx.fill();
        ctx.lineWidth = (this.selected ? 3 : 1);
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}


export class Circle1 extends Circle {
    p : Point;

    constructor(center : Point, p : Point, color : string = "black"){
        super(center, color);
        this.p = p;
    }

    copy(): Circle1 {
        return new Circle1(this.center.copy(), this.p.copy(), this.color);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.p);
    }

    radius() : number {
        return this.center.pos.dist(this.p.pos);
    }
}

export class Circle2 extends Circle {
    private radius_ : number;

    constructor(center : Point, radius : number, color : string = "black"){
        super(center, color);
        this.radius_ = radius;
    }

    copy(): Circle2 {
        return new Circle2(this.center.copy(), this.radius_, this.color);
    }

    radius() : number {
        return this.radius_;
    }

    setRadius(radius : number){
        this.radius_ = radius;
    }
}

class Polygon extends Shape {
    points3D : Vec2[];
    points2D : Vec2[] = [];
    material : [number, number, number] = [0, 0, 0];
    color : string = "black";

    constructor(points3d : Vec2[], color : string = "black"){
        super();
        this.points3D = points3d.slice();
        this.color = color;
    }

    draw(view : View) : void {
        const ctx = view.ctx;

        ctx.beginPath();
        for(const [i, p] of this.points2D.entries()){
            if(i == 0){

                ctx.moveTo(p.x, p.y);
            }
            else{

                ctx.lineTo(p.x, p.y);
            }
        }
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.stroke();       
    }
}

export class Triangle extends Polygon {
    constructor(points3d:Vec2[], color : string = "black"){
        super(points3d, color);
    }
}

export class Angle extends Shape {
    static radius1 = 10;

    line1 : Line;
    dir1  : number;

    line2 : Line;
    dir2  : number;

    inter : Vec2;

    constructor(line1 : Line, dir1 : number, line2 : Line, dir2 : number, inter : Vec2, color : string = "black"){
        super(color);
        this.line1 = line1;
        this.dir1  = dir1;

        this.line2 = line2;
        this.dir2  = dir2;
        
        this.inter = inter;
    }

    draw(view : View) : void {
        const e1 = this.line1.e.mul(this.dir1);
        const e2 = this.line2.e.mul(this.dir2);

        const th1 = Math.atan2(-e1.y, e1.x);
        const th2 = Math.atan2(-e2.y, e2.x);

        const deg1 = toDegree(th1);
        const deg2 = toDegree(th2);

        const ctx = view.ctx;

        const pix = view.toPixPos(this.inter);

        const color = (this.isOver ? "red" : this.color);

        ctx.beginPath();
        ctx.arc(pix.x, pix.y, Angle.radius1, th1, th2, true);
        ctx.lineWidth = (this.selected ? 3 : 1);
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}


export class DimensionLine extends Shape {
    p1 : Point;
    p2 : Point;
    shift : Vec2;

    constructor(p1 : Point, p2 : Point, shift : Vec2, color : string = "black"){
        super(color);
        this.p1    = p1;
        this.p2    = p2;
        this.shift = shift;

    }

    draw(view : View) : void {
        const p1 = this.p1.pos;
        const p2 = this.p2.pos;

        const p1a = this.p1.pos.add(this.shift);
        const p2a = this.p2.pos.add(this.shift);

        const shift_pix_len = view.toPix(this.shift.len());
        const ratio = (shift_pix_len + 5) / shift_pix_len;
        const shift_plus = this.shift.mul(ratio);
        const p1b = this.p1.pos.add(shift_plus);
        const p2b = this.p2.pos.add(shift_plus);

        const p12 = p2.sub(p1);
        const p1c = p1a.add(p12.mul( 1/3));
        const p2c = p2a.add(p12.mul(-1/3));

        this.drawLine(view, p1, p1b);
        this.drawLine(view, p2, p2b);

        this.drawLine(view, p1a, p1c);
        this.drawLine(view, p2a, p2c);
    }
    
}

export class Graph extends Shape {
    xs : Float32Array = new Float32Array();
    

    constructor(){
        super();
    }

    setMinMax(){

    }

    draw() : void {
        throw new MyError();
    }

}

export class Axis extends Shape {
    min : number = NaN;
    max : number = NaN;

    constructor(){
        super();
    }

    draw() : void {
        throw new MyError();
    }
}

export class Arrow extends Polygon {
    pos : Vec2 = Vec2.nan();
    vec : Vec2 = Vec2.nan();

    constructor(pos : Vec2, vec : Vec2, color : string){
        super([], color);
        this.pos = pos;
        this.vec = vec;
    }
}

}
