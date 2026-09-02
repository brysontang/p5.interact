// Renders one reference page from REFERENCE (reference.js). No build step: each
// docs/reference/<name>.html just calls renderReference('<name>').
//
// Examples run live in sandboxed iframes, global-mode p5 exactly as written, with the
// code beside them. Edit the code and it reruns.

const P5_CDN = 'https://cdn.jsdelivr.net/npm/p5@2.3.1/lib/p5.js';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sketchDocument(code) {
  // Relative URLs inside srcdoc resolve against this page, docs/reference/<name>.html.
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<script src="${P5_CDN}"><\/script>
<script src="../../p5.interact.js"><\/script>
<style>html,body{margin:0;background:#111;overflow:hidden}canvas{display:block}</style>
</head><body><script>
window.addEventListener('error', e => { document.body.innerHTML = '<pre style="color:#f88;font:12px monospace;padding:8px;white-space:pre-wrap">' + e.message + '</pre>'; });
${code.replace(/<\/script/g, '<\\/script')}
<\/script></body></html>`;
}

function exampleBlock(ex, i) {
  const wrap = document.createElement('div');
  wrap.className = 'example';
  wrap.innerHTML = `
    <div class="canvas"><iframe sandbox="allow-scripts allow-same-origin" title="example ${i + 1}"></iframe></div>
    <div class="code"><span class="hint">editable</span><textarea spellcheck="false"></textarea></div>
    ${ex.caption ? `<div class="caption">${ex.caption}</div>` : ''}`;
  const iframe = wrap.querySelector('iframe');
  const ta = wrap.querySelector('textarea');
  ta.value = ex.code.trim();
  ta.rows = Math.max(10, ta.value.split('\n').length + 1);
  const run = () => { iframe.srcdoc = sketchDocument(ta.value); };
  let t = null;
  ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 500); });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { // keep tab in the editor
      e.preventDefault();
      const s = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = s + 2;
    }
  });
  run();
  return wrap;
}

// root: path from the current page to the repo root ('../../' from docs/reference/, '../' from docs/).
function sideNav(current, root) {
  const groups = {};
  for (const [name, r] of Object.entries(REFERENCE)) (groups[r.group] ||= []).push(name);
  const ref = root + 'docs/reference/';
  return `
    <nav class="side">
      <h1><a href="${root}docs/">p5.interact</a></h1>
      <div class="tag">interaction without ceremony</div>
      ${Object.entries(groups).map(([g, names]) => `
        <h2>${g}</h2>
        <ul>${names.map((n) => `<li><a class="${n === current ? 'current' : ''}" href="${ref}${n}.html">${REFERENCE[n].signature.split('(')[0]}${REFERENCE[n].signature.includes('(') ? '()' : ''}</a></li>`).join('')}</ul>`).join('')}
      <h2>More</h2>
      <ul>
        <li><a class="prose ${current === 'readme' ? 'current' : ''}" href="${root}docs/readme.html">README</a></li>
        <li><a class="prose" href="${root}examples/">examples</a></li>
        <li><a class="prose" href="${root}bench/drag-latency/">drag-latency bench</a></li>
      </ul>
    </nav>`;
}

function renderReference(name) {
  const r = REFERENCE[name];
  if (!r) { document.body.textContent = `No reference entry for ${name}`; return; }
  document.title = `${r.signature} · p5.interact`;
  const params = (r.params || []).map((p) => `<tr><td class="name">${esc(p.name)}</td><td class="type">${esc(p.type)}</td><td>${p.desc}</td></tr>`).join('');
  document.body.innerHTML = `
    <div class="layout">
      ${sideNav(name, '../../')}
      <main class="ref">
        <h1>${esc(r.signature)}</h1>
        <p class="summary">${r.summary}</p>
        <h2>Description</h2>
        ${r.description.map((p) => `<p>${p}</p>`).join('')}
        ${params ? `<h2>Parameters</h2><table>${params}</table>` : ''}
        ${r.returns ? `<h2>Returns</h2><p>${r.returns}</p>` : ''}
        <h2>Examples</h2>
        <div id="examples"></div>
        ${r.seeAlso ? `<h2>See also</h2><p>${r.seeAlso.map((n) => `<a href="${n}.html"><code>${n}</code></a>`).join(' · ')}</p>` : ''}
      </main>
    </div>`;
  const host = document.getElementById('examples');
  r.examples.forEach((ex, i) => host.appendChild(exampleBlock(ex, i)));
}

function renderIndex() {
  document.title = 'p5.interact reference';
  document.body.innerHTML = `
    <div class="layout">
      ${sideNav(null, '../')}
      <main class="ref">
        <h1>p5.interact</h1>
        <p class="summary">Interaction for p5 without ceremony.</p>
        <p>Four questions you can ask inside <code>draw()</code>, each applying to the shapes drawn after it until the next question or the end of the enclosing <code>push()</code> / <code>pop()</code>, the way <code>describeElement()</code> scopes itself. No ids, no handles, no registration. State lives in your variables.</p>
        <pre class="sig">${esc(`<script src="https://cdn.jsdelivr.net/npm/p5@2.3.1/lib/p5.js"></script>
<script src="https://cdn.jsdelivr.net/gh/brysontang/p5.interact@v0.1.0/p5.interact.js"></script>`)}</pre>
        <p><a href="https://github.com/brysontang/p5.interact">github.com/brysontang/p5.interact</a> · MIT</p>
        <ul class="index-list">
          ${Object.entries(REFERENCE).map(([n, r]) => `<li><a href="reference/${n}.html">${esc(r.signature)}</a><span>${r.summary}</span></li>`).join('')}
        </ul>
      </main>
    </div>`;
}

async function renderReadme() {
  const md = await fetch('../README.md').then((r) => r.text());
  document.title = 'README · p5.interact';
  document.body.innerHTML = `
    <div class="layout">
      ${sideNav('readme', '../')}
      <main class="ref readme">${renderMarkdown(md)}</main>
    </div>`;
}
