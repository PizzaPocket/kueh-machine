// Pure math + tuning constants for the glass's own "drop lands in liquid"
// ripple system, ported from wip/drop-ripple-demo.html. No DOM: same "pure
// math, zero coupling" role tokens/spring.js and tokens/glass-shape.js play
// for their own graphics — src/atoms/liquid-ripple.js is the DOM/animation
// half that consumes this.
//
// The demo's own constants were tuned against its own fixed scene (a cup
// drawn at rx=92, ry=28). The real glass's surface ellipse isn't fixed
// size — it grows/shrinks (and its rx/ry ratio shifts slightly) with the
// countdown's own fill fraction (tokens/glass-shape.js's
// liquidTopEllipseAt) — so every spatial constant below is expressed as a
// FRACTION of the current top ellipse's rx (circle-space quantities, drawn
// before the ellipse's own squash transform is applied) or ry (real,
// post-squash vertical quantities: wobble amplitude, splash arc-lift),
// derived by dividing each of the demo's own absolute-px constants by the
// rx=92 / ry=28 it was tuned against. Time-domain/dimensionless constants
// (ring count, delay/duration curves, opacity taper, wobble Hz/tau, splash
// count/duration ranges) are kept exactly as the demo had them — it
// doesn't scale those against its own fixed scene either.

export const RING_COUNT = 10;
const RING_VISIBLE_COUNT = 5;
export const ringDelayMs = (i) => i * 140 + i * i * 8;
export const ringDurationMs = (i) => 800 + i * 90;
export const ringOpacityAt = (i, visibleCount = RING_VISIBLE_COUNT) =>
  i < visibleCount ? Math.max(0, 0.55 - i * 0.12) : 0;

// Circle-space (pre-squash) fractions, of the current top ellipse's rx.
export const RING_MAX_R_FRACTION = 95 / 92;
// Symmetric (unlike the demo's own asymmetric rx-4/ry-4 inset) so the clip
// ellipse — a squashed circle at this same fraction of rx — lands exactly
// on the circle-space radius wallArrivalTime() below solves against.
export const WALL_BOUNDARY_FRACTION = 0.95;
export const ringStrokeWidthFraction = (i) => Math.max(0.0065, 0.0598 - i * 0.00598);

export const SPLASH_COUNT_MIN = 3;
export const SPLASH_COUNT_RANGE = 2;
export const SPLASH_DIST_MIN_FRACTION = 16 / 92;
export const SPLASH_DIST_RANGE_FRACTION = 13 / 92;
export const SPLASH_RADIUS_FRACTION = 3.8 / 92;
export const SPLASH_DUR_MIN_MS = 380;
export const SPLASH_DUR_RANGE_MS = 130;
export const LANDING_RING_MAX_R_FRACTION = 9 / 92;
export const LANDING_RING_WIDTH_FRACTION = 2.6 / 92;

// Real, post-squash vertical fractions, of the current top ellipse's ry.
export const SPLASH_PEAK_LIFT_MIN_FRACTION = 10 / 28;
export const SPLASH_PEAK_LIFT_RANGE_FRACTION = 6 / 28;
export const ringWobbleFraction = (i) => 0.0607 * Math.pow(0.74, i);

export const FLASH_DURATION_MS = 220;
export const FLASH_START_R_FRACTION = 1.6 / 92;
export const FLASH_GROWTH_FRACTION = 13 / 92;

export const WOBBLE_DURATION_MS = 520;
const WOBBLE_FREQ_HZ = 6.5;
const WOBBLE_TAU_MS = 150;
export const WOBBLE_ANTICIPATION_MS = 55; // fires slightly before the ring's own calculated wall-contact time

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Exactly when a given ring's leading edge crosses `boundary` (a
 * circle-space radius) — solved directly from the ease-out radius curve
 * (r(t) = maxR * easeOutCubic(t)) rather than assumed to be some fixed
 * fraction of the ring's own duration, so timing a reaction (the meniscus
 * wobble) to "wall contact" stays correct even as ring speed/size vary.
 * `ring` is `{ maxR, delay, dur }`. Returns null if this ring's maxR never
 * reaches the boundary at all.
 */
export function wallArrivalTime(ring, boundary) {
  if (ring.maxR <= boundary) return null;
  const oneMinusT = Math.pow(1 - boundary / ring.maxR, 1 / 3);
  const t = 1 - oneMinusT;
  return ring.delay + t * ring.dur;
}

/**
 * The meniscus wobble's own damped real-time oscillation — real Hz/ms
 * based, not fraction-of-duration, so amplitude/decay stay easy to reason
 * about regardless of how long the wobble's own total duration is tuned to.
 */
export function wobbleDisplacement(elapsedMs, amplitude) {
  return (
    -amplitude *
    Math.exp(-elapsedMs / WOBBLE_TAU_MS) *
    Math.sin((2 * Math.PI * WOBBLE_FREQ_HZ * elapsedMs) / 1000)
  );
}
