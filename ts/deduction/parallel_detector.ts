namespace plane_ts {
//
export function makeParallelDetectorByParallelogram(lineA : AbstractLine, lineB : AbstractLine) : ParallelDetector | undefined {
    const lines = [lineA, lineB];

    for(const classifier of parallelogramClassifiers){
        const parallelogram = classifier.quadrilateral();
        if(isSubSet(lines, parallelogram.lines)){

            msg(`Parallel-Detector-By-Parallelogram`);
            return new ParallelDetector({
                reason : ParallelReason.parallelogram,
                auxiliaryShapes : [parallelogram],
                shapes : [lineA, lineB]
            });
        }
    }

    return undefined;
}

export function makeParallelDetectorByCorrespondingAlternateAnglesEqual(angleA : Angle, angleB : Angle) : ParallelDetector | undefined {
    if(angleA.intersection != angleB.intersection && isEqualAngle(angleA, angleB)){
        let lineA : AbstractLine;
        let lineB : AbstractLine;

        if(angleA.lineA == angleB.lineA){
            lineA = angleA.lineB;
            lineB = angleB.lineB;
        }
        else if(angleA.lineB == angleB.lineB){
            lineA = angleA.lineA;
            lineB = angleB.lineA;
        }
        else{
            return undefined;
        }

        msg(`Parallel-Detector-By-Corresponding-Alternate-Angles-Equal`);
        return new ParallelDetector({
            reason : ParallelReason.corresponding_angles_or_alternate_angles_are_equal,
            auxiliaryShapes : [angleA, angleB],
            shapes : [lineA, lineB]
        });
    }

    return undefined;
}

export class ParallelDetector extends Statement {
    reading(): Reading {
        return this.textReading(TT("these two lines are parallel."));
    }

    setRelations(){
        super.setRelations();
        assert(this.selectedShapes.length == 2 && this.selectedShapes.every(x => x instanceof AbstractLine));
        const [ lineA, lineB ] = this.selectedShapes as AbstractLine[];
        addParallelLines(lineA, lineB);
    }
}
}