namespace plane_ts {
//
function recalc(shape : MathEntity, changed : Set<MathEntity>){
    const dependencies = shape.dependencies();
    for(const dep of dependencies){
        recalc(dep, changed);
    }

    if(shape instanceof Shape && dependencies.some(x => changed.has(x)) ){
        shape.calc();

        changed.add(shape);
    }
}

export class View extends Widget {
    static nearThreshold = 8;
    static current : View;
    static isPlayBack : boolean = false;

    name  : string = "";
    board : HTMLCanvasElement;
    canvas : Canvas;
    grid : CanvasGrid;

    operations : Operation[] = [];
    shapes : MathEntity[] = [];
    relationLogs : RelationLog[] = [];

    undoStack : UndoData[] = [];

    changed : Set<MathEntity> = new Set<MathEntity>();

    downPosition : Vec2 | undefined;
    movePosition : Vec2 | undefined;

    min! : Vec2;
    max! : Vec2;

    textBase : Vec2;
    textBaseY : number;

    dirty : boolean = false;

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
        this.grid   = new CanvasGrid(this);

        this.board.width  = this.board.clientWidth;
        this.board.height = this.board.clientHeight;

        const scale = 100;
        const span_x = this.board.clientWidth  / scale;
        const min_x = -0.75 * span_x;
        const max_x =  0.25 * span_x;

        const span_y = this.board.clientHeight / scale;
        const max_y = 0.5 * span_y;
        const min_y = -max_y;
        msg(`min-x:${min_x} max-x:${max_x} max-y:${max_y}`);

        this.setMinMax(new Vec2(min_x, min_y), new Vec2(max_x,  max_y));

        this.textBaseY = max_y - 0.1 * span_y;
        this.textBase = new Vec2(min_x + 0.05 * span_x, this.textBaseY);

        View.current = this;

        this.resizeView();
    }

