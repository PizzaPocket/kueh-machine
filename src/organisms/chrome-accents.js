// Organism: applies the "liquid chrome" tile scale (src/tokens/chrome-scale.js)
// to the static decorative elements that aren't owned by another organism —
// the "Machine" wordmark and the guide section's step-cards. .kod-card/
// .tab-group are handled inside kueh-of-day.js, .site-nav inside
// site-nav.js, since those elements are that organism's own concern.

import { applyChromeScale } from '../tokens/chrome-scale.js';

export function init() {
  applyChromeScale(document.querySelector('.chrome-text'), 2.5);

  // Well under 1 repeat — this is a repeated-8-times list, not a singular
  // showcase element, so each row should show only a fragment of the
  // sweep. See the .step-card comment in index.html for why.
  document.querySelectorAll('.step-card').forEach((card) => {
    applyChromeScale(card, 0.4);
  });
}
