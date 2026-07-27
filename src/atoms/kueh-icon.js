// Procedural SVG illustration system — five flat, color-banded shape
// templates that rhyme with the site's existing .kueh-slice hero graphic
// and favicon (both stacked color bars), rather than photographic/gradient
// artwork. Serves two roles: a small icon next to a kueh's name, and the
// large fallback shown in the media slot for kueh without a photo yet.
// Same pure function serves both via the `size` param.

import { oklchToHex, accentHexForSeed, DEFAULT_THEME } from '../tokens/colors.js';
import { KUEH_SEED_TABLE } from '../data/kueh.js';

let uid = 0;

function colorsForSeed(seed) {
  if (!seed || seed.mode === 'signature') {
    // kueh-lapis itself — no seed to derive from, since the multicolor
    // rainbow-layer kueh already *is* this site's own default palette
    // (tokens/colors.js DEFAULT_THEME). base is a pale pink/cream (not
    // white) so layered-bars' [shadow, highlight, base, highlight, shadow]
    // bands read as the classic pink/green/white kueh lapis stripe repeat,
    // not a washed-out center band.
    return { base: '#F8E4EC', shadow: '#B72E68', highlight: '#8FCB5E' };
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

// A straight-edged star polygon (alternating outer/inner radius per
// vertex) — reads as a pleated/fluted mold at icon size without needing
// true scalloped arcs, the same "good enough at 48-64px" simplification
// the other templates' hand-authored paths already lean on.
function flutedSubpath(cx, cy, r, lobes, depth) {
  const inner = r * (1 - depth);
  const points = [];
  for (let i = 0; i < lobes * 2; i++) {
    const radius = i % 2 === 0 ? r : inner;
    const angle = (i / (lobes * 2)) * Math.PI * 2 - Math.PI / 2;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `M${points.join(' L')} Z`;
}

const TEMPLATES = {
  // cy 42 (not 47) — the drawn shape (arc top at cy-27=15 to shadow
  // ellipse bottom at cy+7=49) is only actually centered on the viewBox's
  // true vertical center (32) at this cy; 47 (the original value) put the
  // visual center at ~37, reading as bottom-weighted once cropped tightly
  // into a small circular avatar (styles/organisms/check-in.css).
  dome(colors) {
    return `
      <ellipse cx="32" cy="42" rx="24" ry="7" fill="${colors.shadow}"/>
      <path d="M8 42 A24 27 0 0 1 56 42 Z" fill="${colors.base}"/>
      <ellipse cx="25" cy="25" rx="7" ry="5" fill="${colors.highlight}" opacity="0.55"/>
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
  // A thick folded-over half (apam balik: a circular pancake folded in
  // half over its filling, then cut in half again for serving) — a flat
  // cut base (the two rects) under a domed arch (the folded exterior),
  // with a filling band right at the cut edge. Deliberately NOT a thin
  // moon-sliver crescent, which undersold how thick/flat the real thing
  // reads once folded and cut.
  folded(colors) {
    return `
      <path d="M9 42 A23 26 0 0 1 55 42 L55 48 L9 48 Z" fill="${colors.base}"/>
      <rect x="9" y="38" width="46" height="8" fill="${colors.highlight}" opacity="0.7" stroke="${colors.shadow}" stroke-width="1" stroke-opacity="0.4"/>
      <rect x="9" y="44" width="46" height="4" fill="${colors.shadow}" opacity="0.5"/>
    `;
  },
  disc(colors) {
    return `
      <ellipse cx="32" cy="36" rx="24" ry="15" fill="${colors.shadow}"/>
      <ellipse cx="32" cy="32" rx="24" ry="15" fill="${colors.base}"/>
      <ellipse cx="26" cy="26" rx="10" ry="4" fill="${colors.highlight}" opacity="0.45"/>
    `;
  },
  // A rolled crepe (kueh dadar) — plain rounded rectangle for the wrapped
  // tube, with a small filling mark near one tip where the wrap's own end
  // shows what's inside. Two earlier versions tried to depict a rolled
  // item's spiral cross-section directly (nested ellipses forming
  // concentric rings) — both read as an odd blob/growth stuck onto a
  // capsule rather than a wrapped crepe, so simplicity won out. The mark
  // is a standing oval (taller than wide), not a circle — it's the
  // filling glimpsed edge-on at the tip from a slight side angle, which
  // reads as a narrow sliver, not a dot straight-on. Fixed real-world
  // gula-melaka brown, not derived from the seed palette — same "real
  // material" reasoning dome-coated/dome-topped use fixed white for
  // coconut, regardless of the crepe's own color.
  roll(colors) {
    return `
      <rect x="10" y="20" width="44" height="24" rx="10" fill="${colors.base}"/>
      <ellipse cx="48" cy="32" rx="3" ry="7" fill="#8B5E34"/>
    `;
  },
  // A flared, fluted shell (kueh pie tee's crispy cup) — a trapezoid wider
  // at the rim than the base, with a highlight ellipse standing in for
  // both the rim's own flute and the filling visible inside it. y-values
  // shifted up 4.5 from their first-draft ones (rim top at 15 to base
  // shadow's bottom at 58 put the visual center at ~36.5, not the
  // viewBox's true 32) — same bottom-weighted-icon bug the dome template
  // had (see its own comment), caught at the same time.
  cup(colors) {
    return `
      <path d="M14 15.5 L50 15.5 L42 49.5 L22 49.5 Z" fill="${colors.base}"/>
      <ellipse cx="32" cy="15.5" rx="18" ry="5" fill="${colors.highlight}" opacity="0.6"/>
      <path d="M22 49.5 L42 49.5 L40 53.5 L24 53.5 Z" fill="${colors.shadow}"/>
    `;
  },
  // A solid block split into exactly two horizontal bands (kueh salat/
  // talam's rice-and-custard layers: a PALER custard/coconut band over the
  // colored body) — deliberately NOT layered-bars' many thin rainbow
  // stripes, which overstates kueh that only ever show two distinct
  // layers, not a dozen.
  // Top band gets a `shadow`-colored stroke for the same reason `fluted`'s
  // outer path does now (see its own comment) — `highlight` and this
  // avatar's own background circle (check-in.js's accentForKueh) are
  // derived from the same seed.accent value at near-identical lightness,
  // so an unbounded highlight-filled band can blend straight into the
  // background it sits on.
  block(colors) {
    return `
      <rect x="12" y="14" width="40" height="38" fill="${colors.base}"/>
      <rect x="12" y="14" width="40" height="15" fill="${colors.highlight}" stroke="${colors.shadow}" stroke-width="1" stroke-opacity="0.4"/>
      <rect x="12" y="48" width="40" height="4" fill="${colors.shadow}" opacity="0.4"/>
    `;
  },
  // Same two-band idea as `block` above, but inverted — a DARKER band on
  // top over a paler body (kueh bingka's browned, caramelized crust over
  // a pale tapioca interior). `block`'s own top band is always the
  // palette's palest role (highlight), which is backwards for a kueh
  // whose top is the darkest part, not the lightest — hence a separate
  // template rather than trying to force one band arrangement to cover
  // both directions. Majority fill is `highlight` here (not `block`'s
  // `base`), so it needs the same defining stroke `fluted`'s outer path
  // does, for the same background-collision reason.
  'block-crust'(colors) {
    return `
      <rect x="12" y="14" width="40" height="38" fill="${colors.highlight}" stroke="${colors.shadow}" stroke-width="1.5" stroke-opacity="0.5"/>
      <rect x="12" y="14" width="40" height="10" fill="${colors.shadow}"/>
    `;
  },
  // A pleated flower/mold shape (kueh bahulu's ridged sponge mold) —
  // flutedSubpath's star polygon standing in for true scalloped pleats,
  // no center filling mark: bahulu is a plain baked sponge with nothing
  // visible at its center once unmolded. kueh-bahulu is this template's
  // only consumer (kueh-tutu uses `fluted-filled` instead), so unlike
  // every other template here, the main fill is a fixed hand-picked hex
  // rather than derived from the seed palette — neither `base` (L 0.62,
  // read as too dark) nor `highlight` (L 0.85, read as washed-out peach
  // AND collided with this avatar's own background circle, since both are
  // computed from the same seed.accent value — see check-in.js's
  // accentForKueh) landed on the right warm golden tone through the
  // formula, so this skips it entirely. Still needs the `stroke`, even
  // with a fixed fill: accentForKueh's own lightness is pinned to
  // REF.accentL (tokens/colors.js) regardless of hue, which lands in the
  // same pale range this fill's warm gold already sits in — hue alone
  // isn't reliably enough separation, so the shape gets a defined edge
  // the same way block/block-crust's highlight-filled areas do.
  fluted(colors) {
    const outer = flutedSubpath(32, 32, 24, 12, 0.12);
    return `
      <path d="${outer}" fill="#EDBE63" stroke="${colors.shadow}" stroke-width="1.5" stroke-opacity="0.6"/>
      <circle cx="26" cy="26" r="5" fill="${colors.highlight}" opacity="0.5"/>
    `;
  },
  // Same pleated mold as `fluted` above, plus the center filling dot kueh
  // tutu actually shows once steamed and cut — a separate template rather
  // than a param on `fluted`, matching how every other variant here is
  // its own named entry.
  'fluted-filled'(colors) {
    const outer = flutedSubpath(32, 32, 24, 12, 0.12);
    return `
      <path d="${outer}" fill="${colors.base}"/>
      <circle cx="32" cy="32" r="9" fill="${colors.shadow}" opacity="0.45"/>
      <circle cx="26" cy="26" r="5" fill="${colors.highlight}" opacity="0.5"/>
    `;
  },
  // The plain dome (above) plus a scattered cluster of small off-white
  // dots at the peak, standing in for the grated coconut kueh kosui is
  // always topped with — without it, kosui reads as an unremarkable plain
  // mound indistinguishable from kueh-ku/ondeh-ondeh's own dome. A fixed
  // near-white (not derived from the seed palette) since grated coconut
  // is genuinely white regardless of which color variant (gula melaka
  // brown, pandan green, ...) it's sitting on — same "real material, not
  // a palette token" reasoning src/atoms/wire-bundle.js's wire colors use.
  'dome-topped'(colors) {
    return `
      ${TEMPLATES.dome(colors)}
      <g fill="#FAFAF7" opacity="0.9">
        <circle cx="26" cy="16" r="2"/>
        <circle cx="32" cy="12" r="2.3"/>
        <circle cx="38" cy="15" r="1.9"/>
        <circle cx="29" cy="19" r="1.6"/>
        <circle cx="36" cy="19" r="1.7"/>
      </g>
    `;
  },
  // The plain dome (above) coated with grated coconut over its WHOLE
  // visible surface, not just a peak tuft (dome-topped) — ondeh-ondeh is
  // rolled in coconut all over, not merely finished with a scoop on top.
  // Same fixed near-white reasoning as dome-topped's own dots.
  'dome-coated'(colors) {
    return `
      ${TEMPLATES.dome(colors)}
      <g fill="#FAFAF7" opacity="0.85">
        <circle cx="20" cy="22" r="1.6"/>
        <circle cx="28" cy="18" r="1.8"/>
        <circle cx="36" cy="19" r="1.7"/>
        <circle cx="44" cy="23" r="1.5"/>
        <circle cx="16" cy="30" r="1.9"/>
        <circle cx="24" cy="33" r="1.6"/>
        <circle cx="32" cy="29" r="2.0"/>
        <circle cx="40" cy="32" r="1.7"/>
        <circle cx="48" cy="29" r="1.5"/>
        <circle cx="20" cy="40" r="1.8"/>
        <circle cx="30" cy="41" r="1.6"/>
        <circle cx="40" cy="40" r="1.7"/>
      </g>
    `;
  },
};

/**
 * @param {{id: string}} kueh
 * @param {'dome'|'dome-topped'|'dome-coated'|'layered-bars'|'pyramid'|'folded'|'disc'|'roll'|'cup'|'block'|'block-crust'|'fluted'|'fluted-filled'} template
 * @param {number} size - rendered width/height in px
 * @returns {string} standalone <svg> markup
 */
export function renderKuehSvg(kueh, template, size = 48) {
  const seed = KUEH_SEED_TABLE[kueh.id];
  const colors = colorsForSeed(seed);
  const build = TEMPLATES[template] || TEMPLATES.disc;
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${kueh.name || ''}">${build(colors)}</svg>`;
}

/**
 * The same --color-accent a kueh gets when it's "today"'s kueh (kueh-of-
 * day.js's applyPalette, driven by generatePalette in tokens/colors.js),
 * computed standalone for one specific kueh rather than applied globally
 * to :root — for a consumer showing several different kueh's colors at
 * once instead of one page-wide "today" palette (the Check In section's
 * per-contributor avatars, src/organisms/check-in.js), so each icon's own
 * badge background matches the same accent its icon/photo would use on
 * its actual day.
 */
export function accentForKueh(kueh) {
  return accentHexForSeed(KUEH_SEED_TABLE[kueh.id]);
}

// Every kueh's own `base`/`shadow` (the two colors colorsForSeed derives
// straight from each kueh's actual food-body hue, not the paler accent/
// highlight tints) collected into one flat palette — for a consumer that
// wants "the site's kueh colors" as a pool to draw from rather than any
// one kueh's own avatar (src/atoms/wire-bundle.js's WIRE_COLORS: the
// wires behind the Check In section's windows/margins are meant to read
// as the same family of colors as the avatars sitting in front of them,
// not an unrelated literal electrical-cable palette). base/shadow only,
// not accent/highlight — those run pale/cream and would wash out as thin
// strands against the section's own dark background.
export function kuehWireColors() {
  const colors = [];
  for (const seed of Object.values(KUEH_SEED_TABLE)) {
    if (seed.mode === 'signature') {
      colors.push(DEFAULT_THEME.colorPrimaryStrong, DEFAULT_THEME.colorHighlight);
      continue;
    }
    const { base, shadow } = colorsForSeed(seed);
    colors.push(base, shadow);
  }
  return colors;
}
