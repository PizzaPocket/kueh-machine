// Organism: renders the redesigned Timeline section — a chrome control
// panel (.matte-metal-surface) holding two inset retro-rectangle windows:
// today's date + the spring (top), and a day-ruler "radio tuner" dial
// (bottom). Both are driven by the same elapsedFraction() value: the
// spring grows from a fixed anchor hidden behind the track's own edge to
// exactly the day-chip's position, and the dial's today-band sits at that
// same fraction along its own ruler — one marker seen at two heights.
//
// Stage 2 (buildRig, below): a pulley + procedural-batik-tendril string +
// hanging glass. The chip's free end feeds a horizontal string to a fixed
// pulley, which redirects it down to a convergence node that sinks
// further below the panel as `f` grows — the glass fills AND sinks as
// days tick on, two readouts of one number. Three strands fork off the
// node, each running rim→base down the tapered cup like a real basket
// sling, slowly twisting via their own requestAnimationFrame loop — see
// buildRig's own comments for the angle math and front/back layering.
// Mobile has no pulley (the string pulls straight down, since the chip
// only ever moves vertically there) — see setPositions's `mobile` flag.
//
// Stage 3: drop-chute.js's rolling ball dispatches 'chute:ball-landed'
// once it reaches the end of the chute — init() listens for that and
// runs a short bounce (glass down-and-back, chip in whichever direction
// the string currently pulls it) as an offset on top of whatever
// tick()/redraw() already computed, not a replacement for it.

import { createRetroShape, attachRetroShapeClip, updateRetroShape, observeRetroShape, SMALL_RETRO_SHAPE_OPTS } from '../atoms/retro-shape.js';
import { buildTailedRectPath } from '../tokens/superellipse.js';
import { wrapWithInnerMatteRim, wrapWithOuterMatteRim } from '../atoms/matte-rim.js';
import { buildGearPath, buildGearPoints } from '../tokens/gear-shape.js';
import { buildRivetRow } from '../atoms/rivets.js';
import { createSpringGraphic, updateSpringGraphic } from '../atoms/spring-graphic.js';
import { renderCecekLayer, TENDRIL_STROKE } from '../atoms/batik-pattern.js';
import { createSegment, renderSegment } from '../atoms/batik-segment.js';
import { buildFlourish, renderFlourish } from '../atoms/batik-flourish.js';
import { OUTER_RIM, OUTER_BASE } from '../tokens/glass-shape.js';
import { createGlassGraphic } from '../atoms/glass-graphic.js';
import { computeConicChromeLayers, applyLayeredConicChrome } from '../tokens/chrome-metal.js';
import { bounceFactor as sharedBounceFactor, BOUNCE_DURATION_MS } from '../atoms/bounce-timing.js';

// Same color approach as the hero wordmark's themed rims (KUEH_RIM_DARK/
// LIGHT, chrome-accents.js) — the day's theme color mixed toward
// black/white rather than the neutral metal-base/metal-highlight pair
// computeConicChromeLayers defaults to, so the chip's outline reads as
// the same "material" as the rest of the hero's chrome. Redeclared here
// rather than imported since .tl-day-chip is built and positioned
// entirely by this module, same precedent tab-group.js/site-nav.js set
// for their own conic rims.
const CHIP_RIM_DARK = 'color-mix(in srgb, var(--color-primary-strong) 90%, black)';
const CHIP_RIM_LIGHT = 'color-mix(in srgb, var(--color-primary-strong) 93%, white)';
const CHIP_RIM_PEAKS = [40, 165, 250];

// How far the chip's own box grows beyond its 56x40 rect to make room for
// the point (buildTailedRectPath) — shared with styles/organisms/
// timeline-panel.css's own --tl-chip-tail-length (set once in init()) so
// the geometry (this constant) and the CSS box-growth/centering math it
// has to match stay in sync from one source rather than two independently
// tuned numbers.
const CHIP_TAIL_LENGTH = 7;

// Same project window the hero countdown uses (index.html's inline
// script), redeclared independently here rather than shared across the
// classic-script/ES-module boundary — same precedent kueh-of-day.js's own
// getDayIndexSGT sets for recomputing one small date calculation.
const PROJECT_START_UTC = Date.UTC(2026, 5, 24); // 24 June 2026 kickoff
const CHECKIN_UTC = Date.UTC(2026, 6, 29, 6, 0, 0); // 29 July 2026 check-in, 2:00pm SGT
const TARGET_UTC = Date.UTC(2026, 7, 26, 6, 0, 0); // 26 August 2026 showcase

const DAY_MS = 86400000;
const SG_OFFSET_MS = 8 * 60 * 60 * 1000;
const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// The dial's tick grid is quantized to whole days (TARGET_UTC carries a
// 06:00 UTC time-of-day, PROJECT_START_UTC doesn't, so the true span is
// 63.25 days). Any other marker on the dial (the check-in tick, the
// spring's day chip) has to snap to this same whole-day grid too, rather
// than a continuous date-based fraction — the two fractions are close
// enough to look almost-but-not-quite aligned, which reads as a bug
// rather than a deliberate offset.
const DAY_COUNT = Math.max(1, Math.round((TARGET_UTC - PROJECT_START_UTC) / DAY_MS));

// The 3 "major" days (kickoff/check-in/showcase) already get their own full-
// height/width marker (.tl-dial-meeting-*) and their own label underneath
// the panel (.tl-labels) — a regular short tick + day-number at that same
// day would just double up on both, so buildDialTicks skips these indices.
const CHECKIN_DAY_INDEX = Math.min(DAY_COUNT, Math.max(0, Math.round((CHECKIN_UTC - PROJECT_START_UTC) / DAY_MS)));
const MAJOR_DAY_INDICES = new Set([0, CHECKIN_DAY_INDEX, DAY_COUNT]);

// Inset from each edge before the day-0/day-N tick, on both the spring
// track (chip's own start/end position, computed in px below) and the dial
// (--tl-day-inset, styles/organisms/timeline-panel.css's own .tl-dial-ticks)
// — one constant driving both, so the first/last day reads as inset by the
// same amount on the two windows rather than two independently-tuned values.
const DAY_AXIS_INSET = 14;

// A real spring is anchored to a fixed wall point, not to the first day's
// own tick — this is how far behind the track's own overflow-hidden edge
// (past the left edge on desktop, above the top edge on mobile) that
// anchor sits, permanently hidden, so the coil visibly emerges from
// outside the visible window rather than starting clean at the day-0
// mark like a floating decal. Only the anchor moves; the spring's free
// (moving) end keeps landing exactly at DAY_AXIS_INSET + the elapsed-
// fraction growth, same position the day-chip and dial ticks already
// agree on.
const SPRING_ANCHOR_OFFSET = 24;

// Today's own whole-day tick index (0..DAY_COUNT) — shared by
// elapsedFraction below (the spring/today-band position) and tick()'s own
// milestone check (is today's index one of MAJOR_DAY_INDICES), so both
// agree on exactly which tick "today" is without quantizing twice.
function currentDayIndex() {
  return Math.min(DAY_COUNT, Math.max(0, Math.round((Date.now() - PROJECT_START_UTC) / DAY_MS)));
}

