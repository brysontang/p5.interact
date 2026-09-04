# p5.interact

Interaction for p5 without ceremony.

**[Reference](https://brysontang.github.io/p5.interact/docs/)** · **[Guide](https://brysontang.github.io/p5.interact/docs/guide.html)** · **[Examples](https://brysontang.github.io/p5.interact/examples/)**, with the code running live beside every page.

```js
function draw() {
  background(0);

  for (const item of items) {
    push();
    const d = dragged();
    if (d) { item.x += d.x; item.y += d.y; }
    translate(item.x, item.y);
    fill(hovered() ? 200 : 60);
    if (clicked()) select(item);
    rect(0, 0, 100, 40, 8);
    pop();
  }
}
```

A p5 2.x addon, one file, no build step. It adds six questions you can ask inside
`draw()`. Each applies to the shapes drawn after it, and each returns a value that is
truthy when it applies, read inside `draw()` the way you read `mouseIsPressed`. No ids,
no handlers, no registration. State lives in your variables, where p5 sketches keep it
anyway.

## Why

p5 already has two ways to be interactive, and neither one touches the canvas. The
global event functions, `mousePressed()` and `mouseDragged()`, know when the mouse did
something and nothing about what you drew, so every clickable shape gets a hand-written
`dist()` test that only works for circles. The DOM layer, `createButton().mousePressed(fn)`,
works because it isn't canvas at all.

What neither does is treat interaction the way p5 treats everything else: as state you
set before you draw. `fill()` doesn't attach a color to a returned shape; it colors what
comes next. `hovered()` doesn't attach a handler to a returned shape; it applies to what
comes next. Say it that way and the rest follows: `push()` and `pop()` scope it, `noHover()`
is `noFill()`, and a question asked after a shape starts a new group the way a second
`fill()` starts a new color. The goal of this library is to make interaction in p5 feel
native and easy to reach for.

```js
fill(hovered() ? 'red' : 'yellow');
circle(100, 100, 40);
fill(hovered() ? 'red' : 'orange');
circle(200, 200, 40);
```

## Install

```html
<script src="https://cdn.jsdelivr.net/npm/p5@2.3.1/lib/p5.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5.interact@0.3.0/p5.interact.js"></script>
<script src="./sketch.js"></script>
```

Or `npm install p5.interact`, or download [`p5.interact.js`](https://github.com/brysontang/p5.interact/blob/main/p5.interact.js).
Load it once, right after p5. Works in WEBGL and 2D, global and instance mode. MIT.

One side effect to know: after `setup()` it sets `frameRate(Infinity)` so p5 draws on
every display refresh, unless your sketch called `frameRate()` itself. The
[guide](https://brysontang.github.io/p5.interact/docs/guide.html#frame-pacing) says why.
To turn it off: `interact.config.frameRate = null;`

## The questions

| | |
|---|---|
| [`hovered()`](https://brysontang.github.io/p5.interact/docs/reference/hovered.html) | `true` while the mouse is over the shapes that follow |
| [`clicked()`](https://brysontang.github.io/p5.interact/docs/reference/clicked.html) | `true` for one frame after they are clicked |
| [`dragged()`](https://brysontang.github.io/p5.interact/docs/reference/dragged.html) | `{ x, y }` while they are dragged, in local coordinates |
| [`dropped()`](https://brysontang.github.io/p5.interact/docs/reference/dropped.html) | `{ x, y }` for one frame after something is dropped on them |
| [`scrolled()`](https://brysontang.github.io/p5.interact/docs/reference/scrolled.html) | `{ x, y }` wheel delta while the wheel is over them |
| [`distance()`](https://brysontang.github.io/p5.interact/docs/reference/distance.html) | pixels from the mouse to their nearest edge, `0` inside |

`noHover()`, `noClick()`, `noDrag()`, `noDrop()`, `noScroll()`, `noDistance()` turn one
question off for the shapes that follow, like `noFill()`; `noInteract()` turns off all six.
[`tolerance(px)`](https://brysontang.github.io/p5.interact/docs/reference/tolerance.html)
makes the questions asked after it answer within `px` screen pixels of a shape's edge, so
the wheel can land in the gaps of a list while a drag still needs a card.
[`push(key)`](https://brysontang.github.io/p5.interact/docs/reference/push.html) keys a
scope by the object it draws. [`localMouse()`](https://brysontang.github.io/p5.interact/docs/reference/localMouse.html)
and [`hitInfo()`](https://brysontang.github.io/p5.interact/docs/reference/hitInfo.html) are
the helpers.

## Three rules

- **Only shapes after a question are picked.** Draw captions and backgrounds first and
  they stay out of click space with no verb at all.
- **Ask every frame, then decide.** A question inside a branch that doesn't run is never
  asked, and the previous one stays in force, like a fill you didn't set. Put it on its
  own line: `const hot = hovered();`.
- **Nothing bubbles.** A button inside a card doesn't also click the card. Ask once at a
  group and its children inherit; ask inside each child and they answer separately.

The [guide](https://brysontang.github.io/p5.interact/docs/guide.html) covers the rest:
why questions live on p5's own drawing state, dragging and dropping, keyed scopes, what
gets picked and how, frame pacing, and the limits.

## Examples

Six sketches in the style of the p5 examples, each with its code beside it:
[Hover and Click](https://brysontang.github.io/p5.interact/examples/00_Hover_And_Click/),
[Drag Shapes](https://brysontang.github.io/p5.interact/examples/01_Drag_Shapes/),
[Drag Between Boxes](https://brysontang.github.io/p5.interact/examples/02_Drag_Between_Boxes/),
[Keyed Scopes](https://brysontang.github.io/p5.interact/examples/03_Keyed_Scopes/),
[Picking in 3D](https://brysontang.github.io/p5.interact/examples/04_Picking_In_3D/),
[Every Shape](https://brysontang.github.io/p5.interact/examples/05_Every_Shape/).

To work on the docs or examples locally, and to run the tests:

```
python3 dev.py       # http://localhost:5173, live reload on save; tests at /test/
npm test             # the same tests in headless Chromium (needs: npx playwright install chromium)
```

## Releasing

```
npm version minor        # bumps package.json, syncs the version in this README and the docs, commits, tags
git push --follow-tags   # the tag triggers a GitHub release with notes from merged pull requests
npm publish
```

Version 0.1: the ideas are settled, the names might still move.
