/*
 * p5.interact — interaction for p5 without ceremony.
 *
 * A p5 2.x addon. Load it after p5.js and before your sketch. Works in WEBGL and 2D,
 * in global and instance mode. It adds five questions you can ask inside draw():
 *
 *     hovered()        is the mouse over the shapes that follow?
 *     clicked()        were they clicked? true for one frame
 *     dragged()        are they being dragged? returns the delta in local coordinates
 *     dropped()        was something dragged and released on them? returns the drop point
 *     scrolled()       was the wheel scrolled over them? returns the delta
 *
 * Every question returns a value that is truthy when it applies, read inside draw() the
 * way mouseIsPressed and movedX are. There are no callbacks.
 *     noInteract()     the shapes that follow are drawn but not in click space
 *     noHover() …      the same, for one question at a time, like noFill()
 *     localMouse()     the mouse in the current coordinate frame, { x, y }
 *
 * Each one applies to the shapes drawn AFTER it, until the end of the enclosing
 * push()/pop(). Questions asked back to back share the shapes that follow; a question
 * asked after a shape has been drawn starts a new group. That is the same scoping
 * describeElement() uses:
 *
 *     push();
 *     fill(hovered() ? 200 : 60);
 *     if (clicked()) select(agent);
 *     rect(0, 0, 100, 40, 8);
 *     pop();
 *
 * A question is drawing state. It lives on p5's own `states` object next to fillColor,
 * so p5's push() and pop() scope it and a later question replaces it, exactly like a
 * later fill(). Nothing is named and nothing is registered. Groups are matched frame to
 * frame by order, so the third group this frame is the same thing as the third group
 * last frame; push(key) names a scope's groups by the object it draws instead. While a
 * group is being dragged its shapes are skipped by picking, so whatever is underneath
 * can answer hovered() and dropped().
 *
 * Nothing bubbles. Every question is answered for the group that was in force when the
 * shape was drawn, which is the innermost scope that asked. A button inside a card does
 * not also click or hover the card. To make a group respond together, ask once at the
 * group and let its children inherit the answer.
 *
 * Picking is geometric. Each primitive records its arguments and the current matrix.
 * At frame end the mouse is unprojected into each shape's own space and tested
 * exactly: rounded rects by signed distance, ellipses, polygons, lines, text bounds,
 * boxes and spheres by ray intersection. No second render pass, no pixel reads.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- 4x4 math
  // Column-major like p5.Matrix.mat4 and WebGL: element (r, c) is m[c*4 + r].

  function mul4(a, b) {
    const o = new Float64Array(16);
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b0 + a[4 + r] * b1 + a[8 + r] * b2 + a[12 + r] * b3;
      }
    }
    return o;
  }

  function inv4(m) {
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
    const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return null;
    det = 1 / det;
    const o = new Float64Array(16);
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return o;
  }

  function xf(m, x, y, z, w) {
    return [
      m[0] * x + m[4] * y + m[8] * z + m[12] * w,
      m[1] * x + m[5] * y + m[9] * z + m[13] * w,
      m[2] * x + m[6] * y + m[10] * z + m[14] * w,
      m[3] * x + m[7] * y + m[11] * z + m[15] * w,
    ];
  }

  // The mouse as a ray in a shape's own space: o at the near plane, o + d at the far plane.
  function modelRay(inv, nx, ny) {
    const a = xf(inv, nx, ny, -1, 1);
    const b = xf(inv, nx, ny, 1, 1);
    if (!a[3] || !b[3]) return null;
    const o = [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
    const d = [b[0] / b[3] - o[0], b[1] / b[3] - o[1], b[2] / b[3] - o[2]];
    return { o, d };
  }

  // ---------------------------------------------------------------- 2D tests (u, v in shape space)

  function roundRectSDF(u, v, w, h, radii) {
    let r = u < w / 2 ? (v < h / 2 ? radii[0] : radii[3]) : (v < h / 2 ? radii[1] : radii[2]);
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    const qx = Math.abs(u - w / 2) - (w / 2 - r);
    const qy = Math.abs(v - h / 2) - (h / 2 - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  }

  function pointInPoly(pts, u, v) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > v) !== (yj > v) && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function segDist2(u, v, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((u - a[0]) * dx + (v - a[1]) * dy) / l2)) : 0;
    return Math.hypot(u - (a[0] + t * dx), v - (a[1] + t * dy));
  }

  // upp: model units per screen pixel where the test happens, so line tolerance is a
  // pixel floor however far the camera is.
  function inShape2D(s, u, v, upp = 1) {
    switch (s.kind) {
      case 'rect': return roundRectSDF(u - s.x, v - s.y, s.w, s.h, s.r) <= 0;
      case 'ellipse': { const x = (u - s.cx) / s.a, y = (v - s.cy) / s.b; return x * x + y * y <= 1; }
      case 'poly': return pointInPoly(s.pts, u, v);
      case 'line': return segDist2(u, v, s.a, s.b) <= Math.max(s.sw, config.lineTolerance * upp);
      default: return false;
    }
  }

  // ---------------------------------------------------------------- 3D tests (ray in shape space)

  function planeHit(o, d) {
    if (Math.abs(d[2]) < 1e-12) return null;
    const t = -o[2] / d[2];
    if (t < 0 || t > 1) return null;
    return { t, u: o[0] + t * d[0], v: o[1] + t * d[1] };
  }

  function polyPlane(s) {
    // Newell normal + a projection axis, computed once per shape.
    if (s.plane !== undefined) return s.plane;
    const P = s.pts3;
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]);
      ny += (a[2] - b[2]) * (a[0] + b[0]);
      nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-12) return (s.plane = null);
    const n = [nx / len, ny / len, nz / len];
    const ax = [Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2])];
    const drop = ax[0] > ax[1] ? (ax[0] > ax[2] ? 0 : 2) : (ax[1] > ax[2] ? 1 : 2);
    const keep = [0, 1, 2].filter((i) => i !== drop);
    const pts2 = P.map((p) => [p[keep[0]], p[keep[1]]]);
    return (s.plane = { n, p0: P[0], keep, pts2 });
  }

  function rayBox(o, d, w, h, dd) {
    const half = [w / 2, h / 2, dd / 2];
    let tmin = -Infinity, tmax = Infinity;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-12) { if (Math.abs(o[i]) > half[i]) return null; continue; }
      let t1 = (-half[i] - o[i]) / d[i], t2 = (half[i] - o[i]) / d[i];
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
    const t = tmin >= 0 ? tmin : (tmax >= 0 ? 0 : null);
    return t === null || t > 1 ? null : { t };
  }

  function raySphere(o, d, r) {
    const A = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    const B = 2 * (o[0] * d[0] + o[1] * d[1] + o[2] * d[2]);
    const C = o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - r * r;
    const disc = B * B - 4 * A * C;
    if (disc < 0) return null;
    const s = Math.sqrt(disc);
    let t = (-B - s) / (2 * A);
    if (t < 0) t = (-B + s) / (2 * A);
    if (t < 0 || t > 1) return null;
    return { t };
  }

  function raySegment(o, d, a, b) {
    // Closest approach between ray o + t d (t in [0,1]) and segment a + s (b - a) (s in [0,1]).
    const u = d, v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w0 = [o[0] - a[0], o[1] - a[1], o[2] - a[2]];
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    const A = dot(u, u), B = dot(u, v), C = dot(v, v), D = dot(u, w0), E = dot(v, w0);
    const den = A * C - B * B;
    let s = den < 1e-12 ? (C ? E / C : 0) : (A * E - B * D) / den;
    s = Math.max(0, Math.min(1, s));
    let t = A ? (B * s - D) / A : 0;
    t = Math.max(0, Math.min(1, t));
    const p = [o[0] + t * u[0], o[1] + t * u[1], o[2] + t * u[2]];
    const q = [a[0] + s * v[0], a[1] + s * v[1], a[2] + s * v[2]];
    return { t, dist: Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) };
  }

  function hitGL(s, nx, ny, pxNdc) {
    const inv = s.inv || (s.inv = inv4(s.mvp));
    if (!inv) return null;
    const ray = modelRay(inv, nx, ny);
    if (!ray) return null;
    const { o, d } = ray;
    switch (s.kind) {
      case 'rect':
      case 'ellipse': {
        const h = planeHit(o, d);
        return h && inShape2D(s, h.u, h.v) ? h : null;
      }
      case 'poly': {
        const pl = polyPlane(s);
        if (!pl) return null;
        const dn = d[0] * pl.n[0] + d[1] * pl.n[1] + d[2] * pl.n[2];
        if (Math.abs(dn) < 1e-12) return null;
        const t = ((pl.p0[0] - o[0]) * pl.n[0] + (pl.p0[1] - o[1]) * pl.n[1] + (pl.p0[2] - o[2]) * pl.n[2]) / dn;
        if (t < 0 || t > 1) return null;
        const p = [o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]];
        return pointInPoly(pl.pts2, p[pl.keep[0]], p[pl.keep[1]]) ? { t, u: p[0], v: p[1] } : null;
      }
      case 'line': {
        const h = raySegment(o, d, s.a, s.b);
        if (!h) return null;
        // model units per screen pixel at the depth of the closest approach
        const r2 = modelRay(inv, nx + pxNdc, ny);
        const upp = r2 ? Math.hypot(
          (r2.o[0] + h.t * r2.d[0]) - (o[0] + h.t * d[0]),
          (r2.o[1] + h.t * r2.d[1]) - (o[1] + h.t * d[1]),
          (r2.o[2] + h.t * r2.d[2]) - (o[2] + h.t * d[2])) : 0;
        return h.dist <= Math.max(s.sw, config.lineTolerance * upp) ? { t: h.t } : null;
      }
      case 'box': return rayBox(o, d, s.w, s.h, s.d);
      case 'sphere': return raySphere(o, d, s.r);
      default: return null;
    }
  }

  // ---------------------------------------------------------------- state
  //
  // A question is drawing state, stored where p5 stores drawing state: on the renderer's
  // `states` object, next to fillColor and rectMode. p5's own push() and pop() save and
  // restore it, so scoping costs this library nothing. Each question is its own key, the
  // way fill and stroke are separate: asking clicked() again does not reset hovered().
  //
  //   interactGroup   the group the most recent question in this scope created (or reused,
  //                   if no shape has been drawn since); a push() starts with none
  //   interactHover   the group that currently answers hovered()   } set by each question,
  //   interactClick   ... clicked()                                  } read by each shape as
  //   interactDrag    ... dragged()                                  } it is drawn, exactly
  //   interactDrop    ... dropped()                                  } like fillColor
  //   interactScroll  ... scrolled()
  //   interactKey     push(key): groups created in this scope are named by the key
  //   interactKeyN    ... numbered from 0 within that push, so the same key drawn twice in a
  //                   frame (a lifted layer) yields the same ids and a drag follows it
  //
  // noHover(), noClick(), noDrag(), noDrop(), noScroll() clear one key, like noFill();
  // noInteract() clears all five.

  const config = {
    clickSlop: 5,       // px of pointer travel before a press is a drag, not a click
    cursor: true,       // pointer cursor over anything interactive
    lineTolerance: 3,   // minimum half-width for picking lines, in screen pixels
    frameRate: Infinity, // applied after setup() unless the sketch called frameRate() itself; null = leave p5 alone
  };

  const QUESTIONS = ['hover', 'click', 'drag', 'drop', 'scroll'];
  const KEY = { hover: 'interactHover', click: 'interactClick', drag: 'interactDrag', drop: 'interactDrop', scroll: 'interactScroll' };
  const STATE_KEYS = ['interactGroup', 'interactKey', 'interactKeyN', ...Object.values(KEY)];

  let current = null;

  function state(p) {
    return p._interact || (p._interact = {
      groups: 0, shapes: [],
      frozen: { shapes: [] },
      hoveredIds: new Set(), clickedIds: new Set(), nextClicked: new Set(),
      droppedIds: new Map(), nextDropped: new Map(),
      scrolledIds: new Map(), nextScrolled: new Map(),
      hover: null, drag: null, down: null, cursor: null,
      verts: null,
      keyIds: new WeakMap(), nextKeyId: 1,
    });
  }

  const S = (p) => p._renderer.states;

  // Identity for push(key): objects by reference, primitives by value.
  function keyId(st, key) {
    if ((typeof key === 'object' && key !== null) || typeof key === 'function') {
      let id = st.keyIds.get(key);
      if (!id) { id = st.nextKeyId++; st.keyIds.set(key, id); }
      return 'k' + id;
    }
    return 'v' + String(key);
  }

  // A question: reuse the current group if nothing has been drawn since it was created,
  // otherwise start a new one (a question after a shape starts a new group). Then point
  // this question's state key at it, the way fill() points fillColor at a color.
  function ask(p, kind) {
    const st = state(p), states = S(p);
    let g = states.interactGroup;
    if (!g || !g.fresh) {
      const key = states.interactKey;
      let id;
      if (key != null) {
        const counter = states.interactKeyN; // one per push(key); restored by pop()
        id = `${key}.${counter.n++}`;
      } else {
        id = `o${st.groups}`;
      }
      st.groups++;
      g = { id, fresh: true };
      states.setValue('interactGroup', g);
    }
    states.setValue(KEY[kind], g);
    return g;
  }

  function isGL(p) {
    const R = p._renderer;
    return !!(R && R.states && R.states.uModelMatrix);
  }

  function currentMVP(p) {
    const st = p._renderer.states;
    return mul4(mul4(st.uPMatrix.mat4, st.uViewMatrix.mat4), st.uModelMatrix.mat4);
  }

  // Is any question in force here? Cheap: read five keys. Shapes drawn with none are free.
  function listening(p) {
    const states = S(p);
    for (const k of QUESTIONS) if (states[KEY[k]]) return true;
    return false;
  }

  function record(p, shape) {
    const st = state(p), states = S(p);
    const q = {};
    let any = false;
    for (const k of QUESTIONS) {
      const g = states[KEY[k]] || null;
      q[k] = g;
      if (g) { any = true; g.fresh = false; }
    }
    if (!any) return;
    shape.q = q; // the group answering each question for this shape, as of when it was drawn
    shape.order = st.shapes.length;
    if (isGL(p)) shape.mvp = currentMVP(p);
    else shape.m2d = p._renderer.drawingContext.getTransform();
    st.shapes.push(shape);
  }

  function hoverSet(hit) {
    return new Set(hit && hit.shape.q.hover ? [hit.shape.q.hover.id] : []);
  }

  function resolve(p, st, mx, my, skipId) {
    if (mx == null || !(p.width > 0) || !(p.height > 0)) return null;
    const shapes = st.frozen.shapes;
    if (!shapes.length) return null;
    if (skipId === undefined) skipId = st.drag ? st.drag.id : null;
    const skip = (s) => skipId && s.q.drag && s.q.drag.id === skipId; // what you hold is not in click space
    let best = null, score = Infinity;
    if (isGL(p)) {
      const nx = (2 * mx) / p.width - 1, ny = 1 - (2 * my) / p.height;
      if (nx < -1 || nx > 1 || ny < -1 || ny > 1) return null;
      const pxNdc = 2 / p.width;
      for (const s of shapes) {
        if (skip(s)) continue;
        const h = hitGL(s, nx, ny, pxNdc);
        if (!h) continue;
        // nearest wins; at equal depth the later-drawn wins, like paint (p5 draws with LEQUAL)
        if (h.t < score - 1e-9 || (Math.abs(h.t - score) <= 1e-9 && s.order > best.shape.order)) {
          score = h.t; best = { shape: s, u: h.u, v: h.v, t: h.t };
        }
      }
    } else {
      if (mx < 0 || my < 0 || mx > p.width || my > p.height) return null;
      const pd = p.pixelDensity();
      const pt = new DOMPoint(mx * pd, my * pd);
      for (const s of shapes) {
        if (skip(s)) continue;
        const inv = s.inv || (s.inv = s.m2d.inverse());
        const q = inv.transformPoint(pt);
        const upp = pd * Math.hypot(inv.a, inv.b); // one CSS pixel, in this shape's units
        if (inShape2D(s, q.x, q.y, upp) && -s.order < score) { score = -s.order; best = { shape: s, u: q.x, v: q.y }; }
      }
    }
    return best;
  }

  // Where the mouse is on the z = 0 plane of the current coordinate frame.
  function planePoint(p, mx, my) {
    if (isGL(p)) {
      const inv = inv4(currentMVP(p));
      if (!inv) return null;
      const ray = modelRay(inv, (2 * mx) / p.width - 1, 1 - (2 * my) / p.height);
      if (!ray) return null;
      const h = planeHit(ray.o, ray.d);
      return h ? [h.u, h.v] : null;
    }
    const pd = p.pixelDensity();
    const q = p._renderer.drawingContext.getTransform().inverse().transformPoint(new DOMPoint(mx * pd, my * pd));
    return [q.x, q.y];
  }

  // ---------------------------------------------------------------- shape argument parsing

  function modeRect(mode, x, y, w, h) {
    if (h === undefined) h = w;
    switch (mode) {
      case 'corners': return { x: Math.min(x, w), y: Math.min(y, h), w: Math.abs(w - x), h: Math.abs(h - y) };
      case 'center': return { x: x - w / 2, y: y - h / 2, w, h };
      case 'radius': return { x: x - w, y: y - h, w: 2 * w, h: 2 * h };
      default: return { x, y, w, h };
    }
  }

  function rectShape(p, args) {
    const [x, y, w, h, tl, tr, br, bl] = args;
    const b = modeRect(p._renderer.states.rectMode, x, y, w, h);
    const r0 = tl || 0;
    return { kind: 'rect', x: b.x, y: b.y, w: b.w, h: b.h, r: [r0, tr === undefined ? r0 : tr, br === undefined ? r0 : br, bl === undefined ? r0 : bl] };
  }

  function ellipseShape(p, x, y, w, h) {
    const b = modeRect(p._renderer.states.ellipseMode, x, y, w, h === undefined ? w : h);
    return { kind: 'ellipse', cx: b.x + b.w / 2, cy: b.y + b.h / 2, a: b.w / 2, b: b.h / 2 };
  }

  function polyShape(pts3) {
    return { kind: 'poly', pts3, pts: pts3.map((p) => [p[0], p[1]]) };
  }

  function strokeHalf(p) {
    return (p._renderer.states.strokeWeight || 1) / 2;
  }

  // ---------------------------------------------------------------- the addon

  function addon(p5, fn, lifecycles) {
    if (fn.__p5interact) return; // loaded twice: never wrap the primitives a second time
    fn.__p5interact = true;
    const orig = {};
    for (const name of ['push', 'rect', 'square', 'ellipse', 'circle', 'triangle', 'quad', 'line',
      'text', 'image', 'plane', 'box', 'sphere', 'beginShape', 'vertex', 'endShape', 'frameRate', 'orbitControl']) {
      orig[name] = fn[name];
    }

    // -- orbitControl() sits out while a shape is being dragged. Nobody wants the camera to
    //    orbit under the thing they are holding, so the sketch never has to say so.
    if (orig.orbitControl) {
      fn.orbitControl = function (...a) {
        if (state(this).drag) return;
        return orig.orbitControl.apply(this, a);
      };
    }

    // -- frame pacing. p5 draws on a display refresh only if 1000/target - 5 ms have passed,
    //    with a default target of 60. On a 75 Hz screen that draws two refreshes in three
    //    (gaps of 13, 13, 27 ms) and a drag judders. A target of Infinity draws every refresh;
    //    saveGif() treats Infinity as 60, so nothing else changes. Honored only if the sketch
    //    didn't pick a rate of its own.
    fn.frameRate = function (fps) {
      if (typeof fps === 'number') state(this).frameRateSet = true;
      return orig.frameRate.call(this, fps);
    };

    // -- scopes. p5's push/pop already save and restore our state keys; push(key) only
    //    adds the key. pop() needs no wrapper at all.
    const pushImpl = function (key) {
      const out = orig.push.call(this);
      // A new scope inherits the questions in force, but starts with no current group: a
      // question asked inside it always begins its own group, never joins the parent's.
      S(this).setValue('interactGroup', null);
      if (key !== undefined) {
        S(this).setValue('interactKey', keyId(state(this), key));
        S(this).setValue('interactKeyN', { n: 0 });
      }
      return out;
    };
    fn.push = pushImpl;

    // p5's friendly error system wraps every prototype method with an argument validator
    // when the first sketch is created, and push() is documented as taking no arguments.
    // Rebind our push on the instance (and on window in global mode) after that wrapping,
    // so push(key) reaches us without a complaint.
    lifecycles.presetup = function () {
      this.push = pushImpl;
      if (this._isGlobal) {
        Object.defineProperty(window, 'push', { configurable: true, enumerable: true, value: pushImpl.bind(this) });
      }
    };

    // -- questions
    fn.hovered = function () {
      const st = state(this);
      const g = ask(this, 'hover');
      return st.hoveredIds.has(g.id) || !!(st.drag && st.drag.id === g.id); // what you hold is under the mouse
    };

    /** clicked(): true for one frame after a click on the shapes that follow. */
    fn.clicked = function () {
      const st = state(this);
      const g = ask(this, 'click');
      return st.clickedIds.has(g.id);
    };

    /** dropped(): { x, y } in the current frame's coordinates for one frame after a drag
     *  was released over the shapes that follow; else null. */
    fn.dropped = function () {
      const st = state(this);
      const g = ask(this, 'drop');
      const at = st.droppedIds.get(g.id);
      if (!at) return null;
      const pt = planePoint(this, at.mx, at.my);
      return pt ? { x: pt[0], y: pt[1] } : { x: 0, y: 0 };
    };

    /** scrolled(): { x, y } wheel delta accumulated over the last frame while the wheel was over
     *  the shapes that follow, else null. Positive y is down or away, p5's sign. A scope that asked
     *  owns the wheel over its shapes: the page does not scroll and orbitControl() does not zoom,
     *  like scrolling inside a scrollable element. */
    fn.scrolled = function () {
      const st = state(this);
      const g = ask(this, 'scroll');
      return st.scrolledIds.get(g.id) || null;
    };

    /** noHover() ... noScroll(): the shapes that follow no longer answer that one question,
     *  until pop() or the question is asked again. Like noFill(). noInteract() is all five. */
    fn.noHover = function () { S(this).setValue(KEY.hover, null); };
    fn.noClick = function () { S(this).setValue(KEY.click, null); };
    fn.noDrag = function () { S(this).setValue(KEY.drag, null); };
    fn.noDrop = function () { S(this).setValue(KEY.drop, null); };
    fn.noScroll = function () { S(this).setValue(KEY.scroll, null); };
    fn.noInteract = function () {
      const states = S(this);
      for (const k of QUESTIONS) states.setValue(KEY[k], null);
    };

    fn.dragged = function () {
      const st = state(this);
      const g = ask(this, 'drag');
      const d = st.drag;
      if (!d || d.id !== g.id) return null;
      const mx = this.mouseX, my = this.mouseY;
      if (!d.active) {
        if (Math.hypot(mx - d.startX, my - d.startY) <= config.clickSlop) return null;
        d.active = true;
      }
      if (d.frame === this.frameCount) return { x: 0, y: 0 }; // delivered once per frame; still truthy
      d.frame = this.frameCount;
      const a = planePoint(this, d.lastX, d.lastY), b = planePoint(this, mx, my);
      d.lastX = mx; d.lastY = my;
      d.delta = a && b ? { x: b[0] - a[0], y: b[1] - a[1] } : { x: 0, y: 0 };
      return d.delta;
    };

    /** localMouse(): mouseX/mouseY expressed in the current coordinate frame (its z = 0 plane in WEBGL). */
    fn.localMouse = function () {
      const p = planePoint(this, this.mouseX, this.mouseY);
      return p ? { x: p[0], y: p[1] } : null;
    };

    fn.hitInfo = function () {
      return state(this).hover;
    };

    // -- primitives: draw as usual, then remember the geometry if a question is in force
    fn.rect = function (...a) {
      const out = orig.rect.apply(this, a);
      if (listening(this)) record(this, rectShape(this, a));
      return out;
    };
    fn.square = function (x, y, s, ...r) {
      const out = orig.square.call(this, x, y, s, ...r);
      if (listening(this)) record(this, rectShape(this, [x, y, s, s, ...r]));
      return out;
    };
    fn.ellipse = function (x, y, w, h, ...rest) {
      const out = orig.ellipse.call(this, x, y, w, h, ...rest);
      if (listening(this)) record(this, ellipseShape(this, x, y, w, h));
      return out;
    };
    fn.circle = function (x, y, d) {
      const out = orig.circle.call(this, x, y, d);
      if (listening(this)) record(this, ellipseShape(this, x, y, d, d));
      return out;
    };
    fn.triangle = function (...a) {
      const out = orig.triangle.apply(this, a);
      if (listening(this)) {
        const pts = a.length >= 9
          ? [[a[0], a[1], a[2]], [a[3], a[4], a[5]], [a[6], a[7], a[8]]]
          : [[a[0], a[1], 0], [a[2], a[3], 0], [a[4], a[5], 0]];
        record(this, polyShape(pts));
      }
      return out;
    };
    fn.quad = function (...a) {
      const out = orig.quad.apply(this, a);
      if (listening(this)) {
        const pts = a.length >= 12
          ? [[a[0], a[1], a[2]], [a[3], a[4], a[5]], [a[6], a[7], a[8]], [a[9], a[10], a[11]]]
          : [[a[0], a[1], 0], [a[2], a[3], 0], [a[4], a[5], 0], [a[6], a[7], 0]];
        record(this, polyShape(pts));
      }
      return out;
    };
    fn.line = function (...a) {
      const out = orig.line.apply(this, a);
      if (listening(this)) {
        const [p, q] = a.length >= 6 ? [[a[0], a[1], a[2]], [a[3], a[4], a[5]]] : [[a[0], a[1], 0], [a[2], a[3], 0]];
        record(this, { kind: 'line', a: p, b: q, sw: strokeHalf(this) });
      }
      return out;
    };
    fn.text = function (str, x, y, w, h) {
      const out = orig.text.call(this, str, x, y, w, h);
      if (listening(this)) {
        let b = null;
        try { b = this.fontBounds(String(str), x, y, w, h); } catch (e) { /* no font metrics yet */ }
        if (b) record(this, { kind: 'rect', x: b.x, y: b.y, w: b.w, h: b.h, r: [0, 0, 0, 0] });
      }
      return out;
    };
    fn.image = function (img, x, y, w, h, ...rest) {
      const out = orig.image.call(this, img, x, y, w, h, ...rest);
      if (listening(this) && img) {
        const b = modeRect(this._renderer.states.imageMode, x, y, w === undefined ? img.width : w, h === undefined ? img.height : h);
        record(this, { kind: 'rect', x: b.x, y: b.y, w: b.w, h: b.h, r: [0, 0, 0, 0] });
      }
      return out;
    };
    fn.plane = function (w = 50, h = w, ...rest) {
      const out = orig.plane.call(this, w, h, ...rest);
      if (listening(this)) record(this, { kind: 'rect', x: -w / 2, y: -h / 2, w, h, r: [0, 0, 0, 0] });
      return out;
    };
    fn.box = function (w = 50, h = w, d = h, ...rest) {
      const out = orig.box.call(this, w, h, d, ...rest);
      if (listening(this)) record(this, { kind: 'box', w, h, d });
      return out;
    };
    fn.sphere = function (r = 50, ...rest) {
      const out = orig.sphere.call(this, r, ...rest);
      if (listening(this)) record(this, { kind: 'sphere', r });
      return out;
    };
    fn.beginShape = function (...a) {
      const out = orig.beginShape.apply(this, a);
      state(this).verts = listening(this) ? [] : null;
      return out;
    };
    fn.vertex = function (...a) {
      const out = orig.vertex.apply(this, a);
      const st = state(this);
      if (st.verts) {
        // vertex(x, y) | (x, y, z) | (x, y, u, v) | (x, y, z, u, v)
        const z = a.length === 3 || a.length === 5 ? a[2] : 0;
        st.verts.push([a[0], a[1], z || 0]);
      }
      return out;
    };
    fn.endShape = function (...a) {
      const out = orig.endShape.apply(this, a);
      const st = state(this);
      if (st.verts && st.verts.length >= 3) record(this, polyShape(st.verts));
      st.verts = null;
      return out;
    };

    // -- lifecycle
    lifecycles.postsetup = function () {
      current = this;
      const st = state(this);
      if (config.frameRate != null && !st.frameRateSet) orig.frameRate.call(this, config.frameRate);
      const el = (this._renderer && this._renderer.elt) || this.canvas;
      if (!el) return;
      const opt = this._removeSignal ? { signal: this._removeSignal } : undefined;
      const canvasXY = (e) => {
        const rect = el.getBoundingClientRect();
        return [(e.clientX - rect.left) * (this.width / (rect.width || 1)), (e.clientY - rect.top) * (this.height / (rect.height || 1))];
      };
      el.addEventListener('pointerdown', (e) => {
        const [mx, my] = canvasXY(e);
        st.down = { x: e.clientX, y: e.clientY, button: e.button };
        const hit = resolve(this, st, mx, my);
        st.drag = null;
        const g = hit && e.button === 0 ? hit.shape.q.drag : null;
        if (g) st.drag = { id: g.id, startX: mx, startY: my, lastX: mx, lastY: my, active: false, frame: -1, delta: null };
      }, opt);
      el.addEventListener('pointerup', (e) => {
        const d = st.down;
        const drag = st.drag;
        st.down = null;
        st.drag = null;
        if (!d || d.button !== e.button) return;
        const [mx, my] = canvasXY(e);
        if (drag && drag.active) {
          // a drop: whatever is under the release point, not counting what was held
          const hit = resolve(this, st, mx, my, drag.id);
          st.hover = hit;
          st.hoveredIds = hoverSet(hit);
          const g = hit && hit.shape.q.drop;
          if (g) st.nextDropped.set(g.id, { mx, my });
          return;
        }
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > config.clickSlop) return;
        const hit = resolve(this, st, mx, my, null);
        st.hover = hit;
        st.hoveredIds = hoverSet(hit);
        const g = hit && hit.shape.q.click;
        if (g) st.nextClicked.add(g.id);
      }, opt);
      el.addEventListener('pointercancel', () => { st.down = null; st.drag = null; }, opt);
      el.addEventListener('wheel', (e) => {
        const [mx, my] = canvasXY(e);
        const hit = resolve(this, st, mx, my);
        const g = hit && hit.shape.q.scroll;
        if (!g) return;
        const acc = st.nextScrolled.get(g.id) || { x: 0, y: 0 };
        acc.x += e.deltaX; acc.y += e.deltaY;
        st.nextScrolled.set(g.id, acc);
        e.preventDefault();  // the scope that asked owns this scroll: no page scroll, no orbit zoom
        e.stopPropagation();
      }, this._removeSignal ? { signal: this._removeSignal, passive: false } : { passive: false });
    };

    lifecycles.predraw = function () {
      const st = state(this);
      // Questions are per frame, unlike fill: clear our keys before draw() runs.
      const states = S(this);
      for (const k of STATE_KEYS) states[k] = null;
      st.groups = 0;
      st.shapes = [];
      st.verts = null;
      st.clickedIds = st.nextClicked;
      st.nextClicked = new Set();
      st.droppedIds = st.nextDropped;
      st.nextDropped = new Map();
      st.scrolledIds = st.nextScrolled;
      st.nextScrolled = new Map();
    };

    lifecycles.postdraw = function () {
      const st = state(this);
      st.frozen = { shapes: st.shapes };
      const hit = resolve(this, st, this.mouseX, this.mouseY);
      st.hover = hit;
      st.hoveredIds = hoverSet(hit);
      if (config.cursor && st.shapes.length) {
        const want = hit || st.drag ? 'pointer' : 'default';
        if (st.cursor !== want) { st.cursor = want; this.cursor(want); }
      }
    };

    lifecycles.remove = function () {
      if (current === this) current = null;
    };
  }

  // ---------------------------------------------------------------- register

  if (!root.p5 || typeof root.p5.registerAddon !== 'function') {
    throw new Error('p5.interact: load p5.js 2.x before p5.interact.js');
  }
  root.p5.registerAddon(addon);

  const inst = () => {
    if (!current) throw new Error('p5.interact: no p5 sketch has finished setup() yet');
    return current;
  };
  // Namespaced mirror for people who prefer interact.hovered() over bare globals.
  root.interact = {
    config,
    hovered: () => inst().hovered(),
    clicked: () => inst().clicked(),
    dragged: () => inst().dragged(),
    dropped: () => inst().dropped(),
    scrolled: () => inst().scrolled(),
    noInteract: () => inst().noInteract(),
    noHover: () => inst().noHover(),
    noClick: () => inst().noClick(),
    noDrag: () => inst().noDrag(),
    noDrop: () => inst().noDrop(),
    noScroll: () => inst().noScroll(),
    localMouse: () => inst().localMouse(),
    hitInfo: () => inst().hitInfo(),
    _math: { mul4, inv4, xf, roundRectSDF, pointInPoly, rayBox, raySphere, raySegment },
  };
})(typeof window !== 'undefined' ? window : globalThis);
