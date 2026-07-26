// Organism: the Timeline scissors-cut -> Getting Started unzip -> Check In
// reveal. A sibling to timeline-panel.js, not an extension of it — this
// owns two DOM zones (#timeline, which holds the scissors/cut-string AND
// the grommet row/threaded string — see that build's own comment for why
// it lives here rather than tracking #guide — and the new #check-in
// section) plus a one-shot multi-stage state machine, a different shape of
// problem than timeline-panel.js's continuous tick/redraw loop. Coordinates
// with it purely through DOM queries and the shared 'chute:ball-landed'
// event, same decoupling convention drop-chute.js already uses (it reads
// .tl-spring-track's live position without timeline-panel.js exporting
// anything for it).
//
// Desktop only (>640px) for this pass — mobile adaptation is deferred.
//
// The story, in order: a pair of scissor SVGs hang above the Timeline
// panel, resting permanently at their baseline open angle (30deg apart,
// +/-15deg each) — nothing about real time affects them directly. The
// "Today" chip's knob is what actually touches them: as the chip's own
// (real-time-driven, but that's timeline-panel.js's concern, not this
// module's) x position carries the knob rightward day by day, it
// eventually comes within reach of the scissors' fixed x — only then does
// contact begin, and only then does the resting angle start closing (see
// computeRestAngle below, driven by the live knob/scissors distance, not
// by elapsed time). Before contact, a landing bounce has zero effect on the
// scissors — see onBallLanded's own inContact guard. Only once contact has
// begun can a bounce's peak actually reach a full close, and only counts as
// the real cut once the deadline has passed and a visitor has scrolled the
// section into view — see runSequence's gate check. Because there's no
// persistence layer on this static site, every fresh page load after the
// deadline resets to "not yet cut" and replays the whole gesture on the
// next qualifying bounce.

import { createSegment, renderSegment } from '../atoms/batik-segment.js';
import { buildFlourish, renderFlourish } from '../atoms/batik-flourish.js';
import { buildGrommet, buildGrommetRow } from '../atoms/grommet.js';
import { bounceFactor, BOUNCE_DURATION_MS, BOUNCE_DOWN_PORTION } from '../atoms/bounce-timing.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Same choice timeline-panel.js's own rig makes for its string's cecek dots.
const CECEK_FILL = 'var(--color-highlight)';

// Redeclared independently rather than exported from timeline-panel.js and
// imported here — same precedent that file's own PROJECT_START_UTC comment
// sets (kueh-of-day.js's getDayIndexSGT re-derives one small date
// calculation rather than sharing it across modules). Only used for the
// final cut-trigger gate (runSequence) — the resting angle itself is
// driven by knob/scissors distance, not by this date at all.
const CHECKIN_UTC = Date.UTC(2026, 6, 29, 6, 0, 0); // 29 July 2026, 2:00pm SGT
const PROJECT_START_UTC = Date.UTC(2026, 5, 24); // 24 June 2026 — only used for dayIndexOf's day-boundary math below
const DAY_MS = 86400000;

// A plain day counter (no DAY_COUNT clamping — timeline-panel.js's own
// currentDayIndex needs that for its dial math, this just needs to detect
// "has the calendar day changed since the cut," so it's fine to run past
// the project's own end). Whole-day boundaries at 00:00 UTC, same
// convention as timeline-panel.js's own currentDayIndex.
function dayIndexOf(nowMs) {
  return Math.floor((nowMs - PROJECT_START_UTC) / DAY_MS);
}

const BASELINE_OPEN_DEG = 17; // permanent resting angle until the knob makes contact
// Only a bounce's own peak can close the rest of the way, once contact has
// begun. Equal to BOUNCE_SCISSOR_DELTA below by design: only once
// computeRestAngle has decayed down to exactly this floor (knob fully
// touching/past the scissors) can a bounce's peak subtraction reach 0deg —
// every earlier in-contact bounce just dips partway and relaxes back to
// whatever the current resting angle is.
const MIN_REST_DEG = 3;
const BOUNCE_SCISSOR_DELTA = MIN_REST_DEG;
// How close (in px, along whichever axis the current layout's day-position
// actually moves on — the knob's center to the scissors' pivot x on
// desktop, the cup's center to the scissors' pivot y on mobile, see
// getContactPos below) before the pusher starts pushing on the scissors —
// tune visually. Using SIGNED distance (scissorsPos - pusherPos, not
// absolute) in computeRestAngle below is what makes this a one-way
// ratchet: once the pusher reaches/passes the scissors (a negative signed
// distance), the resting angle clamps at MIN_REST_DEG and stays there even
// as the pusher continues moving away in later days — it does not
// "re-open" on a much-later visit before the real cut has ever fired.
// Desktop only — the live knob/scissors distance is a reliable day-by-day
// proxy for "how close to 29 July" on desktop's own geometry. Mobile
// doesn't share this: its cup only travels a small, fixed distance per
// day, so no single distance threshold can both (a) stay flush at
// BASELINE_OPEN_DEG until ~27 July and (b) reach nearly-closed just 2 days
// later — confirmed empirically across several attempts, not assumed.
// Mobile is scheduled directly off the calendar instead — see
// MOBILE_PUSH_START_UTC below.
const CONTACT_START_DISTANCE_PX = 15;

