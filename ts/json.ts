namespace plane_ts {

export abstract class Widget {
    static refMap : Map<number, any> = new Map<number, any>();
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
        console.assert(o != undefined);
        return o;
    }

    if(obj.typeName == Vec2.name){
        return new Vec2(obj.x, obj.y);
    }

    for(let [name, val] of Object.entries(obj)){
        obj[name] = parseObject(val);
    }

    switch(obj.typeName){
    case TextBlock.name:
        return new TextBlock(obj);

    // case Speech.name:
    //     return new Speech(obj);

    case View.name:
        for(let [name, val] of Object.entries(obj)){
            (View.current as any)[name] = val;
        }
        return View.current;

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

    case LineSegment.name:
        return new LineSegment(obj);

    // case Rect.name:
    //     return new Rect(obj);

    case CircleByPoint.name:
        return new CircleByPoint(obj);

    case Ellipse.name:
        return new Ellipse(obj);

    case DimensionLine.name:
        return new DimensionLine(obj);
    
    // case Triangle.name:
    //     return new Triangle(obj);

    case Midpoint.name:
        return new Midpoint(obj);

    case FootOfPerpendicular.name:
        return new FootOfPerpendicular(obj);

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

    case Arc.name:
        return new Arc(obj);

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
    
    default:
        throw new MyError();
    }
}

export function saveJson(anchor : HTMLAnchorElement){
    const [name, json] = View.getJson();
    if(name == ""){
        return;
    }

    const blob = new Blob([json], { type: 'application/json' });
          
    // a 要素の href 属性に Object URL をセット
    anchor.href = window.URL.createObjectURL(blob);
    
    // a 要素の download 属性にファイル名をセット
    anchor.download = `${name}.json`;
    
    // 疑似的に a 要素をクリックさせる
    anchor.click();
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
    const tex_divs = Array.from($("canvas-div").getElementsByClassName("tex_div")) as HTMLDivElement[];
    tex_divs.forEach(x => x.remove());

    Widget.maxId  = -1;
    Widget.refMap = new Map<number, any>()
    const view = parseObject(obj) as View;
    if(!(view instanceof View)){
        throw new MyError();
    }

    view.allShapes().forEach(x => x.updateCaption());

    view.allShapes().filter(x => x instanceof Point || x instanceof DimensionLine).forEach(x => x.caption!.parent = x);
    (view.shapes.filter(x => x instanceof TextBlock) as TextBlock[]).forEach(x => x.updateTextPosition());
}

export function handleDragOver(evt: DragEvent) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer!.dropEffect = 'copy'; // Explicitly show this is a copy.
}


}