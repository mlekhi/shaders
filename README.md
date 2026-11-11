# engraved chrome: color detail vs normal-mapped lighting

a text-free comparison of the same sculpture, chrome material, engraved color pattern, camera and lights. both materials appear from the first reveal.

left: engraved channels affect color only; reflections and lighting use smooth surface normals.
right: the same channels also perturb tangent-space normals, making groove edges catch the light and bend reflections. neither changes the geometry.

visible studio light bars track the shared key-light position. the 28-second loop reveals both materials, moves the light across them, pauses both poses and the light briefly, then resumes. finished materials hold for 18 seconds. reduced motion presents a still completed comparison.

this isolates a rendering technique, not the complete capabilities of two historical gpus. geforce 256 already supported cube environment mapping; chrome itself was not introduced by geforce3. both views use modern webgpu and an artistic analytic reflection environment, not hardware emulation.

historical reference: [nvidia cube environment mapping](https://www.nvidia.com/en-us/drivers/feature-cube/).

```sh
npm install
npm run dev
npm test
npm run build
```

requires webgpu and hardware acceleration.
