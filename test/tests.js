// The behaviors p5.interact promises, one test each. Run test/index.html in a browser,
// or `npm test` for headless Chromium.

// ---------------------------------------------------------------- questions are drawing state

test('hovered(): one question covers every shape after it', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300)} function draw(){background(0); fill(hovered()?255:100); circle(100,100,80); rect(200,60,100,80)}`);
  await s.moveTo(100, 100); assert.deepEqual(s.hoveredIds(), ['o0'], 'circle');
  await s.moveTo(250, 100); assert.deepEqual(s.hoveredIds(), ['o0'], 'rect, same group');
  await s.moveTo(20, 280); assert.deepEqual(s.hoveredIds(), [], 'empty');
  s.done();
});

test('a question after a shape starts a new group, like a second fill()', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300)} function draw(){background(0); fill(hovered()?255:100); circle(100,100,80); fill(hovered()?255:100); rect(200,60,100,80)}`);
  await s.moveTo(100, 100); assert.deepEqual(s.hoveredIds(), ['o0']);
  await s.moveTo(250, 100); assert.deepEqual(s.hoveredIds(), ['o1']);
  s.done();
});

test('only shapes after a question are picked', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300)} function draw(){background(0); circle(100,100,80); fill(hovered()?255:100); circle(250,100,80)}`);
  await s.moveTo(100, 100); assert.equal(s.hit(), null, 'first circle is plain drawing');
  await s.moveTo(250, 100); assert.equal(s.hit(), 'ellipse');
  s.done();
});

test('questions asked back to back share the shapes that follow', async () => {
  const s = await sketch(`window.on=false; function setup(){createCanvas(400,300)} function draw(){background(0); if(clicked()) on=!on; const hot=hovered(); fill(on?'gold':hot?200:100); rect(100,100,200,100)}`);
  await s.moveTo(200, 150);
  const sh = s.shapes()[0];
  assert.equal(sh.q.hover.id, sh.q.click.id, 'same group');
  await s.click(200, 150); assert.equal(s.E('on'), true);
  s.done();
});

test('a skipped question leaves the previous one in force (the fill trap)', async () => {
  const s = await sketch(`window.lit=false; function setup(){createCanvas(400,300)} function draw(){background(0);
    fill(hovered()?255:100); circle(100,100,80);
    fill(lit ? 'gold' : hovered() ? 255 : 100); rect(200,60,100,80)}`);
  await s.moveTo(250, 100); assert.deepEqual(s.hoveredIds(), ['o1'], 'own group while lit is false');
  s.E('lit = true'); await s.moveTo(250, 100);
  assert.deepEqual(s.hoveredIds(), ['o0'], 'inherits the circle\'s question once hovered() is skipped');
  s.done();
});

test('push() and pop() scope questions like fill', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300)} function draw(){background(0);
    push(); fill(hovered()?255:100); circle(100,100,80); pop();
    rect(200,60,100,80)}`);
  await s.moveTo(250, 100); assert.equal(s.hit(), null, 'rect after pop is not part of the question');
  s.done();
});

test('a child scope never joins the parent\'s fresh group', async () => {
  const s = await sketch(`window.r={}; function setup(){createCanvas(400,300)} function draw(){background(0);
    push(); r.panel = hovered();
      push(); r.dot = hovered(); fill(200); circle(60,60,40); pop();
      fill(50); rect(20,100,160,120);
    pop()}`);
  await s.moveTo(60, 60); assert.deepEqual([s.E('r.panel'), s.E('r.dot')], [false, true], 'dot alone');
  await s.moveTo(100, 160); assert.deepEqual([s.E('r.panel'), s.E('r.dot')], [true, false], 'panel alone');
  s.done();
});

// ---------------------------------------------------------------- nothing bubbles

test('nothing bubbles: the innermost scope that asked answers', async () => {
  const s = await sketch(`window.events=[]; window.r={}; function setup(){createCanvas(500,400)} function draw(){background(0);
    push(); r.card = hovered(); if(clicked()) events.push('card'); fill(40); rect(20,20,300,200);
      push(); r.button = hovered(); if(clicked()) events.push('button'); fill(200); rect(40,40,100,50); pop();
      push(); hovered(); fill(120); circle(250,70,40); pop();
      fill(90); rect(40,120,260,60);
    pop()}`);
  s.E('events.length = 0'); await s.click(90, 65); assert.deepEqual(s.E('events'), ['button'], 'button only');
  assert.deepEqual([s.E('r.card'), s.E('r.button')], [false, true]);
  s.E('events.length = 0'); await s.click(250, 70); assert.deepEqual(s.E('events'), ['card'], 'hover-only badge passes the click to the card');
  s.E('events.length = 0'); await s.click(170, 150); assert.deepEqual(s.E('events'), ['card'], 'plain label belongs to the card');
  assert.deepEqual([s.E('r.card'), s.E('r.button')], [true, false]);
  s.done();
});

