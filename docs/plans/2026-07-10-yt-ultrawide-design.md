# YT Ultrawide — design

Chrome extension (MV3) that detects the true content aspect ratio of a YouTube
video — including 21:9 pictures letterboxed inside 16:9 uploads — and, in
fullscreen, zooms the video so the content fills the current screen without
cropping any real picture. On a 16:9 monitor the math yields no zoom; on an
ultrawide it fills the width. Test video: `youtube.com/watch?v=aOY7HTQlsSo`.

## Architecture

One content script on `youtube.com/watch*`. No background logic, popup, or
options page. SPA navigation handled via `yt-navigate-finish`.

Modules in `content.js`:

1. **Bar detector** — draws frames onto a 256px-wide offscreen canvas
   (YouTube uses same-origin MSE blob URLs, so `getImageData` works) and scans
   rows/columns for near-black bars. Output: content aspect ratio.
2. **Zoom controller** — on `fullscreenchange`, detector updates, and
   `resize`, computes and applies `transform: scale()` to the `<video>`.
3. **Player button** — toggle in `.ytp-right-controls` cycling
   auto → off → on, per video. Keyboard shortcut `Shift+Z`.

## Bar detection

- Sampling is cheap (~1 ms), so burst every 300 ms until 5 samples agree
  (within 2 % tolerance) — lock typically lands in ~1.5 s; sliding window if
  they disagree so the dominant ratio wins. After lock, re-check every 10 s
  for mid-video format changes. Entering fullscreen before lock takes an
  immediate sample and applies an optimistic zoom from 2 agreeing samples
  (`RatioAggregator.provisional()`), refined when the lock lands.
- A sample: draw to 256-wide canvas; a row is "bar" if ≥98 % of pixels have
  luminance < ~16/255. Top/bottom bar heights must be roughly symmetric
  (else it's a dark scene, not letterboxing). Columns scanned the same way
  for pillarboxing. Content aspect = frameW / (frameH − bars).
- Skip samples that are nearly all black (fades) or while paused.
- Accept only ratios in [16:9, 2.76:1]; anything else → treat as 16:9.
- Any failure (tainted canvas, DRM black frames) → no zoom. Default is
  always "no zoom": the extension can only improve things.
- Truly 21:9 streams (no baked bars) need no pixel crop; the same zoom math
  covers scaling them on a 21:9 screen.

## Zoom math

With `S` = screen aspect, `F` = frame (stream) aspect, `C` = detected content
aspect: fullscreen fits the frame to the screen (width-bound if `F > S`).
Scale content until its width = screen width or height = screen height,
whichever comes first. Width-bound: `zoom = min(C, S) / min(F, S)`; mirrored
form when height-bound. Apply nothing if `zoom ≤ 1.02`.

Applied as `transform: scale(zoom)`, `transform-origin: center`, ~300 ms ease
transition. Fullscreen container clips overflow. Exiting fullscreen removes
the transform.

## Toggle

Button states per video: **auto** (default) → **off** → **on** (forced; uses
detected ratio, else assumes 21:9). Resets on navigation.

## Files

`manifest.json`, `content.js`, `content.css`, `icons/`. Pure functions
(row/column scan over pixel data, zoom math) live in a form unit-testable
under Node (`test/`).

## Testing

- Unit tests (Node) for bar-scan and zoom math: synthetic pixel buffers with
  known bars; zoom cases for 16:9/21:9/32:9 screens × 16:9/2.39 content.
- Live test: load unpacked, open test video, verify detection via console
  logs and the applied transform; simulate both screen ratios numerically.
