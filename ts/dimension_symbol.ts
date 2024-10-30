///<reference path="shape.ts" />

namespace plane_ts {
//
const TT = i18n_ts.TT;

export class Angle extends Shape {
    static radius1Pix = 20;
    static radius1 : number;
    static numMarks = 4;

    angleMark   : number;
    lineA       : AbstractLine;
    directionA  : number;

    lineB       : AbstractLine;
    directionB  : number;

    intersection : Point;

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

        const point = getCommonPointOfLines(this.lineA, this.lineB);
        if(point == undefined){
            throw new MyError();
        }
        
        this.intersection = point;
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
        const [start, end] = this.startEndAngle();

        const color = this.modeColor();
        const line_width = (this.isOver || this.mode != Mode.none ? 3 : 1);
        
        for(const i of range(Angle.numMarks)){
            if(this.angleMark < i){
                break;
            }

            const scales = [1, 0.8, 1.2, 1.4];
            let radius = Angle.radius1 * scales[i];
            View.current.canvas.drawArc(this.intersection.position, radius, null, color, line_width, start, end);
        }
    }

    reading() : Reading {
        return new Reading(this, TT('Draw the angle formed by intersecting two lines.'), []);
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
    line : LineByPoints;
    kind : number;

    constructor(obj : { line : LineByPoints, kind : number }){
        super(obj);
        this.line = obj.line;
        this.kind = obj.kind;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            line : this.line.toObj(),
            kind : this.kind
        });

        return obj;
    }

    getProperties(){
        return super.getProperties().concat([
            "kind"
        ])
    }

    dependencies() : MathEntity[] {
        return [ this.line ];
    }

    center() : Vec2 {
        const A = this.line.pointA.position;
        const B = this.line.pointB.position;

        return A.add(B).mul(0.5);
    }

    isNear(position : Vec2) : boolean {
        const center = this.center();        
        const real_distance = center.distance(position);
        return View.current.isNear(real_distance);
    }

    draw() : void {
        const A = this.line.pointA.position;
        const B = this.line.pointB.position;
        const AB = B.sub(A);

        const normal = AB.rot90().unit();

        const center = this.center();

        const tick_half_length = fromXPixScale(10);

        const tick_1 = center.add( normal.mul(- tick_half_length) );
        const tick_2 = center.add( normal.mul(  tick_half_length) );

        drawLine(this, tick_1, tick_2);
    }
}




}