// Elapsed/total, quantized to the same whole-day grid the ticks use (see
// DAY_COUNT above) — drives both the spring's own length and the dial's
// today-band position, so today's band always sits exactly on a tick
// rather than drifting slightly ahead of/behind one. The hero countdown's
// own liquid-fill (index.html's updateLiquidFill) is the *continuous*
// version of this same elapsed/total ratio, deliberately not quantized —
// that funnel's water level has no "one tick per day" grid to snap to.
function elapsedFraction() {
  return currentDayIndex() / DAY_COUNT;
}

// Same whole-day quantization as elapsedFraction, for a fixed date (the
// 29 July check-in mark) rather than "now".
function fractionOf(ms) {
  const days = Math.min(DAY_COUNT, Math.max(0, Math.round((ms - PROJECT_START_UTC) / DAY_MS)));
  return days / DAY_COUNT;
}

// The vertical center of `el`'s own glyph ink (in px, relative to el's own
// top edge) — used to line up .tl-label-date with its matching dial tick
// on mobile (see tick()'s own comment). A Range over the actual text
// content hugs the true glyph ink, top and bottom; centering on *that*
// (rather than el.offsetHeight/2, which centers the whole line box) is
// what keeps the label in step with the tick regardless of how much
// leading the font's line-height adds above/below the glyphs.
function getGlyphCenterOffset(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rect = range.getBoundingClientRect();
  const elTop = el.getBoundingClientRect().top;
  return (rect.top + rect.bottom) / 2 - elTop;
}

// Singapore date order (day before month) — split into two parts (day
// number, month abbreviation) rather than one "3 JUL" string, so the chip
// can stack them on two lines and read as a small square calendar-day
// badge instead of a wide pill.
function formatDayParts(ms) {
  const sgt = new Date(ms + SG_OFFSET_MS);
  return { day: sgt.getUTCDate(), month: MONTH_ABBR[sgt.getUTCMonth()] };
}

// Wraps `fillContent` in a white retro-rectangle window + matte rim, same
// pattern as kueh-of-day.js's buildContentWindow — untinted rim, since
// this panel's own .matte-metal-surface is a light neutral surface (not
// the hero countdown's solid theme-colored background, which motivated a
// tinted rim there).
//
// n: 8 (fixed, not auto-solved) — these windows are much shorter/wider
// than a typical retro-rectangle consumer, and solveClearingExponent's
// content-clearance solve would push the corner exponent toward its
// rectangular ceiling on a box this shape, reading as square corners
// instead of the intended swell — same fix SMALL_RETRO_SHAPE_OPTS uses
// for small controls.
// shadow: createRetroShape's default inner-shadow blur is tuned for a
// much taller window — on these ~26-46px-tall windows that wide a blur
// overlaps between the top and bottom edges, washing out into a faint
// uniform tint instead of a resolvable ring on the flat edges. A tighter
// blur keeps the ring visible on all four sides (see filterMarkup's own
// comment, retro-shape.js).
const THIN_WINDOW_SHADOW = { wideBlur: 12, wideOpacity: 0.55, tightBlur: 2.5, tightOpacity: 0.4 };

function buildWindow(fillContent) {
  const wrap = document.createElement('div');
  wrap.className = 'tl-window-fill';
  // --color-highlight-soft — same fill as --countdown-bg-color (index.html),
  // the countdown clock's own background layer sitting behind its liquid —
  // so these two windows read as the same "glass" material as that clock
  // rather than the plain white/cream .tl-window-fill previously used.
  const { svg, clipUrl, ...refs } = createRetroShape({ fill: 'var(--color-highlight-soft)', shadow: THIN_WINDOW_SHADOW });
  wrap.appendChild(svg);
  wrap.style.clipPath = clipUrl;
  wrap.appendChild(fillContent);
  return wrapWithInnerMatteRim(wrap, { gutter: 0, n: 8, fillRefs: refs });
}

// Same fill/shape build as buildWindow above, but rimmed with the dynamic
// cursor/scroll-reactive "liquid chrome" rim (applyLayeredConicChrome,
// tokens/chrome-metal.js) instead of the static matte rim, for the dial
// window specifically — the spring window keeps the plain matte rim.
// Same fixed n: 8 as buildWindow, so wrap/rim/glint each size
// independently off that value without needing a solved exponent shared
// via fillRefs.
function buildInteractiveWindow(fillContent) {
  const wrap = document.createElement('div');
  wrap.className = 'tl-window-fill';
  const { svg, clipUrl, ...refs } = createRetroShape({ fill: 'var(--color-highlight-soft)', shadow: THIN_WINDOW_SHADOW });
  wrap.appendChild(svg);
  wrap.style.clipPath = clipUrl;
  wrap.appendChild(fillContent);
  observeRetroShape(wrap, refs, { gutter: 0, n: 8 });

  const rim = document.createElement('div');
  rim.className = 'tl-dial-window-rim';
  const glintBand = applyLayeredConicChrome(rim, wrap, { peaks: [60, 180, 300] });
  attachRetroShapeClip(rim, { gutter: 0, n: 8 });
  attachRetroShapeClip(glintBand, { gutter: 0, n: 8 });

  return { el: rim };
}

