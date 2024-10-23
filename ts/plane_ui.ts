namespace plane_ts {
//
type Block = layout_ts.Block;
type Dialog = layout_ts.Dialog

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;
const $dialog = layout_ts.$dialog;
const $popup = layout_ts.$popup;
const $textarea = layout_ts.$textarea;
const $label = layout_ts.$label;
const $input_number = layout_ts.$input_number;

export let showAxis : HTMLInputElement;
export let showGrid : HTMLInputElement;
export let snapToGrid : HTMLInputElement;

const TT = i18n_ts.TT;

export class Plane {
    menu_block : Block;
    tool_block : Block;
    text_block : Block;
    canvas_block : Block;
    property_block : Block;
    shapes_block : Block;
    add_statement_dlg : Dialog;

    static one : Plane;

    constructor(){
        Plane.one = this;
        
        const k = document.location.href.lastIndexOf("/");
        homeURL = document.location.href.substring(0, k);
        msg(`home:${homeURL}`);
    
        const statement_menu = makeStatementMenu();
    
        const tool_buttons = makeToolButtons();
    
        this.add_statement_dlg = $dialog({
            width  : "400px",
            height : "300px",
            content : $grid({
                columns : "100% 100px",
                children : [
                    $textarea({
                        cols : 5,
                        rows : 5,
                        change : async (ev : Event)=>{
                            StatementTool.one.changeText(ev);
                        }
                    })
                    ,
                    $flex({
                        direction : "column",
                        children : [
                            $flex({
                                children : [
                                    $label({
                                        text : "interval"
                                    })
                                    ,
                                    $input_number({
                                        width : "30px",
                                        value : 0,
                                        step : 0.1,
                                        min  : 0,
                                        change : async (ev : Event)=>{
                                            StatementTool.one.changeInterval(ev);
                                        }
                                    })
                                ]
                            })
                            ,
                            $button({
                                id : "add-statement-play",
                                text : "play",
                                click : async (ev : MouseEvent)=>{
                                    this.add_statement_dlg.grid.updateLayout();
                                    StatementTool.one.play(i18n_ts.AbstractSpeech.one);
                                }
                            })
                            ,
                            $flex({
                                id : "add-statement-shapes",
                                direction : "column",
                                children : [

                                ]
                            })
                        ]
                    })
                ]
            })
            ,
            okClick : async (ev : MouseEvent)=>{
                StatementTool.one.finish()
            }
        });
    
        this.menu_block = $block({
            id : "menu-bar",
            children : [],
            backgroundColor : "lime",
        });
    
        this.tool_block = $flex({
            id : "tool-block",
            direction : "column",
            children : tool_buttons,
            backgroundColor : "green",
        });
    
        this.text_block = $block({
            id : "text-block",
            children : [
                $button({
                    width : "36px",
                    height : "36px",
                    url : `${homeURL}/lib/plane/img/text.png`,
                    click: async (ev:MouseEvent)=>{ 
                        msg("show add statement dlg"); 
                        this.add_statement_dlg.showModal(ev);
                    }
                })
                ,
                $button({
                    width : "36px",
                    height : "36px",
                    url : `${homeURL}/lib/plane/img/statement.png`,
                    click: async (ev:MouseEvent)=>{ 
                        msg("show statement menu"); 
                        statement_menu.show(ev);
                    }
                })
            ],
            aspectRatio : 1,
            backgroundColor : "blue",
        });
    
        this.canvas_block = $block({
            id : "canvas-div",
            children : [],
            aspectRatio : 1,
            backgroundColor : "orange",
        });
    
        this.property_block = $block({
            id : "property-div",
            children : [],
            backgroundColor : "cyan",
        });
    
        this.shapes_block = $flex({
            id : "shapes-block",
            width : "100%",
            children : [],
            backgroundColor : "chocolate",
        });            
    }
}


function makeCheckbox(div : HTMLElement, id : string, text : string) : HTMLInputElement {
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.id   = id;
    div.append(inp);

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = text;
    div.append(label);

    return inp;
}

export function makeMenuBar(span : HTMLSpanElement) : [HTMLButtonElement, HTMLAnchorElement]{
    showAxis   = makeCheckbox(span, "show-axis", "Axis");
    showGrid   = makeCheckbox(span, "show-grid", "Grid");
    snapToGrid = makeCheckbox(span, "snap-to-grid", "Snap to Grid");

    menuBarEvent();

    const save_btn = document.createElement("button");
    save_btn.textContent = "Save";
    span.append(save_btn);

    const anchor = document.createElement("a");
    anchor.id = "blob";
    span.append(anchor);

    return [save_btn, anchor];
}

export function makePropertyTable(div : HTMLElement){
    const table = document.createElement("table");
    table.id = "property-list";
    table.style.backgroundColor = "white";
    table.style.height = "min-content";

    div.append(table);
}

export function makeImageButtons(span : HTMLSpanElement, img_url : string, button_img_urls : string[]) 
    : [HTMLImageElement, HTMLDialogElement, HTMLImageElement[]] {
    const img = document.createElement("img");
    img.src = img_url;
    img.style.width  = "36px";
    img.style.height = "36px";

    span.append(img);

    const dlg = document.createElement("dialog");

    const imgs : HTMLImageElement[] = [];
    for(const url of button_img_urls){

        const img = document.createElement("img");
        img.src = url;
        img.style.width  = "36px";
        img.style.height = "36px";

        dlg.append(img);
        imgs.push(img);
    }

    span.append(dlg);

    return [img, dlg, imgs];
}

export function makeCanvas(div : HTMLElement) : HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.style.width  = "100%";
    canvas.style.height = "100%";
    canvas.style.backgroundColor = "bisque";

    div.append(canvas);

    return canvas;
}

