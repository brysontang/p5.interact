// Drag feel test bench. Compare p5.interact's dragged() against a hand-rolled drag and the
// bare cursor, with every knob that could plausibly matter.

const q = new URLSearchParams(location.search);
const use2D = q.get('renderer') === '2d';
const desync = q.get('desync') === '1';
const density1 = q.get('density') === '1';
const noPreserve = q.get('pdb') === '0';
const noAA = q.get('aa') === '0';
const targetFps = +q.get('fr') || 0;   // 0 = p5.interact's default (every refresh); fr=60 = what plain p5 does

const blue = { x: -220, y: -40, w: 200, h: 80 };   // p5.interact
const orange = { x: 60, y: -40, w: 200, h: 80 };   // hand-rolled
let orangeHeld = false;

let lastPointerMove = performance.now();
let ageSamples = [];

// Frame pacing, measured directly instead of trusting frameRate() (which in p5 2.x is
// just 1000 / the last gap). Also an independent rAF loop to learn the display's refresh.
let lastDraw = 0;
const gaps = [];
const rafGaps = [];
let lastRaf = 0;
(function tick(t) { if (lastRaf) { rafGaps.push(t - lastRaf); if (rafGaps.length > 120) rafGaps.shift(); } lastRaf = t; requestAnimationFrame(tick); })(0);
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
window.bench = {
  stats() {
    const hz = rafGaps.length ? 1000 / median(rafGaps) : 0;
    const mean = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const buckets = {};
    for (const g of gaps) { const k = (Math.round(g / 2) * 2).toFixed(0); buckets[k] = (buckets[k] || 0) + 1; }
    const top = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([ms, n]) => `${ms}ms×${n}`).join('  ');
    return { displayHz: +hz.toFixed(1), avgFps: mean ? +(1000 / mean).toFixed(1) : 0, p5FrameRate: +frameRate().toFixed(1), gaps: top, samples: gaps.length, targetFps: targetFps || 'every refresh' };
  },
};

// Low-latency canvas hint. p5 has no knob for it, so add it where the context is made.
if (desync) {
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    return getContext.call(this, type, { ...(attrs || {}), desynchronized: true });
  };
}

function setup() {
  const el = document.getElementById('sketch');
  if (density1) pixelDensity(1);
  createCanvas(el.clientWidth, el.clientHeight, use2D ? P2D : WEBGL).parent('sketch');
  if (!use2D && noPreserve) setAttributes('preserveDrawingBuffer', false);
  if (!use2D && noAA) setAttributes('antialias', false);
  if (targetFps) frameRate(targetFps); // calling frameRate() yourself makes p5.interact leave pacing alone
  const attrs = drawingContext.getContextAttributes ? drawingContext.getContextAttributes() : {};
  document.getElementById('ctx-actual').textContent =
    `desynchronized ${attrs.desynchronized ? 'on' : 'off'}` + (use2D ? '' : ` · preserveDrawingBuffer ${attrs.preserveDrawingBuffer ? 'on' : 'off'} · antialias ${attrs.antialias ? 'on' : 'off'}`);
  new ResizeObserver(() => resizeCanvas(el.clientWidth, el.clientHeight)).observe(el);
  window.addEventListener('pointermove', () => (lastPointerMove = performance.now()), { passive: true });

  const slop = document.getElementById('slop');
  const show = () => {
    interact.config.clickSlop = +slop.value;
    document.getElementById('slop-value').textContent = slop.value;
  };
  slop.addEventListener('input', show);
  show();

  // Buttons toggle one query param each, so modes combine (2D + desynchronized, etc.).
  for (const b of document.querySelectorAll('#tool-bar button')) {
    b.onclick = () => {
      if (!b.dataset.q) { location.search = ''; return; }
      const [key, val] = b.dataset.q.split('=');
      const next = new URLSearchParams(location.search);
      next.get(key) === val ? next.delete(key) : next.set(key, val);
      location.search = next.toString() ? '?' + next : '';
    };
  }
  document.getElementById('mode').textContent =
    [use2D ? '2D' : 'WEBGL', desync ? 'desynchronized' : null, density1 ? 'density 1' : null, noPreserve ? 'no preserveDrawingBuffer' : null, noAA ? 'no antialias' : null, targetFps ? `frameRate(${targetFps})` : 'p5.interact pacing'].filter(Boolean).join(' · ');
  document.getElementById('pd').textContent = pixelDensity();
  document.getElementById('target').textContent = targetFps || 'every refresh';
  const px = () => `${width * pixelDensity()} × ${height * pixelDensity()} = ${((width * height * pixelDensity() ** 2) / 1e6).toFixed(1)} Mpx`;
  document.getElementById('px').textContent = px();
  new ResizeObserver(() => (document.getElementById('px').textContent = px())).observe(el);
}

function draw() {
  background(0);
  if (use2D) translate(width / 2, height / 2); // same coordinates in both renderers

  // -- blue: p5.interact
  push();
  const d = dragged();
  if (d) { blue.x += d.x; blue.y += d.y; }
  translate(blue.x, blue.y);
  fill(hovered() ? color(140, 200, 255) : color(60, 120, 200));
  noStroke();
  rect(0, 0, blue.w, blue.h, 10);
  pop();

  // -- orange: hand-rolled, the way you would write it without any library
  const mx = mouseX - width / 2, my = mouseY - height / 2;
  const overOrange = mx > orange.x && mx < orange.x + orange.w && my > orange.y && my < orange.y + orange.h;
  if (mouseIsPressed && (orangeHeld || overOrange) && !dragging()) {
    if (orangeHeld) { orange.x += movedX; orange.y += movedY; }
    orangeHeld = true;
  } else {
    orangeHeld = false;
  }
  push();
  translate(orange.x, orange.y);
  // The orange box moves without the library, but it should still block the blue box
  // when it sits on top of it. Asking a question (and ignoring the answer) records it,
  // so nearest-wins picking treats it as solid. Unasked shapes are never recorded.
  hovered();
  fill(overOrange ? color(255, 200, 140) : color(200, 120, 50));
  noStroke();
  rect(0, 0, orange.w, orange.h, 10);
  pop();

  // -- ring: where p5 thinks the cursor is, right now
  push();
  noFill();
  stroke(200);
  strokeWeight(2);
  circle(mx, my, 30);
  pop();

  // -- readouts
  const now = performance.now();
  if (lastDraw) { gaps.push(now - lastDraw); if (gaps.length > 150) gaps.shift(); }
  lastDraw = now;
  ageSamples.push(now - lastPointerMove);
  if (ageSamples.length > 30) ageSamples.shift();
  if (frameCount % 10 === 0) {
    const st = bench.stats();
    document.getElementById('fps').textContent = `${st.avgFps} avg · p5 says ${st.p5FrameRate}`;
    document.getElementById('gaps').textContent = st.gaps || '–';
    document.getElementById('hz').textContent = st.displayHz;
    document.getElementById('age').textContent = median(ageSamples).toFixed(1);
  }
}
