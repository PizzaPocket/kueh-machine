// Entry point for the root site's component system. `src/`, `styles/`,
// `images/`, and `wip/` are root-site-owned infrastructure — contributor
// projects live in their own separate, self-contained folders and don't
// touch any of this.
//
// Kept intentionally thin: each organism owns its own init(), this file
// just imports and calls them. Adding the next feature later means adding
// one import and one call here, not new logic in this file.

import { init as initDebugDate } from './dev/debug-date.js';
import { init as initIcons } from './organisms/icons.js';
import { init as initKuehOfDay } from './organisms/kueh-of-day.js';
import { init as initSiteNav } from './organisms/site-nav.js';
import { init as initChromeAccents } from './organisms/chrome-accents.js';
import { init as initBatikAccents } from './organisms/batik-accents.js';
import { init as initCountdownClock } from './organisms/countdown-clock.js';
import { init as initCheckIn } from './organisms/check-in.js';
import { init as initTimelinePanel } from './organisms/timeline-panel.js';
import { init as initScissorsCut } from './organisms/scissors-cut.js';
import { init as initDropChute } from './organisms/drop-chute.js';
import { init as initCheckinArchive } from './organisms/checkin-archive.js';
import { init as initRandomiser } from './organisms/randomiser.js';

// First — a no-op unless the URL has ?debug=1, but when it does apply a
// Date.now() override, every other organism below reads "now" via
// Date.now() at its own init time, so this has to run before all of them.
initDebugDate();
// Runs once, scanning the whole document for data-lucide placeholders —
// no ordering dependency on anything else, but placed early so any
// organism below that builds its own data-lucide markup dynamically
// would need its own explicit re-run (none currently do; static HTML
// placeholders, index.html, are all createIcons needs to find).
initIcons();
initKuehOfDay();
initSiteNav();
initChromeAccents();
initBatikAccents();
initCountdownClock();
// Before initScissorsCut — that module measures .check-in-collapse's real
// content height the first time it's revealed, so the row list has to
// already exist by then.
initCheckIn();
initTimelinePanel();
// After initTimelinePanel — queries .tl-day-chip/.tl-dial-meeting-mid,
// which timeline-panel.js's own init() has to have built first.
initScissorsCut();
// After initTimelinePanel — measures .tl-spring-track's own live position
// as one of its two anchor points, so the panel's rig has to exist first.
initDropChute();
// Independent of everything above — just its own aria-hidden toggle on
// #randomiser, gated on the same CHECKIN_UTC deadline as scissors-cut.js.
// Before initCheckinArchive — see that call's own comment on why it needs
// to run last, after #randomiser exists, not before.
initRandomiser();
// Last — a pure CSS-class toggle (.is-archived/.scissors-archived), so it
// has no ordering dependency on anything above; runs after so it reads as
// a final cleanup pass over what those already built. In particular this
// has to come after initRandomiser: on/after the day-after-check-in gate,
// both CHECKIN_UTC and GATE_UTC have already passed, so initRandomiser
// would otherwise reveal #randomiser (build its rivets, wire up its
// postMessage handshake) a moment before this immediately re-hides it via
// .is-archived — harmless, but pure wasted work, and the wrong read order
// for "cleanup pass over what's already built."
initCheckinArchive();
