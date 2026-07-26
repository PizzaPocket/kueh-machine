// Atom: a generative colored-wire bundle — a small, per-instance-
// randomized SVG meant to read as loose electrical/network cabling running
// behind a panel, glimpsed through whatever window it's dropped into. (Its
// first consumer: the Check In section's per-contributor "socket" windows
// AND its left/right margin strips, src/organisms/check-in.js — each
// contributor's own machine plugged in somewhere back there.) Colors are
// pulled from kueh-icon.js's own kuehWireColors — every kueh's actual
// food-body colors, the same palette the avatars sitting in front of these
// wires are drawn from — rather than a literal electrical-cable
// convention (red/yellow/green/blue/white/orange), so the wiring reads as
// belonging to the same machine as the kueh it's plugged into.
//
// Modeled directly off reference photos of real structured cabling, not
// "colorful random lines" — the thing that actually reads as wiring rather
// than confetti is: strands travel in GROUPS along one shared path rather
// than each wandering independently, that shared path is a smooth sag
// (like a loose cable under its own weight) rather than a free squiggle,
// individual strands stay tight together right at their anchor points
// (like plugged into adjacent slots) and only loosen mid-span, and each
// bundle sits at one depth (its own weight/opacity) rather than every
// strand competing at the same visual weight.
//
// The draw-in reveal (revealWireBundle) mirrors src/atoms/batik-pattern.js's
// own revealBatikPattern — same stroke-dasharray/dashoffset + Web
// Animations API technique, same "group draws together, groups stagger
// one after another" structure (there: cluster: here: bundle) — reusing an
// established pattern rather than inventing a second reveal mechanism.

import { kuehWireColors } from './kueh-icon.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW_WIDTH = 100;
// How far an arc's apex is ever allowed to spill past the strip's own
// width, past this the width has to be actively brought back in — deliberate
// gutter bleed, not the "arc creeps hundreds of units into the content"
// bug this same value is a hard backstop against (see sagControl).
const SAG_X_BLEED = 10;

// Computed once at module load — KUEH_SEED_TABLE is a fixed table, not
// something that changes at runtime, so there's no need to recompute this
// per bundle.
const WIRE_COLORS = kuehWireColors();

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(rand(0, arr.length))];
}

// A point just past one of the viewBox's edges, kept off the very
// corners — an "entry slot" a bundle plugs in from, as if routed in from
// behind the panel rather than starting loose mid-air. Just past the edge
// (not exactly on it) so it visibly runs into the crop at whatever angle
// it's cut off, instead of every bundle ending on a suspiciously exact
// boundary line. Offsets scale with `h` (viewHeight) so the "just past the
// edge" amount stays proportionate on the much taller margin viewBox, not
// a fixed 8 units that reads as barely-past on a viewBox several hundred
// units tall. `excludeSide` ('top'/'right'/'bottom'/'left') drops one side
// from the pool — for a caller whose that side doesn't actually leave the
// visible page (see buildWireBundle's own `innerSide`), so this only ever
// hands back anchors that genuinely disappear off-screen.
function edgeAnchor(h, excludeSide) {
  const bleed = Math.max(8, h * 0.03);
  const sides = ['top', 'right', 'bottom', 'left'].filter((s) => s !== excludeSide);
  const side = sides[Math.floor(rand(0, sides.length))];
  const tx = rand(VIEW_WIDTH * 0.1, VIEW_WIDTH * 0.9);
  const ty = rand(h * 0.1, h * 0.9);
  if (side === 'top') return { x: tx, y: -bleed };
  if (side === 'right') return { x: VIEW_WIDTH + bleed, y: ty };
  if (side === 'bottom') return { x: tx, y: h + bleed };
  return { x: -bleed, y: ty }; // left
}

function jitter(pt, amount) {
  return { x: pt.x + rand(-amount, amount), y: pt.y + rand(-amount, amount) };
}

