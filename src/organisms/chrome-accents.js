// Organism: applies the "liquid chrome" treatment (src/tokens/chrome-metal.js)
// to the static decorative elements that aren't owned by another organism —
// the "Machine" wordmark and the guide section's step-cards. .kod-card-rim/
// .tab-group-rim are handled inside kueh-of-day.js/tab-group.js, the
// site-nav divider inside site-nav.js, since those elements are each
// organism/molecule's own concern.

import { applyConicChrome, computeConicChromeLayers, registerForRotation } from '../tokens/chrome-metal.js';

export function init() {
  // interactive: false — the rim sits pixel-aligned behind a separate
  // solid-color fill layer (see .chrome-text-fill in index.html); rotating
  // it would visibly drift apart from the fill instead of reading as a
  // reflection.
  applyConicChrome(document.querySelector('.chrome-text-rim'), { interactive: false, fixedAngle: 200 });

  // Each step-card still uses the padding-box/border-box dual-layer trick
  // (see index.html's per-nth-child rules) to keep its own fill color, so
  // the chrome layers need explicit `border-box` tags baked into the
  // property value itself — background's default per-layer box would
  // otherwise leave the glints layer on padding-box instead. That also
  // means this can't go through applyConicChrome (which sets
  // backgroundImage/a plain property directly), so it has to register
  // itself for the cursor/scroll rotation too, not get it for free.
  document.querySelectorAll('.step-card').forEach((card) => {
    const { metal, glints } = computeConicChromeLayers([60, 180, 300]);
    card.style.setProperty('--step-chrome-bg', `${glints} border-box, ${metal} border-box`);
    registerForRotation(card);
  });
}
