///<reference path="shape.ts" />

namespace plane_ts {

export function calcFootFrom2Pos(position : Vec2, pos1 : Vec2, e : Vec2) : Vec2 {
    const v = position.sub(pos1);
    const h = e.dot(v);

    const foot = pos1.add(e.mul(h));

    return foot;
}

export function calcFootOfPerpendicular(position:Vec2, line: AbstractLine) : Vec2 {
    return calcFootFrom2Pos(position, line.pointA.position, line.e);
}
    

export function distanceFromLine(normal : Vec2, pointA : Vec2, position : Vec2) : number {
    return Math.abs( normal.dot(position.sub(pointA)) );
}

export class Midpoint extends Point {
    pointA   : Point;
    pointB   : Point;

    constructor(obj : { position : Vec2, pointA: Point, pointB: Point }){
        super(obj);
        this.pointA = obj.pointA;
        this.pointB = obj.pointB;

        this.calc();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            pointA : this.pointA.toObj(),
            pointB : this.pointB.toObj()
        });

        return obj;
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.pointA, this.pointB ]);
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.pointA, this.pointB);
    }

    calc(){
        const position = this.pointA.add(this.pointB).mul(0.5);
        this.setPosition(position);
    }

    reading() : Reading {
        return new Reading(this, TT('Find the midpoint of two points.'), []);
    }

    setRelations(): void {
        super.setRelations();
        const line = getCommonLineOfPoints(this.pointA, this.pointB);
        if(line != undefined){
            // msg(`add mid point On Lines point:${this.id} line:${line.id}`);
            addPointOnLines(this, line);
        }
    }
}

abstract class AbstractPerpendicularLine extends AbstractLine {
    line: AbstractLine;

    constructor(obj : { lineKind : number, pointA : Point, line : AbstractLine }){
        super(obj);

        this.line = obj.line;
    }
    
    makeObj() : any {
        return Object.assign(super.makeObj(), {
            line  : this.line.toObj(),
        });
    }

    setRelations(): void {
        super.setRelations();
        addPerpendicularPairs(this, this.line);
    }
}

export class FootOfPerpendicular extends AbstractPerpendicularLine {
    foot : Point;

    constructor(obj : { lineKind : number, pointA : Point, line : AbstractLine, foot : Point }){
        super(obj);
        this.foot = obj.foot;

        this.calc();
    }
    
    makeObj() : any {
        return Object.assign(super.makeObj(), {
            foot  : this.foot.toObj(),
        });
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.line, this.foot);
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.line ]);
    }

    setMode(mode : Mode){
        super.setMode(mode);
        this.foot.setMode(mode);
    }

    calc(){
        const foot_pos = calcFootOfPerpendicular(this.pointA.position, this.line);
        this.foot.setPosition(foot_pos);

        this.e = this.line.e.rot90().unit();
    }

    draw() : void {
        View.current.canvas.drawLineWith2Points(this, this.foot);
    }

    reading() : Reading {
        return new Reading(this, TT('Draw a perpendicular line from the point to the line.'), []);
    }

    setRelations(): void {
        super.setRelations();
        addPointOnLines(this.foot, this);
        addPointOnLines(this.foot, this.line);
    }
}


export class PerpendicularLine extends AbstractPerpendicularLine {

    constructor(obj : { lineKind : number, pointA : Point, line : AbstractLine }){
        super(obj);

        this.calc();
    }


    calc(){
        this.e = this.line.e.rot90().unit();
    }

    reading() : Reading {
        return new Reading(this, TT('Draw a perpendicular line.'), []);
    }
}



