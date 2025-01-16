///<reference path="shape.ts" />

namespace plane_ts {
//
export const TT = i18n_ts.TT;
export const TTs = i18n_ts.TTs;

export class Angle extends Shape {
    static radius1Pix = 20;
    static radius1 : number;
    static numMarks = 5;

    angleMark   : number;
    lineA       : AbstractLine;
    directionA  : number;

    lineB       : AbstractLine;
    directionB  : number;

    intersection! : Point;

    constructor(obj : { angleMark : number, lineA : AbstractLine, directionA : number, lineB : AbstractLine, directionB : number }){
        super(obj);
        this.angleMark   = obj.angleMark;
        if(this.angleMark == undefined){
            this.angleMark = 0;
        }
        this.lineA       = obj.lineA;
        this.directionA  = obj.directionA;

        this.lineB       = obj.lineB;
        this.directionB  = obj.directionB;
        
        this.intersection = getCommonPointOfLines(this.lineA, this.lineB)!;
        if(this.intersection == undefined){
            throw new MyError();
        }
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            angleMark  : this.angleMark,
            lineA      : this.lineA.toObj(),
            directionA : this.directionA,
            lineB      : this.lineB.toObj(),
            directionB : this.directionB
        });

        return obj;
    }

    getProperties(){
        return super.getProperties().concat([
            "angleMark"
        ]);
    }

    setAngleMark(angle_mark : number){
        this.angleMark = angle_mark;
    }

    dependencies() : MathEntity[] {
        return [ this.lineA, this.lineB ];
    }

    startEndAngle() : [number, number] {
        const e1 = this.lineA.e.mul(this.directionA);
        const e2 = this.lineB.e.mul(this.directionB);

        const start = Math.atan2(e1.y, e1.x);
        const end   = Math.atan2(e2.y, e2.x);

        return [start, end];
    }

    isNear(position : Vec2) : boolean {  
        const distance = this.intersection.position.distance(position);

        let radius = Angle.radius1 * 1.2;
        if(distance <= radius){

            const [start, end] = this.startEndAngle();

            // the vector from the intersection to position.
            const v = position.sub(this.intersection.position);

            const theta = Math.atan2(v.y, v.x);
            const result = inRange(start, theta, end);

            return inRange(start, theta, end);
        }

        return false;
    }

    calc(){        
    }

    draw() : void {
        assert(this.angleMark < Angle.numMarks);

        const [start, end] = this.startEndAngle();
        
        const center = this.intersection.position;

        if(this.angleMark == 0){

            const vx = (new Vec2(Angle.radius1, 0)).rot(start);
            const vy = (new Vec2(Angle.radius1, 0)).rot(end);
            const positions : Vec2[] = [
                center, center.add(vx), center.add(vx).add(vy), center.add(vy)
            ];
            View.current.canvas.drawPolygon(this, positions);
        }
        else{

            const scales = [ 1, 0.6, 1.4, 2.0];

            for(const i of range(this.angleMark)){    
                let radius = Angle.radius1 * scales[i];
                View.current.canvas.drawArc(this, center, radius, start, end);
            }
        }
    }

    reading() : Reading {
        return new Reading(this, TT('Draw the angle formed by intersecting two lines.'), []);
    }

    setRelations(): void {
        super.setRelations();

        const key = angleKey(this.lineA, this.directionA, this.lineB, this.directionB, this.intersection);
        angleMap.set(key, this);
    }
}


export class DimensionLine extends Shape {
    pointA : Point;
    pointB : Point;
    shift  : number;

    normal! : Vec2;
    shiftVec! : Vec2;
    center! : Vec2;
    text : string = "";

    constructor(obj : { caption : TextBlock, pointA : Point, pointB : Point, shift : number }){
        super(obj);
        this.pointA    = obj.pointA;
        this.pointB    = obj.pointB;
        this.shift     = obj.shift;

        this.calc();
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
        this.calc();
        View.current.dirty = true;
    }

    getProperties(){
        return super.getProperties().concat([
            "text"
        ])
    }

    dependencies() : MathEntity[] {
        return [ this.pointA, this.pointB ];
    }

    calc(){        
        const A = this.pointA.position;
        const B = this.pointB.position;
        const AB = B.sub(A);

        this.normal = AB.rot90().unit();
        this.shiftVec = this.normal.mul(this.shift);
        this.center = A.add(B).mul(0.5).add(this.shiftVec);

        this.updateCaption();
    }

    updateCaption(){ 
        const [text_width, text_height] = this.caption!.getSize();
        const x = this.center.x - fromXPixScale(0.5 * text_width);
        const y = this.center.y + fromYPixScale(0.5 * text_height);

        this.caption!.setTextPosition(x, y);
    }

    draw() : void {
        if(this.caption == undefined){
            throw new MyError();
        }

        const A = this.pointA.position;
        const B = this.pointB.position;
        const AB = B.sub(A);

        const A_shift = A.add(this.shiftVec);
        const B_shift = B.add(this.shiftVec);

        const shift_pix_len = View.current.toXPixScale(Math.abs(this.shift));
        const ratio = (shift_pix_len + 5) / shift_pix_len;
        const shift_plus = this.shiftVec.mul(ratio);
        const A_shift_plus = A.add(shift_plus);
        const B_shift_plus = B.add(shift_plus);

        const A_shift_inside = A_shift.add(AB.mul( 1/3));
        const B_shift_inside = B_shift.add(AB.mul(-1/3));

        const degree = toDegree( Math.atan2(-AB.y, AB.x) );
        this.caption.setRotation(degree);

        View.current.canvas.drawLine(this, A, A_shift_plus);
        View.current.canvas.drawLine(this, B, B_shift_plus);

        View.current.canvas.drawLine(this, A_shift, A_shift_inside);
        View.current.canvas.drawLine(this, B_shift, B_shift_inside);
    }
}

