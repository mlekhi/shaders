import { useEffect,useRef,useState } from 'react';
import { init,draw as createDraw,surface,frame,type Gpu } from 'vgpu';
import shader from './shaders/orb.wgsl';
import { buildOrbGeometry } from './orb';
import { sceneFrame } from './transition';
import { normalizePointer,type Point } from './pipeline';
export type PipelineSettings={stage:number;assembly:number;camera:Point;material:number;roughness:number;film:number;depth:boolean;transparent:boolean;resolution:number};
type Props={settings:PipelineSettings;retry:number;onPick:(point:Point,aspect:number)=>void;onStatus:(s:'loading'|'ready'|'error')=>void};
export default function ShaderCanvas({settings,retry,onPick,onStatus}:Props){
 const canvasRef=useRef<HTMLCanvasElement>(null),live=useRef({settings,onStatus});
 const pointer=useRef<Point>([-0.4667,0.5333]);const pointerActive=useRef(false);const [error,setError]=useState(false);
 useEffect(()=>{live.current={settings,onStatus};});
 useEffect(()=>{
  let canceled=false,raf=0;let gpu:Gpu|undefined;
  const canvas=canvasRef.current!;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');setError(false);live.current.onStatus('loading');
  const fail=(cause:unknown)=>{if(canceled)return;console.error(cause);setError(true);live.current.onStatus('error');cancelAnimationFrame(raf);};
  async function start(){try{
   gpu=await init();if(canceled){gpu.dispose();return;}
   gpu.onError(fail);gpu.lost.then(info=>{if(!canceled&&info.reason!=='destroyed')fail(info.message);});
   const target=surface(gpu,canvas,{dpr:[1,1.5],depth:true,msaa:4,clearColor:[0,0,0,1]});
   const mouse:Point=[...pointer.current];
   let displayed=live.current.settings.stage,destination=displayed,from=displayed;
   let transitionStart=performance.now(),opacity=1,hover=0;
   const params=()=>{const s=live.current.settings;return {resolution:target.size,mouse,progress:1,hover,sceneOpacity:opacity,rasterResolution:s.resolution,camera:s.camera,lesson:displayed,assembly:s.assembly,material:s.material,roughness:s.roughness,filmAmount:s.film,transparent:s.transparent?Math.max(0,Math.min(1,displayed-3)):0};};
   const geometry=(data:Float32Array)=>{
    const buffer=gpu!.gpu.createBuffer({size:data.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
    gpu!.gpu.queue.writeBuffer(buffer,0,new Uint8Array(data.buffer as ArrayBuffer));
    return {vertexCount:data.length/8,vertexBuffers:[buffer],vertexBufferLayouts:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:'float32x3' as const},{shaderLocation:1,offset:12,format:'float32x3' as const},{shaderLocation:2,offset:24,format:'float32x2' as const}]}]};
   };
   const detailed=geometry(buildOrbGeometry());
   const variants=[true,false].flatMap(depth=>[false,true].map(blend=>createDraw(gpu!,{shader,geometry:detailed,cull:blend?'back':'none',depth:depth?{write:true,compare:'less-equal'}:false,blend:blend?'alpha':undefined,set:{params:params()}})));
   const backs=[true,false].map(depth=>createDraw(gpu!,{shader,geometry:detailed,cull:'front',depth:depth?{write:false,compare:'less-equal'}:false,blend:'alpha',set:{params:params()}}));
   await Promise.all([...variants,...backs].map(d=>d.compile(target)));if(canceled)return;
   live.current.onStatus('ready');const currentGpu=gpu;let previous=0;
   function render(now:number){if(canceled)return;try{
    const smooth=reduced.matches?1:0.18;
    mouse[0]+=(pointer.current[0]-mouse[0])*smooth;mouse[1]+=(pointer.current[1]-mouse[1])*smooth;
    hover+=((pointerActive.current?1:0)-hover)*smooth;
    const s=live.current.settings;
    if(s.stage!==destination){from=displayed;destination=s.stage;transitionStart=now;}
    const transition=sceneFrame(from,destination,now-transitionStart,reduced.matches?0:1200);
    displayed=transition.stage;opacity=transition.opacity;
    if(now-previous>=32){
     frame(currentGpu,f=>{const values={params:params()};
      f.pass(target,p=>{
       const depth=s.depth,blend=true;
       const back=backs[depth?0:1];back.set(values);p.draw(back);
       const visual=variants[(depth?0:2)+(blend?1:0)];visual.set(values);p.draw(visual);
      });
     });previous=now;
    }
    raf=requestAnimationFrame(render);
   }catch(cause){fail(cause);}}
   raf=requestAnimationFrame(render);
  }catch(cause){fail(cause);}}
  void start();return()=>{canceled=true;cancelAnimationFrame(raf);gpu?.dispose();};
 },[retry,shader,buildOrbGeometry]);
 return <><canvas ref={canvasRef} className="shader-canvas" aria-label="interactive sculpture" onPointerEnter={()=>{pointerActive.current=true;}} onPointerMove={e=>{if(e.pointerType==='touch')return;pointerActive.current=true;const r=e.currentTarget.getBoundingClientRect();pointer.current=normalizePointer(e.clientX-r.left,e.clientY-r.top,r.width,r.height);if(live.current.settings.stage<2)onPick([(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height],r.width/r.height);}} onPointerLeave={()=>{pointerActive.current=false;pointer.current=[-0.4667,0.5333];}}/>{error&&<div className="gpu-error" role="alert"><h3>webgpu unavailable.</h3><p>try a current browser with hardware acceleration enabled.</p></div>}</>;
}
