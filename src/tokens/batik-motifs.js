// Pure procedural geometry for the batik motif field — three different
// motif "grammars" (bloom, vine, paisley — see the variant builders near
// the bottom), all built from the same small set of bezier/cecek/layout
// primitives above them. No DOM, no color: this module hands back plain
// path-data strings and coordinates, the same "pure math, zero coupling"
// role src/tokens/colors.js plays for the palette system.
// src/atoms/batik-pattern.js turns the output into an actual <svg>.
//
// Every variant returns the same composition shape — { width, height,
// tendrils, leaves, petals, dots } — regardless of how different its
// motifs look, so src/atoms/batik-pattern.js's rendering and reveal
// animation never need to know which variant produced them. `petals` and
// `leaves` items may carry an optional `extraD` — a secondary thin-stroke
// detail (a bell's stamens, a paisley's curled tail, a leaf's midrib) —
// and `dots` items may override `radius`/`fill` (a scattered berry vs. a
// cecek stitch), both purely additive so the bloom variant's plain petals
// and default-styled dots don't need to opt into anything.
//
// Arrangement is intentionally NOT seeded — every call reshuffles via
// Math.random(), same convention src/tokens/chrome-metal.js uses for its
// glint jitter. A batik panel that redrew identically every visit would
// undercut the "drawn fresh, right now" feel this is going for; color
// coherence with the day's kueh comes for free anyway, since the rendered
// SVG references the live --color-* custom properties rather than any
// seed-derived palette (see batik-pattern.js). Which variant gets used is
// unseeded for the same reason — see buildBatikComposition at the bottom.

function jitter(range) {
  return (Math.random() * 2 - 1) * range;
}

function fmt(n) {
  return Math.round(n * 100) / 100;
}

function segmentsToPath(segments) {
  const start = segments[0][0];
  let d = `M ${fmt(start[0])},${fmt(start[1])}`;
  for (const seg of segments) {
    d += ` C ${fmt(seg[1][0])},${fmt(seg[1][1])} ${fmt(seg[2][0])},${fmt(seg[2][1])} ${fmt(seg[3][0])},${fmt(seg[3][1])}`;
  }
  return `${d} Z`;
}

// --- motif shapes -----------------------------------------------------
// Each shape is authored as a fraction-of-length/width control-point
// family (the "anchor"), jittered by a small authored range (the
// "irregularity") — the same split chrome-metal's buildGlintEvents uses
// for its transitions, just expressed in bezier control points instead of
// gradient stops.

function petalSegments(length, width) {
  const cx1 = width * (0.3 + jitter(0.08));
  const cy1 = -length * (0.15 + jitter(0.08));
  const cx2 = width * (0.55 + jitter(0.08));
  const cy2 = -length * (0.7 + jitter(0.08));
  const base = [0, 0];
  const tip = [0, -length];
  return [
    [base, [cx1, cy1], [cx2, cy2], tip],
    [tip, [-cx2, cy2], [-cx1, cy1], base],
  ];
}

export function petalPath(length, width) {
  const segments = petalSegments(length, width);
  return { d: segmentsToPath(segments), segments };
}

function leafSegments(length, width) {
  const tipX = jitter(width * 0.25); // slight curl bias off center
  const base = [0, 0];
  const tip = [tipX, -length];
  const cx1 = width * (0.5 + jitter(0.08));
  const cy1 = -length * (0.2 + jitter(0.06));
  const cx2 = width * (0.28 + jitter(0.08));
  const cy2 = -length * (0.75 + jitter(0.06));
  return [
    [base, [cx1, cy1], [cx2, cy2], tip],
    [tip, [-cx2 * 0.75, cy2], [-cx1 * 0.75, cy1], base],
  ];
}

export function leafPath(length, width) {
  const segments = leafSegments(length, width);
  const tip = segments[0][3];
  const midribD = `M 0,0 Q ${fmt(tip[0] * 0.5)},${fmt(-length * 0.5)} ${fmt(tip[0])},${fmt(tip[1])}`;
  return { d: segmentsToPath(segments), segments, midribD };
}

