namespace plane_ts {
//
export class Operation {
}

export class ClickShape extends Operation {
    position : Vec2;
    shape : Shape | undefined;

    constructor(position : Vec2, shape : Shape | undefined){
        super();
        this.position = position;
        this.shape    = shape;
    }
}

export class ToolSelection extends Operation {
    toolName : string;

    constructor(tool_name : string){
        super();
        this.toolName = tool_name;
    }
}

export class EnumSelection extends Operation {
    value     : number;

    constructor(value : number){
        super();
        this.value = value;
    }
}

export async function speakAndHighlight(shape : MathEntity, speech : i18n_ts.AbstractSpeech, lines : string[]){
    await speech.speak(lines.shift()!.trim());

    for(const dep of shape.dependencies()){
        if(dep instanceof SelectedShape){
            View.current.attentionShapes.push(dep);
        }
        
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


export async function playBack(speech : i18n_ts.AbstractSpeech){
    View.isPlayBack = true;

    const view : View = View.current;

    view.clearView();

    let start_shape_idx = 0;

    const operations = view.operations.slice();

    while(view.operations.length != 0){
        const operation = view.operations.shift()!;
        if(operation instanceof ClickShape){
            await Builder.tool.click(view, operation.position, operation.shape);

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
    }

    view.operations = operations;

    View.isPlayBack = false;
}

}