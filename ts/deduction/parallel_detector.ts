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