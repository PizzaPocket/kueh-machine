// Atom: the pure timing curve behind the "landing bounce" every
// chute:ball-landed listener reacts to (src/organisms/timeline-panel.js's
// chip/spring/glass offset, src/organisms/scissors-cut.js's scissor-angle
// offset). Extracted out of timeline-panel.js rather than duplicated,
// because those two consumers' bounce offsets have to peak in the exact
// same frame (both fire off the same event) — sharing one curve is what
// guarantees that, instead of two independently-tuned copies drifting apart
// if either's constants ever change.

// Impact, not a smooth oscillation — a plain sin(t*pi) eases in from zero
// velocity, which reads as drifting into the dip rather than getting hit.
// Split into two eased-out halves instead: DOWN_PORTION snaps down with
// maximum velocity at the moment of impact and decelerates into the bottom
// of the dip, then the longer remaining portion recoils back out the same
// way — fast off the bottom, settling in gradually.
export const BOUNCE_DURATION_MS = 500;
export const BOUNCE_DOWN_PORTION = 0.18;

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

/**
 * @param {number} elapsedMs - ms since the bounce started (performance.now()
 *   delta), not an internal timestamp — callers own their own clock so two
 *   independent bounce offsets (chip/spring/glass vs. scissors) can each
 *   track their own `bounceStart` while still sharing this one curve.
 * @returns {number} 0 -> 1 -> 0 over BOUNCE_DURATION_MS; 0 once elapsed
 *   exceeds the duration.
 */
export function bounceFactor(elapsedMs) {
  if (elapsedMs >= BOUNCE_DURATION_MS) return 0;
  const t = elapsedMs / BOUNCE_DURATION_MS;
  if (t < BOUNCE_DOWN_PORTION) {
    return easeOutQuad(t / BOUNCE_DOWN_PORTION); // 0 -> 1, fast start
  }
  const recoverT = (t - BOUNCE_DOWN_PORTION) / (1 - BOUNCE_DOWN_PORTION);
  return 1 - easeOutQuad(recoverT); // 1 -> 0, fast off the bottom
}
