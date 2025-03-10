namespace plane_ts {
//
export let playBackOperations : Operation[] = [];

export abstract class Operation {
    maxId : number = NaN;
    abstract toString() : string;

    dump() : string {
        return this.toString();
    }
}

function convertOperations(version : number, operations : Operation[]) : Operation[] {
    if(version == 2.0){

        const new_operations : Operation[] = [];
        let idx = 0;
        while(idx < operations.length){
            const operation = operations[idx];
            new_operations.push(operation);
        
            if(operation instanceof ToolSelection && [ "LengthEqualityBuilder", "AngleEqualityBuilder", "ParallelDetectorBuilder"].includes(operation.toolName)){
                assert(operations[idx + 3] instanceof EnumSelection);

                new_operations.push(operations[idx + 3]);
                new_operations.push(operations[idx + 1]);
                new_operations.push(operations[idx + 2]);

                idx += 4;
            }
            else if(operation instanceof ToolSelection && operation.toolName ==  "QuadrilateralClassifierBuilder"){
                assert(operations[idx + 5] instanceof EnumSelection && operations[idx + 6] instanceof EnumSelection);

                new_operations.push(operations[idx + 5]);
                new_operations.push(operations[idx + 6]);

                new_operations.push(operations[idx + 1]);
                new_operations.push(operations[idx + 2]);
                new_operations.push(operations[idx + 3]);
                new_operations.push(operations[idx + 4]);

                idx += 7;
            }
            else{
                idx++;
            }
        }
        return new_operations;
    }

    return operations;
}

export async function loadOperationsText(data : any){
    let lines : string[];

    if(2 <= data["version"]){
        lines = data["operations"];
        assert(Array.isArray(lines) && (lines.length == 0 || typeof lines[1] == "string"));
    }
    else{
        msg(`data is empty.`);
        lines = [];
    }

    const view = View.current;
    view.clearView();

    let operations : Operation[] = [];

    for(let line of lines){
        line = line.trim().replaceAll(/\s+/g, " ");        
        if(line == ""){
            continue;
        }

        let operation : Operation;

        // msg(`load:${line}`);
        const items = line.split(" ");
        switch(items[0]){
        case "click":{
                const x = parseFloat(items[1]);
                const y = parseFloat(items[2]);
                let shapeId = NaN;
                if(4 <= items.length){
                    shapeId = parseInt(items[3]);
                    assert(! isNaN(shapeId));
                }

                operation = new ClickShape(new Vec2(x, y), shapeId);
            }
            break;

        case "term":{
                const textBlock_id = parseInt(items[1]);
                let indexes : number[];
                if(items.length == 2){
                    indexes = [];
                }
                else{
                    indexes = items[2].split(":").map(x => parseInt(x));
                }
                operation = new ClickTerm(textBlock_id, indexes);
            }
            break;

        case "tool":
            operation = new ToolSelection(items[1]);
            break;

        case "finish":
            operation = new ToolFinish(items[1]);
            break;
            
        case "enum":{
                const enum_id = parseInt(items[1]);
                operation = new EnumSelection(enum_id);
            }
            break;

        case "text":{
                const regex = /text\s+'?([^']+)'?/;
                const matches = line.match(regex);
                assert(matches != null);

                const items2 = Array.from(matches!);
                msg(`text len:${items2.length} [${items2[1]}]`)

                const text = items2[1];
                operation = new TextPrompt(text);
            }
            break;

        case "property":{
                const regex = /property\s+(\d+)\s+([0-9a-zA-Z_]+)\s+'?([^']+)'?/;
                const matches = line.match(regex);
                assert(matches != null);

                const items2 = Array.from(matches!);
                assert(items2.length == 4);

                const [id, name, value_str] = items2.slice(1);
                let value : string | number;

                if(line.endsWith("'")){
                    value = value_str;
                }
                else{
                    value = parseFloat(value_str);
                }
                operation = new PropertySetting(parseInt(id), name, value);
            }
            break;

        default:
            throw new MyError();
        }

        operations.push(operation);
    }

    operations = convertOperations(data["version"], operations);

    await playBack(PlayMode.fastForward, operations);

    for(const [i, o] of operations.entries()){
        // msg(`load ${i}:${o.dump()}`);
    }

    msg(`load Operations Text completes.`);
}

