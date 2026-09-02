# p5.interact

Interaction for p5 without ceremony.

**[Reference](https://brysontang.github.io/p5.interact/docs/)** · **[Examples](https://brysontang.github.io/p5.interact/examples/)**, with the code running live beside every page.

A p5 2.x addon, one file, no build step. It adds four questions you can ask inside
`draw()`:

```js
hovered()        // is the mouse over the shapes that follow?
clicked(fn?)     // were they clicked? (and: call fn when they are)
dragged()        // are they being dragged? returns the delta in local coordinates
dropped()        // was something dragged and released on them? returns the drop point
```

Each applies to the shapes drawn *after* it, until the end of the enclosing `push()` /
`pop()`. Questions asked back to back share the shapes that follow; a question asked
after a shape has been drawn starts a new group. That is exactly how p5's own
`describeElement()` scopes itself, so if you know p5 you already know this:

```js
function draw() {
  background(0);

  for (const item of items) {
    push();
    const d = dragged();
    if (d) { item.x += d.x; item.y += d.y; }
    translate(item.x, item.y);
    fill(hovered() ? 200 : 60);
    clicked(() => select(item));
    rect(0, 0, 100, 40, 8);
    pop();
  }
}
```

No ids, no names, no handles, no registration. State lives in your variables, where
p5 sketches keep it anyway.

```html
<script src="https://cdn.jsdelivr.net/npm/p5@2.3.1/lib/p5.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5.interact@0.1.0/p5.interact.js"></script>
<script src="./sketch.js"></script>
```

Or `npm install p5.interact`, or download [`p5.interact.js`](https://github.com/brysontang/p5.interact/blob/main/p5.interact.js)
and load it from your own folder. It is a classic script that expects `p5` on `window`,
like every p5 addon. Load it once, right after p5: it wraps p5's drawing functions to
see what you draw, so it should come before any other addon that does the same.
Works in WEBGL and 2D, global and instance mode. MIT.

One side effect to know up front: after `setup()` it sets `frameRate(Infinity)` so p5
draws on every display refresh, unless your sketch called `frameRate()` itself. The
[Frame pacing](#frame-pacing) section says why. To turn it off:

```js
interact.config.frameRate = null;
``` Version 0.1: the ideas are settled,
the names might still move.

## The questions

**`hovered()`** returns true when the mouse was over any shape in this scope last
frame. Nested scopes bubble: a hover on a child is a hover on the parent, like `:hover`
in CSS. At top level, outside any `push()`, it means "over anything drawn after this."

**`clicked(fn?)`** returns true for one frame after a click on the shapes in scope.
With a function, it also calls it at the moment of the click, innermost scope first,
as `fn(event, hit)`. A press that travels more than a few pixels is a drag, not a click.

**`dragged()`** returns `{ x, y }` while the shapes in scope are being dragged, in the
coordinates of the frame where you call it, or `null`. Call it before your `translate`
and the delta is in the parent's units, ready to add to a position. Everything drawn
after it in the scope moves together, which is how a group drag works with no extra
code: put `dragged()` on the group, not the pieces. Drag is claimed by the innermost
scope that asked for it, and stays claimed until release. The delta is delivered once
per frame: a second `dragged()` on the same scope in the same frame returns `{ x: 0, y: 0 }`.

**`dropped()`** returns `{ x, y }` for one frame after a drag was released over the
shapes in scope, in the coordinates of the frame where you call it, or `null`. What was
dropped is whatever your sketch was holding; keep it in a variable when `dragged()`
first returns a delta. See `examples/02_Drag_Between_Boxes`.

**`noInteract()`** makes the shapes that follow in this scope drawn but not picked, until
`pop()` or the next question. `noFill()` for click space: ghosts, labels, backgrounds.

**While a scope is being dragged, its shapes are skipped by picking.** The thing on your
cursor never blocks what is under it, so a drop target can answer `hovered()` and
`dropped()`. The held scope still reports `hovered()` as true.

**`localMouse()`** is the mouse in the current coordinate frame, `{ x, y }`. Use it at
lift time to remember where on a thing you grabbed it, so a drop doesn't recenter it on
the cursor.

**`dragging()`** is true while any drag is active. Use it to keep `orbitControl()`
from fighting a drag: `if (!dragging()) orbitControl();`

**`hitInfo()`** is the full hover record: `{ shape, u, v, t }`, with `u, v` in the
shape's own coordinates.

Every function is also available under the `interact` namespace, as `interact.hovered()`
and so on, for sketches that would rather not use the bare globals. `interact.config`
holds the few knobs: `clickSlop`, `cursor`, `lineTolerance`, `frameRate`.

## Two things to know

**Only shapes after a question are picked.** In this scope the first circle is plain
drawing and the second one lights up:

```js
push();
circle(200, 200, 60);
fill(hovered() ? 0 : 255);
circle(100, 200, 60);
pop();
```

Something drawn *before* the hovered thing can react to it through a variable, the
way p5 sketches share state between frames:

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

**Scopes are matched by order, unless you key them.** The third `push()` this frame is
the same thing as the third `push()` last frame. For hover that means a one-frame
flicker if a scope appears earlier in the draw. Clicks are immune, because the handler
closure already holds the right object. Drag is the one that can bite: if a new scope is
inserted before the one you are dragging mid-drag, the delta lands on its neighbor.
`examples/03_Keyed_Scopes` shows exactly that, with a key to toggle the fix:

```js
push(item);       // this scope is "item", wherever it lands in draw order
```

Objects key by reference, strings and numbers by value. You need this when the held
thing has to be drawn somewhere else while held, for instance last so it sits on top in
2D. Use a key once per frame. If your data is rebuilt every frame, say parsed from JSON
each time, an object never matches itself: key by something stable, `push(item.id)`.

## What gets picked

Every p5 primitive records its arguments and the current matrix when a question is
active in scope. Nothing is recorded otherwise, so a sketch that never asks pays nothing.

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

At draw time each shape stores the model-view-projection matrix p5 built for it, the
same one the shader gets, plus its arguments. At frame end the mouse is unprojected
through the inverse of that matrix into the shape's own space and tested there:
rounded rects and ellipses analytically, polygons by plane intersection and point-in-
polygon, lines by closest approach, boxes and spheres by ray intersection.

That is why it stays quick. There is no second render pass and no reading pixels back
from the GPU, which is the usual cost of picking in WebGL. Each shape is sixteen floats
to record and one small matrix inverse to test, done once per frame for the shapes that
asked, so a few thousand interactive shapes per frame are fine. Hover is one frame
behind the draw, like every immediate-mode UI; clicks and drags resolve against the
last drawn frame at the moment of the pointer event.

## Frame pacing

p5 draws on a display refresh only if at least `1000 / target - 5` ms have passed since
the last draw, and the default target is 60. On a 60 Hz screen that draws every refresh.
On a 75 Hz screen it draws two refreshes out of three, so frame gaps alternate 13, 13, 27
ms and a drag judders. On 144 Hz the gaps alternate 14 and 21. `frameRate()` reports
`1000 / last gap`, so the number flickers between 75 and 37 without ever being either.

p5.interact sets `frameRate(Infinity)` after `setup()`, which makes p5 draw on every
refresh (and which `saveGif()` treats as 60, so exports are unaffected). It does this
only if the sketch never called `frameRate()` itself; a sketch that chose `frameRate(30)`
meant it. To turn it off entirely, before setup finishes:

```js
interact.config.frameRate = null;
```

`bench/drag-latency` measures the real frame gaps and has a button for p5's default
pacing so you can feel the difference. `upstream/p5-frame-pacing.md` is a draft issue
for p5 with the numbers.

## Examples and reference

```
python3 dev.py       # http://localhost:5173, live reload on save
```

`docs/` is the reference: one page per function, examples running live beside
editable code, in the style of the p5 reference. `examples/` follows the p5 examples:
a 710 × 400 sketch, a description, the code beneath it, editable.

- `00_Hover_And_Click` — three shapes that brighten under the mouse and toggle when clicked
- `01_Drag_Shapes` — a draggable circle, and a panel whose contents drag as a group
- `02_Drag_Between_Boxes` — circles moved between boxes with `dropped()`, `push(key)`, `noInteract()`
- `03_Keyed_Scopes` — the one failure mode of order-based scopes, and the `push(key)` fix
- `04_Picking_In_3D` — box, sphere, plane and line in WEBGL, with orbit that yields to drag
- `05_Every_Shape` — every p5 primitive answering `hovered()`

`bench/drag-latency` is a diagnostic, not an example: library drag vs hand-rolled drag vs
bare cursor, with frame-gap measurement and every knob.

## Releasing

```
npm version minor        # bumps package.json, syncs the version in this README and the docs, commits, tags
git push --follow-tags   # the tag triggers a GitHub release with notes from merged pull requests
npm publish
```

## Limits

- Only shapes drawn after a question are recorded, so an inert shape does not occlude
  what is behind it: you can grab a draggable thing through a plain `rect()` drawn on
  top of it. To make an inert shape solid, ask a question in its scope and ignore the
  answer: `push(); hovered(); rect(...); pop();`. `noInteract()` is the opposite, a
  shape that is drawn but see-through to picking.
- `bezierVertex` and `curveVertex` are not sampled; a curved shape is picked by its
  straight vertices.
- Hover resolves once per frame, so with `noLoop()` it updates on `redraw()`.
