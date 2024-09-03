namespace planets {
//
let captionDownPos : Vec2 | undefined;
let offsetDown : Vec2;

abstract class AbstractShape {
    abstract showProperty(tbl : HTMLTableElement | undefined) : void;

    appendTitle(tbl : HTMLTableElement, title : string){
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 2;
        cell.innerText = title;
        row.append(cell);    

        tbl.append(row);
    }

    appendRow(tbl : HTMLTableElement, name : string, value: HTMLElement){
        const row = document.createElement("tr");

        const span = document.createElement("span");
        span.innerText = name;
        
        for(const ele of [span, value]){
            const cell = document.createElement("td");
            cell.append(ele);
            row.append(cell);    
        }

        tbl.append(row);
    }

    makeConstProperty(tbl : HTMLTableElement, name : string, value : string){
        const span = document.createElement("span");
        span.innerText = value;

        this.appendRow(tbl, name, span);
    }

    makeTextProperty(tbl : HTMLTableElement, name : string, value : string){
        const input = document.createElement("input");
        input.type = "text";
        input.value = value;

        this.appendRow(tbl, name, input);
    }

    makeColorProperty(tbl : HTMLTableElement, name : string, value : string){
        const input = document.createElement("input");
        input.type = "color";
        input.value = value;

        this.appendRow(tbl, name, input);
    }
}

export class TextBlock extends AbstractShape {
    x! : number;
    y! : number;
    text : string;
    isTex : boolean;
    div       : HTMLDivElement;

    shape : Shape | undefined;
    offset : Vec2 = new Vec2(0, 0);

    constructor(text : string, is_tex : boolean, shape : Shape | undefined){
        super();
        this.text  = text;
        this.isTex = is_tex;
        this.shape = shape;

        this.div   = document.createElement("div");
        this.div.className = "tex_div";
        if(is_tex){

            renderKatexSub(this.div, text);
        }
        else{

            this.div.innerText = text;
        }

        document.body.append(this.div);
    }

    showProperty(tbl : HTMLTableElement | undefined) : void {
        if(tbl == undefined){

            tbl = $("property-list") as HTMLTableElement;
            tbl.innerHTML = "";
        }

        this.appendTitle(tbl, this.constructor.name);
        this.makeTextProperty(tbl, "text", this.text);
    }

    setTextPos(x : number, y : number){
        this.x = x;
        this.y = y;

        this.div.style.left = `${x + this.offset.x}px`;
        this.div.style.top  = `${y + this.offset.y}px`;
    }

    setRotation(degree : number){
        this.div.style.transform = `rotate(${degree}deg)`;
    }

    getSize() : [number, number] {
        return [ this.div.offsetWidth, this.div.offsetHeight ];
    }

    captionPointerdown(ev : PointerEvent){
        this.div.setPointerCapture(ev.pointerId);

        captionDownPos = new Vec2(ev.screenX, ev.screenY);
        offsetDown = this.offset.copy();
        const x = this.div.style.left;
        const y = this.div.style.top;
        const [x2, y2] = [this.div.offsetLeft, this.div.offsetTop];
        msg(`caption : ${x} ${y} ${x2} ${y2}`);

    }

    captionPointermove(ev : PointerEvent){
        if(captionDownPos == undefined){
            return;
        }
        const diff = new Vec2(ev.screenX, ev.screenY).sub(captionDownPos);
        this.offset = offsetDown.add(diff);
        
        this.div.style.left = `${this.x + this.offset.x}px`;
        this.div.style.top  = `${this.y + this.offset.y}px`;
    }

    captionPointerup(ev : PointerEvent){
        this.div.releasePointerCapture(ev.pointerId);
        captionDownPos = undefined;
    }

}

export abstract class Shape extends AbstractShape {
    static maxId = 0;
    view : View;
    id : number;

    name      : string = "";
    caption   : TextBlock | undefined;

    divOffset : Vec2 | undefined;

    color : string = "black";
    isOver : boolean = false;
    selected : boolean = false;

    depends : Shape[] = [];

    abstract draw() : void;

    constructor(view : View, color : string = "black"){
        super();
        this.view = view;
        this.id = Shape.maxId++;
        this.color = color;
    }

    copy() : Shape {
        throw new MyError();
    }


    showProperty(tbl : HTMLTableElement | undefined = undefined) : void {
        if(tbl == undefined){

            tbl = $("property-list") as HTMLTableElement;
            tbl.innerHTML = "";
        }

        this.appendTitle(tbl, this.constructor.name);
        this.makeConstProperty(tbl, "id", `${this.id}`);
        this.makeTextProperty(tbl, "name", this.name);
        // this.makeTextProperty(tbl, "caption", this.caption);
        this.makeColorProperty(tbl, "color", this.color);

        if(this.caption != undefined){

            this.caption.showProperty(tbl);
        }
    }

    getProperties(properties : [string, string][]){
        properties.push(
            ["name", "string"],
            ["color", "color"]
        );
    }

    isNear(pos : Vec2) : boolean {        
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

    select(){
        this.selected = true;
    }

    unselect(){
        this.selected = false;
    }

    drawLine(p1 : Vec2, p2 : Vec2){
        const color = (this.isOver ? "red" : this.color);

        const pix1 = this.view.toPixPos(p1);
        const pix2 = this.view.toPixPos(p2);

        const ctx = this.view.ctx;
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

    pos! : Vec2;
    bound : LineSegment | Circle | undefined;

    constructor(view : View, pos : Vec2, bound : LineSegment | Circle | undefined = undefined){
        super(view);
        this.bound = bound;

        const idxes = view.allShapes().filter(x => x instanceof Point).map(x => upperLatinLetters.indexOf(x.name));
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

        this.caption = new TextBlock(this.name, false, this);
        this.caption.offset = new Vec2(10, -20);
        setCaptionEvent(this.caption);

        if(bound instanceof LineSegment){

            this.setPos(calcFootOfPerpendicular(pos, bound));
        }
        else{

            this.setPos(pos);
        }

        msg(`point:${this.name}`);
    }

    copy() : Point {
        return new Point(this.view, this.pos.copy());
    }

    setPos(pos : Vec2){
        this.pos = pos;

        this.setDivPos();

        this.view.changed.add(this);
    }

    setDivPos(){
        const div_pos = this.view.toPixPos(this.pos);

        const x = this.view.canvas.offsetLeft + div_pos.x;
        const y = this.view.canvas.offsetTop  + div_pos.y;

        this.caption!.setTextPos(x, y);
    }

    getProperties(properties : [string, string][]){
        super.getProperties(properties);

        properties.push(
            ["pos", "Vec2"],
        );
    }

    isNear(pos : Vec2) : boolean {
        return this.view.isNear(pos.dist(this.pos));
    }

    draw() : void {
        const ctx = this.view.ctx;

        const pix = this.view.toPixPos(this.pos);

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

    constructor(view : View, p1: Point, p2: Point, color : string = "black"){
        super(view, color);
        this.p1 = p1;
        this.p2 = p2;

        this.setVecs();
    }

    abstract copy() : Line;

    dependencies() : Shape[] {
        return [ this.p1, this.p2 ];
    }

    calc(){     
        this.setVecs();
    }

    setVecs(){
        this.p12 = this.p2.sub(this.p1);
        this.e = this.p12.unit();
    }
}

export class LineSegment extends Line {    

    copy() : LineSegment {
        return new LineSegment(this.view, this.p1.copy(), this.p2.copy(), this.color);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.p1, this.p2);
    }

    isNear(pos : Vec2) : boolean {
        const foot = calcFootOfPerpendicular(pos, this);        
        const d = pos.dist(foot);
        if(this.view.isNear(d)){

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

    draw() : void {
        const ctx = this.view.ctx;

        const p1 = this.view.toPixPos(this.p1.pos);
        const p2 = this.view.toPixPos(this.p2.pos);

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

    constructor(view : View, center : Point, color : string = "black"){
        super(view);
        this.center = center;
        this.color = color;
    }

    dependencies() : Shape[] {
        return [ this.center ];
    }

    abstract radius() : number;
}

export abstract class Circle extends CircleArc {
    constructor(view : View, center : Point, color : string = "black"){
        super(view, center, color);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.center);
    }

    isNear(pos : Vec2) : boolean {
        const r = pos.dist(this.center.pos);
        return this.view.isNear( Math.abs(r - this.radius()) );
    }

    draw() : void {
        const ctx = this.view.ctx;

        const pix = this.view.toPixPos(this.center.pos);

        const color = (this.isOver ? "red" : this.color);

        ctx.beginPath();
        ctx.arc(pix.x, pix.y, this.view.toPix(this.radius()), 0, 2 * Math.PI, false);
        // ctx.fillStyle = color;
        // ctx.fill();
        ctx.lineWidth = (this.selected ? 3 : 1);
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}


export class Circle1 extends Circle {
    p : Point;

    constructor(view : View, center : Point, p : Point, color : string = "black"){
        super(view, center, color);
        this.p = p;
    }

    copy(): Circle1 {
        return new Circle1(this.view, this.center.copy(), this.p.copy(), this.color);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.p);
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.p ]);
    }

    calc(){        
    }

    radius() : number {
        return this.center.pos.dist(this.p.pos);
    }
}

export class Circle2 extends Circle {
    private radius_ : number;

    constructor(view : View, center : Point, radius : number, color : string = "black"){
        super(view, center, color);
        this.radius_ = radius;
    }

    copy(): Circle2 {
        return new Circle2(this.view, this.center.copy(), this.radius_, this.color);
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
    color : string;

    xPoint  : Point;
    radiusY : number;

    constructor(view : View, center : Point, x_point : Point, radius_y : number, color : string = "black"){
        super(view);
        this.center  = center;        
        this.xPoint  = x_point;
        this.radiusY = radius_y;
        this.color   = color;
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.center, this.xPoint);
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.center, this.xPoint ]);
    }

    draw() : void {
        const ctx = this.view.ctx;

        const center_pix = this.view.toPixPos(this.center.pos);

        const radius_x = this.xPoint.pos.dist(this.center.pos);

        const radius_x_pix = this.view.toPix(radius_x);
        const radius_y_pix = this.view.toPix(this.radiusY);

        const center_to_x = this.xPoint.sub(this.center)
        const rotation = Math.atan2(- center_to_x.y, center_to_x.x);

        const color = (this.isOver ? "red" : this.color);

        ctx.beginPath();
        ctx.ellipse(center_pix.x, center_pix.y, radius_x_pix, radius_y_pix, rotation, 0, 2 * Math.PI);
        ctx.lineWidth = (this.selected ? 3 : 1);
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}

class Polygon extends Shape {
    points3D : Vec2[];
    points2D : Vec2[] = [];
    material : [number, number, number] = [0, 0, 0];
    color : string = "black";

    constructor(view : View, points3d : Vec2[], color : string = "black"){
        super(view);
        this.points3D = points3d.slice();
        this.color = color;
    }

    draw() : void {
        const ctx = this.view.ctx;

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
    constructor(view : View, points3d:Vec2[], color : string = "black"){
        super(view, points3d, color);
    }
}

export class Angle extends Shape {
    static radius1 = 10;

    line1 : Line;
    dir1  : number;

    line2 : Line;
    dir2  : number;

    inter : Vec2;

    constructor(view : View, line1 : Line, dir1 : number, line2 : Line, dir2 : number, inter : Vec2, color : string = "black"){
        super(view, color);
        this.line1 = line1;
        this.dir1  = dir1;

        this.line2 = line2;
        this.dir2  = dir2;
        
        this.inter = inter;
    }

    dependencies() : Shape[] {
        return [ this.line1, this.line2 ];
    }

    calc(){        
    }

    draw() : void {
        const e1 = this.line1.e.mul(this.dir1);
        const e2 = this.line2.e.mul(this.dir2);

        const th1 = Math.atan2(-e1.y, e1.x);
        const th2 = Math.atan2(-e2.y, e2.x);

        const deg1 = toDegree(th1);
        const deg2 = toDegree(th2);

        const ctx = this.view.ctx;

        const pix = this.view.toPixPos(this.inter);

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
    center! : Vec2;
    shift : Vec2;
    text : string = "";

    constructor(view : View, p1 : Point, p2 : Point, shift : Vec2, color : string = "black"){
        super(view, color);
        this.p1    = p1;
        this.p2    = p2;
        this.shift = shift;

        this.caption = new TextBlock("\\int \\frac{1}{2}", true, this);
    }

    getProperties(properties : [string, string][]){
        super.getProperties(properties);
        
        properties.push(
            ["text", "string"]
        );
    }

    dependencies() : Shape[] {
        return [ this.p1, this.p2 ];
    }

    calc(){        
    }

    draw() : void {
        if(this.caption == undefined){
            throw new MyError();
        }

        const p1 = this.p1.pos;
        const p2 = this.p2.pos;

        const p1a = this.p1.pos.add(this.shift);
        const p2a = this.p2.pos.add(this.shift);

        const shift_pix_len = this.view.toPix(this.shift.len());
        const ratio = (shift_pix_len + 5) / shift_pix_len;
        const shift_plus = this.shift.mul(ratio);
        const p1b = this.p1.pos.add(shift_plus);
        const p2b = this.p2.pos.add(shift_plus);

        const p12 = p2.sub(p1);
        const p1c = p1a.add(p12.mul( 1/3));
        const p2c = p2a.add(p12.mul(-1/3));

        this.center = this.view.toPixPos(p1a.add(p12.mul(0.5)));

        const [text_width, text_height] = this.caption.getSize();
        const x = this.view.canvas.offsetLeft + this.center.x - 0.5 * text_width;
        const y = this.view.canvas.offsetTop  + this.center.y - 0.5 * text_height;

        this.caption.setTextPos(x, y);

        const degree = toDegree( Math.atan2(-p12.y, p12.x) );
        this.caption.setRotation(degree);

        this.drawLine(p1, p1b);
        this.drawLine(p2, p2b);

        this.drawLine(p1a, p1c);
        this.drawLine(p2a, p2c);
    }
}

export class Graph extends Shape {
    xs : Float32Array = new Float32Array();
    

    constructor(view : View){
        super(view);
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

    constructor(view : View){
        super(view);
    }

    draw() : void {
        throw new MyError();
    }
}

export class Arrow extends Polygon {
    pos : Vec2 = Vec2.nan();
    vec : Vec2 = Vec2.nan();

    constructor(view : View, pos : Vec2, vec : Vec2, color : string){
        super(view, [], color);
        this.pos = pos;
        this.vec = vec;
    }
}

}
