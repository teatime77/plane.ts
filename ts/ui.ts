namespace plane_ts {
//
const toolBoxValueTexts : [string,string][] = [
    [ "Selection", "選択" ],
    [ "Distance", "距離" ],
    [ "Point", "点" ],
    [ "LineSegment", "線分" ],
    [ "StraightLine", "直線" ],
    [ "HalfLine", "半直線" ],
    [ "BSpline", "曲線" ],
    [ "Rect.1", "長方形" ],
    [ "Rect.2", "正方形" ],
    [ "Circle.1", "円1" ],
    [ "Circle.2", "円2" ],
    [ "Ellipse", "楕円" ],
    [ "Arc", "弧" ],
    [ "Midpoint", "中点" ],
    [ "Perpendicular", "垂線" ],
    [ "ParallelLine", "平行線" ],
    [ "Intersection", "交点" ],
    [ "Tangent", "接線" ],
    [ "Angle", "角度" ],
    [ "Image", "画像" ],
    [ "DimensionLine", "寸法線" ],
    [ "FuncLine", "曲線" ],
    [ "Surface", "曲面" ],
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