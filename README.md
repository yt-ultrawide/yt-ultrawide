# YT Ultrawide Fill

Browser extension (Chrome & Safari) that detects ultrawide (~21:9) YouTube videos — including
ones letterboxed inside a 16:9 upload — and, in fullscreen, zooms the video so
the picture fills your screen without cropping any real content.

It measures the actual content aspect ratio (by scanning frames for baked-in
black bars) against your current screen's aspect ratio, so:

- On an ultrawide (21:9) monitor, letterboxed videos fill the width.
- On a 16:9 monitor, nothing changes — the math yields zoom 1.
- Plain 16:9 videos are never cropped, on any screen.

## Install (Chrome, unpacked)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select the **`extension/`** folder.

For Safari, run `npm run build:safari` and open the generated Xcode project
(see *Development* below).

## Use

Fully automatic in fullscreen. A button in the player's right-side controls
(and `Shift+Z`) toggles it per video:

- **on** (default) — zoom to fill when letterboxing is detected
- **off** — never zoom this video

The toggle resets when you navigate to another video.

## How detection works

Frames are drawn to a small offscreen canvas and scanned for symmetric
near-black bars (top/bottom and left/right). Sampling bursts every 300 ms
until five agreeing samples lock the content ratio (typically ~1.5 s), then
backs off to a slow re-check for mid-video format changes. Entering
fullscreen before lock applies an optimistic zoom as soon as two samples
agree, refined when the lock lands. Dark scenes, fades, and implausible
ratios are rejected — the failure mode is always "no zoom".

## Development

### Layout

- **`extension/`** — the shared WebExtension (`manifest.json`, `lib.js`,
  `content.js`, `content.css`, `icons/`). This is the only runtime code, and
  it is identical for Chrome and Safari.
- **`branding/`** — distribution assets shared by both stores (logo source,
  store listing copy, screenshots). `scripts/make-icons.py` regenerates
  `extension/icons/` from `branding/logo-source.png`.
- **`docs/`** — the hosted privacy policy (served by GitHub Pages).
- **`test/`** — Node unit tests for the pure logic.

### Build

Pure logic (bar scanning, zoom math, sample aggregation) lives in
`extension/lib.js` and is unit-tested under Node:

```
npm test
```

`extension/content.js` wires it to the YouTube player; `extension/content.css`
styles the zoom transition and toggle button. Build outputs (git-ignored) land
in `dist/`:

- `npm run build:chrome` — zip `extension/` into a Chrome Web Store package.
- `npm run build:safari` — wrap `extension/` into a Safari Web Extension
  Xcode project (needs the full Xcode app on macOS).
