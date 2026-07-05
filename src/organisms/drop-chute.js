// Organism: the "chute" the hero countdown's own falling drop rolls
// down — a short, smooth winding curve living entirely within the hero
// section (its own bottom padding was grown a bit in index.html to make
// room). The chute doesn't need to *start* under the funnel spout — it
// just needs to pass underneath it somewhere along its own length, the
// same way a real chute positioned off to one side still catches
// something dropped from directly above it. The ball's full journey
// (see spawnFallToChute/spawnRoll/spawnFall below) is: grow at the spout
// (index.html) -> fall straight down until it meets the chute at whatever
// point the chute's own curve happens to cross that x -> roll the
// remainder of the chute's curve from that meeting point onward -> drop
// off the end and fall the rest of the way (a real, longer fall, since
// the glass is much further down the page than this chute reaches) ->
// arrive at the glass, where timeline-panel.js takes over for the final
// "into the liquid, behind the front accents" bit and the landing bounce.
//
// The curve itself is deliberately NOT built from chained
// atoms/batik-segment.js tendril segments (each independently bowed, so
// consecutive segments don't share a tangent direction at the joins,
// reading as visibly segmented/kinked) — a real chute needs one
// continuous, smoothly winding curve. Built instead via a Catmull-Rom
// spline through several jittered waypoints, converted to one chain of
// cubic beziers that all share matching tangents at every join
// (buildSmoothPathD below) — still decorated with the same cecek-dot
// trace and occasional leaf/bell/petal/paisley flourish
// (atoms/batik-flourish.js) as the rest of the site's batik language,
// just on a smooth spline instead of a segmented tendril chain.
//
// Draws itself in on first load (stroke-dasharray/dashoffset, the same
// technique src/atoms/batik-pattern.js's own revealBatikPattern already
// uses) rather than simply appearing fully-drawn. Rebuilds (geometry
// only, no re-animated reveal) on resize — including across the mobile/
// desktop breakpoint, where the glass bucket's own position changes
// layout entirely (src/organisms/timeline-panel.js) — debounced, since a
// live drag-resize fires far more often than this needs to actually
// recompute.
//
// Cross-module handoff with index.html (classic script) and
// timeline-panel.js (the glass-entry + bounce reaction) goes through
// window custom events, the same pattern index.html's own
// #dev-date-override already established with 'dev:date-changed':
//   'chute:ball-released' (dispatched by index.html) → this module falls
//     the drop to the chute, rolls it, then falls it the rest of the way
//     down to the glass.
//   'chute:ball-landed' (dispatched by this module, once that long fall
//     finishes) → timeline-panel.js takes the ball the rest of the way
//     into the liquid and triggers the bounce.

import { flattenCubic, pointsAtArcLength } from '../tokens/batik-motifs.js';
import { renderCecekLayer, TENDRIL_STROKE } from '../atoms/batik-pattern.js';
import { buildFlourish, renderFlourish } from '../atoms/batik-flourish.js';

