// YT Ultrawide Fill — content script. Pure logic lives in lib.js.

(() => {
  'use strict';

  const TAG = '[YTUW]';
  // Sampling is cheap (~1 ms on a 256px canvas), so burst until the ratio
  // locks, then back off to a slow re-check.
  const BURST_INTERVAL_MS = 300;
  const RECHECK_INTERVAL_MS = 10000;
  const CANVAS_WIDTH = 256;

  // Per-video state, reset on navigation.
  let mode = 'on'; // 'on' (auto-detect) | 'off'
  let aggregator = new RatioAggregator();
  let lockedRatio = null;
  let challenger = new RatioAggregator();
  let sampleTimer = null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  function getVideo() {
    return document.querySelector('video.html5-main-video');
  }

  // ---------- sampling ----------

  function sampleFrame(video) {
    if (video.readyState < 2 || video.paused || !video.videoWidth) return null;
    const w = CANVAS_WIDTH;
    const h = Math.max(2, Math.round((w * video.videoHeight) / video.videoWidth));
    canvas.width = w;
    canvas.height = h;
    try {
      ctx.drawImage(video, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      return analyzeFrame(data, w, h);
    } catch (e) {
      console.debug(TAG, 'frame sample failed:', e.message);
      return null;
    }
  }

  function onSampleTick() {
    const video = getVideo();
    if (!video) return;
    const ratio = sampleFrame(video);
    if (!lockedRatio) {
      const locked = aggregator.push(ratio);
      if (locked) {
        lockedRatio = locked;
        console.info(TAG, 'content aspect locked:', locked.toFixed(3));
        scheduleSampling(RECHECK_INTERVAL_MS);
        updateZoom();
      } else if (document.fullscreenElement) {
        updateZoom(); // apply optimistic zoom as soon as 2 samples agree
      }
    } else {
      // Watch for a mid-video format change.
      const rival = challenger.push(ratio);
      if (rival && Math.abs(rival - lockedRatio) / lockedRatio > 0.03) {
        console.info(TAG, 'content aspect changed:', lockedRatio.toFixed(3), '->', rival.toFixed(3));
        lockedRatio = rival;
        challenger = new RatioAggregator();
        updateZoom();
      }
    }
  }

  function scheduleSampling(interval) {
    clearInterval(sampleTimer);
    sampleTimer = setInterval(onSampleTick, interval);
  }

  // ---------- zoom ----------

  let appliedZoom = 1;

  function updateZoom() {
    const video = getVideo();
    if (!video) return;
    let zoom = 1;
    if (document.fullscreenElement && mode !== 'off' && video.videoWidth) {
      const S = window.innerWidth / window.innerHeight;
      const F = video.videoWidth / video.videoHeight;
      const C = lockedRatio || aggregator.provisional() || null;
      if (C) zoom = computeZoom(S, F, C);
    }
    if (zoom <= 1.02) zoom = 1;
    if (Math.abs(zoom - appliedZoom) < 0.005) return;
    appliedZoom = zoom;
    if (zoom === 1) {
      video.classList.remove('ytuw-zoomed');
      video.style.removeProperty('--ytuw-zoom');
    } else {
      video.style.setProperty('--ytuw-zoom', String(zoom));
      video.classList.add('ytuw-zoomed');
      console.info(TAG, 'zoom applied:', zoom.toFixed(3));
    }
  }

  // ---------- toggle button ----------

  const MODE_LABEL = {
    on: 'Ultrawide fill: on (Shift+Z)',
    off: 'Ultrawide fill: off (Shift+Z)',
  };

  function toggleMode() {
    mode = mode === 'off' ? 'on' : 'off';
    console.info(TAG, 'mode:', mode);
    updateButton();
    updateZoom();
  }

  function updateButton() {
    const btn = document.querySelector('.ytuw-button');
    if (!btn) return;
    btn.title = MODE_LABEL[mode];
    btn.dataset.ytuwMode = mode;
  }

  function ensureButton() {
    if (document.querySelector('.ytuw-button')) return updateButton();
    const controls = document.querySelector('.ytp-right-controls');
    if (!controls) return;
    const btn = document.createElement('button');
    btn.className = 'ytp-button ytuw-button';
    // YouTube enforces Trusted Types, so no innerHTML — build the SVG via DOM.
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 36 36');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    const el = (tag, attrs) => {
      const node = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
      svg.appendChild(node);
    };
    el('rect', { x: 7, y: 12, width: 22, height: 12, rx: 1.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 2 });
    el('path', { class: 'ytuw-arrows', d: 'M11 18 l3 -2.5 v5 z M25 18 l-3 -2.5 v5 z', fill: 'currentColor' });
    el('line', { class: 'ytuw-slash', x1: 8, y1: 27, x2: 28, y2: 9, stroke: 'currentColor', 'stroke-width': 2 });
    btn.appendChild(svg);
    btn.addEventListener('click', toggleMode);
    controls.prepend(btn);
    updateButton();
  }

  // ---------- wiring ----------

  function resetForNewVideo() {
    mode = 'on';
    lockedRatio = null;
    aggregator = new RatioAggregator();
    challenger = new RatioAggregator();
    const video = getVideo();
    if (video) {
      video.classList.remove('ytuw-zoomed');
      video.style.removeProperty('--ytuw-zoom');
    }
    appliedZoom = 1;
    if (location.pathname === '/watch') {
      scheduleSampling(BURST_INTERVAL_MS);
      ensureButton();
    } else {
      clearInterval(sampleTimer);
    }
    updateButton();
  }

  document.addEventListener('fullscreenchange', () => {
    if (!lockedRatio) onSampleTick(); // grab a fresh sample right away
    updateZoom();
  });
  window.addEventListener('resize', () => {
    if (document.fullscreenElement) updateZoom();
  });
  window.addEventListener('yt-navigate-finish', () => {
    resetForNewVideo();
    // player controls may render late
    setTimeout(ensureButton, 1000);
    setTimeout(ensureButton, 3000);
  });
  document.addEventListener(
    'keydown',
    (e) => {
      if ((e.key !== 'Z' && e.key !== 'z') || !e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (location.pathname !== '/watch') return;
      e.stopPropagation();
      toggleMode();
    },
    true
  );

  console.info(TAG, 'loaded');
  resetForNewVideo();
})();
