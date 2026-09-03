function setup() {
  // Create the canvas
  createCanvas(710, 400);
  textAlign(CENTER, CENTER);

  // Set screen reader accessible description
  describe('Seven kinds of shape that highlight when the mouse is over them, with a label naming the shape under the mouse.');
}

function draw() {
  background(30);
  noStroke();

  // Name what is under the mouse. Drawn before any question, so the label
  // itself is never picked.
  let hit = hitInfo();
  fill(150);
  textSize(14);
  text(hit ? 'under the mouse: ' + hit.shape.kind : 'under the mouse: nothing', width / 2, 375);

  // A rounded rectangle. Each question after a shape starts a new group,
  // so these need no push() / pop().
  fill(hovered() ? 'orange' : 'steelblue');
  rect(40, 40, 150, 100, 24);

  // An ellipse
  fill(hovered() ? 'orange' : 'seagreen');
  ellipse(310, 90, 170, 90);

  // A triangle
  fill(hovered() ? 'orange' : 'indianred');
  triangle(430, 140, 510, 30, 590, 140);

  // A quad, rotated and scaled: picking follows the transform
  push();
  translate(130, 260);
  rotate(frameCount * 0.01);
  scale(1.3);
  fill(hovered() ? 'orange' : 'mediumpurple');
  quad(-50, -40, 50, -50, 40, 45, -45, 40);
  pop();

  // A polygon built from vertices
  fill(hovered() ? 'orange' : 'darkcyan');
  beginShape();
  vertex(320, 190);
  vertex(390, 220);
  vertex(400, 300);
  vertex(330, 330);
  vertex(270, 260);
  endShape(CLOSE);

  // A line, picked within its stroke weight (or three screen pixels, whichever is wider)
  push();
  stroke(hovered() ? 'orange' : 160);
  strokeWeight(hovered() ? 6 : 3);
  line(470, 200, 660, 320);
  pop();

  // Text, picked by its bounds
  push();
  textSize(28);
  fill(hovered() ? 'orange' : 200);
  text('text', 560, 190);
  pop();
}
