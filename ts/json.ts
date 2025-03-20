namespace plane_ts {

export let idMap = new Map<number, Widget>();

export abstract class Widget {
    static refMap : Map<number, any> = new Map<number, any>();
    static isLoading : boolean = false;

    // static 
    static maxId = 0;
    static processed : Set<number>;
    id : number;
    order : number = NaN;

    constructor(obj : any){        
        if(obj.id != undefined){

            this.id = obj.id;
            Widget.maxId = Math.max(Widget.maxId, this.id);

            Widget.refMap.set(obj.id, this);
        }
        else{

            this.id = ++Widget.maxId;
        }
        assert(this.id <= Widget.maxId && !idMap.has(this.id));
        idMap.set(this.id, this);
    }

    getProperties(){
        return [ "id", "order" ];
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

export function parseObject(obj: any, parse_other_object? : (o : any)=>any) : any {
    if(obj == undefined || obj == null || typeof obj != "object"){
        return obj;
    }

    // if(obj instanceof Widget || obj instanceof Vec2){
    //     return obj;
    // }

    if(Array.isArray(obj)){
        let v = obj.map(x => parseObject(x, parse_other_object));
        return v;
    }

    if(obj.ref != undefined){
        let o = Widget.refMap.get(obj.ref);       
        if(o == undefined){
            throw new MyError("no-ref");
        }
        return o;
    }

    if(obj.typeName == Vec2.name){
        return new Vec2(obj.x, obj.y);
    }

    for(let [name, val] of Object.entries(obj)){
        if(name == "bound" && (val as any).ref != undefined && Widget.refMap.get((val as any).ref) == undefined){
            msg(`no bound:${obj.id}`);
            obj.bound = undefined;
            continue;
        }
        obj[name] = parseObject(val, parse_other_object);
    }

    switch(obj.typeName){
    case TextBlock.name:
        return new TextBlock(obj);

    // case Speech.name:
    //     return new Speech(obj);

    // case Simulation.name:
    //     return new Simulation(obj);

    // case ViewPoint.name:
    //     return new ViewPoint(obj);
    
    // case PackageInfo.name:
    //     return obj;

    // case Variable.name:
    //     return new Variable(obj);
    
    case Point.name:
        return new Point(obj);

    case LineByPoints.name:
        return new LineByPoints(obj);

    case Polygon.name:
        return new Polygon(obj);

    // case Rect.name:
    //     return new Rect(obj);

    case CircleByPoint.name:
        return new CircleByPoint(obj);

    case CircleByRadius.name:
        return new CircleByRadius(obj);

    case Ellipse.name:
        return new Ellipse(obj);

    case DimensionLine.name:
        return new DimensionLine(obj);

    case LengthSymbol.name:
        return new LengthSymbol(obj);
    
    // case Triangle.name:
    //     return new Triangle(obj);

    case Midpoint.name:
        return new Midpoint(obj);

    case FootOfPerpendicular.name:
        return new FootOfPerpendicular(obj);

    case PerpendicularLine.name:
        return new PerpendicularLine(obj);

    case ParallelLine.name:
        return new ParallelLine(obj);

    case LineLineIntersection.name:
        return new LineLineIntersection(obj);

    case ArcArcIntersection.name:
        return new ArcArcIntersection(obj);

    case LineArcIntersection.name:
        return new LineArcIntersection(obj);

    case CirclePointTangent.name:
        return new CirclePointTangent(obj);

    case CircleCircleTangent.name:
        return new CircleCircleTangent(obj);

    case ArcByPoint.name:
        return new ArcByPoint(obj);

    case ArcByRadius.name:
    case ArcByLengthSymbol.name:
        return new ArcByLengthSymbol(obj);

    case ArcByCircle.name:
        return new ArcByCircle(obj);

    case Triangle.name:
        return new Triangle(obj);
    
    case Angle.name:
        return new Angle(obj);

    case AngleBisector.name:
        return new AngleBisector(obj);

    // case Image.name:
    //     return new Image(obj);

    // case WidgetSelection.name:
    // case "ShapeSelection":
    //         return new WidgetSelection(obj);

    // case TextSelection.name:
    //     return new TextSelection(obj);

    // case FuncLine.name:
    //     return new FuncLine(obj);

    //     case Surface.name:
    //         return new Surface(obj);
    
    case Statement.name:
        return new Statement(obj);

    case TriangleCongruence.name:
        return new TriangleCongruence(obj);

    case TriangleSimilarity.name:
        return new TriangleSimilarity(obj);

    case "EqualLength":
    case LengthEquality.name:
        return new LengthEquality(obj);

    case AngleEquality.name:
        return new AngleEquality(obj);

    case ParallelDetector.name:
        return new ParallelDetector(obj);

    case PropertyChange.name:
        return new PropertyChange(obj);

    case LengthEqualityConstraint.name:
        return new LengthEqualityConstraint(obj);

    case AngleEqualityConstraint.name:
        return new AngleEqualityConstraint(obj);

    case ParallelConstraint.name:
        return new ParallelConstraint(obj);

    case PerpendicularConstraint.name:
        return new PerpendicularConstraint(obj);

    case Motion.name:
        return new Motion(obj);

    case Quadrilateral.name:
        return new Quadrilateral(obj);

    case ParallelogramClassifier.name:
        return new ParallelogramClassifier(obj);

    case RhombusClassifier.name:
        return new RhombusClassifier(obj);

    default:
        if(parse_other_object != undefined){
            return parse_other_object(obj);
        }
        throw new MyError(`parse Object: unknown type:[${obj.typeName}]`);
    }
}

export function saveJson(anchor : layout_ts.Anchor){
    const text = plane_ts.getOperationsText();

    const blob = new Blob([text], { type: 'application/json' });

    layout_ts.saveBlob(anchor, "movie", blob);
}

export function handleFileSelect(ev: DragEvent) {
    ev.stopPropagation();
    ev.preventDefault();

    const files = ev.dataTransfer!.files; // FileList object.

    for (let file of files) {
        msg(`drop name:${escape(file.name)} type:${file.type} size:${file.size} mtime:${file.lastModified.toLocaleString()} `);

        const reader = new FileReader();

        reader.onload = () => {
            const json = reader.result as string;
            const obj  = JSON.parse(json);

            assert(false);
            loadData(obj);

            // viewEvent(obj);
        };
        reader.readAsText(file);        
        // uploadFile(f);
    }
}

export function loadData(obj : any){

    Plane.one.clearPlane();

    Widget.maxId  = -1;
    idMap = new Map<number, Widget>();
    Widget.refMap = new Map<number, any>();
    MathEntity.orderSet.clear();

    const view = View.current;
    for(let [name, val] of Object.entries(obj)){
        if(name != "shapes"){
            (view as any)[name] = parseObject(val);
        }
    }

    view.shapes = [];
    const all_shapes : MathEntity[] = [];
    plane_ts.initRelations();
    for(const shape_obj of obj.shapes){
        Widget.isLoading = true;
        const shape = parseObject(shape_obj) as MathEntity;
        Widget.isLoading = false;

        view.shapes.push( shape );

        shape.setOrder();
        shape.setRelations();

        shape.getAllShapes(all_shapes);
    }

    const all_real_shapes = view.allRealShapes();

    all_real_shapes.filter(x => x.caption != undefined).forEach(x => x.caption!.parent = x);

    all_real_shapes.forEach(x => x.updateCaption());

    (view.shapes.filter(x => x instanceof TextBlock) as TextBlock[]).forEach(x => x.updateTextPosition());

    Plane.one.shapes_block.clear();
    view.shapes.forEach(x => addToShapeHistory(x));
}

export function handleDragOver(evt: DragEvent) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer!.dropEffect = 'copy'; // Explicitly show this is a copy.
}


}