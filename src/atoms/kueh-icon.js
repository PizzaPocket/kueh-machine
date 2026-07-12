// Procedural SVG illustration system — five flat, color-banded shape
// templates that rhyme with the site's existing .kueh-slice hero graphic
// and favicon (both stacked color bars), rather than photographic/gradient
// artwork. Serves two roles: a small icon next to a kueh's name, and the
// large fallback shown in the media slot for kueh without a photo yet.
// Same pure function serves both via the `size` param.

import { oklchToHex } from '../tokens/colors.js';
import { KUEH_SEED_TABLE } from '../data/kueh.js';

let uid = 0;

function colorsForSeed(seed) {
  if (!seed || seed.mode === 'signature') {
    // kueh-lapis itself — no seed to derive from, since the multicolor
    // rainbow-layer kueh already *is* this site's own default palette.
    return { base: '#61A081', shadow: '#2D6A4F', highlight: '#F9C74F' };
  }
  if (seed.mode === 'neutral') {
    // A near-zero primary chroma is intentional for the CSS ramp (it reads
    // as white/cream there because REF's L values stay mid-tone), but at
    // this icon's fixed L 0.62/0.42 that same low chroma has no hue left to
    // show — it just renders as flat gray. Lighten base/shadow into the
    // pale-cream range instead, where the warm hue is still visible.
    return {
      base: oklchToHex(0.92, Math.max(seed.primary.c, 0.03), seed.primary.h),
      shadow: oklchToHex(0.76, Math.max(seed.primary.c, 0.03) * 1.2, seed.primary.h),
      highlight: oklchToHex(0.85, seed.accent.c * 0.6, seed.accent.h),
    };
  }
  // base/shadow come from the kueh's actual body color (primary); the sheen
  // highlight uses the accent hue (e.g. gula melaka gold) rather than a
  // lighter tint of the same primary hue, so the icon reflects the food's
  // real secondary color too.
  return {
    base: oklchToHex(0.62, seed.primary.c * 1.1, seed.primary.h),
    shadow: oklchToHex(0.42, seed.primary.c * 1.05, seed.primary.h),
    highlight: oklchToHex(0.85, seed.accent.c * 0.6, seed.accent.h),
  };
}

function circleSubpath(cx, cy, r) {
  return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0`;
}

const TEMPLATES = {
  dome(colors) {
    return `
      <ellipse cx="32" cy="47" rx="24" ry="7" fill="${colors.shadow}"/>
      <path d="M8 47 A24 27 0 0 1 56 47 Z" fill="${colors.base}"/>
      <ellipse cx="25" cy="30" rx="7" ry="5" fill="${colors.highlight}" opacity="0.55"/>
    `;
  },
  'layered-bars'(colors) {
    const id = `koi-clip-${uid++}`;
    const bandFills = [colors.shadow, colors.highlight, colors.base, colors.highlight, colors.shadow];
    const bandHeight = 40 / bandFills.length;
    const bands = bandFills
      .map((fill, i) => `<rect x="10" y="${12 + i * bandHeight}" width="44" height="${bandHeight}" fill="${fill}"/>`)
      .join('');
    return `
      <clipPath id="${id}"><rect x="10" y="12" width="44" height="40" rx="5"/></clipPath>
      <g clip-path="url(#${id})">${bands}</g>
    `;
  },
  pyramid(colors) {
    return `
      <path d="M32 8 L54 52 L10 52 Z" fill="${colors.base}"/>
      <path d="M32 8 L32 52 L10 52 Z" fill="${colors.shadow}" opacity="0.4"/>
      <line x1="32" y1="8" x2="32" y2="52" stroke="${colors.shadow}" stroke-width="1"/>
    `;
  },
  crescent(colors) {
    const d = `${circleSubpath(30, 32, 22)} ${circleSubpath(40, 26, 19)}`;
    return `<path d="${d}" fill-rule="evenodd" fill="${colors.base}"/>`;
  },
  disc(colors) {
    return `
      <ellipse cx="32" cy="36" rx="24" ry="15" fill="${colors.shadow}"/>
      <ellipse cx="32" cy="32" rx="24" ry="15" fill="${colors.base}"/>
      <ellipse cx="26" cy="26" rx="10" ry="4" fill="${colors.highlight}" opacity="0.45"/>
    `;
  },
};

/**
 * @param {{id: string}} kueh
 * @param {'dome'|'layered-bars'|'pyramid'|'crescent'|'disc'} template
 * @param {number} size - rendered width/height in px
 * @returns {string} standalone <svg> markup
 */
export function renderKuehSvg(kueh, template, size = 48) {
  const seed = KUEH_SEED_TABLE[kueh.id];
  const colors = colorsForSeed(seed);
  const build = TEMPLATES[template] || TEMPLATES.disc;
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${kueh.name || ''}">${build(colors)}</svg>`;
}
