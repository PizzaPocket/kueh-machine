// Organism: the "chute" the hero countdown's falling drop rolls down — a
// short, smooth winding curve living inside the hero section (its bottom
// padding was grown in index.html to make room). It doesn't need to start
// under the spout, only to pass underneath it somewhere along its
// length. Ball journey (spawnFallToChute/spawnRoll/spawnFall below): grows
// at the spout (index.html) -> falls straight down to wherever the
// chute's curve crosses that x -> rolls the rest of the curve -> drops
// off the end and falls the remaining distance to the glass, where
// timeline-panel.js takes over for the liquid entry and landing bounce.
//
// The curve is a Catmull-Rom spline through jittered waypoints, converted
// to a chain of cubic beziers sharing tangents at every join
// (buildSmoothPathD) — not chained atoms/batik-segment.js tendrils, which
// bow independently and read as kinked at the joins rather than one
// continuous wind. Decorated with the same cecek-dot trace and
// leaf/bell/petal/paisley flourishes (atoms/batik-flourish.js) as the
// rest of the site's batik language.
//
// Draws itself in on first load (stroke-dasharray/dashoffset, same
// technique as batik-pattern.js's revealBatikPattern) and rebuilds
// (geometry only, no re-animated reveal) on resize — debounced, since a
// live drag-resize fires far more often than this needs to recompute.
//
// Cross-module handoff via window custom events:
//   'chute:ball-released' (dispatched by index.html) → falls the drop to
//     the chute, rolls it, then falls it the rest of the way to the glass.
//   'chute:ball-landed' (dispatched by this module once that fall
//     finishes) → timeline-panel.js takes it into the liquid and
//     triggers the bounce.

import { flattenCubic, pointsAtArcLength } from '../tokens/batik-motifs.js';
import { renderCecekLayer, TENDRIL_STROKE } from '../atoms/batik-pattern.js';
import { buildFlourish, renderFlourish } from '../atoms/batik-flourish.js';

