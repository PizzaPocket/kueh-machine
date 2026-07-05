// Pure procedural geometry for the "retro window" shape (wip/retro_window.svg)
// — a 1950s/60s futurist TV-screen silhouette. No DOM, no color: same
// "pure math, zero coupling" role batik-motifs.js plays for the batik field.
//
// The source asset's path is 8 cubic-bezier segments with full 8-fold (D4)
// symmetry; analysis confirms it's a bezier approximation of a superellipse
// |x/a|^n + |y/b|^n = 1 with n ≈ 5.5 (its on-curve corner point sits at
// 88.2% of the half-dimension from center, which solves to that n). Rather
// than rescale the original bezier control points — which distorts the
// corners into stretched ellipses at non-square aspect ratios, the same way
// a naive scaleX/scaleY transform would — this regenerates the curve
// directly from the superellipse formula for whatever width/height it's
// asked for. a (half-width) and b (half-height) scale independently while
// the shaping exponent n stays constant, so the corner *character* stays
// consistent at any aspect ratio instead of stretching unevenly.
//
// The default n here (10) is deliberately tighter than the source asset's
// own ~5.5 — in situ, against .kod-media's real padding, a corner as round
// as the source asset needs so much clearance that the safety floor in
// solveClearingExponent below ends up dominating anyway, flattening the
// curve into an ordinary rounded-rect look and defeating the point. A
// tighter base corner needs less clearance to begin with, so the rendered
// shape actually reads as the intended retro-rectangle silhouette instead of
// being overridden toward a plain rectangle.
//
// buildFunnelPoints/buildFunnelPath (below) build a second shape on the same
// formula — the countdown clock's "water clock" viewport (wip/viewport with
// bottom funnel.svg): the same superellipse body with a tapered spout
// spliced into its bottom-center edge.

function fmt(n) {
  return Math.round(n * 100) / 100;
}

// Superellipse point at parametric angle `t`, in local space centered at
// (0,0). Factored out of buildSuperellipsePoints so buildFunnelPoints below
// can sample the exact same curve while splicing its own vertices into the
// bottom-center arc — both shapes stay in sync with one formula.
function superellipsePointAt(t, a, b, n) {
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  return [
    a * Math.sign(cos) * Math.abs(cos) ** (2 / n),
    b * Math.sign(sin) * Math.abs(sin) ** (2 / n),
  ];
}

/**
 * Samples `samples` points around a superellipse of the given width/height
 * and exponent, in local space centered at (0,0) — spanning
 * [-width/2, width/2] x [-height/2, height/2]. Straight-line segments
 * between enough sampled points read as smooth at this shape's scale (same
 * precision level batik-motifs.js's own curve flattening relies on
 * elsewhere in this codebase), so no bezier-fitting is needed.
 */
export function buildSuperellipsePoints({ width, height, n = 10, samples = 96 } = {}) {
  const a = width / 2;
  const b = height / 2;
  const points = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    points.push(superellipsePointAt(t, a, b, n));
  }
  return points;
}

/**
 * Same shape as buildSuperellipsePoints, rendered as an SVG path `d`
 * string. Points translate by (originX, originY) — defaulting to
 * (width/2, height/2), which lands the shape's bounding box at
 * [0,0]-[width,height], ready to drop straight into a clipPath sized to
 * match the clipped element's own box (clipPathUnits="userSpaceOnUse").
 */
export function buildSuperellipsePath({ width, height, n = 10, samples = 96, originX = width / 2, originY = height / 2 } = {}) {
  const points = buildSuperellipsePoints({ width, height, n, samples });
  let d = '';
  points.forEach(([x, y], i) => {
    const px = fmt(x + originX);
    const py = fmt(y + originY);
    d += i === 0 ? `M ${px},${py}` : ` L ${px},${py}`;
  });
  return `${d} Z`;
}

