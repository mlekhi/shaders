struct Params { resolution:vec2f, focal:f32, mode:f32, pose:mat4x4f, reveal:f32, material:f32, time:f32 }
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
 let grain=fract(sin(dot(uv*params.resolution,vec2f(12.9898,78.233)))*43758.5453)-0.5;
 return vec4f(color+grain*0.0025,1.0);
}
