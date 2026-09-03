# Keyed Scopes

Two rows, one difference. Hold a circle and new circles join its row. In the top row your drag jumps to a neighbor; in the bottom row it stays put.

Scopes are matched from one frame to the next by order: the third `push()` this frame is the same scope as the third `push()` last frame. That is fine until the order changes while something is held. Each new circle here goes to the front of the draw order, so every scope after it shifts by one, and in the top row the drag delta lands on the neighbor.

The bottom row uses [push(key)](../../docs/reference/push.html), which identifies the scope by the object it draws. Objects key by reference, so the drag follows the circle wherever it lands in the row. Let go and the rows reset.