// A drooping bell/campanula flower for the vine variant: narrow at the
// attachment point (top, y=0) flaring to a rounded wide mouth (bottom,
// y=+length) — the mirror of a petal's proportions, and already "hanging
// down" in local space with no rotation needed (angle=0 = straight down).
// Two short stamen lines droop further past the mouth, the dangling detail
// that reads as "bell flower" rather than just another petal silhouette.
function bellSegments(length, width) {
  const top = [0, 0];
  const bottom = [0, length];
  const cx1 = width * (0.15 + jitter(0.05));
  const cy1 = length * (0.35 + jitter(0.06));
  const cx2 = width * (0.55 + jitter(0.08));
  const cy2 = length * (0.85 + jitter(0.05));
  return [
    [top, [cx1, cy1], [cx2, cy2], bottom],
    [bottom, [-cx2, cy2], [-cx1, cy1], top],
  ];
}

export function bellPath(length, width) {
  const segments = bellSegments(length, width);
  const spread = width * 0.12;
  const stamenLen = length * 0.22;
  const extraD =
    `M ${fmt(-spread)},${fmt(length)} L ${fmt(-spread * 0.6)},${fmt(length + stamenLen)} ` +
    `M ${fmt(spread)},${fmt(length)} L ${fmt(spread * 0.6)},${fmt(length + stamenLen)}`;
  return { d: segmentsToPath(segments), segments, extraD };
}

// A paisley/buta teardrop for the paisley variant: a fuller, rounder
// petal-family body (the silhouette barely matters once the tail is on
// it) topped with a curling spiral tail — real buta motifs read almost
// entirely from that curl, not precise body geometry, so reusing the
// spiral-hook technique already built for tendril tips gets the
// recognizable shape cheaply and reliably.
function paisleySegments(length, width) {
  const cx1 = width * (0.55 + jitter(0.08));
  const cy1 = -length * (0.15 + jitter(0.06));
  const cx2 = width * (0.7 + jitter(0.08));
  const cy2 = -length * (0.6 + jitter(0.06));
  const base = [0, 0];
  const tip = [0, -length];
  return [
    [base, [cx1, cy1], [cx2, cy2], tip],
    [tip, [-cx2, cy2], [-cx1, cy1], base],
  ];
}

export function paisleyPath(length, width) {
  const segments = paisleySegments(length, width);
  const tip = segments[0][3];
  const tail = spiralTail(tip, -Math.PI / 2, width * 0.45, 8, 1.1);
  const extraD = `M ${fmt(tip[0])},${fmt(tip[1])} ${tail}`;
  return { d: segmentsToPath(segments), segments, extraD };
}

function spiralTail(origin, dirAngle, startRadius, steps = 10, turns = 1.4) {
  let d = '';
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const angle = dirAngle + turns * Math.PI * 2 * t;
    const r = startRadius * (1 - t);
    const x = origin[0] + Math.cos(angle) * r;
    const y = origin[1] + Math.sin(angle) * r;
    d += ` L ${fmt(x)},${fmt(y)}`;
  }
  return d;
}

// Curls between two anchors rather than connecting them straight: the
// midpoint is bowed out perpendicular to the connecting line by a jittered
// amount, which is what reads as a vine rather than a wire.
//
// bowSign/bowFraction default to random (every existing caller below gets
// a freshly-jittered curl each time, same as before) but can be pinned
// explicitly — src/organisms/timeline-panel.js's string rig freezes both
// once per segment (so a segment redrawn every animation frame flexes
// smoothly as its endpoints move, rather than re-jittering into a
// different curl shape on every frame) and just passes the current,
// possibly-moving `from`/`to` back in on each recompute. Since `bow` is
// still a fraction of the *live* distance between endpoints, the curve
// naturally scales as they move.
export function tendrilSegment(from, to, { bowSign, bowFraction } = {}) {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const sign = bowSign ?? (Math.random() < 0.5 ? -1 : 1);
  const fraction = bowFraction ?? (0.12 + Math.random() * 0.18);
  const bow = dist * fraction * sign;
  const mx = (x0 + x1) / 2 + nx * bow;
  const my = (y0 + y1) / 2 + ny * bow;
  const c1 = [x0 + (mx - x0) * 0.6, y0 + (my - y0) * 0.6];
  const c2 = [x1 + (mx - x1) * 0.6, y1 + (my - y1) * 0.6];
  const points = [[x0, y0], c1, c2, [x1, y1]];
  const d = `M ${fmt(x0)},${fmt(y0)} C ${fmt(c1[0])},${fmt(c1[1])} ${fmt(c2[0])},${fmt(c2[1])} ${fmt(x1)},${fmt(y1)}`;
  return { d, points, bowSign: sign, bowFraction: fraction };
}

