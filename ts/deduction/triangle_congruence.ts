namespace plane_ts {
//
export class TriangleCongruence extends Statement {

    async asyncPlay(speech : i18n_ts.AbstractSpeech){
        this.setIndex();

        switch(this.reason){
        case Reason.side_side_side:
        case Reason.side_angle_side:
        case Reason.angle_side_angle:
            if(2 <= this.selectedShapes.length && this.selectedShapes.slice(0, 2).every(x => x instanceof SelectedShape && x.isTriangle())){
                break;
            }
            throw new MyError();
        default:
            throw new MyError();
        }

        const triangles = this.selectedShapes.slice(0, 2) as SelectedShape[] 
        triangles.forEach(x => x.mode = 0);
        speech.speak(TT("We show that the two triangles are congruent."));
        for(const selected of triangles){
            View.current.attentionShapes.push(selected);
            View.current.dirty = true;
            if(Plane.one.playMode == PlayMode.normal){
                await sleep(1000);
            }
        }
        await speech.waitEnd();

        if(this.reason == Reason.side_side_side){
            const texts = [
                TT("These two sides are equal."),
                TT("These two sides are equal."),
                TT("This side is common."),
            ];

            for(const [i, highlight_mode] of [1, 2, 3].entries()){
                speech.speak(texts[i]);
                triangles.forEach(x => x.highlightMode = highlight_mode);
                View.current.dirty = true;
                await speech.waitEnd();
            }

            triangles.forEach(x => x.highlightMode = 0);
            View.current.dirty = true;
            
            for(const s of TTs("Because the three corresponding sides are equal,\nthe two triangles are congruent.")){
                await speech.speak_waitEnd(s);
            }
        }

        if(this.implication == ImplicationCode.equal_angles && 4 <= this.selectedShapes.length && this.selectedShapes.slice(2, 4).every(x => x instanceof Angle)){
            const angles = this.selectedShapes.slice(2, 4) as Angle[];
            angles.forEach(x => { x.visible2 = true; x.setMode(Mode.depend)});
            await speech.speak_waitEnd(TT("These corresponding angles are equal."));
        }
    }
}

}