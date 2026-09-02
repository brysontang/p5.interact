# Drag Shapes

Drag the circle, or drag the panel and everything in it comes along.

[dragged()](../../docs/reference/dragged.html) returns how far the mouse moved this frame while the shapes drawn after it are being dragged, in the coordinates of the frame where you call it. Called before `translate()`, the delta is in the parent's units, ready to add to a position.

Everything drawn after `dragged()` in the same scope moves together. The panel asks once, so dragging any of its dots drags the whole panel. No extra code, and no bookkeeping about which dot was grabbed.
