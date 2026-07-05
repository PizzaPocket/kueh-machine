// Atom: one tendril segment between two (possibly moving) endpoints, plus
// its cecek-dot trace — shared by src/organisms/timeline-panel.js (the
// string, which needs every segment perfectly taut) and
// src/organisms/drop-chute.js (the chute, which wants the same tendril/
// cecek visual language but with an organic curl). Extracted out of
// timeline-panel.js rather than duplicated into drop-chute.js.
//
// bowFraction/bowSign are frozen once per segment (createSegment's own
// call), not re-rolled on every `compute()` — a segment redrawn every
// animation frame (the string's twisting strands, see timeline-panel.js)
// needs to flex smoothly as its endpoints move, not re-jitter into a
// different curl shape each frame. Since `bow` is a fraction of the
// *live* distance between endpoints (tendrilSegment's own math), the
// curve still naturally scales as they move.

import { tendrilSegment, flattenCubic, pointsAtArcLength } from '../tokens/batik-motifs.js';
import { renderTendril, renderCecekLayer } from './batik-pattern.js';

const CECEK_DOT_SPACING = 9;

/**
 * `bowFraction`/`bowSign` explicit → frozen at exactly that value (e.g.
 * `createSegment(0)` for the string's own dead-straight, tension-taut
 * segments). Omitted → both randomized once, matching tendrilSegment's
 * own natural default curl (the chute's organic look).
 */
export function createSegment(bowFraction, bowSign) {
  const fraction = bowFraction ?? 0.12 + Math.random() * 0.18;
  const sign = bowSign ?? (Math.random() < 0.5 ? -1 : 1);
  return {
    compute(from, to) {
      const { d, points } = tendrilSegment(from, to, { bowSign: sign, bowFraction: fraction });
      const flattened = flattenCubic(points[0], points[1], points[2], points[3], 20);
      const dots = pointsAtArcLength(flattened, CECEK_DOT_SPACING).map(([x, y]) => ({ x, y }));
      return { d, dots };
    },
  };
}

/** Plain render — no depth-based opacity/width (the string's own strand
 * segments still handle that themselves, inline, since it's specific to
 * the glass-rig's own near/far cue). */
export function renderSegment({ d, dots }, cecekFill) {
  return renderTendril({ d }) + renderCecekLayer(dots, cecekFill);
}
