struct Params {
 resolution:vec2f, focal:f32, mode:f32,
 pose:mat4x4f, reveal:f32, material:f32, time:f32,
}
@group(0) @binding(0) var<uniform> params:Params;
@group(0) @binding(1) var normalMap:texture_2d<f32>;
@group(0) @binding(2) var normalSampler:sampler;

fn rotate(p:vec3f)->vec3f { return (params.pose*vec4f(p,0)).xyz; }

/* both pipelines use exactly the same light and material equations. */
fn lightTerm(N:vec3f,V:vec3f,L:vec3f,radiance:vec3f)->vec3f {
 let diffuse=max(dot(N,L),0.0);
 let H=normalize(L+V);
 let specular=pow(max(dot(N,H),0.0),90.0)*select(0.0,1.0,diffuse>0.0);
 return radiance*(vec3f(0.13,0.22,0.26)*diffuse+vec3f(0.9,0.95,1.0)*specular*1.8);
}
fn lighting(p:vec3f,normal:vec3f)->vec3f {
 let V=normalize(vec3f(0,0,5.1)-p);
 let N=normal;
 let phase=params.time*0.28;
 let key=normalize(vec3f(-1.8+sin(phase)*1.2,2.4,2.8)-p);
 let fill=normalize(vec3f(2.8,0.2,1.4)-p);
 let rim=normalize(vec3f(-2.0,-1.4,-0.2)-p);
 return vec3f(0.009,0.015,0.022)
  +lightTerm(N,V,key,vec3f(1.8,1.65,1.4))
  +lightTerm(N,V,fill,vec3f(0.32,0.7,1.0))
  +lightTerm(N,V,rim,vec3f(0.9,0.48,0.22));
}
struct VertexOut {
 @builtin(position) position:vec4f,
 @location(0) world:vec3f,
 @location(1) normal:vec3f,
 @location(2) uv:vec2f,
 @location(3) vertexColor:vec3f,
 @location(4) tangent:vec3f,
 @location(5) bitangent:vec3f,
}
@vertex fn vs_main(@location(0) p:vec3f,@location(1) n:vec3f,@location(2) uv:vec2f,@location(3) tangent:vec3f,@location(4) bitangent:vec3f)->VertexOut {
 let world=rotate(p);
 let N=normalize(rotate(n));
 let aspect=params.resolution.x/params.resolution.y;
 let depth=5.1-world.z;
 var out:VertexOut;
 out.position=vec4f(world.x*params.focal/aspect,world.y*params.focal,depth*30.0/29.9-3.0/29.9,depth);
 out.world=world;out.normal=N;out.uv=uv;
 out.tangent=rotate(tangent);out.bitangent=rotate(bitangent);
 out.vertexColor=lighting(world,N);
 return out;
}
@fragment fn fs_main(in:VertexOut)->@location(0) vec4f {
 let N=normalize(in.normal);
 let T=normalize(in.tangent-N*dot(in.tangent,N));
 let B=normalize(cross(N,T))*select(-1.0,1.0,dot(cross(N,T),in.bitangent)>0.0);
 let mapped=normalize(textureSample(normalMap,normalSampler,in.uv).xyz*2.0-1.0);
 let bumpNormal=normalize(T*mapped.x+B*mapped.y+N*mapped.z);
 let pixelColor=lighting(in.world,bumpNormal);
 let lit=select(in.vertexColor,pixelColor,params.mode>0.5);
 let shaded=pow(max(lit/(1.0+lit),vec3f(0)),vec3f(1.0/2.2));
 let lattice=in.uv*vec2f(64,16);
 let cell=fract(lattice);let width=max(fwidth(lattice),vec2f(0.0001));
 let edge=min(cell,1.0-cell)/width;
 let diagonal=abs(cell.x-cell.y)/max(width.x+width.y,0.0001);
 let wire=1.0-smoothstep(0.25,1.0,min(min(edge.x,edge.y),diagonal));
 let blueprint=vec3f(0.025,0.043,0.052)+wire*vec3f(0.16,0.25,0.29);
 let boundary=params.reveal-in.position.x/params.resolution.x;
 let blend=smoothstep(-0.045,0.045,boundary)*params.material;
 let glow=exp(-pow(boundary/0.024,2.0))*params.material*0.025;
 return vec4f(mix(blueprint,shaded,blend)+vec3f(0.4,0.7,0.8)*glow,1);
}
