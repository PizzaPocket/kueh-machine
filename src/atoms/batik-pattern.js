// Renders the procedural batik motif field (src/tokens/batik-motifs.js)
// into SVG markup, and owns the draw-in reveal animation for it — same
// split chrome-metal.js uses between its pure gradient-string builders and
// its DOM-effect functions (registerForRotation, applyLayeredConicChrome),
// kept together here rather than in a separate organism since the
// animation is intrinsic to how this atom renders, not page-specific
// wiring.
//
// Colors are never resolved here: every fill/stroke is a var(--color-*)
// reference, so the pattern always matches whatever palette
// src/organisms/kueh-of-day.js has already applied to :root. No seed, no
// generatePalette() call, no coupling to kueh data at all.
//
// PETAL_FILLS deliberately avoids --color-primary-soft and --color-surface*
// — both already do double duty as section background colors elsewhere on
// the page (leveling-up-section, guide-section), and a petal filled the
// same color as the surface it sits on renders as an invisible (outline-
// only) hole in the flower. That same collision hits cecek: the
// traditional dot color is light/white, which works fine on a colored
// (e.g. --color-primary-soft) background but is literally --color-surface
// itself on guide-section's plain white one — a dot the same color as
// what it's drawn on doesn't render as a dot, it renders as a gap. Cecek
// dots aren't always drawn over a colored petal fill (the vine variant's
// stem-tracing dots and scattered berries sit directly on the section
// background), so this can't be fixed by contrast against the petal alone
// — the caller has to say what family of surface the mount sits on, via
// the `surface` option (see renderBatikPattern).
//
// The same trap hit the OUTLINE/TENDRIL stroke: both used to be a single
// hardcoded --color-accent constant, which reads fine against every
// surface this file's authors had tried (leveling-up-section's pink,
// guide-section's cream) but goes fully invisible — not just a missing
// outline, the *entire* fill:none tendril line — the moment a caller's
// section background is --color-accent itself (brief-section, after
// brief-section and leveling-up-section swapped background colors).
// Fixed the same way as the cecek collision: STROKE_BY_SURFACE below
// resolves per `surface` instead of a bare constant, so adding a new
// full-bleed background color to the page (or reassigning an existing
// one to a different section) means adding/moving a matching surface
// entry here, not discovering an invisible motif after the fact.

import { buildBatikComposition } from '../tokens/batik-motifs.js';

const CECEK_FILL_BY_SURFACE = {
  tinted: 'var(--color-surface)', // light dot, for colored/saturated section backgrounds
  plain: 'var(--color-primary-strong)', // dark dot, for white/cream (--color-surface family) backgrounds
  accent: 'var(--color-surface)', // light dot, same family as tinted — --color-accent is saturated enough for it to read
};

const STROKE_BY_SURFACE = {
  tinted: 'var(--color-accent)',
  plain: 'var(--color-accent)',
  accent: 'var(--color-primary-strong)', // --color-accent itself would be invisible against an --color-accent background
};

const PETAL_FILLS = ['var(--color-primary)', 'var(--color-highlight-soft)', 'var(--color-highlight)'];
const LEAF_FILL = 'var(--color-primary-strong)';
// Defaults for renderPetal/renderLeaf/renderTendril's own `stroke` param
// below — used as-is by every caller outside this file (batik-flourish.js,
// batik-segment.js, timeline-panel.js, drop-chute.js), none of which sit on
// an --color-accent background. renderBatikPattern is the only caller that
// resolves a different, surface-aware stroke (STROKE_BY_SURFACE above) and
// passes it through explicitly.
const OUTLINE_STROKE = 'var(--color-accent)';
export const TENDRIL_STROKE = 'var(--color-accent)';
const DOT_RADIUS = 2;

// dot.radius/dot.fill let a variant override the default cecek stitch
// styling per-item — the vine variant's scattered berries are larger and
// always use accent fills regardless of surface, but still ride the same
// rendering/animation path as an ordinary dot. `defaultFill` is the
// surface-resolved cecek color, used whenever an item doesn't override it.
export function renderCecekLayer(dots, defaultFill) {
  return dots
    .map((dot) => {
      const r = dot.radius ?? DOT_RADIUS;
      const fill = dot.fill ?? defaultFill;
      return `<circle class="batik-cecek" data-cluster="${dot.clusterIndex}" cx="${dot.x.toFixed(1)}" cy="${dot.y.toFixed(1)}" r="${r}" fill="${fill}"/>`;
    })
    .join('');
}

