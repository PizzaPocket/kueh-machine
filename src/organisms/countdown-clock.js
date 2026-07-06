// Wires the hero countdown's "water clock" viewport: a plain rectangle —
// .countdown-window-bg and .countdown-liquid (the latter masked to a
// bottom-up water level by --liquid-fill — see index.html's inline script
// for that level math and its CSS for the mask-image), both painted with a
// flat CSS background-color (--countdown-bg-color/--countdown-liquid-color,
// defined once, right above .countdown-viewport in index.html) rather than
// any procedural shape — a plain rectangle needs no curve-fitting, so this
// module no longer touches the retro-shape atom at all.
//
// Everything else about the countdown (the digit ticking, the liquid's
// fill percentage, the drip animation) is plain inline script in
// index.html, same as it always has been. What's left for this module to
// wire up: the water-level surface band and the little bubble burst that
// rises from the bottom edge on each drop release
// (src/atoms/liquid-bubbles.js).

import { spawnBubbleBurst } from '../atoms/liquid-bubbles.js';

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
}
