namespace planets {
//
export class View {
    static nearThreshold = 4;
    canvas : HTMLCanvasElement;
    ctx    : CanvasRenderingContext2D;


    shapes : Shape[] = [];
    changed : Set<Shape> = new Set<Shape>();

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

    fromXPix(pix : number) : number {
        return(this.max.x - this.min.x) * (pix / this.canvas.clientWidth);
    }

    fromYPix(pix : number) : number {
        return(this.max.y - this.min.y) * (pix / this.canvas.clientHeight);
    }

    fromPix(p : Vec2) : Vec2 {
        return new Vec2(this.fromXPix(p.x), this.fromYPix(p.y));
    }

    toPix(n : number) : number {
        return this.canvas.clientWidth * n / (this.max.x - this.min.x);
    }

    toXPix(x : number) : number {
        const x_pix = linear(this.min.x, x, this.max.x, 0, this.canvas.clientWidth);
        return x_pix;
    }

    toYPix(y : number) : number {
        const pix_y = linear(this.min.y, y, this.max.y, 0, this.canvas.clientHeight);

        const flipped_y = this.canvas.clientHeight - pix_y;
        return flipped_y;
    }

    toPixPos(p:Vec2) : Vec2 {
        const x_pix = this.toXPix(p.x);
        const y_pix = this.toYPix(p.y);

        return new Vec2(x_pix, y_pix);
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
            this.showGrid();
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
            Builder.tool.click(ev, this, pos, shape);
        }
    }


    pointerdown(ev : PointerEvent){
        const pos = this.evPos(ev);

        this.downPos = pos;

        if(Builder.tool != undefined){
            const shape = this.getShape(pos);

            Builder.tool.pointerdown(ev, this, pos, shape);
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
            Builder.tool.pointermove(ev, this, pos, shape);
        }
    }

    pointerup(ev : PointerEvent){
        if(Builder.tool != undefined){

            const pos = this.evPos(ev);
            const shape = this.getShape(pos);
            Builder.tool.pointerup(ev, this, pos, shape);
        }


        this.downPos = undefined;
    }

    wheel(ev : WheelEvent){
        const pos = this.evPos(ev);

        const ratio = 0.002 * ev.deltaY;
        this.min.x -= (pos.x - this.min.x) * ratio;
        this.min.y -= (pos.y - this.min.y) * ratio;

        this.max.x += (this.max.x - pos.x) * ratio;
        this.max.y += (this.max.y - pos.y) * ratio;

        this.allShapes().forEach(x => x.updateCaption());
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

    updateShapes(){
        for(const shape of this.shapes){
            if( shape.dependencies().some(x => this.changed.has(x)) ){
                shape.calc();

                this.changed.add(shape);
            }
        }
    }

    drawGridLine(axis : string, min : number, max : number){
        let min_pix : number;
        let max_pix : number;
        let size : number;

        if(axis == "X"){
            min_pix = this.toYPix(this.min.y);
            max_pix = this.toYPix(this.max.y);

            size = this.fromXPix(50);
        }
        else{
            min_pix = this.toXPix(this.min.x);
            max_pix = this.toXPix(this.max.x);

            size = this.fromYPix(50);
        }

        const p = Math.floor( Math.log10(size) );
        const span1 = 10 ** p;
        const span2 = span1 / 5;

        const n1 = Math.floor(min / span2);
        const n2 = Math.ceil(max / span2);

        const ctx = this.ctx;

        ctx.strokeStyle = "gray";

        for(let n = n1; n <= n2; n++){
            if(n % 5 == 0){

                ctx.lineWidth   = 0.5;
            }
            else{

                ctx.lineWidth   = 0.2;
            }

            ctx.beginPath();
            const a = n * span1;
            if(axis == "X"){

                const x_pix = this.toXPix(a);
                ctx.moveTo(x_pix, min_pix);
                ctx.lineTo(x_pix, max_pix);
            }
            else{

                const y_pix = this.toYPix(a);
                ctx.moveTo(min_pix, y_pix);
                ctx.lineTo(max_pix, y_pix);
            }
            ctx.stroke();
        }
    }

    showGrid(){
        this.drawGridLine("X", this.min.x, this.max.x);
        this.drawGridLine("Y", this.min.y, this.max.y);
    }
}




}
