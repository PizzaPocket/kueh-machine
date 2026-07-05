// Atom: wraps an element with a static "matte metal" rim — either the
// INNER variant (.rim-matte-inner outer band + .rim-matte-inner-glint
// glint band, styles/atoms.css), the non-interactive counterpart to
// chrome-metal.js's applyLayeredConicChrome, or the OUTER variant
// (.rim-matte-outer, below) that frames an already-complete element from
// the outside instead of sharing its edge. Same metal-palette gradients
// (styles/tokens.css) either way — fixed, not a --chrome-angle-driven
// conic sweep, so there's no rotation registration and no per-element
// glint randomization.
//
// "Inner" (see styles/atoms.css's .rim-matte-inner comment for the fuller
// distinction): rim, glint, and fill are one visual unit sharing a single
// outer edge and a single elevation shadow — this wraps something that
// doesn't already have its own separate visual identity. Its own two
// nested elements each get a retro-rectangle clip-path shaped to match
// the wrapped element (see the shared observer below) — never
// border-radius, which can't express that curve (border-radius: inherit
// is only the CSS classes' own fallback for plain rectangular/pill
// consumers that opt out via `shaped: false` below).
//
// "Outer": the frame and the thing it frames read as two separate layers
// — a metal bezel wrapping something that's already a complete,
// self-contained visual unit with its own bounds (e.g. a small icon).
// Structurally this is wrapWithHousingFrame's (housing-frame.js) own
// "grow the wrapped shape's own silhouette outward by a flat outset, via
// pointsBuilder/framePathBuilder" technique, just with the thin static
// .rim-matte-inner gradient recipe instead of housing's thick conic
// "liquid chrome" material + noise texture — pick this one for a bezel
// that should read as the same matte metal as .rim-matte-inner (a
// household-object bezel), pick wrapWithHousingFrame for the heavier
// decorative-housing look.

import { createRetroShape, updateRetroShape } from './retro-shape.js';
import { buildOutsetFramePath, buildSuperellipsePoints } from '../tokens/superellipse.js';

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
 *
 *   `pathBuilder`/other options: forwarded to every updateRetroShape call
 *   this makes (fillEl's own, if fillRefs is given, plus rim's and
 *   glint's), same as updateRetroShape's own pathBuilder param — so a rim
 *   wrapping a non-superellipse fillEl (the countdown clock's funnel
 *   viewport, buildFunnelPath) gets bands shaped to match it rather than
 *   defaulting to the plain retro-rectangle. Omit for the default
 *   superellipse, same as every existing caller does.
 * @returns {{ el: HTMLElement, observer: ResizeObserver | null }}
 *   el: the new outer .rim-matte-inner element, with fillEl nested inside
 *   it (via appendChild, so this works whether or not fillEl is already
 *   attached anywhere) — append this wherever fillEl itself would
 *   otherwise have gone. observer: null unless `shaped: true` — the
 *   caller should `.disconnect()` it if fillEl/this wrap is ever torn
 *   down and rebuilt (see kueh-of-day.js's windowObservers).
 */
export function wrapWithInnerMatteRim(fillEl, { shaped = true, gutter = 0, n, fillRefs = null, pathBuilder, ...pathOpts } = {}) {
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
      const sharedN = fillRefs ? updateRetroShape(fillEl, fillRefs, { gutter, n, pathBuilder, ...pathOpts }) : n;
      updateRetroShape(rim, rimRefs, { gutter, n: sharedN, pathBuilder, ...pathOpts });
      updateRetroShape(glint, glintRefs, { gutter, n: sharedN, pathBuilder, ...pathOpts });
    });
    observer.observe(fillEl);
  }

  return { el: rim, observer };
}

/**
 * @param {HTMLElement} fillEl - the already-complete, self-contained
 *   element the rim frames from the outside (e.g. a small icon) — ends up
 *   nested inside the new wrapper, in its original place in the DOM, same
 *   convention as wrapWithInnerMatteRim above (this doesn't insert the
 *   wrapper into the document itself).
 * @param {{ outset?: number, n?: number, samples?: number, pointsBuilder?: Function, framePathBuilder?: Function, rimBase?: string, wrapClassName?: string }} [opts]
 *   `outset`: the rim band's own thickness in px (default 2 — this is a
 *   thin bezel, not housing-frame.js's thick decorative ring).
 *   `pointsBuilder`/`framePathBuilder`/`n`/`samples`/other pathOpts: same
 *   as wrapWithHousingFrame's own (housing-frame.js) — swap
 *   `pointsBuilder` for a non-superellipse silhouette (e.g. buildGearPoints,
 *   tokens/gear-shape.js) to frame that shape's own real outline instead
 *   of a retro-rectangle.
 *   `rimBase`: sets --rim-base on the rim band, same tinting hook
 *   .rim-matte-inner-tinted uses (styles/atoms.css) — omit for the
 *   default neutral --metal-base.
 * @returns {{ el: HTMLElement, rim: HTMLElement, observer: ResizeObserver }}
 *   el: the new wrapper (fillEl's new parent) — append this wherever
 *   fillEl itself would otherwise have gone. rim: the frame div itself.
 *   observer: the ResizeObserver, in case the caller ever tears this down.
 */
export function wrapWithOuterMatteRim(fillEl, {
  outset = 2,
  n = 10,
  samples = 96,
  pointsBuilder = buildSuperellipsePoints,
  framePathBuilder = buildOutsetFramePath,
  rimBase,
  wrapClassName = 'rim-matte-outer-wrap',
  ...pathOpts
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = wrapClassName === 'rim-matte-outer-wrap' ? 'rim-matte-outer-wrap' : `rim-matte-outer-wrap ${wrapClassName}`;
  wrap.appendChild(fillEl);

  const rim = document.createElement('div');
  rim.className = 'rim-matte-outer';
  rim.setAttribute('aria-hidden', 'true');
  if (rimBase) rim.style.setProperty('--rim-base', rimBase);
  wrap.appendChild(rim);

  // Same "measure fillEl's real position within wrap" reasoning as
  // wrapWithHousingFrame's own update() (housing-frame.js) — a naive
  // `left: -outset` anchored to wrap's own edge can be off if fillEl
  // doesn't exactly fill its shrink-wrapped box.
  function update() {
    const w = fillEl.clientWidth;
    const h = fillEl.clientHeight;
    if (!w || !h) return;
    const fillRect = fillEl.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const fillLeft = fillRect.left - wrapRect.left;
    const fillTop = fillRect.top - wrapRect.top;
    rim.style.left = `${fillLeft - outset}px`;
    rim.style.top = `${fillTop - outset}px`;
    rim.style.width = `${w + outset * 2}px`;
    rim.style.height = `${h + outset * 2}px`;
    const d = framePathBuilder({
      width: w, height: h, n, samples, outset, pointsBuilder,
      originX: w / 2 + outset, originY: h / 2 + outset,
      ...pathOpts,
    });
    rim.style.clipPath = `path("${d}")`;
  }

  const observer = new ResizeObserver(update);
  observer.observe(fillEl);
  window.addEventListener('resize', update);

  return { el: wrap, rim, observer };
}
