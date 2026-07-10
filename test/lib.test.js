const { test } = require('node:test');
const assert = require('node:assert');
const { computeZoom, scanBars, analyzeFrame, RatioAggregator } = require('../lib.js');

// ---------- computeZoom(screenAspect, frameAspect, contentAspect) ----------

const close = (a, b, eps = 0.005) =>
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ≈ ${b}`);

test('no zoom when 21:9 content letterboxed in 16:9 frame on 16:9 screen', () => {
  close(computeZoom(16 / 9, 16 / 9, 2.39), 1.0);
});

test('zooms 21:9-in-16:9 content to fill width on 21:9 screen', () => {
  // frame is height-bound; content width can grow until it hits screen width
  close(computeZoom(21 / 9, 16 / 9, 2.39), (21 / 9) / (16 / 9));
});

test('zoom limited by content height when screen wider than content', () => {
  // 32:9 superultrawide: content height hits screen height first
  close(computeZoom(32 / 9, 16 / 9, 2.39), 2.39 / (16 / 9));
});

test('no zoom for plain 16:9 video on 21:9 screen (never crop content)', () => {
  close(computeZoom(21 / 9, 16 / 9, 16 / 9), 1.0);
});

test('no zoom for true 21:9 stream on 21:9 screen', () => {
  close(computeZoom(2.39, 2.39, 2.39), 1.0);
});

test('zooms pillarboxed 4:3-in-16:9 content to fill 4:3 screen', () => {
  close(computeZoom(4 / 3, 16 / 9, 4 / 3), (16 / 9) / (4 / 3));
});

// ---------- scanBars(data, width, height) ----------

// Build an RGBA buffer: gray content area, black bars.
function makeFrame(width, height, { top = 0, bottom = 0, left = 0, right = 0, contentLum = 128 } = {}) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBar = y < top || y >= height - bottom || x < left || x >= width - right;
      const v = isBar ? 0 : contentLum;
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return data;
}

test('scanBars finds symmetric letterbox bars', () => {
  const d = makeFrame(256, 144, { top: 17, bottom: 17 });
  const bars = scanBars(d, 256, 144);
  assert.strictEqual(bars.top, 17);
  assert.strictEqual(bars.bottom, 17);
  assert.strictEqual(bars.left, 0);
  assert.strictEqual(bars.right, 0);
});

test('scanBars finds pillarbox bars', () => {
  const d = makeFrame(256, 144, { left: 32, right: 32 });
  const bars = scanBars(d, 256, 144);
  assert.strictEqual(bars.left, 32);
  assert.strictEqual(bars.right, 32);
  assert.strictEqual(bars.top, 0);
});

test('scanBars tolerates compression noise in bars (lum < 16 counts as black)', () => {
  const d = makeFrame(256, 144, { top: 17, bottom: 17 });
  // sprinkle dim noise into the bars
  for (let x = 0; x < 256; x += 7) {
    const i = (3 * 256 + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = 12;
  }
  assert.strictEqual(scanBars(d, 256, 144).top, 17);
});

test('scanBars reports zero bars for full-content frame', () => {
  const d = makeFrame(256, 144);
  assert.deepStrictEqual(scanBars(d, 256, 144), { top: 0, bottom: 0, left: 0, right: 0 });
});

// ---------- analyzeFrame(data, width, height) -> content aspect or null ----------

test('analyzeFrame computes 2.39 content aspect from letterboxed 16:9 frame', () => {
  // 256x144 frame, content 256x107 => aspect ≈ 2.39; bars (144-107)/2 = 18.5 -> 18/19
  const d = makeFrame(256, 144, { top: 18, bottom: 19 });
  const ratio = analyzeFrame(d, 256, 144);
  assert.ok(ratio !== null);
  close(ratio, 256 / 107, 0.03);
});

test('analyzeFrame returns 16:9 (frame aspect) when no bars', () => {
  const d = makeFrame(256, 144);
  close(analyzeFrame(d, 256, 144), 256 / 144);
});

test('analyzeFrame rejects nearly-all-black frames (fade)', () => {
  const d = makeFrame(256, 144, { contentLum: 3 });
  assert.strictEqual(analyzeFrame(d, 256, 144), null);
});

test('analyzeFrame rejects asymmetric black area (dark scene, not bars)', () => {
  const d = makeFrame(256, 144, { top: 40, bottom: 5 });
  assert.strictEqual(analyzeFrame(d, 256, 144), null);
});

test('analyzeFrame rejects implausible ratios (> 2.76:1)', () => {
  const d = makeFrame(256, 144, { top: 60, bottom: 60 });
  assert.strictEqual(analyzeFrame(d, 256, 144), null);
});

// ---------- RatioAggregator ----------

test('aggregator locks after 5 agreeing samples', () => {
  const agg = new RatioAggregator();
  for (let i = 0; i < 4; i++) {
    assert.strictEqual(agg.push(2.39), null);
  }
  close(agg.push(2.39), 2.39);
  assert.ok(agg.locked);
});

test('aggregator tolerates 2% jitter between samples', () => {
  const agg = new RatioAggregator();
  [2.39, 2.40, 2.38, 2.39, 2.395].forEach((r) => agg.push(r));
  assert.ok(agg.locked);
});

test('aggregator converges on dominant ratio after a differing intro', () => {
  const agg = new RatioAggregator();
  [16 / 9, 16 / 9, 2.39, 2.39, 2.39, 2.39, 2.39].forEach((r) => agg.push(r));
  assert.ok(agg.locked);
  close(agg.value, 2.39);
});

test('aggregator ignores null samples', () => {
  const agg = new RatioAggregator();
  [2.39, null, 2.39, null, 2.39, 2.39, 2.39].forEach((r) => agg.push(r));
  assert.ok(agg.locked);
});

// ---------- RatioAggregator.provisional() ----------

test('provisional is null with fewer than 2 samples', () => {
  const agg = new RatioAggregator();
  assert.strictEqual(agg.provisional(), null);
  agg.push(2.39);
  assert.strictEqual(agg.provisional(), null);
});

test('provisional returns window mean with 2+ agreeing samples', () => {
  const agg = new RatioAggregator();
  agg.push(2.38);
  agg.push(2.40);
  close(agg.provisional(), 2.39);
});

test('provisional resets after a disagreeing sample', () => {
  const agg = new RatioAggregator();
  agg.push(2.39);
  agg.push(2.39);
  agg.push(16 / 9); // window restarts
  assert.strictEqual(agg.provisional(), null);
});

test('provisional equals locked value once locked', () => {
  const agg = new RatioAggregator();
  for (let i = 0; i < 5; i++) agg.push(2.39);
  close(agg.provisional(), 2.39);
});