// Standard cubic Bezier evaluation, used for the funnel's wall below.
function cubicBezierPoint(p0, p1, p2, p3, t) {
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

/**
 * Same superellipse body as buildSuperellipsePoints, but with a funnel spout
 * spliced into the bottom-center of its perimeter — the "water clock"
 * viewport shape (wip/viewport with bottom funnel.svg): a wide rounded
 * window that necks down to a narrow flat tip below its own bottom edge.
 * The body occupies the top `height - height*funnelDepthRatio`; the
 * remaining strip is the spout, each wall a cubic Bezier (`funnelWallSamples`
 * points, sampled from cubicBezierPoint above — not a straight line) from
 * the shoulder (where it meets the body, +- `funnelHalfWidthRatio*a` wide,
 * flat there so it meets the body tangentially) down to a narrow flat tip
 * (+- `funnelTipHalfWidthRatio*a` wide), joined by a flat line across.
 * `funnelWallControlFraction` places the wall's own control point most of
 * the way across toward the tip while staying level with the shoulder,
 * mimicking the reference asset's own curve (measured from its path data)
 * — a near-flat launch that only bends downward later. Ratios default
 * small/subtle — measured from the reference asset's own viewBox, then
 * narrowed further since a funnel that size read as too wide/prominent in
 * practice. Reuses superellipsePointAt so the curve outside the notch is
 * identical to buildSuperellipsePoints's own.
 *
 * Sampling is angle-order (0 to 2*PI), so the notch — a single contiguous
 * arc straddling the bottom-center angle — is entered and exited exactly
 * once; the Bezier wall (right shoulder -> right tip), the flat tip (right
 * tip -> left tip), and the mirrored wall (left tip -> left shoulder)
 * replace the sampled arc there, then normal sampling resumes.
 */
export function buildFunnelPoints({
  width,
  height,
  n = 10,
  samples = 96,
  funnelHalfWidthRatio = 0.06,
  funnelTipHalfWidthRatio = 0.012,
  funnelDepthRatio = 0.09,
  funnelWallSamples = 20,
  funnelWallControlFraction = 0.68,
} = {}) {
  const a = width / 2;
  const funnelDepth = height * funnelDepthRatio;
  const b = (height - funnelDepth) / 2;
  const funnelHalfWidth = a * funnelHalfWidthRatio;
  const funnelTipHalfWidth = a * funnelTipHalfWidthRatio;
  const shoulderY = b * (1 - Math.abs(funnelHalfWidth / a) ** n) ** (1 / n);
  const tipY = shoulderY + funnelDepth;

  // Right wall only — shoulder to tip; the left wall is this same array
  // mirrored below. Coordinates local to the shoulder (y=0 at the
  // shoulder, y=funnelDepth at the tip) since only the y-offset from
  // shoulderY is needed once sampled.
  const p0 = [funnelHalfWidth, 0];
  const p1 = [funnelHalfWidth + (funnelTipHalfWidth - funnelHalfWidth) * funnelWallControlFraction, 0];
  const p2 = [funnelTipHalfWidth, funnelDepth];
  const p3 = [funnelTipHalfWidth, funnelDepth];
  const wall = [];
  for (let j = 0; j <= funnelWallSamples; j++) {
    const [wx, wy] = cubicBezierPoint(p0, p1, p2, p3, j / funnelWallSamples);
    wall.push([wx, shoulderY + wy]);
  }

  const points = [];
  let inNotch = false;
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const [x, y] = superellipsePointAt(t, a, b, n);
    const notch = y > 0 && Math.abs(x) < funnelHalfWidth;

    if (notch && !inNotch) {
      wall.forEach(([wx, wy]) => points.push([wx, wy])); // right shoulder -> right tip
      points.push([-funnelTipHalfWidth, tipY]); // flat tip, right -> left
      for (let k = wall.length - 2; k >= 0; k--) points.push([-wall[k][0], wall[k][1]]); // left tip -> left shoulder
      inNotch = true;
      continue;
    }
    if (notch) continue;
    inNotch = false;
    points.push([x, y]);
  }
  return points;
}