// Native artwork is 81x174 (see wip/scissors_front.svg's own viewBox),
// shown at 100% — no downscaling.
const SCISSORS_NATIVE_ASPECT = 81 / 174;
const SCISSORS_DISPLAY_HEIGHT = 174;
const SCISSORS_DISPLAY_WIDTH = SCISSORS_DISPLAY_HEIGHT * SCISSORS_NATIVE_ASPECT;
// Right of the dial's "29 July" tick, in px — tune so the knob/scissor
// contact reads as lined up (see the chip knob's own comment below).
const SCISSORS_X_OFFSET = -10;
// Above .tl-panel-layout's own top edge (the whole chrome panel — spring
// track, chip, dial — not just above its inner content), in px — tune
// visually alongside .timeline-section's own padding-top (styles/
// organisms/timeline-panel.css), which was grown to make room for this.
// Large enough that the scissors' own bottom end (the handle tip,
// SCISSORS_DISPLAY_HEIGHT/2 + SCISSORS_PIVOT_BELOW_STRING_GAP below the
// string) clears the panel's top edge — i.e. stays above the spring track
// — rather than dipping down into it.
const CUT_STRING_ABOVE_PANEL_GAP = 148;
// The string runs just above the fulcrum (dead center of the scissors'
// shared pivot), not above the whole assembly — sandwiched between the two
// blade layers (back -> string -> front, see the z-index comments on
// .sc-scissors-front/.sc-cut-string in scissors-cut.css) so the blades
// visually close around it. How far below the string the pivot sits —
// bigger means the string sits higher relative to the fulcrum (and the
// whole assembly needs more CUT_STRING_ABOVE_PANEL_GAP clearance to
// compensate, since the fulcrum — and everything below it — drops by the
// same amount).
const SCISSORS_PIVOT_BELOW_STRING_GAP = 55;

// === Mobile layout (<=640px) ===
// A simpler variant, not a scaled-down version of the desktop rig: the
// same scissors assembly instead sits below the whole vertical dial/spring
// track, rotated 90deg so the tip faces right and the handles face left,
// with its handle-end aligned under the cup (.tl-glass, timeline-panel.js)
// — a purely visual placement now, not something the contact/angle logic
// measures against (see MOBILE_PUSH_START_UTC below for why). Same
// breakpoint drop-chute.js already uses.
const MOBILE_BREAKPOINT = 640;
// Contact/angle progression is scheduled directly off these dates, not off
// the cup's live position — the mobile cup's own fixed per-day travel
// can't produce both "flush at BASELINE_OPEN_DEG until the 27th" and
// "nearly closed just 2 days later" from any single distance threshold
// (confirmed empirically), so mobile is given the exact schedule that was
// actually asked for instead of trying to derive it from geometry.
const MOBILE_PUSH_START_UTC = Date.UTC(2026, 6, 27); // 27 July 2026, 00:00 UTC — bounce response + closing begin
const MOBILE_CLOSE_DEG_BY_DEADLINE = 2; // resting angle by the 29 July deadline (CHECKIN_UTC), not all the way to MIN_REST_DEG
// Gap below .tl-panel-layout's own bottom edge — tune visually. Purely
// visual placement (see MOBILE_PUSH_START_UTC above) — no longer feeds any
// contact/timing calibration.
const SCISSORS_BELOW_PANEL_GAP_MOBILE = 40;
// Horizontal alignment vs the cup's own x — tune visually.
const SCISSORS_X_OFFSET_MOBILE = -44;
// rotate(90deg) swaps which of the scissors' own declared dimensions reads
// as "length" (along the handle<->tip axis, screen-horizontal after the
// rotation) vs "thickness" (screen-vertical) — these are the rotated
// visual footprint's own half-extents, used to place the short mobile
// string's two grommets just past the tip/handle ends.
const SCISSORS_ROTATED_HALF_LENGTH_MOBILE = SCISSORS_DISPLAY_HEIGHT / 2;
const SCISSORS_ROTATED_HALF_THICKNESS_MOBILE = SCISSORS_DISPLAY_WIDTH / 2;
// Gap between the rotated scissors' own top/bottom edge and each grommet.
const MOBILE_STRING_GROMMET_GAP = 10;
// How far from the wrap's own local top edge (i.e. from the tip) the short
// mobile string/grommets sit — local-frame y, shared by both grommets.
const MOBILE_STRING_INSET = 22;
// Clears stroke width + cecek dot radius at each half's own box edges —
// same convention GUIDE_THREAD_WINDOW_HALF_HEIGHT (below) uses.
const MOBILE_STRING_PAD = 8;

const GROMMET_COUNT = 8; // even, so the alternating visible/hidden thread pattern lands symmetric at both ends — tune
const GROMMET_COUNT_MOBILE = 4; // same parity requirement, fewer for the narrower row
// How far past the viewport the two outer thread runs extend — comfortably
// past typical scroll positions so body's own overflow-x:hidden (not this
// module) is what actually hides them, matching "offscreen" literally.
const GUIDE_STRING_EDGE_RUN_FRACTION = 0.35;

const CUT_ZIP_MS = 400;
// Mobile's sequential runSequence (see its own comment) doesn't wait for
// cutTimeline's full CUT_ZIP_MS to elapse before starting the unravel —
// that made the gap between the two feel too long. Shorter than CUT_ZIP_MS
// on purpose: the unravel starts while the short local cut-string is still
// mid-retract, not only once it's fully gone.
const MOBILE_CUT_TO_UNRAVEL_DELAY_MS = 150;
// The thread is one continuous path across the whole row (see
// buildGuideThreadLayer) — a single clip-path sweep on the whole layer
// replaces what used to be N independently-staggered per-segment
// retractions. Keep in sync with .sc-guide-thread-layer.sc-thread-retract's
// own transition-duration (scissors-cut.css), same convention CUT_ZIP_MS
// above already follows for cutStringLeft/-right.
const GUIDE_UNZIP_MS = 1200;

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// signedDistance shrinks from CONTACT_START_DISTANCE_PX toward 0 (then
// negative) as the pusher (knob on desktop, cup on mobile) approaches and
// passes the scissors — clamp01 on the ratio is what gives this its
// one-way-ratchet property (see CONTACT_START_DISTANCE_PX's own comment):
// once signedDistance goes negative the fraction is already clamped at 1
// and stays there. Axis-agnostic on purpose — pusherPos/scissorsPos are
// just "position along whichever axis this layout's day-position actually
// moves on," see getContactPos/currentContactPos. Same shared threshold
// for both desktop and mobile — see that constant's own comment.
function computeRestAngle(pusherPos, scissorsPos) {
  const signedDistance = scissorsPos - pusherPos;
  const pushFraction = clamp01((CONTACT_START_DISTANCE_PX - signedDistance) / CONTACT_START_DISTANCE_PX);
  return lerp(BASELINE_OPEN_DEG, MIN_REST_DEG, pushFraction);
}

