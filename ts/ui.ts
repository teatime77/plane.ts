namespace plane_ts {
//

export let showAxis : HTMLInputElement;
export let showGrid : HTMLInputElement;
export let snapToGrid : HTMLInputElement;

export function makeToolBox(div : HTMLElement): HTMLButtonElement[] {
    const name_titles = [
        [ "Selection", "selection", "selection" ],
        [ "Point", "point", "point" ],
        [ "Midpoint", "mid-point", "mid point" ],
        [ "Intersection", "intersection", "intersection" ],
        [ "LineSegment", "line-segment", "line segment" ],
        [ "HalfLine", "half-line", "half line" ],
        [ "StraightLine", "line", "line" ],
        [ "Polygon", "polygon", "polygon" ],
        [ "Perpendicular", "perpendicular", "perpendicular" ],
        [ "ParallelLine", "parallel-line", "parallel line" ],
        [ "Circle1", "circle-by-point", "circle by point" ],
        [ "Circle2", "circle-by-radius", "circle by radius" ],
        [ "Arc", "arc", "arc" ],
        [ "Ellipse", "ellipse", "ellipse" ],
        [ "Angle", "angle", "angle" ],
        [ "DimensionLine", "dimension-line", "dimension line" ],
        [ "LengthSymbol", "length-symbol", "length symbol" ],
        [ "TangentCircles", "tangent-circles", "tangent circles" ],
        [ "TangentPoint", "tangent-point", "tangent point" ],
        [ "Text", "text", "text" ]
    ];

    const k = document.location.href.lastIndexOf("/");
    const home = document.location.href.substring(0, k);
    msg(`home:${home}`);

    const buttons : HTMLButtonElement[] = [];
    for(const [value, name, title] of name_titles){
        const button = document.createElement("button");
        button.className = "tool-button";
        button.id = `${name}-button`;
        button.value = value;
        button.title = title;
        button.style.margin      = "2px";
        button.style.borderWidth = "1px";

        const img = document.createElement("img");
        img.src = `${home}/lib/plane/img/${name}.png`;
        img.className = "tool-button-img";
        img.style.width  = "24px";
        img.style.height = "24px";

        button.append(img);
        div.append(button);

        const br = document.createElement("br");
        div.append(br);

        buttons.push(button);
    }

    return buttons;
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

export function makeMenuBar(div : HTMLElement) : [HTMLButtonElement, HTMLAnchorElement]{
    showAxis   = makeCheckbox(div, "show-axis", "Axis");
    showGrid   = makeCheckbox(div, "show-grid", "Grid");
    snapToGrid = makeCheckbox(div, "snap-to-grid", "Snap to Grid");

    menuBarEvent();

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

}