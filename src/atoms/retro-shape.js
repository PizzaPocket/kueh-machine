// Atom: the retro-rectangle shape system — the swelled-corner superellipse
// silhouette (src/tokens/superellipse.js) as a live, resizable treatment
// for any element. Despite the name of its original consumer (the Kueh of
// the Day image/content "windows"), this isn't window-specific: it's the
// shape engine behind windows, chrome rim/glint bands, tab buttons, and
// small buttons alike. Two modes:
//
//   - createRetroShape({ fill }) — a filled <path> carrying an
//     inner-shadow filter, for surfaces that need their own flat-color
//     "recessed glass" fill (the Kueh of the Day image and its tab content
//     panel, src/organisms/kueh-of-day.js).
//   - createRetroShape() — clip-only, no fill/filter/visible content, for
//     elements that already paint their own background (a conic-gradient
//     chrome rim, a plain-color pill fill) and just need their silhouette
//     reshaped to match (the tab group's rim/background/highlight,
//     src/molecules/tab-group.js; small buttons, src/atoms/button.js).
//
// Either way, createRetroShape() hands back the pieces a caller wires
// into its own element; observeRetroShape() keeps the shape's `d` in
// sync with the target element's live box size via ResizeObserver —
// covers viewport resize, breakpoint layout changes, and the target's own
// content growing/shrinking (e.g. the recipe panel's "see more" toggle),
// all with one mechanism, since ResizeObserver reacts to the rendered box
// regardless of why it changed. It also fires once immediately on
// `.observe()`, so no separate "after this is attached to the DOM" hook is
// needed to get the initial shape sized.

import { buildSuperellipsePath, solveClearingExponent } from '../tokens/superellipse.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

let uid = 0;

// Reference shape opts for small, already-generously-padded controls (no
// risk of a corner clipping text, so this skips updateRetroShape's
// content-clearance solve — see its `n` param — in favor of a fixed
// exponent). Lower than the big windows' n=10 default, since a small
// control needs a more visible curve to read as the retro-rectangle motif
// rather than an ordinary rounded rect; gutter: 0 keeps nested bands
// flush, the same job their old border-radius: inherit did. Shared here
// (not left local to one molecule) because it's the reference "small
// retro rectangle" shape reused across the site's small-button family —
// src/molecules/tab-group.js's own tab buttons/rim/glint/list/highlight,
// and src/atoms/button.js's small buttons. Tune by eye; every consumer
// picks it up at once.
export const SMALL_RETRO_SHAPE_OPTS = { gutter: 0, n: 6 };

// Two-layer inner-shadow recipe: invert the shape's own alpha (opaque
// interior -> 0, transparent exterior -> 1) before blurring, so the blur
// spreads *inward* from the boundary into a ring. Compositing a flood
// straight against SourceAlpha (without the inversion) just tints the
// entire fill uniformly instead of hugging the edge. Default blur values
// carry over from .hero-title's own two-layer drop-shadow (index.html) — a
// wide soft pass plus a tighter crisp pass — tuned for a normal window
// (200px+ tall). `shadow` lets a caller scale that down for a much
// shorter box: at a curved corner (a retro-rectangle's swelled ends) the
// blur's ring concentrates into a visible band regardless of box size,
// but along a long *flat* edge the same wide stdDeviation spreads across
// most/all of a short box's own thickness before it can fade back to
// zero, so opposite edges' rings overlap into one faint, near-uniform
// tint instead of two distinct edge shadows — reads as "shadow only at
// the rounded ends, invisible along the top/bottom" (confirmed against
// timeline-panel.js's own spring/dial windows, ~26-46px tall). A smaller
// stdDeviation there keeps the ring tight enough to actually resolve
// against a flat edge that close to its opposite one.
function filterMarkup(id, { wideBlur = 14, wideOpacity = 0.28, tightBlur = 3, tightOpacity = 0.18 } = {}) {
  return `
    <filter id="${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feComponentTransfer in="SourceAlpha" result="inverted-alpha">
        <feFuncA type="table" tableValues="1 0"/>
      </feComponentTransfer>

      <feGaussianBlur in="inverted-alpha" stdDeviation="${wideBlur}" result="blur-wide"/>
      <feFlood flood-color="#000" flood-opacity="${wideOpacity}" result="flood-wide"/>
      <feComposite in="flood-wide" in2="blur-wide" operator="in" result="tinted-wide"/>
      <feComposite in="tinted-wide" in2="SourceAlpha" operator="in" result="ring-wide"/>

      <feGaussianBlur in="inverted-alpha" stdDeviation="${tightBlur}" result="blur-tight"/>
      <feFlood flood-color="#000" flood-opacity="${tightOpacity}" result="flood-tight"/>
      <feComposite in="flood-tight" in2="blur-tight" operator="in" result="tinted-tight"/>
      <feComposite in="tinted-tight" in2="SourceAlpha" operator="in" result="ring-tight"/>

      <feMerge result="both-rings">
        <feMergeNode in="ring-wide"/>
        <feMergeNode in="ring-tight"/>
      </feMerge>
      <feMerge>
        <feMergeNode in="SourceGraphic"/>
        <feMergeNode in="both-rings"/>
      </feMerge>
    </filter>
  `;
}