const CECEK_FILL = 'var(--color-highlight)'; // same choice timeline-panel.js's own string already made
// Number of deliberate alternating bends between the start/end anchors —
// not a sample-density knob (every waypoint fed to the Catmull-Rom spline
// in buildWaypoints is a real bend apex, never just a finer sample of the
// same curve). Higher sample density at the same bend count (tried at
// 8-16 points) read as a cluster of small kinks on wide desktop spans;
// fewer, more deliberate bends read as real arches instead.
const ARCH_COUNT = 2;
// Desktop's fixed height, trimmed down from an earlier 190 to leave more
// clearance above Kueh of the Day now that ARCH_SWING_RATIO's more
// dramatic arches read heavier.
const CHUTE_HEIGHT_MAX = 150;
// Mobile's fixed height — deliberately not derived from the hero's live
// bottom edge, so an unrelated change to the hero's own padding can't
// silently squash or stretch this.
const CHUTE_HEIGHT_MOBILE = 80;
const MOBILE_BREAKPOINT = 640; // matches timeline-panel.js's own isMobile cutoff
const CONTAINER_PAD = 60; // clearance around the waypoint bounding box for stroke width/flourishes — findAnchors' own room calculation has to account for this too, not just the path's logical height
const X_JITTER = 200; // wide side-to-side swing — runs mostly horizontally, not a near-vertical drop
// Each arch's swing as a fraction of the start->end horizontal span
// (floored by ARCH_MIN_SWING_PX) rather than a flat pixel amount, so an
// arch stays a visible departure from the direct line regardless of span
// width — a flat amplitude could get swallowed by a wide span's own drift.
const ARCH_SWING_RATIO = 0.42;
const ARCH_MIN_SWING_PX = 70;
// Upper counterpart — caps how wide a single arch may swing regardless of
// how large |span| grows (the cup's own start->end span can be much wider
// now that it hangs further right/down the page), so a large span still
// reads as a bounded, screen-safe wind rather than one huge sweep that
// collapses onto the edge clamp below (buildWaypoints's own room-bounded
// swing).
const ARCH_MAX_SWING_PX = 260;
// The closing hook (buildWaypoints): a dedicated point pinned above
// bucketX right before the final anchor, so the chute's last stretch is a
// true vertical drop. This is the share of the vertical run reserved for
// it, kept clear of the regular arches.
const END_HOOK_GAP_T = 0.28;
const FLOURISH_COUNT = 2;
const CECEK_DOT_SPACING = 9;
const REVEAL_DURATION_MS = 1100; // draw-in, first build only
const FALL_TO_CHUTE_DURATION_MS = 260; // spout -> wherever the chute crosses under it
const CHUTE_RIDE_LIFT_PX = 3; // rides a touch above the path's own centerline, rather than dead-center on it
// px/ms along the *actual* curve, not a flat total duration — the chute's
// real arc length varies a lot by viewport/build, so duration is derived
// per-roll from the real remaining arc length (spawnRoll) rather than
// assuming a fixed travel time regardless of curve length.
const ROLL_SPEED_PX_PER_MS = 0.35;
// Scales ROLL_SPEED_PX_PER_MS down for the shorter mobile chute — a ball
// rolling under gravity down a track roughly half as tall would realistically
// reach roughly sqrt(height ratio) of the top speed, not the same flat px/ms.
// Left at a flat constant, the mobile ball crossed its much shorter track at
// the same absolute speed as desktop's, reading as an unrealistic speed-up
// rather than a scaled-down roll.
const ROLL_SPEED_SCALE_MOBILE = Math.sqrt(CHUTE_HEIGHT_MOBILE / CHUTE_HEIGHT_MAX);
// Shared by spawnRoll and spawnFall's own ease-in-then-linear movement
// curves: the first ACCEL_TIME_FRACTION share of the duration eases in
// (easeInCubic) covering ACCEL_DISTANCE_FRACTION of the distance, then the
// rest holds a constant linear speed. ACCEL_DISTANCE_FRACTION is not a free
// tune — it's solved so the cubic's own instantaneous speed right as easing
// ends exactly matches the linear phase's constant speed (a cubic's speed
// at the end of its own eased interval is 3x that interval's average, so a
// naive even split overshoots the "terminal" speed and then visibly snaps
// down to it). Solving 3*f/(1-a) = (1-f)/a for f given the time split a
// gives f = a / (3 - 2a).
const ACCEL_TIME_FRACTION = 0.22;
const ACCEL_DISTANCE_FRACTION = ACCEL_TIME_FRACTION / (3 - 2 * ACCEL_TIME_FRACTION);
// Stretch & squash: the ball elongates along its direction of travel while
// falling (a speed cue) and relaxes back to round while rolling. Two
// stretch stages for the long fall (spawnFall) — modest while
// accelerating, fuller at terminal velocity — vs. one flat stretch for
// the brief spout->chute hop (spawnFallToChute). Each STRETCH_X is the
// volume-preserving reciprocal of its own STRETCH_Y, not an independent tune.
const FALL_STRETCH_Y_MID = 1.15;
const FALL_STRETCH_X_MID = 0.9;
const FALL_STRETCH_Y_MAX = 1.35;
const FALL_STRETCH_X_MAX = 0.8;
const HOP_STRETCH_Y = 1.25;
const HOP_STRETCH_X = 0.87;
// The moment the ball meets the chute (spawnRoll's first instant): a
// quick squash-then-spring-back impact absorption before settling into
// the round shape it keeps for the rest of the roll. Timed in real ms
// (not a fraction of the roll's own variable total) and run as its own
// independent `transform`-only animation, so it can't affect the movement
// animation's easing/timing.
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

// Shared by spawnRoll and spawnFall's own rAF loops (both replicate a
// WAAPI ease-in-then-linear keyframe curve by hand — see spawnRoll's own
// comment for why neither trusts Element.animate() for its movement).
const easeInCubic = (t) => t * t * t;
function lerp(a, b, u) {
  return a + (b - a) * u;
}

function documentPoint(rect) {
  return [rect.left + window.scrollX, rect.top + window.scrollY];
}

