import { describe, expect, it } from 'vitest';
import { createFramebuffer, compositeSoftware, rasterizeTriangle, renderSoftware, SOFTWARE_PALETTE, softwareTime, softwareSize } from './software';
import { presentationAt, presentationCycle, presentationPhases, presentationTurn, sceneRotation } from './scene';

describe('software rasterizer', () => {
 it('resolves overlap by depth, regardless of submission order', () => {
  const a=createFramebuffer(8,8),b=createFramebuffer(8,8);
  const far=[[1,1,0.1],[7,1,0.1],[4,7,0.1]] as const;
  const near=[[1,1,0.2],[7,1,0.2],[4,7,0.2]] as const;
  rasterizeTriangle(a,...far,[30,40,50]);rasterizeTriangle(a,...near,[80,90,100]);
  rasterizeTriangle(b,...near,[80,90,100]);rasterizeTriangle(b,...far,[30,40,50]);
  expect(a.pixels).toEqual(b.pixels);
  expect([...a.pixels.slice((3*8+4)*4,(3*8+4)*4+4)]).toEqual([80,90,100,255]);
 });
 it('accepts both windings and clips triangles at framebuffer bounds', () => {
  const a=createFramebuffer(8,8),b=createFramebuffer(8,8);
  const p=[-10,-10,0.2] as const,q=[12,0,0.2] as const,r=[0,12,0.2] as const;
  rasterizeTriangle(a,p,q,r,[80,90,100]);rasterizeTriangle(b,r,q,p,[80,90,100]);
  expect(a.pixels).toEqual(b.pixels);
  expect(a.pixels.length).toBe(8*8*4);
  expect(a.depth.every(Number.isFinite)).toBe(true);
 });
 it('renders only its sixteen palette colors', () => {
  const frame=createFramebuffer(128,128);
  renderSoftware(frame,sceneRotation(0));
  const colors=new Set<string>();let covered=0;
  for(let i=0;i<frame.pixels.length;i+=4){colors.add([...frame.pixels.slice(i,i+3)].join(','));if(frame.depth[i/4]>0)covered++;}
  expect(covered).toBeGreaterThan(1000);
  expect(colors.size).toBeGreaterThan(5);
  expect(colors.size).toBeLessThanOrEqual(16);
  expect([...colors].every(c=>SOFTWARE_PALETTE.some(p=>p.join(',')===c))).toBe(true);
 });
 it('caps its image size while preserving the panel aspect ratio', () => {
  expect(softwareSize(720,900)).toEqual([256,320]);
  expect(softwareSize(1920,1080)).toEqual([320,180]);
 });
 it('samples a common clock at twelve frames per second', () => {
  expect(softwareTime(1.001)).toBe(1);
  expect(softwareTime(1.08)).toBe(1);
  expect(softwareTime(1.09)).toBeCloseTo(13/12);
 });
});

describe('synchronized reveal', () => {
 const {reveal,hold,rotate}=presentationPhases;
 it('sweeps from hidden to full while the pose stays still', () => {
  const start=presentationAt(0),finish=presentationAt(reveal*0.999);
  expect(start.reveal).toBe(0);
  expect(start.sweeping).toBe(true);
  expect(finish.reveal).toBeGreaterThan(0.99);
  expect(start.poseTime).toBe(finish.poseTime);
 });
 it('holds the full image, then turns before clearing', () => {
  const holdEnd=presentationAt(reveal+hold/2);
  const turning=presentationAt(reveal+hold+rotate/2);
  expect(holdEnd.reveal).toBe(1);
  expect(holdEnd.sweeping).toBe(false);
  expect(holdEnd.poseTime).toBe(0);
  expect(turning.poseTime).toBeCloseTo(presentationTurn/2);
  expect(turning.reveal).toBe(1);
 });
 it('carries the pose into the next reveal', () => {
  const clearing=presentationAt(presentationCycle-0.001);
  const next=presentationAt(presentationCycle);
  expect(clearing.material).toBeLessThan(0.01);
  expect(clearing.sweeping).toBe(false);
  expect(next.reveal).toBe(0);
  expect(next.poseTime).toBe(clearing.poseTime);
 });
});

describe('shared orientation', () => {
 it('preserves lengths and orthogonal axes', () => {
  for(const t of [0,2,100]) {
   const m=sceneRotation(t);
   for(const start of [0,4,8]) expect(Math.hypot(...m.slice(start,start+3))).toBeCloseTo(1,8);
   expect(m[0]*m[4]+m[1]*m[5]+m[2]*m[6]).toBeCloseTo(0,8);
  }
 });
});


describe('material presentation',()=>{
 it('keeps wireframe visible before the sweep and preserves the final image',()=>{
  const solid=createFramebuffer(128,128),wire=createFramebuffer(128,128),out=createFramebuffer(128,128);
  renderSoftware(solid,sceneRotation(0));renderSoftware(wire,sceneRotation(0),true);
  expect(wire.pixels).not.toEqual(solid.pixels);
  expect(wire.pixels.some((v,i)=>i%4===0&&v>5)).toBe(true);
  compositeSoftware(out,solid,wire,-0.1,1);expect(out.pixels).toEqual(wire.pixels);
  compositeSoftware(out,solid,wire,1.1,1);expect(out.pixels).toEqual(solid.pixels);
  compositeSoftware(out,solid,wire,1,0);expect(out.pixels).toEqual(wire.pixels);
 });
});
