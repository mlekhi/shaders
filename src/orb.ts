// unindexed UV triangles keep the vertex layout small; the GPU sculpts the surface.
export function buildOrbUV(longitudes=256,latitudes=192):Float32Array {
 const data=new Float32Array(longitudes*latitudes*6*2);
 let offset=0;
 for(let y=0;y<latitudes;y++)for(let x=0;x<longitudes;x++){
  const a=x/longitudes,b=y/latitudes,c=(x+1)/longitudes,d=(y+1)/latitudes;
  data.set([a,b,c,b,a,d,c,b,c,d,a,d],offset);offset+=12;
 }
 return data;
}
export function sculptPoint(u:number,v:number):[number,number,number]{
 const theta=v*Math.PI,phi=u*Math.PI*2;
 const x=Math.sin(theta)*Math.cos(phi),y=Math.cos(theta),z=Math.sin(theta)*Math.sin(phi);
 // warp the bands across the sphere, rather than pulling its body into fins.
 const flow=y+0.30*Math.sin(x*2.2+z*1.4)*Math.sin(z*2.4-y*0.8);
 const band=18*flow+2.8*Math.sin(z*2.3-x*1.5);
 const crest=Math.pow(0.5+0.5*Math.sin(band),4);
 const r=0.98+0.055*crest+0.018*Math.sin(flow*5+z*2.0);
 return [x*r,y*r,z*r];
}

export function buildOrbGeometry(longitudes=256,latitudes=192):Float32Array {
 const uv=buildOrbUV(longitudes,latitudes);
 const data=new Float32Array(uv.length/2*8);
 for(let i=0;i<uv.length;i+=2){
  const u=uv[i],v=uv[i+1],p=sculptPoint(u,v),n=sculptNormal(u,v);
  data.set([...p,...n,u,v],i/2*8);
 }
 return data;
}

export function sculptNormal(u:number,v:number):[number,number,number]{
 const theta=v*Math.PI,phi=u*Math.PI*2;
 const n=[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];
 const [x,y,z]=n;
 const a=x*2.2+z*1.4,b=z*2.4-y*0.8,c=z*2.3-x*1.5;
 const sa=Math.sin(a),ca=Math.cos(a),sb=Math.sin(b),cb=Math.cos(b);
 const flow=y+0.30*sa*sb;
 const gradFlow=[0.66*ca*sb,1-0.24*sa*cb,0.30*(1.4*ca*sb+2.4*sa*cb)];
 const band=18*flow+2.8*Math.sin(c),crest=0.5+0.5*Math.sin(band);
 const gradBand=gradFlow.map((value,i)=>18*value+2.8*Math.cos(c)*[-1.5,0,2.3][i]);
 const radius=0.98+0.055*crest**4+0.018*Math.sin(flow*5+z*2);
 const grad=gradBand.map((value,i)=>0.11*crest**3*Math.cos(band)*value+0.018*Math.cos(flow*5+z*2)*(5*gradFlow[i]+(i===2?2:0)));
 const radial=grad.reduce((sum,value,i)=>sum+value*n[i],0);
 const normal=n.map((value,i)=>value-(grad[i]-value*radial)/radius);
 const length=Math.hypot(...normal);
 return normal.map(value=>value/length) as [number,number,number];
}
