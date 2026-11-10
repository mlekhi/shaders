type Vec3 = [number, number, number];
const TAU = Math.PI * 2;
const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v);
  return v.map(n => n / length) as Vec3;
};
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];

export function sculpturePoint(u: number, v: number): Vec3 {
  const a = u * TAU, b = v * TAU;
  const center: Vec3 = [0.44*(Math.sin(a)+2*Math.sin(2*a)), 0.44*(Math.cos(a)-2*Math.cos(2*a)), -0.44*Math.sin(3*a)];
  const tangent = normalize([Math.cos(a)+4*Math.cos(2*a), -Math.sin(a)+4*Math.sin(2*a), -3*Math.cos(3*a)]);
  const normal = normalize([tangent[1], -tangent[0], 0]);
  const binormal = cross(tangent, normal);
  const twist = b + a * 3;
  const radius = 0.255 * (1 + 0.12 * Math.cos(a * 3)) + 0.013 * Math.cos(b * 12 + a * 18);
  return center.map((p, i) => p + radius * (normal[i]*Math.cos(twist) + binormal[i]*Math.sin(twist)*0.88)) as Vec3;
}

export function buildSculpture(segments = 384, sides = 96): Float32Array {
  const points = new Float32Array((segments+1)*(sides+1)*8);
  for(let x=0;x<=segments;x++) for(let y=0;y<=sides;y++) {
    const u=x/segments, v=y/sides, e=0.0001;
    const p=sculpturePoint(u,v), pu=sculpturePoint(u+e,v), mu=sculpturePoint(u-e,v);
    const pv=sculpturePoint(u,v+e), mv=sculpturePoint(u,v-e);
    const n=normalize(cross(pu.map((n,i)=>n-mu[i]) as Vec3,pv.map((n,i)=>n-mv[i]) as Vec3));
    points.set([...p,...n,u,v],(x*(sides+1)+y)*8);
  }
  const data=new Float32Array(segments*sides*6*8);
  let offset=0;
  for(let x=0;x<segments;x++) for(let y=0;y<sides;y++) {
    const a=x*(sides+1)+y,b=(x+1)*(sides+1)+y;
    for(const index of [a,b,a+1,b,b+1,a+1]) {
      data.set(points.subarray(index*8,index*8+8),offset);offset+=8;
    }
  }
  return data;
}

export function revealPosition(time: number, pointer: number | null, reduced: boolean): number {
  return pointer === null ? (reduced ? 0.5 : 0.5 + 0.28*Math.sin(time*0.19)) : Math.max(0,Math.min(1,pointer));
}