// Start: right under the spout. End: directly over the glass
// bucket's current x-center (the same target spawnFall measures later, so
// both stay consistent) — the chute itself stays near the top of the
// page; the long fall (spawnFall) covers the remaining distance to the
// glass.
function findAnchors() {
  // .countdown-window-bg, not .countdown-viewport itself — the latter's own
  // getBoundingClientRect() is its *border* box, which now extends past the
  // actual window fill (countdown-clock.js's chrome border-image is an
  // outer stroke, box-sizing: content-box, index.html). .countdown-window-bg
  // is position: absolute; inset: 0 with no border of its own, so its box
  // is exactly the fill's true edge regardless of how thick the outer
  // stroke is.
  const windowBg = document.querySelector('.countdown-window-bg');
  const glass = document.querySelector('.tl-glass');
  if (!windowBg || !glass) return null;
  const viewportRect = windowBg.getBoundingClientRect();
  const spout = documentPoint({ left: viewportRect.left + viewportRect.width / 2, top: viewportRect.bottom });
  const chuteTop = spout[1] + 36; // a small gap below the spout itself
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const chuteHeight = isMobile ? CHUTE_HEIGHT_MOBILE : CHUTE_HEIGHT_MAX;
  const glassRect = glass.getBoundingClientRect();
  const bucketX = documentPoint({ left: glassRect.left + glassRect.width / 2, top: 0 })[0];
  return { spout, chuteTop, bucketX, chuteHeight };
}

