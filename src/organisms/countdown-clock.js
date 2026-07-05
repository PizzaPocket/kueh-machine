// Wires the hero countdown's "water clock" viewport: a funnel-bottomed
// retro-rectangle window (buildFunnelPath, tokens/superellipse.js) built
// from two stacked fill+shadow layers — .countdown-window-bg and
// .countdown-liquid (the latter masked to a bottom-up water level by
// --liquid-fill — see index.html's inline script for that level math and
// its CSS for the mask-image). Their actual colors come from
// --countdown-bg-color/--countdown-liquid-color (defined once, right above
// .countdown-viewport in index.html) rather than hardcoded here, so
// retuning either is a one-line edit in that one place. Both layers use
// createRetroShape's `fill` mode, the same recipe the Kueh of the Day
// windows use for their own inner shadow (src/organisms/kueh-of-day.js's
// buildMediaWindow/buildContentWindow) — computed independently but from
// identical inputs, so their silhouettes always align pixel-for-pixel.
//
// Wrapped in a matte rim, same as those windows (src/atoms/matte-rim.js),
// but tinted to the theme's primary-strong color instead of the standard
// neutral metal (.rim-matte-inner-tinted, styles/atoms.css) — this window
// sits directly on the dark hero background, not a light neutral surface,
// so the rim should read as "this same material, recolored to its
// surroundings" rather than a mismatched silver bezel.
//
// Everything else about the countdown (the digit ticking, the liquid's
// fill percentage, the drip animation) is plain inline script in
// index.html, same as it always has been — only the shape/shadow/rim
// needed this module, to reuse the existing atoms rather than
// reimplementing them. One exception: the little bubble burst that rises
// from the spout on each drop release (src/atoms/liquid-bubbles.js) is
// wired up here instead, since it's a new decorated reaction rather than
// existing inline logic, and this module already holds the `liquid`
// element reference it needs.

import { createRetroShape, updateRetroShape } from '../atoms/retro-shape.js';
import { wrapWithHousingFrame } from '../atoms/housing-frame.js';
import { spawnBubbleBurst } from '../atoms/liquid-bubbles.js';
import { buildFunnelPath, buildFunnelOutsetOutlinePath } from '../tokens/superellipse.js';

// Both stops stay anchored to --color-primary-strong itself (the hero's
// own background color, .hero's `background: var(--color-primary-strong)`
// in index.html) — only lightened/darkened a little, rather than mixed
// toward white/--metal-highlight the way housing-frame.js's own defaults
// do (which read as a distinct silver bezel dropped onto the hero, not
// part of it). Keeping the same hue throughout is what makes the housing
// read as an extension of the hero surface itself — a raised lip of the
// same material — rather than a separate metal rim.
const HOUSING_DARK = 'color-mix(in srgb, var(--color-primary-strong) 85%, black)';
const HOUSING_LIGHT = 'color-mix(in srgb, var(--color-primary-strong) 85%, white)';

// The inner rim used to be wrapWithInnerMatteRim (matte-rim.js) — a solid
// closed shape (buildFunnelPath), padded to peek out around the viewport's
// own edges. That reads fine everywhere *except* the funnel's own spout:
// the padding wraps uniformly around the whole silhouette, including the
// tip, so it sealed the spout with a short flat cap — visible as a stray
// line right where the tip should read as open (the housing frame right
// outside it already has a real gap there, buildFunnelOutsetOutlinePath,
// which is what made the rim's own flat cap stand out as an artifact by
// comparison). Rebuilt here as another wrapWithHousingFrame ring instead —
// same gap-aware geometry as the housing — with a linear-gradient
// `metal` override reproducing .rim-matte-inner-tinted's own exact
// color-mix recipe (styles/atoms.css) rather than the atom's default
// conic "liquid chrome" look, so the material itself still reads
// identically to every other tinted matte rim on the site.
const RIM_THICKNESS = 2.25; // 1.5px .rim-matte-inner + 0.75px .rim-matte-inner-glint, matching that recipe's own combined thickness
const RIM_GLINT_RATIO = 0.75 / RIM_THICKNESS; // glint's own share of the total, nested flush with the viewport's edge — same relationship as the original two-band rim
const RIM_METAL = `linear-gradient(
  135deg,
  color-mix(in srgb, var(--color-primary-strong) 45%, white) 0%,
  color-mix(in srgb, var(--color-primary-strong) 30%, white) 20%,
  color-mix(in srgb, var(--metal-highlight) 88%, var(--color-primary-strong)) 45%,
  color-mix(in srgb, var(--color-primary-strong) 30%, white) 65%,
  color-mix(in srgb, var(--color-primary-strong) 45%, white) 100%
)`;
const RIM_GLINT_METAL = `linear-gradient(
  135deg,
  transparent 0%,
  color-mix(in srgb, var(--metal-highlight) 94%, var(--color-primary-strong)) 45%,
  transparent 60%
)`;

