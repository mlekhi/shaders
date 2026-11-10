# shaders

an interactive five-stage rendering walkthrough, built with react, vite and vgpu.

```sh
npm install
npm run dev
```

- input assembly: points, connected triangles and wireframe. click the sculpture to select a triangle and inspect its vertices.
- vertex shader: adjust camera yaw/elevation and follow a selected vertex from object coordinates into screen uv coordinates.
- rasterization: enlarge that projected triangle and adjust the center-sample coverage grid from 8 × 8 to 64 × 64.
- fragment shader: compare normal colors, direct lighting, reflected studio lights and iridescence; adjust roughness and film strength.
- output merger: toggle actual gpu depth testing and alpha blending.

stage tabs and left/right keys navigate. range controls retain their normal keyboard behavior. the canvas uses the native cursor; mouse movement changes the light in the material and output views.

the input/projection views use a lower-resolution inspection mesh of the same sculpted surface for readable triangle selection. rasterization is an enlarged svg coverage illustration using barycentric center tests; it does not read back the browser's exact msaa coverage or edge tie-breaking. the final sculpture uses 98,304 triangles, analytic per-fragment normals, filtered procedural studio reflections and two-sided alpha transmission. transparency is a lightweight shell approximation, without refraction through a captured scene or order-independent blending.

```sh
npm test
npm run build
```

requires webgpu. local-only app; no backend.

scene changes use a 520ms fade with synchronized diagram overlays; rapid changes continue from the current brightness. mesh/point views respond to pointer proximity, raster cells highlight on hover, and stage buttons lift and glow. reduced-motion preferences disable transition animation.
