# YT Ultrawide Fill

Chrome extension that detects ultrawide (~21:9) YouTube videos — including
ones letterboxed inside a 16:9 upload — and, in fullscreen, zooms the video so
the picture fills your screen without cropping any real content.

It measures the actual content aspect ratio (by scanning frames for baked-in
black bars) against your current screen's aspect ratio, so:

- On an ultrawide (21:9) monitor, letterboxed videos fill the width.
- On a 16:9 monitor, nothing changes — the math yields zoom 1.
- Plain 16:9 videos are never cropped, on any screen.

## Install

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this folder.

## Use

Fully automatic in fullscreen. A button in the player's right-side controls
(and `Shift+Z`) cycles the mode per video:

- **auto** (default) — zoom when letterboxing is detected
- **off** — never zoom this video
- **on** — force zoom (assumes 21:9 if nothing detected yet)

The mode resets when you navigate to another video.

## How detection works

Frames are drawn to a small offscreen canvas and scanned for symmetric
near-black bars (top/bottom and left/right). Sampling bursts every 300 ms
until five agreeing samples lock the content ratio (typically ~1.5 s), then
backs off to a slow re-check for mid-video format changes. Entering
fullscreen before lock applies an optimistic zoom as soon as two samples
agree, refined when the lock lands. Dark scenes, fades, and implausible
ratios are rejected — the failure mode is always "no zoom".

## Development

Pure logic (bar scanning, zoom math, sample aggregation) lives in `lib.js`
and is unit-tested under Node:

```
npm test
```

`content.js` wires it to the YouTube player; `content.css` styles the zoom
transition and toggle button.
