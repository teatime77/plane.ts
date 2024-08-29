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

        const aspect = canvas.clientWidth / canvas.clientHeight;
        const max_y = 6;
        const max_x = aspect * max_y;

        this.max = new Vec2( max_x,  max_y)
        this.min = new Vec2(-max_x, -max_y);

        this.realToPix = canvas.width / (2 * max_x);
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
        shapes.forEach(c => c.draw(this));    

        window.requestAnimationFrame(this.drawShapes.bind(this));
    }

    clear(){
        const rc = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rc.width, rc.height);
    }

    click(ev : MouseEvent){
        const pos = this.evPos(ev);

        if(Builder.tool != undefined){
            const point = this.getPoint(pos);
            Builder.tool.click(this, pos, point);
        }
    }


    pointerdown(ev : PointerEvent){
        const pos = this.evPos(ev);

        this.downPos = pos;

        this.selections = [];
        if(Builder.tool != undefined){
            if(Builder.tool instanceof SelectTool){
                const pt = this.getPoint(pos);
                if(pt != undefined){
                    this.selections.push(pt);
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
        shapes.forEach(x => x.isOver = x.isNear(this, pos));    

        if(Builder.tool != undefined){
            const point = this.getPoint(pos);
            Builder.tool.pointermove(this, pos, point);
        }
    }

    pointerup(ev : PointerEvent){
        this.downPos = undefined;
        this.selections = [];
    }

    wheel(ev : WheelEvent){
    }

    addShape(shape : Shape){
        this.shapes.push(shape);
    }

    getPoint(pos : Vec2) : Point | undefined {
        const shapes = this.allShapes();
        return shapes.filter(x => x instanceof Point).find(x => x.isNear(this, pos)) as Point;
    }
}




}
