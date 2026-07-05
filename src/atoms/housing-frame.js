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
 *   (already shaped/sized however the caller wants — this only adds the
 *   frame *around* it, doesn't touch fillEl itself). Ends up nested
 *   inside a new wrapper, in fillEl's original place in the DOM — same
 *   convention as wrapWithInnerMatteRim (matte-rim.js): this doesn't
 *   insert the wrapper into the document itself, so the caller still
 *   owns placement (`el.appendChild(fillEl)` works whether or not fillEl
 *   is already attached anywhere).
 * @param {object} [opts]
 *   `outsetDesktop`/`outsetMobile`/`mobileWidth`/`desktopWidth`: the
 *   frame's thickness interpolates by viewport width between these two
 *   values/breakpoints (default 14/7px, 640/900px — the site's own
 *   mobile breakpoint, timeline-panel.js's isMobile/index.html's
 *   @media) rather than a single fixed thickness — a housing that reads
 *   right on desktop is usually too heavy-handed on a much narrower
 *   mobile layout.
 *   `darkVar`/`lightVar`: the conic-gradient's two color stops (default:
 *   a neutral metal-base pair) — pass color-mix()'d toward a theme color
 *   (e.g. --color-primary-strong) for a housing tinted to its
 *   surroundings, same idea as .rim-matte-inner-tinted (styles/atoms.css).
 *   `peaks`: conic-gradient peak angles (default an irregular spread).
 *   `metal`: a raw CSS background-image string, used as-is instead of
 *   computing a conic-gradient from peaks/darkVar/lightVar — for a ring
 *   that wants a completely different material, e.g. a linear-gradient
 *   matching .rim-matte-inner-tinted's own static recipe (styles/
 *   atoms.css) rather than the conic "liquid chrome" look. peaks/darkVar/
 *   lightVar are ignored when this is set.
 *   `n`/`samples`/other pathOpts: forwarded to framePathBuilder.
 *   `pointsBuilder`: picks the shape family framePathBuilder outlines
 *   (default buildSuperellipsePoints — a plain retro-rectangle/pill/
 *   button outline).
 *   `framePathBuilder`: swaps in a different frame-geometry function
 *   sharing this same DOM/resize wiring — e.g. buildFunnelOutsetOutlinePath
 *   for a shape that needs a gap left open somewhere in the frame (the
 *   water clock's own spout), instead of the default buildOutsetFramePath
 *   (a plain closed ring, no gap).
 *   `accentRatio`: adds a second, thinner ring on top of the main one —
 *   its own thickness is this fraction of the main outset (default 0.3).
 *   Its *inner* edge is flush with fillEl's own outline (same as the
 *   main ring's inner edge), extending outward from there by just that
 *   fraction of the full outset, rather than reaching all the way to the
 *   main ring's own outer edge. Pass 0 (or null) to skip it entirely.
 *   `accentAngle`: the accent ring's own fixed --chrome-angle, in
 *   degrees (default 55) — deliberately different from the main ring's
 *   0deg default so the two conic-gradients visibly disagree with each
 *   other rather than lining up into what would just read as one thicker
 *   band. A CSS transform: rotate() on the accent div itself was the
 *   other option, but that would rotate its *clip-path* too, throwing
 *   its ring out of alignment with the (non-circular) shape underneath —
 *   rotating just the gradient's own start angle keeps the ring's shape
 *   identical to the main one while still visibly reading as rotated.
 *   `accentDarkVar`/`accentLightVar`/`accentPeaks`: default to the same
 *   values as the main ring's own darkVar/lightVar/peaks — override for
 *   an accent that's tinted or peaked differently, not just rotated.
 *   `accentMetal`: same idea as `metal` above, but for the accent ring —
 *   a raw background-image string used as-is; accentAngle/accentPeaks/
 *   accentDarkVar/accentLightVar are ignored when this is set.
 *   `wrapClassName`: an *additional* class on the wrapper, alongside the
 *   always-present 'housing-frame-wrap' (whose position/display/sizing
 *   rules, styles/atoms.css, this still needs) — set this when nesting
 *   one wrapWithHousingFrame call inside another (e.g. a thin inner rim
 *   inside a thick outer housing) and something needs to target just one
 *   of them in CSS.
 * @returns {{ el: HTMLElement, outline: HTMLElement, accent: HTMLElement | null, observer: ResizeObserver }}
 *   el: the new wrapper (fillEl's new parent) — append this wherever
 *   fillEl itself would otherwise have gone. outline: the main frame div
 *   itself, in case a caller needs to restyle/inspect it directly.
 *   accent: the thinner second-layer div, or null if accentRatio was 0.
 *   observer: the ResizeObserver, in case the caller ever tears this
 *   down and needs to disconnect it.
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
  // every side, not just be clipped to a shape that does — clip-path can
  // reveal area beyond an element's own border-box, but background
  // painting (background-clip: border-box, the default) stops exactly at
  // that border-box regardless, so the outward-bled part of the shape
  // would have no painted background under it otherwise. originX/Y shift
  // by the current outset so framePathBuilder's own coordinates (still
  // computed against fillEl's own w/h) land correctly within this
  // now-bigger box's own local origin (its top-left is fillEl's own
  // -outset,-outset, MEASURED relative to `wrap` — not assumed to be
  // exactly (0,0) the way a naive `left: -outset` would. `wrap` is
  // display: inline-block; width: auto (styles/atoms.css), meant to
  // shrink-wrap tightly to fillEl, but a fillEl whose own width is a
  // percentage (e.g. .countdown-rim-wrap's mobile `calc(100% - 16px)`,
  // index.html) can end up not exactly filling that shrink-wrapped box —
  // confirmed directly on a 390px-wide mobile viewport: `wrap` measured
  // ~410px, fillEl only ~395px, an 8px gap on *each* side. A naive
  // `left: -outset` (anchored to wrap's own edge) would then be off by
  // that same gap, and unevenly — the gap adds to the outset on one side
  // while partly canceling it on the other, reading as the whole frame
  // shifted sideways rather than evenly framing fillEl. Measuring
  // fillEl's real position within wrap keeps this correct regardless of
  // whether that gap exists, without needing to fix (or explain) why it
  // exists in the first place.
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
