import { expect,it } from 'vitest';
import { barycentric,fitTriangle,project,triangleAt,pickTriangle } from './lesson';
it('distinguishes covered samples from uncovered samples',()=>{
 const t=[[0,0],[1,0],[0,1]];
 expect(barycentric([0.25,0.25],t)).toEqual([0.5,0.25,0.25]);
 expect(barycentric([0.9,0.9],t).some(n=>n<0)).toBe(true);
});
it('camera movement changes projected positions',()=>{
 expect(project([0.5,0.2,0.3],0,-0.12,1)).not.toEqual(project([0.5,0.2,0.3],1,-0.12,1));
});
it('picks a visible triangle and fits it into the raster grid',()=>{
 const id=pickTriangle(0.5,0.5,0.55,-0.12,1);
 expect(id).toBeGreaterThanOrEqual(0);
 const t=fitTriangle(triangleAt(id));expect(t.flat().every(n=>n>=0.1&&n<=0.9)).toBe(true);
});
