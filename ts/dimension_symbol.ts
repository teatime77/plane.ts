///<reference path="shape.ts" />

namespace plane_ts {
//
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
        const normal = AB.rot90().unit();
        const shift_vec = normal.mul(this.shift);

        const A_shift = A.add(shift_vec);
        const B_shift = B.add(shift_vec);

        const shift_pix_len = View.current.toXPixScale(Math.abs(this.shift));
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