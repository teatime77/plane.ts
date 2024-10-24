///<reference path="json.ts" />

type  Reading = i18n_ts.Reading;
const Reading = i18n_ts.Reading;

namespace plane_ts {
//
const TT = i18n_ts.TT;
const fgColor = "black";
let capturedShape : AbstractShape | undefined;

export enum Mode {
    none,
    depend,
    target
}

export abstract class AbstractShape extends Widget implements i18n_ts.Readable {
    visible : boolean = true;
    mode : Mode = Mode.none;
    isOver : boolean = false;
    narration : string = "";

    constructor(obj : any){
        super(obj);

        if(obj.visible != undefined && !obj.visible){
            this.visible = false;
        }

        if(obj.narration != undefined){
            this.narration = obj.narration;
        }
        
        if(View.current != undefined){

            View.current.dirty = true;
        }
    }

    makeObj() : any {
        let obj = super.makeObj();

        if(this.narration != ""){
            obj.narration = this.narration;
        }

        if(!this.visible){
            obj.visible = false;
        }

        return obj;
    }

    getProperties(){
        return super.getProperties().concat([
            "narration", "visible"
        ]);
    }

    abstract reading() : Reading;
    highlight(on : boolean) : void {
        if(on){
            this.setMode(Mode.depend);
        }
        else{
            this.setMode(Mode.none);
        }
    }

    dependencies() : Shape[] {
        return [];
    }

    setMode(mode : Mode){
        this.mode = mode;
        View.current.dirty = true;
    }

    delete(deleted : Set<number>){
        if(deleted.has(this.id)){
            return;
        }
        deleted.add(this.id);

        for(let [name, val] of Object.entries(this)){
            if(val instanceof AbstractShape){
                val.delete(deleted);
            }
        }    
    }

    async play(speech : i18n_ts.AbstractSpeech){
    }
}

export class TextBlock extends AbstractShape {
    parent : AbstractShape | undefined;
    text  : string;
    isTex : boolean;
    div   : HTMLDivElement;

    offset : Vec2 = new Vec2(0, 0);

    constructor(obj : { text : string, isTex : boolean, offset : Vec2 }){
        super(obj);
        this.text  = obj.text;
        this.isTex = obj.isTex;
        this.offset = obj.offset;

        this.div   = document.createElement("div");
        this.div.className = "tex_div";

        this.setVisible(this.visible);

        if(obj.isTex){

            renderKatexSub(this.div, obj.text);
        }
        else{

            this.div.innerText = obj.text;
        }

        View.current.board.parentElement!.append(this.div);

        setCaptionEvent(this);
        this.updateTextPosition();
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

    updateTextDiv(){
        if(this.isTex){

            renderKatexSub(this.div, this.text);
        }
        else{

            this.div.innerText = this.text;
        }
    }

    setVisible(visible : boolean){
        this.visible = visible;

        if(this.visible){
            this.div.style.color = "";
            this.div.style.display = "";
        }
        else{
            if(Plane.one.editMode){

                this.div.style.color = "gray";
            }
            else{
                this.div.style.display = "none";
            }
        }
    }

    setText(text : string){
        this.text = text;
        this.updateTextDiv();
    }

    setIsTex(is_tex : boolean){
        this.isTex = is_tex;
        this.updateTextDiv();
    }

    setTextPosition(x : number, y : number){
        this.div.style.left = `${View.current.board.offsetLeft + toXPix(x + this.offset.x)}px`;
        this.div.style.top  = `${View.current.board.offsetTop  + toYPix(y + this.offset.y)}px`;
    }

    updateTextPosition(){
        this.div.style.left = `${View.current.board.offsetLeft + toXPix(this.offset.x)}px`;
        this.div.style.top  = `${View.current.board.offsetTop  + toYPix(this.offset.y)}px`;
    }

    setRotation(degree : number){
        this.div.style.transform = `rotate(${degree}deg)`;
    }

    getSize() : [number, number] {
        return [ this.div.offsetWidth, this.div.offsetHeight ];
    }

    captionPointerdown(event : PointerEvent){
        this.div.setPointerCapture(event.pointerId);
        capturedShape = this;
    }

    captionPointermove(event : PointerEvent){
        if(capturedShape != this){
            return;
        }

        this.offset.x += fromXPixScale(event.movementX);
        this.offset.y -= fromYPixScale(event.movementY);
        
        this.div.style.left = `${this.div.offsetLeft + event.movementX}px`;
        this.div.style.top  = `${this.div.offsetTop  + event.movementY}px`;
    }

    captionPointerup(event : PointerEvent){
        this.div.releasePointerCapture(event.pointerId);
        capturedShape = undefined;
    }

    reading() : Reading {
        throw new MyError();
    }

    delete(deleted : Set<number>){
        if(deleted.has(this.id)){
            return;
        }
        super.delete(deleted);

        this.div.remove();
    }
}

export abstract class Shape extends AbstractShape {
    name      : string = "";
    color     : string = fgColor;
    lineWidth : number = 1;
    caption   : TextBlock | undefined;
    depends   : Shape[] = [];

    abstract draw() : void;

