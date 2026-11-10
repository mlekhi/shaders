# six-stage walkthrough

user-authorized changes: remove dragging, retain minimal copy and no outbound vgpu link, expand to relevant modern stages, use visually expressive 3d geometry.

six large clickable tabs: mesh, transform, clip, rasterize, shade, composite. previous/next controls and left/right keyboard navigation; home/end in tabs. 650ms input-driven transitions, instant under reduced motion. fullscreen gpu canvas, one caption, inspector only after selection, escape to dismiss.

indexed 12-vertex/20-face icosahedron shared between cpu inspection and gpu rendering. illustrates a camera transformation, back-face culling and right view boundary, enlarged single-sample coverage, perspective-correct positions and lit surface normals, then a translucent plane intersecting the mesh with depth-aware occlusion and source-over blending. this is a simplified fullscreen shader illustration, not native pipeline capture.

no tessellation or geometry shader stages; no backend or deployment. tests validate mesh topology, projected positions, selection math and bounded stage stepping. browser verification covers stage tabs, keyboard navigation, projection, clipping, raster coverage, shaded output, depth compositing and on-demand inspection. mobile styling is provided; narrow viewport emulation and forced device loss are not verified.
