// Renders one example page from the folder it lives in: description.md on top, the
// sketch running live, the code beneath it, editable. No build step.

const P5_CDN = 'https://cdn.jsdelivr.net/npm/p5@2.3.1/lib/p5.js';

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Enough markdown for a description: paragraphs, `code`, [links](url).
function markdown(md) {
  const inline = (t) => escapeHtml(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return md.trim().split(/\n\s*\n/).map((p) => `<p>${inline(p.replace(/\n/g, ' '))}</p>`).join('');
}

function sketchDocument(code) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<script src="${P5_CDN}"><\/script>
<script src="../../p5.interact.js"><\/script>
<style>html,body{margin:0;background:#111;overflow:hidden}canvas{display:block}</style>
</head><body><script>
window.addEventListener('error', e => { document.body.innerHTML = '<pre style="color:#f88;font:12px monospace;padding:8px;white-space:pre-wrap">' + e.message + '</pre>'; });
${code.replace(/<\/script/g, '<\\/script')}
<\/script></body></html>`;
}

async function renderExample() {
  const [code, md] = await Promise.all([
    fetch('code.js').then((r) => r.text()),
    fetch('description.md').then((r) => r.text()),
  ]);
  const lines = md.trim().split('\n');
  const title = lines[0].replace(/^#\s*/, '');
  const rest = lines.slice(1).join('\n').trim();
  const [oneLine, ...paras] = rest.split(/\n\s*\n/);
  document.title = `${title} · p5.interact examples`;

  document.body.innerHTML = `
    <div class="layout example-page">
      <nav class="side">
        <h1><a href="../../docs/">p5.interact</a></h1>
        <div class="tag">interaction without ceremony</div>
        <h2>Examples</h2>
        <ul id="nav"></ul>
        <h2>More</h2>
        <ul><li><a href="../../docs/">reference</a></li><li><a href="../../docs/readme.html">README</a></li></ul>
      </nav>
      <main class="ref">
        <h1 class="prose">${escapeHtml(title)}</h1>
        <p class="summary">${escapeHtml(oneLine)}</p>
        ${markdown(paras.join('\n\n'))}
        <div class="sketch"><iframe sandbox="allow-scripts allow-same-origin" title="${escapeHtml(title)}"></iframe></div>
        <div class="code big"><span class="hint">editable</span><textarea spellcheck="false"></textarea></div>
      </main>
    </div>`;

  const iframe = document.querySelector('iframe');
  const ta = document.querySelector('textarea');
  ta.value = code.trim();
  const fit = () => { ta.rows = ta.value.split('\n').length; };
  const run = () => { iframe.srcdoc = sketchDocument(ta.value); };
  let t = null;
  ta.addEventListener('input', () => { fit(); clearTimeout(t); t = setTimeout(run, 500); });
  fit();
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = s + 2;
    }
  });
  run();

  // Sidebar: every sibling example, from the shared list
  const nav = document.getElementById('nav');
  const here = location.pathname.split('/').filter(Boolean).slice(-1)[0];
  for (const [dir, name] of EXAMPLES) {
    nav.insertAdjacentHTML('beforeend', `<li><a class="prose ${dir === here ? 'current' : ''}" href="../${dir}/">${escapeHtml(name)}</a></li>`);
  }
}

const EXAMPLES = [
  ['00_Hover_And_Click', 'Hover and Click'],
  ['01_Drag_Shapes', 'Drag Shapes'],
  ['02_Drag_Between_Boxes', 'Drag Between Boxes'],
  ['03_Keyed_Scopes', 'Keyed Scopes'],
  ['04_Picking_In_3D', 'Picking in 3D'],
  ['05_Every_Shape', 'Every Shape'],
];

function renderExampleIndex() {
  document.title = 'p5.interact examples';
  document.body.innerHTML = `
    <div class="layout example-page">
      <nav class="side">
        <h1><a href="../docs/">p5.interact</a></h1>
        <div class="tag">interaction without ceremony</div>
        <h2>More</h2>
        <ul><li><a href="../docs/">reference</a></li><li><a href="../docs/readme.html">README</a></li><li><a href="../bench/drag-latency/">drag-latency bench</a></li></ul>
      </nav>
      <main class="ref">
        <h1 class="prose">Examples</h1>
        <p class="summary">One idea each, in the style of the p5 examples. Edit the code on any page.</p>
        <ul class="index-list" id="list"></ul>
      </main>
    </div>`;
  const list = document.getElementById('list');
  for (const [dir, name] of EXAMPLES) {
    fetch(`${dir}/description.md`).then((r) => r.text()).then((md) => {
      const one = md.trim().split('\n').slice(1).join('\n').trim().split(/\n\s*\n/)[0];
      list.insertAdjacentHTML('beforeend', `<li><a class="prose" href="${dir}/">${escapeHtml(name)}</a><span>${escapeHtml(one)}</span></li>`);
    });
  }
}