// The spring is anchored to a fixed point hidden behind the track's own
// overflow-hidden edge (SPRING_ANCHOR_OFFSET, tick()) and grows to
// exactly the day-chip's position — not a fixed-width spring with only
// its coil openness varying. The chip is a small retro-rectangle badge
// (SMALL_RETRO_SHAPE_OPTS's own n/gutter, with a point spliced into one
// edge via buildTailedRectPath — see updateChipTail below), not a CSS
// pill, tinted to --color-primary-strong to match the dial's own
// today-band below — same color reading as "the same marker, seen at two
// heights."
//
// Built here but deliberately NOT appended into `track` — returned
// separately and appended by init() as a sibling of both rim-wrapped
// windows, for two reasons: it needs to visually overlap the track's
// window rather than being confined inside it (the track is much shorter
// than the chip), and `track` needs overflow: hidden to anchor the spring
// flush against its own edge — a descendant's clip-path doesn't render
// correctly inside an overflow: hidden ancestor combined with a
// transform (confirmed directly), so the chip just lives outside it.
function buildTopWindowContent() {
  const content = document.createElement('div');
  content.className = 'tl-top-window-fill';

  const track = document.createElement('div');
  track.className = 'tl-spring-track';

  const springRefs = createSpringGraphic();
  track.appendChild(springRefs.svg);

  content.appendChild(track);

  // `chip` (the element every position/left/top/bounce calculation below
  // targets) is now a plain unclipped wrapper — position/transform/
  // z-index and the drop-shadow filter live here, on `chipRim` (its own
  // child) is where the clip-path/background/padding actually live.
  // Split across two elements rather than one, because an element
  // carrying BOTH its own clip-path AND a filter: drop-shadow doesn't
  // reliably paint that shadow in Chrome (confirmed directly — the
  // filter computes fine per getComputedStyle, but paints nothing, even
  // for a wildly exaggerated test shadow) — moving the filter to an
  // unclipped ancestor sidesteps the bug entirely. chipRim fills `chip`
  // at 100%/100% (styles/organisms/timeline-panel.css), so its own box
  // is exactly what `chip`'s used to be — nothing else about the sizing
  // math changes.
  const chip = document.createElement('div');
  chip.className = 'tl-day-chip';
  const chipRim = document.createElement('div');
  chipRim.className = 'tl-day-chip-rim';
  chip.appendChild(chipRim);

  // A dedicated child span for the label (not chipFill.textContent
  // directly) — setting text that way would wipe out attachRetroShapeClip's
  // own defs-only <svg> child, leaving the clip-path pointing at a
  // now-detached shape.
  //
  // chipRim's 2px padding (.tl-day-chip-rim, timeline-panel.css) is the
  // rim's thickness, showing through as a thin themed-chrome ring between
  // its own clip-path and the inner .tl-day-chip-fill's (attached
  // separately, so it gets its own correctly-fitted shape at the smaller,
  // padded-in size).
  const chipFill = document.createElement('div');
  chipFill.className = 'tl-day-chip-fill';
  const chipLabel = document.createElement('span');
  chipLabel.className = 'tl-day-chip-label';
  chipLabel.textContent = 'Today';
  chipFill.appendChild(chipLabel);
  chipRim.appendChild(chipFill);

  // Not attachRetroShapeClip (which wires a fixed set of shape opts once
  // and never revisits them): the chip's own shape needs to flip which
  // edge carries its point when the layout crosses the mobile breakpoint
  // (tick()'s own isMobile check), and chipRim's box size never actually
  // changes between the two (it's always 100%/100% of `chip`, whose own
  // CSS has no mobile override to its underlying pixel size — see
  // .tl-day-chip's own CSS), so there's no resize for a ResizeObserver to
  // react to. updateChipTail (below) is what tick() calls instead, each
  // time it knows the current isMobile state.
  const chipShapeRefs = createRetroShape();
  chipRim.appendChild(chipShapeRefs.svg);
  chipRim.style.clipPath = chipShapeRefs.clipUrl;
  const chipFillShapeRefs = createRetroShape();
  chipFill.appendChild(chipFillShapeRefs.svg);
  chipFill.style.clipPath = chipFillShapeRefs.clipUrl;

  function updateChipTail(tailSide) {
    const opts = { ...SMALL_RETRO_SHAPE_OPTS, pathBuilder: buildTailedRectPath, tailSide, tailLength: CHIP_TAIL_LENGTH };
    updateRetroShape(chipRim, chipShapeRefs, opts);
    updateRetroShape(chipFill, chipFillShapeRefs, opts);
  }

  // A single themed rim, not the hero wordmark's double inner+outer stack
  // — one conic-gradient layer is enough for a small 2px-thick badge
  // outline. Static (not registered for cursor rotation), same reason as
  // the wordmark rims: it sits directly behind the fill at an exact
  // padded alignment, so a moving rim would read as a glitch rather than
  // a reflection.
  const { metal: chipRimMetal } = computeConicChromeLayers(CHIP_RIM_PEAKS, { darkVar: CHIP_RIM_DARK, lightVar: CHIP_RIM_LIGHT });
  chipRim.style.backgroundImage = chipRimMetal;

  return { content, track, springRefs, chip, updateChipTail };
}

// One real element per day (not a repeating-gradient illusion) — needed
// now that each tick can carry its own day-number label and the major days
// need to skip theirs. Position is a plain 0-100% custom property, same
// trick --today-position/--mid-position already use, so left (desktop) vs
// top (mobile) can read the same value — see styles/organisms/
// timeline-panel.css's own @media block for the axis swap. Built once (the
// fraction and label text are both fixed for the life of the page), inside
// .tl-dial-ticks, which is itself inset from .tl-dial's true edges (see
// that class's own CSS comment) — nesting here, rather than computing an
// inset offset per tick, is what keeps every tick, the meeting markers, and
// the today-band all agreeing on the same "day 0/day N" positions for free.
function buildDialTicks() {
  const wrap = document.createElement('div');
  wrap.className = 'tl-dial-ticks';

  const meetingStart = document.createElement('div');
  meetingStart.className = 'tl-dial-meeting tl-dial-meeting-start';
  const meetingMid = document.createElement('div');
  meetingMid.className = 'tl-dial-meeting tl-dial-meeting-mid';
  const meetingEnd = document.createElement('div');
  meetingEnd.className = 'tl-dial-meeting tl-dial-meeting-end';
  const today = document.createElement('div');
  today.className = 'tl-dial-today';
  wrap.append(meetingStart, meetingMid, meetingEnd, today);

  for (let i = 0; i <= DAY_COUNT; i++) {
    if (MAJOR_DAY_INDICES.has(i)) continue;
    const tick = document.createElement('div');
    tick.className = 'tl-dial-tick';
    tick.style.setProperty('--tl-tick-pos', `${(i / DAY_COUNT) * 100}%`);
    const num = document.createElement('span');
    num.className = 'tl-dial-tick-num';
    num.textContent = String(formatDayParts(PROJECT_START_UTC + i * DAY_MS).day).padStart(2, '0');
    tick.appendChild(num);
    wrap.appendChild(tick);
  }

  return wrap;
}

function buildBottomWindowContent() {
  const content = document.createElement('div');
  content.className = 'tl-bottom-window-fill';

  const dial = document.createElement('div');
  dial.className = 'tl-dial';
  dial.appendChild(buildDialTicks());
  content.appendChild(dial);

  return { content, dial };
}

// === Stage 2/3: pulley, string, hanging glass, landing bounce — desktop
// and mobile (mobile has no pulley: setPositions's own `mobile` flag runs
// the string straight from the chip to the node instead). ===

const SVG_NS = 'http://www.w3.org/2000/svg';

