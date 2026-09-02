// Keeps the version in the README snippet and the docs index in step with package.json.
// Runs from the npm "version" hook, so `npm version minor` updates everything in one commit.
const fs = require('fs');
const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const pattern = /cdn\.jsdelivr\.net\/npm\/p5\.interact@\d+\.\d+\.\d+(?:-[\w.]+)?\//g;
const replacement = `cdn.jsdelivr.net/npm/p5.interact@${version}/`;
for (const file of ['README.md', 'docs/render.js']) {
  const before = fs.readFileSync(file, 'utf8');
  if (!before.match(pattern)) throw new Error(`${file}: no p5.interact@x.y.z URL found to update`);
  const after = before.replace(pattern, replacement);
  if (after !== before) fs.writeFileSync(file, after);
  console.log(`${file}: ${after === before ? 'already at' : '->'} ${version}`);
}
