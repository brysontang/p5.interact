// Whether each shape has been switched on
let lit = [false, false, false];

function setup() {
  // Create the canvas
  createCanvas(710, 400);
  noStroke();

  // Set screen reader accessible description
  describe('Three shapes that brighten when the mouse is over them and change color when clicked.');
}

function draw() {
  background(30);

  // A circle. hovered() and clicked() apply to the shapes drawn after them,
  // until pop().
  push();
  if (clicked()) lit[0] = !lit[0];
  fill(lit[0] ? 'gold' : hovered() ? 'orange' : 'steelblue');
  circle(150, 200, 170);
  pop();

  // A square, with the same two questions
  push();
  if (clicked()) lit[1] = !lit[1];
  fill(lit[1] ? 'gold' : hovered() ? 'orange' : 'seagreen');
  rect(275, 115, 170, 170, 24);
  pop();

  // A triangle. Picking is exact, so the corners of the bounding box do not count.
  push();
  if (clicked()) lit[2] = !lit[2];
  fill(lit[2] ? 'gold' : hovered() ? 'orange' : 'indianred');
  triangle(480, 290, 565, 110, 650, 290);
  pop();
}
