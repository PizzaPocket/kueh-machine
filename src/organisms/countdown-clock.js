// Wires the hero countdown's "water clock" viewport: a plain
// retro-rectangle window (buildSuperellipsePath, tokens/superellipse.js —
// updateRetroShape's own default, so it's not even passed explicitly below)
// built from two stacked flat-fill layers — .countdown-window-bg and
// .countdown-liquid (the latter masked to a bottom-up water level by
// --liquid-fill — see index.html's inline script for that level math and
// its CSS for the mask-image). Their actual colors come from
// --countdown-bg-color/--countdown-liquid-color (defined once, right above
// .countdown-viewport in index.html) rather than hardcoded here, so
// retuning either is a one-line edit in that one place. Both layers use
// createRetroShape's `fill` mode with `shadow: false` — no inner-shadow
// filter (unlike the Kueh of Day windows' own recipe, which does carry
// one) — computed independently but from identical inputs, so their
// silhouettes always align pixel-for-pixel.
//
// Everything else about the countdown (the digit ticking, the liquid's
// fill percentage, the drip animation) is plain inline script in
// index.html, same as it always has been — only the shape
// needed this module, to reuse the existing atoms rather than
// reimplementing them. One exception: the little bubble burst that rises
// from the bottom edge on each drop release (src/atoms/liquid-bubbles.js) is
// wired up here instead, since it's a new decorated reaction rather than
// existing inline logic, and this module already holds the `liquid`
// element reference it needs.

import { createRetroShape, updateRetroShape } from '../atoms/retro-shape.js';
import { spawnBubbleBurst } from '../atoms/liquid-bubbles.js';

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

  // Wraps .countdown-liquid solely to host a drop-shadow filter, projected
  // upward (negative y offset) onto .countdown-window-bg behind it. filter
  // and mask don't compose on the *same* element the way you'd expect —
  // filter reads the element's content before its own mask crops it, so
  // the shadow would follow the liquid's full unmasked shape rather
  // than whatever's currently visible. On a parent instead, the filter's
  // source image is .countdown-liquid's own already-masked render, so the
  // cast shadow correctly tracks the live water line as it drains.
  const shadowWrap = document.createElement('div');
  shadowWrap.className = 'countdown-liquid-shadow-wrap';
  liquid.parentNode.insertBefore(shadowWrap, liquid);
  shadowWrap.appendChild(liquid);

  const liquidRefs = createRetroShape({ fill: 'var(--countdown-liquid-color)', shadow: false });
  liquid.appendChild(liquidRefs.svg);

  // A thin darker band right at the current water level — pure CSS
  // (styles/organisms/... inline in index.html, .countdown-liquid-surface),
  // reading the exact same --liquid-fill custom property the mask itself
  // reveals to, so it tracks the surface (including rippleLiquid's own
  // wobble) with no extra per-frame JS. clip-path reuses liquidRefs' own
  // clipUrl — the same silhouette the fill SVG is shaped to — so the
  // band doesn't spill past the rounded corners when the level sits near
  // the very top of the shape (true for most of the countdown, since
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
  // built against the fallback font's metrics. Same race drop-chute.js's
  // own spout position already has to correct for (see its own comment)
  // — re-running the shape update once fonts are confirmed settled closes
  // it here too, rather than leaving the window/liquid silhouette sized
  // to whatever width the fallback font happened to produce. A no-op if
  // the ResizeObserver above already caught the resulting reflow and
  // repainted correctly on its own.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      updateRetroShape(windowBg, bgRefs, SHAPE_OPTS);
      updateRetroShape(liquid, liquidRefs, SHAPE_OPTS);
    });
  }
}
