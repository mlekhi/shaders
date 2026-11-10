# software / gpu

one sculpture, two rendering pipelines. no visible interface.

```sh
npm install
npm run dev
```

left: an intentionally constrained early-real-time software renderer. javascript transforms, projects, flat-shades and rasterizes 768 triangles into a depth-tested pixel buffer. the image uses 16 colors including its background, a maximum dimension of 320 pixels, and 12 scene updates per second. canvas 2d only presents the completed pixels, with nearest-neighbor scaling. no shader material, reflections, textures, antialiasing, or postprocessing.

right: vgpu/webgpu renders 73,728 triangles with smooth normals, procedural studio reflections, iridescent metal, multisampling and display-rate animation.

both use the same parametric sculpture, camera and animation clock. the software side samples the shared motion at 12 hz. reduced motion freezes both views. the layout stays side by side at every screen size.

the left is an illustrative early-1990s-style real-time profile, not a hardware emulator or a claim that all pre-gpu rendering had these limits. sophisticated offline cpu rendering also existed. modern browser compositing may use the gpu to display the completed software image.

webgpu requires a supported browser with hardware acceleration. the software side remains active if webgpu is unavailable; the right canvas reports its failure through its accessible description and the console.

```sh
npm test
npm run build
```

- `src/software.ts`: palette, software mesh, flat lighting, triangle rasterizer and depth buffer.
- `src/scene.ts`: shared rotation and camera.
- `src/sculpture.ts`: parametric surface and detailed gpu mesh.
- `src/ShaderCanvas.tsx`: two canvases, shared clock and resource lifecycle.
- `src/shaders/sculpture.wgsl`: iridescent metal and procedural studio reflections.

the old gallery is preserved on `feat/shader-gallery` at `be42b8d`; the moving reveal is preserved at `54d174b`. this comparison lives on `feat/single-shader-reveal`.