const PULLEY_GAP = 90; // px past the spring track's own right edge
// How close pulley 1's own rendered edge is ever allowed to sit to the true
// viewport edge — .container's max-width slack shrinks on ordinary desktop
// widths, and PULLEY_GAP alone (a flat +90px with no regard for how much
// room is actually left) can otherwise push the pulley past the visible
// viewport, where body's own overflow-x:hidden clips it. tick() clamps
// PULLEY_GAP down to whatever's actually available minus this safety
// margin, rather than letting pulleyX grow unbounded.
const PULLEY_EDGE_SAFETY = 24;
// Vertical counterpart to PULLEY_GAP for pulley 2 (below) — how far below
// the entire 3-line "26 August" label block (.tl-label-right) it sits.
const PULLEY2_LABEL_GAP = 12;
const BASE_DROP = 40; // px from pulley down to the convergence node, at f=0
const MAX_ADDITIONAL_DROP = 160; // extra px of sink by f=1 — same f as the spring/dial
// Mobile has no pulley, so none of the above applies there the same way:
// on desktop, the glass sinks further as `f` grows because more string
// pays out through the *fixed* pulley as the chip approaches it (a real
// conservation-of-string-length mechanism) — the chip's own horizontal
// travel and the string's own lengthening are two separate effects. On
// mobile there's no pulley to thread through; the chip *is* the string's
// only anchor, and it already travels down the track to show progress —
// making the string *also* lengthen with `f` would double up on that same
// signal for no physical reason. So the chip->node distance here is one
// fixed constant, not BASE_DROP + f*MAX_ADDITIONAL_DROP — the glass just
// hangs a constant distance below wherever the chip currently is.
// Grown past its original 120 to satisfy src/organisms/scissors-cut.js's
// own mobile rig: the cup's own lower edge needs to get within
// CONTACT_START_DISTANCE_PX (scissors-cut.js, shared with desktop) of the
// scissors' handles by ~27 July for that same shared threshold/logic to
// produce the same "flat until touch, closes fast over the final couple of
// days" shape desktop already has — not a separate mobile-only model, just
// the same one fed the right distance. Measured, not derived analytically.
const MOBILE_NODE_DROP = 189;
const NODE_TO_RIM_GAP = 44; // px of open air between the node (where the string forks) and the glass's own rim — per the mockup, the cup hangs a visible distance below where the three strands diverge, not flush against it
const BASE_STRAND_OVERSHOOT_PX = 2; // each strand's own base attachment point is nudged this far past the base ellipse (not the flourish anchor, just the drawn segment) so the line visibly covers the bottom rim rather than stopping exactly at its edge
const TWIST_PERIOD_S = 36; // one full wind-unwind-wind cycle
const MAX_TWIST_RAD = (30 * Math.PI) / 180;
// 90°/210°/330° (not the "natural" 0°/120°/240°) so, at rest, the center
// strand sits dead center-back (tucked behind the glass) and the other
// two sit symmetric left/right, slightly toward the viewer. The glass is
// viewed from slightly above, so the near/front half of both the rim and
// base ellipses is their lower arc (larger y) — depth below is defined so
// depth > 0 matches that lower arc.
const STRAND_PHASE_OFFSETS = [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6];
const CECEK_DOT_SPACING = 9;
// Neither of batik-pattern.js's two cecek options is quite right here:
// 'plain' (--color-primary-strong) stays a fixed, moderately-dark
// lightness across every theme — only hue rotates, so the dots would
// never read as light. 'tinted' (--color-surface) is genuinely light but
// near-white, almost invisible against this panel's light neutral metal.
// --color-highlight is light AND still hue-varying per theme, while
// staying visually distinct from the stroke's own --color-accent.
const CECEK_FILL = 'var(--color-highlight)';

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

const PULLEY_FACE_SIZE = 18; // px diameter of the gear itself, before the outer rim's own outset grows it
const PULLEY_TEETH = 8;
// buildGearPoints's own default (0.62) reads as too long/spiky at this
// small a size — 0.8 keeps the root much closer to the outer radius, for
// short, stubby teeth instead. Passed to both the gear path below and the
// outer rim's own pointsBuilder call, so the rim frame grows around the
// same shorter silhouette rather than the default's longer one.
const PULLEY_GEAR_ROOT_RATIO = 0.8;

// Real pulleys turn on a fixed axle — the string runs tangent to the
// wheel, not through its center — so the visible knob sits offset
// down-and-left of the point the string actually bends around
// (setPositions's own `pulley1` point, unchanged): the string wraps around
// the knob's top-right quarter instead of appearing to pass through its
// middle.
const PULLEY_KNOB_OFFSET_X = -7;
const PULLEY_KNOB_OFFSET_Y = 7;
// Pulley 2's own knob is mirrored horizontally from pulley 1's — the
// string arrives at pulley 2 from the opposite side (pulley 1 sits up and
// to the right of it, not up and to the left, the way the chip sits
// relative to pulley 1), so its axle needs to sit up-and-*left* of the
// knob instead, wrapping the knob's top-left quarter rather than top-right.
const PULLEY2_KNOB_OFFSET_X = 7;
const PULLEY2_KNOB_OFFSET_Y = 7;

function buildPulley() {
  // A plain HTML div, not an <svg> — CSS conic-gradient() (styles/
  // organisms/timeline-panel.css's own .tl-pulley-gear) is what gives the
  // gear's own metallic sweep its rotating light/dark bands; SVG has no
  // native conic-gradient paint server, so the gear's own silhouette is
  // applied as a CSS clip-path instead of an SVG fill, painted with a real
  // conic-gradient background underneath. wrapWithOuterMatteRim works the
  // same either way (it just reads fillEl's own getBoundingClientRect()).
  const face = document.createElement('div');
  face.classList.add('tl-pulley-face');

  const gear = document.createElement('div');
  gear.classList.add('tl-pulley-gear');
  gear.style.clipPath = `path('${buildGearPath({
    width: PULLEY_FACE_SIZE,
    height: PULLEY_FACE_SIZE,
    teeth: PULLEY_TEETH,
    rootRatio: PULLEY_GEAR_ROOT_RATIO,
  })}')`;
  face.appendChild(gear);

  // A raised collar/boss around the hub — real gears usually have one
  // between the center bore and where the teeth actually start. Same
  // linear-gradient recipe as the gear's own outer rim (.rim-matte-outer,
  // styles/atoms.css — reused directly in .tl-pulley-inner-rim, styles/
  // organisms/timeline-panel.css) but with no drop-shadow of its own
  // (.tl-pulley's filter is what shadows the *outer* rim; this one sits
  // flush on the gear's own face, not lifted off it).
  const innerRim = document.createElement('div');
  innerRim.classList.add('tl-pulley-inner-rim');
  face.appendChild(innerRim);

  // Every real spur gear turns on a center hub/axle — a small rivet-like
  // dot (.tl-pulley-hub's own radial-gradient, styles/organisms/
  // timeline-panel.css — the exact same recipe as .metal-rivet elsewhere
  // on this panel), not the gear's own conic sweep, so it reads as a
  // separate raised bolt rather than just a smaller slice of the gear's
  // own material.
  const hub = document.createElement('div');
  hub.classList.add('tl-pulley-hub');
  face.appendChild(hub);

  // Traces the gear's own tooth silhouette (buildGearPoints), not a plain
  // circle. outset: 2 — tried 3 first for more margin at the valleys
  // between teeth (a flat per-point outset, per buildGearPath's own
  // comment, isn't a true constant-width offset on a concave/spiky shape,
  // so it runs thinner there than at the tips already), but that read as
  // too thick overall; 2 is the better balance of the two.
  const { el } = wrapWithOuterMatteRim(face, {
    pointsBuilder: buildGearPoints,
    teeth: PULLEY_TEETH,
    rootRatio: PULLEY_GEAR_ROOT_RATIO,
    outset: 2,
  });
  el.classList.add('tl-pulley');
  return el;
}

// The 6 rim/base strand segments need per-frame opacity + stroke-width
// (the "swinging behind/in front of the glass" depth cue) — a thin custom
// wrapper around the same tendril/cecek visual language rather than a new
// one, since renderTendril itself hardcodes a fixed stroke-width.
function renderStrandSegment({ d, dots }, opacity, strokeWidth) {
  return (
    `<g style="opacity:${opacity.toFixed(2)}">` +
    `<path class="batik-tendril" d="${d}" fill="none" stroke="${TENDRIL_STROKE}" stroke-width="${strokeWidth.toFixed(2)}" stroke-linecap="round"/>` +
    renderCecekLayer(dots, CECEK_FILL) +
    `</g>`
  );
}

