namespace plane_ts {
//
export class Reading {
    static translation : Map<string, string>;

    text : string;
    args : Shape[];

    static setTranslation(translation : Map<string, string>){
        Reading.translation = translation;
    }

    constructor(text : string, args : Shape[]){
        this.text = text;
        this.args = args;
    }

    toString() : string {
        let text = this.text;

        if(Reading.translation != undefined && Reading.translation.has(this.text)){
            text = Reading.translation.get(text)!;
        }

        for(const i of range(this.args.length)){
            const c = lowerGreekLetters[i];
            text = text!.replace(c, `[${c}]`);
        }

        for(const i of range(this.args.length)){
            const c = lowerGreekLetters[i];
            text = text!.replace(`[${c}]`, this.args[i].name);
        }

        return text;
    }
}
}