const CECEK_FILL = 'var(--color-highlight)'; // same choice timeline-panel.js's own string already made
// ARCH_COUNT: the number of deliberate alternating bends between the
// start and end anchors — NOT a sample-density knob. Every waypoint fed
// to the Catmull-Rom spline (buildWaypoints) is one of these bend apexes
// (or the start/end anchor); there's no such thing as an "extra" waypoint
// that merely traces a formula more finely. Per the user: a point that
// isn't doing the work of making a real, dramatic arch is just noise on
// the line, not interest — so raising this number means "one more real
// bend," never "smoother sampling of the same bend." 2 was tried at
// higher sample density (8-16 evenly-spaced points reading off a sine
// wave) and read as a cluster of small kinks on wide (desktop) spans; the
// fix wasn't more points, it was making every point count.
const ARCH_COUNT = 2;
// Desktop's own fixed height — desktop doesn't need the mobile-only
// compression below (hero always had comfortable room there), but it's
// trimmed down a bit from an earlier 190: the more dramatic arches now
// (buildWaypoints's own ARCH_SWING_RATIO) read as visually heavier, so
// the chute's own bottom edge is raised slightly to leave more clearance
// above Kueh of the Day. Some overlap into that section is still fine on
// desktop (more than mobile ever gets — see the hard clamp below) — this
// is a "back off a little," not "never overlap."
const CHUTE_HEIGHT_MAX = 150;
// Mobile's own fixed height — a flat constant now, not derived from
// however much room happens to be left between the spout and the hero's
// own live bottom edge. That live measurement used to mean any unrelated
// change to the hero's bottom padding (e.g. trimming dead space) directly
// squashed the chute shorter, even though the chute itself hadn't
// changed — the two were coupled for no real reason. This value is just
// the height that measurement used to settle on with the hero's own
// padding at a comfortable size, kept as a plain tuned constant instead.
const CHUTE_HEIGHT_MOBILE = 80;
const MOBILE_BREAKPOINT = 640; // matches timeline-panel.js's own isMobile cutoff
const CONTAINER_PAD = 60; // clearance around the waypoint bounding box for stroke width/flourishes — the *rendered* container extends this far past the last waypoint, so findAnchors' own room calculation has to account for it too, not just the path's own logical height
const X_JITTER = 200; // wide side-to-side swing — runs mostly horizontally, not a near-vertical drop
// Each arch's swing is this fraction of the start->end horizontal span
// (floored by ARCH_MIN_SWING_PX for narrow spans) — proportional, not a
// flat pixel amount, so an arch is always a real, visible departure from
// the direct line regardless of how wide or narrow that line happens to
// be. A flat X_JITTER-based amplitude (the old approach) could be nearly
// swallowed by a wide span's own linear drift, undercutting the very
// drama an arch is supposed to add.
const ARCH_SWING_RATIO = 0.42;
const ARCH_MIN_SWING_PX = 70;
// The closing hook (buildWaypoints) — a dedicated point pinned directly
// above bucketX, right before the final anchor, so the chute's very last
// stretch is a true vertical drop (an exact 90-degree tangent right at
// the dropoff — see buildWaypoints's own comment for why). GAP is the
// share of the total vertical run reserved for it, kept clear of the
// regular arches so it isn't fighting wherever the last one landed.
const END_HOOK_GAP_T = 0.28;
const FLOURISH_COUNT = 2;
const CECEK_DOT_SPACING = 9;
const REVEAL_DURATION_MS = 1100; // draw-in, first build only
const FALL_TO_CHUTE_DURATION_MS = 260; // spout -> wherever the chute crosses under it
const CHUTE_RIDE_LIFT_PX = 3; // rides a touch above the path's own centerline, rather than dead-center on it
// px/ms along the *actual* curve — not a flat total duration divided by
// however much of the path is left. The chute snakes (buildWaypoints's
// arches), so its real arc length varies a lot by viewport/build (~1140px
// measured on one desktop width, ~375px on one mobile width) — a fixed
// total-duration assumption would make the ball travel at a wildly
// different px/ms depending on how long that particular build's curve
// happened to be, rather than rolling at one consistent speed. Duration
// is derived per-roll from the real remaining arc length (spawnRoll,
// using state.totalLength — the same measurement buildChute already does
// for crossingFraction, just also kept around instead of discarded).
const ROLL_SPEED_PX_PER_MS = 0.35;
// Stretch & squash: the ball elongates along its direction of travel
// while falling (a visual read of speed, classic animation-principle
// stuff), and relaxes back to round while rolling (rolling doesn't
// accelerate the same way, so there's nothing for the elongation to keep
// expressing). Two stretch stages for the long fall (spawnFall) — modest
// while still accelerating, fuller once it settles into terminal
// velocity — vs. one flat stretch for the short spout->chute hop
// (spawnFallToChute), which is too brief to bother easing between two
// stretch amounts. FALL_STRETCH_X is always the reciprocal-ish
// counterpart to *_Y (volume-preserving squash-stretch), not an
// independent tune.
const FALL_STRETCH_Y_MID = 1.15;
const FALL_STRETCH_X_MID = 0.9;
const FALL_STRETCH_Y_MAX = 1.35;
const FALL_STRETCH_X_MAX = 0.8;
const HOP_STRETCH_Y = 1.25;
const HOP_STRETCH_X = 0.87;
// The moment the ball meets the chute (spawnRoll's very first instant): a
// quick squash-then-spring-back, like real impact absorption, before
// settling into the round shape it keeps for the rest of the roll. Timed
// in real ms (not a fraction of the roll's own variable total), so it
// neither lengthens nor shortens depending on how long that particular
// roll happens to be. Runs as its own independent `transform`-only
// animation (see spawnRoll), so it can't affect the movement animation's
// own easing/timing — and, since the roll ball's own margin double-shift
// bug is now fixed (that was the real cause of an earlier "backtrack"
// misattributed to this squash), it should render cleanly now.
const LANDING_SQUASH_MS = 110;
const LANDING_SQUASH_Y = 0.85;
const LANDING_SQUASH_X = 1.15;
const EDGE_MARGIN = 40; // keeps waypoints off the very edge of the content column
const RESIZE_DEBOUNCE_MS = 200;

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

function fmt(n) {
  return Math.round(n * 100) / 100;
}

function documentPoint(rect) {
  return [rect.left + window.scrollX, rect.top + window.scrollY];
}