// String-returning wrapper for callers that just want a connector to
// render (bloom, paisley) — about a third also grow a small spiral hook
// at the far end. The vine variant uses tendrilSegment directly instead,
// since it needs the raw control points to trace the segment with dots.
function tendrilPath(from, to) {
  const { d, points } = tendrilSegment(from, to);
  if (Math.random() < 0.3) {
    const [, , c2, end] = points;
    const endAngle = Math.atan2(end[1] - c2[1], end[0] - c2[0]);
    return d + spiralTail(end, endAngle, 10);
  }
  return d;
}

// --- cecek dot-work -----------------------------------------------------
// Traces just inside a motif's own outline with evenly spaced dots. Insets
// are applied at the control-point level (scaling every anchor/control
// point toward the shape's own centroid) before flattening, so this never
// has to offset an already-serialized path string.

function cubicPointAt(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

export function flattenCubic(p0, p1, p2, p3, steps = 24) {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(cubicPointAt(p0, p1, p2, p3, i / steps));
  return pts;
}

function centroidOf(segments) {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const seg of segments) {
    for (const p of seg) {
      sx += p[0];
      sy += p[1];
      n++;
    }
  }
  return [sx / n, sy / n];
}

function insetSegments(segments, factor) {
  const [cx, cy] = centroidOf(segments);
  return segments.map((seg) => seg.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]));
}

// `phase`: shifts every dot the same distance along the arc, wrapping at
// `spacing` so the sequence stays evenly spaced — lets a caller "slide" the
// dot pattern along a segment whose own endpoints never move (timeline-
// panel.js's fixed-pulley string span), rather than only being able to
// react to endpoints that do.
export function pointsAtArcLength(polyline, spacing, phase = 0) {
  const points = [];
  let accumulated = 0;
  const wrappedPhase = ((phase % spacing) + spacing) % spacing;
  let nextTarget = spacing / 2 + wrappedPhase; // offset so dots don't bunch at the seam
  for (let i = 1; i < polyline.length; i++) {
    const [x0, y0] = polyline[i - 1];
    const [x1, y1] = polyline[i];
    const segLen = Math.hypot(x1 - x0, y1 - y0);
    while (accumulated + segLen >= nextTarget) {
      const t = segLen === 0 ? 0 : (nextTarget - accumulated) / segLen;
      points.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      nextTarget += spacing;
    }
    accumulated += segLen;
  }
  return points;
}

// Returns dot centers in the motif's own local (pre-transform) space.
export function cecekPoints(segments, insetFactor, spacing) {
  const inset = insetSegments(segments, insetFactor);
  const polyline = [];
  inset.forEach((seg, i) => {
    const pts = flattenCubic(seg[0], seg[1], seg[2], seg[3]);
    polyline.push(...(i === 0 ? pts : pts.slice(1)));
  });
  return pointsAtArcLength(polyline, spacing);
}

export function toWorld([lx, ly], originX, originY, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [originX + lx * cos - ly * sin, originY + lx * sin + ly * cos];
}

// --- layout ---------------------------------------------------------
// Jittered-grid placement: a coarse grid of cells, shuffled and trimmed to
// clusterCount, each anchor jittered within its own cell. Cheap
// "blue-noise-ish" scatter that avoids both a mechanical grid and true
// random overlap, without implementing real Poisson-disc sampling.

// width/height need not match — a tall narrow strip (the margin use case)
// and a square panel (the showcase use case) both fall out of the same
// aspect-aware grid rather than needing separate layout code.
function jitteredGridAnchors(width, height, clusterCount, margin) {
  const usableW = width - margin * 2;
  const usableH = height - margin * 2;
  const aspect = usableW / usableH;
  const colsTarget = Math.max(1, Math.round(Math.sqrt(clusterCount * aspect)));
  const rowsTarget = Math.max(1, Math.ceil(clusterCount / colsTarget));
  const cols = colsTarget + 1; // cushion so shuffle+slice has choices, same
  const rows = rowsTarget + 1; // reasoning as the old square gridSize+1
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) cells.push([row, col]);
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, clusterCount).map(([row, col]) => {
    const baseX = margin + col * cellW + cellW / 2;
    const baseY = margin + row * cellH + cellH / 2;
    return [baseX + jitter(cellW * 0.35), baseY + jitter(cellH * 0.35)];
  });
}