/**
 * Same shape as buildFunnelPoints, rendered as an SVG path `d` string — see
 * buildSuperellipsePath for the origin/translation convention. `originY`
 * (explicit or defaulted) is assumed to re-center the *full* height, the
 * same convention updateRetroShape already uses for buildSuperellipsePath —
 * but the funnel's body is shorter than `height` by the spout's depth, so
 * it's shifted up by half that difference to re-center the body (not the
 * full box) at that point instead.
 */
export function buildFunnelPath({
  width,
  height,
  n = 10,
  samples = 96,
  originX = width / 2,
  originY = height / 2,
  funnelHalfWidthRatio,
  funnelTipHalfWidthRatio,
  funnelDepthRatio = 0.09,
  funnelWallSamples,
  funnelWallControlFraction,
} = {}) {
  const points = buildFunnelPoints({
    width, height, n, samples, funnelHalfWidthRatio, funnelTipHalfWidthRatio, funnelDepthRatio,
    funnelWallSamples, funnelWallControlFraction,
  });
  const oy = originY - (height * funnelDepthRatio) / 2;
  let d = '';
  points.forEach(([x, y], i) => {
    const px = fmt(x + originX);
    const py = fmt(y + oy);
    d += i === 0 ? `M ${px},${py}` : ` L ${px},${py}`;
  });
  return `${d} Z`;
}

/**
 * A thick decorative *frame* around the funnel window (countdown-clock.js's
 * own experiment) — filled, not stroked, so it can sit entirely outside the
 * window's own edge (a centered stroke straddles the edge half-in/half-out)
 * and taper down to an actual point on each side of the spout's mouth
 * (a constant-width stroke can't taper; a filled band whose two edges
 * converge to the same point can).
 *
 * The band's inner edge is the real window silhouette (buildFunnelPoints,
 * walked from one side of the tip all the way around to the other — same
 * "skip the flat mouth segment" trick buildFunnelPath's funnel-notch
 * splicing already relies on to find the tip in the first place). The
 * outer edge is a plain grown superellipse (width/height each bigger by
 * `outset`, no funnel notch of its own) — *except* right at the bottom,
 * where instead of following its own curve into the same notch region, it
 * skips straight to the inner tip points directly. That's what creates the
 * taper: the frame is `outset` thick everywhere else, but the two straight
 * segments connecting the outer curve to the (much narrower, sharply
 * pointed) inner tip pinch down to nothing exactly there — same visual
 * language as the reference asset's own tapered rear-window trim.
 *
 * Both edges are walked in *opposite* rotational directions (inner
 * forward, outer backward) and stitched into one continuous non-self-
 * intersecting loop — the standard way to describe an annulus/frame shape
 * as a single closed polygon rather than two separate subpaths.
 */
