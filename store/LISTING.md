# Chrome Web Store listing — YT Ultrawide Fill

Copy/paste source for the Web Store dashboard. Keep this in sync with `manifest.json`.

---

## Basics

- **Name:** YT Ultrawide Fill
- **Category:** Productivity
- **Language:** English (United States)

## Short description (max 132 characters)

> Auto-zooms letterboxed 21:9 YouTube videos to fill your ultrawide screen in fullscreen — without cropping real content.

<!-- 121 characters -->

## Detailed description

```
Watch ultrawide videos the way they were meant to be seen.

Some YouTube videos are shot in 21:9 (cinematic ultrawide) but uploaded
inside a 16:9 frame, so they arrive with black bars baked into the picture.
On a 21:9 monitor that means bars on all four sides and a tiny image.

YT Ultrawide Fill fixes that automatically. In fullscreen, it measures the
real content aspect ratio of the video and zooms it so the picture fills the
width of your ultrawide display — with no stretching and no cropping of
actual content.

HOW IT WORKS
• Detects black bars by sampling video frames, then compares the true
  content ratio to your screen's ratio.
• Zooms only when it helps: letterboxed 21:9 content fills the screen,
  while genuine 16:9 videos are left untouched.
• On a standard 16:9 monitor it does nothing — there's no extra width to
  fill, so nothing ever changes.
• The zoom is a uniform scale, so the image is never distorted.

CONTROLS
• A toggle button in the player's control bar (and the Shift+Z shortcut)
  switches Ultrawide Fill On or Off for the current video.
• "On" (the default) auto-detects and fills; "Off" leaves the video alone.
• The setting resets when you move to another video.

PRIVACY
• No accounts, no tracking, no data collection.
• Everything runs locally in your browser. Nothing is ever sent anywhere.
• Works only on youtube.com and requests no other access.

Made for ultrawide (21:9 / 32:9) monitor owners who are tired of tiny
letterboxed videos.
```

## Single purpose (Privacy tab)

> This extension has a single purpose: to detect letterboxed ultrawide (21:9)
> YouTube videos and, in fullscreen, zoom them to fill an ultrawide display
> without cropping content.

## Permission justifications (Privacy tab)

The extension declares **no** `permissions` and **no** `host_permissions`.
Its only host access comes from a single content script:

- **Host access — `*://www.youtube.com/*` (content script):**
  Required to add the toggle button to the YouTube player, read the video
  frame via an in-page canvas to measure its aspect ratio, and apply a CSS
  zoom to the video element. Access is limited to youtube.com and is used
  solely for this feature.

- **Remote code:** None. All logic ships inside the extension package.

## Data usage disclosures (Privacy tab)

Check **"I do not collect or use user data."** The extension:

- does not collect, store, or transmit any user or usage data;
- makes no network requests;
- uses no analytics or third-party services.

- **Privacy policy URL:** _(see `store/privacy-policy.html` — host it and paste the URL here)_

## Screenshots (need 1–5; 1280×800 or 640×400)

Capture on an ultrawide display, in fullscreen, on a genuinely 21:9 video:

1. **Before / Off** — letterboxed video with black bars on an ultrawide screen.
2. **After / On** — same frame filling the screen edge to edge.
3. The toggle button + control (optional close-up of the player bar).

Tip: pick a scene with detail near the top/bottom edges so the "no cropping"
point is obvious.

## Promo tile (optional but recommended)

- Small tile: 440×280 PNG — the logo on the dark gradient works well.
