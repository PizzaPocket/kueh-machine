// Color engine: generates the site's full semantic palette from three
// authored hues per kueh (primary/accent/highlight — see KUEH_SEED_TABLE),
// reproducing the *lightness/chroma structure* of DEFAULT_THEME's own
// original forest-green ramp (REF below, measured in OKLCH once, kept as a
// fixed structural template since) at each kueh's own authored hue.
// DEFAULT_THEME's actual hex values have since been swapped to a different
// palette (see its own comment) — REF no longer needs to literally match
// them, since it was always a hue-independent ramp shape, not a live
// derivation.
//
// Earlier version derived accent/highlight from the primary hue via a fixed
// rotation (the actual offset between pandan/egg-yellow/rose-pink). That
// produced mechanically "systematic" results but visually wrong ones — a
// warm brown kueh like lapis legit rotated into pink and blue tones that
// don't exist in the real food. Hue choice now comes from what's actually
// authored per kueh (see kueh.js); only the L/C *shape* of each tier — how
// light, how saturated, relative to its role — stays formulaic.

// The literal palette used on kueh-lapis's own day — the multicolor
// "signature" kueh already *is* this site's palette, so there's nothing to
// generate for it. Originally a forest-green ramp (the site's very first
// hand-authored palette, before the per-kueh seed system existed); updated
// to the pink/lime-green/cream stripe pattern most commonly associated
// with kueh lapis, since the original green+gold combination didn't
// actually match any real version of the kueh (checked directly against
// reference photos). REF below keeps the original palette's L/C *shape* —
// that's a hue-independent ramp template applied to every OTHER kueh's own
// authored hue, not something that needs to change just because this one
// palette's specific hues did.
export const DEFAULT_THEME = {
  colorPrimaryStrong: '#B72E68',
  colorPrimary:        '#E8629A',
  colorPrimarySoft:    '#F8BFD9',
  colorAccent:          '#F7D774',
  colorSurface:          '#FFF8F0',
  colorSurfaceTint:      '#F0E8DA',
  colorSurfaceBorder:    '#D6C8B4',
  colorHighlight:         '#8FCB5E',
  colorHighlightSoft:     '#DCF0BE',
  colorTextOnSurface:        '#5C1638',
  colorTextOnSurfaceMuted:   '#8C4569',
  colorTextOnPrimary:        '#FBE0EC',
  colorTextOnPrimaryMuted:   '#EDB7CE',
};

// Reference shape of the ramp, measured in OKLCH from DEFAULT_THEME.
// (primary chroma ~0.08 across all three ramp steps — it barely tapers in
// the original, so treated as constant here.) Each tier's L (and, for text
// tokens, C-ratio relative to primary chroma) stays fixed regardless of
// hue — only hue and each tier's own chroma now come from the authored
// seed, not a rotation formula.
const REF = {
  primaryStrongL: 0.4758,
  primaryMidDeltaL: 0.1783,   // primary.L - primaryStrong.L
  primarySoftDeltaL: 0.3443,  // primarySoft.L - primaryStrong.L

  accentL: 0.8528,

  highlightL: 0.7696,
  highlightSoftL: 0.9119,
  highlightSoftCRatio: 0.0371 / 0.1135, // highlightSoft.C relative to highlight.C

  // Surface family sits near the accent hue, not the primary hue.
  surfaceL: 0.9824, surfaceC: 0.013,
  surfaceTintL: 0.9335, surfaceTintC: 0.0206,
  surfaceBorderL: 0.8389, surfaceBorderC: 0.0314,

  // Text tokens are hue-locked to the primary family, at extreme L values,
  // chroma scaled relative to primary's own chroma.
  textOnSurfaceL: 0.3225, textOnSurfaceCRatio: 0.0624 / 0.08,
  textOnSurfaceMutedL: 0.5398, textOnSurfaceMutedCRatio: 0.0617 / 0.08,
  textOnPrimaryL: 0.9136, textOnPrimaryCRatio: 0.0244 / 0.08,
  textOnPrimaryMutedL: 0.8038, textOnPrimaryMutedCRatio: 0.0567 / 0.08,
};

