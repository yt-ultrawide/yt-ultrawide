// Pure logic for YT Ultrawide — shared by the content script and Node tests.

const BAR_LUMINANCE_MAX = 16; // compressed black is not pure black
const BAR_ROW_FRACTION = 0.98; // fraction of a row/column that must be dark
const NEAR_BLACK_FRAME_FRACTION = 0.95; // whole frame this dark => fade, skip
const SYMMETRY_TOLERANCE = 0.04; // top/bottom bar difference, as fraction of frame
const MIN_CONTENT_ASPECT = 16 / 9 - 0.02;
const MAX_CONTENT_ASPECT = 2.76 + 0.03;

function luminanceAt(data, i) {
  // Rec. 601 approximation, integer math
  return (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
}

function rowIsBar(data, width, y) {
  let dark = 0;
  const base = y * width * 4;
  for (let x = 0; x < width; x++) {
    if (luminanceAt(data, base + x * 4) < BAR_LUMINANCE_MAX) dark++;
  }
  return dark / width >= BAR_ROW_FRACTION;
}

function colIsBar(data, width, height, x) {
  let dark = 0;
  for (let y = 0; y < height; y++) {
    if (luminanceAt(data, (y * width + x) * 4) < BAR_LUMINANCE_MAX) dark++;
  }
  return dark / height >= BAR_ROW_FRACTION;
}

// Count contiguous black rows/columns from each edge.
function scanBars(data, width, height) {
  let top = 0;
  while (top < height && rowIsBar(data, width, top)) top++;
  let bottom = 0;
  while (bottom < height - top && rowIsBar(data, width, height - 1 - bottom)) bottom++;
  let left = 0;
  while (left < width && colIsBar(data, width, height, left)) left++;
  let right = 0;
  while (right < width - left && colIsBar(data, width, height, width - 1 - right)) right++;
  return { top, bottom, left, right };
}

// Returns the content aspect ratio of a frame, or null if no reliable
// measurement can be made (fade to black, dark scene, implausible ratio).
function analyzeFrame(data, width, height) {
  const { top, bottom, left, right } = scanBars(data, width, height);

  // Whole frame (nearly) black: a fade or a dark scene, not letterboxing.
  if ((top + bottom) / height >= NEAR_BLACK_FRAME_FRACTION) return null;
  if ((left + right) / width >= NEAR_BLACK_FRAME_FRACTION) return null;

  // Asymmetric black is probably a dark scene, not encoder letterboxing.
  if (Math.abs(top - bottom) / height > SYMMETRY_TOLERANCE) return null;
  if (Math.abs(left - right) / width > SYMMETRY_TOLERANCE) return null;

  const contentW = width - left - right;
  const contentH = height - top - bottom;
  if (contentW <= 0 || contentH <= 0) return null;

  const ratio = contentW / contentH;
  if (top + bottom + left + right === 0) return ratio; // frame aspect, always valid
  if (ratio < MIN_CONTENT_ASPECT || ratio > MAX_CONTENT_ASPECT) return null;
  return ratio;
}

// Zoom factor that scales the fullscreen-fitted video so the *content*
// (bars removed) fills the screen on one axis without cropping content.
function computeZoom(screenAspect, frameAspect, contentAspect) {
  // Normalize: screen is S wide, 1 tall.
  const S = screenAspect;
  // Frame fitted into screen (letter/pillarboxed by the player):
  const dispW = frameAspect >= S ? S : frameAspect;
  const dispH = frameAspect >= S ? S / frameAspect : 1;
  // Content rect inside the displayed frame (baked-in bars removed):
  const contentW = contentAspect >= frameAspect ? dispW : dispH * contentAspect;
  const contentH = contentAspect >= frameAspect ? dispW / contentAspect : dispH;
  // Grow until content hits a screen edge.
  return Math.min(S / contentW, 1 / contentH);
}

// Collects per-frame ratio samples; locks once 5 consecutive samples agree
// within 2%. A run of samples at a new ratio restarts the window, so the
// dominant ratio after an intro wins.
class RatioAggregator {
  constructor(needed = 5, tolerance = 0.02) {
    this.needed = needed;
    this.tolerance = tolerance;
    this.window = [];
    this.locked = false;
    this.value = null;
  }

  push(ratio) {
    if (ratio === null || ratio === undefined) return this.locked ? this.value : null;
    const agrees =
      this.window.length === 0 ||
      Math.abs(ratio - this.window[0]) / this.window[0] <= this.tolerance;
    if (!agrees) this.window = [];
    this.window.push(ratio);
    if (this.window.length >= this.needed) {
      this.locked = true;
      this.value = this.window.reduce((a, b) => a + b, 0) / this.window.length;
      this.window = this.window.slice(-this.needed);
    }
    return this.locked ? this.value : null;
  }

  // Best current guess before lock: mean of the agreeing window once it has
  // at least 2 samples. Used for optimistic zoom on fullscreen entry.
  provisional() {
    if (this.locked) return this.value;
    if (this.window.length < 2) return null;
    return this.window.reduce((a, b) => a + b, 0) / this.window.length;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { computeZoom, scanBars, analyzeFrame, RatioAggregator };
}
