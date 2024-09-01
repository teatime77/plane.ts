///<reference path="shape.ts" />

namespace planets {

export function calcFootFrom2Pos(pos : Vec2, pos1 : Vec2, pos2 : Vec2) : Vec2 {

    // unit vector from p1 to p2
    const e = pos2.sub(pos1).unit();

    const v = pos.sub(pos1);
    const h = e.dot(v);

    const foot = pos1.add(e.mul(h));

    return foot;

}
export function calcFootOfPerpendicular(pos:Vec2, line: Line) : Vec2 {
    return calcFootFrom2Pos(pos, line.p1.pos, line.p2.pos);
}
    

export function DistanceFromLine(line : Line, pos : Vec2) : number {
    const foot = calcFootOfPerpendicular(pos, line);
    return pos.dist(foot);
}

export class LinesIntersection extends Shape {
    point : Point;

    constructor(view : View, l1:Line, l2:Line) {
        super(view)
        l1.setVecs();
        l2.setVecs();
        if(l1.p12 == undefined || l2.p12 == undefined){
            throw new MyError();
        }

        /*
        l1.p1 + u l1.p12 = l2.p1 + v l2.p12

        l1.p1.x + u l1.p12.x = l2.p1.x + v l2.p12.x
        l1.p1.y + u l1.p12.y = l2.p1.y + v l2.p12.y

        l1.p12.x, - l2.p12.x   u = l2.p1.x - l1.p1.x
        l1.p12.y, - l2.p12.y   v = l2.p1.y - l1.p1.y
        
        */
        const m = new Mat2([[l1.p12.x, - l2.p12.x], [l1.p12.y, - l2.p12.y]]);
        const v = new Vec2(l2.p1.pos.x - l1.p1.pos.x, l2.p1.pos.y - l1.p1.pos.y);
        const mi = m.inv();
        const uv = mi.dot(v);
        const u = uv.x;

        const pos = l1.p1.pos.add(l1.p12.mul(u));
        this.point = new Point(view, pos);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.point);
    }

    draw() : void {
        this.point.draw();
    }
}

export class LineArcIntersection extends Shape {
    p1 : Point;
    p2 : Point;

    constructor(view : View, line:Line, arc:CircleArc){
        super(view);

        // 円/弧の中心
        const center = arc.center;

        // 円/弧の中心から線分に垂線をおろして、その足をfootとする。
        const foot = calcFootOfPerpendicular(center.pos, line);

        // 円/弧の中心から垂線の足までの距離。
        const h = foot.sub(center.pos).len();

        // 円/弧の半径
        let r = arc.radius();

        if(r < h ){
            // 半径が垂線の足までの距離より小さい場合

            throw new MyError();
        }

        // 垂線の足から交点までの距離
        let t = Math.sqrt(r*r - h * h);

        // 線分の単位方向ベクトル
        line.setVecs();
        let e = line.e;
        
        // 交点の座標
        let p1 = foot.add(e.mul(t));
        let p2 = foot.add(e.mul(-t));

        this.p1 = new Point(view, p1);
        this.p2 = new Point(view, p2);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.p1, this.p2);
    }

    draw() : void {
        this.p1.draw();
        this.p2.draw();
    }
}

export class ArcArcIntersection extends Shape {
    p1 : Point;
    p2 : Point;

    constructor(view : View, arc1:CircleArc, arc2:CircleArc){
        super(view);

        // 円/弧の中心
        const c1 = arc1.center;
        const c2 = arc2.center;

        // 円/弧の半径
        const r1 = arc1.radius();
        const r2 = arc2.radius();

        // 円/弧の中心の距離
        const L = c1.pos.dist(c2.pos);

        // r1*r1 - t*t = r2*r2 - (L - t)*(L - t)
        //             = r2*r2 - L*L + 2Lt - t*t
        // r1*r1 = r2*r2 - L*L + 2Lt
        const t = (r1*r1 - r2*r2 + L*L)/ (2 * L);

        // 円/弧の交点から、円/弧の中心を結ぶ直線におろした垂線の長さの二乗
        const h2 = r1*r1 - t*t;
        if(h2 < 0){
            throw new MyError();
        }

        const h = Math.sqrt(h2);

        // c1→c2の単位ベクトル
        const e1 = c2.sub(c1).unit();

        // e1の法線ベクトル
        const e2 = new Vec2(- e1.y, e1.x);

        // 円/弧の交点から、円/弧の中心を結ぶ直線におろした垂線の足
        const foot = c1.pos.add(e1.mul(t));
        
        // 交点の座標
        let p1 = foot.add(e2.mul(h));
        let p2 = foot.add(e2.mul(-h));

        this.p1 = new Point(view, p1);
        this.p2 = new Point(view, p2);
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.p1, this.p2);
    }

    draw() : void {
        this.p1.draw();
        this.p2.draw();
    }
}


}
