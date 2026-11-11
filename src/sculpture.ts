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
  const radius = 0.255 * (1 + 0.12 * Math.cos(a * 3));
  return center.map((p, i) => p + radius * (normal[i]*Math.cos(twist) + binormal[i]*Math.sin(twist)*0.88)) as Vec3;
}

export function buildSculpture(segments = 128, sides = 48): Float32Array {
  const points = new Float32Array((segments+1)*(sides+1)*8);
  for(let x=0;x<=segments;x++) for(let y=0;y<=sides;y++) {
    const u=x/segments, v=y/sides, e=0.0001;
    const p=sculpturePoint(u,v), pu=sculpturePoint(u+e,v), mu=sculpturePoint(u-e,v);
    const pv=sculpturePoint(u,v+e), mv=sculpturePoint(u,v-e);
    const n=normalize(cross(pv.map((n,i)=>n-mv[i]) as Vec3,pu.map((n,i)=>n-mu[i]) as Vec3));
    points.set([...p,...n,u,v],(x*(sides+1)+y)*8);
  }
  const data=new Float32Array(segments*sides*6*8);
  let offset=0;
  for(let x=0;x<segments;x++) for(let y=0;y<sides;y++) {
    const a=x*(sides+1)+y,b=(x+1)*(sides+1)+y;
    for(const index of [a,a+1,b,b,a+1,b+1]) {
      data.set(points.subarray(index*8,index*8+8),offset);offset+=8;
    }
  }
  return data;
}


export function buildShadingGeometry():Float32Array {
  const mesh=buildSculpture();
  const data=new Float32Array(mesh.length/8*14);
  for(let i=0,j=0;i<mesh.length;i+=8,j+=14){
    const u=mesh[i+6],v=mesh[i+7],e=0.0001;
    const before=sculpturePoint(u-e,v),after=sculpturePoint(u+e,v);
    const n:Vec3=[mesh[i+3],mesh[i+4],mesh[i+5]];
    const derivative=after.map((p,k)=>p-before[k]) as Vec3;
    const dot=derivative.reduce((sum,p,k)=>sum+p*n[k],0);
    const t=normalize(derivative.map((p,k)=>p-dot*n[k]) as Vec3);
    const b=cross(n,t);
    data.set(mesh.subarray(i,i+8),j);data.set(t,j+8);data.set(b,j+11);
  }
  return data;
}
