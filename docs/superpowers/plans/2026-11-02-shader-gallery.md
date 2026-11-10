# shader atlas implementation plan

**goal:** build the approved informative shader gallery in the empty repo.
**architecture:** react + vite with one vgpu canvas, scene-specific wgsl, declarative lesson content and controls. no backend.
**constraints:** all visible copy lowercase; four meaningful scenes; keyboard controls; reduced motion; honest unsupported-browser state.

- [x] test the teaching math in src/math.test.ts: pointer bounds, paused time, quantization and ordered dithering.
- [x] implement src/math.ts and pass the tests.
- [x] configure vite and wgsl imports; build four scene shaders plus a shared uniform contract.
- [x] build src/ShaderCanvas.tsx with async setup cancellation, compile validation, visibility-aware rendering, resize and cleanup.
- [x] build src/App.tsx and src/style.css: minimal gallery, real pixel readout, scene controls, actual shader reveal, responsive layout.
- [x] run unit tests and production build, then inspect the live app and verify each scene, keyboard interaction, pause, sampling comparisons, and source reveal. narrow mobile emulation and forced gpu-loss remain unverified.
