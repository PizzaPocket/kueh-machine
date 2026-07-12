// Atom: a small metal grommet/eyelet — a hole punched into the surface,
// recessed, ringed by a real matte-metal rim (the same .rim-matte-inner
// gradient recipe used elsewhere, styles/atoms.css — not a flat single-tone
// border). The visual opposite of src/atoms/rivets.js's buildRivetRow
// (raised bolts, embossed outward): this one reads as removed material,
// not added hardware. Two-layer structure, same idea as .rim-matte-inner's
// own rim+glint nesting: the outer .grommet element IS the rim (its own
// background carries the gradient, sized via padding/inset rather than a
// separate glint band, since a grommet's rim is thin enough that one layer
// reads fine); the inner .grommet-hole is the actual dark recess.
export function buildGrommet() {
  const grommet = document.createElement('span');
  grommet.className = 'grommet';
  grommet.setAttribute('aria-hidden', 'true');

  const hole = document.createElement('span');
  hole.className = 'grommet-hole';
  grommet.appendChild(hole);

  return grommet;
}

/**
 * Lays out `count` grommets evenly spaced across a row.
 * @param {number} count
 * @returns {HTMLElement} a row container (flex, space-between) — position
 *   it however the caller needs, same convention as buildRivetRow.
 */
export function buildGrommetRow(count = 6) {
  const row = document.createElement('div');
  row.className = 'grommet-row';
  row.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < count; i++) {
    row.appendChild(buildGrommet());
  }

  return row;
}
