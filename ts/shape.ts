///<reference path="json.ts" />

type  Reading = i18n_ts.Reading;
const Reading = i18n_ts.Reading;

namespace plane_ts {
//
const TT = i18n_ts.TT;
export const fgColor = "black";
export const lineWidth = 1;
let capturedShape : MathEntity | undefined;

export enum Mode {
    none,
    depend,
    target
}

export abstract class MathEntity extends Widget implements i18n_ts.Readable, parser_ts.Highlightable {
    visible : boolean = true;
    mode : Mode = Mode.none;
    isOver : boolean = false;
    mute : boolean = false;
    narration : string = "";
    interval : number = 1;

    constructor(obj : any){
        super(obj);

        if(obj.visible != undefined && !obj.visible){
            this.visible = false;
        }

        if(obj.mute != undefined){
            this.mute = obj.mute;
        }

        if(obj.narration != undefined){
            this.narration = obj.narration;
        }

        if(obj.interval != undefined){
            this.interval = obj.interval;
        }
        
        if(View.current != undefined){

            View.current.dirty = true;
        }
    }

    makeObj() : any {
        let obj = super.makeObj();

        if(this.mute){
            obj.mute = true;
        }

        if(this.narration != ""){
            obj.narration = this.narration;
        }

        if(this.interval != 1){
            obj.interval = this.interval;
        }

        if(!this.visible){
            obj.visible = false;
        }

        return obj;
    }

    getProperties(){
        return super.getProperties().concat([
            "mute", "narration", "visible", "interval"
        ]);
    }

    abstract reading() : Reading;
    highlight(on : boolean) : void {
        if(on){
            this.setMode(Mode.target);
        }
        else{
            this.setMode(Mode.none);
        }
    }

    getAllShapes(shapes : MathEntity[]){
    }


    allShapes() : Shape[] {
        const shapes : Shape[] = [];
        this.getAllShapes(shapes);

        return unique(shapes);
    }

    dependencies() : MathEntity[] {
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
            if(val instanceof MathEntity){
                val.delete(deleted);
            }
        }    
    }

    async play(speech : i18n_ts.AbstractSpeech){
    }

    getTextBlock() : TextBlock | undefined {
        if(this instanceof TextBlock){
            return this;
        }
        else if(this instanceof Shape && this.caption != undefined){
            return this.caption;
        }
        else{
            return undefined;
        }
    }

    hideTextBlock(){
        const text_block = this.getTextBlock();
        if(text_block != undefined){

            text_block.div.dataset.display_backup = text_block.div.style.display;
            text_block.div.style.display = "none";
        }
    }

    restoreTextBlock(){
        const text_block = this.getTextBlock();
        if(text_block != undefined && text_block.div.dataset.display_backup != undefined){
            text_block.div.style.display = text_block.div.dataset.display_backup;
        }
    }

    show(){        
    }

    hide(){        
    }
}

export class TextBlock extends MathEntity {
    parent : MathEntity | undefined;
    text  : string;
    isTex : boolean;
    div   : HTMLDivElement;

    offset : Vec2 = new Vec2(0, 0);

