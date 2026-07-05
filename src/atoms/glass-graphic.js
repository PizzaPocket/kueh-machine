// Atom: the hanging glass — four stacked layers (back silhouette, a
// frosted blur, a procedurally-built liquid, front highlight accents),
// same "pure DOM-wiring, no page-specific logic" role
// src/atoms/spring-graphic.js plays for the spring. Renders at one fixed
// pixel size (unlike spring-graphic, which fills a variable-width slot) —
// no resize/observer plumbing needed here.

import {
  LIQUID_FLOOR,
  liquidTopEllipseAt,
  buildLiquidBodyPath,
  OUTER_SILHOUETTE_D,
} from '../tokens/glass-shape.js';
import { createLiquidRipple } from './liquid-ripple.js';

const WIDTH = 168;
const HEIGHT = 118; // 168 * 141/200, matching the artwork's own aspect ratio
const SVG_NS = 'http://www.w3.org/2000/svg';
let uid = 0;

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

/**
 * Builds the glass graphic once. Returns `{ el, setFill(fraction), width, height }` —
 * `el` is the fixed-size wrapper to append wherever the glass should hang;
 * `setFill(fraction)` (0-1) rebuilds the liquid's own top-surface ellipse
 * and body path for that fill level (src/tokens/glass-shape.js — the
 * surface ellipse follows the cup's own taper, including its fluted band
 * near the rim, rather than a flat mask edge).
 */
