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

/* the reveal is illustrative; the shared orientation never pauses. */
export const presentationCycle=16;
export type Presentation={reveal:number;poseTime:number;material:number};
export function presentationAt(time:number):Presentation {
  const t=Math.max(0,Number.isFinite(time)?time:0);
  const local=t%presentationCycle;
  const ease=(x:number)=>x*x*(3-2*x);
  if(local<1)return {reveal:0,poseTime:t,material:1};
  if(local<7)return {reveal:ease((local-1)/6),poseTime:t,material:1};
  if(local<13)return {reveal:1,poseTime:t,material:1};
  return {reveal:1,poseTime:t,material:1-ease((local-13)/3)};
}

export function transformPoint(p: Point3, m: readonly number[]): Point3 {
  return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2],m[1]*p[0]+m[5]*p[1]+m[9]*p[2],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]];
}

export function cameraFocal(aspect: number): number {
  return Math.min(2.9,aspect*3.0);
}
