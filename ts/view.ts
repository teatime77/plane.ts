namespace plane_ts {
//
export class View extends Widget {
    static nearThreshold = 8;
    static current : View;
    name  : string = "";
    board : HTMLCanvasElement;
    canvas : Canvas;
    grid : Grid;

    shapes : AbstractShape[] = [];
    changed : Set<Shape> = new Set<Shape>();

    downPosition : Vec2 | undefined;
    movePosition : Vec2 | undefined;

    min! : Vec2;
    max! : Vec2;

    dirty : boolean = false;
    prevShape : Shape | undefined;

    relation = new Relation();

    static getJson() : string {
    
        Widget.processed = new Set<number>();
    
        const data = View.current.toObj();
        const json = JSON.stringify(data, null, 4);

        return json;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            name   : this.name,
            scale  : this.board.clientWidth / (this.max.x - this.min.x),
            min    : this.min,
            max    : this.max,
            shapes : this.shapes.map(x => x.toObj())
        });

        return obj;
    }

    isNear(real_distance : number) : boolean {
        const pix_distance = this.toXPixScale(real_distance);
        return pix_distance < View.nearThreshold;
    }

    constructor(canvas : HTMLCanvasElement){
        super({});
        this.board = canvas;
        this.board.innerHTML = "";
        
        this.canvas = new Canvas(this, this.board);
        this.grid   = new Grid(this);

        this.board.style.height = `${this.board.clientWidth * 9 / 16}px`;

        this.board.width  = this.board.clientWidth;
        // this.board.height = this.board.clientWidth * 9 / 16;

        this.board.height = this.board.clientHeight;

        const scale = 100;
        const max_x = 0.5 * (this.board.clientWidth  / scale);
        const max_y = 0.5 * (this.board.clientHeight / scale);

        this.setMinMax(new Vec2(-max_x, -max_y), new Vec2( max_x,  max_y));

        View.current = this;
    }

    setMinMax(min : Vec2, max : Vec2){
        this.min = min;
        this.max = max;

        Point.radius  = this.fromXPixScale(Point.radiusPix);
        Angle.radius1 = this.fromXPixScale(Angle.radius1Pix);
    }

    eventPosition(event : MouseEvent) : Vec2 {
        const flipped_y = this.board.clientHeight - event.offsetY;

        const x = linear(0, event.offsetX, this.board.clientWidth , this.min.x, this.max.x);
        const y = linear(0, flipped_y , this.board.clientHeight, this.min.y, this.max.y);

        return new Vec2(x, y);
    }

    fromXPixScale(pix : number) : number {
        return(this.max.x - this.min.x) * (pix / this.board.clientWidth);
    }

    fromYPixScale(pix : number) : number {
        return(this.max.y - this.min.y) * (pix / this.board.clientHeight);
    }

    fromPix(position : Vec2) : Vec2 {
        return new Vec2(this.fromXPixScale(position.x), this.fromYPixScale(position.y));
    }

    toXPixScale(n : number) : number {
        return this.board.clientWidth * n / (this.max.x - this.min.x);
    }

    toYPixScale(n : number) : number {
        return this.board.clientHeight * n / (this.max.y - this.min.y);
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

    toPixPosition(position:Vec2) : Vec2 {
        const x_pix = this.toXPix(position.x);
        const y_pix = this.toYPix(position.y);

        return new Vec2(x_pix, y_pix);
    }

    getShapes() : Shape[] {
        return this.shapes.filter(x => x instanceof Shape) as Shape[];
    }

    allShapes() : Shape[] {
        const shapes : Shape[] = [];
        this.getShapes().forEach(x => x.getAllShapes(shapes));

        return unique(shapes);
    }

    removeUnusedDivs(){
        const used_divs = this.allShapes().filter(x => x.caption != undefined).map(x => x.caption!.div);
        const used_divs_set = new Set<HTMLDivElement>(used_divs);
        const canvas_divs = Array.from(this.board.getElementsByTagName("div"));
        const unused_divs = canvas_divs.filter(x => !used_divs_set.has);
        for(const div of unused_divs){
            this.board.removeChild(div);
        }
    }

    drawShapes(){
        if(this.dirty){
            this.dirty = false;

            msg("redraw");

            this.canvas.clear();

            this.grid.showGrid(showAxis.checked, showGrid.checked);

            const shapes = this.allShapes();
            shapes.forEach(c => c.draw());
            Builder.tool.draw(this);

            if(snapToGrid.checked){
                this.grid.showPointer();
            }
        }

        window.requestAnimationFrame(this.drawShapes.bind(this));
    }

    click(event : MouseEvent){
        let position = this.eventPosition(event);
        if(snapToGrid.checked){
            position = this.grid.snap(position);
        }

        Point.tempPoints = [];
        const shape = this.getShape(position);
        Builder.tool.click(event, this, position, shape);
    }


    pointerdown(event : PointerEvent){
        let position = this.eventPosition(event);
        if(snapToGrid.checked){
            position = this.grid.snap(position);
        }

        this.downPosition = position;

        const shape = this.getShape(position);

        Builder.tool.pointerdown(event, this, position, shape);
    }

    pointermove(event : PointerEvent){
        // タッチによる画面スクロールを止める
        event.preventDefault(); 

        let position = this.eventPosition(event);
        if(snapToGrid.checked){
            position = this.grid.snap(position);
        }

        const shapes = this.allShapes();

        let is_over_changed = false;
        for(const shape of shapes){
            const is_over = shape.isNear(position);
            if(shape.isOver != is_over){
                shape.isOver = is_over;
                is_over_changed = true;
            }
        }

        const shape = this.getShape(position);
        Builder.tool.pointermove(event, this, position, shape);

        this.movePosition = position;

        if(snapToGrid.checked){
            const prev_snap_position = this.grid.snapPosition;
            this.grid.setSnapPosition();
            if(! prev_snap_position.equals(this.grid.snapPosition)){
                this.dirty = true;
            }
        }

        if(is_over_changed || shape != this.prevShape){
            this.prevShape = shape;
            this.dirty = true;
        }
    }

    pointerup(event : PointerEvent){
        let position = this.eventPosition(event);
        if(snapToGrid.checked){
            position = this.grid.snap(position);
        }

        const shape = this.getShape(position);
        Builder.tool.pointerup(event, this, position, shape);


        this.downPosition = undefined;
    }

    wheel(event : WheelEvent){
        event.preventDefault();

        let position = this.eventPosition(event);
        if(snapToGrid.checked){
            position = this.grid.snap(position);
        }

        const ratio = 0.002 * event.deltaY;
        const min_x = this.min.x - (position.x - this.min.x) * ratio;
        const min_y = this.min.y - (position.y - this.min.y) * ratio;

        const max_x = this.max.x + (this.max.x - position.x) * ratio;
        const max_y = this.max.y + (this.max.y - position.y) * ratio;

        this.setMinMax(new Vec2(min_x, min_y), new Vec2(max_x, max_y));

        this.allShapes().forEach(x => x.updateCaption());

        View.current.dirty = true;
    }

    resize(event : UIEvent){
        const [w, h] = [ this.board.width, this.board.height ];        

        const height = this.board.clientWidth * 9 / 16;

        this.board.style.height = `${height}px`;

        this.board.width  = this.board.clientWidth;
        this.board.height = height;

        // const [rx, ry] = [ this.board.width / w, this.board.height / h ];

        // this.setMinMax(this.min.mul(rx, ry), this.max.mul(rx, ry));

        this.updateTextBlockPositions();
        this.dirty = true;

        msg(`resize: w:${w} ${this.board.width} h:${h} ${this.board.height} max:${this.max}`);
    }

    addShape(shape : AbstractShape){
        this.shapes.push(shape);
    }

    getShape(position : Vec2) : Shape | undefined {
        const shapes = this.allShapes();
        const point = shapes.filter(x => x instanceof Point).find(x => x.isNear(position));
        if(point != undefined){
            return point;
        }

        const symbol = shapes.filter(x => x instanceof LengthSymbol).find(x => x.isNear(position));
        if(symbol != undefined){
            return symbol;
        }

        const line = shapes.filter(x => x instanceof LineSegment).find(x => x.isNear(position));
        if(line != undefined){
            return line;
        }
        
        const circle = shapes.filter(x => x instanceof CircleArcEllipse).find(x => x.isNear(position));
        return circle;
    }

    updateShapes(){
        for(const shape of this.getShapes()){
            if( shape.dependencies().some(x => this.changed.has(x)) ){
                shape.calc();

                this.changed.add(shape);
            }
        }
    }

    updateTextBlockPositions(){
        const shapes = this.allShapes();

        const parents = shapes.filter(x => (x instanceof Point || x instanceof DimensionLine) && x.caption != undefined) as (Point | DimensionLine)[];
        parents.forEach(x => x.updateCaption());

        const text_blocks = this.shapes.filter(x => x instanceof TextBlock) as TextBlock[];
        text_blocks.forEach(x => x.updateTextPosition());
    }
}