// gutter: 0 — .countdown-viewport's own padding already reserves room for
// the digit stack and the spout beneath it, so the shape should fill its
// full padded box rather than inset further.
//
// n: 10 (fixed, not auto-solved) — solveClearingExponent (the default
// behavior) was designed to fit a plain content box against a plain
// superellipse's own corners; the funnel's asymmetric bottom appendage
// would skew that solve in ways it wasn't built for, the same reasoning
// SMALL_RETRO_SHAPE_OPTS already uses to justify a fixed n elsewhere. Both
// the window's own bg/liquid shapes and the rim/glint bands wrapping it
// share this exact options object, so all four silhouettes stay identical.
const SHAPE_OPTS = { gutter: 0, n: 10, pathBuilder: buildFunnelPath };

export function init() {
  const viewport = document.querySelector('.countdown-viewport');
  const windowBg = document.querySelector('.countdown-window-bg');
  const liquid = document.querySelector('.countdown-liquid');
  if (!viewport || !windowBg || !liquid) return;

  const bgRefs = createRetroShape({ fill: 'var(--countdown-bg-color)' });
  windowBg.appendChild(bgRefs.svg);

  // Wraps .countdown-liquid solely to host a drop-shadow filter, projected
  // upward (negative y offset) onto .countdown-window-bg behind it. filter
  // and mask don't compose on the *same* element the way you'd expect —
  // filter reads the element's content before its own mask crops it, so
  // the shadow would follow the liquid's full unmasked funnel shape rather
  // than whatever's currently visible. On a parent instead, the filter's
  // source image is .countdown-liquid's own already-masked render, so the
  // cast shadow correctly tracks the live water line as it drains.
  const shadowWrap = document.createElement('div');
  shadowWrap.className = 'countdown-liquid-shadow-wrap';
  liquid.parentNode.insertBefore(shadowWrap, liquid);
  shadowWrap.appendChild(liquid);

  const liquidRefs = createRetroShape({ fill: 'var(--countdown-liquid-color)' });
  liquid.appendChild(liquidRefs.svg);

  // A thin darker band right at the current water level — pure CSS
  // (styles/organisms/... inline in index.html, .countdown-liquid-surface),
  // reading the exact same --liquid-fill custom property the mask itself
  // reveals to, so it tracks the surface (including rippleLiquid's own
  // wobble) with no extra per-frame JS. clip-path reuses liquidRefs' own
  // clipUrl — the same funnel silhouette the fill SVG is shaped to — so the
  // band doesn't spill past the rounded corners when the level sits near
  // the very top of the shape (true for most of the countdown, since
  // remainingPct starts near 100%).
  const surface = document.createElement('div');
  surface.className = 'countdown-liquid-surface';
  surface.style.clipPath = liquidRefs.clipUrl;
  liquid.appendChild(surface);

  // 'chute:ball-released' (index.html's updateDrop, dispatched the instant
  // a drop detaches from the spout) only ever fires when motion is
  // allowed — updateDrop early-returns on prefers-reduced-motion before
  // reaching that dispatch — so no separate check is needed here, same as
  // drop-chute.js's own listener for this event.
  window.addEventListener('chute:ball-released', () => spawnBubbleBurst(liquid));

  new ResizeObserver(() => {
    updateRetroShape(windowBg, bgRefs, SHAPE_OPTS);
    updateRetroShape(liquid, liquidRefs, SHAPE_OPTS);
  }).observe(viewport);

  const parent = viewport.parentNode;
  const nextSibling = viewport.nextSibling;
  const { el: rim } = wrapWithHousingFrame(viewport, {
    outsetDesktop: RIM_THICKNESS,
    outsetMobile: RIM_THICKNESS,
    n: SHAPE_OPTS.n,
    framePathBuilder: buildFunnelOutsetOutlinePath,
    metal: RIM_METAL,
    accentRatio: RIM_GLINT_RATIO,
    accentMetal: RIM_GLINT_METAL,
    wrapClassName: 'countdown-rim-wrap',
  });

  // A thick decorative *housing* frame drawn outside the rim's own edge —
  // src/atoms/housing-frame.js, generalized from an earlier version of
  // this exact code. framePathBuilder: buildFunnelOutsetOutlinePath (not
  // the atom's own default plain-ring builder) is what gets the frame its
  // gap/taper at the funnel's own spout, instead of a plain closed ring.
  const { el: frameWrap } = wrapWithHousingFrame(rim, {
    darkVar: HOUSING_DARK,
    lightVar: HOUSING_LIGHT,
    framePathBuilder: buildFunnelOutsetOutlinePath,
    n: SHAPE_OPTS.n,
  });
  parent.insertBefore(frameWrap, nextSibling);
}