export function calcLineLineIntersection(l1 : AbstractLine, l2 : AbstractLine) : Vec2 {
    l1.calc();
    l2.calc();
    if(l1.e == undefined || l2.e == undefined){
        throw new MyError();
    }

    /*
    l1.p1 + u l1.e = l2.p1 + v l2.e

    l1.p1.x + u l1.e.x = l2.p1.x + v l2.e.x
    l1.p1.y + u l1.e.y = l2.p1.y + v l2.e.y

    l1.e.x, - l2.e.x   u = l2.p1.x - l1.p1.x
    l1.e.y, - l2.e.y   v = l2.p1.y - l1.p1.y
    
    */
    const m = new Mat2([[l1.e.x, - l2.e.x], [l1.e.y, - l2.e.y]]);
    const v = new Vec2(l2.pointA.position.x - l1.pointA.position.x, l2.pointA.position.y - l1.pointA.position.y);
    const mi = m.inv();
    const uv = mi.dot(v);
    const u = uv.x;

    const position = l1.pointA.position.add(l1.e.mul(u));

    return position;
}

export class LineLineIntersection extends Point {
    lineA : AbstractLine;
    lineB : AbstractLine;

    constructor(obj : { position : Vec2, lineA:AbstractLine, lineB:AbstractLine }) {
        super(obj)
        this.lineA = obj.lineA;
        this.lineB = obj.lineB;

        this.calc();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            lineA : this.lineA.toObj(),
            lineB : this.lineB.toObj(),
        });

        return obj;
    }

    dependencies() : MathEntity[] {
        return [ this.lineA, this.lineB ];
    }

    calc(){        
        const position = calcLineLineIntersection(this.lineA, this.lineB);

        this.setPosition(position);
    }

    reading(): Reading {
        return new Reading(this, TT('There is one intersection between the two lines.'), []);
    }

    setRelations(): void {
        super.setRelations();
        addPointOnLines(this, this.lineA);
        addPointOnLines(this, this.lineB);
    }
}

export class LineArcIntersection extends Shape {
    line : AbstractLine;
    arc  : CircleArc;
    pointA : Point;
    pointB : Point;

    constructor(obj : { line:AbstractLine, arc:CircleArc, pointA : Point, pointB : Point }){
        super(obj);

        this.line   = obj.line;
        this.arc    = obj.arc;
        this.pointA = obj.pointA;
        this.pointB = obj.pointB;

        this.calc();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            line   : this.line.toObj(),
            arc    : this.arc.toObj(),
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
        return [ this.line, this.arc ];
    }

    setMode(mode : Mode){
        this.pointA.setMode(mode);
        this.pointB.setMode(mode);
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
        this.line.calc();
        let e = this.line.e;
        
        // 交点の座標
        let positionA = foot.add(e.mul(t));
        let positionB = foot.add(e.mul(-t));

        this.pointA.setPosition(positionA);
        this.pointB.setPosition(positionB);
    }

    draw() : void {
    }

    reading(): Reading {
        if(this.arc instanceof Circle){

            return new Reading(this, TT('Find the intersection of the circle and the line.'), []);
        }
        else if(this.arc instanceof Arc){

            return new Reading(this, TT('Find the intersection of the arc and the line.'), []);
        }
        else{
            throw new MyError();
        }
    }

    setRelations(): void {
        super.setRelations();

        addPointOnLines(this.pointA, this.line);
        addPointOnLines(this.pointB, this.line);

        addPointOnCircleArcs(this.pointA, this.arc);
        addPointOnCircleArcs(this.pointB, this.arc);
    }
}

export class ArcArcIntersection extends Shape {
    arc1 : CircleArc;
    arc2 : CircleArc;
    pointA : Point;
    pointB : Point;

    constructor(obj : { arc1:CircleArc, arc2:CircleArc, pointA : Point, pointB : Point }){
        super(obj);

        this.arc1   = obj.arc1;
        this.arc2   = obj.arc2;
        this.pointA = obj.pointA;
        this.pointB = obj.pointB;

        this.calc();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            arc1   : this.arc1.toObj(),
            arc2   : this.arc2.toObj(),
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
        return [ this.arc1, this.arc2 ];
    }

    setMode(mode : Mode){
        this.pointA.setMode(mode);
        this.pointB.setMode(mode);
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
    }