    constructor(obj : { parent? : MathEntity, text : string, isTex : boolean, offset : Vec2 }){
        super(obj);
        this.parent = obj.parent;
        this.text  = obj.text;
        this.isTex = obj.isTex;
        this.offset = obj.offset;

        this.div   = document.createElement("div");
        this.div.className = "tex_div";

        this.setVisible(this.visible);

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
        let text = this.text;
        if(text == "" && this.parent instanceof Shape){
            text = this.parent.name;
        }

        if(this.isTex){

            if(parser_ts.isGreek(text)){
                text = `\\${text}`;
            }

            parser_ts.renderKatexSub(this.div, text);
        }
        else{

            this.div.innerText = text;
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

    show(){        
        this.div.style.display = "";
    }

    hide(){        
        this.div.style.display = "none";
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
        return new Reading(this, "", []);
    }

    delete(deleted : Set<number>){
        if(deleted.has(this.id)){
            return;
        }
        super.delete(deleted);

        this.div.remove();
    }
}

export abstract class Shape extends MathEntity {
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

        this.caption = obj.caption;

        if(this.caption == undefined && this.name != ""){
            this.caption = this.makeCaption(this);
        }

        if(this.caption != undefined){
            this.caption.parent = this;
            this.caption.updateTextDiv();
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

    makeCaption(parent : MathEntity) : TextBlock {
        const x = fromXPixScale(10);
        const y = fromYPixScale(20);
        return new TextBlock( { parent, text : "", isTex : false, offset : new Vec2(x, y) });
    }

    setName(name : string){
        this.name = name;

        if(this.name == ""){

            if(this.caption != undefined){
                this.caption.delete(new Set<number>());
                this.caption = undefined;
            }
        }
        else{

            if(this.name != "" && this.caption == undefined){
                this.caption = this.makeCaption(this);
            }

            this.caption!.updateTextDiv();
        }

        View.current.dirty = true;
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

    getAllShapes(shapes : MathEntity[]){
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

    show(){        
        if(this.caption != undefined){
            this.caption.show()
        }
    }

    hide(){        
        if(this.caption != undefined){
            this.caption.hide()
        }
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

    constructor(obj : { position : Vec2, bound? : AbstractLine | CircleArc }){
        super(obj);

        if(obj.bound != undefined){
            this.bound = obj.bound;
        }

        if(this.name != "" && this.caption == undefined){
            this.caption = this.makeCaption(this);
        }

        Point.tempPoints.push(this);

        this.setPosition(obj.position);
    }

    copy() : Point {
        return Point.fromArgs(this.position.copy());
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            position : this.position
        });

        if(this.bound != undefined){
            obj.bound = this.bound.toObj();
        }

        return obj;
    }

    setPosition(position : Vec2){
        this.position = position;

        this.updateCaption();

        View.current.changed.add(this);
        View.current.dirty = true;
    }

    setBound(bound : AbstractLine | CircleArc | undefined){
        this.bound = bound;

        if(bound instanceof LineByPoints){

            const new_position = calcFootOfPerpendicular(this.position, bound);
            this.setPosition(new_position);
        }
    }

    updateCaption(){
        if(this.caption != undefined){
            this.caption.updateTextDiv();
            this.caption.setTextPosition(this.position.x, this.position.y);
        }
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

        const radius = (this.mode == Mode.none ? 1 : 2) * Point.radius;
        View.current.canvas.drawCircle(this.position, radius, color, null, 0);
        
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
        if(this.bound instanceof AbstractLine){

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

export enum LineKind {
    line = 0,
    ray  = 1,
    ray_reverse = 2,
    line_segment = 3
}

export abstract class AbstractLine extends Shape {
    lineKind : number;
    pointA : Point;
    e!     : Vec2;

    constructor(obj : { lineKind : number, pointA: Point }){
        super(obj);
        if(obj.lineKind == undefined){
            throw new MyError("line kind is undefined.")
        }
        this.lineKind = obj.lineKind;
        this.pointA = obj.pointA;
    }


    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            lineKind : this.lineKind,
            pointA   : this.pointA.toObj()
        });

        return obj;
    }    

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.pointA ]);
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA);
    }

    getProperties(){
        return super.getProperties().concat([
            "lineKind"
        ]);
    }

    normal() : Vec2 {
        return this.e.rot90();
    }

    isNear(position : Vec2) : boolean {
        const distance = distanceFromLine(this.normal(), this.pointA.position, position);
        return View.current.isNear(distance);
    }

    draw() : void {
        const l = View.current.max.distance(View.current.min);
        const p_minus = this.pointA.position.add(this.e.mul(-l));
        const p_plus  = this.pointA.position.add(this.e.mul( l));
        
        switch(this.lineKind){
        case LineKind.line_segment:
        case LineKind.line:
            View.current.canvas.drawLine(this, p_minus, p_plus); 
            break;

        case LineKind.ray:
            View.current.canvas.drawLine(this, this.pointA.position, p_plus); 
            break;

        case LineKind.ray_reverse:
            View.current.canvas.drawLine(this, this.pointA.position, p_minus); 
            break;
        }
    }
}

export class LineByPoints extends AbstractLine {
    pointB   : Point;

    constructor(obj : { lineKind : number, pointA: Point, pointB: Point }){
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

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.pointB ]);
    }

    calc(){
        this.e = this.pointB.sub(this.pointA).unit();
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointB);
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
        const l = View.current.max.distance(View.current.min);
        const p_plus = this.pointA.position.add(this.e.mul( l));
        const p_minus = this.pointA.position.add(this.e.mul(-l));

        switch(this.lineKind){
        case LineKind.line_segment:
            View.current.canvas.drawLine(this, this.pointA.position, this.pointB.position);
            break;

        case LineKind.ray:
            View.current.canvas.drawLine(this, this.pointA.position, p_plus);
            break;

        case LineKind.ray_reverse:
            View.current.canvas.drawLine(this, this.pointA.position, p_minus);
            break;

        case LineKind.line:
            View.current.canvas.drawLine(this, p_minus, p_plus);
            break;
        }
    }

    reading(): Reading {
        if(this.lineKind == LineKind.line_segment){

            return new Reading(this, TT('Draw a line from point "A" to point "B".'), [ this.pointA, this.pointB ]);
        }
        else if(this.lineKind == LineKind.ray){
            
            if(this.pointA.name != "" && this.pointB.name != ""){

                return new Reading(this, TT('Draw a ray from point "A" to point "B".'), [ this.pointA, this.pointB ]);
            }
            else{

                return new Reading(this, TT('Draw a ray.'), []);
            }
        }
        else{
            throw new MyError();
        }
    }
}

export function makeLineSegment(pointA: Point, pointB: Point){
    return new LineByPoints({ lineKind : LineKind.line_segment, pointA, pointB });
}

