struct Params {
 resolution:vec2f,
 mouse:vec2f,
 progress:f32,
 hover:f32,
 sceneOpacity:f32,
 rasterResolution:f32,
 camera:vec2f,
 lesson:f32,
 assembly:f32,
 material:f32,
 roughness:f32,
 filmAmount:f32,
 transparent:f32,
}
@group(0) @binding(0) var<uniform> params:Params;
const PI:f32=3.14159265359;
fn sphere(uv:vec2f)->vec3f {
 let theta=uv.y*PI;let phi=uv.x*PI*2.0;
 return vec3f(sin(theta)*cos(phi),cos(theta),sin(theta)*sin(phi));
}
// Exact radial-surface normal, evaluated continuously rather than per triangle.
fn surfaceNormal(uv:vec2f)->vec3f {
 let n=sphere(uv);
 let a=n.x*2.2+n.z*1.4;let b=n.z*2.4-n.y*0.8;let c=n.z*2.3-n.x*1.5;
 let sa=sin(a);let ca=cos(a);let sb=sin(b);let cb=cos(b);
 let flow=n.y+0.30*sa*sb;
 let gradFlow=vec3f(0.66*ca*sb,1.0-0.24*sa*cb,0.30*(1.4*ca*sb+2.4*sa*cb));
 let band=18.0*flow+2.8*sin(c);
 let crest=0.5+0.5*sin(band);
 let gradBand=18.0*gradFlow+2.8*cos(c)*vec3f(-1.5,0.0,2.3);
 let radius=0.98+0.055*pow(crest,4.0)+0.018*sin(flow*5.0+n.z*2.0);
 let grad=0.11*pow(crest,3.0)*cos(band)*gradBand+0.018*cos(flow*5.0+n.z*2.0)*(5.0*gradFlow+vec3f(0.0,0.0,2.0));
 return normalize(n-(grad-n*dot(grad,n))/radius);
}
fn rotate(v:vec3f)->vec3f {
 let yaw=params.camera.x+params.mouse.x*0.14;
 let pitch=params.camera.y+params.mouse.y*0.10;
 let x=v.x*cos(yaw)+v.z*sin(yaw);
 let z=-v.x*sin(yaw)+v.z*cos(yaw);
 return vec3f(x,v.y*cos(pitch)-z*sin(pitch),v.y*sin(pitch)+z*cos(pitch));
}
struct VertexOut {
 @builtin(position) position:vec4f,
 @location(0) world:vec3f,
 @location(1) normal:vec3f,
 @location(2) uv:vec2f,
 @location(3) bary:vec3f,
}
@vertex fn vs_main(@location(0) position:vec3f,@location(1) normal:vec3f,@location(2) uv:vec2f,@builtin(vertex_index) index:u32)->VertexOut {
 let amount=smoothstep(0.0,1.0,params.progress);
 let point=mix(sphere(uv)*0.91,position,amount);
 let n=normalize(mix(sphere(uv),normal,amount));
 let p=rotate(point);
 let depth=3.6-p.z;
 let aspect=params.resolution.x/params.resolution.y;
 let focal=min(1.95,aspect*2.5);
 var out:VertexOut;
 out.position=vec4f(p.x*focal/aspect,p.y*focal+depth*0.07,depth*20.0/19.9-2.0/19.9,depth);
 out.world=p;out.normal=rotate(n);out.uv=uv;
 out.bary=vec3f(select(0.0,1.0,index%3u==0u),select(0.0,1.0,index%3u==1u),select(0.0,1.0,index%3u==2u));
 return out;
}
fn softbox(uv:vec2f,center:vec2f,size:vec2f,softness:f32)->f32 {
 let d=vec2f(abs(fract(uv.x-center.x+0.5)-0.5),abs(uv.y-center.y));
 let rect=d-size;
 return 1.0-smoothstep(-softness,softness,max(rect.x,rect.y));
}
fn studio(direction:vec3f,roughness:f32)->vec3f {
 let d=normalize(direction);
 let uv=vec2f(atan2(d.z,d.x)/(PI*2.0)+0.5,asin(clamp(d.y,-1.0,1.0))/PI+0.5);
 // Reflected direction can sweep a large solid angle within a single pixel.
 // Filter that footprint instead of sampling razor-thin studio lights once.
 let angularFootprint=max(length(dpdx(d)),length(dpdy(d)))/PI;
 let soft=sqrt(pow(0.008+roughness*0.03,2.0)+angularFootprint*angularFootprint);
 let key=softbox(uv,vec2f(0.16,0.64),vec2f(0.12,0.17),soft);
 let strip=softbox(uv,vec2f(0.65,0.53),vec2f(0.014,0.28),soft*0.6);
 let fill=softbox(uv,vec2f(0.90,0.73),vec2f(0.09,0.09),soft);
 let bottom=softbox(uv,vec2f(0.38,0.22),vec2f(0.16,0.035),soft);
 let lineWidth=sqrt(0.012*0.012+angularFootprint*angularFootprint);
 let line=exp(-pow((uv.y-0.44)/lineWidth,2.0))*0.45*0.012/lineWidth;
 return vec3f(0.018)+vec3f(1.0,0.98,0.96)*key*1.5+vec3f(0.84,0.93,1.0)*strip*2.0+vec3f(0.75,0.84,1.0)*fill*0.65+vec3f(bottom*0.8+line);
}
fn thinFilm(cosine:f32,thickness:f32)->vec3f {
 let ior=1.38;
 let internal=sqrt(1.0-(1.0-cosine*cosine)/(ior*ior));
 let path=2.0*ior*thickness*internal;
 return 0.5+0.5*cos(2.0*PI*path/vec3f(650.0,510.0,475.0));
}
@fragment fn fs_main(in:VertexOut,@builtin(front_facing) front:bool)->@location(0) vec4f {
 let progress=params.progress;
 let screen=in.position.xy/params.resolution;
 let hoverDelta=(screen-vec2f(params.mouse.x*0.5+0.5,0.5-params.mouse.y*0.5))*vec2f(params.resolution.x/params.resolution.y,1.0);
 let attention=exp(-dot(hoverDelta,hoverDelta)*35.0)*params.hover;
 let continuousNormal=rotate(normalize(mix(sphere(in.uv),surfaceNormal(in.uv),smoothstep(0.0,1.0,progress))));
 let N=select(-continuousNormal,continuousNormal,front);
 let V=normalize(vec3f(0.0,0.0,3.6)-in.world);
 let ndv=max(dot(N,V),0.0);
 let L=normalize(vec3f(params.mouse*1.6,2.2));
 let H=normalize(L+V);
 let diffuse=max(dot(N,L),0.0);
 let specular=pow(max(dot(N,H),0.0),mix(160.0,12.0,params.roughness));
 let facing=0.04+0.96*pow(1.0-ndv,5.0);
 let reflection=studio(reflect(-V,N),params.roughness);
 let thickness=330.0+75.0*sin(in.uv.y*10.0+sin(in.uv.x*PI*2.0)*2.0);
 let film=thinFilm(ndv,thickness);
 let filmStrength=(0.5+0.35*pow(1.0-ndv,1.5))*params.filmAmount;
 let metalTint=mix(vec3f(0.96),film,filmStrength);
 let transmission=studio(refract(-V,N,1.0/1.42),0.15);
 var finished=reflection*metalTint*(0.85+facing*0.35)+transmission*mix(vec3f(0.96),film,params.filmAmount)*0.20;
 finished+=vec3f(0.82,0.9,1.0)*specular*0.45;
 finished+=mix(vec3f(0.96),film,params.filmAmount)*pow(1.0-ndv,3.0)*0.06;
 let plain=vec3f(0.15,0.19,0.23)*(0.25+diffuse*0.8)+vec3f(specular)*0.65;
 let lit=mix(plain,reflection,smoothstep(1.0,2.0,params.material));
 var color=mix(lit,finished,smoothstep(2.0,3.0,params.material));
 if(params.material<0.5){color=N*0.5+0.5;}
 // One continuous surface: assembly, projected mesh, pixel coverage, shading.
 let lattice=in.uv*vec2f(32.0,20.0);
 let cell=fract(lattice);
 let derivatives=max(fwidth(lattice),vec2f(0.0001));
 let edge=min(cell,1.0-cell)/derivatives;
 let diagonal=abs(cell.x-cell.y)/max(derivatives.x+derivatives.y,0.0001);
 let wire=1.0-smoothstep(0.7,1.7,min(min(edge.x,edge.y),diagonal));
 let pointDistance=length(min(cell,1.0-cell)/derivatives);
 let points=1.0-smoothstep(1.3,2.5,pointDistance);
 let meshMix=smoothstep(0.0,1.0,params.lesson);
 let assemblyColor=vec3f(0.32,0.68,1.0)*mix(points,wire,meshMix);
 let pixelSize=max(4.0,params.resolution.y/params.rasterResolution);
 let pixelCell=fract(in.position.xy/pixelSize);
 let pixelBorder=min(min(pixelCell.x,1.0-pixelCell.x),min(pixelCell.y,1.0-pixelCell.y));
 let pixelCoverage=smoothstep(0.025,0.09,pixelBorder);
 let sample=1.0-smoothstep(0.04,0.095,length(pixelCell-0.5));
 let rasterColor=vec3f(0.18,0.46,0.72)*(0.35+0.65*diffuse)*pixelCoverage+vec3f(0.5,0.83,1.0)*sample*0.65;
 let rasterMix=smoothstep(1.0,2.0,params.lesson);
 let shadingMix=smoothstep(2.0,3.0,params.lesson);
 color=mix(mix(assemblyColor,rasterColor,rasterMix),color,shadingMix);
 // Depth blending is revealed only in the final stage, exposing the rear shell.
 let shellReveal=smoothstep(3.0,4.0,params.lesson)*params.transparent;
 color=mix(color,color*vec3f(0.67,0.88,1.15)+transmission*film*0.65,shellReveal);
 // gentle highlight compression retains the reflected studio's white detail.
 color*=1.0+attention*select(2.2,0.5,params.lesson>=3.0);
 color+=vec3f(0.14,0.38,0.6)*attention*select(1.0,0.12,params.lesson>=3.0);
 color=color/(vec3f(1.0)+color*0.35);
 color=pow(max(color,vec3f(0.0)),vec3f(1.0/2.2));
 let translucency=params.transparent;
 let shellAlpha=0.26+facing*0.32;
 let alpha=select(translucency*0.52,mix(1.0,shellAlpha,translucency),front);
 return vec4f(color*params.sceneOpacity,alpha);
}