export function buildFunnelOutsetOutlinePath({
  width,
  height,
  outset,
  n = 10,
  samples = 96,
  originX = width / 2,
  originY = height / 2,
  funnelHalfWidthRatio = 0.06,
  funnelTipHalfWidthRatio = 0.012,
  funnelDepthRatio = 0.09,
  funnelWallSamples = 20,
  funnelWallControlFraction = 0.68,
} = {}) {
  const innerPoints = buildFunnelPoints({
    width, height, n, samples, funnelHalfWidthRatio, funnelTipHalfWidthRatio, funnelDepthRatio,
    funnelWallSamples, funnelWallControlFraction,
  });
  const maxY = Math.max(...innerPoints.map(([, y]) => y));
  const rightTipIndex = innerPoints.findIndex(([x, y]) => y === maxY && x > 0);
  const leftTipIndex = rightTipIndex + 1;
  const rightTip = innerPoints[rightTipIndex];
  // Inner edge, walked forward: left tip -> (the long way around) -> right tip.
  const innerWalk = [...innerPoints.slice(leftTipIndex), ...innerPoints.slice(0, leftTipIndex)];

  const a = width / 2;
  const funnelDepth = height * funnelDepthRatio;
  const b = (height - funnelDepth) / 2;
  const funnelHalfWidth = a * funnelHalfWidthRatio;
  const a2 = a + outset;
  const b2 = b + outset;

  // Analytically exact (not sample-derived) — same formula buildFunnelPoints
  // itself uses for the *inner* wall's own shoulderY, just against the
  // grown a2/b2. At n=10 the superellipse is extremely steep near the
  // bottom-center (confirmed directly: two samples 1/96 of a turn apart
  // landed at x=12 and x=124 respectively, for one representative size) —
  // using whichever raw sample happened to fall nearest the boundary put
  // the taper's own start wherever that steep jump landed, nowhere near
  // the actual shoulder, and produced a badly self-intersecting (and, it
  // turned out, invisible) shape.
  const outerShoulderY = b2 * (1 - Math.abs(funnelHalfWidth / a2) ** n) ** (1 / n);
  const outerRightShoulder = [funnelHalfWidth, outerShoulderY];
  const outerLeftShoulder = [-funnelHalfWidth, outerShoulderY];

  const outerPoints = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    outerPoints.push(superellipsePointAt(t, a2, b2, n));
  }
  const inOuterNotch = ([x, y]) => y > 0 && Math.abs(x) < funnelHalfWidth;
  let outerRightIndex = -1;
  let outerLeftIndex = -1;
  for (let i = 0; i < outerPoints.length; i++) {
    const prevI = (i - 1 + outerPoints.length) % outerPoints.length;
    const notch = inOuterNotch(outerPoints[i]);
    const prevNotch = inOuterNotch(outerPoints[prevI]);
    if (notch && !prevNotch) outerRightIndex = prevI;
    if (!notch && prevNotch) outerLeftIndex = i;
  }
  // Outer edge, walked backward (opposite direction from innerWalk, so the
  // two edges stitch into one non-self-intersecting loop): the precise
  // right shoulder, then the sampled body the long way around (reversed),
  // then the precise left shoulder.
  const outerBodyLongWay = [];
  for (let i = outerRightIndex; ; i = (i - 1 + outerPoints.length) % outerPoints.length) {
    outerBodyLongWay.push(outerPoints[i]);
    if (i === outerLeftIndex) break;
  }
  const outerWalk = [outerRightShoulder, ...outerBodyLongWay, outerLeftShoulder];

  // rightTip -> [taper up to the outer edge] -> outerWalk -> [taper back
  // down to the inner edge] -> innerWalk (which starts at the left tip and
  // ends back at rightTip, closing the loop). The two bracketed "tapers"
  // aren't special-cased — they're just the straight line each array
  // boundary implies once concatenated and drawn as consecutive `L`s.
  const ring = [rightTip, ...outerWalk, ...innerWalk];

  const oy = originY - (height * funnelDepthRatio) / 2;
  let d = '';
  ring.forEach(([x, y], i) => {
    const px = fmt(x + originX);
    const py = fmt(y + oy);
    d += i === 0 ? `M ${px},${py}` : ` L ${px},${py}`;
  });
  return `${d} Z`;
}

