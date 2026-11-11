struct Params { resolution:vec2f, focal:f32, entrance:f32, pose:mat4x4f, reveal:f32, material:f32 }
@group(0) @binding(0) var<uniform> params:Params;
const PI:f32=3.14159265359;
fn rotate(p:vec3f)->vec3f {
 return (params.pose*vec4f(p,0.0)).xyz;
}
struct VertexOut {
 @builtin(position) position:vec4f,
 @location(0) world:vec3f,
 @location(1) normal:vec3f,
 @location(2) uv:vec2f,
}
@vertex fn vs_main(@location(0) p:vec3f,@location(1) n:vec3f,@location(2) uv:vec2f)->VertexOut {
 let world=rotate(p);
 let aspect=params.resolution.x/params.resolution.y;
 let focal=params.focal;
 let depth=5.1-world.z;
 var out:VertexOut;
 out.position=vec4f(world.x*focal/aspect,world.y*focal,depth*30.0/29.9-3.0/29.9,depth);
 out.world=world;out.normal=rotate(n);out.uv=uv;
 return out;
}
fn softbox(d:vec3f,center:vec3f,up:vec3f,size:vec2f,soft:f32)->f32 {
 let forward=normalize(center);
 let right=normalize(cross(forward,up));
 let vertical=cross(right,forward);
 let facing=dot(d,forward);
 let uv=vec2f(dot(d,right),dot(d,vertical))/max(facing,0.001);
 let edge=abs(uv)-size;
 return (1.0-smoothstep(-soft,soft,max(edge.x,edge.y)))*smoothstep(0.0,0.15,facing);
}
fn studio(d:vec3f)->vec3f {
 let footprint=max(length(dpdx(d)),length(dpdy(d)));
 let soft=0.045+footprint*1.4;
 let key=softbox(d,vec3f(-1.3,1.8,1.8),vec3f(0,1,0),vec2f(0.65,0.85),soft);
 let ribbon=softbox(d,vec3f(1.8,0.6,1.0),vec3f(0,1,0),vec2f(0.12,1.6),soft);
 let rim=softbox(d,vec3f(-1.6,-0.2,-0.9),vec3f(0,1,0),vec2f(0.2,1.4),soft);
 let top=softbox(d,vec3f(0.0,2.5,-0.6),vec3f(0,0,1),vec2f(1.4,0.25),soft);
 let low=softbox(d,vec3f(0.3,-1.8,1.2),vec3f(0,0,1),vec2f(0.8,0.1),soft);
 var env=mix(vec3f(0.018,0.032,0.05),vec3f(0.15,0.19,0.23),smoothstep(-0.8,1.0,d.y));
 env+=key*vec3f(2.7,2.9,3.0);
 env+=ribbon*vec3f(3.6,1.8,0.65);
 env+=rim*vec3f(0.12,1.2,1.8);
 env+=top*vec3f(1.0,1.25,1.8);
 env+=low*vec3f(1.0,0.65,0.4);
 return env;
}
fn film(cosine:f32,uv:vec2f)->vec3f {
 let thickness=370.0+70.0*sin(uv.x*PI*6.0+uv.y*PI*2.0);
 let path=2.0*1.34*thickness*sqrt(1.0-(1.0-cosine*cosine)/1.7956);
 return 0.5+0.5*cos(2.0*PI*path/vec3f(650.0,510.0,475.0));
}
fn tonemap(color:vec3f)->vec3f {
 let x=max(color,vec3f(0.0));
 return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),vec3f(0.0),vec3f(1.0));
}
@fragment fn fs_main(in:VertexOut)->@location(0) vec4f {
 let V=normalize(vec3f(0.0,0.0,5.1)-in.world);
 let base=normalize(in.normal);
 let N=select(-base,base,dot(base,V)>0.0);
 let ndv=max(dot(N,V),0.0);
 let reflected=studio(reflect(-V,N));
 let iridescence=film(ndv,in.uv);
 let tint=mix(vec3f(0.88,0.94,0.97),iridescence,0.42+0.18*pow(1.0-ndv,2.0));
 let fresnel=0.65+0.35*pow(1.0-ndv,5.0);
 let occlusion=0.65+0.35*smoothstep(-0.8,0.8,in.world.z);
 var metal=reflected*tint*fresnel*occlusion;
 metal+=pow(1.0-ndv,3.0)*vec3f(0.1,0.22,0.3)*0.2;
 var color=metal;
 color=pow(tonemap(color),vec3f(1.0/2.2));
 let lattice=in.uv*vec2f(96.0,20.0);
 let cell=fract(lattice);
 let derivative=max(fwidth(lattice),vec2f(0.0001));
 let edges=min(cell,1.0-cell)/derivative;
 let diagonal=abs(cell.x-cell.y)/max(derivative.x+derivative.y,0.0001);
 let wire=1.0-smoothstep(0.25,1.0,min(min(edges.x,edges.y),diagonal));
 let blueprint=vec3f(0.024,0.045,0.059)+wire*vec3f(0.15,0.25,0.29);
 let distance=params.reveal-in.position.x/params.resolution.x;
 let blend=smoothstep(-0.045,0.045,distance)*params.material;
 let glow=exp(-pow(distance/0.024,2.0))*0.055*params.material;
 color=mix(blueprint,color,blend)+vec3f(0.4,0.7,0.8)*glow;
 let fade=smoothstep(0.0,1.0,params.entrance);
 return vec4f(mix(vec3f(0.022,0.034,0.05),color,fade),1.0);
}
