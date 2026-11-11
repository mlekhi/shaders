struct Params {
 resolution:vec2f, focal:f32, mode:f32,
 pose:mat4x4f, reveal:f32, material:f32, time:f32, lightX:f32, detail:f32, flow:f32,
}
@group(0) @binding(0) var<uniform> params:Params;
@group(0) @binding(1) var normalMap:texture_2d<f32>;
@group(0) @binding(2) var normalSampler:sampler;

fn rotate(p:vec3f)->vec3f { return (params.pose*vec4f(p,0)).xyz; }

/* shared light placement; vertex material exposure balances the reflective material. */
fn lightTerm(N:vec3f,V:vec3f,L:vec3f,radiance:vec3f)->vec3f {
 let diffuse=max(dot(N,L),0.0);
 let H=normalize(L+V);
 let specular=pow(max(dot(N,H),0.0),150.0)*select(0.0,1.0,diffuse>0.0);
 return radiance*(vec3f(0.045,0.065,0.09)*diffuse+vec3f(0.9,0.95,1.0)*specular*3.0);
}
fn lighting(p:vec3f,normal:vec3f)->vec3f {
 let V=normalize(vec3f(0,0,5.1)-p);
 let N=normal;
 let key=normalize(vec3f(params.lightX*0.22,2.0,0.0)-p);
 let fill=normalize(vec3f(2.8,0.2,1.4)-p);
 let rim=normalize(vec3f(-2.0,-1.4,-0.2)-p);
 return vec3f(0.002,0.004,0.008)
  +lightTerm(N,V,key,vec3f(3.2,1.25,0.42))
  +lightTerm(N,V,fill,vec3f(0.12,1.4,3.8))
  +lightTerm(N,V,rim,vec3f(1.6,0.18,0.45));
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
 // A brighter polished base keeps the comparison about surface response,
 // rather than making the older lighting model artificially dim.
 let V=normalize(vec3f(0,0,5.1)-world);
 let softKey=normalize(vec3f(params.lightX*0.22,2.0,0.0)-world);
 let sheen=pow(max(dot(N,normalize(softKey+V)),0.0),24.0);
 out.vertexColor=lighting(world,N)*3.2+vec3f(0.035,0.045,0.06)+sheen*vec3f(0.65,0.57,0.48);
 return out;
}
@fragment fn fs_main(in:VertexOut)->@location(0) vec4f {
 let N=normalize(in.normal);
 let T=normalize(in.tangent-N*dot(in.tangent,N));
 let B=normalize(cross(N,T))*select(-1.0,1.0,dot(cross(N,T),in.bitangent)>0.0);
 let mapped=normalize(textureSample(normalMap,normalSampler,in.uv).xyz*2.0-1.0);
 let bumpNormal=normalize(T*mapped.x+B*mapped.y+N*mapped.z);
 let surfaceNormal=select(N,bumpNormal,params.mode>0.5);
 let V=normalize(vec3f(0,0,5.1)-in.world);
 let R=reflect(-V,surfaceNormal);
 let fresnel=0.12+0.88*pow(1.0-max(dot(surfaceNormal,V),0.0),5.0);
 // Analytic studio environment: an artistic reflection treatment, not hardware emulation.
 let band=R.y+0.18*sin(R.x*3.0+params.lightX*0.18);
 let strip=exp(-pow((band-0.28)/0.12,2.0));
 let wide=exp(-pow((band+0.3)/0.32,2.0));
 let edgeLight=pow(max(dot(R,normalize(vec3f(-0.7,0.2,0.7))),0.0),12.0);
 let palette=mix(vec3f(0.08,1.2,2.8),vec3f(3.2,0.65,0.18),smoothstep(-0.6,0.55,R.x));
 let environment=strip*vec3f(3.8,4.3,4.8)+wide*palette*1.5
  +edgeLight*vec3f(1.5,0.2,0.65)+vec3f(0.008,0.015,0.025);
 let pixelColor=lighting(in.world,surfaceNormal)*0.3+environment*(0.65+fresnel*0.7);
 // Both have identical chrome and painted channels; only the right perturbs normals.
 let phase=6.28318530718*(10.0*in.uv.y+2.0*in.uv.x);
 let engraving=pow((1.0+cos(phase))*0.5,6.0);
 let lit=pixelColor*(1.0-0.60*engraving);
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
