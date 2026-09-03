// Headless runner: serves the repo, opens test/index.html in Chromium, prints the results,
// exits non-zero on any failure. `npm test`.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.md': 'text/markdown', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/test/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(url);
  const out = await page.evaluate(() => window.__done);
  for (const r of out.results) console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : '\n    ' + r.error}`);
  console.log(`\n${out.passed} passed, ${out.failed} failed`);
  await browser.close();
  server.close();
  process.exit(out.failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
