namespace plane_ts {
//
type Block = layout_ts.Block;
type Dialog = layout_ts.Dialog
type CheckBox = layout_ts.CheckBox;
type InputNumber = layout_ts.InputNumber;
type InputText = layout_ts.InputText;
type InputColor = layout_ts.InputColor;
type TextArea = layout_ts.TextArea;

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;
const $dialog = layout_ts.$dialog;
const $popup = layout_ts.$popup;
const $textarea = layout_ts.$textarea;
const $label = layout_ts.$label;
const $input_number = layout_ts.$input_number;
const $checkbox = layout_ts.$checkbox;
const $input_text = layout_ts.$input_text;
const $input_color = layout_ts.$input_color;

const TT = i18n_ts.TT;

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
    textArea : TextArea;

    constructor(widget : Widget, name : string, value : string){
        super(widget, name);
        this.textArea = $textarea({
            id   : "text-block-text-area",
            cols : 20,
            rows : (name == "narration" || name == "mathText" ? 1 : 10),
            value : value,
            change : async (ev : Event)=>{
                this.setValue(this.textArea.getValue());
                if(this.widget instanceof TextBlock){

                    this.widget.div.innerText = this.textArea.getValue();
                }
            }
        });
    }
}

export abstract class InputProperty extends Property {
    abstract getInput()  : HTMLInputElement;

    constructor(widget : Widget, name : string, input_type : string){
        super(widget, name);
    }

    valueChanged() : void {
        this.setValue(this.getInput().value);
    }
}

class StringProperty extends InputProperty {
    input : InputText;

    constructor(widget : Widget, name : string, value : string){
        super(widget, name, "text");
        this.input = $input_text({
            text : value,
            change : async (ev : Event)=>{
                this.setValue(this.input.input.value);
            }
        })
    }

    getInput()  : HTMLInputElement {
        return this.input.input;
    }
}

class NumberProperty extends InputProperty {
    input : InputNumber;

    constructor(widget : Widget, name : string, value : number, step? : number, min? : number, max? : number){
        super(widget, name, "number");
        this.input = $input_number({
            step : 0.1,
            value : value,
            min : min,
            max : max,
            change : async (ev : Event)=>{
                this.setValue(this.input.value());
            }
        })
    }

    getInput()  : HTMLInputElement {
        return this.input.input;
    }
}


class BooleanProperty extends InputProperty {
    input : CheckBox;

    constructor(widget : Widget, name : string, value : boolean){
        super(widget, name, "checkbox");
        this.input = $checkbox({
            text : name
        })
        this.input.input.checked = value;
    }

    getInput()  : HTMLInputElement {
        return this.input.input;
    }

    valueChanged() : void {
        this.setValue(this.input.input.checked);
    }
}

class ColorProperty extends InputProperty {
    input : InputColor;

    constructor(widget : Widget, name : string, value : string){
        super(widget, name, "color");
        this.input = $input_color({
            text : value
        });
    }

    getInput()  : HTMLInputElement {
        return this.input.input;
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

        const [ origin, , ] = i18n_ts.parseURL();

        this.span = document.createElement("span");

        const button_img_urls = range(Angle.numMarks).map(i => `${origin}/lib/plane/img/angle-${i}.png`) as string[];
    
        [this.img, this.dlg, this.imgButtons] = makeImageButtons(this.span, `${origin}/lib/plane/img/angle-${angle.angleMark}.png`, button_img_urls);
    
        this.img.addEventListener("click", (ev:MouseEvent)=>{
            this.dlg.showModal();
        });

        for(const [idx, button] of this.imgButtons.entries()){
            button.addEventListener("click", (ev : MouseEvent)=>{
                this.imgButtonClick(idx);
            })
        }
    }

    imgButtonClick(idx : number) : void {
        this.setValue(idx);
    }
}

export class SelectedShapesProperty extends Property {
    static one : SelectedShapesProperty;

    span : HTMLSpanElement;

    constructor(statement : Statement, name : string, value : AbstractShape[]){
        super(statement, name);
        SelectedShapesProperty.one = this;
        this.span = document.createElement("span");
        const buttons = value.map(x => makeShapeButton(x));
        for(const button of buttons){
            button.button.style.position = "";
            this.span.append(button.button);
        }
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

    let selected_shapes_property : SelectedShapesProperty | undefined;

    for(const property_name of properties){

        if(typeof property_name == "string"){
            const name = property_name;
            const value = (widget as any)[name];
            if(value == undefined){
                continue;
            }

            let property : InputProperty | TextAreaProperty | AngleMarkProperty | SelectedShapesProperty;
            let property_element : HTMLElement;

            if(name == "narration" || name == "mathText" || name == "text" && widget instanceof TextBlock){

                property = new TextAreaProperty(widget, name, value as string);
                property_element = property.textArea.textArea;
            }
            else if(name == "angleMark" && widget instanceof Angle){

                property = new AngleMarkProperty(widget as Angle, name, value);
                property_element  = property.span;
            }
            else if(name == "selectedShapes" && widget instanceof Statement){

                property = new SelectedShapesProperty(widget as Statement, name, value);
                // property = selected_shapes_property;
                // property_element  = property.flex.div;
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
                    if(name == "interval"){
                        property = new NumberProperty(widget, name, value, 0.1, 0);
                    }
                    else{
                        property = new NumberProperty(widget, name, value);
                    }
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

                property_element = property.getInput();
            }

            appendRow(tbl, nest + 1, property.name, property_element);
        }
        else{
            throw new MyError();
        }
    }

    // if(selected_shapes_property != undefined){
    //     selected_shapes_property.layout();
    // }

    if(widget instanceof AbstractShape){
        appendDelete(tbl, widget);
    }
}
}