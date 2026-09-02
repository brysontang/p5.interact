# Draft issue for p5.js: draw-loop pacing skips refreshes in a pattern on non-60 Hz displays

This is a draft. Numbers are measured; the wording is a starting point for you to make
your own before filing. Repro script: `pacing-sim.js` next to this file.

---

**p5.js version:** 2.3.1
**Browser / OS:** Chrome, macOS, 75 Hz external display (also reproduces by arithmetic
for 144 Hz; see below)

## What happens

With the default `frameRate(60)` on a 75 Hz display, `draw()` runs on two refreshes out of
every three. Frame gaps alternate 13.3, 13.3, 26.7 ms. The effective rate is 50 fps, and the
long gap every third frame is visible as judder when anything follows the mouse.

`frameRate()` (the getter) returns `1000 / deltaTime` of the last frame, so it reports
either 75 or 37.5 depending on which frame you sample, never 50. That makes the problem
hard to see: the number looks like it is flickering between "fine" and "half".

## Why

`_draw` decides whether to draw on a given `requestAnimationFrame` like this
(`core/main.js`):

```js
const epsilon = 5;
if (!this._loop || timeSinceLastFrame >= targetTimeBetweenFrames - epsilon) {
  ...
  this._lastTargetFrameTime = Math.max(this._lastTargetFrameTime + targetTimeBetweenFrames, now);
```

With `targetTimeBetweenFrames = 16.67` and a refresh period of 13.33, the threshold is 11.67 ms.
Replaying that arithmetic on a synthetic 75 Hz timeline:

```
refresh   since-last-target   draws?
 0.0      –                   yes   (target -> 16.67)
13.3      -3.3                no
26.7      10.0                no
40.0      23.3                yes   (target -> 40.0)
53.3      13.3                yes   (target -> 56.67)
66.7      10.0                no
80.0      23.3                yes   ...
```

The 5 ms tolerance was added so a loop slightly out of phase with the display would not
lose frames. It works when the refresh period is 16.67 (60 Hz) because the threshold
11.67 sits below one period. It does not work when the period is 13.33 (75 Hz) or 6.94
(144 Hz), because "one period" and "two periods" straddle the threshold and the loop
alternates.

## Measured (live, Chrome, 75.2 Hz display)

150-frame windows, gaps bucketed to 2 ms:

| setting | avg fps | frame gaps | `frameRate()` returned |
|---|---|---|---|
| default (60) | 50.0 | 14 ms x45, 26 ms x37, 28 ms x31 | 37.5, then 75.2 on the next sample |
| `frameRate(Infinity)` | 74.9 | 14 ms x90, 12 ms x40 | 71 to 75 |

The simulation in `pacing-sim.js` reproduces the same pattern from the arithmetic alone:

| display | target | avg fps | gap pattern |
|---|---|---|---|
| 75 | 60 | 49.1 | 13, 27, 13, 27 ... |
| 75 | Infinity | 75.0 | 13, 13, 13 ... |
| 120 | 60 | 60 | 17, 17, 17 ... (clean, since 120 / 60 is an integer) |
| 144 | 60 | 55.6 | 14, 21, 14, 21 ... |

## Workaround

`frameRate(Infinity)` in `setup()`. `targetTimeBetweenFrames` becomes 0, every refresh
draws, and `saveGif()` already special-cases `Infinity` as 60 so export is unaffected.

## Possible directions (for discussion, not a PR)

1. **Report an honest number.** Have `frameRate()` return a short rolling average
   instead of `1000 / last gap`. This alone would have made the problem visible as "50"
   instead of a flicker between 75 and 37.
2. **Snap to the display.** Measure the refresh period from rAF timestamps and, when the
   target does not divide it, either draw every refresh or pick the nearest integer
   divisor, so gaps are uniform. Any decimation of 75 to 60 is irregular by nature; the
   choice is between uniform-75, uniform-37.5, or the current 13/13/27.
3. **Document it.** At minimum note on `frameRate()` that on displays whose refresh is
   not a multiple of the target, frames are skipped unevenly, and that `Infinity` draws
   every refresh.

Happy to test a patch on the 75 Hz display.
