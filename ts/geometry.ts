namespace planets {

export function calcFootOfPerpendicular(line: LineSegment, pos:Vec2) : Vec2 {
    const p1 = line.p1.pos;
    const p2 = line.p2.pos;

    // unit vector from p1 to p2
    const e = p2.sub(p1).unit();

    const v = pos.sub(p1);
    const h = e.dot(v);

    const foot = p1.add(e.mul(h));

    return foot;
}
    

export function DistanceFromLine(line : LineSegment, pos : Vec2) : number {
    const foot = calcFootOfPerpendicular(line, pos);
    return pos.dist(foot);
}
}
