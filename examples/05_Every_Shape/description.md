# Every Shape

Move the mouse over each shape. The label at the bottom names what is under it.

Every p5 primitive takes part: `rect` with rounded corners, `ellipse`, `triangle`, `quad`, a polygon built with `beginShape()` and `vertex()`, `line`, and `text`. Each is tested exactly in its own shape: a rounded rectangle by signed distance, an ellipse by its equation, polygons by point-in-polygon, lines within their stroke weight or three screen pixels, whichever is wider, text by its bounds.

[hitInfo()](../../docs/reference/hitInfo.html) is the full record of what is under the mouse, including the shape's kind and the mouse position in the shape's own coordinates. Most sketches never need it; this one uses it for the label.
