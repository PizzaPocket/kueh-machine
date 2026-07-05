// Pure procedural geometry for the spring graphic (wip/Spring Coiled.svg,
// Spring Half Stretched.svg, Spring Stretched.svg) — a chain of small metal
// coil loops that stretches (fewer, more open coils) the more of the
// project's timeline has elapsed. No DOM, no color: same "pure math, zero
// coupling" role superellipse.js plays for the retro window shape.
//
// The three reference assets are the same 50-coil chain at three stretch
// amounts — pitch (coil-to-coil spacing) 2px / 5px / 15px, at what we're
// calling stretchFraction 0 / 0.5 / 1. Parsing every coil's own control
// points across all three files (each coil is 4 cubic-bezier segments from
// a shared start point) and fitting a quadratic through each
// (stretchFraction, value) triple — 3 points always solve a quadratic
// exactly, no over/under-fitting risk — gives closed-form formulas for
// every control point at ANY stretch fraction, not just the 3 sampled
// ones. Verified directly against the reference files: pitchAt(0)=2,
// pitchAt(0.5)=5, pitchAt(1)=15, matching their own path data exactly.
//
// The reference files keep the coil count fixed at 50 and let the total
// rendered width grow 7x (105px -> 752px) as it stretches — that doesn't
// work for a page slot that can't grow 7x wider as days pass. Here the
// pixel width is fixed instead, and the coil COUNT varies (fewer, more
// open coils as it stretches) to fill that width — arguably more
// physically correct for a spring viewed within a fixed window anyway.

const REF_HEIGHT = 12; // reference assets' own viewBox height

function fmt(n) {
  return Math.round(n * 1000) / 1000;
}

// Coil-to-coil pitch (px, at the reference's own 12px-tall scale) at a
// given stretch fraction (0 = fully coiled, 1 = fully stretched).
function pitchAt(f) {
  return 14 * f * f - f + 2;
}

// One coil's own 12 control points (P1..P12; P0 = the coil's start point,
// always (0, 0.5), handled separately below), local to that start point,
// at the reference's own 12px-tall scale. P2=P3=P4 and P8=P9=P10 share an
// x value at every sampled state — a vertical tangent at the coil's own
// "waist" — which is why only the y value needs its own formula there.
function coilPointsAt(f) {
  const waistY = -2 * f * f - f + 6;
  const p1 = [-f * f + 1.5 * f - 1, 2 * f * f - f + 0.5];
  const p2 = [-f * f + 2.5 * f - 2, 2.5];
  const p3 = [p2[0], waistY];
  const p4 = [p2[0], waistY + 3.5];
  const p5 = [2 * f * f + 2 * f - 0.5, REF_HEIGHT - 0.5];
  const p6 = [7 * f * f - 0.5 * f + 1, REF_HEIGHT - 0.5];
  const p7 = [12 * f * f - 3 * f + 2.5, REF_HEIGHT - 0.5];
  const p8 = [15 * f * f - 3.5 * f + 4, p4[1]];
  const p9 = [p8[0], p3[1]];
  const p10 = [p8[0], p2[1]];
  const p11 = [15 * f * f - 2.5 * f + 3, p1[1]];
  const p12 = [pitchAt(f), 0.5];
  return [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12];
}

/**
 * One coil's SVG path `d`, its own start point (P0) placed at
 * (originX, originY) and scaled up from the reference's own 12px-tall
 * coordinate space by `scale` (pass `height / 12` for a target coil
 * height of `height`).
 */
function coilPathAt(f, originX, originY, scale) {
  const pts = coilPointsAt(f).map(([x, y]) => [fmt(x * scale + originX), fmt(y * scale + originY)]);
  const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12] = pts;
  const p0x = fmt(originX);
  const p0y = fmt(0.5 * scale + originY);
  return (
    `M${p0x},${p0y} ` +
    `C${p1} ${p2} ${p3} ` +
    `C${p4} ${p5} ${p6} ` +
    `C${p7} ${p8} ${p9} ` +
    `C${p10} ${p11} ${p12}`
  );
}

/**
 * Builds one row of coil paths filling exactly `width` px (a fixed page
 * slot, not the reference assets' own growing-total-width approach — see
 * module comment above), at the given `stretchFraction` (0-1) and
 * `height` (coil height in px; scale is derived from this).
 * `minCoils`/`maxCoils` guard against degenerate coil counts at extreme
 * aspect ratios. Returns `{ coils, count, pitchPx }` — `coils` is an array
 * of `d` strings ready to drop into `<path>` elements; `count`/`pitchPx`
 * are exposed in case a caller needs them (e.g. for a viewBox).
 */
export function buildSpringCoilPaths({ width, height, stretchFraction, minCoils = 4, maxCoils = 60 } = {}) {
  const scale = height / REF_HEIGHT;
  const idealPitchPx = pitchAt(stretchFraction) * scale;
  const count = Math.max(minCoils, Math.min(maxCoils, Math.round(width / idealPitchPx)));
  const actualPitchPx = width / count; // fills the slot exactly, no gap/overflow
  const coils = [];
  for (let i = 0; i < count; i++) {
    coils.push(coilPathAt(stretchFraction, i * actualPitchPx, 0, scale));
  }
  return { coils, count, pitchPx: actualPitchPx };
}
