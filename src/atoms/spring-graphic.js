// Atom: the spring graphic (buildSpringCoilPaths, tokens/spring.js) as a
// live, resizable SVG — a chain of metal coil loops that visibly stretches
// (fewer, more open coils) as stretchFraction increases. Mirrors
// rivets.js's own "pure-math token -> tiny DOM builder" split: spring.js
// knows nothing about SVG/DOM, this atom just draws its output.
//
// One shared <linearGradient gradientUnits="objectBoundingBox"> for every
// coil, rather than the reference assets' own one-gradient-per-coil
// approach (they needed that since each coil sits at a different absolute
// position; objectBoundingBox units auto-adapt to each <path>'s own
// bounding box, so one definition covers all of them). Reuses the site's
// own metal tokens (--metal-shadow/--metal-highlight/--metal-base) rather
// than the reference's literal hex values, so it retunes together with
// the rest of the chrome/rivet system.

import { buildSpringCoilPaths } from '../tokens/spring.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
let uid = 0;

/**
 * Builds the spring's SVG shell (gradient def + an empty <g> to hold the
 * coil paths) — call updateSpringGraphic once the element is laid out to
 * actually draw the coils. Returns { svg, group, gradientId }.
 */
export function createSpringGraphic() {
  const id = `spring-gradient-${uid++}`;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'spring-graphic');
  svg.setAttribute('aria-hidden', 'true');
  // Five stops (not the old two-stop dark->mid wash) so the gradient
  // reads as a tight, bright specular band crossing each coil diagonally
  // rather than a flat shading ramp — --metal-base (not the much darker
  // --metal-shadow, which read as too heavy) grounds the wire at both
  // ends, lifting partway toward --metal-highlight at 0.32/0.68, then a
  // sharp swing up to raw --metal-highlight over a narrow middle span
  // (0.32-0.68) reads as a gleam catching the wire, not a gradual sheen.
  // gradientUnits objectBoundingBox means every coil (each its own
  // <path>, own bbox) gets this identical relative band, so the glint
  // appears to hit each loop at the same spot — a consistent light
  // source, not per-coil noise.
  svg.innerHTML = `
    <defs>
      <linearGradient id="${id}" gradientUnits="objectBoundingBox" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stop-color="var(--metal-base)"/>
        <stop offset="0.32" stop-color="color-mix(in srgb, var(--metal-highlight) 25%, var(--metal-base))"/>
        <stop offset="0.52" stop-color="var(--metal-highlight)"/>
        <stop offset="0.68" stop-color="color-mix(in srgb, var(--metal-highlight) 25%, var(--metal-base))"/>
        <stop offset="1" stop-color="var(--metal-base)"/>
      </linearGradient>
    </defs>
    <g class="spring-coils"></g>
  `;
  return { svg, group: svg.querySelector('.spring-coils'), gradientId: id };
}

/**
 * Recomputes and redraws the spring's coils to fill a `width` x `height`
 * box (explicit, not measured from a live element) at the given
 * stretchFraction (0 = fully coiled, 1 = fully stretched). Explicit
 * dimensions rather than reading a container's own clientWidth/Height —
 * a caller that visually rotates the rendered SVG 90deg (the mobile
 * vertical layout, timeline-panel.js) needs the coils generated for their
 * own pre-rotation logical box, not the rotated container's actual
 * (swapped) rendered box.
 */
export function updateSpringGraphic({ svg, group, gradientId }, { stretchFraction, width, height }) {
  if (!width || !height) return;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  const { coils } = buildSpringCoilPaths({ width, height, stretchFraction });
  const strokeWidth = Math.max(1, height / 12);

  group.innerHTML = coils
    .map((d) => `<path d="${d}" fill="none" stroke="url(#${gradientId})" stroke-width="${strokeWidth}" stroke-linecap="round"/>`)
    .join('');
}
