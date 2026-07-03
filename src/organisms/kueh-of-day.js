// Organism: picks today's kueh, applies its daily palette, and renders the
// two-column media/content layout into the static #kueh-of-day section
// already present in index.html. No card frame wraps the two columns —
// each side is its own floating "window" (src/atoms/retro-shape.js): the
// kueh photo on its accent-colored window, and the tab content on a
// white one, both sitting directly on the section's own background.

import { generatePalette, applyPalette, DEFAULT_THEME } from '../tokens/colors.js';
import { createRetroShape } from '../atoms/retro-shape.js';
import { wrapWithInnerMatteRim } from '../atoms/matte-rim.js';
import { buildRivetRow } from '../atoms/rivets.js';
import { createSmallButton } from '../atoms/button.js';
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
let windowObservers = [];

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

// Icon + "Kueh of the day" label, now a standalone block sitting above
// the media window rather than clipped inside it. The icon sits in a
// small circular badge (metal rim + light face), not bare — a circle
// needs no clip-path shaping (border-radius already expresses it
// natively), so shaped: false skips wrapWithInnerMatteRim's clip-path
// machinery and just falls back to .rim-matte-inner's own
// border-radius: inherit.
function buildMediaTag(kueh, template) {
  const tag = document.createElement('p');
  tag.className = 'section-label kod-tag';

  const iconFace = document.createElement('span');
  iconFace.className = 'kod-tag-icon-face';
  iconFace.innerHTML = renderKuehSvg(kueh, template, 20);
  const tagIcon = iconFace.querySelector('svg');
  if (tagIcon) tagIcon.classList.add('kueh-icon', 'icon-sheen');

  const { el: iconBadge } = wrapWithInnerMatteRim(iconFace, { shaped: false });
  iconBadge.classList.add('kod-tag-icon-badge');
  tag.appendChild(iconBadge);

  const label = document.createElement('span');
  label.textContent = 'Kueh of the day';
  tag.appendChild(label);

  return tag;
}

// The kueh window itself: name heading + photo (or SVG fallback) on the
// accent-colored retro-rectangle shape. Returns { el, refs } — refs is
// windowEl's own { clipPathEl, shadowPathEl } (createRetroShape), handed
// to wrapWithInnerMatteRim as `fillRefs` (see buildMediaColumn) so the
// rim wrapper drives el's shape itself rather than this function wiring
// up its own observer.
function buildMediaWindow(kueh, template) {
  const wrap = document.createElement('div');
  wrap.className = 'kod-media';

  const { svg, clipUrl, ...refs } = createRetroShape({ fill: 'var(--color-accent)' });
  wrap.appendChild(svg);
  wrap.style.clipPath = clipUrl;

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

  return { el: wrap, refs };
}

