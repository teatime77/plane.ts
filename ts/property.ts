namespace plane_ts {
//
function appendRow(tbl : HTMLTableElement, nest : number, name : string, value : HTMLElement){
    const row = document.createElement("tr");

    const span = document.createElement("span");
    span.innerText = name;
    span.style.paddingLeft = `${nest * 10}px`;
    
    for(const ele of [span, value]){
        const cell = document.createElement("td");
        cell.append(ele);
        row.append(cell);    
    }

    tbl.append(row);
}

export abstract class Property {
    widget : Widget;
    name   : string;

    constructor(widget : Widget, name : string){
        this.widget = widget;
        this.name   = name;
    }

    setterName() : string {
        return "set" + this.name[0].toUpperCase() + this.name.substring(1);
    }

    setValue(value : any){
        const setter_name = this.setterName();

        const obj = this.widget as any;
        if(obj[setter_name] != undefined){
            obj[setter_name](value);
        }
        else{
            obj[this.name] = value;
        }

        View.current.dirty = true;
    }
}

export class TextAreaProperty extends Property {
    textArea : HTMLTextAreaElement;

    constructor(widget : Widget, name : string, value : string){
        super(widget, name);
        this.textArea = document.createElement("textarea");
        this.textArea.id   = "text-block-text-area";
        this.textArea.cols = 20;
        this.textArea.rows = 10;
        this.textArea.value = value;
    }

    valueChanged() : void {
        this.setValue(this.textArea.value);
        (this.widget as TextBlock).div.innerText = this.textArea.value;
    }
}

export abstract class InputProperty extends Property {
    input  : HTMLInputElement;

    constructor(widget : Widget, name : string, input_type : string){
        super(widget, name);
        this.input = document.createElement("input");
        this.input.type = input_type;
    }

    valueChanged() : void {
        this.setValue(this.input.value);
    }
}

class StringProperty extends InputProperty {
    constructor(widget : Widget, name : string, value : string){
        super(widget, name, "text");
        this.input.value = value;
    }
}

class NumberProperty extends InputProperty {
    constructor(widget : Widget, name : string, value : number){
        super(widget, name, "number");
        this.input.step  = "0.1";
        this.input.value = value.toString();
    }

    valueChanged() : void {
        this.setValue(parseFloat(this.input.value));
    }
}


class BooleanProperty extends InputProperty {
    constructor(widget : Widget, name : string, value : boolean){
        super(widget, name, "checkbox");
        this.input.checked = value;
    }

    valueChanged() : void {
        this.setValue(this.input.checked);
    }
}

class ColorProperty extends InputProperty {
    constructor(widget : Widget, name : string, value : string){
        super(widget, name, "color");
        this.input.value = value;
    }
}

export class AngleMarkProperty extends Property {
    span : HTMLSpanElement;
    // ellipsisButton : HTMLButtonElement;
    dlg : HTMLDialogElement;
    img : HTMLImageElement;
    imgButtons : HTMLImageElement[];

    constructor(angle : Angle, name : string, value : number){
        super(angle, name);

        const k = document.location.href.lastIndexOf("/");
        const home = document.location.href.substring(0, k);
        msg(`home:${home}`);

        this.span = document.createElement("span");

        const button_img_urls = range(Angle.numMarks).map(i => `${home}/lib/plane/img/angle-${i}.png`) as string[];
    
        [this.img, this.dlg, this.imgButtons] = makeImageButtons(this.span, `${home}/lib/plane/img/angle-${angle.angleMark}.png`, button_img_urls);
    }

    imgButtonClick(idx : number) : void {
        this.setValue(idx);
    }
}

function makeConstantProperty(tbl : HTMLTableElement, nest : number, name : string, text : string){
    const span = document.createElement("span");
    span.innerText = text;

    appendRow(tbl, nest, name, span);
}

function appendTitle(tbl : HTMLTableElement, nest : number, title : string){
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 2;
    cell.innerText = title;
    cell.style.paddingLeft = `${nest * 10}px`;
    row.append(cell);    

    tbl.append(row);
}

function appendDelete(tbl : HTMLTableElement, shape : AbstractShape){
    const all_dependencies = View.current.allShapes().map(x => x.dependencies()).flat();

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;

    const button = document.createElement("button");
    button.innerText = "delete";

    if(all_dependencies.includes(shape as Shape)){
        button.disabled = true;
    }
    else{

        deleteShapeEvent(shape, button);
    }

    cell.append(button);
    row.append(cell);    

    tbl.append(row);
}

export function showProperty(widget : Widget, nest : number){
    const properties = widget.getProperties();

    const tbl = $("property-list") as HTMLTableElement;
    if(nest == 0){
        tbl.innerHTML = "";
    }

    appendTitle(tbl, nest, widget.constructor.name);
    for(const property_name of properties){

        if(typeof property_name == "string"){
            const name = property_name;
            const value = (widget as any)[name];
            if(value == undefined){
                continue;
            }

            let property : InputProperty | TextAreaProperty | AngleMarkProperty;
            let property_element : HTMLElement;

            if(name == "text" && widget instanceof TextBlock){

                property = new TextAreaProperty(widget, name, value as string);
                property_element = property.textArea;
            }
            else if(name == "angleMark" && widget instanceof Angle){

                property = new AngleMarkProperty(widget as Angle, name, value);
                property_element  = property.span;
            }
            else{
                switch(typeof value){
                case "string":
                    if(name == "color"){

                        property = new ColorProperty(widget, name, value);
                    }
                    else{

                        property = new StringProperty(widget, name, value);
                    }
                    break;
                    
                case "number":
                    property = new NumberProperty(widget, name, value);
                    break;
                    
                case "boolean":
                    property = new BooleanProperty(widget, name, value);
                    break;
                    
                case "object":
                    if(value instanceof Widget){
                        showProperty(value, nest + 1);
                    }
                    else if(value instanceof Vec2){
                        const text = `x:${value.x.toFixed(1)} y:${value.y.toFixed(1)}`;
                        makeConstantProperty(tbl, nest + 1, name, text);
                    }
                    else{
                        msg(`unknown property:${value.constructor.name}`);
                    }

                    continue;

                default:
                    throw new MyError();
                }

                property_element = property.input;
            }

            appendRow(tbl, nest + 1, property.name, property_element);
            PropertyEvent(property);
        }
        else{
            throw new MyError();
        }
    }

    if(widget instanceof AbstractShape){
        appendDelete(tbl, widget);
    }
}
}