struct Params { resolution:vec2f, time:f32, reveal:f32, tilt:f32, entrance:f32 }
@group(0) @binding(0) var<uniform> params:Params;
const PI:f32=3.14159265359;
fn rotate(p:vec3f)->vec3f {
 let a=0.26+sin(params.time*0.11)*0.32;
 let b=-0.32+params.tilt+sin(params.time*0.08)*0.12;
 let c=-0.18+params.time*0.035;
 let y=vec3f(p.x*cos(a)+p.z*sin(a),p.y,-p.x*sin(a)+p.z*cos(a));
 let x=vec3f(y.x,y.y*cos(b)-y.z*sin(b),y.y*sin(b)+y.z*cos(b));
 return vec3f(x.x*cos(c)-x.y*sin(c),x.x*sin(c)+x.y*cos(c),x.z);
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
 let focal=min(2.9,aspect*2.7);
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
 let lattice=in.uv*vec2f(112.0,24.0);
 let cell=fract(lattice);
 let derivatives=max(fwidth(lattice),vec2f(0.0001));
 let edge=min(cell,1.0-cell)/derivatives;
 let diagonal=abs(cell.x-cell.y)/max(derivatives.x+derivatives.y,0.0001);
 let wire=1.0-smoothstep(0.25,0.95,min(min(edge.x,edge.y),diagonal));
 let point=1.0-smoothstep(0.7,1.8,length(min(cell,1.0-cell)/derivatives));
 let rim=pow(1.0-ndv,2.0);
 let wireColor=vec3f(0.11,0.29,0.38)*(0.35+0.65*ndv)*wire+vec3f(0.16,0.34,0.4)*point*0.4;
 let raw=vec3f(0.003,0.009,0.014)+wireColor*0.55+rim*vec3f(0.012,0.035,0.05);
 let screen=in.position.xy/params.resolution;
 let aspect=params.resolution.x/params.resolution.y;
 let boundary=(screen.x-params.reveal)*aspect+(screen.y-0.5)*0.12;
 let reveal=smoothstep(-0.018,0.018,boundary);
 let seam=exp(-pow(boundary/0.004,2.0));
 let aura=exp(-pow(boundary/0.025,2.0));
 var color=mix(raw,metal,reveal);
 color+=vec3f(0.52,0.8,0.9)*seam*0.55+vec3f(0.08,0.22,0.3)*aura*0.18;
 color=pow(tonemap(color),vec3f(1.0/2.2));
 let fade=smoothstep(0.0,1.0,params.entrance);
 return vec4f(mix(vec3f(0.022,0.034,0.05),color,fade),1.0);
}
