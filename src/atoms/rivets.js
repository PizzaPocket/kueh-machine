// Atom: a row of small decorative metal rivets (.metal-rivet-row /
// .metal-rivet, styles/atoms.css) — a light procedural touch for
// .matte-metal-surface panels, evoking the riveted-seam look of real
// brushed-steel paneling. Not meant to be dense or load-bearing: a
// handful of rivets, evenly spaced with a little organic jitter (real
// per-call randomness — Math.random(), not seeded — matching
// src/tokens/chrome-metal.js's own glint jitter and
// src/tokens/batik-motifs.js's unseeded placement, rather than a
// perfectly mechanical grid).

/**
 * @param {number} [count=5] - how many rivets in the row. Kept low by
 *   default on purpose — this is a subtle material detail, not a pattern
 *   meant to draw attention on its own.
 * @param {{ vertical?: boolean }} [opts] - `vertical: true` runs the row
 *   top-to-bottom instead of left-to-right (.metal-rivet-row-vertical,
 *   styles/atoms.css) — e.g. the Kueh of the Day seam between its two
 *   columns (kueh-of-day.js), rather than a panel's top/bottom edge.
 * @returns {HTMLElement} a row container (flex, space-between) — position
 *   it however the caller needs (e.g. absolute along a panel edge).
 */
export function buildRivetRow(count = 5, { vertical = false } = {}) {
  const row = document.createElement('div');
  row.className = vertical ? 'metal-rivet-row metal-rivet-row-vertical' : 'metal-rivet-row';
  row.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < count; i++) {
    const rivet = document.createElement('span');
    rivet.className = 'metal-rivet';
    // A few px of jitter off the row's own baseline, perpendicular to the
    // row's direction, so the rivets don't look laser-cut — enough to
    // read as slightly hand-set, not enough to disturb the evenly-spaced
    // row.
    const jitter = (Math.random() * 2 - 1) * 2;
    rivet.style.transform = vertical ? `translateX(${jitter.toFixed(1)}px)` : `translateY(${jitter.toFixed(1)}px)`;
    row.appendChild(rivet);
  }

  return row;
}
