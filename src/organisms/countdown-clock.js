// Wires the hero countdown's "water clock" viewport: a plain rectangle —
// .countdown-window-bg and .countdown-liquid (the latter masked to a
// bottom-up water level by --liquid-fill — see index.html's inline script
// for that level math and its CSS for the mask-image), both painted with a
// flat CSS background-color (--countdown-bg-color/--countdown-liquid-color,
// defined once, right above .countdown-viewport in index.html) rather than
// any procedural shape — a plain rectangle needs no curve-fitting, so this
// module no longer touches the retro-shape atom at all.
//
// Outlined with a single chrome stroke, the same material and tint as the
// "Kueh" wordmark's own rims (.chrome-text-rim--themed,
// src/organisms/chrome-accents.js) — computeConicChromeLayers
// (src/tokens/chrome-metal.js) called directly with the same RIM_DARK/
// RIM_LIGHT tint and peaks, its `metal` string set straight onto
// .countdown-viewport's own border-image. A real CSS border, not a
// wrapWithHousingFrame wrapper div — that atom's ring exists to combine a
// noise-grain texture *and* an optional second offset ring on top of the
// conic-gradient (neither of which this window wants: one flat stroke, no
// grain), and border-image only ever needs the one gradient image, so the
// plain border property does the whole job with no extra DOM, no
// clip-path, and no ResizeObserver — the browser repaints a border-image
// on resize for free, unlike a clip-path'd ring sized in JS.
//
// Everything else about the countdown (the digit ticking, the liquid's
// fill percentage, the drip animation) is plain inline script in
// index.html, same as it always has been. What's left for this module to
// wire up: the rim above, the water-level surface band, and the little
// bubble burst that rises from the bottom edge on each drop release
// (src/atoms/liquid-bubbles.js).

import { computeConicChromeLayers } from '../tokens/chrome-metal.js';
import { spawnBubbleBurst } from '../atoms/liquid-bubbles.js';

// Matches KUEH_RIM_DARK/KUEH_RIM_LIGHT and WORDMARK_RIM_PEAKS
// (src/organisms/chrome-accents.js) exactly — see that file's own comment
// for why these exact percentages (90%/93%, not computeConicChromeLayers'
// neutral metal-base default) read right next to the day's theme color.
const RIM_DARK = 'color-mix(in srgb, var(--color-primary-strong) 90%, black)';
const RIM_LIGHT = 'color-mix(in srgb, var(--color-primary-strong) 93%, white)';
const RIM_PEAKS = [40, 165, 250];

export function init() {
  const viewport = document.querySelector('.countdown-viewport');
  const liquid = document.querySelector('.countdown-liquid');
  if (!viewport || !liquid) return;

  // A thin darker band right at the current water level — pure CSS
  // (styles/organisms/... inline in index.html, .countdown-liquid-surface),
  // reading the exact same --liquid-fill custom property the mask itself
  // reveals to, so it tracks the surface (including rippleLiquid's own
  // wobble) with no extra per-frame JS.
  const surface = document.createElement('div');
  surface.className = 'countdown-liquid-surface';
  liquid.appendChild(surface);

  // 'chute:ball-released' (index.html's updateDrop, dispatched the instant
  // a drop detaches from the bottom edge) only ever fires when motion is
  // allowed — updateDrop early-returns on prefers-reduced-motion before
  // reaching that dispatch — so no separate check is needed here, same as
  // drop-chute.js's own listener for this event.
  window.addEventListener('chute:ball-released', () => spawnBubbleBurst(liquid));

  // border/border-width live in CSS (index.html, breakpoint-tiered same as
  // every other measurement on this page) — only the gradient image itself
  // needs JS. `1` is border-image-slice: a bare `1` (not a pixel/percent
  // unit) is the standard "just wrap this generated gradient around the
  // border area" idiom for a CSS-image source with no intrinsic size,
  // same as any other gradient-border trick.
  const { metal } = computeConicChromeLayers(RIM_PEAKS, { darkVar: RIM_DARK, lightVar: RIM_LIGHT });
  viewport.style.borderImage = `${metal} 1`;
}
