# five-stage walkthrough

implements the user's requested flow: input assembly, vertex shader, rasterization, fragment shader, output merger.

input assembly uses a lower-resolution inspection mesh of the same sculpture. points, connected triangles and wireframe modes share that geometry; selecting a triangle exposes its actual three positions. the projected triangle and selected vertex remain highlighted in the vertex view, with camera yaw/elevation and live object/screen values.

rasterization enlarges the selected projected triangle into a center-sample coverage diagram. resolution ranges from 8 to 64 cells per axis. this is a teaching view rather than hardware coverage readback.

fragment controls select normal colors, direct lighting, reflections or iridescence, plus roughness and film strength. material settings carry into output. output switches real immutable WebGPU pipeline variants for depth testing and alpha blending; the transparency pass retains the lightweight two-sided shell approximation.

retain the spherical fluid ridges, continuous analytic normals, pixel-aware reflection filtering, black canvas, normal cursor, stage tabs and keyboard navigation. no vgpu links, backend, hosting changes or publishing.

verified: triangle picking and vertex values; camera coordinate updates; raster sample counts at multiple resolutions; material modes and disabled irrelevant controls; depth/transparency toggles; unit tests and production build. narrow mobile viewport emulation remains unverified.
