///<reference path="shape.ts" />

namespace planets {

export function calcFootFrom2Pos(position : Vec2, pos1 : Vec2, pos2 : Vec2) : Vec2 {

    // unit vector from p1 to p2
    const e = pos2.sub(pos1).unit();

    const v = position.sub(pos1);
    const h = e.dot(v);

    const foot = pos1.add(e.mul(h));

    return foot;
}

export function calcFootOfPerpendicular(position:Vec2, line: Line) : Vec2 {
    return calcFootFrom2Pos(position, line.pointA.position, line.pointB.position);
}
    

export function DistanceFromLine(line : Line, position : Vec2) : number {
    const foot = calcFootOfPerpendicular(position, line);
    return position.distance(foot);
}

export class FootOfPerpendicular extends Shape {
    point:Point;
    line: Line;
    foot : Point;

    constructor(obj : { point:Point, line: Line }){
        super(obj);
        this.point = obj.point;
        this.line  = obj.line;

        this.foot = Point.fromArgs(Vec2.zero());
        this.calc();
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.point, this.line, this.foot);
    }

    dependencies() : Shape[] {
        return [ this.point, this.line ];
    }

    draw() : void {
        this.point.draw();
        this.line.draw();
        this.foot.draw();
    }

    calc(){
        const foot_pos = calcFootOfPerpendicular(this.point.position, this.line);
        this.foot.setPosition(foot_pos);
    }
}

export class LinesIntersection extends Shape {
    lineA : Line;
    lineB : Line;
    point : Point;

    constructor(obj : {lineA:Line, lineB:Line }) {
        super(obj)
        this.lineA = obj.lineA;
        this.lineB = obj.lineB;

        this.point = Point.fromArgs(Vec2.zero());
        this.calc();
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.point);
    }

    dependencies() : Shape[] {
        return [ this.lineA, this.lineB ];
    }

    calc(){        
        const [l1, l2] = [ this.lineA, this.lineB ];

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
        const v = new Vec2(l2.pointA.position.x - l1.pointA.position.x, l2.pointA.position.y - l1.pointA.position.y);
        const mi = m.inv();
        const uv = mi.dot(v);
        const u = uv.x;

        const position = l1.pointA.position.add(l1.p12.mul(u));
        this.point.setPosition(position);
    }

    draw() : void {
        this.point.draw();
    }
}

export class LineArcIntersection extends Shape {
    line : Line;
    arc  : CircleArc;
    pointA : Point;
    pointB : Point;

    constructor(obj : { line:Line, arc:CircleArc }){
        super(obj);

        this.line = obj.line;
        this.arc  = obj.arc;

        this.pointA = Point.fromArgs(Vec2.zero());
        this.pointB = Point.fromArgs(Vec2.zero());
        this.calc();
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA, this.pointB);
    }

    dependencies() : Shape[] {
        return [ this.line, this.arc ];
    }

    calc(){        

        // 円/弧の中心
        const center = this.arc.center;

        // 円/弧の中心から線分に垂線をおろして、その足をfootとする。
        const foot = calcFootOfPerpendicular(center.position, this.line);

        // 円/弧の中心から垂線の足までの距離。
        const h = foot.sub(center.position).len();

        // 円/弧の半径
        let r = this.arc.radius();

        if(r < h ){
            // 半径が垂線の足までの距離より小さい場合

            throw new MyError();
        }

        // 垂線の足から交点までの距離
        let t = Math.sqrt(r*r - h * h);

        // 線分の単位方向ベクトル
        this.line.setVecs();
        let e = this.line.e;
        
        // 交点の座標
        let positionA = foot.add(e.mul(t));
        let positionB = foot.add(e.mul(-t));

        this.pointA.setPosition(positionA);
        this.pointB.setPosition(positionB);
    }

    draw() : void {
        this.pointA.draw();
        this.pointB.draw();
    }
}

export class ArcArcIntersection extends Shape {
    arc1 : CircleArc;
    arc2 : CircleArc;
    pointA : Point;
    pointB : Point;

