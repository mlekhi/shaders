# smooth reflections vs reflective bump mapping

a text-free recreation of two rendering paths associated with geforce 256 and geforce3. both sculptures share geometry, chrome, groove normals, direct lighting, exposure and the same analytic studio environment.

- left: groove normals affect direct diffuse/specular lighting, but reflection coordinates come from smooth mesh normals at vertices and interpolate across triangles.
- right: identical direct lighting; reflection coordinates are calculated per fragment from the groove normal map.

there are no painted groove lines. reflections stay smooth on the left and bend across grooves on the right. both materials appear from the first reveal.

this demonstrates a specific historical distinction rather than simulating the cards. geforce 256 supported bump-mapped lighting and environment mapping. geforce3 texture shaders enabled reflective bump mapping with dependent texture operations. modern wgsl evaluates both paths here; the shared environment is analytic, not a period cubemap asset. precision, instruction limits, fresnel, tone mapping and performance are not emulated.

sources: [nvidia's 2000 bump-mapping paper](https://developer.download.nvidia.com/assets/gamedev/docs/bumpmap.pdf), [nvidia reflective bump mapping presentation](https://developer.download.nvidia.com/assets/gamedev/docs/ReflectiveBumpMapping.pdf).

the light tubes follow a continuous 14-second round trip. the shared 28-second presentation includes an 18-second finished-material hold and a brief synchronized pose pause. reduced motion presents a still completed comparison.

```sh
npm install
npm run dev
npm test
npm run build
```

requires webgpu and hardware acceleration.
