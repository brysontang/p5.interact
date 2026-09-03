// Three boxes, each holding some circles at positions relative to the box
let boxes = [
  { x: 30, y: 40, w: 300, h: 220, items: [] },
  { x: 380, y: 60, w: 300, h: 220, items: [] },
  { x: 200, y: 300, w: 300, h: 90, items: [] },
];

// The circle being dragged, the box it came from, and where it was
let held = null;
let from = null;
let liftedAt = null;

function setup() {
  // Create the canvas
  createCanvas(710, 400);
  noStroke();

  // Put three circles in each box
  for (let box of boxes) {
    for (let i = 0; i < 3; i++) {
      box.items.push({ x: 60 + i * 80, y: box.h / 2 });
    }
  }

  // Set screen reader accessible description
  describe('Three boxes containing circles. Circles can be dragged from one box to another, and the boxes themselves can be dragged.');
}

function draw() {
  background(30);

  for (let box of boxes) {
    push();

    // Drag the box by its background and everything in it comes along
    let g = dragged();
    if (g) {
      box.x += g.x;
      box.y += g.y;
    }
    translate(box.x, box.y);

    // Something was released over this box: take it. The drag already left it where
    // you let go, in the old box's coordinates, so only shift by the difference.
    if (dropped() && held) {
      from.items.splice(from.items.indexOf(held), 1);
      box.items.push(held);
      held.x += from.x - box.x;
      held.y += from.y - box.y;
      held = null;
    }

    fill(hovered() ? 60 : 45);
    rect(0, 0, box.w, box.h, 16);

    for (let c of box.items) {
      if (c === held) {
        // A ghost where the held circle came from: drawn, but not pickable
        push();
        noInteract();
        noFill();
        stroke(100);
        strokeWeight(2);
        drawingContext.setLineDash([6, 6]);
        circle(liftedAt.x, liftedAt.y, 50);
        pop();
        continue;
      }

      // Each circle is keyed by its own object, so the drag survives being
      // drawn somewhere else once it is lifted
      push(c);
      let d = dragged();
      if (d) {
        liftedAt = { x: c.x, y: c.y };
        c.x += d.x;
        c.y += d.y;
        held = c;
        from = box;
      }
      fill(hovered() ? 'orange' : 'steelblue');
      circle(c.x, c.y, 50);
      pop();
    }
    pop();
  }

  // The held circle, drawn last so it sits above every box
  if (held) {
    push(held);
    translate(from.x, from.y);
    let d = dragged();
    if (d) {
      held.x += d.x;
      held.y += d.y;
    } else {
      // dragged() is null again the frame after release. No box took it: back home.
      held.x = liftedAt.x;
      held.y = liftedAt.y;
    }
    fill(d ? 'gold' : 'steelblue');
    circle(held.x, held.y, 50);
    if (!d) held = null;
    pop();
  }
}
