import { expect,it } from 'vitest';
import { buildOrbUV,sculptPoint } from './orb';
it('builds complete triangles with finite, normalized UV coordinates',()=>{
 const data=buildOrbUV(32,24);
 expect(data.length).toBe(32*24*6*2);
 expect([...data].every(n=>Number.isFinite(n)&&n>=0&&n<=1)).toBe(true);
});
it('closes the sculpted surface at the longitude seam',()=>{
 for(let i=0;i<=20;i++){
  const a=sculptPoint(0,i/20),b=sculptPoint(1,i/20);
  a.forEach((n,j)=>expect(n).toBeCloseTo(b[j],7));
 }
});
it('keeps a spherical envelope while adding shallow fluid ridges',()=>{
 const radii=[];
 for(let i=1;i<24;i++)for(let j=0;j<32;j++){
  const p=sculptPoint(j/32,i/24);
  expect(p.every(Number.isFinite)).toBe(true);
  const radius=Math.hypot(...p);expect(radius).toBeGreaterThan(0.94);expect(radius).toBeLessThan(1.08);radii.push(radius);
 }
 expect(Math.max(...radii)-Math.min(...radii)).toBeGreaterThan(0.05);
 expect(Math.max(...radii)-Math.min(...radii)).toBeLessThan(0.13);
});

it('packs renderable positions, unit normals and UVs for every vertex', async()=>{
 const { buildOrbGeometry }=await import('./orb');
 const data=buildOrbGeometry(32,24);
 expect(data.length).toBe(32*24*6*8);
 for(let i=0;i<data.length;i+=8){
  expect([...data.slice(i,i+8)].every(Number.isFinite)).toBe(true);
  expect(Math.hypot(data[i+3],data[i+4],data[i+5])).toBeCloseTo(1,5);
 }
});

it('computes continuous surface normals that match the sculpted geometry', async()=>{
 const { sculptNormal }=await import('./orb');
 const e=0.00001;
 for(const [u,v] of [[0.13,0.2],[0.4,0.33],[0.7,0.55],[0.91,0.76]]){
  const a=sculptPoint(u+e,v),b=sculptPoint(u-e,v),c=sculptPoint(u,v+e),d=sculptPoint(u,v-e);
  const du=a.map((n,i)=>n-b[i]),dv=c.map((n,i)=>n-d[i]);
  const cross=[du[1]*dv[2]-du[2]*dv[1],du[2]*dv[0]-du[0]*dv[2],du[0]*dv[1]-du[1]*dv[0]];
  const len=Math.hypot(...cross),normal=sculptNormal(u,v);
  normal.forEach((n,i)=>expect(n).toBeCloseTo(cross[i]/len,5));
 }
});

it('keeps continuous normals finite at the poles and across the UV seam', async()=>{
 const { sculptNormal }=await import('./orb');
 for(const v of [0,0.2,0.5,0.8,1]){
  const a=sculptNormal(0,v),b=sculptNormal(1,v);
  expect(a.every(Number.isFinite)).toBe(true);
  expect(Math.hypot(...a)).toBeCloseTo(1,7);
  a.forEach((n,i)=>expect(n).toBeCloseTo(b[i],7));
 }
});