export function createGlassGraphic() {
  const el = document.createElement('div');
  el.className = 'tl-glass';
  el.style.width = `${WIDTH}px`;
  el.style.height = `${HEIGHT}px`;

  // Inlined (fetched + injected), not a plain <img> — an <img> renders the
  // asset as one opaque bitmap, with no way to reach into its own internal
  // layers from CSS. Inlining exposes those layers as real DOM nodes, so
  // one of them (the masked #E2E2E2 inner-rim-highlight paths — see
  // styles/organisms/timeline-panel.css) can have its own opacity turned
  // down independently of the rest of the artwork.
  const back = document.createElement('div');
  back.className = 'tl-glass-back';
  back.setAttribute('aria-hidden', 'true');
  fetch('images/glass/glass-back.svg')
    .then((res) => res.text())
    .then((svgText) => {
      back.innerHTML = svgText;
    })
    .catch(() => {}); // decorative only — fine to stay blank on failure

  // Frosted/etched look: blurs whatever sits behind the panel. Clipped to
  // the cup's own outer silhouette via a real SVG <clipPath> built from
  // the exact same path the back-layer artwork itself uses
  // (OUTER_SILHOUETTE_D, src/tokens/glass-shape.js) — not a CSS
  // `mask-image: url(...)` referencing that asset by URL, which needed
  // `mask-mode: alpha` to read its transparency and, in practice, didn't
  // reliably apply that mode, silently falling back to unmasked (the blur
  // bleeding across the whole rectangular layer instead of stopping at
  // the cup's edge). A <clipPath> has no such ambiguity. Its own
  // coordinate system is the artwork's native 200x141 space, so a
  // `transform: scale(...)` maps it onto this element's actual WIDTH x
  // HEIGHT rendered size.
  const clipId = `tl-glass-clip-${uid++}`;
  const clipSvg = document.createElementNS(SVG_NS, 'svg');
  clipSvg.setAttribute('width', '0');
  clipSvg.setAttribute('height', '0');
  clipSvg.style.position = 'absolute';
  clipSvg.innerHTML = `<defs><clipPath id="${clipId}"><path d="${OUTER_SILHOUETTE_D}" transform="scale(${WIDTH / 200} ${HEIGHT / 141})"/></clipPath></defs>`;

  const frost = document.createElement('div');
  frost.className = 'tl-glass-frost';
  frost.style.clipPath = `url(#${clipId})`;

  // Real ellipse-based liquid (src/tokens/glass-shape.js), not a flat
  // clip-path block — viewBox matches the artwork's own native 200x141
  // space exactly, so glass-shape.js's coordinates apply with no separate
  // scale factor. Same 3-shape structure as wip/Glass/Example -
  // Liquid.svg itself: a body path (just the fluted walls now — see
  // buildLiquidBodyPath's own comment for why it no longer also traces
  // either ellipse's own dip) with a full <ellipse> for the surface and
  // another for the floor layered on top, each tinted from the same
  // --color-primary-soft ramp the body uses (styles/organisms/
  // timeline-panel.css) — the floor brighter, matching the reference
  // asset's own lighter floor tone (light passing through less liquid
  // there).
  const liquidSvg = document.createElementNS(SVG_NS, 'svg');
  liquidSvg.setAttribute('viewBox', '0 0 200 141');
  liquidSvg.setAttribute('preserveAspectRatio', 'none');
  liquidSvg.classList.add('tl-glass-liquid');

  const body = document.createElementNS(SVG_NS, 'path');
  body.classList.add('tl-glass-liquid-body');
  const floorEl = document.createElementNS(SVG_NS, 'ellipse');
  floorEl.classList.add('tl-glass-liquid-floor');
  floorEl.setAttribute('cx', LIQUID_FLOOR.cx);
  floorEl.setAttribute('cy', LIQUID_FLOOR.cy);
  floorEl.setAttribute('rx', LIQUID_FLOOR.rx);
  floorEl.setAttribute('ry', LIQUID_FLOOR.ry);
  const surfaceEl = document.createElementNS(SVG_NS, 'ellipse');
  surfaceEl.classList.add('tl-glass-liquid-surface');

  liquidSvg.append(body, floorEl, surfaceEl);

  // The drop's own "lands in the liquid" reaction (flash, splashlets,
  // ripple rings, meniscus wobble) — src/atoms/liquid-ripple.js. Its own
  // layers are appended right here, still inside liquidSvg and still
  // before `front` below, so they're naturally occluded by the front
  // rim-highlight accents via DOM order alone, same as everything else in
  // this stack.
  const ripple = createLiquidRipple({ svg: liquidSvg, body, surfaceEl });

  const front = document.createElement('img');
  front.className = 'tl-glass-front';
  front.src = 'images/glass/glass-front.svg';
  front.alt = '';
  front.setAttribute('aria-hidden', 'true');

  el.append(clipSvg, back, frost, liquidSvg, front);

  function setFill(fraction) {
    const top = liquidTopEllipseAt(fraction);
    body.setAttribute('d', buildLiquidBodyPath(top, LIQUID_FLOOR));
    surfaceEl.setAttribute('cx', top.cx);
    surfaceEl.setAttribute('cy', top.cy);
    surfaceEl.setAttribute('rx', top.rx);
    surfaceEl.setAttribute('ry', top.ry);
    ripple.setTop(top);
  }

  setFill(0);

  // The final leg of the drop-chute's own journey (src/organisms/
  // drop-chute.js's long fall ends right at this element's own top edge,
  // already at terminal velocity by then) — a short fall from there down
  // to the *current* liquid surface, inserted into the DOM between
  // liquidSvg and front so it's naturally behind the front accents layer
  // (no z-index needed, DOM order alone does it) — reads as the drop
  // disappearing behind the near rim as it goes in, the way a real object
  // dropped into a cup would. `linear`, not `ease-in` — the long fall
  // already did its own accelerating and settled into a constant speed by
  // the time it reaches here; restarting with another ease-in would read
  // as slowing down right at the handoff instead of carrying that same
  // speed the rest of the way in.
  //
  // `terminalSpeed` (px/ms, from drop-chute.js's own long fall) drives the
  // duration directly (distance / speed) so this leg genuinely moves at
  // that *exact* same rate all the way to the surface, rather than an
  // independently-picked fixed duration that would only coincidentally
  // match. Falls back to a plain default when it's not available (under
  // prefers-reduced-motion, drop-chute.js skips the fall animation
  // entirely and never computes one).
  function dropIntoLiquid(terminalSpeed, onLanded) {
    const surfaceY = parseFloat(surfaceEl.getAttribute('cy')) * (HEIGHT / 141);
    const duration = terminalSpeed ? surfaceY / terminalSpeed : 320;
    const drop = document.createElement('div');
    drop.className = 'tl-glass-drop';
    el.insertBefore(drop, front);
    // Same max stretch drop-chute.js's own long fall (spawnFall) settles
    // into once it reaches terminal velocity — this leg continues at that
    // *exact* speed (see `duration` above), so the shape shouldn't reset
    // to round only to re-stretch again; it's already been falling fast
    // the whole way down.
    const anim = drop.animate(
      [
        { transform: 'translateY(0) scale(0.8, 1.35)' },
        { transform: `translateY(${surfaceY}px) scale(0.8, 1.35)` },
      ],
      { duration, easing: 'linear' }
    );
    anim.onfinish = () => {
      drop.remove();
      if (!prefersReducedMotion) ripple.impact();
      onLanded && onLanded();
    };
  }

  return { el, setFill, dropIntoLiquid, width: WIDTH, height: HEIGHT };
}
