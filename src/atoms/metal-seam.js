// Atom: a static vertical "seam" — two thin flush lines sitting side by
// side with no gap between them (.metal-seam container + a pair of
// .metal-seam-line children, styles/atoms.css), not nested/layered the
// way matte-rim.js's .rim-matte-inner/-glint bezel bands are. Reads as
// the butted edges of two separate metal sheets meeting, not a groove
// scored into one — one edge a dim glint catching the light, the other
// sitting just behind it in shadow. No clip-path/ResizeObserver wiring
// like wrapWithInnerMatteRim needs — a seam is a pair of plain straight
// bars, not a shape that has to track a wrapped element's live
// silhouette.

/**
 * @param {{ horizontal?: boolean }} [opts] - `horizontal: true` runs the
 *   seam left-to-right instead of top-to-bottom (.metal-seam-horizontal,
 *   styles/atoms.css) — e.g. a full-bleed row divider, rather than a
 *   vertical column divider.
 * @returns {HTMLElement} the .metal-seam container, with its two
 *   .metal-seam-line children already appended — size and position it
 *   however the caller needs (e.g. the Kueh of the Day seam between its
 *   two columns, kueh-of-day.js).
 */
export function buildMetalSeam({ horizontal = false } = {}) {
  const seam = document.createElement('div');
  seam.className = horizontal ? 'metal-seam metal-seam-horizontal' : 'metal-seam';

  for (let i = 0; i < 2; i++) {
    const line = document.createElement('div');
    line.className = 'metal-seam-line';
    seam.appendChild(line);
  }

  return seam;
}
