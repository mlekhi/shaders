import { sculpturePoint } from './sculpture';
import { cameraFocal, transformPoint, type Point3 } from './scene';

type Color = readonly [number, number, number];
export type Framebuffer = {width:number;height:number;pixels:Uint8ClampedArray<ArrayBuffer>;depth:Float32Array};
export const SOFTWARE_PALETTE: Color[] = [
  [5,8,14],
  ...Array.from({length:15},(_,i):Color=>[Math.round(27+i*11),Math.round(38+i*11.2),Math.round(47+i*11.3)]),
];

export function softwareSize(width: number,height: number): [number,number] {
  const scale=320/Math.max(1,width,height);
  return [Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale))];
}

export const softwareTime = (time: number): number => Math.floor(time*12)/12;

export function createFramebuffer(width: number,height: number): Framebuffer {
  return {width,height,pixels:new Uint8ClampedArray(width*height*4),depth:new Float32Array(width*height)};
}

function edge(a: Point3,b: Point3,x: number,y: number): number {
  return (x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]);
}

export function rasterizeTriangle(frame: Framebuffer,a: Point3,b: Point3,c: Point3,color: Color): void {
  const area=edge(a,b,c[0],c[1]);
  if(Math.abs(area)<0.00001) return;
  const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));
  const maxX=Math.min(frame.width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
  const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));
  const maxY=Math.min(frame.height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
  for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
    const wa=edge(b,c,x+0.5,y+0.5)/area;
    const wb=edge(c,a,x+0.5,y+0.5)/area;
    const wc=1-wa-wb;
    if(wa<0||wb<0||wc<0) continue;
    const depth=wa*a[2]+wb*b[2]+wc*c[2];
    const index=y*frame.width+x;
    if(depth<=frame.depth[index]) continue;
    frame.depth[index]=depth;
    const offset=index*4;
    frame.pixels[offset]=color[0];frame.pixels[offset+1]=color[1];frame.pixels[offset+2]=color[2];frame.pixels[offset+3]=255;
  }
}

/*
 * the coarse mesh shares the exact parametric shape with the gpu version.
 * only positions are retained: lighting uses one normal per triangle.
 */
const segments=48,sides=8;
const vertices: Point3[]=[];
const triangles: [number,number,number][]=[];
for(let x=0;x<segments;x++) for(let y=0;y<sides;y++) vertices.push(sculpturePoint(x/segments,y/sides));
for(let x=0;x<segments;x++) for(let y=0;y<sides;y++) {
  const a=x*sides+y,b=((x+1)%segments)*sides+y,c=x*sides+(y+1)%sides,d=((x+1)%segments)*sides+(y+1)%sides;
  triangles.push([a,b,c],[b,d,c]);
}

export function renderSoftware(frame: Framebuffer,pose: readonly number[]): void {
  frame.depth.fill(0);
  const background=SOFTWARE_PALETTE[0];
  for(let i=0;i<frame.pixels.length;i+=4) {
    frame.pixels[i]=background[0];frame.pixels[i+1]=background[1];frame.pixels[i+2]=background[2];frame.pixels[i+3]=255;
  }
  const aspect=frame.width/frame.height,focal=cameraFocal(aspect);
  const world=vertices.map(p=>transformPoint(p,pose));
  const projected=world.map(([x,y,z]):Point3=>{
    const depth=5.1-z;
    return [(x*focal/aspect/depth*0.5+0.5)*frame.width,(0.5-y*focal/depth*0.5)*frame.height,1/depth];
  });
  for(const [ai,bi,ci] of triangles) {
    const a=world[ai],b=world[bi],c=world[ci];
    const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
    const ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    let nx=ab[1]*ac[2]-ab[2]*ac[1],ny=ab[2]*ac[0]-ab[0]*ac[2],nz=ab[0]*ac[1]-ab[1]*ac[0];
    const length=Math.hypot(nx,ny,nz);
    if(length<0.000001) continue;
    nx/=length;ny/=length;nz/=length;
    if(nx*(-a[0])+ny*(-a[1])+nz*(5.1-a[2])<0){nx=-nx;ny=-ny;nz=-nz;}
    const diffuse=Math.max(0,(-nx*0.4+ny*0.6+nz)/Math.sqrt(1.52));
    const shade=1+Math.round((0.12+0.88*diffuse)*14);
    rasterizeTriangle(frame,projected[ai],projected[bi],projected[ci],SOFTWARE_PALETTE[shade]);
  }
}
