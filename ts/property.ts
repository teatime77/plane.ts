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
    input  : HTMLInputElement;
    widget : Widget;
    name   : string;

    constructor(widget : Widget, name : string, input_type : string){
        this.input = document.createElement("input");
        this.input.type = input_type;

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

    valueChanged() : void {
        this.setValue(this.input.value);
    }
}

class StringProperty extends Property {
    constructor(widget : Widget, name : string, value : string){
        super(widget, name, "text");
        this.input.value = value;
    }
}

class NumberProperty extends Property {
    constructor(widget : Widget, name : string, value : number){
        super(widget, name, "number");
        this.input.step  = "0.1";
        this.input.value = value.toString();
    }

    valueChanged() : void {
        this.setValue(parseFloat(this.input.value));
    }
}


class BooleanProperty extends Property {
    constructor(widget : Widget, name : string, value : boolean){
        super(widget, name, "checkbox");
        this.input.checked = value;
    }

    valueChanged() : void {
        this.setValue(this.input.checked);
    }
}

class ColorProperty extends Property {
    constructor(widget : Widget, name : string, value : string){
        super(widget, name, "color");
        this.input.value = value;
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

export function showProperty(widget : Widget, nest : number){
    const properties = widget.getProperties();

    const tbl = $("property-list") as HTMLTableElement;
    if(nest == 0){
        tbl.innerHTML = "";
    }

    appendTitle(tbl, nest, widget.constructor.name);
    for(const property_name of properties){

        let property : Property;

        if(typeof property_name == "string"){
            const name = property_name;
            const value = (widget as any)[name];
            if(value == undefined){
                continue;
            }

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
        }
        else{
            throw new MyError();
        }

        appendRow(tbl, nest + 1, property.name, property.input);
        PropertyEvent(property!);
    }
}
}