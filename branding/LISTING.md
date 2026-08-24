# Chrome Web Store listing — YT Ultrawide Fill

Copy/paste source for the Web Store dashboard. Keep this in sync with `manifest.json`.

---

## Basics

- **Name:** YT Ultrawide Fill
- **Category:** Productivity
- **Language:** English (United States)
- **Homepage URL:** https://github.com/yt-ultrawide/yt-ultrawide
- **Support email / URL:** ytultrawide@gmail.com (or the repo's Issues page)

## Short description (max 132 characters)

> For 21:9/32:9 monitors: fills your ultrawide screen with letterboxed YouTube video in fullscreen. No effect on 16:9.

<!-- 116 characters -->

## Detailed description

```
Watch ultrawide videos the way they were meant to be seen.

REQUIRES AN ULTRAWIDE DISPLAY (21:9 or 32:9)
This extension zooms letterboxed video to fill your screen's extra width. A
standard 16:9 or 16:10 display has no extra width to fill, so on those screens
it intentionally does nothing at all. The toggle will tell you so on screen.

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
• The zoom is a uniform scale, so the image is never distorted, and real
  picture is never cropped — if filling the screen would cut into the
  image, it leaves the video alone instead.

CONTROLS
• A toggle button in the player's control bar (and the Shift+Z shortcut)
  switches Ultrawide Fill On or Off for the current video.
• "On" (the default) auto-detects and fills; "Off" leaves the video alone.
• Each toggle shows a brief on-screen message confirming what happened —
  including when no zoom applies, and why.
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

- **Privacy policy URL:** https://yt-ultrawide.github.io/yt-ultrawide/privacy-policy.html
  (served by GitHub Pages from `docs/` on the public repo)

## Notes for reviewers (paste into the submission's reviewer-notes field)

```
IMPORTANT: this extension is a deliberate no-op on a 16:9 display.

It removes the black bars from letterboxed ultrawide video by zooming it to
fill the extra width of a 21:9 / 32:9 monitor. A 16:9 screen has no extra
width, and zooming further would crop real picture — which this extension
never does — so on 16:9 it correctly does nothing to the video.

A previous submission was rejected as "non functional" for this reason.

HOW TO VERIFY WITHOUT AN ULTRAWIDE MONITOR
1. Open https://www.youtube.com/watch?v=aOY7HTQlsSo
   (2.37:1 picture letterboxed inside a 16:9 upload)
2. Open DevTools > toggle Device Toolbar > Responsive > set 3440 x 1440.
3. Play the video and enter fullscreen.
4. The black bars disappear as the picture fills the width.
   Console logs: [YTUW] content aspect locked: 2.370
                 [YTUW] zoom applied: 1.333

Repeat step 2 with 1920 x 1080 and no zoom is applied - correct behaviour,
because filling a 16:9 screen with a 2.37:1 picture would crop it.

THE TOGGLE BUTTON
The button sits in the player control bar, immediately left of the
theater-mode button (48x40, same size as the native controls); Shift+Z is
the shortcut. Clicking it always raises an on-screen message confirming the
new state, including on 16:9 where the video itself does not change.
```

## Screenshots (need 1–5; 1280×800 or 640×400)

Capture on an ultrawide display, in fullscreen, on a genuinely 21:9 video:

1. **Before / Off** — letterboxed video with black bars on an ultrawide screen.
   ✔ `screenshots/screenshot-1-letterboxed.png` (3440×1440 original) →
   upload `screenshots/cws-1280x800-1-letterboxed.png`
2. **After / On** — same frame filling the screen edge to edge.
   ✔ `screenshots/screenshot-2-filled.png` → upload `screenshots/cws-1280x800-2-filled.png`
3. The toggle button + control (optional close-up of the player bar). _(todo)_

Tip: pick a scene with detail near the top/bottom edges so the "no cropping"
point is obvious.

## Promo tile (optional but recommended)

- Small tile: 440×280 PNG — the logo on the dark gradient works well.
