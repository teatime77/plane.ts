namespace plane_ts {
//

const $dic = new Map<string, HTMLElement>();

export function $(id : string) : HTMLElement {
    let ele = $dic.get(id);
    if(ele == undefined){
        ele = document.getElementById(id)!;
        $dic.set(id, ele);
    }

    return ele;
}

export function $div(id : string) : HTMLDivElement {
    return $(id) as HTMLDivElement;
}

export function $inp(id : string) : HTMLInputElement {
    return $(id) as HTMLInputElement;
}

export function $dlg(id : string) : HTMLDialogElement {
    return $(id) as HTMLDialogElement;
}

export function $sel(id : string) : HTMLSelectElement {
    return $(id) as HTMLSelectElement;
}

// Define a function that returns a Promise
async function waitForClick(element: HTMLElement): Promise<number> {
    return new Promise<number>((resolve : (id:number)=>void) => {

        const clickHandler = (ev : MouseEvent) => {
            const target = ev.target as HTMLElement;
            if(target.className == enumSelectionClassName){

                element.removeEventListener('click', clickHandler);
                const enum_value = parseInt(target.dataset.enum_value!);
                resolve(enum_value); 
            }
        }

        element.addEventListener('click', clickHandler);
    });
}


export async function showMenu(dlg : HTMLDialogElement){
    dlg.showModal();
    
    let value : number

    if(View.isPlayBack){
        const operation = View.current.operations.pop();
        if(operation instanceof EnumSelection){

            const items = Array.from(dlg.getElementsByClassName(enumSelectionClassName)) as HTMLElement[];

            const enum_value = `${operation.value}`;
            const item  = items.find(x => x.dataset.enum_value == enum_value)!;
            assert(item != undefined);
            item.style.borderStyle = "ridge";
            await sleep(1000);
            item.style.borderStyle = "none";

            value = operation.value;
        }
        else{
            throw new MyError();
        }
    }
    else{

        value = await waitForClick(dlg);

        View.current.addOperation(new EnumSelection(value));
    }

    dlg.close();

    return value
}
        
export class MyError extends Error {
    constructor(text : string = ""){
        super(text);
    }
}

export function assert(b : boolean, msg : string = ""){
    if(!b){
        throw new MyError(msg);
    }
}    

export function msg(txt : string){
    layout_ts.Log.log(txt);
}

export function range(n: number) : number[]{
    return [...Array(n).keys()];
}

export function last<T>(v : Array<T>) : T {
    return v[v.length - 1];
}

export function unique<T>(v : Array<T>) : T[] {
    let set = new Set<T>();
    const ret : T[] = [];
    for(const x of v){
        if(!set.has(x)){
            set.add(x);
            ret.push(x);
        }
    }
    return ret;
}

export function remove<T>(v : Array<T>, x : T){
    const idx = v.indexOf(x);
    assert(idx != undefined);
    v.splice(idx, 1);
}

export function sum(v : number[]) : number {
    return v.reduce((acc, cur) => acc + cur, 0);
}

export function average(v : number[]) : number {
    return sum(v) / v.length;
}

export async function fetchText(fileURL: string) {
    const response = await fetch(fileURL);
    const text = await response!.text();

    return text;
}

export function pseudoColor(n : number) : [number, number, number] {
    n = Math.max(0, Math.min(1, n));

    let r:number, g:number, b:number;

    if(n < 0.25){
        b = 1;
        g = n * 4;
        r = 0;
    }
    else if(n < 0.5){
        b = (0.5 - n) * 4;
        g = 1;
        r = 0;
    }
    else if(n < 0.75){
        b = 0;
        g = 1;
        r = (n - 0.5) * 4;
    }
    else{
        b = 0;
        g = (1 - n) * 4;
        r = 1;
    }

    return [r, g, b];
}

export function toRadian(degree : number) : number {
    return degree * Math.PI / 180;
}

export function toDegree(radian : number) : number {
    return radian * 180 / Math.PI;
}

export function inRange(start : number, theta : number, end : number) : boolean {
    const f = (x:number)=>{ return 0 <= x ? x : 180 + x };

    [start , theta, end] = [ f(start), f(theta), f(end)];
    [ theta, end ] = [ theta - start, end - start ];

    const g = (x:number)=>{ return 0 <= x ? x : 360 + x };
    [theta, end] = [ g(theta), g(end)];

    assert(0 <= theta && 0 <= end);
    return theta <= end;
}

export function linear(src_min : number, src_val : number, src_max : number, dst_min : number, dst_max : number) : number {
    const ratio = (src_val - src_min) / (src_max - src_min);    
    const dst_val = dst_min + ratio * (dst_max - dst_min);

    return dst_val;
}

export function MinMaxXY(p1 : Vec2, p2 : Vec2) : [number,number,number,number] {
    const min_x = Math.min(p1.x, p2.x);
    const min_y = Math.min(p1.y, p2.y);

    const max_x = Math.max(p1.x, p2.x);
    const max_y = Math.max(p1.y, p2.y);

    return [ min_x, min_y, max_x, max_y ];
}

export function pairKey(a : Widget, b : Widget) : string {
    return a.id <= b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
}


export async function sleep(milliseconds : number) : Promise<void> {
    return new Promise((resolve) => {
        if(Plane.one.playMode == PlayMode.playAll){
            resolve();
        }
        else{

            setTimeout(()=>{
                resolve();
            }, milliseconds);
        }
    });
}

function normalizeAngle(theta : number) : number {
    return 0 <= theta ? theta : theta + 2 * Math.PI;
}

export function isBetweenAngles(start : number, theta : number, end : number ){
    theta  = normalizeAngle(theta - start);
    end    = normalizeAngle(end - start);

    assert(0 <= theta && 0 <= end);
    return theta <= end;
}

function makeName(){
    const points = View.current.allRealShapes().filter(x => x instanceof Point).concat(Point.tempPoints);

    const upper_latin_letters = i18n_ts.upperLatinLetters;
    const idxes = points.map(x => upper_latin_letters.indexOf(x.name));

    let name : string;
    if(idxes.length == 0){
        name = upper_latin_letters[0];
    }
    else{
        const max_idx = Math.max(...idxes);
        if(max_idx == -1){
            name = upper_latin_letters[0];
        }
        else if(max_idx + 1 < upper_latin_letters.length){
            name = upper_latin_letters[max_idx + 1];
        }
        else{
            throw new MyError();
        }
    }
}


function setterName(name : string) : string {
    return "set" + name[0].toUpperCase() + name.substring(1);
}

export function setProperty(obj : any, property_name : string, newValue : any){
    const setter_name = setterName(property_name);
    if(obj[setter_name] != undefined){
        obj[setter_name](newValue);
    }
    else{
        obj[property_name] = newValue;
    }
}

export function anyToObj(obj : any) : any {
    if(Array.isArray(obj)){
        return obj.map(x => anyToObj(x));
    }
    else if(obj instanceof Widget){
        return obj.toObj();
    }
    else{
        return obj;
    }
}

export function list<T>(set : Set<T> | undefined) : T[] {
    if(set == undefined){
        return [];
    }
    else{

        return Array.from(set);
    }
}

export function intersection<T>(set1 : Set<T> | undefined, set2 : Set<T> | undefined) : T[] {
    if(set1 == undefined || set2 == undefined){
        return [];
    }

    return Array.from(set1.values()).filter(x => set2.has(x));
}

export function pairs<T>(a : T, b : T) : [[T, T], [T, T]] {
    return [ [a, b], [b, a] ];
}


export function areSetsEqual<T>(A: T[], B: T[]): boolean {
    const setA = new Set<T>(A);
    const setB = new Set<T>(B);

    // Check if sizes are different
    if (setA.size !== setB.size) {
        return false;
    }

    // Check if all elements of setA are present in setB
    for (const element of setA) {
        if (!setB.has(element)) {
            return false;
        }
    }

    return true;
}

export function isSubSet<T>(A: T[], B: T[]): boolean {
    const setB = new Set<T>(B);

    return A.every(x => setB.has(x));
}

export function isClockwise(points : Point[]) : boolean {
    assert(points.length == 3);
    const [A, B, C] = points.map(x => x.position);
    const AB = B.sub(A);
    const AC = C.sub(A);
    
    const cross_product = AB.cross(AC);
    assert(cross_product != 0);

    return 0 < cross_product;
}

export function toClockwisePoints(points : Point[]) : Point[] {
    if(isClockwise(points)){
        return points;
    }
    else{
        return [2, 1, 0].map(i => points[i]);
    }
}

let reasonMsgMap : Map<number, string> | undefined;

function makeReasonMsgMap(){
    return new Map<number, string>([
        [ TriangleCongruenceReason.side_side_side, TT("Since three pairs of sides of two triangles are equal,")],
        [ TriangleCongruenceReason.side_angle_side, TT("Since two pairs of sides of two triangles are equal, and the included angles are equal,")],
        [ TriangleCongruenceReason.angle_side_angle, TT("Since two pairs of angles of two triangles are equal, and the included sides are equal,")],

        [ LengthEqualityReason.radii_equal, TT("Since the two circles have the same radius,")],
        [ LengthEqualityReason.common_circle, TT("Since two length symbols are the radii of the same circle,")],
        [ LengthEqualityReason.parallel_lines_distance, TT("Since the distance between two parallel lines is constant,")],
        [ LengthEqualityReason.circle_by_radius, TT("Since the two circles have the same radius,")],
        [ LengthEqualityReason.congruent_triangles, TT("Since the two triangles are congruent,")],
        [ LengthEqualityReason.parallelogram_opposite_sides, TT("Since the opposite sides of a parallelogram are equal in length,")],
        [ LengthEqualityReason.parallelogram_diagonal_bisection, TT("Since the diagonals of a parallelogram intersect at the midpoint,")],
        [ LengthEqualityReason.equivalence_class, TT("Since these two length symbols are equal to another length symbol,")],

        [ AngleEqualityReason.vertical_angles, TT("Since vertical angles are equal,")],
        [ AngleEqualityReason.parallel_lines, TT("Since the corresponding angles of parallel lines are equal,")],
        [ AngleEqualityReason.angle_bisector, TT("Since these angles are formed by the angle bisectors,")],
        [ AngleEqualityReason.congruent_triangles, TT("Since the two triangles are congruent,")],
        [ AngleEqualityReason.parallelogram_opposite_angles, TT("Since the diagonals of a parallelogram are congruent,")],
        [ AngleEqualityReason.similar_triangles, TT("Since the two triangles are similar,") ],

        [ ParallelogramReason.each_opposite_sides_are_equal, TT("Since each opposite sides are equal,")],
        [ ParallelogramReason.each_opposite_sides_are_parallel, TT("Since each opposite sides are parallel,")],
        [ ParallelogramReason.each_opposite_angles_are_equal, TT("Since each opposite angles are equal,")],
        [ ParallelogramReason.one_opposite_sides_are_parallel_and_equal, TT("Since one opposite sides are parallel and equal,")],
        [ ParallelogramReason.each_diagonal_bisections, TT("Since the diagonals intersect at their midpoints,")],

        [ RhombusReason.all_sides_are_equal, TT("Since all four sides are equal in length,")],

        [ ParallelReason.parallelogram, TT("Since the opposite sides of a parallelogram are parallel,") ],

        [ TriangleSimilarityReason.two_equal_angle_pairs, TT("Since both pairs of angles in two triangles are equal,")],

        [0 , TT("no reason")],
    ]);
}


export function reasonMsg(reason : number) : string {
    if(reasonMsgMap == undefined){
        reasonMsgMap = makeReasonMsgMap();
    }

    const text = reasonMsgMap.get(reason);
    if(text != undefined){
        return text;
    }

    throw new MyError();
}


}
