# shader reveal

one fullscreen vgpu sculpture. a slow reveal turns a blueprint wireframe into iridescent metal. no visible interface.

```sh
npm install
npm run dev
```

move your pointer or touch the canvas to position the reveal. when the pointer leaves, the automatic sweep resumes. focus the canvas and use arrow keys for keyboard control; escape resumes the sweep. reduced motion freezes the automatic animation.

requires a browser with webgpu and hardware acceleration enabled. unsupported devices report the failure through the canvas accessible description and browser console.

```sh
npm test
npm run build
```

`src/sculpture.ts` builds the closed mesh. `src/shaders/sculpture.wgsl` shades both treatments with the same camera and geometry. the wireframe illustrates the geometry before material shading; both sides are rendered using shaders.

the previous gallery is preserved on `feat/shader-gallery` at `be42b8d`. this version lives on `feat/single-shader-reveal`.
