namespace plane_ts {
//
type Block = layout_ts.Block;


export function initPlane(plane : Plane, root : layout_ts.Grid){
    makeCssClass();

    plane.tool_block.onChange = (ui : layout_ts.UI)=>{
        const button = ui as layout_ts.RadioButton;
        Builder.tool = makeToolByType(button.button.value);
    }

    const canvas = makeCanvas(plane.canvas_block.div);

    makePropertyTable(plane.property_block.div);
    const [save_btn, anchor] = makeMenuBar(plane.menu_block.html());

    const view = new View(canvas);

    viewEvent(view);

    saveEvent(view, save_btn, anchor);

    Builder.tool = new SelectionTool();

}

export function bodyOnLoad(){
    i18n_ts.initI18n();

    const plane = new Plane();
    const root = makeGrid(plane);
    layout_ts.initLayout(root);
    
    initPlane(plane, root);
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

export function PropertyEvent(property : InputProperty | TextAreaProperty | AngleMarkProperty){
    if(property instanceof InputProperty){

        property.input.addEventListener("change", property.valueChanged.bind(property));
    }
    else if(property instanceof AngleMarkProperty){

        property.img.addEventListener("click", (ev:MouseEvent)=>{
            property.dlg.showModal();
        });

        for(const [idx, button] of property.imgButtons.entries()){
            button.addEventListener("click", (ev : MouseEvent)=>{
                property.imgButtonClick(idx);
            })
        }
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
