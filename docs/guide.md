# Guide

How p5.interact thinks, in more depth than the README. The [reference](./) has a page per function with live examples; this is the connective tissue.

## A question is drawing state

Every question, `hovered()`, `clicked()`, `dragged()`, `dropped()`, `scrolled()`, is stored on p5's own drawing-state object, the same one that holds `fillColor` and `rectMode`. That is not an analogy. `fill()` sets a key on that object and every shape drawn afterwards reads it; `hovered()` does exactly the same with a different key. p5's `push()` and `pop()` save and restore our keys because they save and restore every key there.

Three consequences fall out of this without being designed:

**Questions don't need push/pop.** A question asked after a shape has been drawn starts a new group, the way a second `fill()` starts a new color. Two questions asked back to back share the shapes that follow, the way `fill()` and `stroke()` both apply to the next shape.

```js
fill(hovered() ? 'red' : 'yellow');
circle(100, 100, 40);
fill(hovered() ? 'red' : 'orange');
circle(200, 200, 40);
```

**Only shapes after a question are picked.** Anything drawn before it is plain drawing, so captions and backgrounds drawn first need no verb to keep them out of click space.

```js
circle(200, 200, 60);           // not part of the question below
fill(hovered() ? 0 : 255);
circle(100, 200, 60);           // lights up
```

**Ask every frame, then decide.** A question inside a branch that doesn't run is never asked, and the previous question stays in force for the shapes that follow, the way a fill you didn't set stays in force. `fill(lit ? 'gold' : hovered() ? 'orange' : 'blue')` skips `hovered()` whenever `lit` is true, so the shape inherits whatever was asked before it. Put the question on its own line: `const hot = hovered();`.

Something drawn *before* the hovered thing can still react to it, through a variable, the way p5 sketches share state between frames:

```js
let midHot = false;

function draw() {
  stroke(midHot ? 255 : 0);
  circle(100, 200, 100);

  push();
  midHot = hovered();
  circle(200, 200, 100);
  pop();
}
```

## Nothing bubbles

Every question is answered for the scope that was in force when the shape was drawn, which is the innermost one that asked. A button inside a card does not also click or hover the card. If the inner scope asked only `hovered()`, a click passes to the nearest enclosing scope that asked `clicked()`.

To make a group respond together, ask once at the group: children that never ask inherit the answer. To make them respond separately, ask inside each child. When you want both, carry the child's answer in a variable.

Each question is its own piece of state, the way fill and stroke are separate: asking `clicked()` again after a shape does not reset a `hovered()` asked earlier. That is also why a shape drawn right after a loop can inherit the last iteration's question; `noHover()` before it, or drawing it first, is the fix.

## The negations

`noHover()`, `noClick()`, `noDrag()`, `noDrop()`, `noScroll()`, `noDistance()` make the shapes that follow stop answering that one question, until `pop()` or it is asked again. `noFill()` for click space. `noInteract()` is all six at once.

A shape that answers no question at all is not recorded, and does not block what is behind it: you can grab a draggable thing through a plain `rect()` drawn on top of it. To make an inert shape solid, leave it one question to answer, usually `hovered()`.

## A bigger hit area

To make something clickable from a few pixels away, draw a bigger invisible shape first. p5 skips painting a shape that has neither fill nor stroke, but the library still records it, so it is a hit area and nothing else:

```js
noFill();
noStroke();
circle(x, y, 60);          // invisible, in click space: the halo
fill('steelblue');
circle(x, y, 40);          // what you see
```

For hover effects that should start before the mouse arrives, `distance()` is the better tool: it returns the pixels to the nearest edge, so `distance() < 16` is a generous hover and `1 - distance() / 100` is a glow.

## Dragging and dropping

`dragged()` returns `{ x, y }` in the coordinates of the frame where you call it. Call it before your `translate` and the delta is in the parent's units, ready to add to a position. Everything drawn after it in the scope moves together, which is how a group drag works with no extra code: put `dragged()` on the group, not the pieces. Drag is claimed by the innermost scope that asked for it and stays claimed until release. The delta is delivered once per frame; a second `dragged()` on the same scope in the same frame returns `{ x: 0, y: 0 }`.

A drag ends where `dragged()` returns `null` again, the frame after release, so `else if (lifted)` is the place to snap something home. In WEBGL, `orbitControl()` sits out while a shape is being dragged, so call it every frame without checking.

While a scope is being dragged, its shapes are skipped by picking. The thing on your cursor never blocks what is under it, so a drop target can answer `hovered()` and `dropped()`. The held scope still reports `hovered()` as true.