export class LengthSymbol extends Shape {
    pointA : Point;
    pointB : Point;
    lengthKind : number;
    line? : AbstractLine;
    circle? : CircleByRadius | ArcByRadius;

    constructor(obj : { pointA : Point, pointB : Point, lengthKind : number }){
        super(obj);
        this.mute = false;

        if(obj.lengthKind == undefined){
            throw new MyError("length kind is undefined.")
        }

        this.pointA = obj.pointA;
        this.pointB = obj.pointB;
        this.lengthKind = obj.lengthKind;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            pointA : this.pointA.toObj(),
            pointB : this.pointB.toObj(),
            lengthKind : this.lengthKind
        });

        return obj;
    }

    getProperties(){
        return super.getProperties().concat([
            "lengthKind",
            "line"
        ])
    }

    dependencies() : MathEntity[] {
        return [ this.pointA, this.pointB ];
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA, this.pointB);
    }

    center() : Vec2 {
        const A = this.pointA.position;
        const B = this.pointB.position;

        return A.add(B).mul(0.5);
    }

    isNear(position : Vec2) : boolean {
        const center = this.center();        
        const real_distance = center.distance(position);
        return View.current.isNear(real_distance);
    }

    length() : number {
        const A = this.pointA.position;
        const B = this.pointB.position;

        return A.distance(B);
    }

    isEqual(lengthSymbol : LengthSymbol) : boolean {
        const equal_length_set = equalLengths.find(x => x.has(this));
        if(equal_length_set != undefined){
            return equal_length_set.has(lengthSymbol);
        }

        return false;
    }

    draw() : void {
        View.current.canvas.drawLine(this, this.pointA.position, this.pointB.position);

        const tick_half_length = fromXPixScale(10);

        const A = this.pointA.position;
        const B = this.pointB.position;
        const AB = B.sub(A);

        const e = AB.unit()
        const normal = e.rot90();
        const normal_minus = normal.mul(- tick_half_length);
        const normal_plus  = normal.mul(  tick_half_length);

        const center = this.center();

        let shifts : number[];
        if(this.lengthKind % 2 == 0){

            shifts = [ 0, 1, -1, 2, -2 ];
        }
        else{
            shifts = [ 0.5, -0.5, 1.5, -1.5, 2.5, -2.5 ];
        }
        assert(this.lengthKind < shifts.length);

        for(const idx of range(this.lengthKind + 1)){
            const shift = shifts[idx];
            const pos = center.add(e.mul(shift * tick_half_length));

            const tick_1 = pos.add( normal_minus );
            const tick_2 = pos.add( normal_plus );
    
            drawLine(this, tick_1, tick_2);
        }
    }

    findEqualLengthByMidPoint(){
        const all_shapes = View.current.allShapes();
        
        const length_symbols = all_shapes.filter(x => x instanceof LengthSymbol && x != this && x.line == this.line) as LengthSymbol[];
        if(length_symbols.length == 0){
            // msg(`no length-symbol:${this.id}`);

            // (all_shapes.filter(x => x instanceof LengthSymbol) as LengthSymbol[]).forEach(x => msg(`${x.id} line:${x.line!.id}`))
            return;
        }

        for(const length_symbol of length_symbols){
            // msg(`length-symbol on line: ${this.id} ${length_symbol.id}`);

            const points = this.points().concat(length_symbol.points());

            const mid_points = all_shapes.filter(x => x instanceof Midpoint && areSetsEqual([x, x.pointA, x.pointB], points)) as Midpoint[];
            for(const mid_point of mid_points){
                if(this.points().includes(mid_point) && length_symbol.points().includes(mid_point)){
                    addEqualLengths(this, length_symbol);
                    // msg(`equal-length-by-midpoint:${this.id} mid:${mid_point.id} ${length_symbol.id}`);
                    return;
                }
            }    
        }
    }

    reading(): Reading {
        return this.textReading(TT("Draw a length symbol."));
    }

    setRelations(): void {
        super.setRelations();

        this.pointA.setRelations();
        this.pointB.setRelations();

        const key = pairKey(this.pointA, this.pointB);
        pointsToLengthSymbol.set(key, this);

        this.line = getCommonLineOfPoints(this.pointA, this.pointB);

        this.circle = undefined;

        for(const [center, point] of [[this.pointA, this.pointB], [this.pointB, this.pointA]]){
            const circles = list(centerOfCircleArcs.get(center));
            if(circles.length != 0){
    
                this.circle = circles.find(x => x.includesPoint(point)) as CircleByRadius | ArcByRadius;
                if(this.circle != undefined){
                    break;
                }
            }
        }

        this.findEqualLengthByMidPoint();
    }

    points() : [Point, Point] {
        return [this.pointA, this.pointB];
    }
}




}