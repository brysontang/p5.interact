// The reference, as data. One entry per function. Examples are global-mode p5 sketches,
// run live beside their code. Keep them small: a 320 × 220 canvas, one idea each.

const REFERENCE = {

  hovered: {
    group: 'Questions',
    signature: 'hovered()',
    summary: 'Is the mouse over the shapes that follow?',
    description: [
      'Returns <code>true</code> when the mouse was over any shape drawn after this call, in this scope, on the previous frame. The question applies until the closing <code>pop()</code>, the same way <code>describeElement()</code> scopes itself. Questions asked back to back, like <code>hovered()</code> followed by <code>clicked()</code>, share the shapes that follow; a question asked after a shape has been drawn starts a new group.',
      'Nothing bubbles. When scopes nest, the innermost scope that asked <code>hovered()</code> is the one that answers <code>true</code>; its parents answer <code>false</code>. To make a group light up together, ask once at the group and let the children inherit it. Called at top level, outside any <code>push()</code>, it means "over anything drawn after this".',
      'The answer is one frame behind the draw, like every immediate-mode UI. While a scope is being dragged it reports <code>true</code>, because what you hold is under the mouse by definition.',
      'Ask every frame, then decide. A question inside a branch that does not run, like the second half of <code>lit ? \'gold\' : hovered() ? ...</code>, is never asked, and the previous question stays in force for the shapes that follow, the way a fill you did not set stays in force. Put the question on its own line: <code>const hot = hovered();</code>.',
    ],
    returns: '<code>Boolean</code>',
    examples: [
      {
        caption: 'One question, asked once. Both shapes are drawn after it, so hovering either one lights both. Set the fill, then let the question override it, the way you would inside an if.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  fill('steelblue');
  if (hovered()) fill('orange');
  circle(100, 110, 100);
  rect(180, 60, 100, 100, 16);
}`,
      },
      {
        caption: 'Two questions, two answers. A question asked after a shape starts a new group, so this works exactly like fill(): no push() needed.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  fill(hovered() ? 'orange' : 'steelblue');
  circle(100, 110, 100);

  fill(hovered() ? 'orange' : 'seagreen');
  rect(180, 60, 100, 100, 16);
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

  fill(200);
  circle(100, 110, 90);          // before the question: not part of it
  fill(hovered() ? 255 : 120);
  circle(220, 110, 90);          // after it: lights up
}`,
      },
      {
        caption: 'Nothing bubbles. Left: the panel asks once and its dots inherit, so they light together. Right: each dot asks for itself, so only the dot lights and the panel stays dark. push() and pop() here only keep the two panels apart.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  // Ask once: the dots never ask, so they belong to the panel's question
  push();
  const together = hovered();
  fill(together ? 70 : 45);
  rect(15, 30, 140, 160, 14);
  fill(together ? 'gold' : 'steelblue');
  for (let i = 0; i < 3; i++) circle(85, 60 + i * 50, 34);
  pop();

  // Ask in each dot: each question after a shape is a new group, so only the dot lights
  push();
  fill(hovered() ? 70 : 45);
  rect(165, 30, 140, 160, 14);
  for (let i = 0; i < 3; i++) {
    fill(hovered() ? 'gold' : 'steelblue');
    circle(235, 60 + i * 50, 34);
  }
  pop();
}`,
      },
    ],
    seeAlso: ['clicked', 'dragged', 'noInteract', 'hitInfo'],
  },

  clicked: {
    group: 'Questions',
    signature: 'clicked()',
    summary: 'Were the shapes that follow clicked?',
    description: [
      'Returns <code>true</code> for exactly one frame after a click on the shapes drawn after this call, in this scope. Read it inside <code>draw()</code> the way you read <code>mouseIsPressed</code>: <code>if (clicked()) count++</code>.',
      'Nothing bubbles. When scopes nest, the click goes to the innermost scope that asked <code>clicked()</code> and stops there: a button inside a card does not also click the card. If the inner scope asked only <code>hovered()</code>, the click passes to the nearest enclosing scope that asked <code>clicked()</code>.',
      'A press that travels more than <code>interact.config.clickSlop</code> pixels before release is a drag, not a click, so dragging and clicking never fight.',
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

  if (clicked()) on = !on;
  const hot = hovered();           // ask every frame: a skipped question leaves the last one in force
  fill(on ? 'gold' : hot ? 120 : 80);
  rect(90, 70, 140, 80, 20);
}`,
      },
      {
        caption: 'Counting clicks. One frame of true is enough to act on.',
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

  fill(255);
  text(count + ' clicks', 160, 190);   // drawn before the question: not part of it

  fill(hovered() ? 'orange' : 'steelblue');
  if (clicked()) count++;
  circle(160, 100, 100);
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
      'On the frame after release it returns <code>null</code> again, so <code>else if (lifted)</code> is where a drag ends. In WEBGL, <code>orbitControl()</code> sits out while a shape is being dragged, so a sketch can call it every frame without checking.',
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

  const d = dragged();
  const hot = hovered();
  if (d) { pos.x += d.x; pos.y += d.y; }
  fill(d ? 'gold' : hot ? 'orange' : 'steelblue');
  circle(pos.x, pos.y, 80);
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
    seeAlso: ['dropped', 'localMouse', 'push'],
  },

  dropped: {
    group: 'Questions',
    signature: 'dropped()',
    summary: 'Was something dragged and released on the shapes that follow?',
    description: [
      'Returns <code>{ x, y }</code> for one frame after a drag was released over the shapes drawn after this call, in the coordinates of the frame where you call it. Otherwise <code>null</code>.',
      'What was dropped is whatever your sketch was holding: keep it in a variable when <code>dragged()</code> first returns a delta. The thing being dragged is skipped by picking, so the target under it is what gets asked. Like clicks, drops do not bubble: the innermost scope that asked <code>dropped()</code> receives it.',
      'Usually you will not move the thing to the drop point. The drag already left it exactly where you released it, offset by wherever you grabbed it. A drop decides what happens next: keep it there, send it home, or hand it to a new parent by shifting its coordinates by the difference between the two frames. Set it to the drop point only when you mean to snap it to the cursor.',
      'Since <code>dropped()</code> fires in the middle of <code>draw()</code>, update your own drag state (what is held, where it came from) right there, so the rest of the frame draws the thing in its new place.',
    ],
    returns: '<code>{ x, y }</code> on the drop frame, else <code>null</code>.',
    examples: [
      {
        caption: 'Drag the circle onto a square and let go. It takes the color of the square it was dropped on.',
        code: `
const swatches = [
  { x: 60, y: 60, c: 'tomato' },
  { x: 160, y: 60, c: 'gold' },
  { x: 260, y: 60, c: 'mediumseagreen' },
];
let ball = { x: 160, y: 160, c: 'steelblue' };

function setup() {
  createCanvas(320, 220);
  rectMode(CENTER);
}

function draw() {
  background(30);

  // Each square asks dropped(). Drop the circle on one and it takes that color.
  noFill();
  strokeWeight(3);
  for (const s of swatches) {
    if (dropped()) ball.c = s.c;
    stroke(s.c);
    square(s.x, s.y, hovered() ? 66 : 60);
  }

  // The circle: drag it anywhere.
  noHover();                     // otherwise it would inherit the last square's hovered()
  noStroke();
  const d = dragged();
  if (d) { ball.x += d.x; ball.y += d.y; }
  fill(ball.c);
  circle(ball.x, ball.y, 50);
}`,
      },
    ],
    seeAlso: ['dragged', 'localMouse', 'push', 'noInteract'],
  },

  scrolled: {
    group: 'Questions',
    signature: 'scrolled()',
    summary: 'Was the wheel scrolled over the shapes that follow?',
    description: [
      'Returns <code>{ x, y }</code>, the wheel delta accumulated over the last frame while the wheel was over the shapes drawn after this call, or <code>null</code>. Positive <code>y</code> is scrolling down or away from you, the same sign p5 uses. Two wheel events in one frame add up, so the value is what <code>draw()</code> needs.',
      'A scope that asked owns the wheel over its shapes: the page does not scroll and <code>orbitControl()</code> does not zoom, the way scrolling inside a scrollable element never scrolls the page. Like every question, it is answered for the innermost scope that asked.',
    ],
    returns: '<code>{ x, y }</code> for the last frame\'s scrolling, else <code>null</code>.',
    examples: [
      {
        caption: 'A dial. Scroll over it to turn it. The page stays put: the dial asked, so it owns the wheel.',
        code: `
let angle = 0;

function setup() {
  createCanvas(320, 220);
  textAlign(CENTER, CENTER);
  textSize(14);
}

function draw() {
  background(30);
  noStroke();

  push();
  const s = scrolled();
  if (s) angle += s.y * 0.005;
  fill(hovered() ? 70 : 50);
  circle(160, 100, 130);
  stroke('gold');
  strokeWeight(4);
  line(160, 100, 160 + 55 * cos(angle), 100 + 55 * sin(angle));
  pop();

  fill(200);
  text('scroll over the dial', 160, 200);
}`,
      },
      {
        caption: 'A list that scrolls only when the wheel is over it.',
        code: `
let offset = 0;

function setup() {
  createCanvas(320, 220);
  textAlign(LEFT, CENTER);
  textSize(14);
}

function draw() {
  background(30);
  noStroke();

  const s = scrolled();
  if (s) offset = constrain(offset + s.y, 0, 400);
  fill(45);
  rect(40, 20, 240, 180, 12);
  fill(200);
  for (let i = 0; i < 20; i++) {
    const y = 40 + i * 30 - offset;
    if (y > 20 && y < 190) text('item ' + (i + 1), 60, y);
  }
}`,
      },
    ],
    seeAlso: ['clicked', 'dragged', 'hovered'],
  },

  distance: {
    group: 'Questions',
    signature: 'distance()',
    summary: 'How far is the mouse from the shapes that follow?',
    description: [
      'Returns the distance in screen pixels from the mouse to the nearest edge of the shapes drawn after this call, <code>0</code> when the mouse is inside one of them, and <code>Infinity</code> when none were drawn. It is a number, so use it in arithmetic: fade something in as the mouse approaches, or treat <code>distance() &lt; 16</code> as a generous hover for something thin.',
      'Exact for rectangles, polygons, lines and spheres. An estimate for ellipses and boxes, within a pixel or two, which is more than a glow needs. Measured in pixels at any zoom, so a proximity effect feels the same near and far.',
      'It costs one distance test per shape that asked, the same order of work as picking, so it is fine to ask every frame for every shape on screen.',
    ],
    returns: '<code>Number</code>, pixels; <code>0</code> inside, <code>Infinity</code> if no shape followed.',
    examples: [
      {
        caption: 'Three circles that brighten as the mouse approaches. The one under the mouse is full brightness.',
        code: `
function setup() {
  createCanvas(320, 220);
  noStroke();
}

function draw() {
  background(30);

  for (let i = 0; i < 3; i++) {
    const d = distance();                       // pixels to this circle, 0 inside
    const glow = constrain(1 - d / 120, 0, 1);  // 1 at the edge, 0 at 120 px away
    fill(lerpColor(color(50, 70, 100), color('gold'), glow));
    circle(60 + i * 100, 110, 60);
  }
}`,
      },
      {
        caption: 'A thin line with a generous hover. distance() < 16 is a hover you can actually hit.',
        code: `
function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);

  const near = distance() < 16;
  stroke(near ? 'orange' : 140);
  strokeWeight(near ? 3 : 1);
  line(30, 190, 290, 30);
}`,
      },
    ],
    seeAlso: ['hovered', 'hitInfo'],
  },

  noInteract: {
    group: 'Verbs',
    signature: 'noInteract()',
    summary: 'The shapes that follow are drawn but not in click space.',
    description: [
      'Like <code>noFill()</code> and <code>noStroke()</code> together, for picking. Shapes drawn after it in this scope are rendered as usual but answer no question, until <code>pop()</code> or a question is asked again. It is <code>noHover()</code>, <code>noClick()</code>, <code>noDrag()</code>, <code>noDrop()</code>, <code>noScroll()</code> and <code>noDistance()</code> at once.',
      'Often you do not need it: anything drawn <em>before</em> a question is not part of it, so a caption or a background drawn first needs no verb at all.',
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

  noHover: {
    group: 'Verbs',
    signature: 'noHover()',
    summary: 'The shapes that follow no longer answer hovered().',
    description: [
      'Like <code>noFill()</code> for one question. Shapes drawn after it in this scope keep answering the other questions but not <code>hovered()</code>, until <code>pop()</code> or <code>hovered()</code> is asked again. <code>noInteract()</code> does this for all five at once. A shape that answers no question at all is not recorded, and does not block what is behind it; to make something inert but solid, leave it one question to answer, usually <code>hovered()</code>.',
    ],
    examples: [
      {
        caption: 'The shapes after noHover() still take part in everything except highlight.',
        code: `
function setup() {
  createCanvas(320, 220);
  textAlign(CENTER, CENTER);
  textSize(16);
}

function draw() {
  background(30);
  noStroke();

  fill(hovered() ? 'orange' : 'steelblue');
  if (clicked()) count++;
  rect(60, 60, 200, 100, 20);

  noHover();                     // the label still clicks, but does not light the button
  fill(255);
  text('clicks: ' + count, 160, 110);
}

let count = 0;`,
      },
    ],
    seeAlso: ['noInteract', 'hovered'],
  },

  noClick: {
    group: 'Verbs',
    signature: 'noClick()',
    summary: 'The shapes that follow no longer answer clicked().',
    description: [
      'Like <code>noFill()</code> for one question. Shapes drawn after it in this scope keep answering the other questions but not <code>clicked()</code>, until <code>pop()</code> or <code>clicked()</code> is asked again. <code>noInteract()</code> does this for all five at once. A shape that answers no question at all is not recorded, and does not block what is behind it; to make something inert but solid, leave it one question to answer, usually <code>hovered()</code>.',
    ],
    examples: [
      {
        caption: 'The shapes after noClick() still take part in everything except click.',
        code: `
let count = 0;

function setup() {
  createCanvas(320, 220);
  textAlign(CENTER, CENTER);
  textSize(16);
}

function draw() {
  background(30);
  noStroke();

  fill(hovered() ? 'orange' : 'steelblue');
  if (clicked()) count++;
  rect(60, 40, 200, 140, 20);

  noClick();                     // the badge still highlights, but clicking it does nothing
  fill(hovered() ? 'gold' : 'seagreen');
  circle(160, 110, 50);

  noInteract();
  fill(255);
  text('clicks: ' + count, 160, 200);
}`,
      },
    ],
    seeAlso: ['noInteract', 'clicked'],
  },

  noDrag: {
    group: 'Verbs',
    signature: 'noDrag()',
    summary: 'The shapes that follow no longer answer dragged().',
    description: [
      'Like <code>noFill()</code> for one question. Shapes drawn after it in this scope keep answering the other questions but not <code>dragged()</code>, until <code>pop()</code> or <code>dragged()</code> is asked again. <code>noInteract()</code> does this for all five at once. A shape that answers no question at all is not recorded, and does not block what is behind it; to make something inert but solid, leave it one question to answer, usually <code>hovered()</code>.',
    ],
    examples: [
      {
        caption: 'The shapes after noDrag() still take part in everything except drag.',
        code: `
let pos = { x: 60, y: 60 };

function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  push();
  const d = dragged();
  if (d) { pos.x += d.x; pos.y += d.y; }
  translate(pos.x, pos.y);
  fill(hovered() ? 70 : 50);
  rect(0, 0, 200, 100, 16);       // drag the panel by its body

  noDrag();                      // the knob is part of the panel's hover, but grabbing it does not drag
  fill(hovered() ? 'gold' : 'steelblue');
  circle(160, 50, 40);
  pop();
}`,
      },
    ],
    seeAlso: ['noInteract', 'dragged'],
  },

  noDrop: {
    group: 'Verbs',
    signature: 'noDrop()',
    summary: 'The shapes that follow no longer answer dropped().',
    description: [
      'Like <code>noFill()</code> for one question. Shapes drawn after it in this scope keep answering the other questions but not <code>dropped()</code>, until <code>pop()</code> or <code>dropped()</code> is asked again. <code>noInteract()</code> does this for all five at once. A shape that answers no question at all is not recorded, and does not block what is behind it; to make something inert but solid, leave it one question to answer, usually <code>hovered()</code>.',
    ],
    examples: [
      {
        caption: 'A box you can drop the coin into, except on its title bar. The bar is drawn over the box and stays in click space, but after noDrop() it refuses drops, so the coin slides home.',
        code: `
let home = { x: 60, y: 170 };
let coin = { x: 60, y: 170 };
let lifted = false;
let landed = false;

function setup() {
  createCanvas(320, 220);
}

function draw() {
  background(30);
  noStroke();

  // The box accepts drops anywhere in its body. The drag already put the coin
  // where you let go, so a drop only has to let it stay.
  if (dropped()) landed = true;
  fill(45);
  rect(120, 30, 180, 160, 12);

  // ...except its title bar, drawn over it. hovered() keeps it in click space.
  noDrop();
  fill(hovered() ? 80 : 60);
  rect(120, 30, 180, 34, 12);

  // The coin. dragged() is null again the frame after release: that is where the drag ends.
  const d = dragged();
  if (d) {
    coin.x += d.x; coin.y += d.y;
    lifted = true;
  } else if (lifted) {
    if (!landed) coin = { ...home };   // released somewhere that took no drop: back home
    lifted = false;
    landed = false;
  }
  fill(hovered() ? 'orange' : 'gold');
  circle(coin.x, coin.y, 30);
}`,
      },
    ],
    seeAlso: ['noInteract', 'dropped'],
  },

  noScroll: {
    group: 'Verbs',
    signature: 'noScroll()',
    summary: 'The shapes that follow no longer answer scrolled().',
    description: [
      'Like <code>noFill()</code> for one question. Shapes drawn after it in this scope keep answering the other questions but not <code>scrolled()</code>, until <code>pop()</code> or <code>scrolled()</code> is asked again. <code>noInteract()</code> does this for all five at once. A shape that answers no question at all is not recorded, and does not block what is behind it; to make something inert but solid, leave it one question to answer, usually <code>hovered()</code>.',
    ],
    examples: [
      {
        caption: 'The shapes after noScroll() still take part in everything except scroll.',
        code: `
let offset = 0;

function setup() {
  createCanvas(320, 220);
  textAlign(LEFT, CENTER);
  textSize(14);
}

function draw() {
  background(30);
  noStroke();

  const s = scrolled();
  if (s) offset = constrain(offset + s.y, 0, 300);
  fill(45);
  rect(20, 20, 280, 180, 12);
  fill(200);
  for (let i = 0; i < 15; i++) {
    const y = 40 + i * 30 - offset;
    if (y > 20 && y < 190) text('item ' + (i + 1), 40, y);
  }

  noScroll();                    // a header: it highlights, but the wheel over it does nothing
  fill(hovered() ? 80 : 60);     // asking hovered() keeps it in click space, so it covers the list
  rect(20, 20, 280, 36, 12);
  fill(255);
  text('header', 40, 38);
}`,
      },
    ],
    seeAlso: ['noInteract', 'scrolled'],
  },

  localMouse: {
    group: 'Helpers',
    signature: 'localMouse()',
    summary: 'The mouse in the current coordinate frame.',
    description: [
      '<code>mouseX</code> and <code>mouseY</code> are in canvas pixels. <code>localMouse()</code> is the same point expressed in whatever frame your <code>translate()</code>, <code>rotate()</code>, and <code>scale()</code> calls have built, as <code>{ x, y }</code>. In WEBGL it is the point where the mouse ray meets the frame\'s z = 0 plane.',
      'Most sketches never need it, since <code>dragged()</code> already delivers deltas in local units. It is there for the moment you want to place something at the mouse in a transformed frame, or snap a dropped thing to the cursor while keeping the offset you grabbed it by.',
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
      'Pass a key and the scope is identified by that key instead. Objects key by reference, strings and numbers by value. You need this when the thing you are dragging has to be drawn somewhere else while held, for instance last so it sits on top in 2D, or when the draw order changes mid-drag: items sorting, spawning, or filtering. Use a key once per frame. If your data is rebuilt every frame, an object never matches itself: key by something stable, <code>push(item.id)</code>.',
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
    const hot = hovered();
    if (d) it.x += d.x;
    fill(d ? 'gold' : hot ? 'orange' : 'steelblue');
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
      '<code>interact.config.lineTolerance</code> (3): minimum half-width for picking a <code>line()</code>, in screen pixels, so thin lines stay hittable however far the camera is.',
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

  fill(255);
  text(clicks + ' clicks · slop ' + interact.config.clickSlop + 'px', 160, 200);

  if (clicked()) clicks++;
  const d = dragged();
  const hot = hovered();
  if (d) { pos.x += d.x; pos.y += d.y; }
  fill(d ? 'gold' : hot ? 'orange' : 'steelblue');
  circle(pos.x, pos.y, 80);
}`,
      },
    ],
    seeAlso: ['clicked', 'dragged'],
  },
};