/**
 * Builds the shape's SVG layer. With `fill`: a filled <path> carrying the
 * inner-shadow filter, plus a matching <clipPath> — append `svg` as the
 * target element's first child (it must paint behind the target's own
 * content; see .retro-shape-fill, styles/organisms/kueh-of-day.css, for
 * the z-index that actually pins it there — position:absolute alone
 * doesn't respect DOM order for stacking). Without `fill`: just the
 * <clipPath>, no visible content — append `svg` anywhere in the target
 * element (it paints nothing, so placement doesn't matter).
 *
 * Either way, both paths' `d` start empty — call updateRetroShape (or
 * observeRetroShape) once the target element is laid out to size them.
 * `shadow`: forwarded to filterMarkup — pass tighter blur values for a
 * much-shorter-than-usual window (see filterMarkup's own comment).
 * Returns { svg, clipUrl, clipPathEl, shadowPathEl } (shadowPathEl is
 * null in clip-only mode).
 */
export function createRetroShape({ fill, shadow } = {}) {
  const id = `retro-shape-${uid++}`;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');

  if (fill) {
    svg.setAttribute('class', 'retro-shape-fill');
    svg.innerHTML = `
      <defs>
        <clipPath id="${id}-clip" clipPathUnits="userSpaceOnUse"><path d=""/></clipPath>
        ${filterMarkup(`${id}-shadow`, shadow)}
      </defs>
      <path fill="${fill}" filter="url(#${id}-shadow)" d=""/>
    `;
  } else {
    // No visible content, so it doesn't need a rendered box of its own —
    // width/height 0 + position:absolute is the standard "defs-only host"
    // pattern (same as the hidden <svg> this atom's kueh-of-day.js
    // predecessor used before it grew a visible fill layer).
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = `<defs><clipPath id="${id}-clip" clipPathUnits="userSpaceOnUse"><path d=""/></clipPath></defs>`;
  }

  return {
    svg,
    clipUrl: `url(#${id}-clip)`,
    clipPathEl: svg.querySelector(`#${id}-clip path`),
    shadowPathEl: fill ? svg.querySelector('svg > path') : null,
  };
}

// Shared by updateRetroShape (below) and matte-rim.js, which needs to
// resolve fillEl's own corner exponent *once* and reuse that same value
// for its rim/glint bands — each band solving independently against its
// own (near-zero) padding would push it toward a much tighter corner than
// the window it's wrapping, since there's essentially no content-
// clearance requirement to solve for at that thinness. Returns the actual
// exponent used, given a box already inset by `gutter`.
function resolveN(el, width, height, gutter, n) {
  if (n !== undefined) return n;
  const style = getComputedStyle(el);
  const marginX = Math.max(Math.min(parseFloat(style.paddingLeft), parseFloat(style.paddingRight)) - gutter, 0);
  const marginY = Math.max(Math.min(parseFloat(style.paddingTop), parseFloat(style.paddingBottom)) - gutter, 0);
  return solveClearingExponent({ width, height, marginX, marginY });
}

