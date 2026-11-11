import { describe, expect, it } from 'vitest';
import { buildNormalMap, tangentNormal } from './normalMap';
import { presentationAt, presentationCycle, sceneRotation, showcaseAt } from './scene';

describe('normal map',()=>{
 it('stores unit tangent-space normals without changing the mesh',()=>{
  for(const u of [0,0.15,0.38,0.9])for(const v of [0,0.23,0.7]){
   const n=tangentNormal(u,v);
   expect(Math.hypot(...n)).toBeCloseTo(1,8);
   expect(n[2]).toBeGreaterThan(0);
  }
 });
 it('tiles without a normal discontinuity',()=>{
  for(const t of [0,0.13,0.54]){
   tangentNormal(0,t).forEach((n,i)=>expect(n).toBeCloseTo(tangentNormal(1,t)[i],7));
   tangentNormal(t,0).forEach((n,i)=>expect(n).toBeCloseTo(tangentNormal(t,1)[i],7));
  }
 });
 it('encodes an opaque linear rgb normal texture',()=>{
  const pixels=buildNormalMap(32);
  expect(pixels.length).toBe(32*32*4);
  for(let i=0;i<pixels.length;i+=4){expect(pixels[i+2]).toBeGreaterThan(127);expect(pixels[i+3]).toBe(255);}
 });
});
describe('shared animation',()=>{
 it('keeps rotating during every presentation phase',()=>{
  for(let t=0;t<presentationCycle;t+=0.4){
   expect(presentationAt(t+0.1).poseTime).toBeGreaterThan(presentationAt(t).poseTime);
  }
 });
 it('does not jump orientation at the loop boundary',()=>{
  expect(presentationAt(presentationCycle).poseTime-presentationAt(presentationCycle-0.001).poseTime).toBeCloseTo(0.001);
 });
 it('preserves orthogonal unit axes',()=>{
  const m=sceneRotation(23);
  for(const start of [0,4,8])expect(Math.hypot(...m.slice(start,start+3))).toBeCloseTo(1,8);
  expect(m[0]*m[4]+m[1]*m[5]+m[2]*m[6]).toBeCloseTo(0,8);
 });
});

describe('light and surface study',()=>{
 it('sweeps continuously through both extremes without a hold',()=>{
  expect(showcaseAt(0).lightX).toBeCloseTo(-3.5);
  expect(showcaseAt(7).lightX).toBeCloseTo(3.5);
  expect(showcaseAt(14).lightX).toBeCloseTo(-3.5);
  for(const turn of [7,14,21,28]){
   expect(showcaseAt(turn-0.1).lightX).not.toBe(showcaseAt(turn).lightX);
   expect(showcaseAt(turn+0.1).lightX).not.toBe(showcaseAt(turn).lightX);
  }
 });
 it('holds the shared pose while surface ripples continue',()=>{
  expect(showcaseAt(21).poseTime).toBe(showcaseAt(18).poseTime);
  expect(showcaseAt(21).flow).toBeGreaterThan(showcaseAt(18).flow);
  expect(showcaseAt(9).detail).toBe(0);
  expect(showcaseAt(18).detail).toBe(1);
 });
 it('resumes motion and crosses the cycle without a pose jump',()=>{
  expect(showcaseAt(24).poseTime).toBeGreaterThan(showcaseAt(23).poseTime);
  expect(showcaseAt(28).poseTime-showcaseAt(27.999).poseTime).toBeCloseTo(.001);
 });
});
