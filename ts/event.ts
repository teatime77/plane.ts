namespace plane_ts {
//

export let  upperLatinLetters : string;
export let  lowerLatinLetters : string;

export let  upperGreekLetters : string;
export let  lowerGreekLetters : string;

let selectedToolButton : HTMLButtonElement;

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

export function initPlane(menu_div : HTMLElement, tool_div : HTMLElement, canvas_div : HTMLElement, property_div : HTMLElement){
    initLetters();
    makeCssClass();

    const buttons = makeToolBox(tool_div);
    toolBoxEvent(buttons);

    const canvas = makeCanvas(canvas_div);

    makePropertyTable(property_div);
    const [save_btn, anchor] = makeMenuBar(menu_div);

    const view = new View(canvas);

    viewEvent(view);

    saveEvent(view, save_btn, anchor);

    Builder.tool = new SelectionTool();

}

export function bodyOnLoad(){
    initPlane($div("menu-bar"), $div("shape-tool"), $div("canvas-div"), $div("property-div"));
}

function selectButton(button : HTMLButtonElement){
    selectedToolButton = button;
    button.style.margin      = "1px";
    button.style.borderWidth = "2px";
}

export function toolBoxEvent(buttons : HTMLButtonElement[]){
    selectButton(buttons[0]);

    for(const button of buttons){
        button.addEventListener("click", (ev : MouseEvent)=>{
            selectedToolButton.style.margin      = "2px";
            selectedToolButton.style.borderWidth = "1px";

            selectButton(button);                    

            msg(`tool:${button.value}`);
            Builder.changeTool(button.value);
        });
    };
}

export function menuBarEvent(){
    showAxis.addEventListener("change", (ev : Event)=>{
        View.current.dirty = true;
    });

    showGrid.addEventListener("change", (ev : Event)=>{
        View.current.dirty = true;
    });
}

export function saveEvent(view : View, save_btn : HTMLButtonElement, anchor : HTMLAnchorElement){
    save_btn.addEventListener("click", (ev : MouseEvent)=>{
        saveJson(anchor);
    });
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
    caption.div.addEventListener("click", (ev : MouseEvent)=>{
        showProperty(caption, 0);
    });

    caption.div.addEventListener("dblclick", (ev : MouseEvent)=>{
        caption.div.contentEditable = "true";
        caption.div.style.cursor = "text";
        caption.div.focus();

    });

    caption.div.addEventListener("blur", (ev : FocusEvent)=>{
        caption.div.contentEditable = "false";
        caption.div.style.cursor = "move";
        caption.text = caption.div.innerText;

        const text_area = document.getElementById("text-block-text-area") as HTMLTextAreaElement;
        if(text_area != null){
            text_area.value = caption.text;
        }
    });
}

export function PropertyEvent(property : InputProperty | TextAreaProperty){
    if(property instanceof InputProperty){

        property.input.addEventListener("change", property.valueChanged.bind(property));
    }
    else{

        property.textArea.addEventListener("input", property.valueChanged.bind(property));
    }
}

export function deleteShapeEvent(shape : AbstractShape, button : HTMLButtonElement){
    button.addEventListener("click", (ev : MouseEvent)=>{
        const ok = confirm("Are you sure to delete this shape?");
        if(ok){
            remove(View.current.shapes, shape);
            shape.delete(new Set<number>());
            View.current.dirty = true;
        }
    });
}


}
