namespace planets {
//
export class View {
    static nearThreshold = 4;
    board : HTMLCanvasElement;
    canvas : Canvas;


    shapes : Shape[] = [];
    changed : Set<Shape> = new Set<Shape>();

    downPos : Vec2 | undefined;

    min! : Vec2;
    max! : Vec2;

    isNear(real_distance : number) : boolean {
        const pix_distance = this.toPix(real_distance);
        return pix_distance < View.nearThreshold;
    }

    constructor(canvas : HTMLCanvasElement){
        this.board = canvas;
        this.canvas = new Canvas(this, canvas);

        const aspect = this.board.clientWidth / this.board.clientHeight;
        const max_y = 6;
        const max_x = aspect * max_y;

        this.board.width  = this.board.clientWidth;
        this.board.height = this.board.clientHeight;

        this.setMinMax(new Vec2(-max_x, -max_y), new Vec2( max_x,  max_y));
    }

    setMinMax(min : Vec2, max : Vec2){
        this.min = min;
        this.max = max;

        Point.radius  = this.fromXPix(Point.radiusPix);
        Angle.radius1 = this.fromXPix(Angle.radius1Pix);
    }

    evPos(ev : MouseEvent) : Vec2 {
        const flipped_y = this.board.clientHeight - ev.offsetY;

        const x = linear(0, ev.offsetX, this.board.clientWidth , this.min.x, this.max.x);
        const y = linear(0, flipped_y , this.board.clientHeight, this.min.y, this.max.y);

        return new Vec2(x, y);
    }

    fromXPix(pix : number) : number {
        return(this.max.x - this.min.x) * (pix / this.board.clientWidth);
    }

    fromYPix(pix : number) : number {
        return(this.max.y - this.min.y) * (pix / this.board.clientHeight);
    }

    fromPix(p : Vec2) : Vec2 {
        return new Vec2(this.fromXPix(p.x), this.fromYPix(p.y));
    }

    toPix(n : number) : number {
        return this.board.clientWidth * n / (this.max.x - this.min.x);
    }

    toXPix(x : number) : number {
        const x_pix = linear(this.min.x, x, this.max.x, 0, this.board.clientWidth);
        return x_pix;
    }

    toYPix(y : number) : number {
        const pix_y = linear(this.min.y, y, this.max.y, 0, this.board.clientHeight);

        const flipped_y = this.board.clientHeight - pix_y;
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
        this.canvas.clear();

        if($inp("show-axis").checked){
        }

        if($inp("show-grid").checked){
            this.showGrid();
        }        

        const shapes = this.allShapes();
        shapes.forEach(c => c.draw());    

        window.requestAnimationFrame(this.drawShapes.bind(this));
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
        const min_x = this.min.x - (pos.x - this.min.x) * ratio;
        const min_y = this.min.y - (pos.y - this.min.y) * ratio;

        const max_x = this.max.x + (this.max.x - pos.x) * ratio;
        const max_y = this.max.y + (this.max.y - pos.y) * ratio;

        this.setMinMax(new Vec2(min_x, min_y), new Vec2(max_x, max_y));

        this.allShapes().forEach(x => x.updateCaption());
    }

    resize(ev : UIEvent){
        const [w, h] = [ this.board.width, this.board.height ];        

        this.board.width  = this.board.clientWidth;
        this.board.height = this.board.clientHeight;

        const [rx, ry] = [ this.board.width / w, this.board.height / h ];

        this.setMinMax(this.min.mul(rx, ry), this.max.mul(rx, ry));

        msg(`resize: w:${w} ${this.board.width} h:${h} ${this.board.height} max:${this.max}`);
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
        let size : number;

        if(axis == "X"){

            size = this.fromXPix(50);
        }
        else{

            size = this.fromYPix(50);
        }

        const p = Math.floor( Math.log10(size) );
        const span1 = 10 ** p;
        const span2 = span1 / 5;

        const n1 = Math.floor(min / span2);
        const n2 = Math.ceil(max / span2);

        const main_lines : [Vec2, Vec2][] = [];
        const sub_lines : [Vec2, Vec2][] = [];

        for(let n = n1; n <= n2; n++){

            const a = n * span1;
            let p1 : Vec2;
            let p2 : Vec2;
            if(axis == "X"){

                p1 = new Vec2(a, this.min.y);
                p2 = new Vec2(a, this.max.y);
            }
            else{

                p1 = new Vec2(this.min.x, a);
                p2 = new Vec2(this.max.x, a);
            }

            if(n % 5 == 0){

                main_lines.push([p1, p2]);
            }
            else{

                sub_lines.push([p1, p2]);
            }
        }

        this.canvas.drawLines(main_lines, "gray", 0.5);
        this.canvas.drawLines(sub_lines , "gray", 0.2);
    }

    showGrid(){
        this.drawGridLine("X", this.min.x, this.max.x);
        this.drawGridLine("Y", this.min.y, this.max.y);
    }
}




}