// Start: right under the funnel spout. End: directly over the glass
// bucket (.tl-glass's own current x-center — the same target spawnFall
// itself measures later, so both stay consistent) — still only a little
// way down the page, per the user: the chute itself stays near the top,
// it doesn't reach anywhere near the Timeline panel; the long fall
// (spawnFall, below) covers the real remaining distance down to the
// glass.
//
// chuteHeight: a flat constant either way — CHUTE_HEIGHT_MAX on desktop,
// CHUTE_HEIGHT_MOBILE on mobile (mobile's hero is shorter relative to its
// own content, so it gets its own smaller flat value rather than sharing
// desktop's). Deliberately NOT derived from the hero's own live bottom
// edge anymore — that used to mean any unrelated change to the hero's
// bottom padding (trimming empty space, say) would silently squash or
// stretch the chute along with it, since the two had nothing to do with
// each other conceptually. A plain constant, tuned by eye like everything
// else in this file, means the two can be changed independently.
function findAnchors() {
  const viewport = document.querySelector('.countdown-viewport');
  const glass = document.querySelector('.tl-glass');
  if (!viewport || !glass) return null;
  const viewportRect = viewport.getBoundingClientRect();
  const spout = documentPoint({ left: viewportRect.left + viewportRect.width / 2, top: viewportRect.bottom });
  const chuteTop = spout[1] + 36; // a small gap below the spout itself
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const chuteHeight = isMobile ? CHUTE_HEIGHT_MOBILE : CHUTE_HEIGHT_MAX;
  const glassRect = glass.getBoundingClientRect();
  const bucketX = documentPoint({ left: glassRect.left + glassRect.width / 2, top: 0 })[0];
  return { spout, chuteTop, bucketX, chuteHeight };
}

// The chute's own waypoints — a short, wide S-wind sitting just below the
// spout. `bucketX` is a *hard rule* (see findAnchors) — the last waypoint
// is pinned there exactly, so the long fall off the end is a straight
// vertical drop into the glass rather than a diagonal one.
//
// The starting waypoint is placed on the *opposite side* of spoutX from
// bucketX — not just offset to one fixed side — which guarantees (by the
// intermediate value theorem: a continuous line from one side of spoutX
// to the other must cross it somewhere) that the curve actually passes
// underneath the spout at least once, regardless of which side the
// bucket happens to be on. Getting this wrong (a fixed offset regardless
// of bucketX's side) was the mobile bug: the mobile bucket sits well to
// the *left*, and a start point *also* offset left of the spout meant the
// whole path skewed away from spoutX with nothing guaranteeing a
// crossing — the drop had to visibly jump sideways to reach the chute's
// own literal start instead of falling straight onto it.
function buildWaypoints(spoutX, chuteTop, bucketX, chuteHeight) {
  const minX = EDGE_MARGIN;
  const maxX = Math.max(minX + 1, document.documentElement.clientWidth - EDGE_MARGIN);
  const offset = X_JITTER * 0.3;
  const startX =
    bucketX >= spoutX ? Math.max(minX, spoutX - offset) : Math.min(maxX, spoutX + offset);

  const span = bucketX - startX;
  const swing = Math.max(ARCH_MIN_SWING_PX, Math.abs(span) * ARCH_SWING_RATIO);

  // Start and end are anchors (start passes under the spout, end is
  // pinned to the bucket — both hard rules, see comment above), not
  // arches themselves. Every point in between is a deliberate apex,
  // alternating which side it bulges toward, pushed a real, proportional
  // `swing` off the direct start->end line — never a point sitting
  // quietly on the interpolated line just to add sampling density.
  //
  // The first arch's side is chosen to match the overall travel
  // direction (Math.sign(span)), not a fixed left-or-right guess — it
  // must *compound* with the line's own drift, not fight it. Picking a
  // fixed side regardless of which way the bucket sits meant that on
  // some layouts (bucket left of the spout, span negative) the first
  // arch's push partly cancelled the line's own drift instead of adding
  // to it, landing barely off the straight line — a point doing
  // essentially no work, which is exactly what this whole approach is
  // meant to avoid.
  const firstSide = span >= 0 ? 1 : -1;

  // The regular arches only get the first `archSpan` share of the
  // vertical run — the closing hook below (per the user: the very end
  // should arch downward, close to the dropoff) gets a dedicated final
  // stretch of its own, so it isn't competing with wherever the last
  // regular arch happened to land.
  const archSpan = 1 - END_HOOK_GAP_T;
  const waypoints = [[startX, chuteTop]];
  for (let i = 1; i <= ARCH_COUNT; i++) {
    const t = (i / (ARCH_COUNT + 1)) * archSpan;
    const y = chuteTop + chuteHeight * t;
    const baseX = startX + span * t;
    const side = i % 2 === 1 ? firstSide : -firstSide;
    const x = Math.min(maxX, Math.max(minX, baseX + side * swing));
    waypoints.push([x, y]);
  }

  // The closing hook: *two* points, both pinned to bucketX exactly (same
  // x as the final anchor, only differing in y) — one point isn't
  // enough. A single hook point only forces the tangent to be vertical at
  // the infinitesimal final instant; the segment leading into it is still
  // a cubic Bezier whose *incoming* control point is pulled sideways by
  // whatever the last regular arch's off-center position was, so the
  // curve visibly bulges out and snaps back right at the end instead of
  // genuinely running straight down (this was tried first — the tangent
  // was technically vertical right at the tip, but the curve leading up
  // to it still hooked past vertical and back). With two colinear points,
  // the *final* segment's four Bezier control points (both endpoints, and
  // both Catmull-Rom-derived control points, which each depend only on
  // this pair and its own duplicate padding) all land on the same
  // vertical line — that whole last stretch is a genuinely straight
  // vertical drop, not just tangent-matched at one point. Any bulge from
  // the last arch's off-center position is confined to the segment
  // *before* hook1, which is exactly where the "arch downward" bend
  // should read anyway.
  const hook1T = archSpan + END_HOOK_GAP_T * 0.4;
  const hook2T = archSpan + END_HOOK_GAP_T * 0.75;
  waypoints.push([bucketX, chuteTop + chuteHeight * hook1T]);
  waypoints.push([bucketX, chuteTop + chuteHeight * hook2T]);

  waypoints.push([bucketX, chuteTop + chuteHeight]);
  return waypoints;
}

