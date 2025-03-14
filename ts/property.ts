namespace plane_ts {
//
type Block = layout_ts.Block;
type CheckBox = layout_ts.CheckBox;
type InputNumber = layout_ts.InputNumber;
type InputText = layout_ts.InputText;
type InputColor = layout_ts.InputColor;
type TextArea = layout_ts.TextArea;

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;
const $popup = layout_ts.$popup;
const $textarea = layout_ts.$textarea;
const $label = layout_ts.$label;
const $input_number = layout_ts.$input_number;
const $checkbox = layout_ts.$checkbox;
const $input_text = layout_ts.$input_text;
const $input_color = layout_ts.$input_color;

let used_property_names : Set<string>;

function appendRow(grid : Grid, nest : number, name : string, value : UI){
    const label = $label({ 
        text : name,
        paddingLeft : `${nest * 10}px`,
    });

    grid.addChild(label);
    grid.addChild(value);
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

    abstract ui() : UI;
}

export class TextAreaProperty extends Property {
    textArea : TextArea;

    constructor(widgets : Widget[], name : string, value : string){
        super(widgets, name);
        this.textArea = $textarea({
            id   : "text-block-text-area",
            cols : 20,
            rows : name == "mathText" ? 6 : 10,
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

    ui() : UI {
        return this.textArea;
    }
}

export abstract class InputProperty extends Property {
    abstract getInput()  : HTMLInputElement;

    constructor(widgets : Widget[], name : string, input_type : string){
        super(widgets, name);
    }

    valueChanged(widget_id : number, name : string, new_value : string | number) : void {
        this.setValue(new_value);

        const operation = View.current.operations.find(x => x instanceof PropertySetting && x.id == widget_id && x.name == name) as PropertySetting;
        if(operation != undefined){
            operation.value = new_value;
        }
        else{
            View.current.addOperation( new PropertySetting(widget_id, name, new_value) );
        }
    }
}

class StringProperty extends InputProperty {
    input : InputText;
    value : string = "";

    constructor(widgets : Widget[], name : string, value : string){
        super(widgets, name, "text");
        this.value = value;
        this.input = $input_text({
            text : value,
            change : async (ev : Event)=>{
                const new_value = this.input.input.value;
                msg(`change:${this.value}=>${new_value}`)

                this.valueChanged(widgets[0].id, name, new_value);
            }
        });
    }

    getInput()  : HTMLInputElement {
        return this.input.input;
    }

    ui() : UI {
        return this.input;
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
                const new_value = this.input.getValue();
                this.valueChanged(widgets[0].id, name, new_value);
            }
        })
    }

    getInput()  : HTMLInputElement {
        return this.input.input;
    }

    ui() : UI {
        return this.input;
    }
}


class SelectProperty extends Property {
    select : HTMLSelectElement;

    constructor(widgets : Widget[], name : string, value : number, option_texts:string[]){
        super(widgets, name);
        this.select = document.createElement("select");
        this.select.style.color = fgColor;
        this.select.style.backgroundColor = bgColor;

        for(const text of option_texts){
            const option = document.createElement("option");
            option.innerText = text;
            option.style.color = fgColor;
            option.style.backgroundColor = bgColor;

            this.select.append(option);
        }

        assert(0 <= value && value < option_texts.length);
        this.select.selectedIndex = value;

        this.select.addEventListener("change", (ev : Event)=>{
            const idx = this.select.selectedIndex;
            this.setValue(idx);
            msg(`select ${idx} ${option_texts[idx]}`);
        });
    }

    ui() : UI {
        throw new MyError();
    }
}


class BooleanProperty extends InputProperty {
    input : CheckBox;

    constructor(widgets : Widget[], name : string, value : boolean){
        super(widgets, name, "checkbox");
        this.input = $checkbox({
            text : name,
            change : async (ev : Event)=>{
                this.BooleanValueChanged();
            }
        });

        this.input.input.checked = value;
    }

    getInput()  : HTMLInputElement {
        return this.input.input;
    }

    BooleanValueChanged() : void {
        this.setValue(this.input.input.checked);
    }

    ui() : UI {
        return this.input;
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

    ui() : UI {
        return this.input;
    }
}

export class ImgSelectionProperty extends Property {
    selectionList : layout_ts.SelectionList;

    constructor(widgets : Widget[], name : string, value : number, button_img_urls : string[]){
        super(widgets, name);

        const buttons : layout_ts.RadioButton[] = [];
        for(const [idx, url] of button_img_urls.entries()){
            const radio = layout_ts.$radio({
                value : `${idx}`,
                url,
                width  : "36px",
                height : "36px",    
            });

            buttons.push(radio);
        }

        this.selectionList = layout_ts.$selection({
            children : buttons,
            selectedIndex : value,
            selectionChanged : (index : number)=>{
                this.setValue(index);
            }
        });
    }

    ui() : UI {
        return this.selectionList;
    }
}

export class ShapesProperty extends Property {
    static one : ShapesProperty;

    buttonsUI : UI;

    constructor(widgets : Widget[], name : string, value : MathEntity[]){
        super(widgets, name);

        if(name == "selectedShapes"){

            ShapesProperty.one = this;
        }

        const buttons = value.map(x => makeShapeButton(x, false));
        for(const button of buttons){
            button.button.style.position = "";
        }

        if(buttons.length == 0){
            this.buttonsUI = $label({ text : "" });
        }
        else{
            this.buttonsUI = $grid({
                columns : buttons.map(x => "auto").join(" "),
                children : buttons
            });    
        }
    }

    ui() : UI {
        return this.buttonsUI;
    }
}

function makeConstantProperty(grid : Grid, nest : number, name : string, text : string){
    grid.addChild($label({ text : name }));
    grid.addChild($label({ text : text }));
}

function appendTitle(grid : Grid, nest : number, title : string){
    const label = $label({
        text : title,
        paddingLeft : `${nest * 10}px`,
    });

    const filler = $label({
        text : ""
    });

    grid.addChild(label);
    grid.addChild(filler);
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

    const grid = Plane.one.property_block;
    if(nest == 0){
        grid.clear();
    }

    const constructor_names = unique(widgets.map(x => x.constructor.name));
    for(const constructor_name of constructor_names){
        appendTitle(grid, nest, constructor_name);
    }


    for(const property_name of properties){
        if(used_property_names.has(property_name)){
            continue;
        }

        if(i18n_ts.appMode == i18n_ts.AppMode.play){
            if(![ "name", "reason", "selectedShapes", "auxiliaryShapes" ].includes(property_name)){
                continue;
            }
        }

        if(typeof property_name == "string"){
            const name = property_name;
            const value = (widgets[0] as any)[name];
            if(value == undefined){
                continue;
            }

            let property : InputProperty | TextAreaProperty | SelectProperty | ImgSelectionProperty | ShapesProperty;

            if(name == "mathText" || name == "text" && widget instanceof TextBlock){

                property = new TextAreaProperty(widgets, name, value as string);
            }
            else if(name == "angleMark"){

                const angles = widgets.filter(x => x instanceof Angle) as Angle[];

                const button_img_urls = range(Angle.numMarks).map(i => `${urlOrigin}/lib/plane/img/angle_${i}.png`) as string[];

                property = new ImgSelectionProperty(angles, name, value, button_img_urls);
            }
            else if(name == "reason"){

                const text = reasonMsg(value);
                assert(typeof text == "string");
                makeConstantProperty(grid, nest + 1, name, text);
                continue;
            }
            else if(name == "selectedShapes" || name == "auxiliaryShapes"){

                property = new ShapesProperty(widgets, name, value);
            }
            else if(name == "line"){

                property = new ShapesProperty(widgets, name, [value]);
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
                        const img_names = [ "line", "half_line_1", "half_line_2", "line_segment" ]
                        const button_img_urls = img_names.map(x => `${urlOrigin}/lib/plane/img/${x}.png`) as string[];
                        property = new ImgSelectionProperty(widgets, name, value, button_img_urls);
                    }
                    else if(name == "lengthKind"){
                        property = new NumberProperty(widgets, name, value, 1, 0, 3);
                    }
                    else if(name == "id" || name == "order"){
                        makeConstantProperty(grid, nest + 1, name, `${value}`);
                        continue;
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
                        makeConstantProperty(grid, nest + 1, name, text);
                    }
                    else{
                        msg(`unknown property:${value.constructor.name}`);
                    }

                    continue;

                default:
                    throw new MyError();
                }
            }

            try{
                const ui = property.ui();
                appendRow(grid, nest + 1, property.name, ui);
            }
            catch(e){
                msg(`no property:${property.name}`);
            }        


            used_property_names.add(property_name);
        }
        else{
            throw new MyError();
        }
    }

    if(i18n_ts.appMode == i18n_ts.AppMode.play){
        return;
    }

    if(nest == 0 && widget instanceof MathEntity){
//++++++++++        appendDelete(tbl, widget);
    }

    layout_ts.Layout.root.updateRootLayout();
}
}