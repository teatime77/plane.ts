namespace planets {
//

export let  upperLatinLetters : string;
export let  lowerLatinLetters : string;

export let  upperGreekLetters : string;
export let  lowerGreekLetters : string;

function initLetters(){
    const A = "A".charCodeAt(0);
    const a = "a".charCodeAt(0);

    const Alpha = "Α".charCodeAt(0);
    const alpha = "α".charCodeAt(0);


    upperLatinLetters = range(26).map(i => String.fromCharCode(A + i)).join("");
    lowerLatinLetters = range(26).map(i => String.fromCharCode(a + i)).join("");

    upperGreekLetters = range(24).filter(i => i != 17).map(i => String.fromCharCode(Alpha + i)).join("");
    lowerGreekLetters = range(24).filter(i => i != 17).map(i => String.fromCharCode(alpha + i)).join("");

    msg(upperLatinLetters);
    msg(lowerLatinLetters);
    msg(upperGreekLetters);
    msg(lowerGreekLetters);
}

export function bodyOnLoad(){
    initLetters();

    const view = new View({ scale : 100, shapes : []});

    viewEvent(view);

    Builder.tool = new SelectTool();

    const tool_type_radios = Array.from(document.getElementsByName("tool-type")) as HTMLInputElement[];
    for(const radio of tool_type_radios){
        radio.addEventListener("change", (event : Event)=>{
            msg(`tool:${radio.value}`);
            Builder.changeTool(radio.value);
        })
    };
}

export function viewEvent(view : View){
    view.board.addEventListener("pointerdown", view.pointerdown.bind(view));
    view.board.addEventListener('pointermove', view.pointermove.bind(view));
    view.board.addEventListener("pointerup"  , view.pointerup.bind(view));   
    view.board.addEventListener("click"      , view.click.bind(view));   

    window.addEventListener("resize", view.resize.bind(view));

    // Passive event listeners
    // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
    view.board.addEventListener("wheel"      , view.wheel.bind(view), {"passive" : false } );

    $("save").addEventListener("click", (ev : MouseEvent)=>{
        saveJson(view);
    }
    );

    dropEvent(view);
    
    window.requestAnimationFrame(view.drawShapes.bind(view));
}

function dropEvent(view : View){
    view.board.addEventListener('dragover', handleDragOver, false);
    view.board.addEventListener('drop', handleFileSelect, false);

}

export function setCaptionEvent(caption : TextBlock){
    caption.div.addEventListener("pointerdown", caption.captionPointerdown.bind(caption));
    caption.div.addEventListener("pointermove", caption.captionPointermove.bind(caption));
    caption.div.addEventListener("pointerup", caption.captionPointerup.bind(caption));

}

export function PropertyEvent(property : Property){
    property.input.addEventListener("change", property.valueChanged.bind(property));
}


}