// Connects each anchor to its 1-2 nearest neighbors (not a full mesh, or
// every cluster reads as a spiderweb rather than a scatter of linked
// vines) via simple distance sort.
function nearestNeighborPairs(anchors, maxNeighbors) {
  const pairs = [];
  const seen = new Set();
  anchors.forEach((a, i) => {
    const ranked = anchors
      .map((b, j) => ({ j, dist: i === j ? Infinity : Math.hypot(a[0] - b[0], a[1] - b[1]) }))
      .sort((x, y) => x.dist - y.dist);
    const neighborCount = 1 + Math.floor(Math.random() * maxNeighbors);
    for (let n = 0; n < neighborCount; n++) {
      const j = ranked[n].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push([i, j]);
      }
    }
  });
  return pairs;
}

function resolveMargin(width, height, margin) {
  return margin ?? Math.min(40, Math.min(width, height) * 0.12);
}

// --- variant: bloom -----------------------------------------------------
// Radial flower clusters (5-7 petals fanned around a center) plus a leaf
// or two, linked by curling tendrils. The original/default look.
//
// Restrained by design: cecek is only traced on each cluster's single
// "outer" petal (index 0, sized up slightly) and on leaf edges, not on
// every petal, to keep total element count in the low hundreds rather than
// the thousands a literal "trace everything" reading would produce.
function buildBloomComposition({ clusterCount, width, height, margin, sizeScale }) {
  const effectiveMargin = resolveMargin(width, height, margin);
  const anchors = jitteredGridAnchors(width, height, clusterCount, effectiveMargin);
  const petals = [];
  const leaves = [];
  const dots = [];

  anchors.forEach(([cx, cy], clusterIndex) => {
    const petalCount = 5 + Math.floor(Math.random() * 3); // 5-7
    const baseLength = (26 + Math.random() * 10) * sizeScale;
    const baseWidth = (12 + Math.random() * 5) * sizeScale;
    const clusterRotation = Math.random() * 360;

    for (let p = 0; p < petalCount; p++) {
      const isOuter = p === 0;
      const sizeMul = isOuter ? 1.15 : 1;
      const length = baseLength * sizeMul * (0.9 + Math.random() * 0.2);
      const petalWidth = baseWidth * sizeMul * (0.9 + Math.random() * 0.2);
      const { d, segments } = petalPath(length, petalWidth);
      const angle = clusterRotation + (360 / petalCount) * p + jitter(8);

      if (isOuter) {
        const local = cecekPoints(segments, 0.88, length * 0.22);
        local.forEach(([lx, ly]) => {
          const [wx, wy] = toWorld([lx, ly], cx, cy, angle);
          dots.push({ clusterIndex, x: wx, y: wy });
        });
      }

      petals.push({ clusterIndex, x: cx, y: cy, angle, d, petalIndexInCluster: p });
    }

    const leafCount = 1 + Math.floor(Math.random() * 2); // 1-2
    for (let l = 0; l < leafCount; l++) {
      const length = baseLength * (0.8 + Math.random() * 0.3);
      const leafWidth = baseWidth * 0.55;
      const { d, segments, midribD } = leafPath(length, leafWidth);
      const angle = clusterRotation + Math.random() * 360;

      const local = cecekPoints(segments, 0.88, length * 0.26);
      local.forEach(([lx, ly]) => {
        const [wx, wy] = toWorld([lx, ly], cx, cy, angle);
        dots.push({ clusterIndex, x: wx, y: wy });
      });

      leaves.push({ clusterIndex, x: cx, y: cy, angle, d, midribD });
    }
  });

  const tendrils = nearestNeighborPairs(anchors, 2).map(([i, j]) => ({
    d: tendrilPath(anchors[i], anchors[j]),
  }));

  return { width, height, tendrils, leaves, petals, dots };
}

