// Organism: applies the "liquid chrome" treatment (src/tokens/chrome-metal.js)
// to the static decorative elements that aren't owned by another organism —
// the "Machine" wordmark and the guide section's step-cards — plus a single
// blanket sweep that wires up every .text-sheen/.icon-sheen element on the
// page (however it got rendered — static HTML, or dynamic markup from
// another organism/molecule/atom) for the cursor-Y-tracking light accent.
// Centralizing that sweep here, run last (see main.js), means individual
// atoms/organisms that use .text-sheen/.icon-sheen don't each need their own
// registration call and can't accidentally double-register the same
// element. .kod-card-rim/.tab-group-rim are handled inside
// kueh-of-day.js/tab-group.js, the site-nav divider inside site-nav.js,
// since those two are real conic-chrome rims, not the sheen accent.

import { applyConicChrome, applyLayeredConicChrome, registerForSheen, applyIconFillSheen } from '../tokens/chrome-metal.js';

export function init() {
  // interactive: false — the rim sits pixel-aligned behind a separate
  // solid-color fill layer (see .chrome-text-fill in index.html); rotating
  // it would visibly drift apart from the fill instead of reading as a
  // reflection.
  applyConicChrome(document.querySelector('.chrome-text-rim'), { interactive: false, fixedAngle: 200 });

  // Each step-card gets its own independently-randomized glints (real
  // per-element randomness, not a shared pattern trying to fake 8 rows
  // looking distinct). .step-card is the outer metal band; its original
  // children (heading, body, icon — see index.html) move into a new
  // .step-card-fill div, which applyLayeredConicChrome nests inside the
  // auto-inserted .chrome-rim-glint band — same three-element pattern as
  // .kod-card-rim/.tab-group-rim now use, just built here since step-cards
  // are static HTML rather than JS-rendered content.
  document.querySelectorAll('.step-card').forEach((card) => {
    const fill = document.createElement('div');
    fill.className = 'step-card-fill';
    while (card.firstChild) fill.appendChild(card.firstChild);
    applyLayeredConicChrome(card, fill, { peaks: [60, 180, 300] });
  });

  document.querySelectorAll('.text-sheen').forEach((el) => registerForSheen(el));
  document.querySelectorAll('.icon-sheen').forEach((el) => applyIconFillSheen(el));
}