    constructor(obj : any){
        super(obj);
        if(obj.name != undefined){
            this.name = obj.name;
        }

        if(obj.color != undefined){
            this.color = obj.color;
        }

        if(obj.lineWidth != undefined){
            this.lineWidth = obj.lineWidth;
        }

        if(obj.caption != undefined){
            this.caption = obj.caption;
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

    modeColor() : string {
        switch(this.mode){
        case Mode.none:
            return this.color;
        case Mode.depend:
            return "blue";
        case Mode.target:
            return "red";
        }
    }

    modeLineWidth() : number {
        return (this.isOver || this.mode != Mode.none ? 3 : this.lineWidth);
    }

    getAllShapes(shapes : Shape[]){
        shapes.push(this);
    }

    calc(){        
    }

    updateCaption(){ 
    }

    shapePointerdown(position : Vec2){
    }

    shapePointermove(position : Vec2, diff : Vec2){
    }

    shapePointerup(position : Vec2){
    }

    reading() : Reading {
        const name = (this.name != "" ? this.name : this.constructor.name);
        return new Reading(this, i18n_ts.token(name), []);
    }

    delete(deleted : Set<number>){        
        if(deleted.has(this.id)){
            return;
        }

        super.delete(deleted);
        if(this.caption != undefined){
            this.caption.delete(deleted);
        }
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

    static fromArgs(position : Vec2){
        return new Point( { position } );
    }

    constructor(obj : { position : Vec2 }){
        super(obj);

        if(this.name == ""){

            const points = View.current.allShapes().filter(x => x instanceof Point).concat(Point.tempPoints);

            const upper_latin_letters = i18n_ts.upperLatinLetters;
            const idxes = points.map(x => upper_latin_letters.indexOf(x.name));
            if(idxes.length == 0){
                this.name = upper_latin_letters[0];
            }
            else{
                const max_idx = Math.max(...idxes);
                if(max_idx == -1){
                    this.name = upper_latin_letters[0];
                }
                else if(max_idx + 1 < upper_latin_letters.length){
                    this.name = upper_latin_letters[max_idx + 1];
                }
                else{
                    throw new MyError();
                }
            }
        }

        Point.tempPoints.push(this);

        if(this.caption == undefined){
            const x = fromXPixScale(10);
            const y = fromYPixScale(20);
            this.caption = new TextBlock( { text : this.name, isTex : false, offset : new Vec2(x, y) });
            this.caption.parent = this;
        }

        this.setPosition(obj.position);

        // msg(`point:${this.name}`);
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

    setBound(bound : AbstractLine | CircleArc | undefined){
        this.bound = bound;

        if(bound instanceof LineSegment){

            const new_position = calcFootOfPerpendicular(this.position, bound);
            this.setPosition(new_position);
        }
    }

    updateCaption(){
        this.caption!.setTextPosition(this.position.x, this.position.y);
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
        const color = this.modeColor();

        View.current.canvas.drawCircle(this.position, Point.radius, color, null, 0);
        
        if(this.isOver){

            View.current.canvas.drawCircle(this.position, 3 * Point.radius, null, "gray", 1);
        }
    }

    add(point : Point) : Vec2 {
        return this.position.add(point.position);
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
        const distance = distanceFromLine(this.normal(), this.pointA.position, position);
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

export abstract class LineByPoints extends AbstractLine {
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
}

export class LineSegment extends LineByPoints {
    draw() : void {
        View.current.canvas.drawLine(this, this.pointA.position, this.pointB.position);
    }

    reading(): Reading {
        return new Reading(this, TT('Draw a line from point "A" to point "B".'), [ this.pointA, this.pointB ]);
    }
}

export class ParallelLine extends Line {   
    line : AbstractLine;

    constructor(obj : { pointA: Point, line: AbstractLine }){
        super(obj);

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

    reading(): Reading {
        return new Reading(this, TT('Draw a line through point "A" that is parallel to line "B".'), []);
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
        const stroke_color = this.modeColor();
        const line_width = this.modeLineWidth();
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

    reading(): Reading {
        return new Reading(this, TT('Draw a circle with point "A" as the center.'), [ this.center ]);
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

        const color = this.modeColor();
        const line_width = (this.isOver || this.mode != Mode.none ? 3 : 1);

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
        const color = this.modeColor();
        View.current.canvas.drawArc(this.center.position, this.radius(), null, color, this.lineWidth, th1, th2);
    }

    radius() : number {
        return this.center.position.distance(this.pointA.position);
    }
}

export class Polygon extends Shape {
    points : Point[] = [];
    lines  : LineSegment[] = [];

    constructor(obj : { points : Point[], lines  : LineSegment[] }){
        super(obj);
        this.points = obj.points;
        this.lines  = obj.lines;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            points : this.points.map(x => x.toObj()),
            lines  : this.lines.map(x => x.toObj())
        });

        return obj;
    }

    dependencies() : Shape[] {
        return super.dependencies().concat(this.points);
    }

    draw(): void {        
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(... this.points, ... this.lines);
    }

    reading(): Reading {
        switch(this.points.length){
        case 3:
            return new Reading(this, TT('Draw a triangle with vertices "A", "B", and "C".'), this.points);
        case 4:
            return new Reading(this, TT('Draw a quadrilateral with vertices "A", "B", "C" and "D".'), this.points);        
        }

        throw new MyError();
    }
}

}