    reading(): Reading {
        if(this.arc1 instanceof Circle && this.arc2 instanceof Circle){
            return new Reading(this, TT('Find the intersection of two circles.'), []);
        }
        else if(this.arc1 instanceof Arc && this.arc2 instanceof Arc){
            return new Reading(this, TT('Find the intersection of two arcs.'), []);
        }
        else{
            return new Reading(this, TT('Find the intersection of the circle and the arc.'), []);
        }
    }

    setRelations(): void {
        super.setRelations();

        addPointOnCircleArcs(this.pointA, this.arc1);
        addPointOnCircleArcs(this.pointB, this.arc1);

        addPointOnCircleArcs(this.pointA, this.arc2);
        addPointOnCircleArcs(this.pointB, this.arc2);
    }
}

export abstract class Tangent extends Shape {

}


export class CircleCircleTangent extends Tangent {
    circle1 : Circle;
    circle2 : Circle;    

    point   : Point;
    lines   : LineByPoints[] = [];

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

        const data = obj as any;

        if(data.point != undefined){
            this.point = data.point;
        }
        else{
            this.point = Point.zero();
        }

        if(data.lines != undefined){
            this.lines = data.lines;
        }
        else{
            const line_a = makeLineSegment( Point.zero(), Point.zero());
            const line_b = makeLineSegment( Point.zero(), Point.zero());
            this.lines = [ line_a, line_b ];
        }

        this.calc();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            circle1 : this.circle1.toObj(),
            circle2 : this.circle2.toObj(),
            point   : this.point.toObj(),
            lines   : this.lines.map(x => x.toObj())
        });

        return obj;
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.point);
        this.lines.forEach(line => line.getAllShapes(shapes));
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.circle1, this.circle2 ]);
    }

    setMode(mode : Mode){
        this.lines.forEach(x => x.setMode(mode));
    }

    draw() : void {
        this.point.draw();
        this.lines.forEach(x => x.draw());
    }

    calc(): void {
        const c1to2 = this.circle1.center.sub(this.circle2.center);
        const dist  = c1to2.len();
        const radius1 = this.circle1.radius();
        const radius2 = this.circle2.radius();

        if(radius2 < dist + radius1){
            const d = (radius1 / (radius2 - radius1)) * dist;

            const position = this.circle1.center.position.add( c1to2.unit().mul(d) );
            this.point.setPosition(position);
            this.point.setName("点");

            const tangent_positions_list : Vec2[] = [];
            for(const circle of [this.circle1, this.circle2]){

                const tangent_positions = calcCirclePointTangent(circle.center.position, circle.radius(), position);
                tangent_positions_list.push(...tangent_positions);
            }

            this.lines[0].pointA.setPosition( tangent_positions_list[0] );
            this.lines[0].pointB.setPosition( tangent_positions_list[2] );

            this.lines[1].pointA.setPosition( tangent_positions_list[1] );
            this.lines[1].pointB.setPosition( tangent_positions_list[3] );
        }
    }

    reading(): Reading {
        return new Reading(this, TT('Draw tangents to the two circles.'), []);
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
    tangentPoints : Point[] = [];
    lines   : LineByPoints[] = [];

    constructor( obj : { circle : Circle, point : Point }){
        super(obj);
        this.circle = obj.circle;
        this.point  = obj.point;

        const data = obj as any;

        if(data.tangentPoints != undefined){
            this.tangentPoints = data.tangentPoints;
        }
        else{
            this.tangentPoints = [ Point.zero(), Point.zero() ];
        }

        if(data.lines != undefined){
            this.lines = data.lines;
        }
        else{
            const line_a = makeLineSegment(this.point, Point.zero());
            const line_b = makeLineSegment(this.point, Point.zero());
            this.lines = [ line_a, line_b ];
        }

        this.calc();
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            circle   : this.circle.toObj(),
            point   : this.point.toObj(),
            tangentPoints : this.tangentPoints.map(x => x.toObj()),
            lines : this.lines.map(x => x.toObj())
        });

        return obj;
    }

    getAllShapes(shapes : MathEntity[]){
        super.getAllShapes(shapes);
        shapes.push(this.circle, this.point, ...this.tangentPoints, ...this.lines);
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.circle, this.point ]);
    }

    setMode(mode : Mode){
        this.tangentPoints.forEach(x => x.setMode(mode));
        this.lines.forEach(x => x.setMode(mode));
    }

    draw() : void {
        this.tangentPoints.forEach(x => x.draw());
        this.lines.forEach(x => x.draw());
    }

    calc(): void {
        const tangent_positions = calcCirclePointTangent(this.circle.center.position, this.circle.radius(), this.point.position);

        for(const [i, position] of tangent_positions.entries()){
            this.tangentPoints[i].setPosition(position);
            this.lines[i].pointB.setPosition(position);
        }
    }

    reading(): Reading {
        return new Reading(this, TT('Draw a tangent line from the point to the circle.'),
            [this.point].concat(this.tangentPoints));
    }
}

