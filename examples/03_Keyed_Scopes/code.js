// Two rows of circles. The top row uses push(), the bottom row push(item).
let rows = [
  { label: 'push()', keyed: false, y: 130, items: [] },
  { label: 'push(item)', keyed: true, y: 270, items: [] },
];

// When a circle was last added to the row being dragged
let lastAdded = 0;

function setup() {
  // Create the canvas
  createCanvas(710, 400);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(16);

  for (let row of rows) {
    resetRow(row);
  }

  // Set screen reader accessible description
  describe('Two rows of circles. Holding a circle adds circles to its row. In the top row the drag jumps to a neighbor; in the bottom row it does not.');
}

function resetRow(row) {
  row.items = [];
  for (let i = 0; i < 3; i++) {
    addItem(row);
  }
}

function addItem(row) {
  // The new circle appears at the right end, but goes to the FRONT of the draw
  // order, which shifts every circle after it by one place.
  row.items.unshift({ x: 200 + row.items.length * 90, y: row.y });
}

function draw() {
  background(30);

  // Labels, drawn before any question so they are never picked
  fill(200);
  for (let row of rows) {
    text(row.label, 40, row.y);
  }
  fill(150);
  textSize(13);
  text('Hold a circle. New circles join its row at the front of the draw order. Let go to reset.', 40, 370);
  textSize(16);

  let holding = null;

  for (let row of rows) {
    for (let it of row.items) {
      // The only difference between the rows: with a key, this scope is "it"
      // wherever it lands in the draw order. Without one, it is "the third push()".
      push(row.keyed ? it : undefined);
      let d = dragged();
      let hot = hovered();
      if (d) {
        it.x += d.x;
        it.y += d.y;
        holding = row;
      }
      fill(d ? 'gold' : hot ? 'orange' : 'steelblue');
      circle(it.x, it.y, 70);
      pop();
    }
  }

  // While a circle is held, add one to its row every second, up to six
  if (holding) {
    if (millis() - lastAdded > 1000 && holding.items.length < 6) {
      addItem(holding);
      lastAdded = millis();
    }
  } else {
    lastAdded = millis();
    // Nothing held: any row that grew goes back to three
    for (let row of rows) {
      if (row.items.length > 3) resetRow(row);
    }
  }
}