// Perpendicular sag off the straight p1->p2 line — a smooth loose-cable
// droop rather than a freely-placed bezier control point, which is what
// made an earlier version read as scribbles instead of cable.
//
// sagMax scales with the segment's own length, which is fine on a
// squarish viewBox but breaks down on the tall narrow margin strip: a
// near-vertical run from a top anchor to a bottom anchor can be hundreds
// of units long, and the sag direction for a near-vertical segment points
// almost entirely sideways — so the apex would swing hundreds of units
// out in x, straight into the page's actual content, on a strip that's
// only VIEW_WIDTH units wide. buildWireBundle's own organizer routing is
// the primary fix (breaking long runs into shorter, individually-safe
// hops), but this clamp is the hard backstop that holds regardless: no
// arc's apex — organizer-routed or not — can ever land more than
// SAG_X_BLEED past the strip's own edges.
function sagControl(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const sagMax = Math.max(20, len * 0.35);
  const sag = rand(-sagMax, sagMax);
  const x = (p1.x + p2.x) / 2 + nx * sag;
  const y = (p1.y + p2.y) / 2 + ny * sag;
  return {
    x: Math.min(VIEW_WIDTH + SAG_X_BLEED, Math.max(-SAG_X_BLEED, x)),
    y,
  };
}

// One bundle = several strands sharing a single sagging path between two
// given anchors, not each strand choosing its own independent route.
// `start`/`end` are handed in by the caller (buildWireBundle) rather than
// picked here, so the same function serves plain edge-to-edge runs and
// runs that pass through an organizer waypoint (`via`) alike. Each strand
// is tagged data-bundle=bundleIndex so revealWireBundle can group/stagger
// the draw-in by bundle regardless of final DOM order (see
// buildWireBundle's own depth-sort, which reorders strands across
// bundles).
function buildBundle(svg, start, end, bundleIndex, via, viaControls) {
  // One shared control point per segment, computed once for the whole
  // bundle — not per strand. Recomputing sagControl per strand (the via
  // case used to) gives each strand its own independent random bow, and
  // on a long arch (large sagMax) those independent draws can diverge far
  // enough from each other to read as loose scattered lines instead of
  // one grouped bundle. A single shared control with only a small ±9
  // per-strand jitter (matching the non-via case below) keeps the whole
  // bundle traveling as one cable even through an organizer.
  //
  // The via case's control points are handed in (viaControls), not
  // computed here — buildWireBundle needs those exact same points itself,
  // to orient the organizer mark along the curve's REAL tangent through
  // that point rather than a straight-line approximation of it. Computing
  // them twice would let the two drift apart (a fresh sagControl call
  // rolls its own random sag), which was quietly making the mark's
  // orientation slightly wrong even after it was based on the bend rather
  // than the raw chord.
  const control = via ? null : sagControl(start, end);
  const control1 = via ? viaControls.control1 : null;
  const control2 = via ? viaControls.control2 : null;

  // One depth per bundle, not per strand — a whole bundle reads as one
  // cable sitting at one distance behind the panel; thicker/more opaque
  // reads as nearer, thinner/fainter as further back. Floored at 0.35 (not
  // 0), so an unlucky roll never produces an almost-invisible bundle — the
  // reference photos are dense throughout, nothing in them fades to
  // nothing.
  const depth = rand(0.35, 1);
  const baseWidth = 1.1 + depth * 1.3;
  const baseOpacity = 0.55 + depth * 0.4;

  const strandCount = Math.round(rand(10, 18));
  for (let i = 0; i < strandCount; i++) {
    // Tight at both anchors (like plugged into adjacent slots of the same
    // connector) but loose around each segment's own control point — the
    // "organized at the connection, chaotic mid-span" pattern the
    // reference photos all show.
    const s = jitter(start, 3);
    const e = jitter(end, 3);

    let d;
    if (via) {
      // Two joined quadratic segments, s->v->e — the strand visibly runs
      // PAST/THROUGH the organizer's own position (tight jitter, like
      // actually gathered by it) rather than starting or ending there;
      // start/end stay the real edge anchors passed in.
      const v = jitter(via, 2.5);
      const c1 = jitter(control1, 9);
      const c2 = jitter(control2, 9);
      d = `M ${s.x} ${s.y} Q ${c1.x} ${c1.y}, ${v.x} ${v.y} Q ${c2.x} ${c2.y}, ${e.x} ${e.y}`;
    } else {
      const c = jitter(control, 9);
      d = `M ${s.x} ${s.y} Q ${c.x} ${c.y}, ${e.x} ${e.y}`;
    }

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', pick(WIRE_COLORS));
    path.setAttribute('stroke-width', Math.max(0.6, baseWidth + rand(-0.2, 0.2)).toFixed(2));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', Math.min(1, Math.max(0.3, baseOpacity + rand(-0.1, 0.1))).toFixed(2));
    path.dataset.bundle = String(bundleIndex);
    svg.appendChild(path);
  }

  return depth;
}

