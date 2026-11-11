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

/*
 * shared presentation timeline: the scan bar reveals a held pose,
 * then both views turn through the next slice of scene time.
 */
export const presentationPhases={
  reveal:5,
  hold:1.5,
  rotate:3,
  clear:1.8,
} as const;
export const presentationCycle=presentationPhases.reveal+presentationPhases.hold+presentationPhases.rotate+presentationPhases.clear;
export const presentationTurn=8;

export type Presentation={reveal:number;poseTime:number;sweeping:boolean;material:number};

export function presentationAt(time: number): Presentation {
  const t=Math.max(0,Number.isFinite(time)?time:0);
  const cycle=Math.floor(t/presentationCycle);
  const local=t-cycle*presentationCycle;
  const basePose=cycle*presentationTurn;
  const revealEnd=presentationPhases.reveal;
  const holdEnd=revealEnd+presentationPhases.hold;
  const rotateEnd=holdEnd+presentationPhases.rotate;
  if(local<revealEnd) return {reveal:(local/revealEnd)**2*(3-2*local/revealEnd),poseTime:basePose,sweeping:true,material:1};
  if(local<holdEnd) return {reveal:1,poseTime:basePose,sweeping:false,material:1};
  if(local<rotateEnd){
    const progress=(local-holdEnd)/presentationPhases.rotate;
    return {reveal:1,poseTime:basePose+progress*progress*(3-2*progress)*presentationTurn,sweeping:false,material:1};
  }
  const progress=(local-rotateEnd)/presentationPhases.clear;
  return {reveal:1,poseTime:basePose+presentationTurn,sweeping:false,material:1-progress*progress*(3-2*progress)};
}

export function transformPoint(p: Point3, m: readonly number[]): Point3 {
  return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2],m[1]*p[0]+m[5]*p[1]+m[9]*p[2],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]];
}

export function cameraFocal(aspect: number): number {
  return Math.min(2.9,aspect*2.7);
}
