namespace planets {
//
export function bodyOnLoad(){
    const canvas = $("canvas") as HTMLCanvasElement;
    const view = new View(canvas);


    viewEvent(view);

    const tool_type_radios = Array.from(document.getElementsByName("tool-type")) as HTMLInputElement[];
    for(const radio of tool_type_radios){
        radio.addEventListener("change", (ev : Event)=>{
            msg(`tool:${radio.value}`);
            Builder.changeTool(radio.value);
        })
    };
    
    window.requestAnimationFrame(view.drawShapes.bind(view));
}

function viewEvent(view : View){
    view.canvas.addEventListener("pointerdown", view.pointerdown.bind(view));
    view.canvas.addEventListener('pointermove', view.pointermove.bind(view));
    view.canvas.addEventListener("pointerup"  , view.pointerup.bind(view));   
    view.canvas.addEventListener("click"      , view.click.bind(view));   

    // Passive event listeners
    // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
    view.canvas.addEventListener("wheel"      , view.wheel.bind(view), {"passive" : true } );
}



}
