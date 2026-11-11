/*
 * a baked, periodic height field supplies tangent-space normals.
 * the texture changes lighting only; both views share one vertex buffer.
 */
export function tangentNormal(u:number,v:number):[number,number,number] {
  const a=2*Math.PI*u,b=2*Math.PI*v;
  // Parallel engraved channels; fixed in the surface's UV coordinates.
  const phase=10*b+2*a;
  const slope=Math.sin(phase)*Math.pow((1+Math.cos(phase))*0.5,5);
  const x=-0.16*slope;
  const y=-1.4*slope;
  const length=Math.hypot(x,y,1);
  return [x/length,y/length,1/length];
}

export function buildNormalMap(size=512):Uint8Array<ArrayBuffer> {
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const normal=tangentNormal((x+0.5)/size,(y+0.5)/size);
    const i=(y*size+x)*4;
    data[i]=Math.round((normal[0]*0.5+0.5)*255);
    data[i+1]=Math.round((normal[1]*0.5+0.5)*255);
    data[i+2]=Math.round((normal[2]*0.5+0.5)*255);
    data[i+3]=255;
  }
  return data;
}
