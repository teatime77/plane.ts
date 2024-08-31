namespace planets {
//
export class View {
    static nearThreshold = 4;
    canvas : HTMLCanvasElement;
    ctx    : CanvasRenderingContext2D;


    shapes : Shape[] = [];
    selections : Shape[] = [];

    realToPix : number;

    downPos : Vec2 | undefined;

    min : Vec2;
    max : Vec2;

    isNear(real_distance : number) : boolean {
        const pix_distance = this.realToPix * real_distance;
        return pix_distance < View.nearThreshold;
    }

    constructor(canvas : HTMLCanvasElement){
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        assert(this.ctx != null);

        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const max_y = 6;
        const max_x = aspect * max_y;

        this.max = new Vec2( max_x,  max_y)
        this.min = new Vec2(-max_x, -max_y);

        this.canvas.width  = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.realToPix = this.canvas.width / (2 * this.max.x);
    }

    evPos(ev : MouseEvent) : Vec2 {
        const flipped_y = this.canvas.clientHeight - ev.offsetY;

        const x = linear(0, ev.offsetX, this.canvas.clientWidth , this.min.x, this.max.x);
        const y = linear(0, flipped_y , this.canvas.clientHeight, this.min.y, this.max.y);

        return new Vec2(x, y);
    }

    toPix(n : number) : number {
        return this.canvas.clientWidth * n / (this.max.x - this.min.x);
    }

    toPixPos(p:Vec2) : Vec2 {
        const x = linear(this.min.x, p.x, this.max.x, 0, this.canvas.clientWidth);
        const y = linear(this.min.y, p.y, this.max.y, 0, this.canvas.clientHeight);

        const flipped_y = this.canvas.clientHeight - y;

        return new Vec2(x, flipped_y);
    }

    allShapes() : Shape[] {
        const shapes : Shape[] = [];
        this.shapes.forEach(x => x.getAllShapes(shapes));

        return unique(shapes);
    }

    drawShapes(){
        this.clear();

        if($inp("show-axis").checked){
        }

        if($inp("show-grid").checked){
        }        

        const shapes = this.allShapes();
        shapes.forEach(c => c.draw());    

        window.requestAnimationFrame(this.drawShapes.bind(this));
    }

    clear(){
        const rc = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rc.width, rc.height);
    }

    click(ev : MouseEvent){
        const pos = this.evPos(ev);

        if(Builder.tool != undefined){
            const shape = this.getShape(pos);
            Builder.tool.click(this, pos, shape);
        }
    }


    pointerdown(ev : PointerEvent){
        const pos = this.evPos(ev);

        this.downPos = pos;

        this.selections = [];
        if(Builder.tool != undefined){
            if(Builder.tool instanceof SelectTool){
                const shape = this.getShape(pos);
                if(shape != undefined){
                    this.selections.push(shape);
                }
            }

            Builder.tool.pointerdown(this, pos);
        }
    }

    pointermove(ev : PointerEvent){
        // タッチによる画面スクロールを止める
        ev.preventDefault(); 

        const pos = this.evPos(ev);

        const shapes = this.allShapes();
        shapes.forEach(x => x.isOver = x.isNear(pos));    

        if(Builder.tool != undefined){
            const shape = this.getShape(pos);
            Builder.tool.pointermove(this, pos, shape);
        }
    }

    pointerup(ev : PointerEvent){
        this.downPos = undefined;
        this.selections = [];
    }

    wheel(ev : WheelEvent){
    }

    resize(ev : UIEvent){
        const [w, h] = [ this.canvas.width, this.canvas.height ];        

        this.canvas.width  = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        const [rx, ry] = [ this.canvas.width / w, this.canvas.height / h ];

        this.max = this.max.mul(rx, ry);
        this.min = this.min.mul(rx, ry);

        this.realToPix = this.canvas.width / (2 * this.max.x);

        msg(`resize: w:${w} ${this.canvas.width} h:${h} ${this.canvas.height} max:${this.max}`);
    }

    addShape(shape : Shape){
        this.shapes.push(shape);
    }

    getShape(pos : Vec2) : Shape | undefined {
        const shapes = this.allShapes();
        const point = shapes.filter(x => x instanceof Point).find(x => x.isNear(pos));
        if(point != undefined){
            return point;
        }

        const line = shapes.filter(x => x instanceof LineSegment).find(x => x.isNear(pos));
        if(line != undefined){
            return line;
        }
        
        const circle = shapes.filter(x => x instanceof Circle).find(x => x.isNear(pos));
        return circle;
    }

    showProperties(shape : Shape){
        const properties : [string, string][] = [];

        shape.getProperties(properties);
        for(const [name, type] of properties){

        }

    }
}




}
