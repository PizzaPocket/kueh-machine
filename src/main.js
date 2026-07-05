// Entry point for the root site's component system. `src/`, `styles/`,
// `images/`, and `wip/` are root-site-owned infrastructure — contributor
// projects live in their own separate, self-contained folders and don't
// touch any of this.
//
// Kept intentionally thin: each organism owns its own init(), this file
// just imports and calls them. Adding the next feature later means adding
// one import and one call here, not new logic in this file.

import { init as initKuehOfDay } from './organisms/kueh-of-day.js';
import { init as initSiteNav } from './organisms/site-nav.js';
import { init as initChromeAccents } from './organisms/chrome-accents.js';
import { init as initBatikAccents } from './organisms/batik-accents.js';
import { init as initCountdownClock } from './organisms/countdown-clock.js';
import { init as initTimelinePanel } from './organisms/timeline-panel.js';
import { init as initDropChute } from './organisms/drop-chute.js';

initKuehOfDay();
initSiteNav();
initChromeAccents();
initBatikAccents();
initCountdownClock();
initTimelinePanel();
// After initTimelinePanel — measures .tl-spring-track's own live position
// as one of its two anchor points, so the panel's rig has to exist first.
initDropChute();