function isInContact(pusherPos, scissorsPos) {
  return scissorsPos - pusherPos < CONTACT_START_DISTANCE_PX;
}

// Radius of the grommet's own hole (not the whole grommet) — 14px wide
// (.grommet, scissors-cut.css) minus its 1.5px rim inset on each side
// (.grommet-hole's own `inset: 1.5px`), halved.
const GROMMET_HOLE_RADIUS = (14 - 1.5 * 2) / 2;

// Stay just shy of each hole's own far edge, not flush on it — a hair of
// margin so the visible mask window never quite pokes out the far side
// into the open rim/background beyond.
const HOLE_EDGE_MARGIN = 2.5;

// Pushes both points OUTWARD, past each hole's own center, almost all the
// way to that hole's own *far* edge (the side facing away from the other
// point) — not toward the near edge. Used only to size each visible
// segment's mask window (see buildGuideThreadLayer below), not to shorten
// the thread's own drawn geometry: the thread is one single continuous
// line the whole row's width, and a static SVG mask is what hides the
// stretches that should read as running under the surface. Reaching the
// window deep into each hole (rather than stopping at the hole/rim
// boundary) is what makes a visible stretch read as emerging from deep
// inside one hole and diving deep into the next, instead of stopping short
// at bare rim with no string crossing it.
function holeFarReach(from, to, radius) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return [from, to];
  const ux = dx / len;
  const uy = dy / len;
  const reach = radius - HOLE_EDGE_MARGIN;
  return [
    [from[0] - ux * reach, from[1] - uy * reach],
    [to[0] + ux * reach, to[1] + uy * reach],
  ];
}

const GUIDE_THREAD_MASK_ID = 'sc-guide-thread-mask';
// Half-height of both the layer's own viewBox and every mask rect — just
// enough to clear the 2px stroke plus the cecek dots' own radius (the line
// itself never bows, see below, so no extra vertical room is needed for
// curvature).
const GUIDE_THREAD_WINDOW_HALF_HEIGHT = 8;

// One continuous <svg>/<path> spanning the whole grommet row — the left
// offscreen run, every hole, and the right offscreen run, as a single
// unbroken line, not N separately-built segments. createSegment(0) always
// gives zero bow regardless of endpoints, and every point here shares the
// same y (a flat row), so one segment straight from the first point to the
// last is geometrically identical to tracing through every hole
// individually — there's nothing for the intermediate points to add to the
// path's own shape.
//
// The "over the rim, emerging from/diving into a hole" weave look comes
// entirely from a static SVG <mask> layered on top of that one line (white
// rects over the spans that should show; an SVG mask's own default outside
// any drawn shape is fully transparent, i.e. hidden) — decoupled from the
// thread's geometry. That split is what makes the Stage C unravel trivial:
// a single clip-path transition on the whole returned <svg> (see
// unzipGuide) sweeps the entire row — path AND its cecek dots together —
// at once, rather than needing N independently-timed, independently-
// directioned per-segment retractions, which is exactly where the last two
// rounds of "wrong direction" bugs came from.
function buildGuideThreadLayer(points) {
  const y = points[0][1];
  const minX = Math.min(points[0][0], points[points.length - 1][0]);
  const maxX = Math.max(points[0][0], points[points.length - 1][0]);
  const top = y - GUIDE_THREAD_WINDOW_HALF_HEIGHT;
  const height = GUIDE_THREAD_WINDOW_HALF_HEIGHT * 2;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('sc-guide-thread-layer');
  svg.setAttribute('viewBox', `${minX} ${top} ${maxX - minX} ${height}`);
  svg.style.left = `${minX}px`;
  svg.style.top = `${top}px`;
  svg.style.width = `${maxX - minX}px`;
  svg.style.height = `${height}px`;

  // Alternating — odd index visible ("over"), even index hidden ("under"),
  // so the two offscreen end runs (index 0 and the last, both even) duck
  // under right at the edge instead of running in visibly from off-screen.
  // GROMMET_COUNT even => points.length - 1 (segment count) is odd, same
  // as the other parity choice.
  const maskRects = [];
  for (let i = 0; i < points.length - 1; i++) {
    if (i % 2 !== 1) continue;
    const [from, to] = holeFarReach(points[i], points[i + 1], GROMMET_HOLE_RADIUS);
    const x = Math.min(from[0], to[0]);
    const w = Math.abs(to[0] - from[0]);
    maskRects.push(`<rect x="${x}" y="${top}" width="${w}" height="${height}" fill="white"/>`);
  }

  const computed = createSegment(0).compute(points[0], points[points.length - 1]);
  svg.innerHTML = `<defs><mask id="${GUIDE_THREAD_MASK_ID}" maskUnits="userSpaceOnUse" x="${minX}" y="${top}" width="${maxX - minX}" height="${height}">${maskRects.join('')}</mask></defs><g mask="url(#${GUIDE_THREAD_MASK_ID})">${renderSegment(computed, CECEK_FILL)}</g>`;

  return { svg };
}