`dropped()` returns the drop point in the calling scope's coordinates. Usually you won't move the thing there: the drag already left it where you released it, offset by wherever you grabbed it. A drop decides what happens next: keep it, send it home, or hand it to a new parent by shifting its coordinates by the difference between the two frames. Set it to the drop point only when you mean to snap to the cursor. `localMouse()` gives the mouse in the current frame for the rare case you need it.

`scrolled()` returns the wheel delta accumulated over the last frame. A scope that asked owns the wheel over its shapes: the page doesn't scroll and `orbitControl()` doesn't zoom, like scrolling inside a scrollable element.

## Scopes are matched by order, unless you key them

The third `push()` this frame is the same thing as the third `push()` last frame. For hover that means a one-frame flicker if a scope appears earlier in the draw. Clicks are immune. Drag is the one that can bite: if a new scope is inserted before the one you are dragging mid-drag, the delta lands on its neighbor. The Keyed Scopes example shows exactly that, side by side with the fix:

```js
push(item);       // this scope is "item", wherever it lands in draw order
```

Objects key by reference, strings and numbers by value. You need this when the held thing has to be drawn somewhere else while held, for instance last so it sits on top in 2D. If your data is rebuilt every frame, say parsed from JSON each time, an object never matches itself: key by something stable, `push(item.id)`.

## What gets picked

Every p5 primitive records its arguments and the current matrix when a question is in force. Nothing is recorded otherwise, so a sketch that never asks pays nothing.

| primitive | test |
|---|---|
| `rect`, `square` | rounded rect by signed distance, per-corner radii, honors `rectMode` |
| `ellipse`, `circle` | exact ellipse, honors `ellipseMode` |
| `triangle`, `quad`, `beginShape` … `endShape` | planar polygon, any orientation in 3D |
| `line` | distance to segment, within `strokeWeight / 2` and at least 3 screen pixels at any zoom |
| `text` | font bounds, honors `textAlign` |
| `image` | its rect, honors `imageMode` |
| `plane` | its rect |
| `box`, `sphere` | ray intersection |

In WEBGL the nearest hit along the view ray wins. In 2D the last drawn wins, like paint.

## How picking works

At draw time each shape stores the model-view-projection matrix p5 built for it, the same one the shader gets, plus its arguments. At frame end the mouse is unprojected through the inverse of that matrix into the shape's own space and tested there: rounded rects and ellipses analytically, polygons by plane intersection and point-in-polygon, lines by closest approach, boxes and spheres by ray intersection.

That is why it stays quick. There is no second render pass and no reading pixels back from the GPU, which is the usual cost of picking in WebGL. Each shape is sixteen floats to record and one small matrix inverse to test, done once per frame for the shapes that asked, so a few thousand interactive shapes per frame are fine. Hover is one frame behind the draw, like every immediate-mode UI; clicks and drags resolve against the last drawn frame at the moment of the pointer event.

## Frame pacing

p5 draws on a display refresh only if at least `1000 / target - 5` ms have passed since the last draw, and the default target is 60. On a 60 Hz screen that draws every refresh. On a 75 Hz screen it draws two refreshes out of three, so frame gaps alternate 13, 13, 27 ms and a drag judders. On 144 Hz the gaps alternate 14 and 21. `frameRate()` reports `1000 / last gap`, so the number flickers between 75 and 37 without ever being either.

p5.interact sets `frameRate(Infinity)` after `setup()`, which makes p5 draw on every refresh (and which `saveGif()` treats as 60, so exports are unaffected). It does this only if the sketch never called `frameRate()` itself; a sketch that chose `frameRate(30)` meant it. To turn it off entirely, before setup finishes:

```js
interact.config.frameRate = null;
```

The drag-latency bench measures the real frame gaps and has a button for p5's default pacing so you can feel the difference. `upstream/p5-frame-pacing.md` in the repository is a draft issue for p5 with the numbers.

## The namespace and the knobs

Every function is also available under the `interact` namespace, as `interact.hovered()` and so on, for sketches that would rather not use the bare globals. `interact.config` holds the few knobs: `clickSlop`, `cursor`, `lineTolerance`, `frameRate`.

The library wraps p5's drawing functions to see what you draw, so load it once, right after p5, before any other addon that does the same. It is a classic script that expects `p5` on `window`, like every p5 addon.

## Limits

- `bezierVertex` and `curveVertex` are not sampled; a curved shape is picked by its straight vertices.
- Hover resolves once per frame, so with `noLoop()` it updates on `redraw()`.
- Shapes are picked geometrically. A shape that answers no question does not occlude what is behind it.