test('ask once at a group and children inherit; ask in each and they answer alone', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300)} function draw(){background(0);
    push(); fill(hovered()?70:45); rect(15,30,140,160); for(let i=0;i<3;i++) circle(85,60+i*50,34); pop();
    push(); fill(hovered()?70:45); rect(165,30,140,160); for(let i=0;i<3;i++){ fill(hovered()?255:100); circle(235,60+i*50,34);} pop()}`);
  await s.moveTo(85, 60); assert.deepEqual(s.hoveredIds(), ['o0'], 'left dot answers as the panel');
  await s.moveTo(235, 60); assert.deepEqual(s.hoveredIds(), ['o2'], 'right dot answers alone');
  await s.moveTo(180, 180); assert.deepEqual(s.hoveredIds(), ['o1'], 'right panel background');
  s.done();
});

test('drops go to the innermost scope that asked dropped()', async () => {
  const s = await sketch(`window.events=[]; window.ball={x:60,y:60}; function setup(){createCanvas(500,400)} function draw(){background(0);
    push(); if(dropped()) events.push('outer'); fill(30); rect(20,240,460,140);
      push(); if(dropped()) events.push('inner'); fill(60); rect(300,260,160,100); pop();
      push(ball); const d=dragged(); if(d){ball.x+=d.x;ball.y+=d.y} fill(255); circle(ball.x,ball.y+240,30); pop();
    pop()}`);
  const bx = () => s.E('ball.x'), by = () => s.E('ball.y') + 240;
  s.E('events.length = 0'); await s.drag(bx(), by(), 380, 310); assert.deepEqual(s.E('events'), ['inner']);
  s.E('events.length = 0'); await s.drag(bx(), by(), 150, 350); assert.deepEqual(s.E('events'), ['outer']);
  s.done();
});

// ---------------------------------------------------------------- clicks

test('clicked() is true for exactly one frame', async () => {
  const s = await sketch(`window.count=0; function setup(){createCanvas(400,300)} function draw(){background(0); if(clicked()) count++; fill(100); rect(100,100,200,100)}`);
  await s.moveTo(200, 150); s.el.dispatchEvent(new s.W.PointerEvent('pointerdown', { clientX: s.el.getBoundingClientRect().left + 200, clientY: s.el.getBoundingClientRect().top + 150, button: 0, buttons: 1, pointerId: 1, bubbles: true }));
  s.el.dispatchEvent(new s.W.PointerEvent('pointerup', { clientX: s.el.getBoundingClientRect().left + 200, clientY: s.el.getBoundingClientRect().top + 150, button: 0, buttons: 0, pointerId: 1, bubbles: true }));
  await s.frames(1); assert.equal(s.E('count'), 1, 'counted on the next frame');
  await s.frames(3); assert.equal(s.E('count'), 1, 'and never again');
  s.done();
});

test('a press that travels is a drag, not a click', async () => {
  const s = await sketch(`window.count=0; window.pos={x:200,y:150}; function setup(){createCanvas(400,300)} function draw(){background(0); if(clicked()) count++; const d=dragged(); if(d){pos.x+=d.x;pos.y+=d.y} fill(100); circle(pos.x,pos.y,100)}`);
  await s.drag(200, 150, 260, 180);
  assert.equal(s.E('count'), 0, 'no click');
  assert.deepEqual([Math.round(s.E('pos.x')), Math.round(s.E('pos.y'))], [260, 180], 'moved exactly with the pointer');
  s.done();
});

// ---------------------------------------------------------------- dragging

test('dragged(): delta in the frame where it is asked; group drag moves everything after it', async () => {
  const s = await sketch(`window.panel={x:40,y:40}; function setup(){createCanvas(400,300)} function draw(){background(0);
    push(); const g=dragged(); if(g){panel.x+=g.x;panel.y+=g.y} translate(panel.x,panel.y); fill(45); rect(0,0,230,150); fill(200); circle(50,50,36); circle(150,80,36); pop()}`);
  await s.drag(90, 90, 130, 120);
  assert.deepEqual([s.E('panel.x'), s.E('panel.y')], [80, 70], 'grabbed by a dot, the panel moved');
  s.done();
});

test('the innermost scope that asked dragged() claims the drag', async () => {
  // (not "dot": p5 has a global dot() and would overwrite the object)
  const s = await sketch(`window.panel={x:40,y:40}; window.knob={x:50,y:50}; function setup(){createCanvas(400,300)} function draw(){background(0);
    push(); const g=dragged(); if(g){panel.x+=g.x;panel.y+=g.y} translate(panel.x,panel.y); fill(45); rect(0,0,230,150);
      push(); const d=dragged(); if(d){knob.x+=d.x;knob.y+=d.y} fill(200); circle(knob.x,knob.y,36); pop();
    pop()}`);
  await s.drag(90, 90, 130, 120);
  assert.deepEqual([s.E('panel.x'), s.E('knob.x')], [40, 90], 'the knob moved, the panel did not');
  s.done();
});

test('the delta is delivered once per frame', async () => {
  const s = await sketch(`window.a=null; window.b=null; window.pos={x:200,y:150}; function setup(){createCanvas(400,300)} function draw(){background(0); push(pos); a=dragged(); b=dragged(); if(a){pos.x+=a.x} fill(100); circle(pos.x,pos.y,100); pop()}`);
  await s.press(200, 150); await s.moveTo(260, 150, 1);           // read on the frame the delta arrives
  assert.ok(s.E('a') && s.E('a').x !== 0, 'first call has the delta');
  assert.deepEqual(s.E('b'), { x: 0, y: 0 }, 'second call in the same frame is zero, still truthy');
  await s.release(260, 150);
  s.done();
});

test('what you hold is skipped by picking; the target beneath answers hovered() and dropped()', async () => {
  const s = await sketch(`window.landed=false; window.ball={x:60,y:60}; window.zoneHot=false; function setup(){createCanvas(400,300)} function draw(){background(0);
    zoneHot = hovered(); if(dropped()) landed=true; fill(45); rect(150,20,220,260);
    push(ball); const d=dragged(); if(d){ball.x+=d.x;ball.y+=d.y} fill(255); circle(ball.x,ball.y,40); pop()}`);
  await s.press(60, 60); await s.moveTo(100, 60); await s.moveTo(260, 150);
  assert.equal(s.E('zoneHot'), true, 'zone is hovered through the held ball');
  await s.release(260, 150);
  assert.equal(s.E('landed'), true);
  s.done();
});

test('a drag ends where dragged() returns null; drop on nothing can snap home', async () => {
  const s = await sketch(`window.home={x:60,y:60}; window.ball={x:60,y:60}; window.lifted=false; window.landed=false; function setup(){createCanvas(400,300)} function draw(){background(0);
    if(dropped()) landed=true; fill(45); rect(200,20,180,260);
    noHover(); const d=dragged(); if(d){ball.x+=d.x;ball.y+=d.y;lifted=true} else if(lifted){ if(!landed) ball={...home}; lifted=false; landed=false } fill(255); circle(ball.x,ball.y,40)}`);
  await s.drag(60, 60, 60, 250); assert.deepEqual(s.E('ball'), { x: 60, y: 60 }, 'released on nothing: home');
  await s.drag(60, 60, 290, 150); assert.deepEqual([Math.round(s.E('ball.x')), Math.round(s.E('ball.y'))], [290, 150], 'released in the zone: stays');
  s.done();
});

test('orbitControl() sits out while a shape is being dragged (WEBGL)', async () => {
  const s = await sketch(`window.pos={x:0,y:0}; function setup(){createCanvas(400,300,WEBGL)} function draw(){background(0); orbitControl(); push(); const d=dragged(); if(d){pos.x+=d.x;pos.y+=d.y} translate(pos.x,pos.y,0); fill(200); box(80); pop()}`);
  const cam = () => { const c = s.P._renderer.states.curCamera; return [c.eyeX, c.eyeY, c.eyeZ].map((v) => +v.toFixed(1)).join(); };
  const orbitDrag = async (x, y) => { const e0 = cam(); await s.press(x, y); s.P.mouseIsPressed = true; s.P.mouseX = x + 40; s.P.movedX = 40; await s.P.redraw(); s.P.movedX = 40; await s.P.redraw(); const moved = cam() !== e0; await s.release(x + 40, y); s.P.mouseIsPressed = false; s.P.movedX = 0; return moved; };
  assert.equal(await orbitDrag(200, 150), false, 'on the box: camera still');
  assert.equal(await orbitDrag(30, 30), true, 'on empty space: camera orbits');
  s.done();
});

// ---------------------------------------------------------------- keyed scopes

test('push(key): identity survives a scope inserted before it mid-drag', async () => {
  const s = await sketch(`window.items=[]; window.keyed=true; for(let i=0;i<5;i++) items.unshift({x:80+i*60,y:150});
    function setup(){createCanvas(400,300)} function draw(){background(0); for(const it of items){ push(keyed?it:undefined); const d=dragged(); if(d){it.x+=d.x} fill(100); circle(it.x,it.y,40); pop() }}`);
  const it = s.E('items[2]'); const x0 = it.x;
  await s.press(x0, 150); await s.moveTo(x0 + 40, 150); s.E('items.unshift({x:380,y:150})'); await s.moveTo(x0 + 80, 150); await s.release(x0 + 80, 150);
  assert.equal(Math.round(it.x - x0), 80, 'keyed: the same item kept moving');
  s.done();
});

test('push(): order identity, and the documented failure mode', async () => {
  const s = await sketch(`window.items=[]; for(let i=0;i<5;i++) items.unshift({x:80+i*60,y:150});
    function setup(){createCanvas(400,300)} function draw(){background(0); for(const it of items){ push(); const d=dragged(); if(d){it.x+=d.x} fill(100); circle(it.x,it.y,40); pop() }}`);
  const it = s.E('items[2]'); const x0 = it.x; const neighbor = s.E('items[1]'); const n0 = neighbor.x;
  await s.press(x0, 150); await s.moveTo(x0 + 40, 150); s.E('items.unshift({x:380,y:150})'); await s.moveTo(x0 + 80, 150); await s.release(x0 + 80, 150);
  assert.equal(Math.round(it.x - x0), 40, 'the dragged item stopped');
  assert.equal(Math.round(neighbor.x - n0), 40, 'its neighbor took the rest');
  s.done();
});

test('push(key) does not trip p5\'s argument validator', async () => {
  const s = await sketch(`window.logs=[]; const ol=console.log; console.log=(...a)=>{logs.push(a.join(' ')); ol.apply(console,a)}; window.it={x:100}; function setup(){createCanvas(400,300)} function draw(){background(0); push(it); hovered(); circle(it.x,100,50); pop()}`);
  await s.frames();
  assert.deepEqual(s.E('logs').filter((l) => l.includes('p5.js says')), [], 'no friendly error');
  assert.ok(s.shapes()[0].q.hover.id.startsWith('k'), 'keyed group id');
  s.done();
});

// ---------------------------------------------------------------- scrolling

test('scrolled(): accumulates per frame; a scope that asked owns the wheel', async () => {
  const s = await sketch(`window.s=null; function setup(){createCanvas(400,300)} function draw(){background(0); s=scrolled(); fill(45); rect(50,50,200,150)}`);
  await s.moveTo(150, 120);
  const consumed = s.wheel(150, 120, 50); s.wheel(150, 120, 30); await s.frames(1);
  assert.equal(consumed, true, 'consumed over the shape');
  assert.deepEqual(s.E('s'), { x: 0, y: 80 }, 'two events add up');
  await s.frames(1); assert.equal(s.E('s'), null, 'nothing more next frame');
  assert.equal(s.wheel(350, 280, 50), false, 'not consumed off the shape');
  s.done();
});

// ---------------------------------------------------------------- negations

test('noHover / noClick / noDrag / noScroll / noDrop turn off one question each', async () => {
  const s = await sketch(`window.count=0; window.pos={x:0,y:0}; window.off=0; window.landed=null; function setup(){createCanvas(400,300)} function draw(){background(0);
    fill(hovered()?200:100); if(clicked()) count++; rect(20,20,160,80);
    noHover(); rect(20,110,160,40);                      // clicks, no hover
    noClick(); fill(hovered()?200:100); rect(20,160,160,40); // hovers, no click
    push(); const d=dragged(); if(d){pos.x+=d.x} translate(pos.x,0); fill(100); rect(200,20,160,80); noDrag(); fill(hovered()?200:100); circle(330,60,30); pop();
    if(scrolled()) off++; fill(45); rect(200,120,160,60); noScroll(); fill(hovered()?70:60); rect(200,120,160,20);
    if(dropped()) landed='zone'; fill(45); rect(200,200,160,80); noDrop(); fill(hovered()?70:60); circle(280,240,40)}`);
  await s.moveTo(100, 130); assert.deepEqual(s.hoveredIds(), [], 'noHover: no hover'); await s.click(100, 130); assert.equal(s.E('count'), 1, 'noHover: still clicks');
  await s.moveTo(100, 180); assert.equal(s.hoveredIds().length, 1, 'noClick: hovers'); await s.click(100, 180); assert.equal(s.E('count'), 1, 'noClick: no click');
  await s.drag(330, 60, 370, 60); assert.equal(s.E('pos.x'), 0, 'noDrag: the knob does not drag the panel');
  await s.drag(230, 60, 270, 60); assert.equal(s.E('pos.x'), 40, 'the panel body still drags');
  await s.moveTo(280, 130); s.wheel(280, 130, 30); await s.frames(1); assert.equal(s.E('off'), 0, 'noScroll: the header does not scroll the list under it');
  await s.moveTo(280, 165); s.wheel(280, 165, 30); await s.frames(1); assert.equal(s.E('off'), 1, 'the list scrolls');
  s.done();
});

test('noInteract() clears every question until pop() or a question', async () => {
  const s = await sketch(`window.over=false; function setup(){createCanvas(400,300)} function draw(){background(0);
    over = hovered(); push(); noInteract(); fill(30); rect(0,0,width,height); pop(); fill(100); circle(100,100,80); rect(200,60,100,80)}`);
  await s.moveTo(20, 280); assert.equal(s.E('over'), false, 'the backdrop is see-through');
  await s.moveTo(100, 100); assert.equal(s.E('over'), true);
  assert.equal(s.shapes().length, 2, 'backdrop not recorded');
  s.done();
});

test('an unrecorded shape does not occlude; one question makes it solid', async () => {
  const s = await sketch(`window.solid=false; function setup(){createCanvas(400,300)} function draw(){background(0);
    fill(hovered()?200:100); rect(50,50,200,150);
    push(); noInteract(); if(solid) hovered(); fill(60); rect(150,100,200,150); pop()}`);
  await s.moveTo(200, 150); assert.deepEqual(s.hoveredIds(), ['o0'], 'grabbed through the inert rect');
  s.E('solid = true'); await s.moveTo(200, 150); assert.deepEqual(s.hoveredIds(), ['o1'], 'now the top rect wins');
  s.done();
});

// ---------------------------------------------------------------- picking

test('rounded rect corners are exact', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300)} function draw(){background(0); hovered(); rect(100,100,120,80,20)}`);
  await s.moveTo(101, 101); assert.equal(s.hit(), null, 'just inside the square corner, outside the arc');
  await s.moveTo(120, 120); assert.equal(s.hit(), 'rect', 'the arc center');
  await s.moveTo(160, 100.5); assert.equal(s.hit(), 'rect', 'top edge midpoint');
  s.done();
});