function buildMediaColumn(kueh) {
  const column = document.createElement('div');
  column.className = 'kod-media-column';

  const template = KUEH_SHAPE_TABLE[kueh.id] || 'disc';
  column.appendChild(buildMediaTag(kueh, template));

  const { el: windowEl, refs } = buildMediaWindow(kueh, template);
  // gutter: 0 — no card to float the window inside anymore. fillRefs:
  // refs hands windowEl's own { clipPathEl, shadowPathEl } to the rim
  // wrapper, so it drives windowEl's shape itself (sharing one solved
  // corner exponent with its rim/glint bands) instead of kueh-of-day.js
  // observing windowEl independently — see wrapWithInnerMatteRim's own
  // comment for why solving each band separately made the rim's corners
  // visibly tighter than the window's.
  const { el: rim, observer } = wrapWithInnerMatteRim(windowEl, { gutter: 0, fillRefs: refs });
  column.appendChild(rim);

  return { el: column, observer };
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

// Returns { panel, toggleRim, toggle, label, collapse } — the toggle
// fields are undefined when there's no recipe (nothing to expand). The
// toggle button used to live inside `panel` itself; it's built here (it
// needs `collapse`'s id for aria-controls) but no longer appended to
// panel — buildContentColumn places its rim outside the content window
// instead, and wires its click handler there, where it also has access
// to windowEl for the height animation.
function buildRecipePanel(kueh) {
  const panel = document.createElement('div');
  panel.className = 'kod-panel';

  if (!kueh.recipe) {
    const p = document.createElement('p');
    p.className = 'kod-recipe-empty';
    p.textContent = 'Recipe coming soon for this one.';
    panel.appendChild(p);
    return { panel };
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

  const { rim: toggleRim, btn: toggle, labelEl: label } = createSmallButton({
    label: 'See more',
    iconSvg:
      '<svg class="kod-see-more-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" ' +
      'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 6l4 4 4-4"/></svg>',
  });
  toggleRim.classList.add('kod-see-more-rim');
  toggle.classList.add('kod-see-more');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', collapse.id);

  return { panel, toggleRim, toggle, label, collapse };
}

// The tab content's own window: same retro-rectangle shape as the media
// window, filled white instead of the day's accent color. Sized by its
// own content (the active panel) — see buildContentColumn for how height
// changes here (a tab switch, or the recipe collapse expanding/
// collapsing) get animated rather than snapping instantly.
function buildContentWindow(overviewPanel, recipePanel) {
  const wrap = document.createElement('div');
  wrap.className = 'kod-content-window';

  const { svg, clipUrl, ...refs } = createRetroShape({ fill: 'var(--color-surface)' });
  wrap.appendChild(svg);
  wrap.style.clipPath = clipUrl;

  wrap.appendChild(overviewPanel);
  wrap.appendChild(recipePanel);

  return { el: wrap, refs };
}

function buildContentColumn(kueh) {
  const column = document.createElement('div');
  column.className = 'kod-content-column';

  const overviewPanel = buildOverviewPanel(kueh);
  const { panel: recipePanel, toggleRim, toggle, label, collapse } = buildRecipePanel(kueh);

  const { el: windowEl, refs } = buildContentWindow(overviewPanel, recipePanel);
  const { el: rim, observer } = wrapWithInnerMatteRim(windowEl, { gutter: 0, fillRefs: refs });

  // windowEl's height otherwise jumps instantly whenever its content does
  // — a tab switch (toggling a panel's `hidden` attribute has no
  // transitionable state of its own) or the recipe collapse expanding/
  // collapsing. Locking the current rendered height right before the
  // change, then animating to the new content's natural height right
  // after, is what turns both into a smooth resize instead of a snap —
  // and since windowEl's own retro-rectangle clip-path is already driven by
  // a ResizeObserver (wrapWithInnerMatteRim's fillRefs), that shape
  // morphs in sync with the height transition for free, the same way the
  // tab group's own sliding highlight rides along with its width/
  // transform transition.
  function lockWindowHeight() {
    windowEl.style.height = `${windowEl.offsetHeight}px`;
    void windowEl.offsetHeight; // force layout to commit the start height before the mutation that follows
  }

  function settleWindowHeight() {
    windowEl.style.height = `${windowEl.scrollHeight}px`;
  }

  const tabGroup = createTabGroup(
    [
      { id: 'overview', label: 'Overview', panel: overviewPanel },
      { id: 'recipe', label: 'Recipe', panel: recipePanel },
    ],
    {
      onBeforeChange: lockWindowHeight,
      onChange(index) {
        if (toggleRim) toggleRim.hidden = index !== 1;
        settleWindowHeight();
      },
    }
  );

  if (toggle) {
    toggleRim.hidden = true; // Overview is the initially-selected tab

    toggle.addEventListener('click', () => {
      const willExpand = !collapse.classList.contains('expanded');

      // windowEl.scrollHeight can't be used to find *its* target height
      // here the way settleWindowHeight does for a tab switch — collapse
      // has its own transition: max-height, so reading scrollHeight
      // synchronously right after changing collapse's max-height still
      // reflects collapse's *current* rendered height, not its target:
      // the transition hasn't progressed at all yet (no frame has
      // rendered), so windowEl's height would end up one click behind
      // collapse's actual state. Computing the delta collapse's own
      // height is about to change by, and adding that straight onto
      // windowEl's current height, sidesteps needing collapse's
      // transition to finish first — both animations start together and
      // reach their real targets over the same 0.3s, driven by two
      // independent CSS transitions rather than one waiting on the other.
      const collapseCurrentHeight = collapse.offsetHeight;
      // 180 matches .kod-recipe-collapse's own default max-height
      // (kueh-of-day.css) — collapse.scrollHeight always reflects the
      // full content height regardless of state, but there's no
      // equivalent transition-independent way to ask "what's the
      // *collapsed* height," so this one value has to stay in sync with
      // that CSS rule by hand.
      const collapseTargetHeight = willExpand ? collapse.scrollHeight : 180;
      const heightDelta = collapseTargetHeight - collapseCurrentHeight;

      lockWindowHeight();
      const targetWindowHeight = windowEl.offsetHeight + heightDelta;

      collapse.classList.toggle('expanded', willExpand);
      toggle.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
      label.textContent = willExpand ? 'See less' : 'See more';
      // A real measured height (not max-height: none, which can't
      // transition) is what lets .kod-recipe-collapse's own max-height
      // animate smoothly.
      collapse.style.maxHeight = willExpand ? `${collapse.scrollHeight}px` : '';

      windowEl.style.height = `${targetWindowHeight}px`;
    });
  }

  // Floats directly on the section background now — no card behind it —
  // but it already carries its own chrome rim + white pill fill
  // (src/molecules/tab-group.js), so it needs no changes here.
  column.appendChild(tabGroup);
  column.appendChild(rim);
  if (toggleRim) column.appendChild(toggleRim);

  return { el: column, observer };
}

function renderKuehOfDay(section, index) {
  const kueh = KUEH_DATA[index];
  const seed = KUEH_SEED_TABLE[kueh.id];

  applyPalette(seed && seed.mode === 'signature' ? DEFAULT_THEME : generatePalette(seed));

  const mount = section.querySelector('.kod-mount');
  if (!mount) return;

  const layout = document.createElement('div');
  layout.className = 'kod-layout';

  const media = buildMediaColumn(kueh);
  const content = buildContentColumn(kueh);
  layout.appendChild(media.el);
  layout.appendChild(content.el);

  mount.innerHTML = '';
  mount.appendChild(layout);

  windowObservers.forEach((observer) => observer.disconnect());
  windowObservers = [media.observer, content.observer];
}

export function init() {
  const section = document.getElementById('kueh-of-day');
  if (!section) return;

  const index = getDayIndexSGT(KUEH_DATA.length);
  renderKuehOfDay(section, index);

  // Decorates the section's own .matte-metal-surface panel, not the
  // rotating kueh content — built once here rather than inside
  // renderKuehOfDay, which only owns what changes per kueh/day.
  const topRivets = buildRivetRow();
  topRivets.classList.add('metal-rivet-row-top');
  const bottomRivets = buildRivetRow();
  bottomRivets.classList.add('metal-rivet-row-bottom');
  section.append(topRivets, bottomRivets);
}
