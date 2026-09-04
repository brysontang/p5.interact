# Changelog

## 0.3.1

`scrolled()` also reports `n`, how many wheel events the frame's delta sums, and `t`,
`performance.now()` of the last one. A mouse notch is one event tens of milliseconds
from the next; a trackpad sends one or more every frame. Sketches that want a notch to
mean "one item" can now tell them apart without guessing from the delta's size, which
differs by OS and mouse.

## 0.3.0

`tolerance(px)` and `noTolerance()`. Questions asked after `tolerance(px)` answer within
`px` screen pixels of a shape's edge, not only inside it. The tolerance is drawing state,
like `strokeWeight()`, but it is captured by each question when asked, so
`tolerance(12); scrolled(); noTolerance(); dragged();` gives the wheel a halo over the
gaps of a list while a drag still has to start on an item. Screen pixels at any zoom,
in 2D and WEBGL, for every primitive.

Internally, each question is now resolved with its own tolerance: hover, click, drag,
drop and scroll each pick the nearest shape as tested with the halo that question was
asked with. With no `tolerance()` call nothing changes.

## 0.2.0

Questions are drawing state. Every question is stored on p5's own `states` object next
to `fillColor`, so p5's `push()` and `pop()` scope it and a question asked after a shape
starts a new group, the way a second `fill()` starts a new color. The library no longer
keeps a scope stack of its own.

Nothing bubbles. A click, hover, drag, or drop is answered by the innermost scope that
asked. Ask once at a group and its children inherit; ask inside each child and they
answer separately.

Every question returns a value; the callback forms of `clicked()` and `scrolled()` are
gone. New questions: `scrolled()` and `distance()`. New verbs: `noHover()`, `noClick()`,
`noDrag()`, `noDrop()`, `noScroll()`, `noDistance()`; `noInteract()` clears all six.
`push(key)` keys a scope by the object it draws.

Removed: `dragging()`. `orbitControl()` sits out during a drag on its own, and a drag
ends where `dragged()` returns `null`. A scope that asked `scrolled()` owns the wheel
over its shapes.

Docs: a guide, examples in the p5 style, and a reference page per function.

**Breaking:** `clicked(fn)`, `scrolled(fn)`, and `dragging()` no longer exist, and
`hovered()` no longer bubbles to enclosing scopes.

## 0.1.1

Line picking has a floor of 3 screen pixels at any zoom. Loading the script twice no
longer wraps p5's primitives twice. `push(key)` no longer trips p5's argument validator.

## 0.1.0

First release.