// --- variant: vine -----------------------------------------------------
// A different grammar entirely: one continuous winding vine (waypoints
// chained by curling tendril segments) that's itself dot-traced its whole
// length — the vine IS the dotted line, not an outline traced separately
// from it — hung with drooping bell flowers and paired leaves at
// intervals, plus loose scattered "berry" dots unattached to anything.
// Matches the dotted-vine-with-bells reference more directly than
// clustered radial blooms do.
function buildVineComposition({ clusterCount, width, height, margin, sizeScale }) {
  const effectiveMargin = resolveMargin(width, height, margin);
  const waypointCount = Math.max(3, Math.round(clusterCount / 2.5));
  const wide = width >= height;

  const waypoints = [];
  for (let i = 0; i < waypointCount; i++) {
    const t = waypointCount === 1 ? 0.5 : i / (waypointCount - 1);
    if (wide) {
      const x = effectiveMargin + t * (width - effectiveMargin * 2);
      const y = height / 2 + jitter(height * 0.28);
      waypoints.push([x, y]);
    } else {
      const y = effectiveMargin + t * (height - effectiveMargin * 2);
      const x = width / 2 + jitter(width * 0.28);
      waypoints.push([x, y]);
    }
  }

  const tendrils = [];
  const leaves = [];
  const petals = [];
  const dots = [];

  const baseLength = (22 + Math.random() * 8) * sizeScale;
  const baseWidth = (16 + Math.random() * 6) * sizeScale;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const { d, points } = tendrilSegment(waypoints[i], waypoints[i + 1]);
    tendrils.push({ d });

    const flattened = flattenCubic(points[0], points[1], points[2], points[3], 28);
    const vineDotSpacing = Math.max(8, baseLength * 0.35);
    pointsAtArcLength(flattened, vineDotSpacing).forEach(([x, y]) => {
      dots.push({ clusterIndex: i, x, y });
    });

    // One bell and one leaf pair per segment, at different points along it
    // so they don't both bunch at the midpoint.
    const bellT = 0.35 + Math.random() * 0.3;
    const bellPos = cubicPointAt(points[0], points[1], points[2], points[3], bellT);
    const bellLength = baseLength * (0.9 + Math.random() * 0.4);
    const bellWidth = baseWidth * (0.8 + Math.random() * 0.3);
    const { d: bellD, segments: bellSegs, extraD } = bellPath(bellLength, bellWidth);
    const bellAngle = jitter(35); // local space already hangs down at angle=0
    cecekPoints(bellSegs, 0.88, bellLength * 0.24).forEach(([lx, ly]) => {
      const [wx, wy] = toWorld([lx, ly], bellPos[0], bellPos[1], bellAngle);
      dots.push({ clusterIndex: i, x: wx, y: wy });
    });
    petals.push({
      clusterIndex: i,
      x: bellPos[0],
      y: bellPos[1],
      angle: bellAngle,
      d: bellD,
      extraD,
      petalIndexInCluster: i,
    });

    const leafT = 0.65 + Math.random() * 0.2;
    const leafPos = cubicPointAt(points[0], points[1], points[2], points[3], leafT);
    const leafLen = baseLength * 0.8;
    const leafW = baseWidth * 0.4;
    [1, -1].forEach((side) => {
      const { d: leafD, midribD } = leafPath(leafLen, leafW);
      leaves.push({
        clusterIndex: i,
        x: leafPos[0],
        y: leafPos[1],
        angle: 90 * side + jitter(15),
        d: leafD,
        midribD,
      });
    });
  }

  // Loose, unattached filled dots larger than cecek — the reference's
  // scattered berries, not traced to any motif's outline.
  const berryFills = ['var(--color-highlight)', 'var(--color-accent)'];
  const berryCount = Math.round(waypoints.length * 3 * sizeScale);
  for (let i = 0; i < berryCount; i++) {
    const x = effectiveMargin + Math.random() * (width - effectiveMargin * 2);
    const y = effectiveMargin + Math.random() * (height - effectiveMargin * 2);
    dots.push({
      clusterIndex: i % waypoints.length,
      x,
      y,
      radius: 3.5 + Math.random() * 2,
      fill: berryFills[i % berryFills.length],
    });
  }

  return { width, height, tendrils, leaves, petals, dots };
}

