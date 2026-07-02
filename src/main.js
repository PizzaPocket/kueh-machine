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

initKuehOfDay();
initSiteNav();