// extraD is an optional secondary thin-stroke detail — a bell's dangling
// stamens, a paisley's curled tail — rendered/animated the same way a
// leaf's midrib already was; unified under one .batik-detail class rather
// than keeping that a leaf-only concept.
export function renderPetal(petal, stroke = OUTLINE_STROKE) {
  const fill = PETAL_FILLS[petal.petalIndexInCluster % PETAL_FILLS.length];
  const extra = petal.extraD
    ? `<path class="batik-detail" d="${petal.extraD}" fill="none" stroke="${stroke}" stroke-width="1" opacity="0.5"/>`
    : '';
  return `<g class="batik-motif" data-cluster="${petal.clusterIndex}" transform="translate(${petal.x.toFixed(1)},${petal.y.toFixed(1)}) rotate(${petal.angle.toFixed(1)})">
    <path class="batik-outline" d="${petal.d}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    ${extra}
  </g>`;
}

export function renderLeaf(leaf, stroke = OUTLINE_STROKE) {
  return `<g class="batik-motif" data-cluster="${leaf.clusterIndex}" transform="translate(${leaf.x.toFixed(1)},${leaf.y.toFixed(1)}) rotate(${leaf.angle.toFixed(1)})">
    <path class="batik-outline" d="${leaf.d}" fill="${LEAF_FILL}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    <path class="batik-detail" d="${leaf.midribD}" fill="none" stroke="${stroke}" stroke-width="1" opacity="0.5"/>
  </g>`;
}

export function renderTendril(tendril, stroke = TENDRIL_STROKE) {
  return `<path class="batik-tendril" d="${tendril.d}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`;
}

/**
 * Builds one fresh batik pattern and returns it as standalone <svg>
 * markup. viewBox is fixed regardless of final render size (same
 * "logical units, scaled by CSS" convention kueh-icon.js uses) — the
 * consumer is expected to size it via CSS (see styles/organisms/batik-showcase.css).
 * preserveAspectRatio="xMidYMid slice" means a consumer that sets both
 * width and height (rather than width + height:auto) gets crop-to-fill
 * behavior instead of letterboxing when its box doesn't match width/height's
 * own ratio — the full-bleed showcase panel relies on this.
 *
 * width/height default to a 400x400 square; pass a wide short rectangle
 * for a full-bleed panel or a tall narrow one for a margin strip (plus a
 * smaller sizeScale) — see buildBatikComposition for what each option does.
 * `variant` forces a specific motif grammar ('bloom'/'vine'/'paisley')
 * instead of the random pick buildBatikComposition defaults to — the two
 * margin mounts flanking brief-section pass the same explicit variant so
 * they read as one composition split across two strips, not two unrelated
 * patterns that happen to sit in the same section (see batik-accents.js).
 * `surface` picks BOTH the cecek dot color family and the outline/tendril
 * stroke: 'tinted' (default, light dot + accent stroke) for a colored
 * section background, 'plain' (dark dot + accent stroke) for a white/cream
 * one, 'accent' (light dot + primary-strong stroke) for an --color-accent
 * background itself — see CECEK_FILL_BY_SURFACE/STROKE_BY_SURFACE above
 * for why this can't be figured out from the palette alone, and why a new
 * full-bleed background color needs a matching entry in both maps rather
 * than assuming the existing accent stroke will just show up on it.
 */
function renderBatikPattern({
  clusterCount = 6,
  width = 400,
  height = 400,
  sizeScale = 1,
  variant,
  surface = 'tinted',
} = {}) {
  const composition = buildBatikComposition({ clusterCount, width, height, sizeScale, variant });
  const cecekFill = CECEK_FILL_BY_SURFACE[surface] ?? CECEK_FILL_BY_SURFACE.tinted;
  const stroke = STROKE_BY_SURFACE[surface] ?? STROKE_BY_SURFACE.tinted;

  const tendrils = composition.tendrils.map((tendril) => renderTendril(tendril, stroke)).join('');
  const leaves = composition.leaves.map((leaf) => renderLeaf(leaf, stroke)).join('');
  const petals = composition.petals.map((petal) => renderPetal(petal, stroke)).join('');
  const dots = renderCecekLayer(composition.dots, cecekFill);

  return `<svg class="batik-pattern" width="${composition.width}" height="${composition.height}" viewBox="0 0 ${composition.width} ${composition.height}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
    <g class="batik-layer-tendrils">${tendrils}</g>
    <g class="batik-layer-leaves">${leaves}</g>
    <g class="batik-layer-petals">${petals}</g>
    <g class="batik-layer-dots">${dots}</g>
  </svg>`;
}

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

