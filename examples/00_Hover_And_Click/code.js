// Whether each shape has been switched on
let lit = [false, false, false];

function setup() {
  // Create the canvas
  createCanvas(710, 400);
  noStroke();

  // Set screen reader accessible description
  describe('A circle, a rounded square and a star that brighten when the mouse is over them and change color when clicked.');
}

function draw() {
  background(30);

  // A circle. hovered() and clicked() apply to the shapes drawn after them.
  // Ask every frame, then decide: a question you skip leaves the previous one in force.
  if (clicked()) lit[0] = !lit[0];
  let hot = hovered();
  fill(lit[0] ? 'gold' : hot ? 'orange' : 'steelblue');
  circle(150, 200, 170);

  // A square. Asking again after a shape starts a new group,
  // the same way a second fill() starts a new color.
  if (clicked()) lit[1] = !lit[1];
  hot = hovered();
  fill(lit[1] ? 'gold' : hot ? 'orange' : 'seagreen');
  rect(275, 115, 170, 170, 24);

  // A star built from vertices. Picking is exact: the gaps between the points
  // do not count, and no shape needs its own hit test.
  if (clicked()) lit[2] = !lit[2];
  hot = hovered();
  fill(lit[2] ? 'gold' : hot ? 'orange' : 'indianred');
  beginShape();
  for (let i = 0; i < 10; i++) {
    let r = i % 2 === 0 ? 95 : 40;
    let a = -HALF_PI + i * PI / 5;
    vertex(565 + r * cos(a), 200 + r * sin(a));
  }
  endShape(CLOSE);
}
