namespace plane_ts {

export abstract class Widget {
    static refMap : Map<number, any> = new Map<number, any>();
    static defferedBound : [number, number][];
    static defferedCalc : Shape[];
    static isLoading : boolean = false;

    // static 
    static maxId = 0;
    static processed : Set<number>;
    id : number;

    constructor(obj : any){        
        if(obj.id != undefined){

            this.id = obj.id;
            Widget.maxId = Math.max(Widget.maxId, this.id);

            Widget.refMap.set(obj.id, this);
        }
        else{

            this.id = ++Widget.maxId;
        }
        assert(this.id <= Widget.maxId);
    }

    getProperties(){
        return [ "id" ];
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

    // if(obj instanceof Widget || obj instanceof Vec2){
    //     return obj;
    // }

    if(Array.isArray(obj)){
        let v = obj.map(x => parseObject(x));
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
        try{

            obj[name] = parseObject(val);
        }
        catch(e){
            if(e instanceof MyError && e.message == "no-ref" && name == "bound" ){
                const ref_id = (val as any).ref;
                msg(`deffered bound:${ref_id} ${obj.id}`);
                Widget.defferedBound.push([obj.id, ref_id]);
            }
            else{
                throw e;
            }
        }
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
        return new ArcByRadius(obj);
    
    case Angle.name:
        return new Angle(obj);

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

    case SelectedShape.name:
        return new SelectedShape(obj);

    default:
        throw new MyError();
    }
}

export function saveJson(anchor : layout_ts.Anchor){
    const json = View.getJson();

    const blob = new Blob([json], { type: 'application/json' });

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

            loadData(obj);

            // viewEvent(obj);
        };
        reader.readAsText(file);        
        // uploadFile(f);
    }
}

export function loadData(obj : any){
    Plane.one.clear();

    Widget.maxId  = -1;
    Widget.refMap = new Map<number, any>();
    Widget.defferedBound = [];    

    const view = View.current;
    for(let [name, val] of Object.entries(obj)){
        if(name != "shapes"){
            (view as any)[name] = parseObject(val);
        }
    }

    view.shapes = [];
    const all_shapes : MathEntity[] = [];
    for(const shape_obj of obj.shapes){
        Widget.defferedCalc = [];

        Widget.isLoading = true;
        const shape = parseObject(shape_obj) as MathEntity;
        Widget.isLoading = false;

        view.shapes.push( shape );

        shape.getAllShapes(all_shapes);

        while(Widget.defferedBound.length != 0){
            const [obj_id, ref_id] = Widget.defferedBound.pop()!;
            const obj = all_shapes.find(x => x.id == obj_id);
            const ref = all_shapes.find(x => x.id == ref_id);
            if(obj instanceof Point && ref instanceof Shape){
                obj.bound = ref as (AbstractLine | CircleArc);
            }
            else{
    
                throw new MyError();
            }
        }

        Widget.defferedCalc.forEach(x => x.calc());

        const deffered_angles = all_shapes.filter(x => x instanceof Angle && x.intersection == undefined) as Angle[];
        for(const angle of deffered_angles){
            angle.intersection = getCommonPointOfLines(angle.lineA, angle.lineB)!;
            if(angle.intersection == undefined){

                throw new MyError();
            }
        }
    }

    const all_real_shapes = view.allRealShapes();

    all_real_shapes.filter(x => x.caption != undefined).forEach(x => x.caption!.parent = x);

    all_real_shapes.forEach(x => x.updateCaption());

    (view.shapes.filter(x => x instanceof TextBlock) as TextBlock[]).forEach(x => x.updateTextPosition());

    Plane.one.shapes_block.clear();
    view.shapes.forEach(x => addShapeList(x));
}

export function handleDragOver(evt: DragEvent) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer!.dropEffect = 'copy'; // Explicitly show this is a copy.
}


}