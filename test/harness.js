// A small browser test harness for p5.interact. No framework.
//
// Each test builds a sketch in its own iframe (a fresh p5 and a fresh library), drives it
// with synthetic pointer events and redraw(), and asserts. The page renders the results;
// window.__done resolves with { passed, failed, results } for the headless runner.

const LIB = '../p5.interact.js';
const P5 = 'https://cdn.jsdelivr.net/npm/p5@2.3.1/lib/p5.js';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const assert = {
  ok(v, msg) { if (!v) throw new Error(msg || `expected truthy, got ${JSON.stringify(v)}`); },
  equal(a, b, msg) { if (a !== b) throw new Error(`${msg || 'equal'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); },
  deepEqual(a, b, msg) { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${msg || 'deepEqual'}: expected ${y}, got ${x}`); },
  close(a, b, tol, msg) { if (Math.abs(a - b) > tol) throw new Error(`${msg || 'close'}: expected ${b} ± ${tol}, got ${a}`); },
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Build a sketch. `code` is global-mode p5 (setup + draw). The sketch is paused with
// noLoop() so every frame is explicit: `await s.frames()`.
async function sketch(code, { width = 400, height = 300 } = {}) {
  const f = document.createElement('iframe');
  f.style.cssText = `width:${width}px;height:${height}px;border:0;position:fixed;left:-5000px;top:0`;
  f.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8">
<script src="${P5}"><\/script><script src="${LIB}"><\/script>
<style>html,body{margin:0}</style></head><body><script>
window.__errors = []; window.addEventListener('error', e => __errors.push(e.message));
${code.replace(/<\/script/g, '<\\/script')}
<\/script></body></html>`;
  document.body.appendChild(f);
  await new Promise((r) => { f.onload = r; });
  const W = f.contentWindow;
  let tries = 0;
  while (!(W.p5 && W.p5.instance && W.p5.instance._setupDone) && tries++ < 100) await wait(50);
  const P = W.p5.instance;
  if (!P) throw new Error('sketch never finished setup: ' + (W.__errors || []).join('; '));
  P.noLoop();
  const el = P._renderer.elt;
  const rect = () => el.getBoundingClientRect();
  const k = () => P.width / rect().width;
  const frames = async (n = 2) => { for (let i = 0; i < n; i++) await P.redraw(); };
  const ev = (type, x, y, extra = {}) => {
    const R = rect();
    el.dispatchEvent(new W.PointerEvent(type, { clientX: R.left + x / k(), clientY: R.top + y / k(), button: 0, buttons: type === 'pointerup' ? 0 : 1, pointerId: 1, bubbles: true, cancelable: true, ...extra }));
  };
  const s = {
    W, P, el,
    E: (expr) => W.eval(expr),
    errors: () => W.__errors,
    frames,
    async moveTo(x, y, n = 2) { P.mouseX = x; P.mouseY = y; await frames(n); },
    async press(x, y) { await s.moveTo(x, y); ev('pointerdown', x, y); },
    async release(x, y) { ev('pointerup', x, y); await frames(2); },
    async click(x, y) { await s.moveTo(x, y); ev('pointerdown', x, y); ev('pointerup', x, y); await frames(2); },
    // press at (x0,y0), move past the click slop, then to (x1,y1), release
    async drag(x0, y0, x1, y1) { await s.press(x0, y0); await s.moveTo(x0 + 20, y0 + 20); await s.moveTo(x1, y1); await s.release(x1, y1); },
    wheel(x, y, dy) { const R = rect(); const e = new W.WheelEvent('wheel', { clientX: R.left + x / k(), clientY: R.top + y / k(), deltaY: dy, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; },
    hoveredIds: () => [...P._interact.hoveredIds],
    hit: () => W.hitInfo() ? W.hitInfo().shape.kind : null,
    shapes: () => P._interact.frozen.shapes,
    distances: () => Object.fromEntries([...P._interact.distances].map(([id, d]) => [id, d])),
    done() { f.remove(); },
  };
  return s;
}

async function run() {
  const list = document.getElementById('results');
  const results = [];
  let passed = 0, failed = 0;
  for (const t of tests) {
    const li = document.createElement('li');
    li.textContent = t.name;
    list.appendChild(li);
    const t0 = performance.now();
    try {
      await t.fn();
      li.className = 'pass';
      passed++;
      results.push({ name: t.name, ok: true });
    } catch (e) {
      li.className = 'fail';
      li.textContent += '  →  ' + e.message;
      failed++;
      results.push({ name: t.name, ok: false, error: e.message });
      console.error(t.name, e);
    }
    li.textContent += `  (${Math.round(performance.now() - t0)} ms)`;
  }
  document.getElementById('summary').textContent = `${passed} passed, ${failed} failed`;
  document.getElementById('summary').className = failed ? 'fail' : 'pass';
  window.__results = { passed, failed, results };
  window.__doneResolve(window.__results);
}
window.__done = new Promise((r) => { window.__doneResolve = r; });
window.addEventListener('load', () => run());
