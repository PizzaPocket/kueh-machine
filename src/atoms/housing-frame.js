// Atom: wraps an element with a thick decorative "housing" frame drawn
// OUTSIDE its own edge — a plain clipped div (CSS clip-path: path(...),
// buildOutsetFramePath by default, tokens/superellipse.js) painted with a
// static conic-gradient background (chrome-metal.js's own
// computeConicChromeLayers — the same "wrap dark/light bands around the
// shape's contour, from one shared center" math the site's interactive
// liquid-chrome rims use, just with rotation left un-registered so it
// reads as fixed matte material rather than something that reacts to the
// cursor/scroll).
//
// A div, not an SVG <path> — a div can paint a plain CSS background-image,
// which is what lets it reuse chrome-metal.js's conic-gradient formula
// directly instead of rebuilding an equivalent SVG gradient in parallel.
//
// Originated for the hero countdown's own water-clock window
// (src/organisms/countdown-clock.js, which passes
// buildFunnelOutsetOutlinePath as its own framePathBuilder to get a gap
// at the funnel's own spout instead of a plain closed ring) — reusable
// for any other shape/button/UI element that wants the same "thick
// material housing" treatment.

import { buildOutsetFramePath, buildSuperellipsePoints } from '../tokens/superellipse.js';
import { computeConicChromeLayers } from '../tokens/chrome-metal.js';

const DEFAULT_DARK = 'color-mix(in srgb, var(--metal-base) 85%, black)';
const DEFAULT_LIGHT = 'color-mix(in srgb, var(--metal-base) 85%, white)';

// Irregular gaps, not an evenly-spaced sweep — a perfectly even spread
// (e.g. 120deg apart) reads as too regular/mechanical on a static,
// non-rotating housing, where an evenly-repeating pattern is much more
// noticeable than it would be on an interactive rim that's always subtly
// moving.
const DEFAULT_PEAKS = [40, 165, 250];

/**
 * @param {HTMLElement} fillEl - the element the housing frame wraps
 *   (already shaped/sized by the caller — this only adds the frame
 *   *around* it). Ends up nested inside a new wrapper, in fillEl's
 *   original place in the DOM (same convention as wrapWithInnerMatteRim,
 *   matte-rim.js) — the caller still owns placement.
 * @param {object} [opts]
 *   `outsetDesktop`/`outsetMobile`/`mobileWidth`/`desktopWidth`: frame
 *   thickness interpolates by viewport width between these two
 *   values/breakpoints (default 14/7px, 640/900px) rather than one fixed
 *   thickness — a housing that reads right on desktop is usually too
 *   heavy-handed on a narrower mobile layout.
 *   `darkVar`/`lightVar`: the conic-gradient's two color stops (default a
 *   neutral metal-base pair) — pass color-mix()'d toward a theme color
 *   for a housing tinted to its surroundings.
 *   `peaks`: conic-gradient peak angles (default an irregular spread).
 *   `metal`: a raw CSS background-image string, used as-is instead of
 *   computing a conic-gradient from peaks/darkVar/lightVar, for a
 *   completely different material (e.g. a flat linear-gradient). Ignores
 *   peaks/darkVar/lightVar when set.
 *   `n`/`samples`/other pathOpts: forwarded to framePathBuilder.
 *   `pointsBuilder`: picks the shape family framePathBuilder outlines
 *   (default buildSuperellipsePoints).
 *   `framePathBuilder`: swaps in a different frame-geometry function
 *   sharing this same DOM/resize wiring — e.g.
 *   buildFunnelOutsetOutlinePath for a frame that needs a gap left open
 *   somewhere (the water clock's spout), instead of the default
 *   buildOutsetFramePath (a plain closed ring).
 *   `accentRatio`: adds a second, thinner ring on top of the main one,
 *   its thickness this fraction of the main outset (default 0.3), inner
 *   edge flush with fillEl's own outline. Pass 0/null to skip it.
 *   `accentAngle`: the accent ring's fixed --chrome-angle (default 55,
 *   deliberately different from the main ring's 0deg) so the two
 *   conic-gradients visibly disagree rather than reading as one thicker
 *   band — rotating just the gradient's start angle (not a CSS
 *   transform: rotate()) keeps the ring's clip-path shape identical to
 *   the main one while still reading as rotated.
 *   `accentDarkVar`/`accentLightVar`/`accentPeaks`: default to the main
 *   ring's own values — override for an accent tinted/peaked
 *   differently, not just rotated.
 *   `accentMetal`: same idea as `metal`, for the accent ring.
 *   `wrapClassName`: an *additional* class on the wrapper, alongside the
 *   always-present 'housing-frame-wrap' — set this when nesting one
 *   wrapWithHousingFrame call inside another and something needs to
 *   target just one of them in CSS.
 * @returns {{ el: HTMLElement, outline: HTMLElement, accent: HTMLElement | null, observer: ResizeObserver }}
 *   el: the new wrapper (fillEl's new parent) — append this wherever
 *   fillEl itself would otherwise have gone. outline: the main frame div.
 *   accent: the thinner second-layer div, or null if accentRatio was 0.
 *   observer: the ResizeObserver, for the caller to disconnect if this
 *   is ever torn down.
 */