    clearView(){
        const all_shapes = this.allShapes();
        all_shapes.forEach(x => x.hide());

        removeDiv();
    
        Widget.maxId = this.id;
        idMap.clear();
        idMap.set(this.id, this);

        this.operations = [];
        this.shapes = [];
        this.dirty = true;
        this.textBase.y = this.textBaseY;

        Plane.one.clearPlane();
        clearShapeList();
        
        initRelations();    
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

    fromPixScale(position : Vec2) : Vec2 {
        return new Vec2(this.fromXPixScale(position.x), this.fromYPixScale(position.y));
    }

    fromXPix(pix : number) : number {
        return linear(0, pix, this.board.clientWidth, this.min.x, this.max.x);
    }

    fromYPix(pix : number) : number {
        return linear(0, pix, this.board.clientHeight, this.min.y, this.max.y);
    }

    fromPix(position : Vec2) : Vec2 {
        return new Vec2(this.fromXPix(position.x), this.fromYPix(position.y));
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

    allRealShapes() : Shape[] {
        return this.allShapes().filter(x => x instanceof Shape) as Shape[];
    }

    allShapes() : MathEntity[] {
        const shapes : MathEntity[] = [];
        this.shapes.forEach(x => x.getAllShapes(shapes));

        const unique_shapes = unique(shapes);

        return unique_shapes;
    }

    removeUnusedDivs(){
        const used_divs = this.allRealShapes().filter(x => x.caption != undefined).map(x => x.caption!.div);
        const used_divs_set = new Set<HTMLDivElement>(used_divs);
        const canvas_divs = Array.from(this.board.getElementsByTagName("div"));
        const unused_divs = canvas_divs.filter(x => !used_divs_set.has);
        for(const div of unused_divs){
            this.board.removeChild(div);
        }
    }

    resetMode(){
        this.allShapes().forEach(x =>{ x.setMode(Mode.none); x.isOver = false; });
        this.dirty = true;
    }

    resetOrders(){
        MathEntity.orderSet.clear();
        this.allShapes().forEach(x => x.order = NaN);
        this.shapes.forEach(x => x.setOrder());
    }

    drawShapes(){
        if(this.dirty){
            this.dirty = false;

            // msg("redraw");

            this.canvas.clear();
            Polygon.colorIndex = 0;

            this.grid.showGrid(Plane.one.show_axis.checked(), Plane.one.show_grid.checked());

            const shapes = this.allRealShapes();
            const visible_shapes = shapes.filter(x => x.visible);
            
            if(getPlayMode() != PlayMode.stop || !Plane.one.editMode){

                visible_shapes.forEach(c => c.draw());
            }
            else{

                shapes.forEach(c => c.draw());
            }

            visible_shapes.filter(x =>  x.mode != Mode.none).forEach(c => c.draw());

            Builder.tool.drawTool(this);

            if(Plane.one.snap_to_grid.checked()){
                this.grid.showPointer();
            }
        }

        window.requestAnimationFrame(this.drawShapes.bind(this));
    }

    async click(event : MouseEvent){
        msg("click");
        let position = this.eventPosition(event);
        if(Plane.one.snap_to_grid.checked()){
            position = this.grid.snap(position);
        }

        Point.tempPoints = [];
        const shape = this.getShape(position);


        if(Builder.tool instanceof SelectionTool){
            if(shape instanceof Point){

                const click_shape = this.operations.find(x => x instanceof ClickShape && x.createdPoint === shape) as ClickShape;
                if(click_shape != undefined){
                    msg(`click shape position is changed: ${click_shape.position}=>${position}`);
                    click_shape.position = position;
                }
            }

            await Builder.tool.click(this, position, shape);
        }
        else{
            this.addOperation(new ClickShape(position, (shape != undefined ? shape.id : NaN)));

            if(Builder.tool instanceof StatementBuilder){

                await Builder.tool.clickWithMouseEvent(event, this, position, shape);
            }
            else{

                await Builder.tool.click(this, position, shape);
            }
        }

        this.dirty = true;
    }

    async dblclick(event : MouseEvent){
        let position = this.eventPosition(event);
        const shape = this.getShape(position);
        if(shape == undefined){
            return;
        }

        if(Builder.tool instanceof SelectionTool){
            this.resetMode();

            if(shape instanceof LengthSymbol){
                const length_symbols = equalLengths.find(x => x.has(shape));
                if(length_symbols != undefined){
                    Array.from(length_symbols.values()).forEach(x => x.setMode(Mode.depend));
                    this.dirty = true;
                }
            }
            else if(shape instanceof Angle){
                const angles = Array.from(supplementaryAngles.flat()).find(x => x.has(shape));
                if(angles != undefined){
                    this.resetMode();
                    angles.forEach(x => x.setMode(Mode.depend));
                    this.dirty = true;
                }
            }
            else if(shape instanceof AbstractLine){
                const points = getPointsFromLine(shape);
                points.forEach(x => x.setMode(Mode.depend));

                const parallel_lines = getParallelLines(shape);
                if(parallel_lines != undefined){
                    parallel_lines.forEach(x => x.setMode(Mode.target));
                }

                const perpendicular_lines = getPerpendicularLines(shape);
                if(perpendicular_lines != undefined){
                    perpendicular_lines.forEach(x => x.setMode(Mode.depend));
                }
            }

            shape.setMode(Mode.target);
        }

        this.dirty = true;
    }


    pointerdown(event : PointerEvent){
        if(event.button != 0){
            msg(`pointerdown:${event.button.toString(2)}`);
            return;
        }

        let position = this.eventPosition(event);
        if(Plane.one.snap_to_grid.checked()){
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
        if(Plane.one.snap_to_grid.checked()){
            position = this.grid.snap(position);
        }

        const shapes = this.allShapes().concat(Builder.tool.pendingShapes());

        const old_near_shape = shapes.find(x => x.isOver);
        const near_shape = this.getShape(position);

        if(old_near_shape != near_shape){
            if(old_near_shape != undefined){
                old_near_shape.isOver = false;
            }

            if(near_shape != undefined){
                near_shape.isOver = true;
                // msg(`over:${near_shape.constructor.name}`);
            }

            this.dirty = true;
        }

        const shape = this.getShape(position);
        Builder.tool.pointermove(event, this, position, shape);

        this.movePosition = position;

        if(Plane.one.snap_to_grid.checked()){
            const prev_snap_position = this.grid.snapPosition;
            this.grid.setSnapPosition();
            if(! prev_snap_position.equals(this.grid.snapPosition)){
                this.dirty = true;
            }
        }
    }

    pointerup(event : PointerEvent){
        if(event.button != 0){
            msg(`pointerup:${event.button.toString(2)}`);
            return;
        }
        
        let position = this.eventPosition(event);
        if(Plane.one.snap_to_grid.checked()){
            position = this.grid.snap(position);
        }

        const shape = this.getShape(position);
        Builder.tool.pointerup(event, this, position, shape);


        this.downPosition = undefined;
    }

    wheel(event : WheelEvent){
        event.preventDefault();

        let position = this.eventPosition(event);
        if(Plane.one.snap_to_grid.checked()){
            position = this.grid.snap(position);
        }

        const ratio = 0.002 * event.deltaY;
        const min_x = this.min.x - (position.x - this.min.x) * ratio;
        const min_y = this.min.y - (position.y - this.min.y) * ratio;

        const max_x = this.max.x + (this.max.x - position.x) * ratio;
        const max_y = this.max.y + (this.max.y - position.y) * ratio;

        this.setMinMax(new Vec2(min_x, min_y), new Vec2(max_x, max_y));

        this.allRealShapes().forEach(x => x.updateCaption());

        View.current.dirty = true;
    }

    resizeView(){
        this.board.width  = this.board.clientWidth;
        this.board.height = this.board.clientHeight;

        this.updateTextBlockPositions();
        this.dirty = true;

        msg(`resize: w:${this.board.width} h:${this.board.height} max:${this.max}`);
    }

    addOperation(operation : Operation){
        this.operations.push(operation);
    }

    addShape(shape : MathEntity){
        this.shapes.push(shape);
        shape.setOrder();
        addToShapeHistory(shape);
    }

    getShape(position : Vec2) : Shape | undefined {
        const shapes = this.allRealShapes().concat(Builder.tool.pendingShapes());
        const point = shapes.filter(x => x instanceof Point).find(x => x.isNear(position));
        if(point != undefined){
            return point;
        }

        const symbol = shapes.filter(x => x instanceof LengthSymbol).find(x => x.isNear(position));
        if(symbol != undefined){
            return symbol;
        }

        const angle = shapes.filter(x => x instanceof Angle).find(x => x.isNear(position));
        if(angle != undefined){
            return angle;
        }

        const line = shapes.filter(x => x instanceof AbstractLine).find(x => x.isNear(position));
        if(line != undefined){
            return line;
        }
        
        const circle = shapes.filter(x => x instanceof CircleArcEllipse).find(x => x.isNear(position));
        return circle;
    }

    updateShapes(){
        for(const shape of this.getShapes()){
            let shapes : MathEntity[] = [];
            
            shape.getAllShapes(shapes);

            const points = shapes.filter(x => x instanceof Point) as Point[];
            
            for(const point of points){
                const bounds = point.getBounds();
                if(bounds.length == 1){
                    const bound = bounds[0];

                    bound.adjustPosition(point, point.position);

                    this.changed.add(point);
                }
            }

            recalc(shape, this.changed);
        }
    }

    updateTextBlockPositions(){
        const shapes = this.allShapes();

        const parents = shapes.filter(x => (x instanceof Point || x instanceof DimensionLine) && x.caption != undefined) as (Point | DimensionLine)[];
        parents.forEach(x => x.updateCaption());

        const text_blocks = this.shapes.filter(x => x instanceof TextBlock) as TextBlock[];
        text_blocks.forEach(x => x.updateTextPosition());
    }

    async undo(){
        if(this.operations.length == 0){
            return;
        }

        let undoData : UndoData | undefined;

        for(let idx = this.operations.length - 1 - 1; 0 <= idx; idx--){
            const operation = this.operations[idx];
            if(!isNaN(operation.shapesLength)){
                undoData = {
                    operations : this.operations.slice(idx + 1),
                    shapes     : this.shapes.slice(operation.shapesLength),
                    relationLogs : this.relationLogs.slice(operation.relationLogsLength),
                    historyUIs   : []
                }

                this.operations   = this.operations.slice(0, idx + 1);
                this.shapes       = this.shapes.slice(0, operation.shapesLength);
                this.relationLogs = this.relationLogs.slice(0, operation.relationLogsLength);
                break;
            }
        }

        if(undoData == undefined){

            undoData = {
                operations : this.operations.slice(),
                shapes     : this.shapes.slice(),
                relationLogs : this.relationLogs.slice(),
                historyUIs   : []
            }

            this.operations   = [];
            this.shapes       = [];
            this.relationLogs = [];

            initRelations();
        }

        undoData.shapes.forEach(x => x.hide());

        while(View.current.shapes.length < Plane.one.shapes_block.children.length){
            const ui = popShapeList();
            if(ui != undefined){
                undoData.historyUIs.unshift(ui);
            }
        }

        this.undoStack.push(undoData);

        this.dirty = true;
    }

    async redo(){
        const view : View = View.current;

        if(this.undoStack.length == 0){
            return;
        }

        const undoData = this.undoStack.pop()!;

        this.operations.push(... undoData.operations);
        this.shapes.push(... undoData.shapes);
        this.relationLogs.push(... undoData.relationLogs);

        undoData.shapes.forEach(x => x.show());

        undoData.historyUIs.forEach(x => pushShapeList(x));

        this.dirty = true;
    }

    restoreView(){
        const motions = this.shapes.filter(x => x instanceof Motion) as Motion[];
        motions.reverse().forEach(x => x.restorePropertyChanges());
    }

    texPosition(){

    }
}

class CanvasGrid {
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

            this.view.canvas.drawLinesRaw(axis_lines, fgColor, 1.0);
            this.view.canvas.drawLinesRaw(main_lines, "gray", 0.5);
            this.view.canvas.drawLinesRaw(sub_lines , "gray", 0.2);
        }

        if(show_axis){
            const n1 = Math.floor(min_a / main_span);
            const n2 = Math.ceil(max_a / main_span);

            for(let n = n1; n <= n2; n++){
                const a = n * main_span;

                const text = (n == 0 ? "0" : a.toFixed(fraction_digits));
                if(axis == "X"){                    
                    this.view.canvas.drawText(new Vec2(a, 0), text, fgColor);
                }
                else{

                    this.view.canvas.drawText(new Vec2(0, a), text, fgColor);
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

        this.view.canvas.drawLinesRaw(lines, "blue", 1);
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
