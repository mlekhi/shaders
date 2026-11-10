import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { init, draw, effect, surface, frame, type Gpu } from 'vgpu';
import sculpture from './shaders/sculpture.wgsl';
import atmosphere from './shaders/atmosphere.wgsl';
import { buildSculpture, revealPosition } from './sculpture';

export default function ShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef<{ reveal: number | null; y: number }>({ reveal: null, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let canceled = false, failed = false, raf = 0;
    let gpu: Gpu | undefined;
    let vertexBuffer: GPUBuffer | undefined;
    const fail = (cause: unknown) => {
      if (canceled || failed) return;
      failed = true;
      cancelAnimationFrame(raf);
      canvas.dataset.status = 'error';
      canvas.setAttribute('aria-label', 'webgpu unavailable. open this visualization in a browser with webgpu and hardware acceleration enabled.');
      console.error('visualization unavailable:', cause);
    };
    async function start() {
      try {
        gpu = await init();
        if (canceled) { gpu.dispose(); return; }
        gpu.onError(fail);
        void gpu.lost.then(info => { if(info.reason !== 'destroyed') fail(info.message); });
        const screen = surface(gpu, canvas, { dpr: [1, 1.75], depth: true, msaa: 4, clearColor: [0.02,0.03,0.055,1] });
        const data = buildSculpture();
        vertexBuffer = gpu.gpu.createBuffer({size: data.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
        gpu.gpu.queue.writeBuffer(vertexBuffer,0,new Uint8Array(data.buffer as ArrayBuffer));
        let elapsed = 0, last = 0, split = 0.5, tilt = 0;
        const params = () => ({ resolution: screen.size, time: elapsed, reveal: split, tilt, entrance: reduced.matches ? 1 : Math.min(1, elapsed/1.8) });
        const mesh = draw(gpu, {
          shader: sculpture,
          geometry: { vertexCount: data.length/8, vertexBuffers: [vertexBuffer], vertexBufferLayouts: [{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x2'}]}] },
          cull: 'none', depth: {write:true,compare:'less'},
          set: {params:params()},
        });
        const background = effect(gpu, atmosphere, {set:{params:params()}});
        await Promise.all([mesh.compile(screen),background.compile(screen)]);
        if(canceled || failed) return;
        canvas.dataset.status = 'ready';
        const device = gpu;
        function render(now: number) {
          if(canceled || failed) return;
          const dt = last ? Math.min((now-last)/1000,0.05) : 0;
          last = now;
          if(!document.hidden) {
            if(!reduced.matches) elapsed += dt;
            const ease = reduced.matches ? 1 : 1-Math.exp(-dt*5);
            split += (revealPosition(elapsed,input.current.reveal,reduced.matches)-split)*ease;
            tilt += (input.current.y-tilt)*ease;
            try {
              frame(device,f=>{
                const values={params:params()};
                background.set(values);mesh.set(values);
                f.pass(screen,p=>{p.draw(background);p.draw(mesh);});
              });
            } catch(cause) { fail(cause); return; }
          }
          raf=requestAnimationFrame(render);
        }
        raf=requestAnimationFrame(render);
      } catch(cause) { fail(cause); }
    }
    void start();
    return () => { canceled=true; cancelAnimationFrame(raf); vertexBuffer?.destroy(); gpu?.dispose(); };
  }, [sculpture, atmosphere]);

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const bounds=e.currentTarget.getBoundingClientRect();
    input.current={reveal:(e.clientX-bounds.left)/bounds.width,y:((e.clientY-bounds.top)/bounds.height-0.5)*0.28};
  };
  const reset = () => {input.current={reveal:null,y:0};};
  const key = (e: KeyboardEvent<HTMLCanvasElement>) => {
    if(e.key==='Escape') reset();
    if(e.key==='ArrowLeft'||e.key==='ArrowRight') {
      e.preventDefault();
      input.current.reveal=Math.max(0,Math.min(1,(input.current.reveal??0.5)+(e.key==='ArrowRight'?0.05:-0.05)));
    }
  };
  return <canvas ref={canvasRef} className="shader-canvas" tabIndex={0} role="img" data-status="loading"
    aria-label="a rotating sculpture revealed from wireframe to iridescent metal. move your pointer or use the arrow keys to shift the reveal. escape resumes automatic movement."
    onPointerMove={move} onPointerDown={move} onPointerLeave={reset} onPointerCancel={reset} onKeyDown={key}>
    a webgpu visualization of geometry becoming iridescent metal.
  </canvas>;
}