test('every primitive is pickable; later-drawn wins in 2D', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300); textSize(20)} function draw(){background(0); noStroke();
    hovered(); rect(20,20,80,60); ellipse(160,50,80,50); triangle(230,80,270,20,310,80);
    push(); translate(60,180); rotate(0.5); scale(1.3); quad(-30,-20,30,-25,25,25,-25,20); pop();
    beginShape(); vertex(150,140); vertex(220,160); vertex(230,220); vertex(160,240); endShape(CLOSE);
    stroke(200); strokeWeight(2); line(260,140,380,220); noStroke(); text('text', 320, 270);
    fill(50); rect(20,20,40,30)}`);
  const kinds = s.shapes().map((x) => x.kind);
  assert.deepEqual(kinds, ['rect', 'ellipse', 'poly', 'poly', 'poly', 'line', 'rect', 'rect']);
  await s.moveTo(30, 30); assert.equal(s.shapes().indexOf(s.W.hitInfo().shape), 7, 'the later small rect wins over the first');
  await s.moveTo(60, 180); assert.equal(s.hit(), 'poly', 'rotated scaled quad');
  await s.moveTo(190, 190); assert.equal(s.hit(), 'poly', 'vertex polygon');
  await s.moveTo(320, 180); assert.equal(s.hit(), 'line');
  s.done();
});

test('line tolerance is a screen-pixel floor at any zoom', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300)} function draw(){background(0); push(); scale(0.25); stroke(200); strokeWeight(2); hovered(); line(100,400,900,400); pop()}`);
  await s.moveTo(120, 100); assert.equal(s.hit(), 'line', 'on the half-pixel line');
  await s.moveTo(120, 102.2); assert.equal(s.hit(), 'line', '2 px off');
  await s.moveTo(120, 105); assert.equal(s.hit(), null, '5 px off');
  s.done();
});

