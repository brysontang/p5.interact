# Picking in 3D

Drag empty space to orbit. Drag the box to move it. Hover the sphere, the plane, or the line.

In WEBGL the same questions work under any transform. Each shape remembers the matrix it was drawn with, and at the end of the frame the mouse is unprojected into the shape's own space and tested there: a ray against the box and the sphere, a point against the plane, and closest approach to the line. The nearest hit along the view ray wins.

`orbitControl()` sits out while a shape is being dragged, so the sketch calls it every frame and the camera only orbits while nothing is held. [localMouse()](../../docs/reference/localMouse.html) and drag deltas are measured on the z = 0 plane of the current frame, so the box slides in the plane it lives in.
