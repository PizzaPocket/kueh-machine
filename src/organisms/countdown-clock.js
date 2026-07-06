// Wires the hero countdown's "water clock" viewport: a plain rectangle —
// .countdown-window-bg and .countdown-liquid (the latter masked to a
// bottom-up water level by --liquid-fill — see index.html's inline script
// for that level math and its CSS for the mask-image), both painted with a
// flat CSS background-color (--countdown-bg-color/--countdown-liquid-color,
// defined once, right above .countdown-viewport in index.html) rather than
// any procedural shape — a plain rectangle needs no curve-fitting, so this
// module no longer touches the retro-shape atom at all.
//
// Wrapped in a housing-frame.js chrome rim (src/atoms/housing-frame.js) —
// the same double-ring "stroke" treatment as the "Kueh" wordmark's own rims
// (.chrome-text-rim--themed, src/organisms/chrome-accents.js): a thin inner
// ring plus a thicker outer one 55° offset, both the exact same
// computeConicChromeLayers material (chrome-metal.js) tinted from
// --color-primary-strong (RIM_DARK/RIM_LIGHT below match KUEH_RIM_DARK/
// KUEH_RIM_LIGHT there exactly, for the same "Kueh" look). pointsBuilder:
// buildRectPoints overrides housing-frame.js's own default (a superellipse
// ring, swelled corners to match a retro-rectangle window) with a literal
// 4-corner rectangle, since the window itself now has sharp corners too.
//
// Everything else about the countdown (the digit ticking, the liquid's
// fill percentage, the drip animation) is plain inline script in
// index.html, same as it always has been. What's left for this module to
// wire up: the rim above, the water-level surface band, and the little
// bubble burst that rises from the bottom edge on each drop release
// (src/atoms/liquid-bubbles.js).

import { wrapWithHousingFrame } from '../atoms/housing-frame.js';
import { spawnBubbleBurst } from '../atoms/liquid-bubbles.js';

// Matches KUEH_RIM_DARK/KUEH_RIM_LIGHT (src/organisms/chrome-accents.js)
// exactly — see that file's own comment for why these exact percentages
// (90%/93%, not housing-frame.js's neutral metal-base default) read right
// next to the day's theme color.
const RIM_DARK = 'color-mix(in srgb, var(--color-primary-strong) 90%, black)';
const RIM_LIGHT = 'color-mix(in srgb, var(--color-primary-strong) 93%, white)';

// A literal 4-corner rectangle in local space centered at (0,0) — same
// interface as buildSuperellipsePoints (tokens/superellipse.js), which is
// what buildOutsetFramePath's own `pointsBuilder` option expects, so this
// drops straight in as an override.
function buildRectPoints({ width, height }) {
  const w = width / 2;
  const h = height / 2;
  return [[-w, -h], [w, -h], [w, h], [-w, h]];
}

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

  const parent = viewport.parentNode;
  const nextSibling = viewport.nextSibling;
  const { el: rimWrap } = wrapWithHousingFrame(viewport, {
    darkVar: RIM_DARK,
    lightVar: RIM_LIGHT,
    pointsBuilder: buildRectPoints,
    // Thinner than housing-frame.js's own default (14/7) — that thickness
    // was tuned for a thick decorative housing (the old funnel's outer
    // frame); a plain rectangle window reads better with a rim closer to
    // the wordmark's own stroke weight.
    outsetDesktop: 8,
    outsetMobile: 4,
  });
  parent.insertBefore(rimWrap, nextSibling);
}
