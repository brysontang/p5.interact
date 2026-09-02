// The reference, as data. One entry per function. Examples are global-mode p5 sketches,
// run live beside their code. Keep them small: a 320 × 220 canvas, one idea each.

const REFERENCE = {

  hovered: {
    group: 'Questions',
    signature: 'hovered()',
    summary: 'Is the mouse over the shapes that follow?',
    description: [
      'Returns <code>true</code> when the mouse was over any shape drawn after this call, in this scope, on the previous frame. The question applies until the next question in the same scope or the closing <code>pop()</code>, the same way <code>describeElement()</code> scopes itself.',
      'Nested scopes bubble: a hover on a child is a hover on its parent, like <code>:hover</code> in CSS. Called at top level, outside any <code>push()</code>, it means "over anything drawn after this".',
      'The answer is one frame behind the draw, like every immediate-mode UI. While a scope is being dragged it reports <code>true</code>, because what you hold is under the mouse by definition.',
    ],
    returns: '<code>Boolean</code>',
    examples: [
      {
        caption: 'One question, asked once. Both shapes are drawn after it, so hovering either one lights both.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  fill(hovered() ? 'orange' : 'steelblue');
  circle(100, 110, 100);
  rect(180, 60, 100, 100, 16);
}`,
      },
      {
        caption: 'Two scopes, two answers. push() and pop() end one question and begin another.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  push();
  fill(hovered() ? 'orange' : 'steelblue');
  circle(100, 110, 100);
  pop();

  push();
  fill(hovered() ? 'orange' : 'seagreen');
  rect(180, 60, 100, 100, 16);
  pop();
}`,
      },
      {
        caption: 'Only shapes after the question take part. The first circle is plain drawing.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  push();
  fill(200);
  circle(100, 110, 90);          // before the question: not part of it
  fill(hovered() ? 255 : 120);
  circle(220, 110, 90);          // after it: lights up
  pop();
}`,
      },
      {
        caption: 'Bubbling. Hovering a dot also hovers the panel that contains it.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  push();
  fill(hovered() ? 70 : 45);       // the panel: true over any dot, too
  rect(30, 30, 260, 160, 14);
  for (let i = 0; i < 4; i++) {
    push();
    fill(hovered() ? 'gold' : 'steelblue');
    circle(70 + i * 60, 110, 40);
    pop();
  }
  pop();
}`,
      },
    ],
    seeAlso: ['clicked', 'dragged', 'noInteract', 'hitInfo'],
  },

  clicked: {
    group: 'Questions',
    signature: 'clicked([fn])',
    summary: 'Were the shapes that follow clicked?',
    description: [
      'Returns <code>true</code> for exactly one frame after a click on the shapes drawn after this call, in this scope. With a function, it also calls that function at the moment of the click, as <code>fn(event, hit)</code>, innermost scope first.',
      'A press that travels more than <code>interact.config.clickSlop</code> pixels before release is a drag, not a click, so dragging and clicking never fight.',
    ],
    params: [
      { name: 'fn', type: 'Function (optional)', desc: 'Called on click with the pointer event and the hit record <code>{ shape, u, v }</code>.' },
    ],
    returns: '<code>Boolean</code>, true for one frame after a click.',
    examples: [
      {
        caption: 'Polling. clicked() is true for one frame, which is enough to flip a variable.',
        code: `
let on = false;

function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  push();
  if (clicked()) on = !on;
  fill(on ? 'gold' : hovered() ? 120 : 80);
  rect(90, 70, 140, 80, 20);
  pop();
}`,
      },
      {
        caption: 'A callback, when the click should do something rather than be something.',
        code: `
let count = 0;

function setup() {
  createCanvas(320, 220);
  textAlign(CENTER, CENTER);
  textSize(18);
}

function draw() {
  background(30);
  noStroke();

  push();
  fill(hovered() ? 'orange' : 'steelblue');
  clicked(() => count++);
  circle(160, 100, 100);
  pop();

  fill(255);
  text(count + ' clicks', 160, 190);
}`,
      },
    ],
    seeAlso: ['hovered', 'dragged', 'config'],
  },

  dragged: {
    group: 'Questions',
    signature: 'dragged()',
    summary: 'Are the shapes that follow being dragged? Returns the delta.',
    description: [
      'Returns <code>{ x, y }</code> while the shapes drawn after this call are being dragged, in the coordinates of the frame where you call it, or <code>null</code>. Call it before your <code>translate()</code> and the delta is in the parent\'s units, ready to add to a position.',
      'Everything drawn after it in the scope moves together, which is how a group drag works with no extra code: put <code>dragged()</code> on the group, not on the pieces. A drag is claimed by the innermost scope that asked for it and stays claimed until release, even if the mouse leaves the shape.',
      'The delta is delivered once per frame. A second <code>dragged()</code> on the same scope in the same frame returns <code>{ x: 0, y: 0 }</code>, which is still truthy. While a scope is dragged its shapes are skipped by picking, so whatever is underneath can answer <code>hovered()</code> and <code>dropped()</code>.',
    ],
    returns: '<code>{ x, y }</code> while dragging, else <code>null</code>.',
    examples: [
      {
        caption: 'One draggable circle. The delta lands in the same units as the position.',
        code: `
const pos = { x: 160, y: 110 };

function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  push();
  const d = dragged();
  if (d) { pos.x += d.x; pos.y += d.y; }
  fill(d ? 'gold' : hovered() ? 'orange' : 'steelblue');
  circle(pos.x, pos.y, 80);
  pop();
}`,
      },
      {
        caption: 'A group. dragged() on the panel moves the panel and everything in it.',
        code: `
const panel = { x: 40, y: 40 };
const dots = [[40, 40], [110, 70], [180, 40], [110, 120]];

function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  push();
  const d = dragged();
  if (d) { panel.x += d.x; panel.y += d.y; }
  translate(panel.x, panel.y);
  fill(hovered() ? 60 : 45);
  rect(0, 0, 230, 150, 14);
  fill('steelblue');
  for (const [x, y] of dots) circle(x, y, 36);
  pop();
}`,
      },
    ],
    seeAlso: ['dropped', 'dragging', 'localMouse', 'push'],
  },

  dropped: {
    group: 'Questions',
    signature: 'dropped()',
    summary: 'Was something dragged and released on the shapes that follow?',
    description: [
      'Returns <code>{ x, y }</code> for one frame after a drag was released over the shapes drawn after this call, in the coordinates of the frame where you call it. Otherwise <code>null</code>.',
      'What was dropped is whatever your sketch was holding: keep it in a variable when <code>dragged()</code> first returns a delta. The thing being dragged is skipped by picking, so the target under it is what gets asked.',
      'Since <code>dropped()</code> fires in the middle of <code>draw()</code>, update your own drag state (what is held, where it came from) right there, so the rest of the frame draws the thing in its new place.',
    ],
    returns: '<code>{ x, y }</code> on the drop frame, else <code>null</code>.',
    examples: [
      {
        caption: 'A circle that can be dropped into either box. While held it is drawn last, on top of both boxes, so its scope is keyed with push(ball). Drop it elsewhere and it goes home.',
        code: `
const boxes = [{ x: 20, y: 40, w: 130, h: 140 }, { x: 170, y: 40, w: 130, h: 140 }];
let ball = { box: 0, x: 65, y: 70 };
let held = false, home = null, grab = null;

function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  for (const [i, b] of boxes.entries()) {
    push();
    translate(b.x, b.y);
    const at = dropped();
    if (at && held) {
      ball = { box: i, x: at.x + grab.x, y: at.y + grab.y };
      held = false;
    }
    fill(hovered() ? 70 : 45);
    rect(0, 0, b.w, b.h, 12);
    if (ball.box === i && !held) drawBall();   // at rest: inside its box
    pop();
  }

  if (held) {                                  // in flight: drawn last, above both boxes
    push();
    translate(boxes[ball.box].x, boxes[ball.box].y);
    drawBall();
    pop();
  }
  if (held && !dragging()) { ball = home; held = false; }
}

function drawBall() {
  push(ball);                                  // keyed: same scope wherever it is drawn
  const d = dragged();
  if (d) {
    if (!held) home = { ...ball };
    ball.x += d.x; ball.y += d.y;
    if (!held) { const m = localMouse(); grab = { x: ball.x - m.x, y: ball.y - m.y }; }
    held = true;
  }
  fill(held ? 'gold' : hovered() ? 'orange' : 'steelblue');
  circle(ball.x, ball.y, 50);
  pop();
}`,
      },
    ],
    seeAlso: ['dragged', 'localMouse', 'push', 'noInteract'],
  },

  dragging: {
    group: 'Questions',
    signature: 'dragging()',
    summary: 'Is any drag in progress?',
    description: [
      'Returns <code>true</code> from the moment a draggable scope is pressed until the pointer is released. It is not scoped: it asks about the whole sketch.',
      'Its main job is to keep <code>orbitControl()</code> from fighting a drag in WEBGL: <code>if (!dragging()) orbitControl();</code>. It is also how a sketch notices that a drag ended somewhere nothing asked <code>dropped()</code>.',
    ],
    returns: '<code>Boolean</code>',
    examples: [
      {
        caption: 'Orbit with the mouse, unless the mouse is holding the box.',
        code: `
const pos = { x: 0, y: 0 };

function setup() {
  createCanvas(320, 220, WEBGL);
}

function draw() {
  background(30);
  if (!dragging()) orbitControl();

  push();
  const d = dragged();
  if (d) { pos.x += d.x; pos.y += d.y; }
  translate(pos.x, pos.y, 0);
  noStroke();
  fill(d ? 'gold' : hovered() ? 'orange' : 'steelblue');
  box(70);
  pop();
}`,
      },
    ],
    seeAlso: ['dragged', 'dropped'],
  },

  noInteract: {
    group: 'Verbs',
    signature: 'noInteract()',
    summary: 'The shapes that follow are drawn but not in click space.',
    description: [
      'Like <code>noFill()</code> for picking. Shapes drawn after it in this scope are rendered as usual but never hit-tested, until <code>pop()</code> or the next question in the scope turns picking back on.',
      'Use it for labels drawn over a button, a background that would otherwise eat hovers, a ghost left behind while something is dragged, or a decorative ring around a selection.',
      'The opposite case also comes up: a shape nobody asks about that should still block what is behind it, like a panel drawn over a scene. Shapes are only recorded after a question, so an inert shape is see-through by default. To make it solid, ask a question in its scope and ignore the answer: <code>push(); hovered(); rect(...); pop();</code>.',
    ],
    examples: [
      {
        caption: 'The problem. The backdrop is drawn after the question, so it is part of it, and the mouse is always over it: the shapes light up wherever the mouse is.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  push();
  const over = hovered();        // meant: "over the circle or the square?"
  noStroke();
  fill(over ? 60 : 30);
  rect(0, 0, width, height);     // the backdrop counts too, so over is always true
  fill(over ? 'orange' : 'steelblue');
  circle(100, 110, 90);
  rect(180, 60, 100, 100, 16);
  pop();
}`,
      },
      {
        caption: 'The fix. The backdrop sits in its own push/pop with noInteract(): drawn, not picked. pop() turns picking back on for the shapes.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  push();
  const over = hovered();
  noStroke();

  push();
  noInteract();                  // like noFill(): applies until pop()
  fill(over ? 60 : 30);
  rect(0, 0, width, height);
  pop();

  fill(over ? 'orange' : 'steelblue');
  circle(100, 110, 90);
  rect(180, 60, 100, 100, 16);
  pop();
}`,
      },
      {
        caption: 'Also for labels: without noInteract() the text would be the thing you hover, and hitInfo() would say so.',
        code: `
function setup() {
  createCanvas(320, 220);
  textAlign(CENTER, CENTER);
  textSize(18);
}

function draw() {
  background(30);
  noStroke();

  push();
  fill(hovered() ? 'orange' : 'steelblue');
  rect(60, 70, 200, 80, 20);
  noInteract();
  fill(255);
  text('a button', 160, 110);
  pop();

  fill(150);
  textSize(12);
  text(hitInfo() ? 'hit: ' + hitInfo().shape.kind : 'hit: nothing', 160, 190);
}`,
      },
    ],
    seeAlso: ['hovered', 'dropped'],
  },

  localMouse: {
    group: 'Helpers',
    signature: 'localMouse()',
    summary: 'The mouse in the current coordinate frame.',
    description: [
      '<code>mouseX</code> and <code>mouseY</code> are in canvas pixels. <code>localMouse()</code> is the same point expressed in whatever frame your <code>translate()</code>, <code>rotate()</code>, and <code>scale()</code> calls have built, as <code>{ x, y }</code>. In WEBGL it is the point where the mouse ray meets the frame\'s z = 0 plane.',
      'Use it at lift time to remember where on a thing you grabbed it, so a drop does not recenter the thing on the cursor.',
    ],
    returns: '<code>{ x, y }</code>, or <code>null</code> if the frame is edge-on to the camera.',
    examples: [
      {
        caption: 'A dot that follows the mouse inside a rotated, scaled frame.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  push();
  translate(160, 110);
  rotate(frameCount * 0.01);
  scale(1.5);
  fill(60);
  rect(-60, -40, 120, 80, 8);
  const m = localMouse();
  fill('gold');
  circle(m.x, m.y, 10);
  pop();
}`,
      },
    ],
    seeAlso: ['dragged', 'dropped', 'hitInfo'],
  },

  hitInfo: {
    group: 'Helpers',
    signature: 'hitInfo()',
    summary: 'The full record of what is under the mouse.',
    description: [
      'Returns <code>{ shape, u, v, t }</code> for the shape under the mouse on the previous frame, or <code>null</code>. <code>u, v</code> are the mouse position in the shape\'s own coordinates. <code>t</code> is depth along the view ray in WEBGL, 0 at the near plane and 1 at the far plane. <code>shape.kind</code> is one of <code>rect</code>, <code>ellipse</code>, <code>poly</code>, <code>line</code>, <code>box</code>, <code>sphere</code>.',
      'Most sketches never need it. It is there for the moment you want to know where inside a thing the mouse is.',
    ],
    returns: '<code>{ shape, u, v, t }</code> or <code>null</code>.',
    examples: [
      {
        caption: 'Where inside the rectangle the mouse is, in the rectangle\'s own units.',
        code: `
function setup() {
  createCanvas(320, 220);
  textAlign(CENTER, CENTER);
  textSize(14);
}

function draw() {
  background(30);
  noStroke();

  push();
  translate(60, 50);
  fill(hovered() ? 70 : 50);
  rect(0, 0, 200, 120, 10);
  const h = hitInfo();
  if (h) {
    fill('gold');
    circle(h.u, h.v, 8);
    fill(255);
    text(Math.round(h.u) + ', ' + Math.round(h.v), 100, 100);
  }
  pop();
}`,
      },
    ],
    seeAlso: ['hovered', 'localMouse'],
  },

  push: {
    group: 'Scopes',
    signature: 'push([key])',
    summary: 'Begin a scope. With a key, the scope keeps its identity across frames.',
    description: [
      'p5\'s <code>push()</code> saves drawing state. p5.interact also makes it the boundary of a question: a question applies until the closing <code>pop()</code>. Scopes are matched from one frame to the next by order, so the third <code>push()</code> this frame is the same thing as the third <code>push()</code> last frame.',
      'Pass a key and the scope is identified by that key instead. Objects key by reference, strings and numbers by value. You need this when the thing you are dragging has to be drawn somewhere else while held, for instance last so it sits on top in 2D, or when the draw order changes mid-drag: items sorting, spawning, or filtering. Use a key once per frame.',
    ],
    params: [
      { name: 'key', type: 'Any (optional)', desc: 'An object, string, or number that identifies this scope across frames.' },
    ],
    examples: [
      {
        caption: 'The list re-sorts by x every frame. Keyed by the item, the drag follows the item, not the slot.',
        code: `
const items = [{ x: 60 }, { x: 160 }, { x: 260 }];

function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();
  items.sort((a, b) => a.x - b.x);       // draw order changes while you drag

  for (const it of items) {
    push(it);                            // try push() instead and drag one past another
    const d = dragged();
    if (d) it.x += d.x;
    fill(d ? 'gold' : hovered() ? 'orange' : 'steelblue');
    circle(it.x, 110, 60);
    pop();
  }
}`,
      },
    ],
    seeAlso: ['dragged', 'dropped'],
  },

  config: {
    group: 'Scopes',
    signature: 'interact.config',
    summary: 'The few knobs there are.',
    description: [
      '<code>interact.config.clickSlop</code> (5): pixels of pointer travel before a press stops counting as a click and becomes a drag.',
      '<code>interact.config.cursor</code> (true): show a pointer cursor over anything interactive.',
      '<code>interact.config.lineTolerance</code> (3): minimum half-width, in shape units, for picking a <code>line()</code>.',
      '<code>interact.config.frameRate</code> (Infinity): applied after <code>setup()</code> unless the sketch called <code>frameRate()</code> itself. p5 draws on a display refresh only if <code>1000 / target - 5</code> ms have passed, and the default target of 60 skips refreshes unevenly on 75 or 144 Hz screens, which reads as judder while dragging. Infinity draws on every refresh. Set it to <code>null</code> to leave p5 alone.',
      'Every function is also available under the <code>interact</code> namespace, as <code>interact.hovered()</code> and so on, for sketches that prefer not to use the bare globals.',
    ],
    examples: [
      {
        caption: 'A large click slop: you have to move a good way before a press becomes a drag.',
        code: `
interact.config.clickSlop = 40;

const pos = { x: 160, y: 110 };
let clicks = 0;

function setup() {
  createCanvas(320, 220);
  textAlign(CENTER, CENTER);
  textSize(14);
}

function draw() {
  background(30);
  noStroke();

  push();
  if (clicked()) clicks++;
  const d = dragged();
  if (d) { pos.x += d.x; pos.y += d.y; }
  fill(d ? 'gold' : hovered() ? 'orange' : 'steelblue');
  circle(pos.x, pos.y, 80);
  pop();

  fill(255);
  text(clicks + ' clicks · slop ' + interact.config.clickSlop + 'px', 160, 200);
}`,
      },
    ],
    seeAlso: ['clicked', 'dragged'],
  },
};
