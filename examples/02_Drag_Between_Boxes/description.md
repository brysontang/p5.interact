# Drag Between Boxes

Drag a circle from one box into another, or drag a box and its circles come along. Drop a circle on the background and it goes back.

The boxes drag as groups because each box asks [dragged()](../../docs/reference/dragged.html) once, before its `translate()`, so the delta lands on the box and everything drawn after it moves. A circle asks `dragged()` too, in its own scope inside the box, and the innermost scope that asked is the one that gets the drag: grab a circle and only the circle moves, grab the background and the whole box moves.

Three more things make the hand-off between boxes work. [dropped()](../../docs/reference/dropped.html) is asked by each box and returns the drop point in the box's own coordinates, so the box can take the circle and place it. While a circle is held it is drawn last, above every box, so its scope is keyed with [push(key)](../../docs/reference/push.html) and the drag follows it wherever it is drawn. And while it is held the library skips it when picking, so the box underneath is what answers `hovered()` and `dropped()`.

The dashed ring left behind is drawn after [noInteract()](../../docs/reference/noInteract.html): visible, but not in click space, so you can drop the circle back where it came from.
