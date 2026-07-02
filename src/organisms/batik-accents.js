// Organism: wires up every .batik-mount element on the page — the two
// margin strips flanking the "brief" section, plus the full-bleed layer
// behind the "guide" section's step-cards — the same "decorative elements
// not owned by any single feature organism" role src/organisms/chrome-accents.js
// plays for the chrome treatment. Each mount gets its own one-shot
// IntersectionObserver entry: the first time it scrolls into view, it
// draws in a fresh arrangement and stops watching.
//
// Per-mount size/surface is read from data attributes so different
// placements (a full-bleed panel vs. a tall narrow margin strip, a white
// section vs. a colored one) don't need separate JS — see
// src/atoms/batik-pattern.js's renderBatikPattern for what each option
// does. Mounts that share a data-batik-group get the same randomly-picked
// motif variant rather than each rolling its own — the two brief-section
// margins should read as one composition split across two strips, not two
// unrelated patterns that happen to land in the same section.

import { revealBatikPattern } from '../atoms/batik-pattern.js';

const VARIANTS = ['bloom', 'vine', 'paisley'];

function pickVariant() {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
}

function readOptions(mount) {
  const options = {};
  if (mount.dataset.batikWidth) options.width = Number(mount.dataset.batikWidth);
  if (mount.dataset.batikHeight) options.height = Number(mount.dataset.batikHeight);
  if (mount.dataset.batikClusters) options.clusterCount = Number(mount.dataset.batikClusters);
  if (mount.dataset.batikScale) options.sizeScale = Number(mount.dataset.batikScale);
  if (mount.dataset.batikSurface) options.surface = mount.dataset.batikSurface;
  if (mount.dataset.batikVariant) options.variant = mount.dataset.batikVariant;
  return options;
}

export function init() {
  const mounts = document.querySelectorAll('.batik-mount');
  if (!mounts.length || !('IntersectionObserver' in window)) return;

  const groupVariants = new Map();
  function variantFor(mount) {
    const group = mount.dataset.batikGroup;
    if (!group) return pickVariant();
    if (!groupVariants.has(group)) groupVariants.set(group, pickVariant());
    return groupVariants.get(group);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const options = readOptions(entry.target);
          if (!options.variant) options.variant = variantFor(entry.target);
          revealBatikPattern(entry.target, options);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  mounts.forEach((mount) => observer.observe(mount));
}
