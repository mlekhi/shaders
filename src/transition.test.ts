import { expect,it } from 'vitest';
import { sceneFrame } from './transition';
it('moves continuously between treatments at full brightness',()=>{
 expect(sceneFrame(0,4,0)).toEqual({stage:0,opacity:1});
 expect(sceneFrame(0,4,600)).toEqual({stage:2,opacity:1});
 expect(sceneFrame(0,4,1200)).toEqual({stage:4,opacity:1});
});
it('starts a reversal from the currently visible treatment',()=>{
 const current=sceneFrame(0,4,400).stage;
 expect(sceneFrame(current,0,0).stage).toBe(current);
 expect(sceneFrame(current,0,1200).stage).toBe(0);
});
it('respects reduced motion and clamps elapsed time',()=>{
 expect(sceneFrame(1,4,0,0)).toEqual({stage:4,opacity:1});
 expect(sceneFrame(1,4,-100).stage).toBe(1);
 expect(sceneFrame(1,4,2000).stage).toBe(4);
});
