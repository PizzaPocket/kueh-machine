// Atom: a button (small utility control or large one-off CTA — see
// `size`) with the "reflective" liquid-chrome rim (src/tokens/
// chrome-metal.js applyLayeredConicChrome — the same cursor/scroll-
// reactive treatment .tab-group-rim uses), shaped to the retro-rectangle
// silhouette (src/atoms/retro-shape.js), white fill, an optional icon
// alongside the label. The dynamic counterpart to .rim-matte-inner's
// static rim (src/atoms/matte-rim.js) — pick this whenever a button
// should visually react to the cursor the way the tab group's own rim
// does; pick a matte rim when it shouldn't.
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
 * @param {{ label: string, iconSvg?: string, variant?: string, size?: string, tag?: string, href?: string }} opts
 *   `iconSvg`: raw <svg> markup, appended after the label (e.g. a
 *   chevron) — pass a `role="img"`/`aria-hidden` svg string, same as
 *   renderKuehSvg's own output. `variant` selects the color treatment via
 *   a `btn-${variant}` class (default 'primary'); only that one variant
 *   is styled today (styles/atoms.css), but the class is already
 *   parameterized for whenever a second one shows up. `size` selects the
 *   dimensions via a `btn-${size}` class (default 'small'; 'large' is the
 *   other one styled today, styles/atoms.css — for a prominent one-off CTA
 *   rather than a small utility control). `tag`/`href`: build an `<a>`
 *   instead of a `<button>` for a button that's really a navigation link
 *   (e.g. the countdown clock's post-launch ENTER link, index.html) —
 *   applyLayeredConicChrome/attachRetroShapeClip below don't care which
 *   element they're painting onto, so this is just element-creation +
 *   href, nothing else changes.
 * @returns {{ rim: HTMLElement, btn: HTMLElement, labelEl: HTMLElement }}
 *   rim: append this — it contains the button inside its chrome bands.
 *   btn: the actual <button>/<a>, for the caller's own event listeners/aria.
 *   labelEl: the label's own span, for swapping its text (e.g. "See
 *   more" <-> "See less") without touching the icon alongside it.
 */
export function createButton({ label, iconSvg, variant = 'primary', size = 'small', tag = 'button', href } = {}) {
  const btn = document.createElement(tag);
  if (tag === 'button') btn.type = 'button';
  if (tag === 'a' && href) btn.href = href;
  btn.className = `btn btn-${size} btn-${variant}`;

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

// Thin wrapper kept for existing callers (kueh-of-day.js's "See more"
// toggle) that only ever wanted the small utility button.
export function createSmallButton(opts) {
  return createButton({ ...opts, size: 'small', tag: 'button' });
}