test('WEBGL: box, sphere, plane, line; nearest along the ray wins', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300,WEBGL)} function draw(){background(0); hovered(); push(); translate(-120,0,0); box(60); pop(); push(); translate(0,0,0); sphere(40); pop(); push(); translate(120,0,-50); plane(80,60); pop(); push(); translate(0,90,0); stroke(200); line(-150,0,0,150,0,0); pop(); push(); translate(0,0,60); fill(200); box(30); pop()}`);
  await s.moveTo(80, 150); assert.equal(s.hit(), 'box');
  await s.moveTo(200, 150); assert.equal(s.hit(), 'box', 'the nearer small box in front of the sphere');
  await s.moveTo(200, 120); assert.equal(s.hit(), 'sphere');
  await s.moveTo(320, 150); assert.equal(s.hit(), 'rect', 'plane');
  await s.moveTo(200, 240); assert.equal(s.hit(), 'line');
  s.done();
});

// ---------------------------------------------------------------- distance

test('distance(): pixels to the nearest edge, 0 inside, exact for the exact shapes', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300)} function draw(){background(0);
    distance(); rect(50,50,100,80);
    distance(); triangle(250,50,350,50,300,130);
    push(); translate(200,220); rotate(0.5); scale(2); distance(); rect(-20,-10,40,20); pop();
    distance(); stroke(200); strokeWeight(2); line(20,280,120,280)}`);
  await s.moveTo(170, 90); assert.close(s.distances().o0, 20, 0.01, 'right of the rect');
  await s.moveTo(300, 40); assert.close(s.distances().o1, 10, 0.01, 'above the triangle');
  await s.moveTo(200, 220); assert.equal(s.distances().o2, 0, 'inside the rotated rect');
  await s.moveTo(70, 270); assert.close(s.distances().o3, 9, 0.01, '10 px above a 2 px line');
  s.done();
});