function buildRig() {
  const pulley1El = buildPulley();
  const pulley2El = buildPulley();

  const backSvg = document.createElementNS(SVG_NS, 'svg');
  backSvg.classList.add('tl-rig-strings', 'tl-rig-strings-back');
  const frontSvg = document.createElementNS(SVG_NS, 'svg');
  frontSvg.classList.add('tl-rig-strings', 'tl-rig-strings-front');

  const glassGraphic = createGlassGraphic();
  glassGraphic.el.classList.add('tl-glass');

  // 0 — every segment here is under tension (a real string pulled taut by
  // the chip/pulley/hanging glass, not a loose decorative vine), so a
  // dead-straight line rather than tendrilSegment's own curled default.
  const chipToPulley = createSegment(0);
  // Runs between the two fixed pulleys — desktop only (see redraw()'s own
  // isMobileMode branch below, same as chipToPulley).
  const pulley1ToPulley2 = createSegment(0);
  const pulleyToNode = createSegment(0); // pulley 2 -> node on desktop, chip -> node on mobile
  const strands = [0, 1, 2].map(() => ({
    nodeToRim: createSegment(0),
    rimToBase: createSegment(0),
  }));

  // 3-6 batik motifs sprouting off the string, scattered randomly across
  // *every* segment — the fixed ones (chip->pulley1, pulley1->pulley2,
  // pulley->node) and all three diverging strands wrapping the glass
  // (node->rim, rim->base each) — picked once here, not re-rolled per tick,
  // so they don't jump to a different spot/shape every resize. No segment
  // is excluded: the cup-wrap strands are just as fair game as the rest of
  // the string.
  const chipToPulleyFlourishes = [];
  const pulley1ToPulley2Flourishes = [];
  const pulleyToNodeFlourishes = [];
  const strandFlourishes = [0, 1, 2].map(() => ({ nodeToRim: [], rimToBase: [] }));
  const flourishSlots = [
    chipToPulleyFlourishes,
    pulley1ToPulley2Flourishes,
    pulleyToNodeFlourishes,
    ...strandFlourishes.flatMap((s) => [s.nodeToRim, s.rimToBase]),
  ];
  const flourishCount = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < flourishCount; i++) {
    flourishSlots[Math.floor(Math.random() * flourishSlots.length)].push(buildFlourish());
  }

  // Scaled from the artwork's own real rim/base ellipses (src/tokens/
  // glass-shape.js — derived directly from the back-layer SVG's own path
  // data, not guessed) — glassGraphic renders at a fixed pixel size, so a
  // constant native-viewBox-to-rendered-pixels scale factor is all that's
  // needed, computed once here rather than every frame.
  const scaleX = glassGraphic.width / 200;
  const scaleY = glassGraphic.height / 141;
  const rim = {
    cx: OUTER_RIM.cx * scaleX,
    cy: OUTER_RIM.cy * scaleY,
    rx: OUTER_RIM.rx * scaleX,
    ry: OUTER_RIM.ry * scaleY,
  };
  const base = {
    cx: OUTER_BASE.cx * scaleX,
    cy: OUTER_BASE.cy * scaleY,
    rx: OUTER_BASE.rx * scaleX,
    ry: OUTER_BASE.ry * scaleY,
  };

  let chipPoint = null;
  let pulley1Point = null;
  let pulley2Point = null;
  let nodePoint = null;
  let isMobileMode = false;
  let bounceOffsetY = 0; // px, see setBounceOffset — the landing bounce's own node/glass offset
  let chipBounceOffset = 0; // px, see setChipBounceOffset — the chip's own (smaller, separate) bounce offset
  const twistStart = performance.now();

  function setBounceOffset(px) {
    bounceOffsetY = px;
  }

  // A taut string pulled by a bouncing weight doesn't just move past
  // wherever it's pinned — the whole run reacts, chip end included (the
  // string is what's tugging the chip in the first place). isMobileMode
  // decides the axis (mobile's chip bounces vertically; desktop's
  // horizontally) — same convention as init()'s own chip-position code.
  function setChipBounceOffset(px) {
    chipBounceOffset = px;
  }

  // `mobile`: no pulleys — the string already pulls straight down on
  // mobile (the chip only ever moves vertically there), so there's
  // nothing to redirect. `pulley1`/`pulley2` are ignored when mobile; the
  // segment that would normally run pulley2→node instead runs chip→node
  // directly (reusing `pulleyToNode`/`pulleyToNodeFlourishes` as-is — see
  // redraw() below — rather than a third, mostly-duplicate segment/
  // flourish set).
  function setPositions(mobile, chip, pulley1, pulley2, node) {
    isMobileMode = mobile;
    chipPoint = chip;
    pulley1Point = mobile ? chip : pulley1;
    pulley2Point = mobile ? chip : pulley2;
    nodePoint = node;
    pulley1El.style.display = mobile ? 'none' : '';
    pulley2El.style.display = mobile ? 'none' : '';
    if (!mobile) {
      // Offset the visible knob only — pulley1Point/pulley2Point (the
      // string's actual bend points) stay at the true axle positions set
      // above.
      pulley1El.style.left = `${pulley1[0] + PULLEY_KNOB_OFFSET_X}px`;
      pulley1El.style.top = `${pulley1[1] + PULLEY_KNOB_OFFSET_Y}px`;
      pulley2El.style.left = `${pulley2[0] + PULLEY2_KNOB_OFFSET_X}px`;
      pulley2El.style.top = `${pulley2[1] + PULLEY2_KNOB_OFFSET_Y}px`;
    }
  }

  function redraw() {
    if (!chipPoint) return;

    let frontMarkup = '';
    let backMarkup = '';

    const t = (performance.now() - twistStart) / 1000;
    const twist = MAX_TWIST_RAD * Math.sin((2 * Math.PI * t) / TWIST_PERIOD_S);

    // Every run below is built off these two bounced world points, not
    // the raw chipPoint/nodePoint — the whole taut string (chip all the
    // way through to the node) moves together during the landing bounce,
    // not just the node/glass end of it (see setChipBounceOffset above).
    const chipWorld = isMobileMode
      ? [chipPoint[0], chipPoint[1] + chipBounceOffset]
      : [chipPoint[0] + chipBounceOffset, chipPoint[1]];
    const nodeWorld = [nodePoint[0], nodePoint[1] + bounceOffsetY];

    if (!isMobileMode) {
      const seg1 = chipToPulley.compute(chipWorld, pulley1Point);
      frontMarkup +=
        renderSegment(seg1, CECEK_FILL) +
        chipToPulleyFlourishes.map((f) => renderFlourish(chipWorld, pulley1Point, f, CECEK_FILL)).join('');

      // This span's own endpoints are the two fixed pulley axles — they
      // never move, landing bounce or not, so unlike seg1/seg3 there's no
      // endpoint shift for its dots to react to. But it isn't a dead length
      // of string either: it's the middle of one taut line the cup is
      // tugging against the spring, so as the chip gets pulled toward
      // pulley1 (chipBounceOffset, same tug feeding seg1's shrink and
      // seg3's stretch below), the string is physically sliding through
      // this span too. Feed that same offset in as a dot-pattern phase so
      // the visible dots slide along with it instead of sitting frozen
      // while the rest of the string bounces around them.
      const seg2 = pulley1ToPulley2.compute(pulley1Point, pulley2Point, chipBounceOffset);
      frontMarkup +=
        renderSegment(seg2, CECEK_FILL) +
        pulley1ToPulley2Flourishes.map((f) => renderFlourish(pulley1Point, pulley2Point, f, CECEK_FILL)).join('');
    }
    // pulley2Point is chipWorld's own un-bounced alias on mobile (see
    // setPositions) — swapped in for chipWorld here so this run starts
    // from the bounced chip on mobile, same as the real pulley 2 (fixed,
    // untouched) does on desktop.
    const runStart = isMobileMode ? chipWorld : pulley2Point;
    const seg3 = pulleyToNode.compute(runStart, nodeWorld);
    frontMarkup +=
      renderSegment(seg3, CECEK_FILL) +
      pulleyToNodeFlourishes.map((f) => renderFlourish(runStart, nodeWorld, f, CECEK_FILL)).join('');

    // NODE_TO_RIM_GAP holds the glass a fixed distance below the node —
    // without it, the glass's own rim sits exactly at the node's height,
    // and the three strands would fork with zero visible travel before
    // reaching it (not what the mockup shows: a clear gap of open string
    // between where the single strand forks and where the cup actually
    // hangs, the string visibly under tension from the cup's own weight).
    // Built off nodeWorld (already bounced above), so the glass and the
    // node it hangs from move together as one unit during the bounce.
    const glassOriginX = nodeWorld[0] - rim.cx;
    const glassOriginY = nodeWorld[1] + NODE_TO_RIM_GAP - rim.cy;

    strands.forEach((strand, i) => {
      const theta = STRAND_PHASE_OFFSETS[i] + twist;
      // y = cy - ry*sin(theta) below, so sin(theta) < 0 <=> the lower arc
      // (larger y) <=> the near/front side, since we're looking down at
      // the opening facing us. depth is defined as the negation so
      // depth > 0 consistently means "near" for the opacity/strokeWidth/
      // front-vs-back split right below.
      const depth = -Math.sin(theta);
      const rimWorld = [glassOriginX + rim.cx + rim.rx * Math.cos(theta), glassOriginY + rim.cy - rim.ry * Math.sin(theta)];
      const baseWorld = [glassOriginX + base.cx + base.rx * Math.cos(theta), glassOriginY + base.cy - base.ry * Math.sin(theta)];
      // Segment-only endpoint, extended a couple px past baseWorld — the
      // flourishes still anchor to the true baseWorld point (their bloom
      // should sit right at the rim, not float below it).
      const baseSegmentWorld = [baseWorld[0], baseWorld[1] + BASE_STRAND_OVERSHOOT_PX];

      // Floor raised again, now to 0.75 at full "back" — still reads as
      // farther away without washing the back strand out.
      const opacity = 0.875 + 0.125 * depth;
      const strokeWidth = 2 * (0.85 + 0.15 * depth);

      const fl = strandFlourishes[i];
      const flourishMarkup =
        fl.nodeToRim.map((f) => renderFlourish(nodeWorld, rimWorld, f, CECEK_FILL)).join('') +
        fl.rimToBase.map((f) => renderFlourish(rimWorld, baseWorld, f, CECEK_FILL)).join('');

      const markup =
        renderStrandSegment(strand.nodeToRim.compute(nodeWorld, rimWorld), opacity, strokeWidth) +
        renderStrandSegment(strand.rimToBase.compute(rimWorld, baseSegmentWorld), opacity, strokeWidth) +
        (flourishMarkup ? `<g style="opacity:${opacity.toFixed(2)}">${flourishMarkup}</g>` : '');

      if (depth >= 0) frontMarkup += markup;
      else backMarkup += markup;
    });

    frontSvg.innerHTML = frontMarkup;
    backSvg.innerHTML = backMarkup;
    glassGraphic.el.style.transform = `translate(${glassOriginX}px, ${glassOriginY}px)`;
  }

  // The twist itself is slow (TWIST_PERIOD_S, ±MAX_TWIST_RAD) — redrawing
  // the string/glass at every display refresh is far more often than that
  // motion needs to read as smooth, and each redraw rebuilds/re-parses two
  // SVGs' worth of markup, the most expensive per-frame work in this
  // module. Skipping to every 3rd rAF tick (~20fps on a 60Hz display)
  // cuts that cost by 3x with no visible difference at this speed.
  const REDRAW_FRAME_SKIP = 3;
  let rafId = null;
  function startLoop() {
    if (rafId || prefersReducedMotion) return;
    let frameCount = 0;
    const frame = () => {
      frameCount++;
      if (frameCount % REDRAW_FRAME_SKIP === 0) redraw();
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  return {
    pulley1El,
    pulley2El,
    backSvg,
    frontSvg,
    glassEl: glassGraphic.el,
    setFill: glassGraphic.setFill,
    dropIntoLiquid: glassGraphic.dropIntoLiquid,
    setPositions,
    setBounceOffset,
    setChipBounceOffset,
    redraw,
    startLoop,
    stopLoop,
  };
}

export function init() {
  const section = document.getElementById('timeline');
  const mount = section && section.querySelector('.tl-mount');
  if (!section || !mount) return;

  const labelsCol = section.querySelector('.tl-labels');
  const labelLeft = section.querySelector('.tl-label-left');
  const labelMid = section.querySelector('.tl-label-mid');
  const labelRight = section.querySelector('.tl-label-right');

  section.style.setProperty('--mid-position', `${(fractionOf(CHECKIN_UTC) * 100).toFixed(3)}%`);
  section.style.setProperty('--tl-day-inset', `${DAY_AXIS_INSET}px`);
  section.style.setProperty('--tl-chip-tail-length', `${CHIP_TAIL_LENGTH}px`);

  const layout = document.createElement('div');
  layout.className = 'tl-panel-layout';

  const top = buildTopWindowContent();
  const { el: topRim } = buildWindow(top.content);
  layout.appendChild(topRim);

  const bottom = buildBottomWindowContent();
  const { el: bottomRim } = buildInteractiveWindow(bottom.content);
  layout.appendChild(bottomRim);

  // Pulley 2's own x anchor (see tick()'s desktop branch, below) — the
  // dial's real "26 August" tick mark, not the .tl-label-right text block
  // (which only supplies pulley 2's y). Queried now since buildDialTicks
  // has just built it as part of bottom.content, above.
  const dialMeetingEnd = layout.querySelector('.tl-dial-meeting-end');

  // Appended directly to `layout`, not into the top window — see
  // buildTopWindowContent's own comment for why the chip needs to live
  // outside both the window's clip-path and the track's overflow:hidden.
  // `layout` is `position: relative` (styles/organisms/timeline-panel.css)
  // so the chip's own absolute left/top (set in tick(), below) resolves
  // against it.
  layout.appendChild(top.chip);

  // Stage 2 rig (pulley/string/glass) — same reasoning as the chip: lives
  // at `layout` level, positioned every tick() via getBoundingClientRect
  // math. Renders on both desktop and mobile now (Stage 3) — mobile has
  // no pulley (rig.setPositions's own `mobile` flag hides it and skips
  // straight to a chip→node segment). z-index (styles/organisms/
  // timeline-panel.css) — not DOM order — is what actually layers the
  // glass between the string's near/far-side copies.
  const rig = buildRig();
  layout.append(rig.backSvg, rig.glassEl, rig.frontSvg, rig.pulley1El, rig.pulley2El);

  mount.innerHTML = '';
  mount.appendChild(layout);

  // Bottom rivet row removed — src/organisms/scissors-cut.js's own grommet
  // row now sits along this same section's bottom edge, and the two
  // visually conflicted (raised bolts and punched holes sharing the same
  // strip). Top row stays.
  const topRivets = buildRivetRow();
  topRivets.classList.add('metal-rivet-row-top');
  section.append(topRivets);

  // Landing bounce (Stage 3) — triggered by drop-chute.js's
  // 'chute:ball-landed' once the rolling ball reaches the end of the
  // chute. A short damped bounce applied as an *offset* on top of
  // whatever position tick()/rig.redraw() already computed — lastChipX/
  // Y/IsMobile below cache tick()'s last-computed base chip position so
  // each bounce frame adds its offset to that same base, rather than
  // compounding onto an already-bounced value.
  const BOUNCE_GLASS_PX = 6; // glass: straight down and back
  const BOUNCE_CHIP_PX = 5; // chip: whatever direction the string currently pulls it
  let bounceStart = null;
  let lastChipX = 0;
  let lastChipY = 0;
  let lastIsMobile = false;
  let lastTodayPercent = 0;
  // tick()'s own last-computed base spring width/stretch/thickness — the
  // rig isn't the only thing that should bounce: the spring is the
  // string's actual physical source, so it needs to stretch by that same
  // BOUNCE_CHIP_PX offset in step with the chip each bounce frame (see
  // applyBounce below), not stay frozen at its pre-bounce length while
  // the chip it's supposedly attached to jumps away from it.
  let lastSpringLength = 0;
  let lastStretchFraction = 0;
  let lastThickness = 0;

  // Curve itself lives in ../atoms/bounce-timing.js — shared with
  // scissors-cut.js so both bounce-driven offsets (this one and the
  // scissors' own angle delta) peak in exactly the same frame, since both
  // fire off the same chute:ball-landed event.
  function bounceFactor() {
    if (bounceStart === null) return 0;
    const elapsed = performance.now() - bounceStart;
    if (elapsed >= BOUNCE_DURATION_MS) {
      bounceStart = null;
      return 0;
    }
    return sharedBounceFactor(elapsed);
  }

  function applyBounce() {
    const factor = bounceFactor();
    rig.setBounceOffset(factor * BOUNCE_GLASS_PX);
    // Same offset the chip's own DOM position gets below — the taut
    // string is what's tugging the chip, so the chip->pulley->node run
    // has to move with it too, not just the node/glass end (see
    // buildRig's own setChipBounceOffset).
    rig.setChipBounceOffset(factor * BOUNCE_CHIP_PX);
    rig.redraw();
    if (lastIsMobile) {
      top.chip.style.top = `${lastChipY + factor * BOUNCE_CHIP_PX}px`;
    } else {
      top.chip.style.left = `${lastChipX + factor * BOUNCE_CHIP_PX}px`;
    }
    // The spring's own free end is the chip, so it stretches by the same
    // px offset the chip just moved by, same momentum, same timing — the
    // anchor end (SPRING_ANCHOR_OFFSET behind the track's own edge) never
    // moves, only the rendered length does.
    updateSpringGraphic(top.springRefs, {
      stretchFraction: lastStretchFraction,
      width: Math.max(1, lastSpringLength + factor * BOUNCE_CHIP_PX),
      height: lastThickness,
    });
    // The dial's today-band is the same marker as the chip, seen at
    // another height (see .tl-dial-today's own CSS comment), so it should
    // bounce along with it at the same offset/timing. calc() lets the
    // same px offset land on top of the base percentage without
    // converting that percentage to px by hand.
    const bouncePx = (factor * BOUNCE_CHIP_PX).toFixed(2);
    section.style.setProperty('--today-position', `calc(${lastTodayPercent.toFixed(3)}% + ${bouncePx}px)`);
    if (bounceStart !== null) requestAnimationFrame(applyBounce);
  }

  function triggerBounce() {
    if (prefersReducedMotion) return;
    bounceStart = performance.now();
    requestAnimationFrame(applyBounce);
  }

  // drop-chute.js's own long fall ends right at this glass's own top edge
  // (see its spawnFall) — dropIntoLiquid takes the ball the rest of the
  // way (behind the front accents, down to the current liquid surface) at
  // that same terminal speed (event.detail.terminalSpeed, px/ms — absent
  // under prefers-reduced-motion, dropIntoLiquid falls back to a plain
  // default duration then), then triggerBounce runs once that finishes,
  // not immediately.
  window.addEventListener('chute:ball-landed', (event) => {
    rig.dropIntoLiquid(event.detail && event.detail.terminalSpeed, triggerBounce);
  });

  function tick() {
    const f = elapsedFraction();
    const isMobile = window.innerWidth <= 640;

    // Bottom-pointing on desktop (down at the dial's own today-band,
    // directly below), right-pointing on mobile (at the day track,
    // parallel to the right of this one) — see buildTailedRectPath's own
    // comment. The chip element itself never rotates (only repositioned
    // along a different axis, per the mobile branches below), so its
    // shape has to flip which edge carries the point instead.
    top.updateChipTail(isMobile ? 'right' : 'bottom');

    // The spring is always generated in its own logical "long x thin"
    // orientation (matching src/tokens/spring.js's own horizontal
    // formulas) — on mobile the *track* is tall and narrow, but the
    // generated SVG itself stays long-and-thin and gets visually rotated
    // 90deg on top, rather than teaching spring.js a second axis.
    // Anchored SPRING_ANCHOR_OFFSET px behind the track's own start (left
    // edge desktop, top edge mobile — hidden by its overflow-hidden clip)
    // and grown to reach exactly the day-chip's position — not a
    // fixed-length spring with only its coil openness varying — so the
    // chip sitting at that same length reads as "the spring's own free
    // end," not a separately-positioned label.
    // Read directly from the track's own cross-axis size (not a separate
    // hardcoded constant) so the rendered coil height always matches
    // .tl-spring-track's actual CSS height (width on mobile) exactly,
    // with nothing to keep in sync by hand.
    const thickness = isMobile ? top.track.clientWidth : top.track.clientHeight;
    const trackLength = isMobile ? top.track.clientHeight : top.track.clientWidth;
    // Anchored DAY_AXIS_INSET px in from the track's own start, and grown
    // over the remaining (trackLength - 2*inset) — not the track's full raw
    // length — so day 0 sits inset from the edge same as the dial's own
    // first tick, and day DAY_COUNT (f=1) lands inset from the far edge
    // rather than flush against it.
    const growthLength = Math.max(1, trackLength - 2 * DAY_AXIS_INSET);
    // The free end's own position along the track, in px from the
    // track's start — this is the same value the day-chip/dial ticks
    // already agree on (DAY_AXIS_INSET-inset, growing over growthLength),
    // untouched by the anchor move below.
    const freeEndOffset = DAY_AXIS_INSET + growthLength * f;
    // The rendered coil spans from the hidden anchor (SPRING_ANCHOR_OFFSET
    // behind the track's own start) to that free end, so it's longer than
    // freeEndOffset alone by that fixed anchor offset — see
    // SPRING_ANCHOR_OFFSET's own comment.
    const springLength = Math.max(1, freeEndOffset + SPRING_ANCHOR_OFFSET);
    updateSpringGraphic(top.springRefs, { stretchFraction: f, width: springLength, height: thickness });
    lastSpringLength = springLength;
    lastStretchFraction = f;
    lastThickness = thickness;

    const svgStyle = top.springRefs.svg.style;
    if (isMobile) {
      svgStyle.left = `calc(50% + ${thickness / 2}px)`;
      svgStyle.top = `${-SPRING_ANCHOR_OFFSET}px`;
      svgStyle.transformOrigin = '0 0';
      svgStyle.transform = 'rotate(90deg)';
    } else {
      svgStyle.left = `${-SPRING_ANCHOR_OFFSET}px`;
      svgStyle.top = '50%';
      svgStyle.transformOrigin = '';
      svgStyle.transform = 'translateY(-50%)';
    }

    // Real getBoundingClientRect() math (not a percentage) rather than
    // reading track's own clientWidth/left — the chip lives outside the
    // track now (see above), so its position has to be computed relative
    // to `layout`, the nearest ancestor it shares with the track. This is
    // also what makes the chip line up with the dial's own today-band
    // exactly IF (and only if) the two windows share the same left/right
    // padding (styles/organisms/timeline-panel.css) — same math, same
    // reference width, on both.
    const layoutRect = layout.getBoundingClientRect();
    const trackRect = top.track.getBoundingClientRect();
    if (isMobile) {
      const chipX = trackRect.left + trackRect.width / 2 - layoutRect.left;
      const chipY = trackRect.top + freeEndOffset - layoutRect.top;
      top.chip.style.left = `${chipX}px`;
      top.chip.style.top = `${chipY}px`;
      lastChipX = chipX;
      lastChipY = chipY;
      lastIsMobile = true;

      // Mobile rig — no pulley: the string already pulls straight down,
      // since the mobile chip only ever moves vertically (down the
      // spring track). A fixed length (MOBILE_NODE_DROP), not desktop's
      // own BASE_DROP + f*MAX_ADDITIONAL_DROP growth — see that
      // constant's own comment for why the two aren't the same thing
      // here (no pulley means no conservation-of-string-length effect to
      // account for; the chip's own travel down the track is already the
      // whole story).
      const nodeX = chipX;
      const nodeY = chipY + MOBILE_NODE_DROP;
      rig.setPositions(true, [chipX, chipY], null, null, [nodeX, nodeY]);
      rig.setFill(f);
      rig.redraw();
      rig.startLoop();
    } else {
      const chipX = trackRect.left + freeEndOffset - layoutRect.left;
      const chipY = trackRect.top + trackRect.height / 2 - layoutRect.top;
      top.chip.style.left = `${chipX}px`;
      top.chip.style.top = `${chipY}px`;
      lastChipX = chipX;
      lastChipY = chipY;
      lastIsMobile = false;

      // Stage 2 rig — pulley 1 sits a fixed gap past the track's own right
      // edge, at the chip's same y (a clean horizontal string), clamped so
      // it never renders past the true viewport edge (.container's own
      // max-width slack shrinks on ordinary desktop widths, and PULLEY_GAP
      // alone had no regard for how much room was actually left).
      const availableGap = window.innerWidth - trackRect.right - PULLEY_EDGE_SAFETY;
      const pulleyGap = Math.max(0, Math.min(PULLEY_GAP, availableGap));
      const pulleyX = trackRect.right - layoutRect.left + pulleyGap;
      const pulleyY = chipY;

      // Pulley 2 hangs the string's redirect under the dial's own "26
      // August" tick (.tl-dial-meeting-end) — not the .tl-label-right text
      // block, which only supplies its y (a fixed gap below the entire
      // 3-line label). The convergence node sinks further below pulley 2 as
      // `f` grows (same value stretching the spring above — string pays out
      // through the fixed pulleys), which is what sinks the glass further
      // below the panel as days tick on.
      const meetingEndRect = dialMeetingEnd.getBoundingClientRect();
      const pulley2X = meetingEndRect.left + meetingEndRect.width / 2 - layoutRect.left;
      const labelRightRect = labelRight.getBoundingClientRect();
      const pulley2Y = labelRightRect.bottom - layoutRect.top + PULLEY2_LABEL_GAP;

      const nodeX = pulley2X;
      const nodeY = pulley2Y + BASE_DROP + f * MAX_ADDITIONAL_DROP;
      rig.setPositions(false, [chipX, chipY], [pulleyX, pulleyY], [pulley2X, pulley2Y], [nodeX, nodeY]);
      rig.setFill(f);
      rig.redraw();
      rig.startLoop();
    }

    lastTodayPercent = f * 100;
    section.style.setProperty('--today-position', `${lastTodayPercent.toFixed(3)}%`);

    // Mobile only: desktop positions labels horizontally (left/right +
    // --mid-position, styles/organisms/timeline-panel.css), untouched
    // here. On mobile the labels column runs parallel to the dial, and
    // each label's own *date* line (its primary text) needs to line up
    // with the matching tick — not the label block's own vertical
    // center, which is what a plain top:X% + translateY(-50%) gives you,
    // and visibly drifts from the tick once the date has two more lines
    // of text stacked under it pulling that center down.
    if (isMobile && labelsCol) {
      const colHeight = labelsCol.clientHeight;
      // Same DAY_AXIS_INSET the dial's own ticks are inset by (see
      // .tl-dial-ticks) — day 0/day DAY_COUNT's ticks sit inset from
      // colHeight's true top/bottom now, not at the raw 0%/100%, so the
      // matching label's target has to move in by the same amount or it
      // drifts back out of alignment with its own tick.
      const insetSpan = Math.max(1, colHeight - 2 * DAY_AXIS_INSET);
      [
        [labelLeft, 0],
        [labelMid, fractionOf(CHECKIN_UTC)],
        [labelRight, 1],
      ].forEach(([label, fraction]) => {
        const dateEl = label && label.querySelector('.tl-label-date');
        if (!dateEl) return;
        const targetY = DAY_AXIS_INSET + insetSpan * fraction;
        // The label's own glyph-ink vertical center, not its box's — see
        // feedback memory. offsetHeight/2 (the old approach) centers the
        // whole line box, which sits visibly off the tick whenever the
        // font's line-height adds leading above/below the glyphs;
        // getGlyphCenterOffset centers on the actual text instead.
        const centerOffset = dateEl.offsetTop + getGlyphCenterOffset(dateEl);
        label.style.top = `${targetY - centerOffset}px`;
        label.style.transform = 'none';
      });
    } else {
      [labelLeft, labelMid, labelRight].forEach((label) => {
        if (!label) return;
        label.style.top = '';
        label.style.transform = '';
      });
    }
  }

  new ResizeObserver(tick).observe(top.track);
  if (labelsCol) new ResizeObserver(tick).observe(labelsCol);

  // Pauses the twist loop while the panel is scrolled off-screen — cheap
  // to add, not required for correctness (tick()'s own isMobile branch
  // already starts/stops it on layout changes; this covers the desktop,
  // still-in-viewport-size-but-scrolled-away case that wouldn't touch
  // isMobile at all).
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) rig.startLoop();
    else rig.stopLoop();
  }).observe(section);

  tick();
  window.addEventListener('resize', tick);
  // TEMP: dev date override (index.html's #dev-date-override) dispatches
  // this after monkey-patching Date.now, so every date-driven element
  // here refreshes immediately instead of waiting for the next resize.
  // Remove along with that control before launch.
  window.addEventListener('dev:date-changed', tick);
}
