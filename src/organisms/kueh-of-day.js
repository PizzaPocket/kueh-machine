// Organism: picks today's kueh, applies its daily palette, and renders the
// two-column media/content card into the static #kueh-of-day section
// already present in index.html.

import { generatePalette, applyPalette, DEFAULT_THEME } from '../tokens/colors.js';
import { applyLayeredConicChrome } from '../tokens/chrome-metal.js';
import { buildSuperellipsePath, solveClearingExponent } from '../tokens/superellipse.js';
import { KUEH_DATA, KUEH_SEED_TABLE, KUEH_SHAPE_TABLE } from '../data/kueh.js';
import { renderKuehSvg } from '../atoms/kueh-icon.js';
import { createTabGroup } from '../molecules/tab-group.js';

// Rotation is anchored to a fixed start date rather than Jan 1, so day 0
// lands on today (when this shipped) — and KUEH_DATA lists the 7
// photographed kueh first, so the first week of real-world days cycles
// through actual photos before reaching the SVG-fallback kueh. Once more
// photos are added, just update KUEH_DATA's `photo` field; no need to
// touch this anchor.
const ROTATION_ANCHOR_UTC = Date.UTC(2026, 6, 2); // 2026-07-02 = day 0

// Guards against piling up duplicate observers if renderKuehOfDay() is
// ever called more than once per page load — it isn't today (init() runs
// exactly once), but the disconnect-before-recreate is cheap insurance.
let mediaResizeObserver = null;

// Gap between the window shape and .kod-media's own box edge, so the
// retro window floats inside the card with the card's own surface color
// showing around it, rather than the shape's bounding box pressing flush
// against the card edge (which read as too much visual tension in situ).
const MEDIA_WINDOW_GUTTER = 16;

// Same filled <path> `d` drives both the visible clip boundary and the
// inner-shadow layer beneath the media content — see buildMedia() below —
// so they always match exactly. clipPathUnits="userSpaceOnUse" (not the
// default objectBoundingBox) is what makes this react correctly to
// non-square boxes: objectBoundingBox normalizes to a 0-1 unit square,
// which reintroduces exactly the non-uniform-stretch corner distortion a
// superellipse's independent a/b axes were meant to avoid.
function updateMediaClip(mediaEl, clipPathEl, shadowPathEl) {
  const boxWidth = mediaEl.clientWidth;
  const boxHeight = mediaEl.clientHeight;
  if (!boxWidth || !boxHeight) return;

  const gutter = Math.min(MEDIA_WINDOW_GUTTER, boxWidth / 4, boxHeight / 4);
  const width = boxWidth - gutter * 2;
  const height = boxHeight - gutter * 2;

  // Clearance the corner curve needs to stay clear of is measured from the
  // (smaller, inset) shape's own edge, not .kod-media's own edge — the
  // gutter already buys back some of the padding's job, so what's left to
  // solve for is only however much padding exceeds the gutter.
  const style = getComputedStyle(mediaEl);
  const marginX = Math.max(Math.min(parseFloat(style.paddingLeft), parseFloat(style.paddingRight)) - gutter, 0);
  const marginY = Math.max(Math.min(parseFloat(style.paddingTop), parseFloat(style.paddingBottom)) - gutter, 0);
  const n = solveClearingExponent({ width, height, marginX, marginY });
  const d = buildSuperellipsePath({ width, height, n, originX: gutter + width / 2, originY: gutter + height / 2 });

  clipPathEl.setAttribute('d', d);
  shadowPathEl.setAttribute('d', d);
}

// Same SGT day math _tlData already uses in index.html's inline script,
// recomputed independently here rather than shared across the classic
// script / ES module boundary for one small calculation.
function getDayIndexSGT(length) {
  const sgOffsetMs = 8 * 60 * 60 * 1000;
  const nowSGT = new Date(Date.now() + sgOffsetMs);
  const todayUTC = Date.UTC(nowSGT.getUTCFullYear(), nowSGT.getUTCMonth(), nowSGT.getUTCDate());
  const daysSinceAnchor = Math.floor((todayUTC - ROTATION_ANCHOR_UTC) / 86400000);
  return ((daysSinceAnchor % length) + length) % length;
}