export function makeRay(pointA: Point, pointB: Point){
    return new LineByPoints({ lineKind : LineKind.ray, pointA, pointB });
}


export class ParallelLine extends AbstractLine {   
    line : AbstractLine;

    constructor(obj : { lineKind : number, pointA: Point, line: AbstractLine }){
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

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.line ]);
    }

    getAllShapes(shapes : MathEntity[]){
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

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.center);
    }

    dependencies() : MathEntity[] {
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

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.point);
    }

    dependencies() : MathEntity[] {
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
    private lengthSymbol : LengthSymbol;

    constructor(obj : { center : Point, lengthSymbol : LengthSymbol }){
        super(obj);
        this.lengthSymbol = obj.lengthSymbol;
    }

    makeObj() : any {
        return Object.assign(super.makeObj(), {
            lengthSymbol : this.lengthSymbol.toObj(),
        });
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        this.lengthSymbol.getAllShapes(shapes);
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.lengthSymbol ]);
    }

    radius() : number {
        return this.lengthSymbol.length();
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

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.xPoint);
    }

    dependencies() : MathEntity[] {
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


export class ArcByPoint extends CircleArc {
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

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA, this.pointB);
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.pointA, this.pointB ]);
    }

    calc(){        
        this.adjustPosition(this.pointB, this.pointB.position);
    }

    isNear(position : Vec2) : boolean {
        const r = position.distance(this.center.position);
        if(View.current.isNear( Math.abs(r - this.radius()) )){

            const v = position.sub(this.center.position);
            let theta = Math.atan2(v.y, v.x);

            let [start_angle, end_angle] = this.angles();

            return isBetweenAngles(start_angle, theta, end_angle);
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
        const stroke_color = this.modeColor();
        const line_width = this.modeLineWidth();

        const [th1, th2] = this.angles();
        View.current.canvas.drawArc(this.center.position, this.radius(), null, stroke_color, line_width, th1, th2);
    }

    radius() : number {
        return this.center.position.distance(this.pointA.position);
    }

    reading(): Reading {
        return new Reading(this, TT('Draw an arc.'), [ ]);
    }
}


export class ArcByRadius extends CircleArc {
    private lengthSymbol : LengthSymbol;
    startAngle : number;
    endAngle : number;
    pointA : Point;
    pointB : Point;

    constructor(obj : { center : Point, lengthSymbol : LengthSymbol, startAngle : number, endAngle : number  }){
        super(obj);
        this.lengthSymbol = obj.lengthSymbol;
        this.startAngle   = obj.startAngle;
        this.endAngle     = obj.endAngle;

        this.pointA = new Point({ position : this.positionFromAngle(this.startAngle) });
        this.pointB = new Point({ position : this.positionFromAngle(this.endAngle) });

        this.pointA.bound = this;
        this.pointB.bound = this;
    }

    makeObj() : any {
        return Object.assign(super.makeObj(), {
            lengthSymbol : this.lengthSymbol.toObj(),
            startAngle   : this.startAngle,
            endAngle     : this.endAngle
        });
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA, this.pointB);
        this.lengthSymbol.getAllShapes(shapes);
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.lengthSymbol ]);
    }

    positionFromAngle(theta : number) : Vec2 {
        const length = this.lengthSymbol.length();

        const x = this.center.position.x + length * Math.cos(theta);
        const y = this.center.position.y + length * Math.sin(theta);
        
        return new Vec2(x, y);
    }

    adjustPosition(point : Point, position : Vec2){
        const v = position.sub(this.center.position);
        const theta = Math.atan2(v.y, v.x);

        if(point == this.pointA){
            this.startAngle = theta;
        }
        else{
            this.endAngle   = theta;
        }
        
        const new_pos = this.positionFromAngle(theta);
        point.setPosition(new_pos);
    }

    calc(){        
        this.pointA.setPosition( this.positionFromAngle(this.startAngle) )
        this.pointB.setPosition( this.positionFromAngle(this.endAngle) )
    }

    isNear(position : Vec2) : boolean {
        const r = position.distance(this.center.position);
        if(View.current.isNear( Math.abs(r - this.radius()) )){

            const v = position.sub(this.center.position);
            const th = Math.atan2(v.y, v.x);

            return this.startAngle <= th && th <= this.endAngle;
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
        const stroke_color = this.modeColor();
        const line_width = this.modeLineWidth();
        View.current.canvas.drawArc(this.center.position, this.radius(), null, stroke_color, line_width, this.startAngle, this.endAngle);
    }

    radius() : number {
        return this.lengthSymbol.length();
    }

    reading(): Reading {
        return new Reading(this, TT("Draw an arc with the same radius."), [ ]);
    }
}

export class Polygon extends Shape {
    points : Point[] = [];
    lines  : LineByPoints[] = [];

    constructor(obj : { points : Point[], lines  : LineByPoints[] }){
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

    dependencies() : MathEntity[] {
        return super.dependencies().concat(this.points);
    }

    draw(): void {        
    }

    getAllShapes(shapes : MathEntity[]){
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