class Grid {
    view : View;
    subSpanX : number | undefined;
    subSpanY : number | undefined;
    snapPosition : Vec2 = Vec2.zero();

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

            size = this.view.fromXPixScale(75);
            [min_a, max_a] = [this.view.min.x, this.view.max.x];
            [min_b, max_b] = [this.view.min.y, this.view.max.y];
        }
        else{

            size = this.view.fromYPixScale(75);
            [min_a, max_a] = [this.view.min.y, this.view.max.y];
            [min_b, max_b] = [this.view.min.x, this.view.max.x];
        }

        const power = Math.round( Math.log10(size) );

        let fraction_digits : number;
        fraction_digits = -power;

        let main_span = 10 ** power;
        if(main_span < size){
            if(Math.abs(2 * main_span - size) < size - main_span){
                main_span = 2 * main_span;
            }
        }
        else{
            if(Math.abs(0.5 * main_span - size) < main_span - size){
                main_span = 0.5 * main_span;
                fraction_digits++;
            }
        }
        fraction_digits = Math.max(0, fraction_digits);

        let sub_span = main_span / 5;

        if(show_grid){

            const n1 = Math.floor(min_a / sub_span);
            const n2 = Math.ceil(max_a / sub_span);

            const main_lines : [Vec2, Vec2][] = [];
            const sub_lines : [Vec2, Vec2][] = [];
            const axis_lines : [Vec2, Vec2][] = [];

            for(let n = n1; n <= n2; n++){

                const a = n * sub_span;
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
            const n1 = Math.floor(min_a / main_span);
            const n2 = Math.ceil(max_a / main_span);

            for(let n = n1; n <= n2; n++){
                const a = n * main_span;

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
            this.subSpanX = sub_span;
        }
        else{
            this.subSpanY = sub_span;
        }
    }

    showGrid(show_grid : boolean, show_axis : boolean){
        if(show_grid || show_axis){
            this.drawGridAxis("X", show_grid, show_axis);
            this.drawGridAxis("Y", show_grid, show_axis);
        }
    }

    setSnapPosition(){
        if(this.view.movePosition == undefined || this.subSpanX == undefined || this.subSpanY == undefined){
            return;
        }

        this.snapPosition = this.snap(this.view.movePosition);
    }

    showPointer(){
        if(this.subSpanX == undefined || this.subSpanY == undefined){
            return;
        }

        let position = this.snapPosition;
        const lines : [Vec2, Vec2][] = [
            [ new Vec2(position.x - this.subSpanX, position.y), new Vec2(position.x + this.subSpanX, position.y) ],
            [ new Vec2(position.x, position.y - this.subSpanY), new Vec2(position.x, position.y + this.subSpanY) ]
        ]

        this.view.canvas.drawLines(lines, "blue", 1);
    }

    snap(position : Vec2) : Vec2 {
        if(this.subSpanX == undefined || this.subSpanY == undefined){
            return position;
        }

        const x = Math.round(position.x / this.subSpanX) * this.subSpanX;
        const y = Math.round(position.y / this.subSpanY) * this.subSpanY;

        return new Vec2(x, y);
    }
}



}
