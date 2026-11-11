import { useEffect, useRef } from 'react';
import { init, draw, effect, surface, frame, texture, sampler, type Gpu } from 'vgpu';
import sculpture from './shaders/sculpture.wgsl';
import atmosphere from './shaders/atmosphere.wgsl';
import { buildShadingGeometry } from './sculpture';
import { buildNormalMap } from './normalMap';
import { cameraFocal, presentationAt, sceneRotation } from './scene';

export default function ShaderCanvas() {
  const classicRef=useRef<HTMLCanvasElement>(null);
  const programmableRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvases=[classicRef.current!,programmableRef.current!];
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let canceled=false,failed=false,raf=0,dirty=true;
    let gpu:Gpu|undefined,vertexBuffer:GPUBuffer|undefined;
    const resize=()=>{dirty=true;};
    const observer=new ResizeObserver(resize);
    canvases.forEach(c=>observer.observe(c));
    reduced.addEventListener('change',resize);
    const fail=(cause:unknown)=>{
      if(canceled||failed)return;
      failed=true;cancelAnimationFrame(raf);
      canvases.forEach(c=>{c.dataset.status='error';c.setAttribute('aria-label','webgpu unavailable. use a browser with hardware acceleration enabled.');});
      console.error('visualization unavailable:',cause);
    };
    async function start(){
      try{
        gpu=await init();if(canceled){gpu.dispose();return;}
        gpu.onError(fail);
        void gpu.lost.then(info=>{if(info.reason!=='destroyed')fail(info.message);});
        const data=buildShadingGeometry();
        vertexBuffer=gpu.gpu.createBuffer({size:data.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
        gpu.gpu.queue.writeBuffer(vertexBuffer,0,new Uint8Array(data.buffer as ArrayBuffer));
        const normalMap=texture(gpu,{kind:'2d',size:[512,512],format:'rgba8unorm',usage:['texture_binding','copy_dst']});
        gpu.gpu.queue.writeTexture({texture:normalMap.gpu},buildNormalMap(),{bytesPerRow:512*4},[512,512]);
        const normalSampler=sampler(gpu,{minFilter:'linear',magFilter:'linear',addressModeU:'repeat',addressModeV:'repeat'});
        const geometry={vertexCount:data.length/14,vertexBuffers:[vertexBuffer],vertexBufferLayouts:[{arrayStride:56,attributes:[{shaderLocation:0,offset:0,format:'float32x3' as const},{shaderLocation:1,offset:12,format:'float32x3' as const},{shaderLocation:2,offset:24,format:'float32x2' as const},{shaderLocation:3,offset:32,format:'float32x3' as const},{shaderLocation:4,offset:44,format:'float32x3' as const}]}]};
        const views=canvases.map((canvas,mode)=>{
          const target=surface(gpu!,canvas,{dpr:[1,1.75],depth:true,msaa:4});
          const params=(time:number)=>{
            const view=reduced.matches?{reveal:1,material:1,poseTime:0}:presentationAt(time);
            return {resolution:target.size,focal:cameraFocal(target.size[0]/target.size[1]),mode,pose:sceneRotation(view.poseTime),reveal:view.reveal,material:view.material,time:reduced.matches?0:time};
          };
          const mesh=draw(gpu!,{shader:sculpture,geometry,cull:'none',depth:{write:true,compare:'less'},set:{params:params(0),normalMap,normalSampler}});
          const background=effect(gpu!,atmosphere,{set:{params:params(0)}});
          return {target,params,mesh,background};
        });
        await Promise.all(views.flatMap(v=>[v.mesh.compile(v.target),v.background.compile(v.target)]));
        if(canceled||failed)return;
        canvases.forEach(c=>{c.dataset.status='ready';});
        let elapsed=0,last=0;
        const device=gpu;
        function render(now:number){
          if(canceled||failed)return;
          const dt=last?Math.min((now-last)/1000,0.05):0;last=now;
          if(!document.hidden){
            if(!reduced.matches)elapsed+=dt;
            if(dirty||!reduced.matches){
              try{
                frame(device,f=>{for(const v of views){
                  const values={params:v.params(elapsed)};
                  v.mesh.set(values);v.background.set(values);
                  f.pass(v.target,p=>{p.draw(v.background);p.draw(v.mesh);});
                }});
              }catch(cause){fail(cause);return;}
              dirty=false;
            }
          }
          raf=requestAnimationFrame(render);
        }
        raf=requestAnimationFrame(render);
      }catch(cause){fail(cause);}
    }
    void start();
    return()=>{canceled=true;cancelAnimationFrame(raf);observer.disconnect();reduced.removeEventListener('change',resize);vertexBuffer?.destroy();gpu?.dispose();};
  },[sculpture,atmosphere]);

  return <main className="experience">
    <div className="comparison">
      <figure className="panel">
        <canvas ref={classicRef} role="img" data-status="loading" aria-label="geforce 256-style lighting. blinn–phong lighting is calculated at vertices, then colors interpolate across triangles."/>
      </figure>
      <figure className="panel">
        <canvas ref={programmableRef} role="img" data-status="loading" aria-label="geforce3-style shading. a tangent-space normal map adds flowing surface ripples to per-pixel blinn–phong lighting without changing the mesh."/>
      </figure>
    </div>
  </main>;
}
