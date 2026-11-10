import { describe, expect, it } from 'vitest';
import { buildSculpture, sculpturePoint, revealPosition } from './sculpture';

describe('closed sculpture', () => {
 it('joins both parameter seams', () => {
  for (const t of [0, 0.17, 0.5, 0.93, 1]) {
   sculpturePoint(0,t).forEach((v,i)=>expect(v).toBeCloseTo(sculpturePoint(1,t)[i],5));
   sculpturePoint(t,0).forEach((v,i)=>expect(v).toBeCloseTo(sculpturePoint(t,1)[i],5));
  }
 });
 it('produces finite triangles with unit normals', () => {
  const mesh=buildSculpture(32,16);
  expect(mesh.length).toBe(32*16*6*8);
  expect(mesh.every(Number.isFinite)).toBe(true);
  for(let i=0;i<mesh.length;i+=8) expect(Math.hypot(mesh[i+3],mesh[i+4],mesh[i+5])).toBeCloseTo(1,4);
 });
});
describe('reveal', () => {
 it('keeps the automatic reveal on the sculpture', () => {
  for(let t=0;t<200;t+=0.5) {expect(revealPosition(t,null,false)).toBeGreaterThanOrEqual(0.22);expect(revealPosition(t,null,false)).toBeLessThanOrEqual(0.78);}
 });
 it('freezes automatic motion but preserves explicit input', () => {
  expect(revealPosition(0,null,true)).toBe(revealPosition(99,null,true));
  expect(revealPosition(99,0.8,true)).toBe(0.8);
 });
 it('clamps pointer and keyboard input to the viewport', () => {
  expect(revealPosition(0,-1,false)).toBe(0);
  expect(revealPosition(0,2,false)).toBe(1);
 });
});