/**
 * A plain closed "ring" frame outset from *any* shape family's own
 * silhouette — the general-purpose counterpart to
 * buildFunnelOutsetOutlinePath above, which is funnel-specific (it needs
 * to leave a gap open at the spout's own mouth). Most shapes (a button, a
 * pill, a plain retro-rectangle window) have no such gap: the frame is
 * just the shape's own outline grown outward by `outset`, with the
 * original (un-grown) shape's silhouette as the hole in the middle.
 *
 * Represented as two separate closed subpaths in one `d` string — an
 * outer boundary and an inner one, wound in *opposite* directions
 * (`innerPoints.slice().reverse()`) — rather than one continuous loop
 * with bridge segments the way the funnel's gap variant needs. Two
 * oppositely-wound closed subpaths is the standard way to describe a
 * shape-with-a-hole under the nonzero fill rule (same principle as
 * drawing a letter "O": an outer circle one way, an inner circle the
 * other) — much simpler than bridging, and correct for any shape since
 * there's no gap to route around.
 *
 * `pointsBuilder` picks the shape family (default buildSuperellipsePoints
 * — a plain retro-rectangle/pill/button outline); pass buildFunnelPoints
 * here instead for a funnel body shape with no gap (rare — most funnel
 * consumers want the gap, i.e. buildFunnelOutsetOutlinePath instead).
 * Growing width/height by `outset` on each side and reusing the exact
 * same originX/Y for both the outer and inner calls is what keeps both
 * boundaries centered on each other — no extra origin math needed here
 * the way the funnel variant needs for its own asymmetric notch.
 */
export function buildOutsetFramePath({
  width,
  height,
  outset,
  n = 10,
  samples = 96,
  originX = width / 2,
  originY = height / 2,
  pointsBuilder = buildSuperellipsePoints,
  ...pathOpts
} = {}) {
  const innerPoints = pointsBuilder({ width, height, n, samples, ...pathOpts });
  const outerPoints = pointsBuilder({ width: width + outset * 2, height: height + outset * 2, n, samples, ...pathOpts });

  const toSubpath = (points) => {
    let d = '';
    points.forEach(([x, y], i) => {
      const px = fmt(x + originX);
      const py = fmt(y + originY);
      d += i === 0 ? `M ${px},${py}` : ` L ${px},${py}`;
    });
    return `${d} Z`;
  };

  return `${toSubpath(outerPoints)} ${toSubpath(innerPoints.slice().reverse())}`;
}

// |x/a|^n + |y/b|^n, evaluated at a fixed point — <= 1 means the point
// sits inside the superellipse (so a clip-path using this shape would
// still show it), > 1 means the point falls in the cut-away corner (a
// clip-path would hide it).
function superellipseValue(x, y, a, b, n) {
  return Math.abs(x / a) ** n + Math.abs(y / b) ** n;
}

/**
 * Solves for the smallest exponent `n` whose superellipse still contains
 * (i.e. doesn't clip away) a content rectangle inset by (marginX, marginY)
 * from the box's own edges — i.e. the corner pull-in never overlaps padded
 * content, no matter the box size. superellipseValue at the padded corner
 * point decreases monotonically as n grows (for margins smaller than the
 * box's own half-dimensions — higher n pulls the corner further out toward
 * the true rectangle, containing more), so a bisection search converges
 * cleanly. The result is floored at `minN` (the curviest we want to go —
 * see the module comment on why that default is 10, not the source
 * asset's own ~5.5) so the shape never gets *more* rectangular than
 * necessary — only a box too small for that default to clear its own
 * padding pushes n higher, toward `maxN` as a hard ceiling for degenerate
 * cases.
 */
export function solveClearingExponent({ width, height, marginX, marginY, minN = 10, maxN = 40 } = {}) {
  const a = width / 2;
  const b = height / 2;
  const px = a - Math.min(marginX, a * 0.9);
  const py = b - Math.min(marginY, b * 0.9);

  // Even the most rectangular exponent in range can't clear this corner
  // (an unreasonably small box relative to its own padding) — fall
  // back to the ceiling rather than searching for a solution that doesn't
  // exist in range.
  if (superellipseValue(px, py, a, b, maxN) > 1) return maxN;
  if (superellipseValue(px, py, a, b, minN) <= 1) return minN;

  let lo = minN;
  let hi = maxN;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (superellipseValue(px, py, a, b, mid) <= 1) hi = mid;
    else lo = mid;
  }
  return hi;
}