// --- variant: paisley -----------------------------------------------------
// Scattered buta/paisley teardrops (jittered-grid placed, like bloom) each
// with a smaller nested paisley inside for the layered look real paisley
// motifs have, cecek-traced along the outer outline, with a filler leaf
// per anchor and a few light connecting tendrils for cohesion — paisleys
// read as more independently scattered than tightly clustered blooms.
function buildPaisleyComposition({ clusterCount, width, height, margin, sizeScale }) {
  const effectiveMargin = resolveMargin(width, height, margin);
  const anchors = jitteredGridAnchors(width, height, clusterCount, effectiveMargin);
  const petals = [];
  const leaves = [];
  const dots = [];

  anchors.forEach(([cx, cy], clusterIndex) => {
    const length = (34 + Math.random() * 14) * sizeScale;
    const paisleyWidth = (20 + Math.random() * 8) * sizeScale;
    const angle = Math.random() * 360;
    const { d, segments, extraD } = paisleyPath(length, paisleyWidth);

    cecekPoints(segments, 0.88, length * 0.2).forEach(([lx, ly]) => {
      const [wx, wy] = toWorld([lx, ly], cx, cy, angle);
      dots.push({ clusterIndex, x: wx, y: wy });
    });

    petals.push({ clusterIndex, x: cx, y: cy, angle, d, extraD, petalIndexInCluster: 0 });

    // Smaller nested paisley offset toward the tip, in a contrasting fill
    // (petalIndexInCluster: 1 cycles to a different PETAL_FILLS token) —
    // the layered look without needing genuinely different inner geometry.
    const innerScale = 0.55;
    const { d: innerD } = paisleyPath(length * innerScale, paisleyWidth * innerScale);
    const [innerX, innerY] = toWorld([0, -length * 0.15], cx, cy, angle);
    petals.push({ clusterIndex, x: innerX, y: innerY, angle, d: innerD, petalIndexInCluster: 1 });

    if (Math.random() < 0.7) {
      const leafLen = length * 0.5;
      const leafW = paisleyWidth * 0.4;
      const { d: leafD, midribD } = leafPath(leafLen, leafW);
      leaves.push({ clusterIndex, x: cx, y: cy, angle: angle + 150 + jitter(30), d: leafD, midribD });
    }
  });

  const tendrils = nearestNeighborPairs(anchors, 1).map(([i, j]) => ({
    d: tendrilPath(anchors[i], anchors[j]),
  }));

  return { width, height, tendrils, leaves, petals, dots };
}

const VARIANT_BUILDERS = {
  bloom: buildBloomComposition,
  vine: buildVineComposition,
  paisley: buildPaisleyComposition,
};
const VARIANT_NAMES = Object.keys(VARIANT_BUILDERS);

/**
 * Builds one full batik composition: motif shapes, connecting tendrils,
 * and a single ordered list of cecek dot centers (already in world/viewBox
 * space, ready to render as a topmost layer). Colorless and DOM-free —
 * src/atoms/batik-pattern.js serializes this into an actual <svg>.
 *
 * `variant` picks the motif grammar — 'bloom' (radial flower clusters),
 * 'vine' (a dotted vine hung with bell flowers), or 'paisley' (scattered
 * buta teardrops) — and defaults to a random pick, unseeded, for the same
 * reason arrangement itself is unseeded (see the module comment): a fresh
 * pattern each time reads as "drawn just now," not a fixed asset with its
 * colors swapped daily.
 *
 * width/height need not be equal — a tall narrow strip (e.g. a page
 * margin) and a wide short panel both work, via the aspect-aware grid/
 * waypoint logic in each variant. `margin` defaults to a fraction of
 * whichever dimension is smaller, so a narrow strip doesn't lose most of
 * its width to a margin sized for a 400x400 panel. `sizeScale` scales
 * motif length/width directly, for compositions much smaller than the
 * ~400-unit space the base proportions were tuned at.
 */
export function buildBatikComposition({
  clusterCount = 6,
  width = 400,
  height = 400,
  margin,
  sizeScale = 1,
  variant,
} = {}) {
  const chosenVariant = variant && VARIANT_BUILDERS[variant]
    ? variant
    : VARIANT_NAMES[Math.floor(Math.random() * VARIANT_NAMES.length)];
  return VARIANT_BUILDERS[chosenVariant]({ clusterCount, width, height, margin, sizeScale });
}
