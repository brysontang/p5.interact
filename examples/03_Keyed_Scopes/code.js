// The circles, in draw order
let items = [];

// Whether scopes are keyed by the item, or matched by order
let keyed = false;

// When the last circle was added during a drag
let lastAdded = 0;

function setup() {
  // Create the canvas
  createCanvas(710, 400);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);

  for (let i = 0; i < 5; i++) {
    addItem();
  }

  // Set screen reader accessible description
  describe('A row of circles. While one is dragged, new circles appear at the front of the row.');
}

function addItem() {
  // New circles go to the front, which shifts every scope after them
  items.unshift({ x: 80 + items.length * 110, y: 160 });
}

function draw() {
  background(30);

  // While a drag is held, add a circle every second
  if (dragging() && millis() - lastAdded > 1000) {
    addItem();
    lastAdded = millis();
  }
  if (!dragging()) {
    lastAdded = millis();
  }

  for (let it of items) {
    // With a key, this scope is "it" whatever its position in the row
    push(keyed ? it : undefined);
    let d = dragged();
    if (d) {
      it.x += d.x;
      it.y += d.y;
    }
    fill(d ? 'gold' : hovered() ? 'orange' : 'steelblue');
    circle(it.x, it.y, 80);
    pop();
  }

  fill(200);
  text(keyed ? 'push(item): keyed. Press any key to switch.' : 'push(): matched by order. Press any key to switch.', width / 2, 340);
  text(items.length + ' circles', width / 2, 370);
}

function keyPressed() {
  keyed = !keyed;
}
