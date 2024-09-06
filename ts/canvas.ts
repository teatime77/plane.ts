namespace planets {
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

    clear(){
        const rc = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rc.width, rc.height);
    }

    drawLine(shape : Shape, p1 : Vec2, p2 : Vec2){
        const color = (shape.isOver ? "red" : shape.color);

        const pix1 = this.view.toPixPos(p1);
        const pix2 = this.view.toPixPos(p2);

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(pix1.x, pix1.y);
        ctx.lineTo(pix2.x, pix2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = (shape.selected ? 3 : 1);
        ctx.stroke();   
    }

    drawLines(lines : [Vec2, Vec2][], color : string, line_width : number){
        const ctx = this.ctx;

        for(const [p1, p2] of lines){
            const pix1 = this.view.toPixPos(p1);
            const pix2 = this.view.toPixPos(p2);

            ctx.beginPath();
            ctx.moveTo(pix1.x, pix1.y);
            ctx.lineTo(pix2.x, pix2.y);
            ctx.strokeStyle = color;
            ctx.lineWidth   = line_width;
            ctx.stroke();
        }
    }

    drawArc(center : Vec2, radius : number, 
            fill_style : string | null, stroke_style : string | null, line_width : number, 
            start_angle : number, end_angle : number){
        const ctx = this.ctx;
        const pix = this.view.toPixPos(center);

        const radius_pix = this.view.toPix(radius);

        ctx.beginPath();
        ctx.arc(pix.x, pix.y, radius_pix, start_angle, end_angle, true);

        if(fill_style != null){

            ctx.fillStyle = fill_style;
            ctx.fill();
        }

        if(stroke_style != null){

            ctx.lineWidth   = line_width;
            ctx.strokeStyle = stroke_style;
            ctx.stroke();
        }
    }

    drawCircle(center : Vec2, radius : number, fill_style : string | null, stroke_style : string | null, line_width : number){
        this.drawArc(center, radius, fill_style, stroke_style, line_width, 0, 2 * Math.PI)
    }

    drawEllipse(center_x_pix : number, center_y_pix : number, radius_x_pix : number, radius_y_pix : number, rotation : number, color : string, line_width : number){
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.ellipse(center_x_pix, center_y_pix, radius_x_pix, radius_y_pix, rotation, 0, 2 * Math.PI);
        ctx.lineWidth = line_width;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

}
}