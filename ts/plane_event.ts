namespace plane_ts {
//
type Block = layout_ts.Block;

export let urlOrigin : string;

export class TextBlockEvent {
    startTerm : Term | undefined;
    term : Term | undefined;
    textBlock : TextBlock | undefined;
    downTime : number = NaN;

    setTextBlockEvent(textBlock : TextBlock){
        textBlock.div.addEventListener("pointerdown", (ev : PointerEvent)=>{
            if(this.textBlock != textBlock){

                this.textBlock = textBlock;
            }

            if(textBlock.getEquation() == undefined){
                msg(`pointer-down:no app`);
                return;
            }

            this.term = getTermFromPointerEvent(ev, textBlock.getEquation()!);
            if(this.term == undefined){

                msg(`pointer-down: no term`);
            }
            else{

                this.downTime = Date.now();
                msg(`pointer-down:${this.term.str()}`);
            }
        });

        textBlock.div.addEventListener("pointerup", (ev : PointerEvent)=>{
            if(this.term != undefined && this.textBlock == textBlock){
                const elapsed_time = Date.now() - this.downTime;
                msg(`pointer-up:${elapsed_time} ${this.term.str()}`);

                if(this.startTerm == this.term){
                    this.startTerm = undefined;
                }

                this.term.colorName = (elapsed_time < 500 ? "blue" : "red");
                const root = this.term.getRoot();

                if(elapsed_time < 500){

                    if(this.startTerm != undefined){
                        const parent = this.startTerm.parent as App;
                        if(parent != null && this.term.parent == parent && (parent.isAdd() || parent.isMul())){
                            let idx1 = this.startTerm.argIdx();
                            let idx2 = this.term.argIdx();
                            if(idx2 < idx1){
                                [idx1, idx2] = [idx2, idx1];
                            }

                            const args = parent.args.slice(idx1, idx2 + 1);
                            const app = new App(operator(parent.fncName), args);
                            app.colorName = "red";
                            parent.args.splice(idx1, (idx2 + 1 - idx1));
                            parent.insArg(app, idx1);

                            this.term = app;
                        }
                    }
                }
                else{

                    this.startTerm = this.term;
                    this.term = undefined;
                }

                renderKatexSub(this.textBlock.div, root.tex());
            }
        });

        textBlock.div.addEventListener("contextmenu", (ev : MouseEvent)=>{
            msg("text-Block-context-menu");
            ev.stopPropagation();
            ev.preventDefault();
        });
    }

    async keyDown(ev : KeyboardEvent){
        if(this.term == undefined || this.textBlock == undefined){
            return;
        }
        const div = this.textBlock.div;

        if (ev.key === "Escape"){
            const root = this.term.getRoot();
            root.allTerms().forEach(x => x.colorName = undefined);
            renderKatexSub(div, root.tex());

            this.startTerm = undefined;
            this.term = undefined;
            this.textBlock = undefined;
            return;
        }

        const parent = this.term.parent;
        if(parent != null && (parent.isAdd() || parent.isMul())){
            msg(`key-down:${ev.key}`);

            let diff : number;
            if(ev.key == "ArrowRight"){
                diff = 1;
            }
            else if(ev.key == "ArrowLeft"){
                diff = -1;
            }
            else{
                return;
            }

            const new_idx = this.term.argIdx() + diff;
            const root = this.term.getRoot();
            if(new_idx == -1){
                if(parent.isAdd() && parent.parent != null && parent.parent.isEq() && 0 < parent.argIdx()){
                    await algebra_ts.transpose(root, this.term, div, new Speech(), true, false);
                    renderKatexSub(div, root.tex());
                }
            }
            else if(new_idx < parent.args.length){

                this.term.argShift(diff);
                renderKatexSub(div, root.tex());
            }
            else if(new_idx == parent.args.length){
                if(parent.isAdd() && parent.parent != null && parent.parent.isEq() && parent.argIdx() == 0){
                    await algebra_ts.transpose(root, this.term, div, new Speech(), false, false);
                    renderKatexSub(div, root.tex());
                }
            }
            else{
                msg("can not move.");
            }
        }
    }
}

export const textBlockEvent = new TextBlockEvent();

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

        await textBlockEvent.keyDown(ev);

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
    });    

    window.addEventListener("resize", view.resizeView.bind(view));

    // Passive event listeners
    // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
    view.board.addEventListener("wheel"      , view.wheel.bind(view), {"passive" : false } );

    dropEvent(view);
    
    window.requestAnimationFrame(view.drawShapes.bind(view));
}

function getTermFromPointerEvent(ev : PointerEvent, app : App) : Term | undefined {
    const terms = app.allTerms();

    let ele : HTMLElement | null = ev.target as HTMLElement;
    for(; ele != null; ele = ele.parentElement){
        if(ele.id.startsWith("tex-term-")){

            const id_offset = "tex-term-".length;
            const id = parseInt(ele.id.substring(id_offset));
            const term = terms.find(x => x.id == id)!;
            if(term == undefined){
                msg(`get-Term-From-Pointer-Event:no term id:[${id}]`)
                return undefined;
            }

            return term;
        }
    }

    throw new MyError();
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
