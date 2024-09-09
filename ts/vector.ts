namespace planets {
//
export class Vec2 {
    static maxId = 0;

    static nan() : Vec2 {
        return new Vec2(NaN, NaN);
    }

    static zero() : Vec2 {
        return new Vec2(0, 0);
    }



    id : number;
    typeName: string = "Vec2";
    x: number;
    y: number;

    constructor(x:number, y: number){
        this.id = Vec2.maxId++;
        this.x = x;
        this.y = y;
    }

    makeJson() : [ number, number ] {
        return [ this.x, this.y ];
    }

    toString() : string {
        return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`;
    }

/*+++
    app() : App {
        return new App(operator("vec"), [new ConstNum(this.x), new ConstNum(this.y)]);
    }
*/

    copy(){
        return new Vec2(this.x, this.y);
    }

    equals(pt: Vec2): boolean {
        return this.x == pt.x && this.y == pt.y;
    }

    add(pt: Vec2) : Vec2{
        return new Vec2(this.x + pt.x, this.y + pt.y);
    }

    sub(pt: Vec2) : Vec2{
        return new Vec2(this.x - pt.x, this.y - pt.y);
    }

    mul(cx: number, cy : number | undefined = undefined) : Vec2 {
        if(cy == undefined){
            cy = cx;
        }

        return new Vec2(cx * this.x, cy * this.y);
    }

    len2(): number {
        return this.x * this.x + this.y * this.y;
    }

    len(): number {
        return Math.hypot(this.x, this.y);
    }

    dist(pt:Vec2) : number {
        return Math.hypot( pt.x - this.x, pt.y - this.y );
    }

    dot(pt:Vec2) : number{
        return this.x * pt.x + this.y * pt.y;
    }

    unit() : Vec2{
        const d = this.len();

        if(d == 0){

            return new Vec2(0, 0);
        }

        return new Vec2(this.x / d, this.y / d);
    }

    divide(t: number, pt: Vec2) : Vec2 {
        const x = (1 - t) * this.x + t * pt.x;
        const y = (1 - t) * this.y + t * pt.y;

        return new Vec2(x, y);
    }

    rot(th : number) : Vec2 {
        const cs = Math.cos(th);
        const sn = Math.sin(th);

        return new Vec2(this.x * cs - this.y * sn, this.x * sn + this.y * cs);
    }

    rot90() : Vec2 {
        return new Vec2(- this.y, this.x);
    }

    rot45() : Vec2 {
        const cs = Math.cos(Math.PI / 4);

        return new Vec2(cs * (this.x - this.y), cs * (this.x + this.y));
    }

}
}
