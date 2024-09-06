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

    setText(text : string){
        this.text = text;
        if(this.isTex){

            renderKatexSub(this.div, text);
        }
        else{

            this.div.innerText = text;
        }
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

        this.div.style.left = `${this.x + this.offset.x}px`;
        this.div.style.top  = `${this.y + this.offset.y}px`;
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

    updateCaption(){ 
    }

    select(){
        this.selected = true;
    }

    unselect(){
        this.selected = false;
    }

    shapePointerdown(pos : Vec2){
    }

    shapePointermove(pos : Vec2, diff : Vec2){
    }

    shapePointerup(pos : Vec2){
    }

}

export class Point extends Shape {
    static radiusPix = 4;
    static radius : number;

    pos! : Vec2;
    posSave : Vec2 | undefined;
    bound : LineSegment | Circle | undefined;

    origin : Point | undefined;

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

        this.updateCaption();

        this.view.changed.add(this);
    }

    setName(name : string){
        this.name = name;
        this.caption!.setText(name);
    }

    updateCaption(){
        const div_pos = this.view.toPixPos(this.pos);

        const x = this.view.board.offsetLeft + div_pos.x;
        const y = this.view.board.offsetTop  + div_pos.y;

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
        const color = (this.isOver ? "red" : this.color);

        this.view.canvas.drawCircle(this.pos, Point.radius, color, null, 0);
        
        if(this.isOver){

            this.view.canvas.drawCircle(this.pos, 3 * Point.radius, null, "gray", 1);
        }
    }

    sub(p : Point) : Vec2 {
        return this.pos.sub(p.pos);
    }

    dot(p : Point) : number {
        return this.pos.dot(p.pos);
    }

    shapePointerdown(pos : Vec2){
        this.posSave = this.pos.copy();
    }

    shapePointermove(pos : Vec2, diff : Vec2){
        if(this.bound instanceof LineSegment){

            this.setPos(calcFootOfPerpendicular(pos, this.bound));
        }
        else if(this.bound instanceof Circle){
            const circle = this.bound;

            const v = pos.sub(circle.center.pos);
            const theta = Math.atan2(v.y, v.x);
            const x = circle.radius() * Math.cos(theta);
            const y = circle.radius() * Math.sin(theta);
            
            const new_pos = circle.center.pos.add( new Vec2(x, y) );
            this.setPos(new_pos);
        }
        else{

            if(this.posSave != undefined){

                this.setPos(this.posSave.add(diff));
            }
        }
    }

    shapePointerup(pos : Vec2){
        this.posSave = undefined;
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
        this.view.canvas.drawLine(this, this.p1.pos, this.p2.pos);
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
        const stroke_color = (this.isOver ? "red" : this.color);
        const line_width = (this.selected ? 3 : 1)
        this.view.canvas.drawCircle(this.center.pos, this.radius(), null, stroke_color, line_width)
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
        const radius_x = this.xPoint.pos.dist(this.center.pos);

        const center_to_x = this.xPoint.sub(this.center)
        const rotation = Math.atan2(- center_to_x.y, center_to_x.x);

        const color = (this.isOver ? "red" : this.color);
        const line_width = (this.selected ? 3 : 1);

        this.view.canvas.drawEllipse(this.center.pos, radius_x, this.radiusY, rotation, color, line_width);
    }
}

export class Angle extends Shape {
    static radius1Pix = 20;
    static radius1 : number;

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

        const color = (this.isOver ? "red" : this.color);
        const line_width = (this.selected ? 3 : 1);

        this.view.canvas.drawArc(this.inter, Angle.radius1, null, color, line_width, th1, th2);
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

    updateCaption(){ 
        const center_pix = this.view.toPixPos(this.center);

        const [text_width, text_height] = this.caption!.getSize();
        const x = this.view.board.offsetLeft + center_pix.x - 0.5 * text_width;
        const y = this.view.board.offsetTop  + center_pix.y - 0.5 * text_height;

        this.caption!.setTextPos(x, y);
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

        this.center = p1a.add(p12.mul(0.5));
        this.updateCaption();

        const degree = toDegree( Math.atan2(-p12.y, p12.x) );
        this.caption.setRotation(degree);

        this.view.canvas.drawLine(this, p1, p1b);
        this.view.canvas.drawLine(this, p2, p2b);

        this.view.canvas.drawLine(this, p1a, p1c);
        this.view.canvas.drawLine(this, p2a, p2c);
    }
}

export class Graph extends Shape {
    xs : Float32Array = new Float32Array();
    

    constructor(view : View){
        super(view);
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

}
