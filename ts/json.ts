namespace planets {

let refMap : Map<number, any>;

export class Widget {
    static maxId = 0;
    static processed : Set<number>;
    id : number;

    constructor(){        
        this.id = Widget.maxId++;
    }

    make(obj: any) : Widget {
        if(obj.id != undefined){
            refMap.set(obj.id, this);
        }
        for(let [k, v] of Object.entries(obj)){
            if(k == "listeners" || k == "bindTo"){
                (this as any)[k] = v;
            }
            else{

                (this as any)[k] = parseObject(v);
            }
        }

        return this;
    }

    makeObj() : any{
        return {
            id: this.id,
            typeName: this.constructor.name
        };
    }

    toObj(){
        if(Widget.processed.has(this.id)){
            return { ref: this.id };
        }

        Widget.processed.add(this.id);

        return this.makeObj();
    }
    
}

export function parseObject(obj: any) : any {
    if(obj == undefined || obj == null || typeof obj != "object"){
        return obj;
    }

    if(Array.isArray(obj)){
        let v = obj.map(x => parseObject(x));
        return v;
    }

    if(obj.ref != undefined){
        let o = refMap.get(obj.ref);
        console.assert(o != undefined);
        return o;
    }

    if(obj.typeName == Vec2.name){
        return new Vec2(obj.x, obj.y);
    }

    switch(obj.typeName){
    // case TextBlock.name:
    //     return new TextBlock("").make(obj);

    // case Speech.name:
    //     return new Speech("").make(obj);

    // case View.name:
    //     return new View().make(obj);

    // case Simulation.name:
    //     return new Simulation().make(obj);

    // case ViewPoint.name:
    //     return new ViewPoint().make(obj);
    
    // case PackageInfo.name:
    //     return obj;

    // case Variable.name:
    //     return new Variable(obj);
    
    // case Point.name:
    //     return Point.fromArgs(view, obj.position, obj.bound);

    // case LineSegment.name:
    //     return new LineSegment().make(obj);

    // case Rect.name:
    //     return new Rect().make(obj);

    // case Circle.name:
    //     return new Circle(obj.byDiameter).make(obj);

    // case DimensionLine.name:
    //     return new DimensionLine().make(obj);

    // case Triangle.name:
    //     return new Triangle().make(obj);

    // case Midpoint.name:
    //     return new Midpoint().make(obj);

    // case Perpendicular.name:
    //     return new Perpendicular().make(obj);

    // case ParallelLine.name:
    //     return new ParallelLine().make(obj);

    // case Intersection.name:
    //     return new Intersection().make(obj);

    // case Arc.name:
    //     return new Arc().make(obj);

    // case Angle.name:
    //     return new Angle().make(obj);

    // case Image.name:
    //     return new Image(obj);

    // case WidgetSelection.name:
    // case "ShapeSelection":
    //         return new WidgetSelection().make(obj);

    // case TextSelection.name:
    //     return new TextSelection().make(obj);

    // case FuncLine.name:
    //     return new FuncLine().make(obj);

    //     case Surface.name:
    //         return new Surface().make(obj);
    
    default:
        throw new MyError();
    }
}


}