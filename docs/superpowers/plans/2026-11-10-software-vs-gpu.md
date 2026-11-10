# software versus gpu implementation plan

**goal:** show the same sculpture under constrained software and modern vgpu rendering.

**architecture:** one react component owns two canvases and one clock. a pure software rasterizer writes a 16-color image buffer; the existing vgpu renderer uses the same rotation matrix and projection. no added dependencies.

- [x] add shared camera/rotation helpers and software framebuffer tests for occlusion, winding, palette, and 12 hz time quantization.
- [x] implement a 768-triangle software mesh, flat directional lighting, reciprocal-depth triangle rasterization and nearest-neighbor canvas presentation.
- [x] replace reveal interaction with two equal canvases driven by a shared clock. render software at 12 hz and vgpu at display rate; freeze for reduced motion.
- [x] remove wireframe/reveal code from the gpu material, preserving the iridescent studio render.
- [x] run tests, production build and desktop/mobile browser checks; document the illustrative historical limits and checkpoint the result.