export function getOperationsText(){
    const data = {
        version : 2.1,
        operations : View.current.operations.map(x => x.toString())
    };

    const doc_text = JSON.stringify(data, null, 4);
    msg(`operations-text : \n${doc_text}\n`);
    
    return doc_text;
}

export class ClickShape extends Operation {
    position : Vec2;
    shapeId : number;
    createdPoint? : Point;

    constructor(position : Vec2, shapeId : number){
        super();
        this.position = position;
        this.shapeId    = shapeId;
    }

    toString() : string {
        let shape_str = "";

        if(! isNaN(this.shapeId)){
            const shape = idMap.get(this.shapeId) as Shape;
            assert(shape instanceof Shape);
            shape_str = `${this.shapeId} ${shape.constructor.name}`;
        }

        const fnc = (n:number)=>(10 < Math.abs(n) ? n.toFixed(1) : n.toFixed(2));

        const x = fnc(this.position.x);
        const y = fnc(this.position.y);

        return `click ${x} ${y} ${shape_str}`;
    }

    dump() : string {
        if(this.createdPoint == undefined){
            return this.toString();
        }
        else{
            return this.toString() + `point:${this.createdPoint.id} ${this.createdPoint.position}`;
        }
    }
}

export class ClickTerm extends Operation {
    textBlock_id : number;
    indexes : number[];

    constructor(textBlock_id : number, indexes : number[]){
        super();
        this.textBlock_id = textBlock_id;
        this.indexes = indexes.slice();
    }

    getTerm() : Term {
        const textBlock = View.current.allShapes().find(x => x.id == this.textBlock_id) as TextBlock;
        if(!(textBlock instanceof TextBlock) || textBlock.app == undefined){
            throw new MyError();
        }

        const path = new parser_ts.Path(this.indexes);
        const term  = path.getTerm(textBlock.app);

        return term;
    }

    toString() : string {
        if(this.indexes.length == 0){
            msg(`no indexes:term ${this.textBlock_id}`);
        }
        return `term ${this.textBlock_id}  ${this.indexes.join(":")}`;
    }
}

export class ToolSelection extends Operation {
    toolName : string;

    constructor(tool_name : string){
        super();
        this.toolName = tool_name;
    }

    toString() : string {
        return `tool  ${this.toolName}`;
    }
}

export class ToolFinish extends Operation {
    toolName : string;

    constructor(tool_name : string){
        super();
        this.toolName = tool_name;
    }

    toString() : string {
        return `finish  ${this.toolName}`;
    }
}

export class EnumSelection extends Operation {
    value     : number;

    constructor(value : number){
        super();
        this.value = value;
    }

    toString() : string {
        return `enum  ${this.value}`;
    }
}

export function inputTextPrompt(message : string) : string | null {
    let text : string | null;

    if(View.isPlayBack){

        const operation = playBackOperations.shift()!;
        View.current.addOperation(operation);
        if(operation instanceof TextPrompt){
            text = operation.text;
        }
        else{
            throw new MyError();
        }
    }
    else{

        text = prompt(message);
        if(text != null){
            View.current.addOperation(new TextPrompt(text.trim()));
        }
    }
    
    return text;
}

export class TextPrompt extends Operation {
    text : string;

    constructor(text : string){
        super();
        this.text = text;
    }

    toString() : string {
        return `text  '${this.text}'`;
    }
}

export class PropertySetting extends Operation {
    id    : number;
    name  : string;
    value : string | number;

    constructor(id : number, name : string, value : string | number){
        super();
        this.id    = id;
        this.name  = name;
        this.value = value;
    }

    toString() : string {
        if(typeof this.value == "string"){

            return `property ${this.id} ${this.name} '${this.value}'`;
        }
        else{

            return `property ${this.id} ${this.name} ${this.value}`;
        }
    }
}

