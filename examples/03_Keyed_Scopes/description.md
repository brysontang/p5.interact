# Keyed Scopes

Drag a circle and hold it. New circles appear at the front of the row while you drag. Press any key to switch between plain `push()` and `push(key)`.

Scopes are matched from one frame to the next by order: the third `push()` this frame is the same scope as the third `push()` last frame. That is fine until the order changes while something is held. When a new circle is inserted at the front, every scope after it shifts by one, and with plain `push()` the drag delta lands on the neighbor.

[push(key)](../../docs/reference/push.html) identifies the scope by the object it draws instead. Objects key by reference, so the drag follows the circle wherever it lands in the row.
