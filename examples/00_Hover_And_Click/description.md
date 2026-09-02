# Hover and Click

Three shapes that brighten under the mouse and change color when clicked.

[hovered()](../../docs/reference/hovered.html) asks whether the mouse is over the shapes drawn after it, and [clicked()](../../docs/reference/clicked.html) is true for one frame after a click on them. Asking again after a shape has been drawn starts a new group, so the three shapes here each answer for themselves with no `push()` / `pop()` at all. It works the way `fill()` works: the most recent one applies to what follows.

There is nothing to register and nothing to name. The state that changes, whether each shape is lit, lives in an ordinary array.
