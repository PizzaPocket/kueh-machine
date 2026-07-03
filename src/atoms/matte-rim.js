// Atom: wraps an element with a static "matte metal" INNER rim
// (.rim-matte-inner outer band + .rim-matte-inner-glint glint band,
// styles/atoms.css) — the non-interactive counterpart to chrome-metal.js's
// applyLayeredConicChrome. Same physical double-band structure, but fixed
// metal-palette gradients (styles/tokens.css) instead of a --chrome-angle-
// driven conic sweep, so there's no rotation registration and no
// per-element glint randomization — just two nested elements, each with
// its own retro-rectangle clip-path shaped to match the wrapped element
// (see the shared observer below): the rim always follows the actual
// shape of whatever it's wrapping — our swelled-corner retro-rectangle
// for the Kueh of the Day windows, not a generic rounded rectangle —
// never border-radius, which can't express that curve (border-radius:
// inherit is only the CSS classes' own fallback for plain rectangular/
// pill consumers that opt out via `shaped: false` below).
//
// "Inner" (see styles/atoms.css's .rim-matte-inner comment for the fuller
// distinction): rim, glint, and fill are one visual unit sharing a single
// outer edge and a single elevation shadow — this wraps something that
// doesn't already have its own separate visual identity. An "outer" rim
// (not yet built) would instead frame an already-complete, self-contained
// element from the outside — name it wrapWithOuterMatteRim /
// .rim-matte-outer when it exists, so the pair stays unambiguous.

import { createRetroShape, updateRetroShape } from './retro-shape.js';

function attachClip(el) {
  const refs = createRetroShape();
  el.appendChild(refs.svg);
  el.style.clipPath = refs.clipUrl;
  return refs;
}

/**
 * @param {HTMLElement} fillEl - the element to wrap; ends up nested inside
 *   the new rim/glint bands, in its original place in the DOM.
 * @param {{ shaped?: boolean, gutter?: number, n?: number, fillRefs?: object }} [opts]
 *   `shaped: true` (default) reshapes the rim/glint bands with their own
 *   retro-rectangle clip-path. Pass `shaped: false` for a plain rectangular
 *   or border-radius'd fillEl (e.g. a circular badge), where the CSS
 *   classes' own border-radius: inherit is enough and no clip-path wiring
 *   is needed.
 *
 *   `fillRefs`: if fillEl is *itself* a retro-rectangle-shaped surface
 *   (its own { clipPathEl, shadowPathEl } from createRetroShape, already
 *   built by the caller), pass those refs here — the rim/glint bands then
 *   share fillEl's own corner exponent, solved once against fillEl's real
 *   padding, rather than each independently solving against their own
 *   near-zero rim/glint padding (which has essentially no content to
 *   clear, so it drifts toward a much tighter, more-rectangular corner
 *   than the window it's wrapping — the two visibly stop matching).
 *   Omit `fillRefs` for a fillEl whose own shape isn't managed this way;
 *   the rim/glint bands then each solve independently as before. Either
 *   way, `n` (if given) short-circuits that solve entirely, same as
 *   updateRetroShape's own `n` param.
 * @returns {{ el: HTMLElement, observer: ResizeObserver | null }}
 *   el: the new outer .rim-matte-inner element, with fillEl nested inside
 *   it (via appendChild, so this works whether or not fillEl is already
 *   attached anywhere) — append this wherever fillEl itself would
 *   otherwise have gone. observer: null unless `shaped: true` — the
 *   caller should `.disconnect()` it if fillEl/this wrap is ever torn
 *   down and rebuilt (see kueh-of-day.js's windowObservers).
 */
export function wrapWithInnerMatteRim(fillEl, { shaped = true, gutter = 0, n, fillRefs = null } = {}) {
  const rim = document.createElement('div');
  rim.className = 'rim-matte-inner';

  const glint = document.createElement('div');
  glint.className = 'rim-matte-inner-glint';

  rim.appendChild(glint);
  glint.appendChild(fillEl);

  let observer = null;

  if (shaped) {
    const rimRefs = attachClip(rim);
    const glintRefs = attachClip(glint);

    observer = new ResizeObserver(() => {
      const sharedN = fillRefs ? updateRetroShape(fillEl, fillRefs, { gutter, n }) : n;
      updateRetroShape(rim, rimRefs, { gutter, n: sharedN });
      updateRetroShape(glint, glintRefs, { gutter, n: sharedN });
    });
    observer.observe(fillEl);
  }

  return { el: rim, observer };
}
