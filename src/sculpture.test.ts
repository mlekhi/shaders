import { describe, expect, it } from 'vitest';
import { buildSculpture, sculpturePoint } from './sculpture';

describe('closed sculpture', () => {
 it('joins both parameter seams', () => {
  for (const t of [0, 0.17, 0.5, 0.93, 1]) {
   sculpturePoint(0,t).forEach((v,i)=>expect(v).toBeCloseTo(sculpturePoint(1,t)[i],5));
   sculpturePoint(t,0).forEach((v,i)=>expect(v).toBeCloseTo(sculpturePoint(t,1)[i],5));
  }
 });
 it('points normals away from the tube center', () => {
  const mesh=buildSculpture(32,16);
  for(let i=0;i<mesh.length;i+=8){
   const a=mesh[i+6]*Math.PI*2;
   const center=[.44*(Math.sin(a)+2*Math.sin(2*a)),.44*(Math.cos(a)-2*Math.cos(2*a)),-.44*Math.sin(3*a)];
   const outward=center.reduce((sum,c,k)=>sum+(mesh[i+k]-c)*mesh[i+3+k],0);
   expect(outward).toBeGreaterThan(0);
  }
 });
 it('produces finite triangles with unit normals', () => {
  const mesh=buildSculpture(32,16);
  expect(mesh.length).toBe(32*16*6*8);
  expect(mesh.every(Number.isFinite)).toBe(true);
  for(let i=0;i<mesh.length;i+=8) expect(Math.hypot(mesh[i+3],mesh[i+4],mesh[i+5])).toBeCloseTo(1,4);
 });
});