function normalizeHue(h) {
  return ((h % 360) + 360) % 360;
}

// --- OKLCH <-> sRGB hex --------------------------------------------------
// Björn Ottosson's published OKLab matrices. No external dependency.

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c) {
  c = Math.min(1, Math.max(0, c));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

export function oklchToHex(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const lc = l_ ** 3;
  const mc = m_ ** 3;
  const sc = s_ ** 3;

  const rLin = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const gLin = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bLin = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc;

  const r = Math.round(linearToSrgb(rLin) * 255);
  const g = Math.round(linearToSrgb(gLin) * 255);
  const bOut = Math.round(linearToSrgb(bLin) * 255);

  return (
    '#' +
    [r, g, bOut]
      .map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0'))
      .join('')
  );
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Nudges a candidate OKLCH color's lightness, away from the background(s),
// until it clears targetRatio against every background passed in. Returns
// a hex string. Caps at 20 steps; warns (does not throw) if it can't clear
// the target, since a seed at the very edge of gamut can make 4.5 physically
// unreachable at a fixed hue/chroma.
function resolveTextToken(candidate, backgroundHexes, targetRatio = 4.5) {
  const backgrounds = Array.isArray(backgroundHexes) ? backgroundHexes : [backgroundHexes];
  const bgLum = Math.max(...backgrounds.map(relativeLuminance));
  const dir = bgLum > 0.5 ? -1 : 1; // darken text on light bg, lighten on dark bg

  let l = candidate.l;
  let hex = oklchToHex(l, candidate.c, candidate.h);
  let worstRatio = Math.min(...backgrounds.map((bg) => contrastRatio(hex, bg)));

  let guard = 0;
  while (worstRatio < targetRatio && guard < 20) {
    l = Math.min(0.98, Math.max(0.02, l + dir * 0.03));
    hex = oklchToHex(l, candidate.c, candidate.h);
    worstRatio = Math.min(...backgrounds.map((bg) => contrastRatio(hex, bg)));
    guard++;
  }

  if (worstRatio < targetRatio) {
    console.warn(
      `[colors] could not reach ${targetRatio}:1 contrast for hue ${candidate.h.toFixed(1)} ` +
        `(best achieved ${worstRatio.toFixed(2)}:1)`
    );
  }

  return hex;
}

// Builds the full token set from three authored hues. `seed.primary` drives
// the main ramp and (hue-locked) text tokens; `seed.accent` drives the
// accent + surface/cream family; `seed.highlight` drives the tertiary
// accent. `mode` is carried by the seed table entry, not consumed here —
// 'signature' short-circuits to DEFAULT_THEME before generatePalette is
// ever called (see kueh-of-day organism), so this function only ever sees
// 'chromatic'/'neutral' seeds, which use the exact same formula.
export function generatePalette(seed) {
  const primaryH = normalizeHue(seed.primary.h);
  const c = seed.primary.c;

  const primaryStrong = { l: REF.primaryStrongL, c, h: primaryH };
  const primary = { l: REF.primaryStrongL + REF.primaryMidDeltaL, c, h: primaryH };
  const primarySoft = { l: REF.primaryStrongL + REF.primarySoftDeltaL, c, h: primaryH };

  const accentH = normalizeHue(seed.accent.h);
  const accent = { l: REF.accentL, c: seed.accent.c, h: accentH };

  const highlightH = normalizeHue(seed.highlight.h);
  const highlight = { l: REF.highlightL, c: seed.highlight.c, h: highlightH };
  const highlightSoft = {
    l: REF.highlightSoftL,
    c: seed.highlight.c * REF.highlightSoftCRatio,
    h: highlightH,
  };

  const surface = { l: REF.surfaceL, c: REF.surfaceC, h: accentH };
  const surfaceTint = { l: REF.surfaceTintL, c: REF.surfaceTintC, h: accentH };
  const surfaceBorder = { l: REF.surfaceBorderL, c: REF.surfaceBorderC, h: accentH };

  const surfaceHex = oklchToHex(surface.l, surface.c, surface.h);
  const surfaceTintHex = oklchToHex(surfaceTint.l, surfaceTint.c, surfaceTint.h);
  const primaryStrongHex = oklchToHex(primaryStrong.l, primaryStrong.c, primaryStrong.h);

  const textOnSurface = resolveTextToken(
    { l: REF.textOnSurfaceL, c: c * REF.textOnSurfaceCRatio, h: primaryH },
    [surfaceHex, surfaceTintHex]
  );
  const textOnSurfaceMuted = resolveTextToken(
    { l: REF.textOnSurfaceMutedL, c: c * REF.textOnSurfaceMutedCRatio, h: primaryH },
    [surfaceHex, surfaceTintHex]
  );
  const textOnPrimary = resolveTextToken(
    { l: REF.textOnPrimaryL, c: c * REF.textOnPrimaryCRatio, h: primaryH },
    primaryStrongHex
  );
  const textOnPrimaryMuted = resolveTextToken(
    { l: REF.textOnPrimaryMutedL, c: c * REF.textOnPrimaryMutedCRatio, h: primaryH },
    primaryStrongHex
  );

  return {
    colorPrimaryStrong: primaryStrongHex,
    colorPrimary: oklchToHex(primary.l, primary.c, primary.h),
    colorPrimarySoft: oklchToHex(primarySoft.l, primarySoft.c, primarySoft.h),
    colorAccent: oklchToHex(accent.l, accent.c, accent.h),
    colorSurface: surfaceHex,
    colorSurfaceTint: surfaceTintHex,
    colorSurfaceBorder: oklchToHex(surfaceBorder.l, surfaceBorder.c, surfaceBorder.h),
    colorHighlight: oklchToHex(highlight.l, highlight.c, highlight.h),
    colorHighlightSoft: oklchToHex(highlightSoft.l, highlightSoft.c, highlightSoft.h),
    colorTextOnSurface: textOnSurface,
    colorTextOnSurfaceMuted: textOnSurfaceMuted,
    colorTextOnPrimary: textOnPrimary,
    colorTextOnPrimaryMuted: textOnPrimaryMuted,
  };
}

// The --color-accent slice of generatePalette, standalone — for a caller
// that wants one specific kueh's own accent color without generating (or
// applying to :root) that kueh's entire palette. kueh-of-day.js's own
// applyPalette is inherently global/single-kueh-at-a-time (it writes
// :root custom properties for whichever kueh is "today"), which doesn't
// fit a consumer showing several different kueh's colors at once — the
// Check In section's per-contributor avatars (src/organisms/check-in.js),
// each cycling through a different kueh via src/atoms/kueh-icon.js's
// accentForKueh. Same signature/chromatic split generatePalette itself
// relies on (see that function's own comment).
export function accentHexForSeed(seed) {
  if (!seed || seed.mode === 'signature') return DEFAULT_THEME.colorAccent;
  return oklchToHex(REF.accentL, seed.accent.c, normalizeHue(seed.accent.h));
}

// Maps camelCase palette keys to their --kebab-case CSS custom property names.
const CSS_VAR_NAMES = {
  colorPrimaryStrong: '--color-primary-strong',
  colorPrimary: '--color-primary',
  colorPrimarySoft: '--color-primary-soft',
  colorAccent: '--color-accent',
  colorSurface: '--color-surface',
  colorSurfaceTint: '--color-surface-tint',
  colorSurfaceBorder: '--color-surface-border',
  colorHighlight: '--color-highlight',
  colorHighlightSoft: '--color-highlight-soft',
  colorTextOnSurface: '--color-text-on-surface',
  colorTextOnSurfaceMuted: '--color-text-on-surface-muted',
  colorTextOnPrimary: '--color-text-on-primary',
  colorTextOnPrimaryMuted: '--color-text-on-primary-muted',
};

export function applyPalette(palette) {
  const root = document.documentElement.style;
  for (const [key, cssVar] of Object.entries(CSS_VAR_NAMES)) {
    if (palette[key]) root.setProperty(cssVar, palette[key]);
  }
}
