namespace plane_ts {
//
type Block = layout_ts.Block;

const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;

export let showAxis : HTMLInputElement;
export let showGrid : HTMLInputElement;
export let snapToGrid : HTMLInputElement;

const T = i18n_ts.T;

export function makeToolBox(shape_tool : layout_ts.Block){
    const name_titles = [
        [ "Selection", "selection", T("selection") ],
        [ "Point", "point", T("point") ],
        [ "Midpoint", "mid-point", T("mid point") ],
        [ "Intersection", "intersection", T("intersection") ],
        [ "LineSegment", "line-segment", T("line segment") ],
        [ "HalfLine", "half-line", T("half line") ],
        [ "StraightLine", "line", T("line") ],
        [ "Polygon", "polygon", T("polygon") ],
        [ "Perpendicular", "perpendicular", T("perpendicular") ],
        [ "ParallelLine", "parallel-line", T("parallel line") ],
        [ "Circle1", "circle-by-point", T("circle by point") ],
        [ "Circle2", "circle-by-radius", T("circle by radius") ],
        [ "Arc", "arc", T("arc") ],
        [ "Ellipse", "ellipse", T("ellipse") ],
        [ "Angle", "angle", T("angle") ],
        [ "DimensionLine", "dimension-line", T("dimension line") ],
        [ "LengthSymbol", "length-symbol", T("length symbol") ],
        [ "TangentCircles", "tangent-circles", T("tangent circles") ],
        [ "TangentPoint", "tangent-point", T("tangent point") ],
        [ "Text", "text", T("text") ]
    ];

    const k = document.location.href.lastIndexOf("/");
    const home = document.location.href.substring(0, k);
    msg(`home:${home}`);

    for(const [value, name, title] of name_titles){
        const radio = layout_ts.$radio({
            value : value,
            title : title,
            url   : `${home}/lib/plane/img/${name}.png`,
            width : "24px",
            height : "24px",
        });

        shape_tool.addRadioButton(radio);
    }

    shape_tool.children[0].select(true);
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
    img.style.width  = "24px";
    img.style.height = "24px";

    span.append(img);

    const dlg = document.createElement("dialog");

    const imgs : HTMLImageElement[] = [];
    for(const url of button_img_urls){

        const img = document.createElement("img");
        img.src = url;
        img.style.width  = "24px";
        img.style.height = "24px";

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

export function makeUIs() : [ layout_ts.Block, layout_ts.Block, layout_ts.Block, layout_ts.Block, layout_ts.Block ] {
    const k = document.location.href.lastIndexOf("/");
    const home = document.location.href.substring(0, k);
    msg(`home:${home}`);

    const menu_block = $block({
        id : "menu-bar",
        children : [],
        backgroundColor : "lime",
    });

    const tool_block = $block({
        id : "shape-tool",
        children : [],
        backgroundColor : "green",
    });

    const text_block = $block({
        children : [
            $button({
                id : "add-statement",
                width : "24px",
                height : "24px",
                url : `${home}/lib/plane/img/statement.png`,
                click: (ev:MouseEvent)=>{ msg("add statement clicked"); }
            })
        ],
        aspectRatio : 1,
        backgroundColor : "blue",
    });

    const canvas_block = $block({
        id : "canvas-div",
        children : [],
        aspectRatio : 1,
        backgroundColor : "orange",
    });

    const property_block = $block({
        id : "property-div",
        children : [],
        backgroundColor : "cyan",
    });

    return [ menu_block, tool_block, text_block, canvas_block, property_block ];
}

export function makeGrid(menu_block : Block, tool_block : Block, text_block : Block, canvas_block : Block, property_block : Block){
    const k = document.location.href.lastIndexOf("/");
    const home = document.location.href.substring(0, k);
    msg(`home:${home}`);

    const root = $grid({
        rows     : "50px 100%",
        children:[
            $grid({
                children: [
                    menu_block
                ]
            })
            ,
            $grid({
                columns  : "50px 50% 50% 300px",

                children : [
                    tool_block
                    ,
                    text_block
                    ,
                    canvas_block
                    ,
                    property_block
                ]
            })
        ]
    });

    return root;    
}


}