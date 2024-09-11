namespace planets {

export class Widget {
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

            this.id = Widget.maxId++;
        }
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
        // return new View(obj);

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

    // case Circle.name:
    //     return new Circle(obj);

    // case DimensionLine.name:
    //     return new DimensionLine(obj);

    // case Triangle.name:
    //     return new Triangle(obj);

    // case Midpoint.name:
    //     return new Midpoint(obj);

    // case Perpendicular.name:
    //     return new Perpendicular(obj);

    // case ParallelLine.name:
    //     return new ParallelLine(obj);

    // case Intersection.name:
    //     return new Intersection(obj);

    // case Arc.name:
    //     return new Arc(obj);

    // case Angle.name:
    //     return new Angle(obj);

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

export function saveJson(view : View){
    Widget.processed = new Set<number>();

    const data = view.toObj();
    const json = JSON.stringify(data, null, 4);

    const blob = new Blob([json], { type: 'application/json' });
     
    const anchor = $("blob") as HTMLAnchorElement;
     
      // a 要素の href 属性に Object URL をセット
      anchor.href = window.URL.createObjectURL(blob);
     
      // a 要素の download 属性にファイル名をセット
      anchor.download = 'test.json';
     
      // 疑似的に a 要素をクリックさせる
      anchor.click();

    msg(`save:${json}`);
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
            msg(`load: ${json}`);
            const obj = JSON.parse(json);

            Widget.maxId  = -1;
            Widget.refMap = new Map<number, any>()
            const view = parseObject(obj);

            if(!(view instanceof View)){
                throw new MyError();
            }

            // viewEvent(obj);
        };
        reader.readAsText(file);        
        // uploadFile(f);
    }
}

export function handleDragOver(evt: DragEvent) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer!.dropEffect = 'copy'; // Explicitly show this is a copy.
}


}