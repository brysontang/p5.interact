# Hover and Click

Three shapes that brighten under the mouse and change color when clicked.

Each shape is drawn inside its own `push()` / `pop()`. Inside it, [hovered()](../../docs/reference/hovered.html) asks whether the mouse is over the shapes drawn after it, and [clicked()](../../docs/reference/clicked.html) is true for one frame after a click on them. Both apply until the closing `pop()`, the same way `describeElement()` scopes itself.

There is nothing to register and nothing to name. The state that changes, whether each shape is lit, lives in an ordinary array.
