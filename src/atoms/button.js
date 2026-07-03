// Atom: a small button with the "reflective" liquid-chrome rim
// (src/tokens/chrome-metal.js applyLayeredConicChrome — the same
// cursor/scroll-reactive treatment .tab-group-rim uses), shaped to the
// retro-rectangle silhouette (src/atoms/retro-shape.js), white fill, an
// optional icon alongside the label. The dynamic counterpart to
// .rim-matte-inner's static rim (src/atoms/matte-rim.js) — pick this
// whenever a small button should visually react to the cursor the way
// the tab group's own rim does; pick a matte rim when it shouldn't.
//
// Builds the structural/visual button only (rim, chrome, shape, label,
// icon) — selection state, aria attributes beyond the basics, and click
// behavior stay with the caller (e.g. kueh-of-day.js's "See more"
// toggle owns aria-expanded/aria-controls and its own click handler),
// same division of responsibility createTab (src/atoms/tab.js) has with
// the molecule that composes it.

import { applyLayeredConicChrome } from '../tokens/chrome-metal.js';
import { attachRetroShapeClip, SMALL_RETRO_SHAPE_OPTS } from './retro-shape.js';

/**
 * @param {{ label: string, iconSvg?: string, variant?: string }} opts
 *   `iconSvg`: raw <svg> markup, appended after the label (e.g. a
 *   chevron) — pass a `role="img"`/`aria-hidden` svg string, same as
 *   renderKuehSvg's own output. `variant` selects the color treatment via
 *   a `btn-${variant}` class (default 'primary'); only that one variant
 *   is styled today (styles/atoms.css), but the class is already
 *   parameterized for whenever a second one shows up.
 * @returns {{ rim: HTMLElement, btn: HTMLButtonElement, labelEl: HTMLElement }}
 *   rim: append this — it contains the button inside its chrome bands.
 *   btn: the actual <button>, for the caller's own event listeners/aria.
 *   labelEl: the label's own span, for swapping its text (e.g. "See
 *   more" <-> "See less") without touching the icon alongside it.
 */
export function createSmallButton({ label, iconSvg, variant = 'primary' } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `btn btn-small btn-${variant}`;

  const labelEl = document.createElement('span');
  labelEl.className = 'btn-label text-sheen';
  labelEl.textContent = label;
  btn.appendChild(labelEl);

  if (iconSvg) {
    const temp = document.createElement('span');
    temp.innerHTML = iconSvg;
    const icon = temp.firstElementChild;
    icon.classList.add('btn-icon', 'icon-sheen');
    btn.appendChild(icon);
  }

  const rim = document.createElement('div');
  rim.className = 'btn-rim';
  const glintBand = applyLayeredConicChrome(rim, btn, { peaks: [60, 180, 300] });

  attachRetroShapeClip(rim, SMALL_RETRO_SHAPE_OPTS);
  attachRetroShapeClip(glintBand, SMALL_RETRO_SHAPE_OPTS);
  attachRetroShapeClip(btn, SMALL_RETRO_SHAPE_OPTS);

  return { rim, btn, labelEl };
}
