// Position of the circle
let ball = { x: 160, y: 200 };

// Position of the panel, and its dots relative to it
let panel = { x: 320, y: 90 };
let dots = [[50, 50], [150, 80], [260, 50], [150, 170]];

function setup() {
  // Create the canvas
  createCanvas(710, 400);
  noStroke();

  // Set screen reader accessible description
  describe('A draggable circle on the left and a panel of dots on the right that drags as one.');
}

function draw() {
  background(30);

  // The circle. dragged() returns { x, y } while it is being dragged,
  // and null otherwise.
  let d = dragged();
  if (d) {
    ball.x += d.x;
    ball.y += d.y;
  }
  fill(d ? 'gold' : hovered() ? 'orange' : 'steelblue');
  circle(ball.x, ball.y, 140);

  // The panel. dragged() is asked once, before translate(), so the delta is in
  // canvas units and everything drawn after it moves together.
  push();
  let g = dragged();
  if (g) {
    panel.x += g.x;
    panel.y += g.y;
  }
  translate(panel.x, panel.y);
  fill(hovered() ? 60 : 45);
  rect(0, 0, 320, 230, 18);
  fill('seagreen');
  for (let [x, y] of dots) {
    circle(x, y, 50);
  }
  pop();
}