// Catmull-Rom spline through `points`, converted to a chain of cubic
// beziers — unlike independently-bowed tendril segments, consecutive
// beziers here share a matching tangent at every join (the standard
// Catmull-Rom-to-Bezier control-point formula), so the whole thing reads
// as one continuous winding curve rather than a segmented chain.
function catmullRomBezierSegments(points) {
  const at = (i) => points[Math.max(0, Math.min(points.length - 1, i))];
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = at(i + 2);
    const cp1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const cp2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    segments.push([p1, cp1, cp2, p2]); // [start, control1, control2, end] — flattenCubic's own (p0,p1,p2,p3) order
  }
  return segments;
}

function buildSmoothPathD(segments) {
  let d = `M ${fmt(segments[0][0][0])},${fmt(segments[0][0][1])}`;
  segments.forEach(([, cp1, cp2, end]) => {
    d += ` C ${fmt(cp1[0])},${fmt(cp1[1])} ${fmt(cp2[0])},${fmt(cp2[1])} ${fmt(end[0])},${fmt(end[1])}`;
  });
  return d;
}

function polylineLength(polyline) {
  let total = 0;
  for (let i = 1; i < polyline.length; i++) {
    total += Math.hypot(polyline[i][0] - polyline[i - 1][0], polyline[i][1] - polyline[i - 1][1]);
  }
  return total;
}

// Where a vertical line through `targetX` first crosses the curve — the
// point the falling drop actually lands on, and the arc-length fraction
// the roll should start from (everything before this point is "upstream"
// of where the drop meets the chute, and never gets rolled over).
//
// Queried against the *real, rendered* <path> element (getPointAtLength),
// not our own flattened-polyline approximation of it — the polyline is
// only ~16 samples per bezier segment, a fine approximation for
// scattering dots/flourishes, but not pixel-exact. offset-path/
// offset-distance (the roll animation, spawnRoll) positions the ball
// using the browser's own precise path geometry, so if the crossing point
// used to end the *fall* (spawnFallToChute) came from our own slightly
// different polyline estimate, the roll's starting position wouldn't
// necessarily land at the exact same pixel — the ball would visibly
// snap a few px to correct itself right as the roll took over, reading
// as a small backtrack. Using the same getPointAtLength the path element
// itself is built from removes that discrepancy by construction: both
// the fall's landing point and the roll's start now come from the exact
// same source.
function findCrossingOnPath(pathEl, totalLength, targetX) {
  const STEPS = 200;
  let prevLen = 0;
  let prev = pathEl.getPointAtLength(0);
  for (let i = 1; i <= STEPS; i++) {
    const len = (i / STEPS) * totalLength;
    const pt = pathEl.getPointAtLength(len);
    if ((prev.x - targetX) * (pt.x - targetX) <= 0 && prev.x !== pt.x) {
      let lo = prevLen;
      let hi = len;
      for (let iter = 0; iter < 24; iter++) {
        const mid = (lo + hi) / 2;
        const midPt = pathEl.getPointAtLength(mid);
        if ((prev.x - targetX) * (midPt.x - targetX) <= 0) {
          hi = mid;
        } else {
          lo = mid;
          prev = midPt;
        }
      }
      const finalPt = pathEl.getPointAtLength(hi);
      return { x: finalPt.x, y: finalPt.y, travelled: hi };
    }
    prev = pt;
    prevLen = len;
  }
  return null;
}

