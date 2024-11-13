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

let used_property_names : Set<string>;

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
    widgets : Widget[];
    name   : string;

    constructor(widgets : Widget[], name : string){
        this.widgets = widgets;
        this.name   = name;
    }

    setValue(newValue : any){
        msg(`set value:${this.name} ${newValue}`);

        for(const widget of this.widgets){

            const obj = widget as any;
            const oldValue = obj[this.name];
            setProperty(widget, this.name, newValue);

            if(Builder.tool instanceof MotionBuilder && !(widget instanceof Motion)){
                Builder.tool.animation.addPropertyChange(widget, this.name, oldValue, newValue);
            }
        }

        View.current.dirty = true;
    }
}

export class TextAreaProperty extends Property {
    textArea : TextArea;

    constructor(widgets : Widget[], name : string, value : string){
        super(widgets, name);
        this.textArea = $textarea({
            id   : "text-block-text-area",
            cols : 20,
            rows : (name == "narration" || name == "mathText" ? 6 : 10),
            value : value,
            change : async (ev : Event)=>{
                this.setValue(this.textArea.getValue());
                for(const widget of this.widgets){

                    if(widget instanceof TextBlock && !widget.isTex){

                        widget.div.innerText = this.textArea.getValue();
                    }
                }
            }
        });
    }
}

export abstract class InputProperty extends Property {
    abstract getInput()  : HTMLInputElement;

    constructor(widgets : Widget[], name : string, input_type : string){
        super(widgets, name);
    }

    valueChanged() : void {
        this.setValue(this.getInput().value);
    }
}

class StringProperty extends InputProperty {
    input : InputText;

    constructor(widgets : Widget[], name : string, value : string){
        super(widgets, name, "text");
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

    constructor(widgets : Widget[], name : string, value : number, step : number, min : number, max : number){
        super(widgets, name, "number");
        this.input = $input_number({
            step : step,
            value : value,
            min : min,
            max : max,
            change : async (ev : Event)=>{
                this.setValue(this.input.getValue());
            }
        })
    }

    getInput()  : HTMLInputElement {
        return this.input.input;
    }
}


class BooleanProperty extends InputProperty {
    input : CheckBox;

    constructor(widgets : Widget[], name : string, value : boolean){
        super(widgets, name, "checkbox");
        this.input = $checkbox({
            text : name,
            change : async (ev : Event)=>{
                this.valueChanged();
            }
        });

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

    constructor(widgets : Widget[], name : string, value : string){
        super(widgets, name, "color");
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

    constructor(angles : Angle[], name : string, value : number){
        super(angles, name);

        const [ origin, , ] = i18n_ts.parseURL();

        this.span = document.createElement("span");

        const button_img_urls = range(Angle.numMarks).map(i => `${origin}/lib/plane/img/angle-${i}.png`) as string[];
    
        [this.img, this.dlg, this.imgButtons] = makeImageButtons(this.span, `${origin}/lib/plane/img/angle-${angles[0].angleMark}.png`, button_img_urls);
    
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

    constructor(statements : Statement[], name : string, value : MathEntity[]){
        super(statements, name);
        SelectedShapesProperty.one = this;
        this.span = document.createElement("span");
        this.span.id = "selected-shapes-property-span";
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

function addPopSelectedShapes(tbl : HTMLTableElement, shape : Statement){
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;

    const button = $button({
        text : "pop shape",
        color : fgColor,
        backgroundColor : bgColor,
        click : async (ev : MouseEvent)=>{
            shape.selectedShapes.pop();

            const span = $("selected-shapes-property-span") as HTMLSpanElement;
            span.removeChild(span.lastChild!);
        }
    });
    button.button.style.position = "";

    cell.append(button.button);
    row.append(cell);    

    tbl.append(row);
}

function appendDelete(tbl : HTMLTableElement, shape : MathEntity){
    const all_dependencies = View.current.allShapes().map(x => x.dependencies()).flat();

    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;

    const button = document.createElement("button");
    button.innerText = "delete";
    button.style.color = fgColor;
    button.style.backgroundColor = bgColor;

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

export function showProperty(widget : Widget | Widget[], nest : number){
    if(nest == 0){
        used_property_names = new Set<string>();
    }

    let widgets : Widget[];
    if(widget instanceof Widget){
        widgets = [widget];
    }
    else{
        widgets = widget;
    }

    let properties : string[] = [];
    for(const [idx, w] of widgets.entries() ){
        const names = w.getProperties();
        if(idx == 0){
            properties = names;
        }
        else{
            properties = properties.filter(x => names.includes(x));
        }
    }

    const tbl = $("property-list") as HTMLTableElement;
    if(nest == 0){
        tbl.innerHTML = "";
    }

    const constructor_names = unique(widgets.map(x => x.constructor.name));
    for(const constructor_name of constructor_names){
        appendTitle(tbl, nest, constructor_name);
    }

    for(const property_name of properties){
        if(used_property_names.has(property_name)){
            continue;
        }

        if(typeof property_name == "string"){
            const name = property_name;
            const value = (widgets[0] as any)[name];
            if(value == undefined){
                continue;
            }

            let property : InputProperty | TextAreaProperty | AngleMarkProperty | SelectedShapesProperty;
            let property_element : HTMLElement;

            if(name == "narration" || name == "mathText" || name == "text" && widget instanceof TextBlock){

                property = new TextAreaProperty(widgets, name, value as string);
                property_element = property.textArea.textArea;
            }
            else if(name == "angleMark"){

                const angles = widgets.filter(x => x instanceof Angle) as Angle[];
                property = new AngleMarkProperty(angles, name, value);
                property_element  = property.span;
            }
            else if(name == "selectedShapes" && widget instanceof Statement){

                const statements = widgets.filter(x => x instanceof Statement) as Statement[];
                property = new SelectedShapesProperty(statements, name, value);
                property_element  = property.span;

            }
            else{
                switch(typeof value){
                case "string":
                    if(name == "color"){

                        property = new ColorProperty(widgets, name, value);
                    }
                    else{

                        property = new StringProperty(widgets, name, value);
                    }
                    break;
                    
                case "number":
                    if(name == "interval"){
                        property = new NumberProperty(widgets, name, value, 0.1, 0, 10000);
                    }
                    else if(name == "lineKind"){
                        property = new NumberProperty(widgets, name, value, 1, 0, 3);
                    }
                    else if(name == "lengthKind"){
                        property = new NumberProperty(widgets, name, value, 1, 0, 3);
                    }
                    else{
                        property = new NumberProperty(widgets, name, value, 0.1, -100, 100);
                    }
                    break;
                    
                case "boolean":
                    property = new BooleanProperty(widgets, name, value);
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

            used_property_names.add(property_name);
        }
        else{
            throw new MyError();
        }
    }

    if(widget instanceof Statement){
        addPopSelectedShapes(tbl, widget);
    }

    if(nest == 0 && widget instanceof MathEntity){
        appendDelete(tbl, widget);
    }
}
}