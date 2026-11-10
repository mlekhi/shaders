import { expect,it } from 'vitest';
import { nextStage,normalizePointer } from './pipeline';
it('steps through five stages without wrapping at either end',()=>{
 expect(nextStage(0,-1)).toBe(0);expect(nextStage(4,1)).toBe(4);expect(nextStage(2,1)).toBe(3);
});
it('maps pointer position to bounded lighting coordinates',()=>{
 expect(normalizePointer(50,25,100,100)).toEqual([0,0.5]);
 expect(normalizePointer(-20,120,100,100)).toEqual([-1,-1]);
 expect(normalizePointer(0,0,0,0).every(Number.isFinite)).toBe(true);
});