// The chute's waypoints — a short, wide S-wind sitting just below the
// spout. `bucketX` is a hard rule (see findAnchors): the last waypoint is
// pinned there exactly, so the long fall off the end drops straight down
// into the glass rather than diagonally.
//
// The starting waypoint sits on the *opposite side* of spoutX from
// bucketX, not just offset to one fixed side — a continuous line from one
// side of spoutX to the other is guaranteed to cross it somewhere, so the
// curve always passes under the spout regardless of which side the
// bucket is on. A fixed offset regardless of bucketX's side was the
// mobile bug: the mobile bucket sits well to the left, so a start point
// also offset left meant nothing guaranteed a crossing, and the drop had
// to visibly jump sideways to reach the chute.
function buildWaypoints(spoutX, chuteTop, bucketX, chuteHeight) {
  const minX = EDGE_MARGIN;
  // window.innerWidth, not just document.documentElement.clientWidth alone
  // — the smaller of the two is the true safe bound regardless of which
  // metric's own edge cases (scrollbar gutter, etc.) might otherwise read
  // wider than what's actually visible.
  const viewportWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
  const maxX = Math.max(minX + 1, viewportWidth - EDGE_MARGIN);
  const offset = X_JITTER * 0.3;
  const startX =
    bucketX >= spoutX ? Math.max(minX, spoutX - offset) : Math.min(maxX, spoutX + offset);

  const span = bucketX - startX;
  const swing = Math.min(ARCH_MAX_SWING_PX, Math.max(ARCH_MIN_SWING_PX, Math.abs(span) * ARCH_SWING_RATIO));

  // The first arch's side matches the overall travel direction
  // (Math.sign(span)), not a fixed left-or-right guess, so it compounds
  // with the line's own drift instead of fighting it — a fixed side could
  // land on some layouts (bucket left of spout) partly cancelling the
  // drift instead of adding to it.
  const firstSide = span >= 0 ? 1 : -1;

  // The regular arches only get the first `archSpan` share of the
  // vertical run — the closing hook below gets a dedicated final stretch
  // so it isn't competing with wherever the last regular arch landed.
  const archSpan = 1 - END_HOOK_GAP_T;
  const waypoints = [[startX, chuteTop]];
  for (let i = 1; i <= ARCH_COUNT; i++) {
    const t = (i / (ARCH_COUNT + 1)) * archSpan;
    const y = chuteTop + chuteHeight * t;
    const baseX = Math.min(maxX, Math.max(minX, startX + span * t));
    const side = i % 2 === 1 ? firstSide : -firstSide;
    // Bound the swing by the room actually left between this arch's own
    // base position and the screen edge on its swing side, not just clamp
    // the final point — clamping only the final point lets a large swing
    // silently flatten multiple arches onto the same edge value once the
    // base is already close to it, reading as one degenerate sweep instead
    // of a bounded one.
    const room = side > 0 ? maxX - baseX : baseX - minX;
    const boundedSwing = Math.max(0, Math.min(swing, room));
    const x = baseX + side * boundedSwing;
    waypoints.push([x, y]);
  }

  // The closing hook: *two* points pinned to bucketX exactly (same x,
  // differing only in y) — one point isn't enough. A single hook point
  // only forces the tangent vertical at the infinitesimal final instant;
  // the segment leading into it is still a cubic Bezier whose incoming
  // control point gets pulled sideways by the last arch's off-center
  // position, so the curve visibly bulges and snaps back at the end
  // instead of running straight down. With two colinear points, the final
  // segment's four control points (both endpoints plus both
  // Catmull-Rom-derived controls, which depend only on this pair) all
  // land on the same vertical line, making that whole last stretch a
  // genuinely straight drop — any bulge from the last arch stays confined
  // to the segment before hook1, which is where the "arch downward" bend
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
// point the falling drop lands on, and the arc-length fraction the roll
// should start from (everything before this is "upstream" of the meeting
// point and never gets rolled over).
//
// Queried against the real, rendered <path> element (getPointAtLength),
// not the flattened-polyline approximation used for dot/flourish
// placement (~16 samples per segment — fine there, not pixel-exact). The
// roll animation (spawnRoll) also positions the ball via offset-path
// using the browser's own path geometry, so using the same
// getPointAtLength for the fall's landing point keeps both stages exactly
// aligned instead of the ball visibly snapping a few px when the roll
// takes over.
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
  const state = { container: null, pathD: '', tendrilPathEl: null, crossingFraction: 0, totalLength: 0, endDoc: [0, 0], crossingDoc: [0, 0], spout: [0, 0], ball: null, chuteHeight: CHUTE_HEIGHT_MAX };
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

    // Local (container-relative) coordinates — the path and every rendered
    // dot/flourish all need to agree on this same space.
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
    // Segment picked weighted by its real arc length, not a uniform pick
    // by index — the closing hook packs several short segments into the
    // last stretch of the chute, so an index-uniform pick overrepresented
    // that small bottom region, reading as flourishes always landing near
    // the bottom.
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
    // One point serves both the fall's landing target and the roll's own
    // start — the fall must stay purely vertical, so it can only land on
    // the curve's crossing of the spout's x; anything else means either a
    // diagonal fall or a discontinuous jump at the handoff. Lifted by
    // CHUTE_RIDE_LIFT_PX (state.crossingDoc) to land on the same raised
    // line the roll rides (spawnRoll's own placeAt, which subtracts the
    // same constant from every point it reads off the drawn centerline)
    // rather than the drawn centerline itself.
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
    state.tendrilPathEl = tendrilPathEl;
    state.crossingFraction = crossingFraction;
    state.totalLength = totalLength;
    state.chuteHeight = chuteHeight;
    state.endDoc = [minX + endLocal[0], minY + endLocal[1]];
    state.crossingDoc = crossing
      ? [minX + crossing.x, minY + crossing.y - CHUTE_RIDE_LIFT_PX]
      : [spout[0], spout[1] - CHUTE_RIDE_LIFT_PX];
    state.spout = spout;
    builtOnce = true;
    return true;
  }

  // The long fall from the chute's end to wherever the glass currently
  // sits — measured fresh when it starts (not precomputed), so it lands
  // correctly wherever the glass has sunk to today. Document-positioned,
  // not viewport-fixed, since this can be a real off-screen journey down
  // the page.
  function spawnFall() {
    const glass = document.querySelector('.tl-glass');
    if (!glass || prefersReducedMotion) {
      if (state.ball) {
        state.ball.remove();
        state.ball = null;
      }
      window.dispatchEvent(new CustomEvent('chute:ball-landed'));
      return;
    }
    const glassRect = glass.getBoundingClientRect();
    const targetDoc = documentPoint({ left: glassRect.left + glassRect.width / 2, top: glassRect.top });
    const { endDoc } = state;

    // Reuses the same ball spawnFallToChute created and spawnRoll rode,
    // rather than creating a third fresh element for this last leg — see
    // spawnFallToChute's own comment for why. The roll (spawnRoll) already
    // leaves it plainly left/top-positioned with the CSS class's own
    // -6px centering margin untouched, so only left/top need setting here.
    const fallEl = state.ball;
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
    // The terminal velocity actually reached (px/ms), passed along so
    // dropIntoLiquid (glass-graphic.js, wired up in timeline-panel.js) can
    // keep moving at this exact speed into the liquid, rather than an
    // independently-chosen duration that likely wouldn't match.
    const totalDist = Math.hypot(dx, dy);
    const terminalSpeed =
      (totalDist * (1 - ACCEL_DISTANCE_FRACTION)) / (fallDuration * (1 - ACCEL_TIME_FRACTION));

    // Driven by rAF, not Element.animate() — see spawnRoll's own comment
    // for why. At 600-2800ms this fall is long enough that the same
    // stall-past-the-first-frame issue is obvious here too, unlike the
    // brief 260ms hop (spawnFallToChute), which is short enough that the
    // same underlying WAAPI issue likely goes unnoticed there.
    //
    // Accelerates for the first ~22% of the duration (ease-in), then
    // holds a constant terminal-velocity speed for the rest, rather than
    // continuing to accelerate or decelerate all the way down — the
    // glass-entry leg (dropIntoLiquid, glass-graphic.js) picks up at that
    // same linear rate, so there's no perceived slowdown at the handoff.
    // Stretch grows alongside speed the same way: round leaving the
    // chute, a modest elongation through the accelerating phase, holding
    // at its fullest once speed stops changing. translate/scale are
    // interpolated independently (not composed into a single matrix and
    // decomposed back out) — equivalent for this pure translate+scale
    // case, and far simpler to replicate by hand.
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / fallDuration);
      let u, fromX, fromY, fromSX, fromSY, toX, toY, toSX, toSY;
      if (t <= ACCEL_TIME_FRACTION) {
        u = easeInCubic(t / ACCEL_TIME_FRACTION);
        fromX = 0; fromY = 0; fromSX = 1; fromSY = 1;
        toX = dx * ACCEL_DISTANCE_FRACTION; toY = dy * ACCEL_DISTANCE_FRACTION; toSX = FALL_STRETCH_X_MID; toSY = FALL_STRETCH_Y_MID;
      } else {
        u = (t - ACCEL_TIME_FRACTION) / (1 - ACCEL_TIME_FRACTION);
        fromX = dx * ACCEL_DISTANCE_FRACTION; fromY = dy * ACCEL_DISTANCE_FRACTION; fromSX = FALL_STRETCH_X_MID; fromSY = FALL_STRETCH_Y_MID;
        toX = dx; toY = dy; toSX = FALL_STRETCH_X_MAX; toSY = FALL_STRETCH_Y_MAX;
      }
      const x = lerp(fromX, toX, u);
      const y = lerp(fromY, toY, u);
      const sx = lerp(fromSX, toSX, u);
      const sy = lerp(fromSY, toSY, u);
      fallEl.style.transform = `translate(${x}px, ${y}px) scale(${sx}, ${sy})`;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        fallEl.remove();
        state.ball = null;
        window.dispatchEvent(new CustomEvent('chute:ball-landed', { detail: { terminalSpeed } }));
      }
    }
    requestAnimationFrame(frame);
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
    const { container, crossingFraction, totalLength, tendrilPathEl } = state;
    // Reuses the same element spawnFallToChute created, rather than
    // creating a second fresh one — see spawnFallToChute's own comment.
    const ball = state.ball;
    // Clears the fall-to-chute leg's own left/top positioning — that leg's
    // own transform anim already defaults to fill: 'none', so it's unset
    // by the time onfinish runs, but left/top (set once, plainly, not
    // through the animation) still need clearing by hand. Left at the CSS
    // class's own margin-left/top: -6px (styles/organisms/drop-chute.css)
    // for the plain left/top positioning below to center on its point.
    ball.style.left = '';
    ball.style.top = '';
    container.appendChild(ball);
    // Landing cuts the fall's fast terminal-velocity speed down a lot
    // (the roll animation starts fresh at its own t=0), but not to a dead
    // stop — both ends ease gently, with the steepest stretch through the
    // middle. Duration comes from the real remaining arc length divided
    // by a target px/ms, not a flat total, since the curve's actual
    // length varies by viewport.
    const remaining = 1 - crossingFraction;
    const remainingLength = totalLength * remaining;
    const rollSpeed =
      state.chuteHeight <= CHUTE_HEIGHT_MOBILE
        ? ROLL_SPEED_PX_PER_MS * ROLL_SPEED_SCALE_MOBILE
        : ROLL_SPEED_PX_PER_MS;
    const movementDuration = Math.max(250, remainingLength / rollSpeed);
    const crossingPct = crossingFraction * 100;

    // Same accelerate-then-hold-terminal-velocity shape as the long fall
    // (spawnFall) — ease in for the first 22% of the duration, then a
    // flat linear stretch for the rest, so the ball reaches and holds one
    // constant top speed along the chute.
    const postCrossingPctRange = 100 - crossingPct;
    const accelEndPct = crossingPct + postCrossingPctRange * ACCEL_DISTANCE_FRACTION;

    // Driven by manual requestAnimationFrame + getPointAtLength (same
    // technique atoms/liquid-ripple.js's own rAF loop uses) rather than
    // Element.animate() on offset-path/offsetDistance — confirmed against
    // a real corporate/locked-down browser environment that an
    // offset-path-driven WAAPI animation on this element can report a
    // correct, on-schedule Animation.currentTime (and still fire onfinish
    // right on time) while never actually repainting past its first
    // frame or two, leaving the ball visibly frozen the whole way down.
    // Whatever that environment's exact cause, setting left/top directly
    // every frame doesn't depend on offset-path at all. Reads points off
    // the drawn (un-lifted) tendrilPathEl and subtracts CHUTE_RIDE_LIFT_PX
    // from y itself, rather than querying a separately-built lifted path
    // — a pure vertical translation, so this is exact, not approximate.
    function placeAt(pct) {
      const len = (pct / 100) * totalLength;
      const p = tendrilPathEl.getPointAtLength(len);
      ball.style.left = `${p.x}px`;
      ball.style.top = `${p.y - CHUTE_RIDE_LIFT_PX}px`;
    }

    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / movementDuration);
      const pct =
        t <= ACCEL_TIME_FRACTION
          ? crossingPct + (accelEndPct - crossingPct) * easeInCubic(t / ACCEL_TIME_FRACTION)
          : accelEndPct + (100 - accelEndPct) * ((t - ACCEL_TIME_FRACTION) / (1 - ACCEL_TIME_FRACTION));
      placeAt(pct);
      if (t < 1) requestAnimationFrame(frame);
      else spawnFall();
    }
    requestAnimationFrame(frame);

    // The landing squash: its own fixed real-ms duration (not a fraction
    // of the roll's own highly variable total), so it neither lengthens
    // nor shortens depending on how long that particular roll happens to
    // be. Plain `transform`, not offset-path, so this one's unaffected by
    // the environment issue above — stays on Element.animate().
    ball.animate(
      [
        { transform: `scale(${LANDING_SQUASH_X}, ${LANDING_SQUASH_Y})`, easing: 'ease-out' },
        { transform: 'scale(1, 1)' },
      ],
      { duration: LANDING_SQUASH_MS }
    );
  }

  // The drop falls straight down from the spout until it meets the chute
  // at the crossing point found above, *then* starts rolling — not a
  // roll starting from the chute's own literal first waypoint.
  //
  // One ball element is created here and carried through all three legs
  // (this fall, the roll, and the final long fall) by spawnRoll/spawnFall
  // reusing state.ball instead of each leg creating and destroying its
  // own — repeatedly removing and recreating an element on this same
  // patch of page, every release cycle, was implicated in a mobile
  // Safari-only rendering glitch where nearby filtered/clipped elements
  // (the chute's own SVG, the water clock housing) would render
  // incorrectly for a few seconds right around the roll-to-fall handoff,
  // until the next release's fresh element forced a repaint. One element
  // reused start-to-finish, reparented and reconfigured in place at each
  // leg instead of replaced, means far less DOM churn for WebKit's
  // renderer to trip over.
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
    state.ball = fallEl;

    // Purely vertical — a real drop falls straight down, not at a
    // diagonal. `crossingDoc` is the literal point where the chute
    // crosses the spout's own x (findCrossingOnPath), the same point
    // spawnRoll starts from, so dy alone always reaches it exactly, and
    // the fall hands off into the roll with perfect continuity.
    const dy = crossingDoc[1] - spout[1];

    // Driven by rAF, not Element.animate() — see spawnRoll's own comment
    // for why. At 260ms this hop is short enough that the same stall
    // likely went unnoticed here, but there's no reason to leave one
    // WAAPI-driven leg in once the other two needed converting.
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / FALL_TO_CHUTE_DURATION_MS);
      const u = easeInCubic(t);
      const y = lerp(0, dy, u);
      const sx = lerp(1, HOP_STRETCH_X, u);
      const sy = lerp(1, HOP_STRETCH_Y, u);
      fallEl.style.transform = `translate(0, ${y}px) scale(${sx}, ${sy})`;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        // Element.animate()'s default fill: 'none' used to revert this
        // automatically once the animation finished — a manual rAF loop
        // has to clear it by hand, or the roll (which only ever sets
        // left/top, never transform) would inherit this leftover
        // translate/scale stacked on top of its own positioning.
        fallEl.style.transform = '';
        spawnRoll();
      }
    }
    requestAnimationFrame(frame);
  }

  if (!buildChute()) return;

  // The page loads a Google Font (--font-display: "Syne") with
  // display=swap — text first renders in the fallback font, then reflows
  // once Syne downloads, which can shift .hero-title's height and push
  // the countdown window (and spout) up or down after this first build
  // already ran, silently baking a stale spout y-coordinate into the
  // chute's geometry.
  //
  // Corrected via a rigid nudge of the *existing* container/state by
  // (deltaX, deltaY) — not a full buildChute() rebuild, which would
  // regenerate the path/dots/flourishes with fresh randomness and swap in
  // a visibly different-looking chute. A text reflow only ever adds
  // vertical height, so the font-swap resync below always passes
  // deltaX=0; the resize listener further down passes both axes, since a
  // resize can shift layout horizontally too.
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

  // Rebuilds on resize (including across the mobile/desktop breakpoint,
  // where the glass bucket's position changes layout entirely) —
  // debounced, since a live drag-resize fires far more often than
  // actually needs a full regeneration of path/dots/flourishes.
  //
  // Between debounce ticks, resyncPosition (cheap: one findAnchors() call
  // plus a translation, no regeneration) runs on every resize event so
  // the chute tracks the layout while dragging, rather than sticking at
  // its old position until the debounced rebuild finally fires.
  //
  // The full rebuild itself only fires on a genuine width change, though
  // — mobile Safari (and other mobile browsers) fire a real `resize`
  // event whenever the URL bar/toolbar collapses or expands on scroll,
  // which changes window.innerHeight with no actual layout change to
  // account for. Rebuilding on that too meant the flourishes re-rolled
  // to a new random arrangement on ordinary scrolling — nothing about
  // the chute's own geometry depends on viewport height, only width
  // (findAnchors/buildWaypoints), so height-only resizes just resync
  // position like every other resize and skip the regeneration.
  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const anchors = findAnchors();
    if (anchors) resyncPosition(anchors.spout[0] - state.spout[0], anchors.spout[1] - state.spout[1]);
    const width = window.innerWidth;
    if (width === lastWidth) return;
    lastWidth = width;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildChute, RESIZE_DEBOUNCE_MS);
  });
}
