namespace plane_ts {
//
export let playBackOperations : Operation[] = [];

export abstract class Operation {
    maxId : number = NaN;
    shapesLength : number = 0;
    abstract toString() : string;

    dump() : string {
        return this.toString();
    }
}

export async function loadOperationsText(doc_text : string){
    // msg(`load Operations Text:\n${doc_text}`);
    const data = JSON.parse(doc_text);
    let lines : string[];

    if(data["version"] == 2.0){
        lines = data["operations"];
        assert(Array.isArray(lines) && (lines.length == 0 || typeof lines[1] == "string"));
    }
    else{
        msg(`data is empty.`);
        lines = [];
    }

    const view = View.current;
    view.clearView();

    const speech = new i18n_ts.DummySpeech();

    const operations : Operation[] = [];

    for(let line of lines){
        line = line.trim().replaceAll(/\s+/g, " ");        
        if(line == ""){
            continue;
        }

        let operation : Operation;

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

        case "tool":
            operation = new ToolSelection(items[1]);
            break;
        case "enum":
            operation = new EnumSelection(parseInt(items[1]));
            break;

        default:
            throw new MyError();
        }

        operations.push(operation);
    }

    Plane.one.playMode = PlayMode.fastForward;
    await playBack(speech, operations);
    Plane.one.playMode = PlayMode.stop;

    msg(`load Operations Text completes.`);
}

export function getOperationsText(){
    const data = {
        version : 2.0,
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


export async function playBack(speech : i18n_ts.AbstractSpeech, operations : Operation[]){
    View.isPlayBack = true;

    const view : View = View.current;

    let start_shape_idx = view.shapes.length;

    playBackOperations = operations.slice();

    while(playBackOperations.length != 0){
        const operation = playBackOperations.shift()!;
        // msg(`play back:${operation.dump()}`);
        view.addOperation(operation);
        if(operation instanceof ClickShape){
            let shape : Shape | undefined;
            if(! isNaN(operation.shapeId)){
                shape = idMap.get(operation.shapeId) as Shape;
                assert(shape instanceof Shape);
            }
            await Builder.tool.click(view, operation.position, shape);

            if(Builder.tool.done){
                Builder.tool.done = false;

                const shapes = view.shapes.slice(start_shape_idx);
                for(const shape of shapes){
                    shape.allShapes().forEach(x => x.show());

                    shape.setRelations();
            
                    if(shape.mute){
                        continue;
                    }
                    
                    if(shape instanceof Statement){
                        await shape.showReasonAndStatement(speech);
                    }
                    else if(shape instanceof Motion){
                        await shape.animate(speech);
                    }
                    else if(shape.narration != ""){
            
                        await speakAndHighlight(shape, speech, TTs(shape.narration));
                    }
                    else{
            
                        const root_reading = shape.reading();
                        if(root_reading.text == ""){
            
                        }
                        else if(root_reading.args.length == 0){
            
                            await speakAndHighlight(shape, speech, [root_reading.text]);
                        }            
                    }
                }

                start_shape_idx = view.shapes.length;
                await speech.waitEnd();
            }

            view.dirty = true;
        }
        else if(operation instanceof ToolSelection){
            Builder.setToolByName(operation.toolName);
        }
        else{
            throw new MyError();
        }
    }

    View.isPlayBack = false;
}

export async function playBackAll(speech? : i18n_ts.AbstractSpeech){
    if(speech == undefined){
        speech = new i18n_ts.DummySpeech();
    }

    const operations = View.current.operations.slice();
    View.current.clearView();
    await playBack(speech, operations);
}

}