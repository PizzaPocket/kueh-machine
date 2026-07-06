// Wires the hero countdown's "water clock" viewport: a retro-rectangle
// window (buildSuperellipsePath, tokens/superellipse.js — updateRetroShape's
// own default) built from two stacked fill layers — .countdown-window-bg
// and .countdown-liquid (the latter masked to a bottom-up water level by
// --liquid-fill — see index.html's inline script for that level math and
// its CSS for the mask-image). Their actual colors come from
// --countdown-bg-color/--countdown-liquid-color (defined once, right above
// .countdown-viewport in index.html) rather than hardcoded here. Both layers
// use createRetroShape's `fill` mode with `shadow: false` — no inner-shadow
// filter (unlike the Kueh of Day windows' own recipe) — computed
// independently but from identical inputs, so their silhouettes always
// align pixel-for-pixel.
//
// EXPERIMENTAL: the window used to be a plain rectangle (flat CSS
// background-color, no SVG/shape at all) — this swelled-corner shape is a
// one-off visual test, reinstating retro-shape.js. The chrome border-image
// rim below is still a literal sharp-cornered rectangle (border can't
// follow a curved silhouette without going back to a clip-path'd ring), so
// expect the fill's rounded corners to visibly peek past the border's own
// square ones at each corner — that mismatch is the main thing to eyeball
// before deciding whether to keep this.
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

import { createRetroShape, updateRetroShape } from '../atoms/retro-shape.js';
import { computeConicChromeLayers } from '../tokens/chrome-metal.js';
import { spawnBubbleBurst } from '../atoms/liquid-bubbles.js';

// Matches KUEH_RIM_DARK/KUEH_RIM_LIGHT and WORDMARK_RIM_PEAKS
// (src/organisms/chrome-accents.js) exactly — see that file's own comment
// for why these exact percentages (90%/93%, not computeConicChromeLayers'
// neutral metal-base default) read right next to the day's theme color.
const RIM_DARK = 'color-mix(in srgb, var(--color-primary-strong) 90%, black)';
const RIM_LIGHT = 'color-mix(in srgb, var(--color-primary-strong) 93%, white)';
const RIM_PEAKS = [40, 165, 250];

// gutter: 0 — .countdown-viewport's own padding already reserves room for
// the digit stack, so the shape should fill its full padded box rather
// than inset further.
//
// n: 10 (fixed, not auto-solved) — windowBg/liquid are plain inset:0
// overlays with no padding of their own (the digit stack's clearance is
// .countdown-viewport's padding, one level up), so solveClearingExponent's
// content-clearance solve has nothing real to measure against here and
// would just walk n up to its own ceiling — same reasoning
// SMALL_RETRO_SHAPE_OPTS (retro-shape.js) already documents for small,
// already-padded controls. Both the window's own bg and liquid shapes
// share this exact options object, so both silhouettes stay identical.
const SHAPE_OPTS = { gutter: 0, n: 10 };

export function init() {
  const viewport = document.querySelector('.countdown-viewport');
  const windowBg = document.querySelector('.countdown-window-bg');
  const liquid = document.querySelector('.countdown-liquid');
  if (!viewport || !windowBg || !liquid) return;

  const bgRefs = createRetroShape({ fill: 'var(--countdown-bg-color)', shadow: false });
  windowBg.appendChild(bgRefs.svg);

  const liquidRefs = createRetroShape({ fill: 'var(--countdown-liquid-color)', shadow: false });
  liquid.appendChild(liquidRefs.svg);

  // A thin darker band right at the current water level — pure CSS
  // (styles/organisms/... inline in index.html, .countdown-liquid-surface),
  // reading the exact same --liquid-fill custom property the mask itself
  // reveals to, so it tracks the surface (including rippleLiquid's own
  // wobble) with no extra per-frame JS. clip-path reuses liquidRefs' own
  // clipUrl — the same silhouette the fill SVG is shaped to — so the band
  // doesn't spill past the rounded corners when the level sits near the
  // very top of the shape (true for most of the countdown, since
  // remainingPct starts near 100%).
  const surface = document.createElement('div');
  surface.className = 'countdown-liquid-surface';
  surface.style.clipPath = liquidRefs.clipUrl;
  liquid.appendChild(surface);

  // 'chute:ball-released' (index.html's updateDrop, dispatched the instant
  // a drop detaches from the bottom edge) only ever fires when motion is
  // allowed — updateDrop early-returns on prefers-reduced-motion before
  // reaching that dispatch — so no separate check is needed here, same as
  // drop-chute.js's own listener for this event.
  window.addEventListener('chute:ball-released', () => spawnBubbleBurst(liquid));

  new ResizeObserver(() => {
    updateRetroShape(windowBg, bgRefs, SHAPE_OPTS);
    updateRetroShape(liquid, liquidRefs, SHAPE_OPTS);
  }).observe(viewport);

  // The page loads a Google Font (--font-display: "Syne") with
  // display=swap — text first renders in the fallback font, then reflows
  // once Syne downloads, which can change .countdown-grid's own width
  // (min-width: 2.2ch is font-relative) after this shape has already been
  // built against the fallback font's metrics. Re-running the shape update
  // once fonts are confirmed settled closes that race. A no-op if the
  // ResizeObserver above already caught the resulting reflow.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      updateRetroShape(windowBg, bgRefs, SHAPE_OPTS);
      updateRetroShape(liquid, liquidRefs, SHAPE_OPTS);
    });
  }

  // border/border-width live in CSS (index.html, breakpoint-tiered same as
  // every other measurement on this page) — only the gradient image itself
  // needs JS. `1` is border-image-slice: a bare `1` (not a pixel/percent
  // unit) is the standard "just wrap this generated gradient around the
  // border area" idiom for a CSS-image source with no intrinsic size,
  // same as any other gradient-border trick.
  const { metal } = computeConicChromeLayers(RIM_PEAKS, { darkVar: RIM_DARK, lightVar: RIM_LIGHT });
  viewport.style.borderImage = `${metal} 1`;
}
