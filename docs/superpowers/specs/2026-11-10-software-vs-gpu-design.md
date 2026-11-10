# software versus gpu

approved: replace the moving reveal with the same sculpture side by side. the left must actually reduce capabilities to illustrate early real-time software graphics; the right retains the polished vgpu material. no visible text or controls.

use a deliberately constrained early-1990s-style real-time software profile: 768 flat-shaded triangles, a framebuffer whose longest edge is 320 pixels, a 16-color palette including the background, and at most 12 scene updates per second. transform, project, light, rasterize and depth-test the left sculpture in javascript; send only completed pixels to canvas 2d. no webgl, wgsl, texture mapping, reflections, thin-film material, antialiasing, bloom, or postprocessing on the left.

these are illustrative limits, not a claim that all historical computers had these exact specifications or that cpu renderers cannot produce sophisticated offline images. modern browser compositing may still use the gpu to display the finished canvas.

the right uses 73,728 triangles, continuous normals, procedural studio reflections, iridescence, multisampling and display-rate updates. both sculptures share the shape, projection and animation clock. the left samples that clock at 12 hz. preserve the horizontal comparison even on narrow screens; size each sculpture to its half of the viewport.

two accessible canvases, with no labels, buttons, legend, or divider. use one animation coordinator and a shared rotation matrix. reduced motion holds a stable frame. continue rendering the software side if webgpu is unavailable. dispose graphics resources and stop the loop on unmount.

verify software triangle coverage, winding, depth order, palette and frame limits; verify geometry tests, types and build; inspect real browser output on desktop and mobile.