export async function speakAndHighlight(shape : MathEntity, speech : i18n_ts.AbstractSpeech, lines : string[]){
    await speech.speak(lines.shift()!.trim());

    for(const dep of shape.dependencies()){
        
        dep.setMode(Mode.depend);

        if(Plane.one.playMode == PlayMode.normal){
            await sleep(0.5 * 1000 * shape.interval);
        }
    }


    shape.setMode(Mode.target);

    while(lines.length != 0){
        const line = lines.shift()!.trim();
        if(line != ""){
            await speech.waitEnd();
            await speech.speak(line);
        }
    }

    if(Plane.one.playMode == PlayMode.normal){
        await sleep(1000 * shape.interval);
    }
}


export async function playBack(play_mode : PlayMode, operations : Operation[]){
    Plane.one.playMode = play_mode;
    View.isPlayBack = true;

    const speech = (play_mode == PlayMode.fastForward ? new i18n_ts.DummySpeech() : makeSpeechFnc());

    const view : View = View.current;
    view.restoreView();
    view.clearView();

    let start_shape_idx = view.shapes.length;

    playBackOperations = operations.slice();

    let all_shapes : MathEntity[] = [];
    const named_all_shape_map = new Map<string, plane_ts.Shape>();

    while(playBackOperations.length != 0){
        while(playBackOperations[0] instanceof EnumSelection){
            msg(`wait for show menu`);
            await sleep(100);
        }

        const operation = playBackOperations.shift()!;
        view.addOperation(operation);
        if(operation instanceof ClickShape){
            await movePointer(operation.position);
            let shape : Shape | undefined;
            if(! isNaN(operation.shapeId)){
                shape = idMap.get(operation.shapeId) as Shape;
                if(shape instanceof TextBlock){
                    shape = undefined;
                }
                else{
                    assert(shape instanceof Shape);
                }
            }
            await Builder.tool.click(view, operation.position, shape);
        }
        else if(operation instanceof ClickTerm){
            if(Builder.tool instanceof ExprTransformBuilder){
                const term = operation.getTerm();
                await Builder.tool.termClick(term);
            }
            else{
                throw new MyError();
            }
        }
        else if(operation instanceof ToolSelection){
            await moveToolSelectionPointer(operation);
            await Builder.setToolByName(operation.toolName, false);
        }
        else if(operation instanceof ToolFinish){
            assert(Builder.toolName == operation.toolName);
            await Builder.tool.finish(view);
        }
        else if(operation instanceof PropertySetting){
            const shape = view.allShapes().find(x => x.id == operation.id)!;
            assert(shape != undefined);
            setProperty(shape, operation.name, operation.value);
        }
        else{
            throw new MyError();
        }

        if(Builder.tool.done){
            Builder.tool.done = false;

            const shapes = view.shapes.slice(start_shape_idx);
            for(const shape of shapes){
                let sub_shapes : Shape[] = [];
                shape.getAllShapes(sub_shapes);
                sub_shapes = unique(sub_shapes);

                sub_shapes.forEach(x => x.show());
                all_shapes = unique(all_shapes.concat(sub_shapes));

                const named_sub_shapes = sub_shapes.filter(x => x instanceof Shape && x.name != "") as Shape[];
                named_sub_shapes.forEach(x => named_all_shape_map.set(x.name, x));
        
                // shape.allShapes().forEach(x => x.show());

                shape.setRelations();
        
                if(shape.mute){
                    continue;
                }

                await playShape(speech, all_shapes, named_all_shape_map, shape);
            }

            start_shape_idx = view.shapes.length;
            await speech.waitEnd();
        }

        view.dirty = true;
    }

    view.restoreView();

    all_shapes.forEach(x => {x.show(); x.setMode(Mode.none); });

    view.dirty = true;
    view.updateShapes();

    Plane.one.playMode = PlayMode.stop;
    View.isPlayBack = false;
}

export async function playBackAll(play_mode : PlayMode){
    const operations = View.current.operations.slice();
    View.current.clearView();
    await playBack(play_mode, operations);
}

}