namespace plane_ts {
//
type Block = layout_ts.Block;

export let urlOrigin : string;

export async function initPlane(plane : Plane, root : layout_ts.Grid){
    initPlay();
    makeCssClass();

    plane.tool_block.onChange = async (ui : layout_ts.UI)=>{
        const button = ui as layout_ts.RadioButton;

        const tool_name = button.button.value;
        await Builder.setToolByName(tool_name, true);
    }

    const canvas = makeCanvas(plane.canvas_block.div);

    const view = new View(canvas);

    viewEvent(view);

    await Builder.setToolByName(SelectionTool.name, false);

    await makeSelectionDlg();
}

export function viewEvent(view : View){
    view.board.addEventListener("pointerdown", view.pointerdown.bind(view));
    view.board.addEventListener('pointermove', view.pointermove.bind(view));
    view.board.addEventListener("pointerup"  , view.pointerup.bind(view));   
    view.board.addEventListener("click"      , async (ev : MouseEvent)=>{
        await view.click(ev);
    }); 

    view.board.addEventListener("dblclick"   , async (ev : MouseEvent)=>{
        await view.dblclick(ev);
    });

    view.board.addEventListener("contextmenu", async (ev : MouseEvent)=>{
        msg("contextmenu");
        ev.stopPropagation();
        ev.preventDefault();

        const position = view.eventPosition(ev);
        const shape = view.getShape(position);
        if(shape != undefined){
            await showPropertyDlg(shape, undefined);
        }
    })

    document.addEventListener('keydown', async (ev : KeyboardEvent) => {
        if(View.isPlayBack){
            return;
        }

        if (ev.key === "Escape") {
            msg("Escape key pressed!");
            const closed = layout_ts.closeDlg();
            if(closed){
                return;
            }
            
            await Builder.builderResetTool(view);
        }
        else if(ev.key == "Enter"){
            if(Builder.tool instanceof ShapeEquationBuilder || Builder.tool instanceof ExprTransformBuilder){

                view.addOperation(new ToolFinish(Builder.toolName));
                await Builder.tool.finish(view);
            }
        }
        else{
            await Builder.tool.keyDown(ev);
        }
    });    

    window.addEventListener("resize", view.resizeView.bind(view));

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

export function deleteShapeEvent(shape : MathEntity, button : HTMLButtonElement){
    button.addEventListener("click", (ev : MouseEvent)=>{
        const ok = confirm("Are you sure to delete this shape?");
        if(ok){
            const idx = View.current.shapes.indexOf(shape);
            if(idx == -1){
                throw new MyError();
            }
            const button = Plane.one.shapes_block.children[idx];
            Plane.one.shapes_block.removeChild(button);

            remove(View.current.shapes, shape);
            shape.delete(new Set<number>());
            View.current.dirty = true;
        }
    });
}


}
