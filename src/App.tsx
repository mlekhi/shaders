import { useEffect,useRef,useState } from 'react';
import { SlidersHorizontal,X } from 'lucide-react';
import ShaderCanvas from './ShaderCanvas';
import { nextStage,type Point } from './pipeline';
import { pickTriangle,project,triangleAt } from './lesson';
const stages=[
 {name:'input assembly',caption:'points → triangles → wireframe. hover a triangle.'},
 {name:'vertex shader',caption:'move the camera. follow a vertex into screen space.'},
 {name:'rasterization',caption:'the same sculpture, resolved into covered pixels.'},
 {name:'fragment shader',caption:'normals → lighting → reflections → iridescence.'},
 {name:'output merger',caption:'the opaque surface opens into translucent, overlapping layers.'},
];
function Range({label,value,min,max,step=1,disabled=false,onChange}:{label:string;value:number;min:number;max:number;step?:number;disabled?:boolean;onChange:(value:number)=>void}){return <label className="lesson-range"><span>{label}<output>{Number(value.toFixed(2))}</output></span><input type="range" disabled={disabled} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;}
function Choices({labels,value,onChange}:{labels:string[];value:number;onChange:(i:number)=>void}){return <div className="lesson-choices">{labels.map((label,i)=><button key={label} aria-pressed={value===i} onClick={()=>onChange(i)}>{label}</button>)}</div>;}
export default function App(){
 const [stage,setStage]=useState(4),[assembly,setAssembly]=useState(0),[camera,setCamera]=useState<Point>([0.55,-0.12]);
 const [material,setMaterial]=useState(3),[roughness,setRoughness]=useState(0.08),[film,setFilm]=useState(1);
 const [depth,setDepth]=useState(true),[transparent,setTransparent]=useState(true),[resolution,setResolution]=useState(24);
 const [selected,setSelected]=useState(()=>pickTriangle(0.5,0.5,0.55,-0.12,1)),[vertex,setVertex]=useState(0);
 const [aspect,setAspect]=useState(window.innerWidth/window.innerHeight),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0);
 const [controlsOpen,setControlsOpen]=useState(false);
 const tabs=useRef<(HTMLButtonElement|null)[]>([]);
 const stageElement=useRef<HTMLDivElement>(null);
 const triangle=triangleAt(Math.max(0,selected)),projected=triangle.map(p=>project(p,...camera,aspect));
 function select(i:number,focus=false){setStage(i);if(focus)tabs.current[i]?.focus();}
 useEffect(()=>{const observer=new ResizeObserver(([entry])=>setAspect(entry.contentRect.width/entry.contentRect.height));observer.observe(stageElement.current!);return()=>observer.disconnect();},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(nextStage(stage,e.key==='ArrowRight'?1:-1),true);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[stage]);
 const pick=(p:Point,a:number)=>{if(stage>1)return;const id=pickTriangle(...p,...camera,a);if(id>=0)setSelected(id);};
 return <div className="site-shell">
 <main><div ref={stageElement} className="stage" role="tabpanel" id="stage-panel" aria-labelledby={`stage-${stage}`}>
  <ShaderCanvas settings={{stage,assembly,camera,material,roughness,film,depth,transparent,resolution}} retry={retry} onPick={pick} onStatus={setStatus}/>
  {status==='loading'&&<span className="loading-label">starting gpu…</span>}

 </div>

 <div className="dock">{controlsOpen&&( <aside className="lesson-controls" id="stage-controls"><p className="controls-caption">{stages[stage].caption}</p>
 {stage===0&&<><Choices labels={['points','triangles','wireframe']} value={assembly} onChange={setAssembly}/><span className="control-heading">triangle {selected}</span>{triangle.map((p,i)=><button className={`vertex-row ${vertex===i?'active':''}`} aria-pressed={vertex===i} key={i} onClick={()=>setVertex(i)}><span>v{i}</span><code>{p.map(n=>n.toFixed(3)).join(' / ')}</code></button>)}</>}
 {stage===1&&<><Range label="camera yaw" value={camera[0]} min={-1.5} max={1.5} step={0.01} onChange={v=>setCamera([v,camera[1]])}/><Range label="camera elevation" value={camera[1]} min={-0.9} max={0.9} step={0.01} onChange={v=>setCamera([camera[0],v])}/><Choices labels={['v0','v1','v2']} value={vertex} onChange={setVertex}/><div className="projection-values"><span>object</span><code>{triangle[vertex].map(v=>v.toFixed(3)).join(' / ')}</code><span>screen uv</span><code>{projected[vertex].slice(0,2).map(v=>v.toFixed(3)).join(' / ')}</code></div></>}
 {stage===2&&<><Range label="screen resolution" value={resolution} min={8} max={64} onChange={setResolution}/><span className="control-note">triangle {selected} · center-sample coverage</span></>}
 {stage===3&&<><Choices labels={['normals','lit','reflections','iridescent']} value={material} onChange={setMaterial}/><Range label="roughness" disabled={material===0} value={roughness} min={0} max={1} step={0.01} onChange={setRoughness}/><Range label="film strength" disabled={material!==3} value={film} min={0} max={1} step={0.01} onChange={setFilm}/><span className="control-note">move the mouse to move the light.</span></>}
 {stage===4&&<><button className="lesson-toggle" aria-pressed={depth} onClick={()=>setDepth(v=>!v)}>depth testing <span>{depth?'on':'off'}</span></button><button className="lesson-toggle" aria-pressed={transparent} onClick={()=>setTransparent(v=>!v)}>transparency <span>{transparent?'on':'off'}</span></button></>}
 </aside>)}<div className="bottom-bar"><nav className="stage-nav" role="tablist" aria-label="rendering stages">{stages.map((s,i)=><button key={s.name} id={`stage-${i}`} ref={el=>{tabs.current[i]=el;}} role="tab" aria-selected={stage===i} aria-controls="stage-panel" tabIndex={stage===i?0:-1} onClick={()=>select(i)} onKeyDown={e=>{if(e.key==='Home'||e.key==='End'){e.preventDefault();select(e.key==='Home'?0:4,true);}}}><span className="stage-number">0{i+1}</span>{s.name}</button>)}</nav><button className="controls-trigger" aria-label={controlsOpen?'close stage controls':'open stage controls'} aria-expanded={controlsOpen} aria-controls="stage-controls" onClick={()=>{if(status==='error')setRetry(v=>v+1);else setControlsOpen(v=>!v);}}>{controlsOpen?<X size={16}/>:<SlidersHorizontal size={16}/>}</button></div></div>
 </main></div>;
}
