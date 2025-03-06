namespace plane_ts {
//
export let makeSpeechFnc : () => i18n_ts.AbstractSpeech;

export function removeDiv(){
    for(const class_name of [ "tex_div", "selectable_tex" ]){
        const tex_divs = Array.from(document.body.getElementsByClassName(class_name)) as HTMLDivElement[];
        tex_divs.forEach(x => x.remove());    
    }
}

async function generateTex(shape : TextBlock | Statement, speech : i18n_ts.AbstractSpeech, named_all_shape_map : Map<string, plane_ts.Shape>) {
    let text : string;
    let div  : HTMLDivElement;

    if(shape instanceof TextBlock){
        text = shape.text;
        div  = shape.div;
    }
    else{

        text = shape.mathText;
        if(shape.latexBox == undefined){
            shape.latexBox = shape.makeTexUI();
        }

        div  = shape.latexBox.div;
    }
    try{

        const term = parser_ts.parseMath(text);

        await parser_ts.showFlow(speech, term, div, named_all_shape_map);

    }
    catch(e){
        if(e instanceof parser_ts.SyntaxError){
            return;
        }

        throw e;
    }
}

export async function playShape(speech : i18n_ts.AbstractSpeech, all_shapes : MathEntity[], named_all_shape_map : Map<string, plane_ts.Shape>, shape : MathEntity){
    plane_ts.showProperty(shape, 0);

    let highlighted = new Set<Reading>();

    if(shape instanceof plane_ts.ExprTransform){
        await shape.speakExprTransform(speech);
    }
    else if(shape instanceof Statement){
        await shape.showReasonAndStatement(speech);
    }
    else if(shape instanceof Motion){
        await shape.animate(speech);
    }
    else{

        const root_reading = shape.reading();
        if(root_reading.text == ""){

        }
        else if(root_reading.args.length == 0){

            await speakAndHighlight(shape, speech, [root_reading.text]);
        }
        else{

            const text = root_reading.prepareReading();

            const readings = root_reading.getAllReadings();

            msg(`reading:${shape.constructor.name} ${text}`);
            msg("    " + readings.map(x => `[${x.start}->${x.end}:${x.text}]`).join(" "));

            speech.callback = (idx : number)=>{
                for(const reading of readings){
                    if(reading.start <= idx){

                        if(!highlighted.has(reading)){
                            msg(`hilight: start:${reading.start} ${reading.text}`);
                            reading.readable.highlight(true);
                            highlighted.add(reading);
                        }
                    }
                }
            }

            if(text != ""){
                await speech.speak(TT(text));
            }                
        }
    }

    await speech.waitEnd();

    Array.from(highlighted.values()).forEach(x => x.readable.highlight(false));
    speech.callback = undefined;

    if(shape instanceof ShapeEquation || shape instanceof ExprTransform){
        const [node, text] = parser_ts.makeNodeTextByApp(shape.equation);

        let text_block : TextBlock;
        if(shape instanceof ShapeEquation){
            text_block = shape.selectedShapes[0] as TextBlock;
        }
        else{
            text_block = shape.textBlock;
        }

        const div_child = text_block.div.children[0] as HTMLElement;

        /*
            const id = setInterval(()=>{
                speech.prevCharIndex++;
                if(text.length < speech.prevCharIndex){
                    clearInterval(id);
                }
            }, 100);
        */
        if(i18n_ts.isEdge){

            await parser_ts.showFlow(speech, shape.equation, text_block.div, named_all_shape_map);
        }
        else{

            div_child.style.backgroundColor = "blue";
            await speech.speak(text);
        }

        await speech.waitEnd();                
        div_child.style.backgroundColor = "";
    }
    else if(shape instanceof TextBlock && shape.isTex || shape instanceof Statement && shape.mathText != ""){

        await generateTex(shape, speech, named_all_shape_map);
    }

    all_shapes.forEach(x => {x.setMode(Mode.none); });
}
}