// Retro-window silhouette (src/tokens/superellipse.js) behind the media
// content: a filled <path clip-path> pair (same `d`, kept in sync by
// updateMediaClip) — one clips .kod-media itself to the shape, the other
// is a real filled shape carrying an inner-shadow SVG filter, kept behind
// the tag/heading/image via z-index (see .kod-media-shadow, kueh-of-day.css)
// — position:absolute takes it out of normal flow and into its own
// stacking step, so DOM order alone wouldn't keep it under the static
// siblings that follow it. CSS `box-shadow: inset` can't do the shadow
// itself: it follows the element's rectangular border-box, not this
// clip-path outline, so it would shadow the wrong edge everywhere the
// superellipse pulls in from the corners. Blur values are carried over
// from .hero-title's own two-layer drop-shadow (index.html) — a wide soft
// pass plus a tighter crisp pass — translated from CSS blur radius to the
// roughly-half-sized feGaussianBlur stdDeviation equivalent.
function buildMediaShapeSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'kod-media-shadow');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <defs>
      <clipPath id="kod-media-clip" clipPathUnits="userSpaceOnUse">
        <path d=""/>
      </clipPath>
      <filter id="kod-media-inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <!-- Inverting the shape's own alpha (opaque interior -> 0, transparent
             exterior -> 1) before blurring is what makes the blur spread
             *inward* from the boundary into a ring, rather than just
             softening a uniformly-tinted copy of the whole shape (which is
             what compositing straight against SourceAlpha gives you — a flat
             tint over the entire fill, not a ring hugging the edge). -->
        <feComponentTransfer in="SourceAlpha" result="inverted-alpha">
          <feFuncA type="table" tableValues="1 0"/>
        </feComponentTransfer>

        <feGaussianBlur in="inverted-alpha" stdDeviation="14" result="blur-wide"/>
        <feFlood flood-color="#000" flood-opacity="0.28" result="flood-wide"/>
        <feComposite in="flood-wide" in2="blur-wide" operator="in" result="tinted-wide"/>
        <feComposite in="tinted-wide" in2="SourceAlpha" operator="in" result="ring-wide"/>

        <feGaussianBlur in="inverted-alpha" stdDeviation="3" result="blur-tight"/>
        <feFlood flood-color="#000" flood-opacity="0.18" result="flood-tight"/>
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
    </defs>
    <path fill="var(--color-accent)" filter="url(#kod-media-inner-shadow)" d=""/>
  `;
  return svg;
}

function buildMedia(kueh) {
  const wrap = document.createElement('div');
  wrap.className = 'kod-media';

  const shapeSvg = buildMediaShapeSvg();
  wrap.appendChild(shapeSvg);

  const template = KUEH_SHAPE_TABLE[kueh.id] || 'disc';
  const tag = document.createElement('p');
  tag.className = 'section-label kod-tag';
  tag.innerHTML = `${renderKuehSvg(kueh, template, 16)}<span>Kueh of the day</span>`;
  const tagIcon = tag.querySelector('svg');
  if (tagIcon) tagIcon.classList.add('kueh-icon', 'icon-sheen');
  wrap.appendChild(tag);

  const heading = document.createElement('h2');
  heading.className = 'section-title kod-name';
  heading.textContent = kueh.name;
  wrap.appendChild(heading);

  if (kueh.photo) {
    const img = document.createElement('img');
    img.src = kueh.photo;
    img.alt = kueh.name;
    img.loading = 'lazy';
    wrap.appendChild(img);
  } else {
    const svgWrap = document.createElement('div');
    svgWrap.innerHTML = renderKuehSvg(kueh, template, 220);
    wrap.appendChild(svgWrap.firstElementChild);
  }

  return wrap;
}

function buildOverviewPanel(kueh) {
  const panel = document.createElement('div');
  panel.className = 'kod-panel';

  const p = document.createElement('p');
  p.className = 'kod-origin-sentence';
  p.textContent = kueh.origin_sentence || kueh.description;
  panel.appendChild(p);

  if (kueh.flavor_profile && kueh.flavor_profile.length) {
    const pills = document.createElement('div');
    pills.className = 'kod-flavor-pills';
    kueh.flavor_profile.forEach((flavor) => {
      const span = document.createElement('span');
      span.className = 'kod-flavor-pill';
      span.textContent = flavor;
      pills.appendChild(span);
    });
    panel.appendChild(pills);
  }

  return panel;
}

function buildRecipePanel(kueh) {
  const panel = document.createElement('div');
  panel.className = 'kod-panel';

  if (!kueh.recipe) {
    const p = document.createElement('p');
    p.className = 'kod-recipe-empty';
    p.textContent = 'Recipe coming soon for this one.';
    panel.appendChild(p);
    return panel;
  }

  const collapse = document.createElement('div');
  collapse.className = 'kod-recipe-collapse';
  collapse.id = `kod-recipe-collapse-${kueh.id}`;

  const ingredientsHeading = document.createElement('h4');
  ingredientsHeading.className = 'kod-recipe-heading';
  ingredientsHeading.textContent = 'Ingredients';
  collapse.appendChild(ingredientsHeading);

  const ul = document.createElement('ul');
  ul.className = 'kod-ingredient-list';
  kueh.recipe.ingredients.forEach((ingredient) => {
    const li = document.createElement('li');
    li.textContent = ingredient;
    ul.appendChild(li);
  });
  collapse.appendChild(ul);

  const methodHeading = document.createElement('h4');
  methodHeading.className = 'kod-recipe-heading';
  methodHeading.textContent = 'Method';
  collapse.appendChild(methodHeading);

  const ol = document.createElement('ol');
  ol.className = 'kod-method-list';
  kueh.recipe.steps.forEach((step) => {
    const li = document.createElement('li');
    li.textContent = step;
    ol.appendChild(li);
  });
  collapse.appendChild(ol);
  panel.appendChild(collapse);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'kod-see-more';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', collapse.id);
  toggle.innerHTML =
    '<span class="kod-see-more-label text-sheen">See more</span>' +
    '<svg class="kod-see-more-chevron icon-sheen" width="16" height="16" viewBox="0 0 16 16" fill="none" ' +
    'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 6l4 4 4-4"/></svg>';
  const label = toggle.querySelector('.kod-see-more-label');
  toggle.addEventListener('click', () => {
    const expanded = collapse.classList.toggle('expanded');
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    label.textContent = expanded ? 'See less' : 'See more';
  });
  panel.appendChild(toggle);

  return panel;
}

function buildContent(kueh) {
  const wrap = document.createElement('div');
  wrap.className = 'kod-content';

  const overviewPanel = buildOverviewPanel(kueh);
  const recipePanel = buildRecipePanel(kueh);
  const tabGroup = createTabGroup([
    { id: 'overview', label: 'Overview', panel: overviewPanel },
    { id: 'recipe', label: 'Recipe', panel: recipePanel },
  ]);

  wrap.appendChild(tabGroup);
  wrap.appendChild(overviewPanel);
  wrap.appendChild(recipePanel);

  return wrap;
}

function renderKuehOfDay(section, index) {
  const kueh = KUEH_DATA[index];
  const seed = KUEH_SEED_TABLE[kueh.id];

  applyPalette(seed && seed.mode === 'signature' ? DEFAULT_THEME : generatePalette(seed));

  const mount = section.querySelector('.kod-mount');
  if (!mount) return;

  const card = document.createElement('div');
  card.className = 'kod-card';
  card.appendChild(buildMedia(kueh));
  card.appendChild(buildContent(kueh));

  const rim = document.createElement('div');
  rim.className = 'kod-card-rim';

  mount.innerHTML = '';
  mount.appendChild(rim);

  applyLayeredConicChrome(rim, card, { peaks: [45, 135, 225, 315] });

  const mediaEl = card.querySelector('.kod-media');
  const clipPathEl = mediaEl.querySelector('#kod-media-clip path');
  const shadowPathEl = mediaEl.querySelector('.kod-media-shadow > path');

  if (mediaResizeObserver) mediaResizeObserver.disconnect();
  mediaResizeObserver = new ResizeObserver(() => updateMediaClip(mediaEl, clipPathEl, shadowPathEl));
  mediaResizeObserver.observe(mediaEl);
}

export function init() {
  const section = document.getElementById('kueh-of-day');
  if (!section) return;

  const index = getDayIndexSGT(KUEH_DATA.length);
  renderKuehOfDay(section, index);
}
