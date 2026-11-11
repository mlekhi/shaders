export type Point3 = readonly [number, number, number];

export function sceneRotation(time: number): number[] {
  const a=0.26+Math.sin(time*0.11)*0.32;
  const b=-0.32+Math.sin(time*0.08)*0.12;
  const c=-0.18+time*0.035;
  const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cc=Math.cos(c),sc=Math.sin(c);
  return [
    ca*cc-sa*sb*sc,ca*sc+sa*sb*cc,-sa*cb,0,
    -cb*sc,cb*cc,sb,0,
    sa*cc+ca*sb*sc,sa*sc-ca*sb*cc,ca*cb,0,
    0,0,0,1,
  ];
}

/* shared choreography: reveal, light pass, surface study, then resume. */
export const presentationCycle=28;
export type Presentation={reveal:number;poseTime:number;material:number};
export function presentationAt(time:number):Presentation {
  const t=Math.max(0,Number.isFinite(time)?time:0);
  const local=t%presentationCycle;
  const ease=(x:number)=>x*x*(3-2*x);
  if(local<1)return {reveal:0,poseTime:t,material:1};
  if(local<7)return {reveal:ease((local-1)/6),poseTime:t,material:1};
  if(local<25)return {reveal:1,poseTime:t,material:1};
  return {reveal:1,poseTime:t,material:1-ease((local-25)/3)};
}

export function transformPoint(p: Point3, m: readonly number[]): Point3 {
  return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2],m[1]*p[0]+m[5]*p[1]+m[9]*p[2],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]];
}

export function cameraFocal(aspect: number): number {
  return Math.min(2.9,aspect*3.0);
}

export function showcaseAt(time:number) {
  const t=Math.max(0,Number.isFinite(time)?time:0);
  const local=t%presentationCycle;
  const smooth=(a:number,b:number)=>{const x=Math.max(0,Math.min(1,(local-a)/(b-a)));return x*x*(3-2*x);};
  // Integral of the eased stop/resume velocity; continuous across cycles.
  const rampIntegral=(x:number)=>x-x*x*x+0.5*x*x*x*x;
  let poseLocal=local;
  if(local>=16&&local<17)poseLocal=16+rampIntegral(local-16);
  else if(local>=17&&local<22)poseLocal=16.5;
  else if(local>=22&&local<23){const x=local-22;poseLocal=16.5+x-rampIntegral(x);}
  else if(local>=23)poseLocal=local-6;
  return {
    poseTime:Math.floor(t/presentationCycle)*(presentationCycle-6)+poseLocal,
    lightX:-3.5+7*smooth(7,17)-7*smooth(23,28),
    detail:smooth(10,16),
    flow:Math.max(0,local-16)*0.035,
  };
}