// A wire organizer clip standing in for a real cable comb/P-clip — a
// thick curved bracket, not a mere dot — cradling whatever strands happen
// to route past it (buildBundle's own `via`). `angle` (radians) is the
// LOCAL direction the wires it's gathering actually run through this
// point (the caller averages it from those bundles' own start->end
// vectors) — the bracket's own cross-bar (chord) is drawn PERPENDICULAR
// to that, like a staple laid crosswise over a cable rather than a
// clip that happens to run parallel to it. The bulge itself is shallow
// (archDepth well under half the chord length) — a slight press-down
// along the wire direction, not the near-full-semicircle first-draft
// version had. Stroked with a gradient running PERPENDICULAR to the
// bracket's own chord (across its thickness, along the same `angle` axis
// the chord itself is drawn crosswise to) — dark #B8860B to lighter
// #E8C547, a yellow cable-clip/P-clip tone — reading as light catching
// one edge of the material's rounded profile, not a sheen running down
// its length.
// Each mark gets its own <linearGradient> (gradientCounter keeps ids
// unique across every organizer on the page, since SVG ids are
// document-global, not scoped to one <svg>).
let gradientCounter = 0;

function buildOrganizerMark(svg, pos, angle) {
  const halfLen = 4;
  const archDepth = 1.2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const px = -dy; // perpendicular to the wire direction — the chord's own axis
  const py = dx;

  const p1 = { x: pos.x - px * halfLen, y: pos.y - py * halfLen };
  const p2 = { x: pos.x + px * halfLen, y: pos.y + py * halfLen };
  const bulge = { x: pos.x + dx * archDepth, y: pos.y + dy * archDepth };

  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defs);
  }
  // Spans roughly the stroke's own width (half on either side of pos)
  // along the (dx, dy) wire-direction axis — perpendicular to the p1->p2
  // chord — so the gradient crosses the bracket's thickness rather than
  // running along its length.
  const strokeHalfWidth = 2.75;
  const g1 = { x: pos.x - dx * strokeHalfWidth, y: pos.y - dy * strokeHalfWidth };
  const g2 = { x: pos.x + dx * strokeHalfWidth, y: pos.y + dy * strokeHalfWidth };
  const gradientId = `wire-organizer-gradient-${gradientCounter++}`;
  const gradient = document.createElementNS(SVG_NS, 'linearGradient');
  gradient.setAttribute('id', gradientId);
  gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
  gradient.setAttribute('x1', g1.x);
  gradient.setAttribute('y1', g1.y);
  gradient.setAttribute('x2', g2.x);
  gradient.setAttribute('y2', g2.y);
  const stopStart = document.createElementNS(SVG_NS, 'stop');
  stopStart.setAttribute('offset', '0%');
  stopStart.setAttribute('stop-color', '#B8860B');
  const stopEnd = document.createElementNS(SVG_NS, 'stop');
  stopEnd.setAttribute('offset', '100%');
  stopEnd.setAttribute('stop-color', '#E8C547');
  gradient.append(stopStart, stopEnd);
  defs.appendChild(gradient);

  const mark = document.createElementNS(SVG_NS, 'path');
  mark.setAttribute('d', `M ${p1.x} ${p1.y} Q ${bulge.x} ${bulge.y}, ${p2.x} ${p2.y}`);
  mark.setAttribute('fill', 'none');
  mark.setAttribute('stroke', `url(#${gradientId})`);
  mark.setAttribute('stroke-width', '5.5');
  mark.setAttribute('stroke-linecap', 'round');
  return mark;
}