function animateDraw(path, delay, duration) {
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;
  path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
    duration,
    delay,
    easing: 'ease-out',
    fill: 'forwards',
  });
}

function animateMotif(group, delay, duration) {
  const outline = group.querySelector('.batik-outline');
  if (!outline) return;
  animateDraw(outline, delay, duration);
  outline.style.fillOpacity = '0';
  outline.animate([{ fillOpacity: 0 }, { fillOpacity: 1 }], {
    duration: duration * 0.5,
    delay: delay + duration * 0.5,
    easing: 'ease-in',
    fill: 'forwards',
  });

  const detail = group.querySelector('.batik-detail');
  if (detail) {
    detail.style.opacity = '0';
    detail.animate([{ opacity: 0 }, { opacity: 0.5 }], {
      duration: 300,
      delay: delay + duration * 0.4,
      easing: 'ease-in',
      fill: 'forwards',
    });
  }
}

function animateDot(dot, delay) {
  dot.style.transformBox = 'fill-box';
  dot.style.transformOrigin = 'center';
  dot.style.opacity = '0';
  dot.animate([{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1)' }], {
    duration: 150,
    delay,
    easing: 'ease-out',
    fill: 'forwards',
  });
}

/**
 * Renders a fresh batik pattern into `mountEl` and, unless the visitor
 * prefers reduced motion, plays a one-time "drawn in real time" reveal:
 * tendrils draw first (vines growing), then each cluster's leaves/petals
 * draw their outline and bloom into fill, then cecek dots stitch in last —
 * matching the pattern's own paint order (tendrils -> leaves -> petals ->
 * dots), so the animation just reveals what's already stacked correctly
 * rather than needing a separate z-order pass.
 */
export function revealBatikPattern(mountEl, options = {}) {
  if (!mountEl) return;
  mountEl.innerHTML = renderBatikPattern(options);

  if (prefersReducedMotion) return;

  const svg = mountEl.querySelector('.batik-pattern');
  if (!svg) return;

  const tendrils = Array.from(svg.querySelectorAll('.batik-tendril'));
  const motifs = Array.from(svg.querySelectorAll('.batik-motif'));
  const dots = Array.from(svg.querySelectorAll('.batik-cecek'));
  const clusterIds = [...new Set(motifs.map((g) => g.dataset.cluster))];

  // Per-item stagger is capped so it scales down as density goes up — a
  // handful of clusters gets the full 80ms/200ms spacing (unchanged from
  // before), but a much denser pattern still finishes revealing itself in
  // roughly the same total time instead of dragging out linearly with
  // element count.
  const tendrilStagger = tendrils.length > 1 ? Math.min(80, 700 / (tendrils.length - 1)) : 80;
  const tendrilDuration = 500;
  tendrils.forEach((path, i) => animateDraw(path, i * tendrilStagger, tendrilDuration));
  const afterTendrils = tendrils.length ? (tendrils.length - 1) * tendrilStagger + tendrilDuration : 0;

  // Grouped by cluster, not by individual petal: staggering every single
  // petal/leaf across a several-cluster pattern would drag the reveal out
  // well past a reasonable length. Instead a whole cluster blooms together
  // (small intra-cluster stagger for texture), one cluster after another.
  const clusterStagger = clusterIds.length > 1 ? Math.min(200, 2200 / (clusterIds.length - 1)) : 200;
  const motifIntraStagger = 30;
  const motifDuration = 600;
  const dotIntraStagger = 10;

  clusterIds.forEach((clusterId, ci) => {
    const clusterStart = afterTendrils + ci * clusterStagger;

    motifs
      .filter((g) => g.dataset.cluster === clusterId)
      .forEach((group, i) => animateMotif(group, clusterStart + i * motifIntraStagger, motifDuration));

    const dotsStart = clusterStart + motifDuration * 0.7;
    dots
      .filter((d) => d.dataset.cluster === clusterId)
      .forEach((dot, i) => animateDot(dot, dotsStart + i * dotIntraStagger));
  });
}