export function makeCssClass(){
    const tex_style = document.createElement('style');
    tex_style.innerHTML = 
`.tex_div {
    position: absolute;
    display: inline-block;
    background-color: transparent;
    cursor: move;
    user-select: none;
}`;

    document.getElementsByTagName('head')[0].appendChild(tex_style);
}

export function fromXPixScale(pix : number) : number {
    return View.current.fromXPixScale(pix);
}

export function fromYPixScale(pix : number) : number {
    return View.current.fromYPixScale(pix);
}

export function toXPix(n : number) : number {
    return View.current.toXPix(n);
}

export function toYPix(n : number) : number {
    return View.current.toYPix(n);
}

export function toXPixScale(n : number) : number {
    return View.current.toXPixScale(n);
}

export function toYPixScale(n : number) : number {
    return View.current.toYPixScale(n);
}

export function drawLine(shape : Shape, p1 : Vec2, p2 : Vec2){
    View.current.canvas.drawLine(shape, p1, p2);
}

function makeStatementMenu() : layout_ts.PopupMenu {
    const statement_infos = getStatementInfos();

    const statement_menu = $popup({
        direction : "column",
        click : (idx:number, id? : string, value? : string)=>{
            const info = statement_infos[idx];
            msg(`statement:${info.text}`);
            Builder.tool = new StatementSelectorTool(info.text, info.selectors);
        }
        ,
        children : statement_infos.map(x => $button({ text : x.text}))
    });

    return statement_menu;
}

export function makeGrid(plane : Plane){
    const k = document.location.href.lastIndexOf("/");
    const home = document.location.href.substring(0, k);
    msg(`home:${home}`);

    const root = $grid({
        rows     : "25px 100% 25px",
        children:[
            $grid({
                children: [
                    plane.menu_block
                ]
            })
            ,
            $grid({
                columns  : "50px 50% 50% 300px",

                children : [
                    plane.tool_block
                    ,
                    plane.text_block
                    ,
                    plane.canvas_block
                    ,
                    plane.property_block
                ]
            })
            ,
            plane.shapes_block
        ]
    });

    return root;    
}


}