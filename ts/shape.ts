namespace planets {
//
export abstract class Shape {
    static maxId = 0;
    id : number;
    color : string = "black";
    isOver : boolean = false;

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
}

export class Point extends Shape {
    static radius = 4;

    pos : Vec2;

    constructor(pos : Vec2){
        super();
        this.pos = pos;
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
    }
}


export class LineSegment extends Shape {    
    p1: Vec2;
    p2: Vec2;
    p1p!: Vec2;
    p2p!: Vec2;
    // p12: Vec2;
    // e: Vec2;

    constructor(p1: Vec2, p2: Vec2, color : string = "black"){
        super(color);
        this.p1 = p1;
        this.p2 = p2;
    }

    copy() : LineSegment {
        return new LineSegment(this.p1.copy(), this.p2.copy(), this.color);
    }

    draw(view : View) : void {
        const ctx = view.ctx;

        ctx.beginPath();
        ctx.moveTo(this.p1p.x, this.p1p.y);
        ctx.lineTo(this.p2p.x, this.p2p.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();        
    }
}

export abstract class Circle extends Shape {
    center : Point;
    color : string;

    constructor(center : Point, color : string = "black"){
        super();
        this.center = center;
        this.color = color;
    }

    abstract radius() : number;

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
        ctx.lineWidth = 1;
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