/**
 * Builds one randomized wire-bundle <svg>. viewBox is a fixed
 * `0 0 100 viewHeight` regardless of the target box's real aspect ratio,
 * with preserveAspectRatio="none" stretching it to fill — deliberately
 * skipping the ResizeObserver-driven real-pixel-coordinate approach
 * createRetroShape uses (src/atoms/retro-shape.js), since this is loose
 * organic content with no exact proportions to preserve in the first
 * place. `viewHeight` defaults to 100 (a roughly square window) but should
 * be set to roughly match the real target box's own aspect ratio for a
 * very different shape (e.g. a tall narrow margin strip) — matching it
 * keeps stroke-width/sag/bleed (all tuned in these viewBox units) reading
 * at a consistent visual scale rather than getting stretched thin or
 * bunched up tight.
 *
 * `bundleCount` groups of strands (default random 5-8). Without
 * `innerSide`, each enters from its own random edge anchor, and about half
 * the time all bundles share one common exit anchor instead of each
 * picking their own — a converging "trunk" look, alongside the more
 * independent multi-bundle look the rest of the time, echoing how the
 * reference photos aren't all one wiring scene: some show a funnel into
 * one cable, others show looser independent runs.
 *
 * `innerSide` ('left' | 'right') names the one edge that doesn't actually
 * leave the visible page — a margin strip's inner side, which only bleeds
 * a short way into the gutter before stopping in open space, unlike the
 * other three sides which are hard-clipped by the section's own
 * overflow:hidden a few px further out (see check-in.js's own
 * marginWireOptions for the full reasoning). When set, EVERY bundle still
 * starts and ends at a genuine off-screen edge (top/bottom/outer) — wires
 * never originate from an anchor, only from the top, bottom, or a side,
 * same as the plain case below.
 *
 * What changes is how a bundle whose two anchors are far apart gets
 * built: arching that whole span in one unbroken sag is exactly what used
 * to let an arc's apex swing far outside the strip's own narrow width,
 * reading as wire creeping into the page's actual content — the strip is
 * often many times taller than it is wide, so "far apart" routinely means
 * "top of the strip to the bottom." Any such long run instead gets
 * assigned the nearest "organizer" clip (buildOrganizerMark) to its own
 * midpoint and routed THROUGH it mid-span (buildBundle's own `via`) —
 * arching in from its edge, bending at the clip, and arching back out
 * toward its other edge — so neither half ever has to cover more than
 * roughly half the original distance. Organizers themselves are spread in
 * even bands down the strip's height (enough of them that no long run is
 * ever far from one, with spare capacity added if an unusually large
 * batch of long runs shows up in one build), positioned anywhere across
 * the strip's width (either side, not just the inner half) — a clip only
 * ever renders if a run actually got routed through it. Short runs (both
 * anchors already close together) need no organizer at all and just sag
 * directly; sagControl's own hard x-clamp is the backstop that holds
 * regardless of whether a run went through a clip.
 */
