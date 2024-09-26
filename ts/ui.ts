namespace plane_ts {
//
const toolBoxValueTexts : [string,string][] = [
    [ "Selection", "Selection" ],
    [ "Distance", "Distance" ],
    [ "Point", "Point" ],
    [ "LineSegment", "Line segment" ],
    [ "StraightLine", "Straight line" ],
    [ "HalfLine", "Half line" ],
    [ "BSpline", "BSpline" ],
    [ "Rect.1", "Rectangle" ],
    [ "Rect.2", "Square" ],
    [ "Circle.1", "Circle by point" ],
    [ "Circle.2", "Circle by radius" ],
    [ "Ellipse", "Ellipse" ],
    [ "Arc", "Arc" ],
    [ "Midpoint", "Midpoint" ],
    [ "Perpendicular", "Perpendicular" ],
    [ "ParallelLine", "Parallel line" ],
    [ "Intersection", "Intersection" ],
    [ "Tangent", "Tangent" ],
    [ "Angle", "Angle" ],
    [ "Image", "Image" ],
    [ "DimensionLine", "Dimension line" ],
    [ "FuncLine", "Curve" ],
    [ "Surface", "Surface" ],
    [ "Text", "Text" ],
]

export function makeToolBox(div : HTMLElement){
    const tool_type_radios : HTMLInputElement[] = [];

    for(const [value, text] of toolBoxValueTexts){
        const inp = document.createElement("input");
        inp.type = "radio";
        inp.name = "tool-type";
        inp.value = value;
        div.append(inp);

        const label = document.createElement("label");
        label.textContent = text;
        div.append(label);

        tool_type_radios.push(inp);

        div.append(document.createElement("br"));
    }
    tool_type_radios[0].checked = true;

    toolBoxEvent(tool_type_radios);
}

function makeCheckbox(div : HTMLElement, id : string, text : string){
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.id   = id;
    div.append(inp);

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = text;
    div.append(label);
}

export function makeMenuBar(div : HTMLElement) : [HTMLButtonElement, HTMLAnchorElement]{
    makeCheckbox(div, "show-axis", "Axis");
    makeCheckbox(div, "show-grid", "Grid");
    makeCheckbox(div, "snap-to-grid", "Snap to Grid");

    const save_btn = document.createElement("button");
    save_btn.textContent = "Save";
    div.append(save_btn);

    const anchor = document.createElement("a");
    anchor.id = "blob";
    div.append(anchor);

    return [save_btn, anchor];
}

export function makePropertyTable(div : HTMLElement){
    const table = document.createElement("table");
    table.id = "property-list";
    table.style.backgroundColor = "white";
    table.style.height = "min-content";

    div.append(table);
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


}