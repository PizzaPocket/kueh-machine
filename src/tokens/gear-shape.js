// Pure procedural geometry for a spur-gear silhouette — same "pure math,
// zero coupling" role superellipse.js plays for the retro-window shape.
// Straight radial edges (no bezier fitting): a gear tooth's own faces
// really are flat/angular, unlike the retro-rectangle's curved corners, so
// straight segments between sampled points aren't an approximation here —
// they're the actual intended silhouette.
//
// Point ordering and the `width`/`height`/`n`/`samples` signature shape
// (even though a gear doesn't use `n`/`samples` — they're accepted and
// ignored) deliberately mirror buildSuperellipsePoints/buildSuperellipsePath,
// so this drops straight into buildOutsetFramePath's own `pointsBuilder`
// slot (tokens/superellipse.js) exactly like the superellipse shape does —
// growing a gear outward by a flat `outset` reuses that same function
// unchanged, at the same approximation it already accepts for the
// superellipse case (the grown ring isn't a perfectly constant-width
// offset at every point around the silhouette — thinner at the root than
// the tip, since both radii scale by the same `outset`-grown outer
// bounding box rather than a true parallel-curve offset — invisible at the
// small sizes this is built for, and consistent with how the existing
// superellipse frame already trades exactness for simplicity here).

function fmt(n) {
  return Math.round(n * 100) / 100;
}

function gearPointAt(angle, r) {
  return [r * Math.cos(angle), r * Math.sin(angle)];
}

/**
 * Samples a spur-gear silhouette's points, in local space centered at
 * (0,0) — outer tooth tips reach `width/height`'s own radius (width/2,
 * assumed square — the only shape buildOutsetFramePath ever asks for,
 * since it grows width/height equally), teeth roots sit at `rootRatio`
 * of that same radius.
 *
 * Each tooth contributes 3 points (root-before, tip-start, tip-end) —
 * the *next* tooth's own root-before point (a different angle, same
 * rootR) is what closes the valley between them, so no 4th point is
 * needed per tooth to get a real flat-ish valley floor.
 */
export function buildGearPoints({ width, height, teeth = 8, tipRatio = 0.34, rootRatio = 0.62 } = {}) {
  const outerR = width / 2;
  const rootR = outerR * rootRatio;
  const step = (Math.PI * 2) / teeth;
  const tipHalf = (step * tipRatio) / 2;
  const points = [];
  for (let i = 0; i < teeth; i++) {
    const center = i * step;
    points.push(gearPointAt(center - step / 2, rootR));
    points.push(gearPointAt(center - tipHalf, outerR));
    points.push(gearPointAt(center + tipHalf, outerR));
  }
  return points;
}

/**
 * Same shape as buildGearPoints, rendered as an SVG path `d` string — see
 * buildSuperellipsePath (tokens/superellipse.js) for the origin/translation
 * convention this mirrors.
 */
export function buildGearPath({ width, height, teeth = 8, tipRatio = 0.34, rootRatio = 0.62, originX = width / 2, originY = height / 2 } = {}) {
  const points = buildGearPoints({ width, height, teeth, tipRatio, rootRatio });
  let d = '';
  points.forEach(([x, y], i) => {
    const px = fmt(x + originX);
    const py = fmt(y + originY);
    d += i === 0 ? `M ${px},${py}` : ` L ${px},${py}`;
  });
  return `${d} Z`;
}
