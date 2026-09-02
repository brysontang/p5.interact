// p5 2.3.1 _draw pacing, replayed on a synthetic display. Same arithmetic as the library.
function simulate(hz, target, frames = 60, phase = 0) {
  const period = 1000 / hz, targetGap = 1000 / target, epsilon = 5;
  let lastTarget = 0, lastReal = 0, first = true;
  const gaps = [], reported = [];
  for (let i = 0; i < frames; i++) {
    const now = phase + i * period;
    const since = now - lastTarget;
    if (first || since >= targetGap - epsilon) {
      if (!first) { gaps.push(now - lastReal); reported.push(1000 / (now - lastReal)); }
      lastTarget = Math.max(lastTarget + targetGap, now);
      lastReal = now; first = false;
    }
  }
  const avg = 1000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length);
  const hist = {};
  for (const g of gaps) { const k = g.toFixed(1); hist[k] = (hist[k] || 0) + 1; }
  const seen = [...new Set(reported.map(r => r.toFixed(1)))];
  return { hz, target, avgFps: +avg.toFixed(1), gapsMs: hist, frameRateWouldShow: seen, pattern: gaps.slice(0, 12).map(g => g.toFixed(0)).join(' ') };
}
for (const [hz, target] of [[75, 60], [75, 240], [60, 60], [120, 60], [120, 240], [144, 60]]) console.log(JSON.stringify(simulate(hz, target)));
