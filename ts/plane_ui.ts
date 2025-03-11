namespace plane_ts {
//
type Block = layout_ts.Block;

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;
const $popup = layout_ts.$popup;
const $textarea = layout_ts.$textarea;
const $label = layout_ts.$label;
const $input_number = layout_ts.$input_number;
type CheckBox = layout_ts.CheckBox;
const $checkbox = layout_ts.$checkbox;

export enum PlayMode {
    stop,
    normal,
    fastForward,
}

export class Plane {
    menu_block : Block;
    tool_block : Block;
    text_block : Block;
    canvas_block : Block;
    property_block : Block;
    shapes_block : Block;
    narration_box : layout_ts.TextBox;
    editMode : boolean;

    show_axis! : CheckBox;
    show_grid! : CheckBox;
    snap_to_grid! : CheckBox;

    playMode : PlayMode = PlayMode.stop;

    static one : Plane;

    constructor(){
        Plane.one = this;
        
        let params : Map<string, string>;

        [ urlOrigin, , params] = i18n_ts.parseURL();
        this.editMode = (params.get("mode") == "edit");
        
        const tool_buttons = makeToolButtons();
        
        Plane.one.show_axis = $checkbox({
            text : "Axis",
            change : async (ev : Event)=>{
                View.current.dirty = true;
            }
        });

        Plane.one.show_grid = $checkbox({
            text : "Grid",
            change : async (ev : Event)=>{
                View.current.dirty = true;                
            }
        });

        Plane.one.snap_to_grid = $checkbox({
            text : "Snap to Grid",
        });

        const save_anchor = layout_ts.$anchor({
        });
        
        this.menu_block = $flex({
            children : [
                Plane.one.show_axis
                ,
                Plane.one.show_grid
                ,
                Plane.one.snap_to_grid
                ,
                $button({
                    width : "24px",
                    height : "24px",
                    url : `${urlOrigin}/lib/plane/img/undo.png`,
                    click : async(ev : MouseEvent)=>{
                        await View.current.undo();
                    }
                })
                ,
                $button({
                    width : "24px",
                    height : "24px",
                    url : `${urlOrigin}/lib/plane/img/redo.png`,
                    click : async(ev : MouseEvent)=>{
                        await View.current.redo();
                    }
                })
                ,
                $button({
                    text : "Save",
                    click : async(ev : MouseEvent)=>{
                        saveJson(save_anchor);
                    }
                })
                ,
                save_anchor
            ],
        });
    
        this.tool_block = $grid({
            id : "tool-block",
            columns  : "36px 36px",
            children : tool_buttons,
        });
    
        this.text_block = $flex({
            id : "text-block",
            children : [],
        });
    
        this.canvas_block = $block({
            children : [],
            color : fgColor,
            // backgroundColor : "cornsilk"
        });
    
        this.property_block = $block({
            id : "property-div",
            children : [],
        });
    
        this.shapes_block = $flex({
            id : "shapes-block",
            direction : "column",
            children : [],
        });       
        
        this.narration_box = layout_ts.$textbox({
            id : "narration-box",
            text : "",
            color : fgColor,
            padding : 20,
            textAlign : "center",
            fontSize : "48px",
        });this.text_block.div.style.color
    }

    clearPlane(){
        // for(const class_name of ["tex_div"]){
        //     const tex_divs = Array.from(this.canvas_block.div.getElementsByClassName(class_name)) as HTMLDivElement[];
        //     tex_divs.forEach(x => x.remove());
        // }
    
        this.text_block.div.innerHTML = "";
        this.narration_box.div.innerHTML = "";
    }
}

export function makePropertyTable(div : HTMLElement){
    const table = document.createElement("table");
    table.id = "property-list";
    table.style.color = fgColor;
    table.style.backgroundColor = bgColor;
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
    canvas.id = "main-canvas";
    canvas.style.width  = "100%";
    canvas.style.height = "100%";

    div.append(canvas);

    return canvas;
}

export function makeCssClass(){
    const styles = [
`.tex_div {
    position: absolute;
    display: inline-block;
    background-color: transparent;
    cursor: move;
    user-select: none;
}`
    ,
`.selectable_tex {
    position: absolute;
    display: inline-block;
    background-color: transparent;
    cursor: pointer;
    user-select: none;
}`
    ];

    for(const style of styles){
        const tex_style = document.createElement('style');
        tex_style.innerHTML = style;

        document.getElementsByTagName('head')[0].appendChild(tex_style);
    }
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

export function makeGrid(plane : Plane){
    const root = $grid({
        rows     : "25px 100% 25px 80px",
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
            ,
            plane.narration_box
        ]
    });

    return root;    
}


}