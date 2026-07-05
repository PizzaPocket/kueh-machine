// Atom: batik motifs (leaf pair / bell / petal / paisley) sprouting off a
// point along a tendril chain — the *same* system the decorative vine/
// bloom/paisley variants use to hang things off their own tendrils
// (src/tokens/batik-motifs.js), just anchored to an arbitrary segment's
// own lerp point instead of a randomly-scattered one. Shared by
// src/organisms/timeline-panel.js (the string) and
// src/organisms/drop-chute.js (the chute) — extracted rather than
// duplicated, since both want the exact same flourish look.
//
// Shape geometry (d/midribD/extraD/cecek dot positions, all in local
// space) is computed once, in buildFlourish, and never again — only the
// world-space anchor point (a plain lerp along the segment) is recomputed
// on every redraw, which is why this doesn't jitter/reshape itself every
// animation frame the way calling leafPath/bellPath/etc. fresh inside a
// render loop would (both call Math.random() internally on every
// invocation).

import { leafPath, bellPath, petalPath, paisleyPath, cecekPoints, toWorld } from '../tokens/batik-motifs.js';
import { renderLeaf, renderPetal, renderCecekLayer } from './batik-pattern.js';

export function jitterDeg(range) {
  return (Math.random() * 2 - 1) * range;
}

/**
 * `t` (0-1, how far along whatever segment this attaches to) defaults to
 * a random mid-segment spot — pass an explicit `t` to place it elsewhere
 * (e.g. a chute scattering several across its own much longer chain).
 */
export function buildFlourish(t = 0.15 + Math.random() * 0.7) {
  const kind = ['leaf-pair', 'bell', 'petal', 'paisley'][Math.floor(Math.random() * 4)];

  if (kind === 'leaf-pair') {
    const length = 20 + Math.random() * 10;
    const width = length * 0.4;
    const leaves = [1, -1].map((side) => {
      const { d, midribD } = leafPath(length, width);
      return { d, midribD, angle: 90 * side + jitterDeg(15) };
    });
    return { kind, t, leaves };
  }

  const builders = { bell: bellPath, petal: petalPath, paisley: paisleyPath };
  const lengths = { bell: [22, 8], petal: [26, 10], paisley: [34, 14] };
  const widthRatios = { bell: 0.85, petal: 0.45, paisley: 0.55 };
  const dotSpacingRatios = { bell: 0.24, petal: 0.22, paisley: 0.2 };
  const [base, spread] = lengths[kind];
  const length = base + Math.random() * spread;
  const width = length * widthRatios[kind];
  const { d, segments, extraD } = builders[kind](length, width);
  const dots = cecekPoints(segments, 0.88, length * dotSpacingRatios[kind]);
  const angle = kind === 'bell' ? jitterDeg(35) : Math.random() * 360;
  return { kind, t, d, extraD, dots, angle, petalIndex: Math.floor(Math.random() * 3) };
}

export function renderFlourish(from, to, flourish, cecekFill) {
  if (!flourish) return '';
  const x = from[0] + (to[0] - from[0]) * flourish.t;
  const y = from[1] + (to[1] - from[1]) * flourish.t;

  if (flourish.kind === 'leaf-pair') {
    return flourish.leaves
      .map((leaf) => renderLeaf({ clusterIndex: 0, x, y, angle: leaf.angle, d: leaf.d, midribD: leaf.midribD }))
      .join('');
  }

  const dotsWorld = flourish.dots
    .map(([lx, ly]) => toWorld([lx, ly], x, y, flourish.angle))
    .map(([wx, wy]) => ({ x: wx, y: wy }));
  return (
    renderPetal({ clusterIndex: 0, x, y, angle: flourish.angle, d: flourish.d, extraD: flourish.extraD, petalIndexInCluster: flourish.petalIndex }) +
    renderCecekLayer(dotsWorld, cecekFill)
  );
}