export function init() {
  // Mutable "current build" state — reassigned by buildChute() every time
  // it (re)runs, and read by spawnFallToChute/spawnRoll/spawnFall via
  // closure, so those three always act on the latest geometry without
  // needing their own resize handling or re-registering event listeners.
  const state = { container: null, pathD: '', ballPathD: '', crossingFraction: 0, totalLength: 0, endDoc: [0, 0], crossingDoc: [0, 0], spout: [0, 0] };
  let builtOnce = false;

  function buildChute() {
    const anchors = findAnchors();
    if (!anchors) return false;
    const { spout, chuteTop, bucketX, chuteHeight } = anchors;

    const waypointsDoc = buildWaypoints(spout[0], chuteTop, bucketX, chuteHeight);

    const xs = waypointsDoc.map((p) => p[0]);
    const ys = waypointsDoc.map((p) => p[1]);
    const minX = Math.min(...xs) - CONTAINER_PAD;
    const minY = Math.min(...ys) - CONTAINER_PAD;
    const width = Math.max(...xs) + CONTAINER_PAD - minX;
    const height = Math.max(...ys) + CONTAINER_PAD - minY;

    // Local (container-relative) coordinates — the path/offset-path and
    // every rendered dot/flourish all need to agree on this same space.
    const waypoints = waypointsDoc.map(([x, y]) => [x - minX, y - minY]);
    const spoutLocalX = spout[0] - minX;

    const container = document.createElement('div');
    container.className = 'drop-chute';
    container.style.left = `${minX}px`;
    container.style.top = `${minY}px`;
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('drop-chute-svg');

    const bezierSegments = catmullRomBezierSegments(waypoints);
    const pathD = buildSmoothPathD(bezierSegments);
    // A second path, offset straight up by CHUTE_RIDE_LIFT_PX, used only as
    // the roll's offset-path (see spawnRoll) so the ball rides a touch
    // above the drawn line instead of dead-center on it. A rigid vertical
    // translation leaves every tangent angle identical to the original
    // curve's — unlike shifting via offset-anchor/transform, which get
    // rotated along with offset-rotate's default 'auto' tangent-following
    // rotation and so flip from "above" to "below" whenever the chute
    // curves back the other way. Because it's a pure translation (not a
    // reshape), arc length is unchanged too, so the roll's existing
    // crossingFraction/offsetDistance percentages — computed against the
    // un-lifted pathD — still land on the exact corresponding point.
    const liftedSegments = bezierSegments.map(([p0, cp1, cp2, p1]) => [
      [p0[0], p0[1] - CHUTE_RIDE_LIFT_PX],
      [cp1[0], cp1[1] - CHUTE_RIDE_LIFT_PX],
      [cp2[0], cp2[1] - CHUTE_RIDE_LIFT_PX],
      [p1[0], p1[1] - CHUTE_RIDE_LIFT_PX],
    ]);
    const ballPathD = buildSmoothPathD(liftedSegments);

    const polyline = [];
    bezierSegments.forEach(([p0, cp1, cp2, p1], i) => {
      const flat = flattenCubic(p0, cp1, cp2, p1, 16);
      polyline.push(...(i === 0 ? flat : flat.slice(1)));
    });

    const dots = pointsAtArcLength(polyline, CECEK_DOT_SPACING).map(([x, y]) => ({ x, y }));

    // Every piece of markup is built as a string and assigned to
    // svg.innerHTML exactly once, below — NOT `svg.appendChild(realNode)`
    // followed by further `svg.innerHTML +=`, which re-serializes and
    // re-parses the *entire* subtree on each `+=`, silently detaching any
    // real node reference taken beforehand.
    let markup =
      `<path class="batik-tendril drop-chute-path" d="${pathD}" fill="none" stroke="${TENDRIL_STROKE}" stroke-width="2.5" stroke-linecap="round"/>` +
      renderCecekLayer(dots, CECEK_FILL);
    // Segment picked weighted by its *real* arc length, not a uniform
    // pick by index — the closing hook (buildWaypoints) packs several
    // short segments into the last stretch of the chute (getting there
    // from the last regular arch, then the two hook points, then the
    // end), so an index-uniform pick way overrepresented that small
    // bottom region relative to how little of the curve it actually is,
    // reading as flourishes always landing near the bottom.
    const segLengths = bezierSegments.map(([p0, cp1, cp2, p1]) => polylineLength(flattenCubic(p0, cp1, cp2, p1, 16)));
    const totalSegLength = segLengths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < FLOURISH_COUNT; i++) {
      let r = Math.random() * totalSegLength;
      let segIndex = segLengths.length - 1;
      for (let j = 0; j < segLengths.length; j++) {
        if (r < segLengths[j]) {
          segIndex = j;
          break;
        }
        r -= segLengths[j];
      }
      markup += renderFlourish(waypoints[segIndex], waypoints[segIndex + 1], buildFlourish(), CECEK_FILL);
    }
    svg.innerHTML = markup;
    container.appendChild(svg);
    document.body.appendChild(container);

    // Measured from the real, rendered <path> (getTotalLength/
    // getPointAtLength) now that it's in the DOM — see
    // findCrossingOnPath's own comment for why this needs to be the
    // browser's own path geometry rather than the flattened-polyline
    // estimate above (which is still used for dot/flourish placement,
    // where an approximation is perfectly fine).
    const tendrilPathEl = svg.querySelector('.drop-chute-path');
    const totalLength = tendrilPathEl.getTotalLength();
    // One single point serves both the fall's landing target and the
    // roll's own starting position — not two separate ones. The fall has
    // to stay purely vertical (a real drop falls straight down), so it
    // can only ever land exactly on the curve's own crossing of the
    // spout's x; anything else demands either a diagonal fall (breaks the
    // physics) or a small jump at the handoff (breaks continuity) to
    // reach a *different* point for the roll to start from. Perfect
    // continuity and a straight-down fall together only leave one choice:
    // both use this same literal crossing point — lifted by
    // CHUTE_RIDE_LIFT_PX below (state.crossingDoc), to land on the same
    // raised line the roll itself rides (ballPathD), not the drawn
    // centerline. A plain y-subtraction is exact, not an approximation:
    // ballPathD is centerline translated by -CHUTE_RIDE_LIFT_PX, and
    // translating every control point shifts every point on the curve by
    // that exact same amount for any t.
    const crossing = findCrossingOnPath(tendrilPathEl, totalLength, spoutLocalX);
    const crossingFraction = crossing ? crossing.travelled / totalLength : 0;

    // Draws itself in on first load only — same stroke-dasharray/
    // dashoffset technique batik-pattern.js's own revealBatikPattern uses.
    // Rebuilds triggered by a later resize just show it fully drawn
    // immediately; re-animating the draw-in every time the window is
    // resized would be distracting, not a "first load" moment anymore.
    if (!builtOnce && !prefersReducedMotion) {
      const tendrilPath = tendrilPathEl;
      const dashLength = totalLength;
      tendrilPath.style.strokeDasharray = `${dashLength}`;
      tendrilPath.style.strokeDashoffset = `${dashLength}`;
      tendrilPath.animate([{ strokeDashoffset: dashLength }, { strokeDashoffset: 0 }], {
        duration: REVEAL_DURATION_MS,
        easing: 'ease-out',
        fill: 'forwards',
      });
      const decorations = svg.querySelectorAll('.batik-cecek, .batik-motif');
      decorations.forEach((el) => {
        el.style.opacity = '0';
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 400,
          delay: REVEAL_DURATION_MS * 0.6,
          easing: 'ease-in',
          fill: 'forwards',
        });
      });
    }

    if (state.container) state.container.remove();
    const endLocal = waypoints[waypoints.length - 1];
    state.container = container;
    state.pathD = pathD;
    state.ballPathD = ballPathD;
    state.crossingFraction = crossingFraction;
    state.totalLength = totalLength;
    state.endDoc = [minX + endLocal[0], minY + endLocal[1]];
    state.crossingDoc = crossing
      ? [minX + crossing.x, minY + crossing.y - CHUTE_RIDE_LIFT_PX]
      : [spout[0], spout[1] - CHUTE_RIDE_LIFT_PX];
    state.spout = spout;
    builtOnce = true;
    return true;
  }

  // The long fall from the chute's end down to wherever the glass
  // currently sits — measured fresh right when it starts (not
  // precomputed), so it correctly lands wherever the glass has sunk to
  // *today*, even though the chute itself doesn't track that. Document-
  // positioned, not viewport-fixed — a real, possibly off-screen (if the
  // visitor has scrolled to look at the Timeline section already) journey
  // down the page, not something that needs to stay in view the whole
  // time.
  function spawnFall() {
    const glass = document.querySelector('.tl-glass');
    if (!glass || prefersReducedMotion) {
      window.dispatchEvent(new CustomEvent('chute:ball-landed'));
      return;
    }
    const glassRect = glass.getBoundingClientRect();
    const targetDoc = documentPoint({ left: glassRect.left + glassRect.width / 2, top: glassRect.top });
    const { endDoc } = state;

    const fallEl = document.createElement('div');
    fallEl.className = 'drop-chute-ball';
    fallEl.style.left = `${endDoc[0]}px`;
    fallEl.style.top = `${endDoc[1]}px`;
    document.body.appendChild(fallEl);

    const dx = targetDoc[0] - endDoc[0];
    const dy = targetDoc[1] - endDoc[1];
    // Duration scales with the *real* distance (sqrt, not linear — closer
    // to how a constant-acceleration fall's own duration grows with
    // distance) rather than one fixed value regardless of how far down
    // the page the glass actually is.
    const fallDuration = Math.min(2800, Math.max(600, Math.sqrt(Math.abs(dy)) * 45));
    // Accelerates for the first ~22% of the fall's own duration (ease-in,
    // covering ~12% of the distance in that time — still speeding up),
    // then holds a *constant* speed — terminal velocity — for the
    // remainder (a plain linear segment), rather than continuing to
    // accelerate (or, worse, decelerate) all the way to the glass. The
    // final glass-entry leg (dropIntoLiquid, src/atoms/glass-graphic.js)
    // picks up at that same linear rate rather than restarting from a
    // slow ease-in of its own, so there's no perceived slowdown right at
    // the handoff into the cup.
    // Stretch grows alongside speed: round when it leaves the chute
    // (still carrying the roll's own settled shape), a modest elongation
    // by the time it's accelerated through the first 22%, holding at its
    // fullest stretch through the rest of the fall (constant terminal
    // velocity = constant stretch, no reason to ease it further once the
    // speed itself stops changing).
    const anim = fallEl.animate(
      [
        { transform: 'translate(0, 0) scale(1, 1)', offset: 0, easing: 'ease-in' },
        {
          transform: `translate(${dx * 0.12}px, ${dy * 0.12}px) scale(${FALL_STRETCH_X_MID}, ${FALL_STRETCH_Y_MID})`,
          offset: 0.22,
          easing: 'linear',
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${FALL_STRETCH_X_MAX}, ${FALL_STRETCH_Y_MAX})`, offset: 1 },
      ],
      { duration: fallDuration }
    );
    // The terminal velocity actually reached during that final linear
    // 78%-of-time/88%-of-distance stretch (px/ms) — passed along so the
    // glass-local final leg (dropIntoLiquid, src/atoms/glass-graphic.js,
    // wired up in timeline-panel.js) can keep moving at this *exact* same
    // speed the rest of the way into the liquid, rather than an
    // independently-chosen fixed duration of its own that likely wouldn't
    // match.
    const totalDist = Math.hypot(dx, dy);
    const terminalSpeed = (totalDist * 0.88) / (fallDuration * 0.78);
    anim.onfinish = () => {
      fallEl.remove();
      window.dispatchEvent(new CustomEvent('chute:ball-landed', { detail: { terminalSpeed } }));
    };
  }

  // Rolls from the crossing point (not 0%) through to the end — the
  // portion of the curve "upstream" of where the drop actually meets the
  // chute was never travelled. Duration scales down with however much of
  // the curve is actually left to roll, so a crossing near the end
  // doesn't roll for the same duration a full-length roll would.
  function spawnRoll() {
    if (prefersReducedMotion) {
      spawnFall();
      return;
    }
    const { container, ballPathD, crossingFraction, totalLength } = state;
    const startPct = `${(crossingFraction * 100).toFixed(2)}%`;
    const ball = document.createElement('div');
    ball.className = 'drop-chute-ball';
    // .drop-chute-ball's own margin: -6px centers the plain-translated
    // fall/hop balls on an explicit left/top point — but offset-path
    // already centers *this* element on the path point itself via its own
    // anchor mechanism (default: box center), so that same margin doubly
    // shifts it a further 6px off-target. Verified directly: with the
    // shared margin left in place, this ball rendered ~6px away from the
    // exact point getPointAtLength itself reports for the same
    // offsetDistance; zeroing margin here lines the two up almost
    // exactly. This was the real cause of the "lands, then backtracks a
    // few px" bug — not the crossing-point math (already verified exact),
    // not the squash (removed anyway, but never the actual culprit).
    ball.style.margin = '0';
    // Rides ballPathD (state's own lifted copy of pathD, built above),
    // not pathD itself, so the ball sits CHUTE_RIDE_LIFT_PX above the
    // drawn line rather than dead-center on it — see ballPathD's own
    // comment for why this has to be a shifted path rather than an
    // offset-anchor/transform nudge (those rotate with offset-rotate's
    // tangent-following default and flip sides on the chute's own curves).
    ball.style.offsetPath = `path('${ballPathD}')`;
    ball.style.offsetDistance = startPct;
    container.appendChild(ball);
    // Landing on the chute cuts the fall's own (fast, terminal-velocity)
    // speed down a lot, since the roll animation starts fresh at its own
    // t=0 — but not a dead stop, the ball still carries a faint amount of
    // momentum from the fall. Both ends are deliberately gentle — the
    // curve's steepest stretch is through the middle, easing in from a
    // slow start and back down to a slow-ish finish rather than either
    // end feeling rushed.
    //
    // Duration comes from the real remaining arc length (not just "the
    // remaining fraction of some flat total") divided by a target px/ms
    // — the curve's actual length varies by viewport, so a fixed total
    // duration would silently change the ball's real speed from build to
    // build.
    const remaining = 1 - crossingFraction;
    const remainingLength = totalLength * remaining;
    const movementDuration = Math.max(250, remainingLength / ROLL_SPEED_PX_PER_MS);
    // Movement and squash are two *separate* concurrent animations on the
    // same element (WAAPI allows this as long as they don't touch the
    // same property) — a single animation covering both offsetDistance
    // and transform together let the squash's own ease-out-into-ease-in
    // stall the ball's forward progress right at that shared keyframe (a
    // real bug, since fixed). The squash was then also blamed for a
    // separate "lands, backtracks a few px" issue, which turned out to be
    // this ball's own margin double-shift (see where `ball.style.margin`
    // is zeroed, above) — unrelated to the squash, and now fixed at the
    // source.
    const crossingPct = crossingFraction * 100;

    // Same accelerate-then-hold-terminal-velocity shape as the long fall
    // (spawnFall) — ease in for the first 22% of the duration (covering
    // ~12% of the distance, still speeding up), then a flat *linear*
    // stretch for the rest, so the ball actually reaches and holds one
    // constant top speed along the chute.
    const postCrossingPctRange = 100 - crossingPct;
    const accelEndOffset = 0.22;
    const accelEndPct = crossingPct + postCrossingPctRange * 0.12;
    const movementAnim = ball.animate(
      [
        { offsetDistance: `${crossingPct.toFixed(2)}%`, easing: 'ease-in' },
        { offsetDistance: `${accelEndPct.toFixed(2)}%`, offset: accelEndOffset, easing: 'linear' },
        { offsetDistance: '100%' },
      ],
      { duration: movementDuration }
    );

    // The landing squash: its own fixed real-ms duration (not a fraction
    // of the roll's own highly variable total), so it neither lengthens
    // nor shortens depending on how long that particular roll happens to
    // be.
    ball.animate(
      [
        { transform: `scale(${LANDING_SQUASH_X}, ${LANDING_SQUASH_Y})`, easing: 'ease-out' },
        { transform: 'scale(1, 1)' },
      ],
      { duration: LANDING_SQUASH_MS }
    );

    movementAnim.onfinish = () => {
      ball.remove();
      spawnFall();
    };
  }

  // The drop falls straight down from the spout until it meets the chute
  // at the crossing point found above, *then* starts rolling — not a
  // roll starting from the chute's own literal first waypoint.
  function spawnFallToChute() {
    if (prefersReducedMotion) {
      spawnRoll();
      return;
    }
    const { spout, crossingDoc } = state;
    const fallEl = document.createElement('div');
    fallEl.className = 'drop-chute-ball';
    fallEl.style.left = `${spout[0]}px`;
    fallEl.style.top = `${spout[1]}px`;
    document.body.appendChild(fallEl);

    // Purely vertical — a real drop falls straight down, not at a
    // diagonal. `crossingDoc` is the literal point where the chute
    // crosses the spout's own x (findCrossingOnPath), the same point
    // spawnRoll starts from, so dy alone always reaches it exactly, and
    // the fall hands off into the roll with perfect continuity.
    const dy = crossingDoc[1] - spout[1];
    const anim = fallEl.animate(
      [
        { transform: 'translate(0, 0) scale(1, 1)' },
        { transform: `translate(0, ${dy}px) scale(${HOP_STRETCH_X}, ${HOP_STRETCH_Y})` },
      ],
      { duration: FALL_TO_CHUTE_DURATION_MS, easing: 'ease-in' }
    );
    anim.onfinish = () => {
      fallEl.remove();
      spawnRoll();
    };
  }

  if (!buildChute()) return;

  // The page loads a Google Font (--font-display: "Syne", ...) with
  // `display=swap` — text first renders in the fallback font, then
  // reflows once Syne downloads and swaps in. Since Syne's own metrics
  // differ from the fallback, that reflow can shift .hero-title's own
  // height, pushing the funnel below it up or down after this first
  // build already ran — silently baking a stale spout y-coordinate into
  // everything downstream (the straight fall, the chute's own geometry).
  // (.hero itself used to also carry a `reveal` class with its own
  // translateY(20px)->0 entrance transition, another possible source of
  // the same staleness — removed instead, since .hero is always already
  // in view at load and didn't need a reveal-on-scroll effect at all.)
  //
  // Corrected via a rigid vertical nudge of the *existing* container/
  // state — not a full buildChute() rebuild (tried that first; it
  // regenerates the path/dots/flourishes with fresh randomness every
  // time, visibly swapping in a different-looking chute on top of
  // whatever position correction was needed). A text reflow only ever
  // adds vertical height, never shifts things horizontally — chuteHeight
  // and bucketX (from .tl-glass, outside .hero entirely) are unaffected
  // — so a plain delta on spout's own y, applied to the container and to
  // state.spout/crossingDoc/endDoc, corrects it exactly while leaving the
  // already-drawn path/dots/flourishes completely untouched.
  // A rigid nudge of the *existing* container/state by (deltaX, deltaY) —
  // moves the whole already-drawn chute without touching its path/dots/
  // flourishes. Shared by the font-swap resync below (deltaX always 0
  // there — a text reflow only ever adds vertical height) and the resize
  // listener further down (both axes, since a resize can shift the
  // layout horizontally too).
  function resyncPosition(deltaX, deltaY) {
    if (!state.container) return;
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;
    const currentLeft = parseFloat(state.container.style.left) || 0;
    const currentTop = parseFloat(state.container.style.top) || 0;
    state.container.style.left = `${currentLeft + deltaX}px`;
    state.container.style.top = `${currentTop + deltaY}px`;
    state.spout = [state.spout[0] + deltaX, state.spout[1] + deltaY];
    state.crossingDoc = [state.crossingDoc[0] + deltaX, state.crossingDoc[1] + deltaY];
    state.endDoc = [state.endDoc[0] + deltaX, state.endDoc[1] + deltaY];
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      const anchors = findAnchors();
      if (!anchors) return;
      resyncPosition(0, anchors.spout[1] - state.spout[1]);
    });
  }

  window.addEventListener('chute:ball-released', spawnFallToChute);

  // Rebuilds on resize — including across the mobile/desktop breakpoint,
  // where the glass bucket's own position changes layout entirely
  // (src/organisms/timeline-panel.js) — debounced, since a live drag-
  // resize fires far more often than actually needs a full rebuild (it
  // regenerates the path/dots/flourishes from scratch, rerolling the
  // random flourishes each time).
  //
  // But leaving the chute frozen at its *old* screen position for that
  // entire debounce window — every resize event until the drag finally
  // settles — read as the chute (and anything anchored to it) sticking
  // in place rather than tracking the resize at all, only snapping once
  // the debounced rebuild finally fires. resyncPosition is cheap (one
  // findAnchors() call plus a translation, no regeneration), so it runs
  // on *every* resize event directly, keeping the chute roughly in step
  // with the layout while dragging — the full rebuild still settles in
  // afterward with the actually-correct geometry.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    const anchors = findAnchors();
    if (anchors) resyncPosition(anchors.spout[0] - state.spout[0], anchors.spout[1] - state.spout[1]);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildChute, RESIZE_DEBOUNCE_MS);
  });
}