/**
 * Recomputes and applies the shape's `d` to both the clip and shadow
 * paths (shadowPathEl is skipped in clip-only mode), sized to `el`'s
 * current box. `gutter` insets the shape from el's own edges (so it
 * floats with breathing room rather than pressing flush against a
 * container edge — pass 0 for elements meant to nest flush, like a chrome
 * rim's bands). `n`: pass an explicit exponent to skip the
 * content-clearance solve entirely and use a fixed corner tightness — for
 * elements with no risk of clipping real content near the corner (a
 * chrome rim, a pill fill, a sliding highlight), solving against padding
 * that isn't meant for text clearance doesn't make sense. Left
 * unspecified, it's solved per resize via solveClearingExponent so the
 * shape always clears whatever padded content the element does have (the
 * Kueh of the Day image, the tab content panel). Returns the exponent
 * actually used, so a caller wrapping this element (matte-rim.js) can
 * reuse the same value for its own bands rather than each solving
 * independently.
 *
 * `pathBuilder` swaps in a different shape formula sharing this same
 * gutter/exponent-solving/resize machinery — e.g. buildFunnelPath
 * (tokens/superellipse.js) for the countdown clock's water-clock viewport,
 * which needs the identical DOM/clip wiring but a different silhouette.
 * Defaults to buildSuperellipsePath, so every existing caller (which never
 * passes it) is unaffected. Any extra options are passed straight through
 * to the builder (e.g. buildFunnelPath's funnelDepthRatio).
 */
export function updateRetroShape(el, { clipPathEl, shadowPathEl }, { gutter = 16, n, pathBuilder = buildSuperellipsePath, ...pathOpts } = {}) {
  const boxWidth = el.clientWidth;
  const boxHeight = el.clientHeight;
  if (!boxWidth || !boxHeight) return n;

  const g = Math.min(gutter, boxWidth / 4, boxHeight / 4);
  const width = boxWidth - g * 2;
  const height = boxHeight - g * 2;
  const resolvedN = resolveN(el, width, height, g, n);

  const d = pathBuilder({ width, height, n: resolvedN, originX: g + width / 2, originY: g + height / 2, ...pathOpts });

  clipPathEl.setAttribute('d', d);
  if (shadowPathEl) shadowPathEl.setAttribute('d', d);

  return resolvedN;
}

/**
 * Wires a ResizeObserver on `el` that keeps its shape in sync with its
 * live box size. `onUpdate`, if given, runs after every shape update —
 * for callers with a second thing that needs to stay in sync with the
 * same resize events (the tab group's sliding highlight needs
 * repositioning whenever tab-group's own box changes, since that's also
 * when button widths can change). Returns the observer so the caller can
 * `.disconnect()` it if `el` is ever torn down and rebuilt.
 */
export function observeRetroShape(el, refs, opts, onUpdate) {
  const observer = new ResizeObserver(() => {
    updateRetroShape(el, refs, opts);
    if (onUpdate) onUpdate();
  });
  observer.observe(el);
  return observer;
}

/**
 * Convenience wrapper for the common "just reshape this element's own
 * silhouette" case — clip-only createRetroShape() + append the svg +
 * apply the clip-path + observeRetroShape, in one call. For an element
 * that already paints its own background (a button's hover tint, a
 * chrome rim's conic gradient) and just needs its outline to follow the
 * retro-rectangle curve rather than a plain rectangle/border-radius. Used
 * by tab-group.js's buttons/rim/glint/list/highlight and
 * kueh-of-day.js's/button.js's small buttons. Returns the ResizeObserver
 * (see observeRetroShape).
 */
export function attachRetroShapeClip(el, opts, onUpdate) {
  const refs = createRetroShape();
  el.appendChild(refs.svg);
  el.style.clipPath = refs.clipUrl;
  return observeRetroShape(el, refs, opts, onUpdate);
}
