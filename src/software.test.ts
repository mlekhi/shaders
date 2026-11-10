import { describe, expect, it } from 'vitest';
import { createFramebuffer, rasterizeTriangle, renderSoftware, SOFTWARE_PALETTE, softwareTime, softwareSize } from './software';
import { sceneRotation } from './scene';

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

describe('shared orientation', () => {
 it('preserves lengths and orthogonal axes', () => {
  for(const t of [0,2,100]) {
   const m=sceneRotation(t);
   for(const start of [0,4,8]) expect(Math.hypot(...m.slice(start,start+3))).toBeCloseTo(1,8);
   expect(m[0]*m[4]+m[1]*m[5]+m[2]*m[6]).toBeCloseTo(0,8);
  }
 });
});
