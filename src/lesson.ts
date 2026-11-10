import { buildOrbGeometry } from './orb';
export type V3=[number,number,number];
export type Triangle=[V3,V3,V3];
export const inspectionMesh=buildOrbGeometry(24,16);
export function triangleAt(id:number):Triangle {
 return [0,1,2].map(i=>Array.from(inspectionMesh.slice(id*24+i*8,id*24+i*8+3)) as V3) as Triangle;
}
export function project(p:V3,yaw:number,pitch:number,aspect:number):V3 {
 const x=p[0]*Math.cos(yaw)+p[2]*Math.sin(yaw),z=-p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
 const y=p[1]*Math.cos(pitch)-z*Math.sin(pitch),zz=p[1]*Math.sin(pitch)+z*Math.cos(pitch),depth=3.6-zz;
 const focal=Math.min(1.95,aspect*2.5);
 return [0.5+x*focal/aspect/depth/2,0.5-(y*focal/depth+0.07)/2,depth];
}
export function barycentric(p:number[],t:number[][]){
 const [a,b,c]=t,d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
 if(Math.abs(d)<1e-10)return [-1,-1,-1];
 const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/d;
 const v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/d;
 return [u,v,1-u-v];
}
export function pickTriangle(x:number,y:number,yaw:number,pitch:number,aspect:number){
 let selected=-1,depth=Infinity;
 for(let id=0;id<inspectionMesh.length/24;id++){
  const t=triangleAt(id).map(p=>project(p,yaw,pitch,aspect)),w=barycentric([x,y],t);
  const d=1/w.reduce((sum,v,i)=>sum+v/t[i][2],0);
  if(w.every(v=>v>=0)&&d<depth){depth=d;selected=id;}
 }
 return selected;
}
export function fitTriangle(t:Triangle,yaw=0.55,pitch=-0.12):number[][]{
 const a=t.map(p=>project(p,yaw,pitch,1));
 const xs=a.map(p=>p[0]),ys=a.map(p=>p[1]);
 const size=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),0.001);
 const cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;
 return a.map(p=>[0.5+(p[0]-cx)/size*0.78,0.5+(p[1]-cy)/size*0.78]);
}
