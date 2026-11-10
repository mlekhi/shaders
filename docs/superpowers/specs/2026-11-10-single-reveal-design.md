# single shader reveal

approved direction: one fullscreen sculpture, with a moving reveal from raw wireframe to luminous iridescent metal. pointer movement shifts the reveal; idle movement is slow and cinematic. no visible text, navigation, panels, buttons, or other page elements.

use the existing react, vgpu, and wgsl stack. a continuous folded knot gives the material reflections and silhouette room to work. render both treatments on the same geometry with the same camera, splitting them in screen space. the raw side illustrates geometry before material shading; it is itself rendered with a shader, not a historical fixed-function renderer.

palette: midnight #05080e, blueprint #609dae, silver #e6edf1, petrol #277f94, champagne #f0ba78, lilac #a69cd0. no typography. centered sculpture with generous negative space, sized to the shorter viewport dimension. the reveal glows only along the sculpture.

one accessible canvas. pointer and touch control the reveal, arrow keys adjust it, escape resumes automatic movement. reduced motion freezes rotation and the automatic sweep. release gpu resources on unmount; stop rendering in hidden tabs. gpu failure is reported through canvas fallback text and the console without adding interface chrome.

preserve the old project as a commit on feat/shader-gallery; rebuild on feat/single-shader-reveal. validate geometry, motion behavior, types, production compilation, and the actual gpu output at desktop and portrait sizes.
