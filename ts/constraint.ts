///<reference path="shape.ts" />

namespace plane_ts {
//

export function sortShape<T>(shapes : T[]) : T[] {
    return shapes.slice().sort((a:T, b:T) => (a as Shape).order - (b as Shape).order);
}

function lastShape<T>(shapes : T[]) : T {
    const sorted_shapes = sortShape<T>(shapes);

    return last(sorted_shapes);
}

export abstract class Constraint extends Shape {
    constructor(obj : any){
        super(obj);
    }

    applyConstraint(shape : Shape){        
    }
    
    draw(): void {        
    }
}

export class LengthEqualityConstraint extends Constraint {
    point : Point;
    lengthSymbolA : LengthSymbol;
    lengthSymbolB : LengthSymbol;

    constructor(obj : { lengthSymbolA : LengthSymbol, lengthSymbolB : LengthSymbol }){
        super(obj);
        const [lengthSymbolA, lengthSymbolB] = sortShape<LengthSymbol>([ obj.lengthSymbolA, obj.lengthSymbolB ]);
        let points = [ obj.lengthSymbolA, obj.lengthSymbolB ].map(x => [x.pointA, x.pointB]).flat();
        this.point = lastShape(points);
        this.point.addConstraint(this);

        this.lengthSymbolA = obj.lengthSymbolA;
        this.lengthSymbolB = obj.lengthSymbolB;

        this.calc();
    }

    makeObj() : any {
        return Object.assign(super.makeObj(), {
            lengthSymbolA : this.lengthSymbolA.toObj(),
            lengthSymbolB : this.lengthSymbolB.toObj(),
        });
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.lengthSymbolA ]);
    }

    calc(): void {
        this.point.calc();
    }

    applyConstraint(shape : Shape){
        if(shape != this.point){
            throw new MyError();
        }

        const length = this.lengthSymbolA.length();
        const anchor = this.getAnchor().position;
        const dir = this.point.position.sub(anchor).unit();
        const theta = Math.atan2(dir.y, dir.x);
        const adjusted_position = anchor.add(dir.mul(length));
        this.point.setPosition(adjusted_position);
    }

    getAnchor() : Point {
        if(this.lengthSymbolB.pointA == this.point){
            return this.lengthSymbolB.pointB;
        }
        else if(this.lengthSymbolB.pointB == this.point){
            return this.lengthSymbolB.pointA;
        }
        else{
            throw new MyError();
        }
    }
}

abstract class LineConstraint extends Constraint {
    lineA : AbstractLine;
    lineB : LineByPoints;

    constructor(obj : { lineA : AbstractLine, lineB : LineByPoints }){
        super(obj);
        assert(obj.lineA.order < obj.lineB.order);
        this.lineA = obj.lineA;
        this.lineB = obj.lineB;
    }
}

export abstract class ParallelPerpendicularConstraint extends LineConstraint {
    constructor(obj : { lineA : AbstractLine, lineB : LineByPoints }){
        super(obj);

        this.lineB.pointB.addConstraint(this);
        this.calc();
    }

    makeObj() : any {
        return Object.assign(super.makeObj(), {
            lineA : this.lineA.toObj(),
            lineB : this.lineB.toObj(),
        });
    }

    dependencies() : MathEntity[] {
        return super.dependencies().concat([ this.lineA, this.lineB.pointA ]);
    }

    calc(): void {
        this.lineB.pointB.calc();        
    }

    applyConstraint(shape : Shape){  
        assert(shape == this.lineB.pointB);
        const AB = this.lineB.pointB.sub(this.lineB.pointA);
        let newAB : Vec2;
        if(this instanceof ParallelConstraint){
            newAB = this.lineA.e.project(AB);
        }
        else{
            newAB = this.lineA.e.rot90().project(AB);
        }

        const positionB = this.lineB.pointA.position.add( newAB );
        this.lineB.pointB.setPosition(positionB);
    }
}

export class ParallelConstraint extends ParallelPerpendicularConstraint {
    setRelations(){
        super.setRelations();
        addParallelLines(this.lineA, this.lineB);
    }
    
}

export class PerpendicularConstraint extends ParallelPerpendicularConstraint {
    setRelations(){
        super.setRelations();
        addPerpendicularPairs(this.lineA, this.lineB);
    }
}

}