export function wrapWithHousingFrame(fillEl, {
  outsetDesktop = 14,
  outsetMobile = 7,
  mobileWidth = 640,
  desktopWidth = 900,
  darkVar = DEFAULT_DARK,
  lightVar = DEFAULT_LIGHT,
  peaks = DEFAULT_PEAKS,
  metal: metalOverride = null,
  pointsBuilder = buildSuperellipsePoints,
  n = 10,
  framePathBuilder = buildOutsetFramePath,
  accentRatio = 0.3,
  accentAngle = 55,
  accentDarkVar = darkVar,
  accentLightVar = lightVar,
  accentPeaks = peaks,
  accentMetal: accentMetalOverride = null,
  wrapClassName = 'housing-frame-wrap',
  ...pathOpts
} = {}) {
  function currentOutset() {
    const w = window.innerWidth;
    if (w <= mobileWidth) return outsetMobile;
    if (w >= desktopWidth) return outsetDesktop;
    const t = (w - mobileWidth) / (desktopWidth - mobileWidth);
    return outsetMobile + t * (outsetDesktop - outsetMobile);
  }

  const wrap = document.createElement('div');
  // wrapClassName is an *additional* class, not a replacement — 'housing-
  // frame-wrap' always stays (styles/atoms.css's position/display/sizing
  // rules live there), so a caller overriding this to target a specific
  // nested instance in CSS (e.g. countdown-clock.js's own inner rim vs.
  // its outer housing, both wrapWithHousingFrame calls) doesn't also have
  // to redeclare that shared base styling under the new name.
  wrap.className = wrapClassName === 'housing-frame-wrap' ? 'housing-frame-wrap' : `housing-frame-wrap ${wrapClassName}`;
  wrap.appendChild(fillEl);

  const outline = document.createElement('div');
  outline.className = 'housing-frame';
  outline.setAttribute('aria-hidden', 'true');
  const metal = metalOverride ?? computeConicChromeLayers(peaks, { darkVar, lightVar }).metal;
  // A custom property, not backgroundImage directly — .housing-frame
  // (styles/atoms.css) layers a static noise texture *and* this value
  // together in one background-image list; setting backgroundImage here
  // would replace that whole property instead of adding to it.
  outline.style.setProperty('--housing-metal', metal);
  wrap.appendChild(outline);

  // Appended after `outline`, so it paints on top in normal DOM order —
  // the thinner accent ring described in this function's own docstring.
  let accent = null;
  if (accentRatio > 0) {
    accent = document.createElement('div');
    accent.className = 'housing-frame housing-frame-accent';
    accent.setAttribute('aria-hidden', 'true');
    const accentMetal = accentMetalOverride ?? computeConicChromeLayers(accentPeaks, { darkVar: accentDarkVar, lightVar: accentLightVar }).metal;
    accent.style.setProperty('--housing-metal', accentMetal);
    if (!accentMetalOverride) accent.style.setProperty('--chrome-angle', `${accentAngle}deg`);
    wrap.appendChild(accent);
  }

  // The div's own box has to actually extend `outset` px past fillEl on
  // every side, not just be clipped to a shape that does — background
  // painting stops at the border-box regardless of clip-path, so the
  // outward-bled part would have no painted background under it
  // otherwise. Left/top are measured from fillEl's real position within
  // `wrap`, not assumed to be exactly (-outset, -outset) — `wrap` is
  // meant to shrink-wrap tightly to fillEl, but a fillEl with a
  // percentage width can end up not exactly filling that box (confirmed
  // on a 390px mobile viewport: an 8px gap per side), which would throw a
  // naive `left: -outset` off unevenly on each side.
  function update() {
    const w = fillEl.clientWidth;
    const h = fillEl.clientHeight;
    if (!w || !h) return;
    const outset = currentOutset();
    const fillRect = fillEl.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const fillLeft = fillRect.left - wrapRect.left;
    const fillTop = fillRect.top - wrapRect.top;
    outline.style.left = `${fillLeft - outset}px`;
    outline.style.top = `${fillTop - outset}px`;
    outline.style.width = `${w + outset * 2}px`;
    outline.style.height = `${h + outset * 2}px`;
    const d = framePathBuilder({
      width: w, height: h, n, outset, pointsBuilder,
      originX: w / 2 + outset, originY: h / 2 + outset,
      ...pathOpts,
    });
    outline.style.clipPath = `path("${d}")`;

    // Same div box as the main ring (left/top/width/height copied as-is)
    // — only the clip-path differs. Calling framePathBuilder with fillEl's
    // own (unmodified) w/h as its base, and its own outset set to just
    // accentOutset, produces a ring whose *inner* edge is fillEl's own
    // true silhouette — flush with the window's own outline, the same
    // way the main ring's inner edge is — extending outward by just
    // accentOutset instead of the main ring's full outset. originX/Y
    // reuse the exact same formula as the main ring (not re-derived from
    // a grown base size) because that's what keeps both rings sharing
    // one common center within this same, larger div box.
    if (accent) {
      accent.style.left = outline.style.left;
      accent.style.top = outline.style.top;
      accent.style.width = outline.style.width;
      accent.style.height = outline.style.height;
      const accentOutset = outset * accentRatio;
      const accentD = framePathBuilder({
        width: w, height: h,
        n, outset: accentOutset, pointsBuilder,
        originX: w / 2 + outset, originY: h / 2 + outset,
        ...pathOpts,
      });
      accent.style.clipPath = `path("${accentD}")`;
    }
  }

  const observer = new ResizeObserver(update);
  observer.observe(fillEl);
  window.addEventListener('resize', update);

  return { el: wrap, outline, accent, observer };
}
