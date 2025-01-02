namespace plane_ts {
//
export class Canvas {
    view   : View;
    canvas : HTMLCanvasElement;
    ctx    : CanvasRenderingContext2D;

    constructor(view : View, canvas : HTMLCanvasElement){
        this.view   = view;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        assert(this.ctx != null);
    }

    getAttributes(shape : Shape | undefined) : [string, number]{
        let color : string;
        let line_width : number;

        if(shape != undefined){

            color      = shape.modeColor();
            line_width = shape.modeLineWidth();
        }
        else{

            color = fgColor;
            line_width = defaultLineWidth;
        }

        return [color, line_width];
    }

    clear(){
        const rc = this.canvas.getBoundingClientRect();
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, rc.width, rc.height);
    }

    drawLineRaw(p1 : Vec2, p2 : Vec2, color : string, line_width : number){
        const pix1 = this.view.toPixPosition(p1);
        const pix2 = this.view.toPixPosition(p2);

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(pix1.x, pix1.y);
        ctx.lineTo(pix2.x, pix2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = line_width;
        ctx.stroke();   
    }

    drawLine(shape : Shape | undefined, p1 : Vec2, p2 : Vec2){
        const [color, line_width] = this.getAttributes(shape);
        this.drawLineRaw(p1, p2, color, line_width);
    }

    drawLineWith2Points(line : AbstractLine, pointB : Point){
        const l = View.current.max.distance(View.current.min);
        const p_plus  = line.pointA.position.add(line.e.mul( l));
        const p_minus = line.pointA.position.add(line.e.mul(-l));

        switch(line.lineKind){
        case LineKind.line_segment:
            this.drawLine(line, line.pointA.position, pointB.position);
            break;

        case LineKind.ray:
            this.drawLine(line, line.pointA.position, p_plus);
            break;

        case LineKind.ray_reverse:
            this.drawLine(line, line.pointA.position, p_minus);
            break;

        case LineKind.line:
            this.drawLine(line, p_minus, p_plus);
            break;
        }
    }

    drawPolygonRaw(positions : Vec2[], color : string, line_width : number, fill : boolean = false){
        const ctx = this.ctx;

        ctx.beginPath();
        if(fill){

            ctx.globalAlpha = 0.5;
            ctx.fillStyle = color;
        }
        else{

            ctx.strokeStyle = color;
            ctx.lineWidth   = line_width;
        }

        for(const [idx, position] of positions.entries()){
            const pix = this.view.toPixPosition(position);

            if(idx == 0){

                ctx.moveTo(pix.x, pix.y);
            }
            else{

                ctx.lineTo(pix.x, pix.y);
            }
        }

        ctx.closePath();

        if(fill){

            ctx.fill();
            ctx.globalAlpha = 1;
        }
        else{

            ctx.stroke();
        }
    }

    drawPolygon(shape : Shape, positions : Vec2[]){
        const [color, line_width] = this.getAttributes(shape);
        this.drawPolygonRaw(positions, color, line_width);
    }

    drawLinesRaw(lines : [Vec2, Vec2][], color : string, line_width : number){
        const ctx = this.ctx;

        for(const [p1, p2] of lines){
            const pix1 = this.view.toPixPosition(p1);
            const pix2 = this.view.toPixPosition(p2);

            ctx.beginPath();
            ctx.moveTo(pix1.x, pix1.y);
            ctx.lineTo(pix2.x, pix2.y);
            ctx.strokeStyle = color;
            ctx.lineWidth   = line_width;
            ctx.stroke();
        }
    }

    drawLines(shape : Shape, lines : [Vec2, Vec2][]){
        const [color, line_width] = this.getAttributes(shape);
        this.drawLinesRaw(lines, color, line_width);
    }

    drawArcRaw(center : Vec2, radius : number, start_angle : number, end_angle : number, color : string, line_width? : number){
        const ctx = this.ctx;
        const pix = this.view.toPixPosition(center);

        // flip Y
        start_angle = 2 * Math.PI - start_angle;
        end_angle   = 2 * Math.PI - end_angle;

        const radius_pix = this.view.toXPixScale(radius);

        ctx.beginPath();
        ctx.arc(pix.x, pix.y, radius_pix, start_angle, end_angle, true);

        if(line_width == undefined){

            ctx.fillStyle = color;
            ctx.fill();
        }
        else{

            ctx.lineWidth   = line_width;
            ctx.strokeStyle = color;
            ctx.stroke();
        }
    }

    drawCircleRaw(center : Vec2, radius : number, color : string, line_width? : number){
        this.drawArcRaw(center, radius, 0, 2 * Math.PI, color, line_width)
    }

    drawArc(shape : Shape, center : Vec2, radius : number, start_angle : number, end_angle : number){
        const [color, line_width] = this.getAttributes(shape);
        this.drawArcRaw(center, radius, start_angle, end_angle, color, line_width)
    }

    drawCircle(shape : Shape, center : Vec2, radius : number){
        this.drawArc(shape, center, radius, 0, 2 * Math.PI)
    }

    drawEllipse(center : Vec2, radius_x : number, radius_y : number, rotation : number, color : string, line_width : number){

        const center_pix = this.view.toPixPosition(center);
        const radius_x_pix = this.view.toXPixScale(radius_x);
        const radius_y_pix = this.view.toXPixScale(radius_y);

        const ctx = this.ctx;

        ctx.beginPath();
        ctx.ellipse(center_pix.x, center_pix.y, radius_x_pix, radius_y_pix, rotation, 0, 2 * Math.PI);
        ctx.lineWidth = line_width;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    drawText(position : Vec2, text : string, color : string){
        const pos_pix = this.view.toPixPosition(position);
        const ctx = this.ctx;
        ctx.font = "16px serif";
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.strokeText(text, pos_pix.x, pos_pix.y);
    }

    drawRect(shape : Shape | undefined, p1 : Vec2, p2 : Vec2){
        const [color, line_width] = this.getAttributes(shape);

        const pix1 = this.view.toPixPosition(p1);
        const pix2 = this.view.toPixPosition(p2);

        const x = Math.min(pix1.x, pix2.x);
        const y = Math.min(pix1.y, pix2.y);
        const w = Math.abs(pix1.x - pix2.x);
        const h = Math.abs(pix1.y - pix2.y);

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = line_width;
        ctx.rect(x, y, w, h);
        ctx.stroke();   
    }
}
}