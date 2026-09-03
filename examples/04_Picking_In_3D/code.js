// Position of the box
let cube = { x: -180, y: 0 };

function setup() {
  // Create a WEBGL canvas
  createCanvas(710, 400, WEBGL);
  noStroke();

  // Set screen reader accessible description
  describe('A box, a sphere, a tilted plane and a line in 3D. Shapes highlight under the mouse and the box can be dragged.');
}

function draw() {
  background(30);

  // Orbit with the mouse. While the box is being dragged, orbitControl() sits out on its own.
  orbitControl();

  // The box: draggable in the plane it sits in
  push();
  let d = dragged();
  let hot = hovered();
  if (d) {
    cube.x += d.x;
    cube.y += d.y;
  }
  translate(cube.x, cube.y, 0);
  rotateY(frameCount * 0.01);
  fill(d ? 'gold' : hot ? 'orange' : 'steelblue');
  box(90);
  pop();

  // The sphere, picked by ray intersection
  push();
  translate(0, 0, 0);
  fill(hovered() ? 'orange' : 'seagreen');
  sphere(55);
  pop();

  // A tilted plane, picked as a rectangle in its own orientation
  push();
  translate(200, -60, -80);
  rotateX(0.6);
  rotateY(-0.4);
  fill(hovered() ? 'orange' : 'indianred');
  plane(140, 100);
  pop();

  // A line between the sphere and the plane, picked within its stroke weight
  push();
  stroke(hovered() ? 'orange' : 140);
  strokeWeight(hovered() ? 5 : 2);
  line(0, 0, 0, 200, -60, -80);
  pop();
}
