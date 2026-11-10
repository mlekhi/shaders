# rendering walkthrough

approved: replace the gallery with one triangle and one progress slider. five stops: vertices, transform, rasterize, shade, image. minimal copy; highlight what changes at each stage. continuous transitions are explanatory, not a recording of gpu execution.

one vgpu fullscreen effect illustrates the pipeline. shared triangle coordinates feed the shader and inspectors; cpu barycentric calculations match shader calculations. the diagram uses an enlarged 0.04-unit single-sample grid, then reveals display-resolution coverage and color at the final stop. vertices can be selected to inspect source/transformed position; cells show coverage and, during shading, interpolated color weights and rgb.

no automatic animation, backend, or deployment. accessible slider and stage buttons; keyboard sample navigation. tests cover transforms, barycentric weights, outside coverage, and cell centers. browser checks cover all stages and inspectors.
