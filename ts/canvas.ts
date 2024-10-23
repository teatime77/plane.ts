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

    clear(){
        const rc = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rc.width, rc.height);
    }

    drawLine(shape : Shape, p1 : Vec2, p2 : Vec2){
        const color = shape.modeColor();

        const pix1 = this.view.toPixPosition(p1);
        const pix2 = this.view.toPixPosition(p2);

        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(pix1.x, pix1.y);
        ctx.lineTo(pix2.x, pix2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = shape.modeLineWidth();
        ctx.stroke();   
    }

    drawLines(lines : [Vec2, Vec2][], color : string, line_width : number){
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

    drawArc(center : Vec2, radius : number, 
            fill_style : string | null, stroke_style : string | null, line_width : number, 
            start_angle : number, end_angle : number){
        const ctx = this.ctx;
        const pix = this.view.toPixPosition(center);

        // flip Y
        start_angle = 2 * Math.PI - start_angle;
        end_angle   = 2 * Math.PI - end_angle;

        const radius_pix = this.view.toXPixScale(radius);

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

}
}