export function buildWireBundle({ bundleCount, viewHeight = 100, innerSide = null } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'wire-bundle');
  svg.setAttribute('viewBox', `0 0 ${VIEW_WIDTH} ${viewHeight}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const count = bundleCount ?? Math.round(rand(5, 8));
  const fragment = document.createDocumentFragment();
  const bundles = [];
  const markers = [];

  if (innerSide) {
    // Anchors picked up front (not inline in the build loop below) so
    // assignment can look at each bundle's own start->end span before
    // deciding whether it needs an organizer at all.
    const anchors = Array.from({ length: count }, () => ({
      start: edgeAnchor(viewHeight, innerSide),
      end: edgeAnchor(viewHeight, innerSide),
    }));

    // A run whose ends are this far apart (vertically) can't be arched in
    // one unbroken sag without swinging far outside the strip's own
    // narrow width — that's the actual "creeps into content" bug. Runs
    // shorter than this stay a single safe, naturally-modest direct arc.
    const LONG_RUN = viewHeight * 0.35;
    const longRunIndices = anchors
      .map((a, i) => (Math.abs(a.end.y - a.start.y) > LONG_RUN ? i : -1))
      .filter((i) => i >= 0);

    // Enough clips, spread in even bands down the strip's height, that
    // every long run has one genuinely nearby to stop at — too few just
    // relocates the same overshoot to a wider gap between clips — with
    // spare capacity (the third term) if an unusually large share of this
    // particular build's bundles turn out to be long runs.
    const organizerCount = Math.max(
      1,
      Math.round(viewHeight / 200),
      Math.ceil(longRunIndices.length / 2),
    );
    const organizers = Array.from({ length: organizerCount }, (_, i) => ({
      x: rand(VIEW_WIDTH * 0.12, VIEW_WIDTH * 0.88),
      y: ((i + 0.5) / organizerCount) * viewHeight + rand(-viewHeight * 0.05, viewHeight * 0.05),
      dxSum: 0,
      dySum: 0,
      claimed: 0,
      // { bundleIndex, fraction } per run claimed — fraction is how far
      // (by straight-line proxy, start->via vs via->end) into that run's
      // own draw the organizer sits, so revealWireBundle can time the
      // clip's own appearance to land right as the wire actually reaches
      // it, instead of every clip popping in together at a fixed point in
      // the whole sequence regardless of where it really sits.
      viaEntries: [],
    }));

    // Each long run is routed through its own nearest clip (by midpoint),
    // preferring one that hasn't already gathered a couple of bundles —
    // a real cable clip only gathers a bundle or two, not an unpredictable
    // chunk of everything running through the margin.
    const viaForBundle = new Array(count).fill(null);
    const viaControlsForBundle = new Array(count).fill(null);
    for (const i of longRunIndices) {
      const { start, end } = anchors[i];
      const midY = (start.y + end.y) / 2;
      const ranked = [...organizers].sort((a, b) => Math.abs(a.y - midY) - Math.abs(b.y - midY));
      const org = ranked.find((o) => o.claimed < 2) ?? ranked[0];
      viaForBundle[i] = org;

      // Still needed for the actual drawn curve — computed here (once,
      // not per strand) and handed down to buildBundle.
      viaControlsForBundle[i] = { control1: sagControl(start, org), control2: sagControl(org, end) };

      // The mark's angle deliberately ignores the bend at the organizer
      // and just uses the straight run from A (start) to C (end) — trying
      // to match the curve's exact local tangent at the organizer (what
      // this used to do) chases a moving target, since that tangent
      // shifts with whatever sag got rolled for this particular bundle.
      // A straight line from where the run actually originates to where
      // it actually disappears is a stable reference that reads as "this
      // clip is roughly clamping over the wire passing through B" without
      // needing to match the curve exactly.
      //
      // When an organizer claims two runs, their angles get combined via
      // the double-angle trick below rather than summing (end-start)
      // vectors directly — two runs along roughly the same line but
      // opposite senses (one top->bottom, the other bottom->top) would
      // otherwise partly cancel each other's vector, leaving a resultant
      // that doesn't represent either run and can land the clip anywhere,
      // including reading as parallel instead of crossing them. Since the
      // clip only cares about the LINE a run travels along (its own
      // symmetric chord looks identical for a direction and its 180°
      // opposite), doubling each angle before summing makes opposite
      // senses reinforce instead of cancel.
      const runAngle = Math.atan2(end.y - start.y, end.x - start.x);
      org.dxSum += Math.cos(2 * runAngle);
      org.dySum += Math.sin(2 * runAngle);
      org.claimed++;

      // Straight-line proxy for how far along this run's own draw the
      // organizer sits — close enough for reveal timing purposes without
      // needing the actual bezier arc length.
      const lenIn = Math.hypot(org.x - start.x, org.y - start.y) || 1;
      const lenOut = Math.hypot(end.x - org.x, end.y - org.y) || 1;
      org.viaEntries.push({ bundleIndex: i, fraction: lenIn / (lenIn + lenOut) });
    }

    for (let i = 0; i < count; i++) {
      const { start, end } = anchors[i];
      const bundleSvg = document.createElementNS(SVG_NS, 'svg');
      const depth = buildBundle(bundleSvg, start, end, i, viaForBundle[i], viaControlsForBundle[i]);
      bundles.push({ depth, paths: [...bundleSvg.childNodes] });
    }

    for (const org of organizers) {
      // A clip nothing was routed through has nothing to gather — skip
      // it rather than drawing hardware that isn't clipping anything.
      if (!org.claimed) continue;
      // Halved to undo the doubling above — atan2 of a doubled angle sum
      // recovers the averaged LINE, not direction, which is all the
      // symmetric chord mark needs.
      const angle = Math.atan2(org.dySum, org.dxSum) / 2;
      const mark = buildOrganizerMark(svg, org, angle);
      // Read by revealWireBundle to time this clip's own draw-in against
      // whichever run(s) actually pass through it — see viaEntries above.
      mark.dataset.viaMap = org.viaEntries.map((e) => `${e.bundleIndex}:${e.fraction.toFixed(3)}`).join('|');
      markers.push(mark);
    }
  } else {
    const sharedEnd = Math.random() < 0.5 ? edgeAnchor(viewHeight) : null;
    for (let i = 0; i < count; i++) {
      const start = edgeAnchor(viewHeight);
      const end = sharedEnd ?? edgeAnchor(viewHeight);
      const bundleSvg = document.createElementNS(SVG_NS, 'svg');
      const depth = buildBundle(bundleSvg, start, end, i);
      bundles.push({ depth, paths: [...bundleSvg.childNodes] });
    }
  }

  bundles.sort((a, b) => a.depth - b.depth);
  for (const bundle of bundles) {
    for (const path of bundle.paths) fragment.appendChild(path);
  }
  // Organizer clips paint last (topmost) — the wires visibly run past
  // and behind the hardware, not the other way round.
  for (const mark of markers) fragment.appendChild(mark);
  svg.appendChild(fragment);

  return svg;
}

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

function animateStrandDraw(path, delay, duration) {
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;
  path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
    duration,
    delay,
    easing: 'ease-out',
    fill: 'forwards',
  });
}

// A quick draw-in, reusing the same stroke-draw mechanic as the wires
// themselves (just a much shorter duration) rather than a plain fade —
// matches the "drawn in real time" language the rest of the reveal uses.
const MARK_APPEAR_DURATION = 180;

/**
 * Builds a wire bundle (buildWireBundle, same options) and inserts it into
 * `container` (before `beforeNode`, if given — e.g. so it lands behind an
 * outlet graphic that's already in the DOM), then — unless the visitor
 * prefers reduced motion — plays a one-time "drawn in real time" reveal:
 * each bundle's strands draw together (small intra-bundle stagger for
 * texture), one bundle after another. Meant to be called from an
 * IntersectionObserver callback (see check-in.js), not eagerly at build
 * time, the same "only exists once it's actually been scrolled to" timing
 * batik-accents.js already uses for the brief-section margins.
 *
 * `options.speedScale` (default 1) stretches the whole reveal's timing —
 * the per-window graphics (viewHeight ~100) read fine at the base speed,
 * but the margin strips are drawn at the exact same viewBox-unit speed
 * while covering many times the real on-screen distance, which reads as
 * rushed; check-in.js's marginWireOptions passes a >1 scale to slow just
 * those down without touching the per-window default.
 */
export function revealWireBundle(container, beforeNode, options = {}) {
  const svg = buildWireBundle(options);
  container.insertBefore(svg, beforeNode ?? null);

  if (prefersReducedMotion) return svg;

  const speedScale = options.speedScale ?? 1;
  const allPaths = Array.from(svg.querySelectorAll('path'));
  const strandPaths = allPaths.filter((p) => p.dataset.bundle !== undefined);
  const marks = allPaths.filter((p) => p.dataset.viaMap !== undefined);
  const bundleIds = [...new Set(strandPaths.map((p) => p.dataset.bundle))];

  const bundleStagger = (bundleIds.length > 1 ? Math.min(180, 1400 / (bundleIds.length - 1)) : 180) * speedScale;
  const strandIntraStagger = 25 * speedScale;
  const strandDuration = 500 * speedScale;

  bundleIds.forEach((bundleId, bi) => {
    const bundleStart = bi * bundleStagger;
    strandPaths
      .filter((p) => p.dataset.bundle === bundleId)
      .forEach((path, i) => animateStrandDraw(path, bundleStart + i * strandIntraStagger, strandDuration));
  });

  // Each clip appears right as the wire it's gathering actually reaches
  // it — the last strand of its claiming bundle(s) to arrive there, not
  // a fixed point in the whole sequence unrelated to where it sits.
  marks.forEach((mark) => {
    const entries = mark.dataset.viaMap.split('|').map((pair) => {
      const [bundleIndex, fraction] = pair.split(':');
      return { bundleIndex, fraction: parseFloat(fraction) };
    });
    let latestArrival = 0;
    for (const { bundleIndex, fraction } of entries) {
      const bi = bundleIds.indexOf(bundleIndex);
      if (bi === -1) continue;
      const strandCount = strandPaths.filter((p) => p.dataset.bundle === bundleIndex).length;
      const lastStrandStart = bi * bundleStagger + (strandCount - 1) * strandIntraStagger;
      latestArrival = Math.max(latestArrival, lastStrandStart + fraction * strandDuration);
    }
    animateStrandDraw(mark, latestArrival, MARK_APPEAR_DURATION);
  });

  return svg;
}