export class AngleBisector extends AbstractLine {
    lineA       : AbstractLine;
    directionA  : number;

    lineB       : AbstractLine;
    directionB  : number;

    constructor(obj : { lineKind : number, lineA : AbstractLine, directionA : number, lineB : AbstractLine, directionB : number }){
        (obj as any).pointA = getCommonPointOfLines(obj.lineA, obj.lineB); 
        super(obj as any);
        this.lineA       = obj.lineA;
        this.directionA  = obj.directionA;

        this.lineB       = obj.lineB;
        this.directionB  = obj.directionB;

        this.calc();
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

    dependencies() : MathEntity[] {
        return [ this.lineA, this.lineB ];
    }

    calc(): void {
        this.e = this.lineA.e.mul(this.directionA).add(this.lineB.e.mul(this.directionB)).mul(0.5);
    }

    reading() : Reading {
        return this.textReading(TT("Draw the angle bisector."));
    }

}



export class PropertyChange {
    widget : Widget;
    propertyName : string;
    oldValue : any;
    newValue : any;

    constructor(obj : { widget : Widget, propertyName : string, oldValue : any, newValue : any }){
        this.widget = obj.widget;
        this.propertyName = obj.propertyName;
        this.oldValue = obj.oldValue;
        this.newValue = obj.newValue;
    }

    makeObj() : any {
        return {
            typeName: this.constructor.name,
            widget : this.widget.toObj(),
            propertyName : this.propertyName,
            oldValue : anyToObj(this.oldValue),
            newValue : anyToObj(this.newValue)
        }
    }

    restore(){
        setProperty(this.widget, this.propertyName, this.oldValue);
    }
}

export class Motion extends MathEntity {
    propertyChanges : PropertyChange[] = [];

    constructor(obj : { propertyChanges : PropertyChange[] }){
        super(obj);
        this.propertyChanges = obj.propertyChanges;
    }

    makeObj() : any {
        return Object.assign(super.makeObj(), {
            propertyChanges : this.propertyChanges.map(x => x.makeObj()),
        });
    }    

    addPropertyChange(widget : Widget, propertyName : string, oldValue : any, newValue : any){
        msg(`add Property Change ${propertyName} ${oldValue}=>${newValue}`);
        this.propertyChanges.push( new PropertyChange({ widget, propertyName, oldValue, newValue }) );
    }

    reading(): Reading {
        throw new MyError();
    }   

    async animate(speech : i18n_ts.AbstractSpeech){
        const startTime = Date.now();
        while(true){
            const endTime = Date.now();
            let rate = (endTime - startTime) / 3000;
            if(getPlayMode() == PlayMode.fastForward){
                rate *= 3;
            }
            if(1 < rate){
                break;
            }

            for(const property_change of this.propertyChanges){

                if(property_change.widget instanceof Point && property_change.propertyName == "position"){
                    const point = property_change.widget;

                    const midway_position = Vec2.interpolate(property_change.oldValue, property_change.newValue, rate);
                    point.setPosition(midway_position);
                }
            }

            View.current.dirty = true;
            View.current.updateShapes();
            await sleep(10);
        }
    }

    restorePropertyChanges(){
        this.propertyChanges.reverse().forEach(x => x.restore());
    }
}

}
