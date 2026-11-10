// Interpolate rendering treatments without dimming the object.
export function sceneFrame(from:number,to:number,elapsed:number,duration=1200){
 const t=duration<=0?1:Math.max(0,Math.min(1,elapsed/duration));
 const eased=t*t*(3-2*t);
 return {stage:from+(to-from)*eased,opacity:1};
}
