namespace planets {
//
export class View {
    static nearThreshold = 4;
    canvas : HTMLCanvasElement;
    ctx    : CanvasRenderingContext2D;


    shapes : Shape[] = [];

    realToPix : number;

    lastMouseX : number = NaN;
    lastMouseY : number = NaN;

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

        const aspect = canvas.clientWidth / canvas.clientHeight;
        const max_y = 6;
        const max_x = aspect * max_y;

        this.max = new Vec2( max_x,  max_y)
        this.min = new Vec2(-max_x, -max_y);

        this.realToPix = canvas.width / (2 * max_x);

        msg(`canvas:${canvas.width} ${canvas.height}`)
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

    drawShapes(){
        this.clear();

        if($inp("show-axis").checked){
        }

        if($inp("show-grid").checked){
        }        

        this.shapes.forEach(c => c.draw(this));    

        window.requestAnimationFrame(this.drawShapes.bind(this));
    }

    clear(){
        const rc = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rc.width, rc.height);
    }

    click(ev : MouseEvent){
        // const rc = this.canvas.getBoundingClientRect();
        // const y1 = rc.height - ev.offsetY;
        // const y2 = this.canvas.offsetHeight - ev.offsetY;
        // const y3 = this.canvas.clientHeight - ev.offsetY;
        // msg(`click:(${ev.clientX}, ${ev.clientY}) (${ev.offsetX}, ${ev.offsetY}, ${y1}, ${y2}, ${y3})`);
        const pos = this.evPos(ev);
        msg(`click: ${pos.x} ${pos.y}`);

        if(Builder.tool != undefined){
            Builder.tool.click(this, pos);
        }
    }


    pointerdown(ev : PointerEvent){
        const pos = this.evPos(ev);
        msg(`down: pos:${pos.x} ${pos.y}`);

        this.lastMouseX = ev.clientX;
        this.lastMouseY = ev.clientY;
    }

    pointermove(ev : PointerEvent){
        // タッチによる画面スクロールを止める
        ev.preventDefault(); 

        const pos = this.evPos(ev);
        this.shapes.forEach(x => x.isOver = x.isNear(this, pos));    

        if(Builder.tool != undefined){
            Builder.tool.pointermove(this, pos);
        }

        if(ev.buttons == 0 || isNaN(this.lastMouseX)){
            return;
        }

        var newX = ev.clientX;
        var newY = ev.clientY;
    }

    pointerup(ev : PointerEvent){
        this.lastMouseX = NaN;
        this.lastMouseY = NaN;
    }

    wheel(ev : WheelEvent){
    }

    addShape(shape : Shape){
        this.shapes.push(shape);
    }
}




}
