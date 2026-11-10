import { useEffect, useRef } from 'react';
import { init, draw, effect, surface, frame, type Gpu } from 'vgpu';
import sculpture from './shaders/sculpture.wgsl';
import atmosphere from './shaders/atmosphere.wgsl';
import { buildSculpture } from './sculpture';
import { cameraFocal, sceneRotation } from './scene';
import { createFramebuffer, renderSoftware, softwareSize, softwareTime } from './software';

export default function ShaderCanvas() {
  const softwareRef=useRef<HTMLCanvasElement>(null);
  const gpuRef=useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    const cpuCanvas=softwareRef.current!,gpuCanvas=gpuRef.current!;
    const context=cpuCanvas.getContext('2d',{alpha:false});
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let canceled=false,gpuFailed=false,raf=0,dirty=true;
    let gpu: Gpu | undefined,vertexBuffer: GPUBuffer | undefined;
    let drawGpu: ((pose:number[],time:number)=>void) | undefined;
    let softwareFrame=createFramebuffer(1,1);
    let image=new ImageData(softwareFrame.pixels,1,1);
    let lastSample=-1,elapsed=0,last=0;

    const resize=()=>{
      const bounds=cpuCanvas.getBoundingClientRect();
      const [width,height]=softwareSize(bounds.width,bounds.height);
      if(width!==softwareFrame.width||height!==softwareFrame.height){
        softwareFrame=createFramebuffer(width,height);
        image=new ImageData(softwareFrame.pixels,width,height);
        cpuCanvas.width=width;cpuCanvas.height=height;
      }
      dirty=true;
    };
    const observer=new ResizeObserver(resize);
    observer.observe(cpuCanvas);
    resize();
    const motionChanged=()=>{dirty=true;};
    reduced.addEventListener('change',motionChanged);

    const failGpu=(cause:unknown)=>{
      if(canceled||gpuFailed)return;
      gpuFailed=true;drawGpu=undefined;
      gpuCanvas.dataset.status='error';
      gpuCanvas.setAttribute('aria-label','modern rendering unavailable. use a browser with webgpu and hardware acceleration enabled. the software renderer remains active on the left.');
      console.error('modern visualization unavailable:',cause);
    };

    async function startGpu(){
      try {
        gpu=await init();
        if(canceled){gpu.dispose();return;}
        gpu.onError(failGpu);
        void gpu.lost.then(info=>{if(info.reason!=='destroyed')failGpu(info.message);});
        const screen=surface(gpu,gpuCanvas,{dpr:[1,1.75],depth:true,msaa:4,clearColor:[0.02,0.03,0.055,1]});
        const data=buildSculpture();
        vertexBuffer=gpu.gpu.createBuffer({size:data.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
        gpu.gpu.queue.writeBuffer(vertexBuffer,0,new Uint8Array(data.buffer as ArrayBuffer));
        const params=(pose:number[],time:number)=>({resolution:screen.size,focal:cameraFocal(screen.size[0]/screen.size[1]),entrance:reduced.matches?1:Math.min(1,time/1.8),pose});
        const mesh=draw(gpu,{
          shader:sculpture,
          geometry:{vertexCount:data.length/8,vertexBuffers:[vertexBuffer],vertexBufferLayouts:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x2'}]}]},
          cull:'none',depth:{write:true,compare:'less'},set:{params:params(sceneRotation(0),0)},
        });
        const background=effect(gpu,atmosphere,{set:{params:params(sceneRotation(0),0)}});
        await Promise.all([mesh.compile(screen),background.compile(screen)]);
        if(canceled||gpuFailed)return;
        const device=gpu;
        drawGpu=(pose,time)=>{
          frame(device,f=>{
            const values={params:params(pose,time)};
            background.set(values);mesh.set(values);
            f.pass(screen,p=>{p.draw(background);p.draw(mesh);});
          });
        };
        gpuCanvas.dataset.status='ready';dirty=true;
      }catch(cause){failGpu(cause);}
    }

    function render(now:number){
      if(canceled)return;
      const dt=last?Math.min((now-last)/1000,0.05):0;
      last=now;
      if(!document.hidden){
        if(!reduced.matches)elapsed+=dt;
        const sample=softwareTime(elapsed);
        if(context&&(dirty||sample!==lastSample)){
          renderSoftware(softwareFrame,sceneRotation(sample));
          context.putImageData(image,0,0);
          lastSample=sample;
          cpuCanvas.dataset.status='ready';
        }
        if(drawGpu&&(dirty||!reduced.matches)){
          try{drawGpu(sceneRotation(reduced.matches?sample:elapsed),elapsed);}catch(cause){failGpu(cause);}
        }
        dirty=false;
      }
      raf=requestAnimationFrame(render);
    }
    void startGpu();
    raf=requestAnimationFrame(render);
    return()=>{
      canceled=true;cancelAnimationFrame(raf);observer.disconnect();reduced.removeEventListener('change',motionChanged);
      vertexBuffer?.destroy();gpu?.dispose();
    };
  },[sculpture,atmosphere]);

  return <main className="comparison" aria-label="the same sculpture rendered with constrained software graphics and modern gpu shading">
    <canvas ref={softwareRef} className="software-canvas" role="img" data-status="loading"
      aria-label="early real-time software rendering: 768 flat-shaded triangles, 16 colors, a 320-pixel framebuffer limit and 12 updates per second">
      a low-resolution sculpture rasterized on the cpu.
    </canvas>
    <canvas ref={gpuRef} className="shader-canvas" role="img" data-status="loading"
      aria-label="modern vgpu rendering: the same sculpture with smooth geometry, iridescent metal, studio reflections and antialiasing">
      the same sculpture rendered with webgpu.
    </canvas>
  </main>;
}
