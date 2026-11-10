export type Point=[number,number];
export function nextStage(stage:number,direction:number){return Math.max(0,Math.min(4,stage+direction));}
export function normalizePointer(x:number,y:number,width:number,height:number):Point {
 const clamp=(value:number)=>Math.max(-1,Math.min(1,value));
 return [clamp(x/Math.max(width,1)*2-1),clamp(1-y/Math.max(height,1)*2)];
}
