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

function fmt(n) {
  return Math.round(n * 100) / 100;
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
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const x = a * Math.sign(cos) * Math.abs(cos) ** (2 / n);
    const y = b * Math.sign(sin) * Math.abs(sin) ** (2 / n);
    points.push([x, y]);
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
