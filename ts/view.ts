namespace planets {
//
export class View {
    static nearThreshold = 4;
    board : HTMLCanvasElement;
    canvas : Canvas;
    grid : Grid;

    shapes : Shape[] = [];
    changed : Set<Shape> = new Set<Shape>();

    downPos : Vec2 | undefined;
    movePos : Vec2 | undefined;

    min! : Vec2;
    max! : Vec2;

    isNear(real_distance : number) : boolean {
        const pix_distance = this.toPix(real_distance);
        return pix_distance < View.nearThreshold;
    }

    constructor(canvas : HTMLCanvasElement){
        this.board = canvas;
        this.canvas = new Canvas(this, canvas);
        this.grid   = new Grid(this);

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

        this.grid.showGrid($inp("show-axis").checked, $inp("show-grid").checked);

        const shapes = this.allShapes();
        shapes.forEach(c => c.draw());

        if($inp("snap-to-grid").checked){
            this.grid.showPointer();
        }

        window.requestAnimationFrame(this.drawShapes.bind(this));
    }

    click(ev : MouseEvent){
        let pos = this.evPos(ev);
        if($inp("snap-to-grid").checked){
            pos = this.grid.snap(pos);
        }

        const shape = this.getShape(pos);
        Builder.tool.click(ev, this, pos, shape);
    }


    pointerdown(ev : PointerEvent){
        let pos = this.evPos(ev);
        if($inp("snap-to-grid").checked){
            pos = this.grid.snap(pos);
        }

        this.downPos = pos;

        const shape = this.getShape(pos);

        Builder.tool.pointerdown(ev, this, pos, shape);
    }

    pointermove(ev : PointerEvent){
        // タッチによる画面スクロールを止める
        ev.preventDefault(); 

        let pos = this.evPos(ev);
        if($inp("snap-to-grid").checked){
            pos = this.grid.snap(pos);
        }

        const shapes = this.allShapes();
        shapes.forEach(x => x.isOver = x.isNear(pos));    

        const shape = this.getShape(pos);
        Builder.tool.pointermove(ev, this, pos, shape);

        this.movePos = pos;
    }

    pointerup(ev : PointerEvent){
        let pos = this.evPos(ev);
        if($inp("snap-to-grid").checked){
            pos = this.grid.snap(pos);
        }

        const shape = this.getShape(pos);
        Builder.tool.pointerup(ev, this, pos, shape);


        this.downPos = undefined;
    }

    wheel(ev : WheelEvent){
        let pos = this.evPos(ev);
        if($inp("snap-to-grid").checked){
            pos = this.grid.snap(pos);
        }

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
}

class Grid {
    view : View;
    span2X : number | undefined;
    span2Y : number | undefined;

    constructor(view : View){
        this.view = view;
    }

    drawGridAxis(axis : string, show_grid : boolean, show_axis : boolean){
        let size : number;
        let min_a : number;
        let max_a : number

        let min_b : number;
        let max_b : number

        if(axis == "X"){

            size = this.view.fromXPix(75);
            [min_a, max_a] = [this.view.min.x, this.view.max.x];
            [min_b, max_b] = [this.view.min.y, this.view.max.y];
        }
        else{

            size = this.view.fromYPix(75);
            [min_a, max_a] = [this.view.min.y, this.view.max.y];
            [min_b, max_b] = [this.view.min.x, this.view.max.x];
        }

        const p = Math.round( Math.log10(size) );

        let fraction_digits : number;
        fraction_digits = -p;

        let span1 = 10 ** p;
        if(span1 < size){
            if(Math.abs(2 * span1 - size) < size - span1){
                span1 = 2 * span1;
            }
        }
        else{
            if(Math.abs(0.5 * span1 - size) < span1 - size){
                span1 = 0.5 * span1;
                fraction_digits++;
            }
        }
        fraction_digits = Math.max(0, fraction_digits);

        let span2 = span1 / 5;

        if(show_grid){

            const n1 = Math.floor(min_a / span2);
            const n2 = Math.ceil(max_a / span2);

            const main_lines : [Vec2, Vec2][] = [];
            const sub_lines : [Vec2, Vec2][] = [];
            const axis_lines : [Vec2, Vec2][] = [];

            for(let n = n1; n <= n2; n++){

                const a = n * span2;
                let p1 : Vec2;
                let p2 : Vec2;
                if(axis == "X"){

                    p1 = new Vec2(a, min_b);
                    p2 = new Vec2(a, max_b);
                }
                else{

                    p1 = new Vec2(min_b, a);
                    p2 = new Vec2(max_b, a);
                }

                if(n == 0){

                    axis_lines.push([p1, p2]);
                }
                else if(n % 5 == 0){

                    main_lines.push([p1, p2]);
                }
                else{

                    sub_lines.push([p1, p2]);
                }
            }        

            this.view.canvas.drawLines(axis_lines, "black", 1.0);
            this.view.canvas.drawLines(main_lines, "gray", 0.5);
            this.view.canvas.drawLines(sub_lines , "gray", 0.2);
        }

        if(show_axis){
            const n1 = Math.floor(min_a / span1);
            const n2 = Math.ceil(max_a / span1);

            for(let n = n1; n <= n2; n++){
                const a = n * span1;

                const text = (n == 0 ? "0" : a.toFixed(fraction_digits));
                if(axis == "X"){                    
                    this.view.canvas.drawText(new Vec2(a, 0), text, "black");
                }
                else{

                    this.view.canvas.drawText(new Vec2(0, a), text, "black");
                }
            }
        }

        if(axis == "X"){
            this.span2X = span2;
        }
        else{
            this.span2Y = span2;
        }
    }

    showGrid(show_grid : boolean, show_axis : boolean){
        if(show_grid && show_axis){
            this.drawGridAxis("X", show_grid, show_axis);
            this.drawGridAxis("Y", show_grid, show_axis);
        }
    }

    showPointer(){
        if(this.view.movePos == undefined || this.span2X == undefined || this.span2Y == undefined){
            return;
        }

        const pos = this.snap(this.view.movePos);

        const lines : [Vec2, Vec2][] = [
            [ new Vec2(pos.x - this.span2X, pos.y), new Vec2(pos.x + this.span2X, pos.y) ],
            [ new Vec2(pos.x, pos.y - this.span2Y), new Vec2(pos.x, pos.y + this.span2Y) ]
        ]

        this.view.canvas.drawLines(lines, "blue", 1);
    }

    snap(pos : Vec2) : Vec2 {
        if(this.span2X == undefined || this.span2Y == undefined){
            return pos;
        }

        const x = Math.round(pos.x / this.span2X) * this.span2X;
        const y = Math.round(pos.y / this.span2Y) * this.span2Y;

        return new Vec2(x, y);
    }
}



}