test('distance() in WEBGL: sphere and planar shapes, in pixels', async () => {
  const s = await sketch(`function setup(){createCanvas(400,300,WEBGL)} function draw(){background(0); distance(); sphere(50)}`);
  await s.moveTo(200, 150); assert.equal(s.distances().o0, 0);
  await s.moveTo(280, 150); assert.close(s.distances().o0, 30, 0.5, '30 px off the sphere at z = 0');
  s.done();
});

// ---------------------------------------------------------------- housekeeping

test('frameRate(Infinity) is applied unless the sketch chose a rate', async () => {
  const a = await sketch(`function setup(){createCanvas(100,100)} function draw(){}`);
  assert.equal(a.P._targetFrameRate, Infinity); a.done();
  const b = await sketch(`function setup(){createCanvas(100,100); frameRate(30)} function draw(){}`);
  assert.equal(b.P._targetFrameRate, 30); b.done();
});

test('loading the library twice wraps the primitives once', async () => {
  const s = await sketch(`document.write('<script src="../p5.interact.js"><\\/script>'); function setup(){createCanvas(400,300)} function draw(){background(0); hovered(); rect(50,50,100,60)}`);
  await s.frames(); assert.equal(s.shapes().length, 1);
  s.done();
});

test('localMouse() at the root equals mouseX, mouseY; and follows a transform', async () => {
  const s = await sketch(`window.m=null; window.n=null; function setup(){createCanvas(400,300)} function draw(){background(0); m=localMouse(); push(); translate(100,50); scale(2); n=localMouse(); pop()}`);
  await s.moveTo(300, 250);
  assert.deepEqual(s.E('[m.x, m.y]'), [300, 250]);
  assert.deepEqual(s.E('[n.x, n.y]'), [100, 100], '(300-100)/2, (250-50)/2');
  s.done();
});
