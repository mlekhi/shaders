# single shader reveal implementation plan

**goal:** replace the gallery with one fullscreen vgpu sculpture and a wireframe-to-metal reveal.

**architecture:** react mounts one canvas. cpu geometry supplies position, normal and uv data; wgsl shades a shared mesh with two treatments. a single vgpu render pass draws an atmospheric background and the sculpture.

**stack:** existing react, typescript, vite, vgpu and wgsl.

## constraints

- no visible text or controls; no new dependencies or server infrastructure.
- keep the previous project on its original branch.
- respect reduced motion and clean up gpu resources.

## steps

- [x] preserve baseline and create feat/single-shader-reveal.
- [x] replace the old lesson, pipeline and orb modules with sculpture geometry and reveal motion. check finite vertices, unit normals, closed seams and bounded reduced-motion behavior in vitest.
- [x] replace app and css with one accessible fullscreen canvas; pointer and touch set the normalized reveal, arrows move it by 0.05, escape resets it.
- [x] build wgsl studio lighting, iridescent metal, antialiased wireframe and a feathered reveal boundary. use the same vertex data and camera for both sides.
- [x] run tests and production build, inspect actual gpu rendering, and check portrait framing and console errors.
- [x] update readme and leave the new branch ready to review.
