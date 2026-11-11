# gpu shading: geforce 256 (1999) vs geforce3 (2001)

a text-free, full-screen visualization. one sculpture compares fixed-function-style vertex lighting with programmable per-pixel bump mapping.

- left: blinn–phong lighting at vertices, with gouraud color interpolation.
- right: per-fragment blinn–phong lighting with a sampled tangent-space normal map. two scrolling normal-map samples create flowing ripples that change surface normals, not geometry. an artistic analytic studio environment adds broad silver, cyan and amber reflections; this is not an exact geforce3 shader recreation.
- both: identical geometry, lights, resolution policy, antialiasing and synchronized motion. a feathered wireframe-to-material sweep illustrates shading, not gpu execution order.

this recreates techniques associated with the transition from geforce 256's fixed-function transform and lighting to geforce3's programmable vertex and pixel shading. both sides actually run modern wgsl through vgpu/webgpu. it is not a hardware emulator, performance benchmark, or claim that bump mapping first appeared in 2001. light count, precision and tone mapping are illustrative rather than exact period hardware constraints.

historical reference: [nvidia's cg tutorial, gpu generations](https://download.nvidia.com/developer/cg/Cg_Tutorial/Chapter_1.pdf).

```sh
npm install
npm run dev
npm test
npm run build
```

requires webgpu and hardware acceleration. reduced motion presents both finished materials without animation.

- `src/sculpture.ts`: shared parametric mesh and tangent frames.
- `src/normalMap.ts`: periodic tangent-space normal texture.
- `src/scene.ts`: shared camera, rotation and sweep timeline.
- `src/ShaderCanvas.tsx`: shared gpu, two canvases and lifecycle.
- `src/shaders/sculpture.wgsl`: vertex and fragment lighting comparison.

## traveling-light study

on the 28-second cycle, both surfaces start with matching smooth shading. from seconds 7–17 the shared key light crosses left to right; from 10–16 the right material develops its normal-mapped chrome response. both poses ease to a stop, hold from 17–22, and resume together. the key light and reflection environment also hold while only the right surface ripples continue. the finished material remains visible from seconds 7–25. reduced motion skips the choreography.