    constructor(obj : { arc1:CircleArc, arc2:CircleArc }){
        super(obj);

        this.arc1 = obj.arc1;
        this.arc2 = obj.arc2;

        this.pointA = Point.fromArgs(Vec2.zero())
        this.pointB = Point.fromArgs(Vec2.zero())

        this.calc();
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA, this.pointB);
    }

    dependencies() : Shape[] {
        return [ this.arc1, this.arc2 ];
    }

    calc(){        
        // 円/弧の中心
        const c1 = this.arc1.center;
        const c2 = this.arc2.center;

        // 円/弧の半径
        const r1 = this.arc1.radius();
        const r2 = this.arc2.radius();

        // 円/弧の中心の距離
        const L = c1.position.distance(c2.position);

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
        const foot = c1.position.add(e1.mul(t));
        
        // 交点の座標
        let positionA = foot.add(e2.mul(h));
        let positionB = foot.add(e2.mul(-h));

        this.pointA.setPosition(positionA);
        this.pointB.setPosition(positionB);
    }

    draw() : void {
        this.pointA.draw();
        this.pointB.draw();
    }
}

export abstract class Tangent extends Shape {

}


export class CircleCircleTangent extends Tangent {
    circle1 : Circle;
    circle2 : Circle;    
    points  : Point[] = [];
    lines   : Line[] = [];

    constructor(obj : { circle1 : Circle, circle2 : Circle }){
        super(obj);
        if(obj.circle1.radius() <= obj.circle2.radius()){

            this.circle1 = obj.circle1;
            this.circle2 = obj.circle2;
        }
        else{

            this.circle1 = obj.circle2;
            this.circle2 = obj.circle1;
        }

        this.calc();
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(...this.points, ...this.lines);
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.circle1, this.circle2 ]);
    }

    draw() : void {
        this.points.forEach(x => x.draw());
        this.lines.forEach(x => x.draw());
    }

    calc(): void {
        const c1to2 = this.circle1.center.sub(this.circle2.center);
        const dist  = c1to2.len();
        const radius1 = this.circle1.radius();
        const radius2 = this.circle2.radius();

        this.points = [];
        this.lines  = [];
        if(radius2 < dist + radius1){
            const d = (radius1 / (radius2 - radius1)) * dist;

            const position = this.circle1.center.position.add( c1to2.unit().mul(d) );
            const point = Point.fromArgs(position);
            point.setName("点");
            this.points.push(point);

            const tangent_poss = calcCirclePointTangent(this.circle2.center.position, this.circle2.radius(), position);

            const tan_points = tangent_poss.map(position => Point.fromArgs(position));
            this.points.push(...tan_points);

            this.lines      = tan_points.map(pt => new LineSegment({ pointA : point, pointB : pt}));
        }
        
    }
}

function calcCirclePointTangent(center : Vec2, radius : number, position : Vec2) : [Vec2, Vec2] {
    const center_point_distance = center.distance(position);
    const tangent_point_distance = Math.sqrt(center_point_distance * center_point_distance - radius * radius);

    const [a, b, c] = [ radius, tangent_point_distance, center_point_distance ];
    const cos_theta = (b*b + c*c - a*a) / (2 * b * c );
    const theta  = Math.acos(cos_theta);

    const pc = center.sub(position);
    const tangent_positions : Vec2[] = [];
    for(const th of [theta, -theta]){
        const v = pc.rot(th).unit().mul(tangent_point_distance);

        const tangent_position = position.add(v);
        tangent_positions.push(tangent_position);
    }

    return tangent_positions as [Vec2, Vec2];
}

export class CirclePointTangent extends Tangent {
    circle : Circle;
    point  : Point;
    tan_points : Point[] = [];
    lines   : Line[] = [];

    constructor( obj : { circle : Circle, point : Point }){
        super(obj);
        this.circle = obj.circle;
        this.point  = obj.point;

        this.calc();
    }

    getAllShapes(shapes : Shape[]){
        super.getAllShapes(shapes);
        shapes.push(this.circle, this.point, ...this.tan_points, ...this.lines);
    }

    dependencies() : Shape[] {
        return super.dependencies().concat([ this.circle, this.point ]);
    }

    draw() : void {
        this.tan_points.forEach(x => x.draw());
        this.lines.forEach(x => x.draw());
    }

    calc(): void {
        const tangent_poss = calcCirclePointTangent(this.circle.center.position, this.circle.radius(), this.point.position);

        this.tan_points = tangent_poss.map(position => Point.fromArgs(position));
        this.lines      = this.tan_points.map(pt => new LineSegment( { pointA : this.point, pointB : pt }));
    }
}


}
