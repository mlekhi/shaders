struct Params { resolution:vec2f, focal:f32, mode:f32, pose:mat4x4f, reveal:f32, material:f32, time:f32, lightX:f32, detail:f32, flow:f32 }
@group(0) @binding(0) var<uniform> params:Params;
struct BackgroundVertex { @builtin(position) position:vec4f, @location(0) uv:vec2f }
@vertex fn vs_main(@builtin(vertex_index) index:u32)->BackgroundVertex {
 let positions=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
 let p=positions[index];
 var out:BackgroundVertex;
 out.position=vec4f(p,0.99999,1.0);
 out.uv=vec2f(p.x*0.5+0.5,0.5-p.y*0.5);
 return out;
}
@fragment fn fs_main(@location(0) uv:vec2f)->@location(0) vec4f {
 let p=(uv-0.5)*vec2f(params.resolution.x/params.resolution.y,1.0);
 let halo=exp(-dot(p*vec2f(1.1,1.0),p*vec2f(1.1,1.0))*7.0);
 let cool=exp(-dot(p-vec2f(-0.28,-0.05),p-vec2f(-0.28,-0.05))*9.0);
 let warm=exp(-dot(p-vec2f(0.25,0.08),p-vec2f(0.25,0.08))*12.0);
 var color=vec3f(0.012,0.02,0.033)+halo*vec3f(0.009,0.014,0.025);
 color+=cool*vec3f(0.008,0.024,0.033)+warm*vec3f(0.026,0.014,0.011);
 let shadow=exp(-pow(p.x*3.2,2.0)-pow((p.y-0.35)*32.0,2.0));
 color*=1.0-shadow*0.6;
 // Project the same world-space source used by the sculpture lighting.
 // A slim emissive diffuser sits inside a dark metal studio-light housing.
 let lampCenter=vec2f(params.lightX*0.22,-2.0)*params.focal/(2.0*5.1);
 let lampScale=params.focal/(2.0*5.1);
 let q=(p-lampCenter)/lampScale;
 let aa=1.5/(params.resolution.y*lampScale);
 let housingQ=abs(q)-vec2f(0.43,0.09);
 let housingDistance=length(max(housingQ,vec2f(0)))+min(max(housingQ.x,housingQ.y),0.0)-0.035;
 let housing=1.0-smoothstep(-aa,aa,housingDistance);
 color=mix(color,vec3f(0.09,0.105,0.12),housing);
 let diffuserQ=abs(q-vec2f(0,0.018))-vec2f(0.35,0.025);
 let diffuserDistance=length(max(diffuserQ,vec2f(0)))+min(max(diffuserQ.x,diffuserQ.y),0.0)-0.012;
 let diffuser=1.0-smoothstep(-aa,aa,diffuserDistance);
 let glow=exp(-max(diffuserDistance,0.0)*12.0);
 color+=vec3f(1.0,0.63,0.30)*glow*0.22;
 color=mix(color,vec3f(1.0,0.92,0.76),diffuser);
 let grain=fract(sin(dot(uv*params.resolution,vec2f(12.9898,78.233)))*43758.5453)-0.5;
 return vec4f(color+grain*0.0025,1.0);
}