export function init() {
  const section = document.getElementById('timeline');
  const checkin = document.getElementById('check-in');
  if (!section || !checkin) return;

  const dialMid = section.querySelector('.tl-dial-meeting-mid');
  const panelLayout = section.querySelector('.tl-panel-layout');
  const chip = section.querySelector('.tl-day-chip');
  if (!dialMid || !panelLayout || !chip) return;

  // === Scissors assembly (sibling of .tl-panel-layout, inside #timeline) ===
  const scissorsWrap = document.createElement('div');
  scissorsWrap.className = 'sc-scissors-wrap';
  scissorsWrap.setAttribute('aria-hidden', 'true');
  // Explicit size, even though its own two children are position:absolute
  // and would render fine regardless — an unsized wrap reports a 0x0
  // getBoundingClientRect, which any future code measuring "where are the
  // scissors" (or a devtools/screenshot tool targeting this element
  // directly) would otherwise trip on.
  scissorsWrap.style.width = `${SCISSORS_DISPLAY_WIDTH}px`;
  scissorsWrap.style.height = `${SCISSORS_DISPLAY_HEIGHT}px`;

  const backImg = document.createElement('img');
  backImg.className = 'sc-scissors-back';
  backImg.src = 'images/scissors/scissors-back.svg';
  backImg.alt = '';
  backImg.style.width = `${SCISSORS_DISPLAY_WIDTH}px`;
  backImg.style.height = `${SCISSORS_DISPLAY_HEIGHT}px`;

  const frontImg = document.createElement('img');
  frontImg.className = 'sc-scissors-front';
  frontImg.src = 'images/scissors/scissors-front.svg';
  frontImg.alt = '';
  frontImg.style.width = `${SCISSORS_DISPLAY_WIDTH}px`;
  frontImg.style.height = `${SCISSORS_DISPLAY_HEIGHT}px`;

  // The fulcrum screw — sits dead center of the wrap (both SVGs' own shared
  // pivot circle lands there, per their identical cx/cy), on top of both
  // blade layers (z-index in scissors-cut.css), and never rotates: it's the
  // pivot itself, and a symmetric circle rotated about its own center looks
  // identical regardless of angle, so there's nothing to animate here.
  const rivet = document.createElement('div');
  rivet.className = 'sc-scissors-rivet';
  rivet.setAttribute('aria-hidden', 'true');

  // Two flanking rivets, same fixed/never-rotating treatment as the
  // fulcrum screw itself — purely decorative hardware, not additional
  // pivots, so no angle logic needed for these either.
  const rivetLeft = document.createElement('div');
  rivetLeft.className = 'sc-scissors-rivet sc-scissors-rivet-left';
  rivetLeft.setAttribute('aria-hidden', 'true');

  const rivetRight = document.createElement('div');
  rivetRight.className = 'sc-scissors-rivet sc-scissors-rivet-right';
  rivetRight.setAttribute('aria-hidden', 'true');

  // === Mobile-only short cut-string + 2 grommets — hidden by default
  // (scissors-cut.css), shown only under the mobile breakpoint. Built here
  // unconditionally (cheap — a couple of small elements) rather than
  // gated behind an isMobile check, and positioned with FIXED local
  // offsets against the wrap's own un-rotated box, not live-measured —
  // because they're children of scissorsWrap, they ride along automatically
  // with its CSS rotate(90deg) (mobile media query) exactly like the
  // fulcrum/flanking rivets already do.
  //
  // The math: rotate(90deg) maps a local point (x,y), relative to the
  // wrap's own center, to a final screen point (-y, x) — i.e. local "top"
  // (negative y, where the tip is) becomes final "right" (the tip, after
  // rotation), and local "left"/"right" become final "up"/"down". So a
  // grommet that should read as "above the scissors, near the tip" in the
  // rotated mobile view has to sit, in LOCAL coordinates, near the wrap's
  // own top edge (matching the tip's own y) but shifted to LOCAL left —
  // and the other grommet ("below the scissors") at that same local y but
  // shifted to LOCAL right. Both sit just outside the wrap's own left/right
  // edges (negative left / left > 100%), which renders fine since nothing
  // here clips overflow.
  const mobileLocalY = MOBILE_STRING_INSET;
  const mobileLocalLeftX = -MOBILE_STRING_GROMMET_GAP;
  const mobileLocalRightX = SCISSORS_DISPLAY_WIDTH + MOBILE_STRING_GROMMET_GAP;
  const mobileLocalCenterX = SCISSORS_DISPLAY_WIDTH / 2;

  const mobileGrommetA = buildGrommet();
  mobileGrommetA.classList.add('sc-mobile-string-grommet');
  mobileGrommetA.style.left = `${mobileLocalLeftX}px`;
  mobileGrommetA.style.top = `${mobileLocalY}px`;

  const mobileGrommetB = buildGrommet();
  mobileGrommetB.classList.add('sc-mobile-string-grommet');
  mobileGrommetB.style.left = `${mobileLocalRightX}px`;
  mobileGrommetB.style.top = `${mobileLocalY}px`;

  // Split at the wrap's own local center-x — i.e. where the blades
  // actually cross near the tip — same "two independent halves, split at
  // the cut point" idea as the desktop cutStringLeft/-right, just local
  // and short instead of spanning to the screen edges. Each half gets a
  // real sized viewBox/box (not left:0;top:0 + overflow:visible) so its
  // own clip-path retract (see .sc-mobile-cut-string-a/-b.sc-zipped,
  // scissors-cut.css) resolves against a meaningful box — the desktop
  // guide-thread's own reason for needing this, see that build's comment.
  function buildMobileCutStringHalf(from, to, extraClass) {
    const minX = Math.min(from[0], to[0]) - MOBILE_STRING_PAD;
    const minY = Math.min(from[1], to[1]) - MOBILE_STRING_PAD;
    const width = Math.abs(to[0] - from[0]) + MOBILE_STRING_PAD * 2;
    const height = Math.abs(to[1] - from[1]) + MOBILE_STRING_PAD * 2;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('sc-mobile-cut-string', extraClass);
    svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    svg.style.left = `${minX}px`;
    svg.style.top = `${minY}px`;
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
    svg.innerHTML = renderSegment(createSegment(0).compute(from, to), CECEK_FILL);
    return svg;
  }

  const mobileCutStringA = buildMobileCutStringHalf(
    [mobileLocalLeftX, mobileLocalY],
    [mobileLocalCenterX, mobileLocalY],
    'sc-mobile-cut-string-a'
  );
  const mobileCutStringB = buildMobileCutStringHalf(
    [mobileLocalCenterX, mobileLocalY],
    [mobileLocalRightX, mobileLocalY],
    'sc-mobile-cut-string-b'
  );

  scissorsWrap.append(
    backImg,
    frontImg,
    mobileCutStringA,
    mobileCutStringB,
    mobileGrommetA,
    mobileGrommetB,
    rivet,
    rivetLeft,
    rivetRight
  );
  section.appendChild(scissorsWrap);

  // translateY(-2px) here, not on the wrap itself — shifts only the blade
  // images (mobile only), leaving the string/grommets (also children of
  // the wrap, but positioned independently of this per-frame transform)
  // untouched. Applied in the wrap's own LOCAL frame, same as everything
  // else built relative to it — after the parent wrap's own mobile
  // rotate(90deg), a local -y shift reads as a rightward shift on screen
  // (see the mobile grommet/string build's own comment for that mapping),
  // matching what was actually asked for ("shift right").
  function renderScissors(angleDeg) {
    const mobileShift = isMobile ? 'translateY(-2px) ' : '';
    backImg.style.transform = `${mobileShift}rotate(${-angleDeg}deg)`;
    frontImg.style.transform = `${mobileShift}rotate(${angleDeg}deg)`;
  }

  // === Chip knob — a static child of an element timeline-panel.js's own
  // tick() already repositions every frame, so it rides along for free with
  // no positioning logic needed here. The "knob pushes the scissors" read
  // is a narrative coincidence of two independently-timed values (the
  // chip's day position and the scissors' pushFraction) that both happen to
  // converge near 29 July because both anchor to CHECKIN_UTC — not a
  // literal collision/coupling. If PUSH_DAYS_BEFORE or the dial's own mid-
  // day index ever change independently, re-check that this visual read
  // still lines up. ===
  const knob = document.createElement('div');
  knob.className = 'sc-chip-knob';
  knob.setAttribute('aria-hidden', 'true');
  chip.appendChild(knob);

  // === Timeline cut-string — two independent halves, split at the
  // scissors' x, not part of .tl-panel-layout (a separate decorative
  // string spanning the section, unrelated to the existing pulley/glass
  // rig's own string). ===
  const cutStringLeft = document.createElementNS(SVG_NS, 'svg');
  cutStringLeft.classList.add('sc-cut-string', 'sc-cut-string-left');
  cutStringLeft.setAttribute('overflow', 'visible');
  const cutStringRight = document.createElementNS(SVG_NS, 'svg');
  cutStringRight.classList.add('sc-cut-string', 'sc-cut-string-right');
  cutStringRight.setAttribute('overflow', 'visible');
  section.append(cutStringLeft, cutStringRight);

  // Picked once (not re-rolled per redraw) — same convention timeline-
  // panel.js's own buildRig() uses for its pulley strings' flourishes, so
  // they don't jump to a different spot/shape every resize. 1-2 per half,
  // sparser than the rig's own multi-segment string since each half here
  // is just one straight run, not several.
  const leftFlourishes = Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => buildFlourish());
  const rightFlourishes = Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => buildFlourish());

  // === Grommet row + threaded string — anchored to #timeline's own bottom
  // edge (a fixed, permanent decoration, not something that visually
  // "belongs" to #guide and tracks it down the page anymore — that
  // approach needed body-level absolute positioning to escape #guide's own
  // overflow:hidden, which in turn needed tracking #guide's position
  // through the accordion reveal, which turned out fragile against
  // whatever async layout shifts happen elsewhere on the page. #timeline
  // has no overflow:hidden and never moves regardless of what #check-in
  // does below it, so anchoring here needs none of that — just a plain
  // child, positioned via CSS against #timeline's own already-`position:
  // relative` box. ===
  let grommetRow = buildGrommetRow(GROMMET_COUNT);
  grommetRow.classList.add('sc-guide-grommet-row');
  section.appendChild(grommetRow);
  let threadLayer = null; // { svg } — see buildGuideThreadLayer

  // === Check-in section shell (static markup already in index.html) ===
  const checkinCollapse = checkin.querySelector('.check-in-collapse');

  // === Geometry — recomputed on resize/section resize, guarded to only run
  // pre-cut (post-cut, the zipped/retracted/revealed state is permanent for
  // the rest of this pageview, not something a later resize should reset). ===
  function positionTimelineElements() {
    const sectionRect = section.getBoundingClientRect();
    const panelRect = panelLayout.getBoundingClientRect();
    isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    if (isMobile) {
      // scissorsCenterX aligns the HANDLES (not the assembly's own visual
      // center) under the cup's x — see SCISSORS_ROTATED_HALF_LENGTH_MOBILE's
      // own comment: after the CSS rotate(90deg), the handles sit
      // SCISSORS_ROTATED_HALF_LENGTH_MOBILE to the LEFT of the wrap's
      // center, so the center itself has to sit that same distance to the
      // RIGHT of the cup for the handles to land exactly on it. The cup's
      // own x never actually changes over time (timeline-panel.js's mobile
      // rig always sets nodeX = chipX), so the day-chip's rect is a stable,
      // always-present stand-in — no need to depend on .tl-glass having
      // already rendered once.
      const chipRect = chip.getBoundingClientRect();
      const scissorsCenterX =
        chipRect.left + chipRect.width / 2 - sectionRect.left + SCISSORS_ROTATED_HALF_LENGTH_MOBILE + SCISSORS_X_OFFSET_MOBILE;
      // Below .tl-panel-layout's own bottom edge (the whole vertical
      // dial/spring-track column) — purely visual placement now, not read
      // by any contact/timing math (see MOBILE_PUSH_START_UTC).
      const scissorsCenterY =
        panelRect.bottom - sectionRect.top + SCISSORS_BELOW_PANEL_GAP_MOBILE + SCISSORS_ROTATED_HALF_THICKNESS_MOBILE;
      scissorsWrap.style.left = `${scissorsCenterX - SCISSORS_DISPLAY_WIDTH / 2}px`;
      scissorsWrap.style.top = `${scissorsCenterY - SCISSORS_DISPLAY_HEIGHT / 2}px`;
      return;
    }

    const dialMidRect = dialMid.getBoundingClientRect();
    const scissorsX = dialMidRect.left + dialMidRect.width / 2 - sectionRect.left + SCISSORS_X_OFFSET;
    currentContactPos = scissorsX;
    // Above the whole chrome panel's own top edge, not below the section
    // label — see CUT_STRING_ABOVE_PANEL_GAP's own comment.
    const stringY = panelRect.top - sectionRect.top - CUT_STRING_ABOVE_PANEL_GAP;

    // The pivot (dead center of both SVGs, per their shared pivot circle)
    // sits SCISSORS_PIVOT_BELOW_STRING_GAP below the string, so the wrap's
    // own top edge is offset up from that by half its height.
    const pivotY = stringY + SCISSORS_PIVOT_BELOW_STRING_GAP;
    const wrapTop = pivotY - SCISSORS_DISPLAY_HEIGHT / 2;
    scissorsWrap.style.left = `${scissorsX}px`;
    scissorsWrap.style.top = `${wrapTop}px`;

    // .sc-scissors-wrap has no centering transform on desktop — `left`
    // anchors its LEFT edge at scissorsX, not its center (deliberately left
    // this way: the contact math in computeRestAngle/isInContact reads
    // currentContactPos directly, and retuning that reference would shift
    // the whole knob-contact day-by-day calibration). The cut-string still
    // needs to visually cross through the fulcrum rivet, which sits at the
    // wrap's own true center — SCISSORS_DISPLAY_WIDTH/2 to the right of
    // scissorsX — so it's computed separately here, local to this string-
    // drawing code only.
    const scissorsVisualCenterX = scissorsX + SCISSORS_DISPLAY_WIDTH / 2;

    const sectionWidth = section.clientWidth;
    const leftFrom = [0, stringY];
    const leftTo = [scissorsVisualCenterX, stringY];
    cutStringLeft.innerHTML =
      renderSegment(createSegment(0).compute(leftFrom, leftTo), CECEK_FILL) +
      leftFlourishes.map((f) => renderFlourish(leftFrom, leftTo, f, CECEK_FILL)).join('');

    const rightFrom = [scissorsVisualCenterX, stringY];
    const rightTo = [sectionWidth, stringY];
    cutStringRight.innerHTML =
      renderSegment(createSegment(0).compute(rightFrom, rightTo), CECEK_FILL) +
      rightFlourishes.map((f) => renderFlourish(rightFrom, rightTo, f, CECEK_FILL)).join('');
  }

  // grommetRow's own position is pure CSS now (.sc-guide-grommet-row,
  // scissors-cut.css — anchored to #timeline's own bottom edge, which
  // never moves). It does still need rebuilding here (not just the thread)
  // when the grommet COUNT itself needs to change across the mobile
  // breakpoint (GROMMET_COUNT_MOBILE vs GROMMET_COUNT) — cheap enough to
  // just check every reposition rather than track breakpoint transitions
  // separately.
  function positionGuideThread() {
    const targetGrommetCount = isMobile ? GROMMET_COUNT_MOBILE : GROMMET_COUNT;
    if (grommetRow.childElementCount !== targetGrommetCount) {
      grommetRow.remove();
      grommetRow = buildGrommetRow(targetGrommetCount);
      grommetRow.classList.add('sc-guide-grommet-row');
      section.appendChild(grommetRow);
    }

    const sectionRect = section.getBoundingClientRect();
    const grommetEls = Array.from(grommetRow.querySelectorAll('.grommet'));
    if (!grommetEls.length) return;
    const centers = grommetEls.map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2 - sectionRect.left, r.top + r.height / 2 - sectionRect.top];
    });

    const y = centers[0][1];
    const offRunPx = window.innerWidth * GUIDE_STRING_EDGE_RUN_FRACTION;
    const points = [
      [centers[0][0] - offRunPx, y],
      ...centers,
      [centers[centers.length - 1][0] + offRunPx, y],
    ];

    if (threadLayer) threadLayer.svg.remove();
    threadLayer = buildGuideThreadLayer(points);
    // Appended after grommetRow (already in the DOM by the time this first
    // runs) — later DOM siblings paint on top, so the thread visually
    // crosses over each grommet's own rim rather than sitting behind it,
    // reading as actually threaded through rather than just adjacent to it.
    section.appendChild(threadLayer.svg);
  }

  function reposition() {
    if (phase !== 'idle') return;
    positionTimelineElements();
    positionGuideThread();
    // The scissors' own contact position (and the chip/cup's) may have
    // both just changed — the contact state has to be re-evaluated off the
    // new geometry, not left showing whatever angle was last rendered.
    renderRestingAngle();
  }

  // === State machine ===
  let phase = 'idle'; // 'idle' | 'cutting' | 'done'
  let hasPlayedThisPageview = false;
  let sectionInView = false;
  let bounceStart = null; // this module's own clock — independent from timeline-panel.js's
  let downPhaseHandled = false;
  let currentContactPos = 0; // set by positionTimelineElements — desktop's scissorsX only; unused on mobile (date-scheduled instead)
  let isMobile = false; // set fresh in positionTimelineElements, read by getContactPos below
  let cutDayIndex = null; // dayIndexOf(Date.now()) at the moment of the cut — see maybeRemoveScissorsForNewDay

  new IntersectionObserver(([entry]) => {
    sectionInView = entry.isIntersecting;
  }, { threshold: 0 }).observe(section);

  // The knob is a static child of .tl-day-chip (see its own comment) riding
  // wherever timeline-panel.js's own tick() has last positioned the chip —
  // reading the chip's live rect (rather than caching an x) is what lets
  // this module react to the chip's real position without timeline-panel.js
  // needing to export anything for it. Desktop only — mobile's own contact/
  // angle logic is date-scheduled instead (see MOBILE_PUSH_START_UTC).
  function getContactPos() {
    const sectionRect = section.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    return chipRect.left + chipRect.width / 2 - sectionRect.left;
  }

  // Mobile's own resting-angle/contact schedule — a straight calendar lerp
  // from BASELINE_OPEN_DEG (any time before MOBILE_PUSH_START_UTC) to
  // MOBILE_CLOSE_DEG_BY_DEADLINE at CHECKIN_UTC, with bounce-eligibility
  // (isContactMobile) flipping on at that same push-start date — see
  // CONTACT_START_DISTANCE_PX's own comment for why this isn't derived from
  // the cup's live position the way desktop's is.
  function restAngleMobile(nowMs) {
    const pushFraction = clamp01((nowMs - MOBILE_PUSH_START_UTC) / (CHECKIN_UTC - MOBILE_PUSH_START_UTC));
    return lerp(BASELINE_OPEN_DEG, MOBILE_CLOSE_DEG_BY_DEADLINE, pushFraction);
  }

  function isContactMobile(nowMs) {
    return nowMs >= MOBILE_PUSH_START_UTC;
  }

  // Single entry point both renderRestingAngle and runBounceFrame use for
  // "what should the resting angle be right now" — branches once here
  // instead of scattering the isMobile check across every caller.
  function currentRestAngle() {
    if (isMobile) return restAngleMobile(Date.now());
    return computeRestAngle(getContactPos(), currentContactPos);
  }

  function currentlyInContact() {
    if (isMobile) return isContactMobile(Date.now());
    return isInContact(getContactPos(), currentContactPos);
  }

  // Allowed to keep running in 'done' (post-cut), not just 'idle' — the
  // scissors stay in the DOM, frozen shut, and should keep reacting to
  // subsequent bounces (see runBounceFrame/onBallLanded's own comments) —
  // only the brief 'cutting' transient (the cut/unzip/reveal sequence
  // itself already forced angle 0) blocks this.
  function renderRestingAngle() {
    if (phase === 'cutting') return;
    renderScissors(currentRestAngle());
  }

  // The scissors are NOT removed here — they stay put, frozen fully closed,
  // for the rest of the calendar day the cut happened on (a visible record
  // that it happened), and are only taken off once maybeRemoveScissorsForNewDay
  // detects the day has actually changed (see that function's own comment).
  // Zips both the desktop cut-string halves AND the mobile short-string
  // halves unconditionally — whichever pair is actually hidden (CSS, by
  // breakpoint) just harmlessly gets the class with nothing visible to show
  // for it, so this needs no isMobile branch of its own.
  function cutTimeline(next) {
    cutStringLeft.classList.add('sc-zipped');
    cutStringRight.classList.add('sc-zipped');
    mobileCutStringA.classList.add('sc-zipped');
    mobileCutStringB.classList.add('sc-zipped');
    setTimeout(next, CUT_ZIP_MS);
  }

  // Runs at the exact same instant as cutTimeline (see runSequence), not
  // chained after it finishes — the Timeline cut-string and this grommet
  // thread read as two segments of one taut string a single weight starts
  // pulling on the moment it's severed, not two independent, sequential
  // events. A single clip-path sweep across the whole layer's own box (not
  // just the stroked path — stroke-dashoffset was tried first, but only
  // affects the path itself, leaving the cecek dot circles, rendered
  // alongside it rather than part of its stroke, sitting motionless
  // throughout the retract). Clipping the layer's whole box instead hides
  // path and dots together, uniformly, with no dot-specific logic needed.
  // Same anchor-left/shrink-from-right direction already confirmed against
  // the real rendered motion for the old per-segment version — growing the
  // RIGHT inset value keeps the visible remainder anchored at the LEFT
  // edge, receding away toward the right until nothing's left, which is
  // what reads as the whole row sliding out toward the left. Because the
  // clip sweeps the *entire* layer box — including the offscreen-run,
  // already-mask-hidden stretch nearest the right edge — a real chunk of
  // this animation's own duration passes before any *visible* material
  // actually starts shrinking, which is what gives the bottom thread's own
  // visible tip its natural "starts a moment after the top string's tip
  // exits screen right" lag, even though both start at the same instant.
  function unzipGuide(next) {
    if (!threadLayer) {
      next();
      return;
    }
    threadLayer.svg.classList.add('sc-thread-retract');
    setTimeout(next, GUIDE_UNZIP_MS);
  }

  // settleWindowHeight()-style idiom (kueh-of-day.js:298-307) — measure via
  // height:auto -> offsetHeight -> restore -> forced reflow -> re-enable
  // transition -> set the real px target, since max-height:none/height:auto
  // itself can't be the transition's start or end state.
  function revealCheckin() {
    checkinCollapse.style.transition = 'none';
    checkinCollapse.style.height = 'auto';
    const target = checkinCollapse.offsetHeight;
    checkinCollapse.style.height = '0px';
    void checkinCollapse.offsetHeight; // force reflow
    checkinCollapse.style.transition = '';
    checkinCollapse.style.height = `${target}px`;
    checkin.removeAttribute('aria-hidden');

    // No tracking needed here anymore — the grommet row/thread are anchored
    // to #timeline's own bottom edge (see their own build comment), which
    // this height transition never moves, unlike #guide (which used to be
    // what they tracked, and which this transition pushes down the page).
    phase = 'done';
  }

  // Desktop: both stages fire in parallel, not chained — see
  // cutTimeline/unzipGuide's own comments for why (the Timeline cut-string
  // and Getting Started's thread read as two segments of one string a
  // single weight starts pulling on the moment it's severed). revealCheckin
  // only needs to wait for whichever of the two actually finishes last
  // (currently the guide thread, since GUIDE_UNZIP_MS > CUT_ZIP_MS, but
  // this stays correct even if that ever flips) rather than assuming a
  // fixed order.
  //
  // Mobile: sequential instead — the mobile cut is just a short local
  // string, not "the other end of the same string" the Getting Started
  // thread belongs to, so there's no shared-tension narrative tying them
  // together in time. The unravel starts a short beat after the cut (not
  // chained off cutTimeline's own full-duration callback — see
  // MOBILE_CUT_TO_UNRAVEL_DELAY_MS), and the section reveals right after
  // the unravel.
  function runSequence() {
    if (isMobile) {
      cutTimeline(() => {});
      setTimeout(() => unzipGuide(revealCheckin), MOBILE_CUT_TO_UNRAVEL_DELAY_MS);
      return;
    }
    let remaining = 2;
    const advance = () => {
      remaining -= 1;
      if (remaining === 0) revealCheckin();
    };
    cutTimeline(advance);
    unzipGuide(advance);
  }

  // Scissors stay (frozen closed, per cutTimeline's own comment) — only the
  // string actually disappears instantly here.
  function runSequenceReduced() {
    renderScissors(0);
    cutStringLeft.remove();
    cutStringRight.remove();
    mobileCutStringA.remove();
    mobileCutStringB.remove();
    if (threadLayer) threadLayer.svg.remove();
    threadLayer = null;
    checkinCollapse.style.transition = 'none';
    checkinCollapse.style.height = 'auto';
    checkin.removeAttribute('aria-hidden');
    phase = 'done';
  }

  // Gate check: date + scroll-into-view + not-yet-played, evaluated the
  // instant a bounce's down-phase completes (its peak, deterministic within
  // the rAF loop regardless of exact frame timing — see this function's own
  // early-return once phase flips). The rendered angle is force-set to 0
  // here rather than trusted to have landed there naturally from the
  // bounceFactor arithmetic (which is frame-sampled and may not land on
  // exactly 1.0) — this function decides "the cut has happened," not the
  // float math. Only ever runs at all once onBallLanded has confirmed
  // contact — see its own comment for why a not-yet-touching bounce never
  // starts this loop in the first place.
  function runBounceFrame() {
    if (phase === 'cutting' || bounceStart === null) return;
    const elapsed = performance.now() - bounceStart;
    if (elapsed >= BOUNCE_DURATION_MS) {
      bounceStart = null;
      renderRestingAngle();
      return;
    }

    const rest = currentRestAngle();
    const factor = bounceFactor(elapsed);
    renderScissors(Math.max(0, rest - factor * BOUNCE_SCISSOR_DELTA));

    if (!downPhaseHandled && elapsed >= BOUNCE_DURATION_MS * BOUNCE_DOWN_PORTION) {
      downPhaseHandled = true;
      if (!hasPlayedThisPageview && Date.now() >= CHECKIN_UTC && sectionInView) {
        hasPlayedThisPageview = true;
        phase = 'cutting';
        cutDayIndex = dayIndexOf(Date.now());
        bounceStart = null;
        renderScissors(0);
        runSequence();
        return;
      }
    }

    requestAnimationFrame(runBounceFrame);
  }

  // A bounce only ever affects the scissors if the pusher (knob/cup) is
  // already touching them — before contact, the scissors sit permanently
  // at BASELINE_OPEN_DEG regardless of how many drops land in the cup, per
  // this module's own header comment. Checked once here (not inside the
  // rAF loop) so a not-yet-touching bounce never even starts animating.
  // Allowed to keep firing in 'done' (post-cut) — the scissors stay in the
  // DOM, frozen shut, and should keep wobbling slightly on later bounces
  // rather than going permanently inert; only the brief 'cutting' transient
  // blocks it.
  function onBallLanded() {
    if (phase === 'cutting') return;
    const inContact = currentlyInContact();

    if (prefersReducedMotion) {
      if (inContact && !hasPlayedThisPageview && Date.now() >= CHECKIN_UTC && sectionInView) {
        hasPlayedThisPageview = true;
        phase = 'cutting';
        cutDayIndex = dayIndexOf(Date.now());
        runSequenceReduced();
      }
      return;
    }

    if (!inContact) return;

    bounceStart = performance.now();
    downPhaseHandled = false;
    requestAnimationFrame(runBounceFrame);
  }

  // Post-cut, the scissors stay put (frozen closed) for the rest of the
  // calendar day the cut happened on, and are only taken off once the day
  // actually changes — checked wherever else the page already reacts to a
  // date change (dev:date-changed) or a layout pass that might coincide
  // with one (resize), rather than a dedicated timer of its own.
  function maybeRemoveScissorsForNewDay() {
    if (phase !== 'done' || cutDayIndex === null) return;
    if (dayIndexOf(Date.now()) !== cutDayIndex) {
      scissorsWrap.remove();
      // The knob's only purpose was pushing the scissors shut — once
      // they're gone for good (next calendar day), it has nothing left to
      // push on and no other reason to sit on the chip.
      knob.remove();
      cutDayIndex = null;
      // .timeline-section's own padding-top (styles/organisms/
      // timeline-panel.css) was grown well past its original size purely
      // to make room for the scissors/string assembly above the panel —
      // once that assembly is actually gone (not just cut, since the
      // frozen scissors still occupy that space for the rest of the cut
      // day), the extra room isn't needed anymore. Only shrinking it here
      // (not right when the cut fires) matters because reposition() has
      // already stopped recomputing the scissors' own position by then —
      // shrinking the padding any earlier would leave the still-visible,
      // no-longer-repositioned scissors visually stranded relative to a
      // panel that just moved up underneath them.
      section.classList.add('sc-post-cut');
    }
  }

  window.addEventListener('chute:ball-landed', onBallLanded);
  window.addEventListener('dev:date-changed', () => {
    renderRestingAngle();
    maybeRemoveScissorsForNewDay();
  });
  window.addEventListener('resize', () => {
    reposition();
    maybeRemoveScissorsForNewDay();
  });
  new ResizeObserver(reposition).observe(section);

  reposition();
  renderRestingAngle();
}
