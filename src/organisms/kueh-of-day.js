// Organism: picks today's kueh, applies its daily palette, and renders the
// two-column media/content layout into the static #kueh-of-day section
// already present in index.html. No card frame wraps the two columns —
// each side is its own floating "window" (src/atoms/retro-shape.js): the
// kueh photo on its accent-colored window, and the tab content on a
// white one, both sitting directly on the section's own background.

import { generatePalette, applyPalette, DEFAULT_THEME } from '../tokens/colors.js';
import { createRetroShape } from '../atoms/retro-shape.js';
import { wrapWithInnerMatteRim } from '../atoms/matte-rim.js';
import { buildMetalSeam } from '../atoms/metal-seam.js';
import { buildRivetRow } from '../atoms/rivets.js';
import { createSmallButton } from '../atoms/button.js';
import { KUEH_DATA, KUEH_SEED_TABLE, KUEH_SHAPE_TABLE } from '../data/kueh.js';
import { renderKuehSvg } from '../atoms/kueh-icon.js';
import { createTabGroup } from '../molecules/tab-group.js';

// Rotation is anchored to a fixed start date rather than Jan 1, so day 0
// lands on today (when this shipped). All 17 kueh in KUEH_DATA currently
// have a photo; if an unphotographed kueh is ever added, list it last so
// the rotation favors real photos over the SVG fallback. No need to touch
// this anchor when photos are added later.
const ROTATION_ANCHOR_UTC = Date.UTC(2026, 6, 2); // 2026-07-02 = day 0

// Guards against piling up duplicate observers if renderKuehOfDay() is
// ever called more than once per page load — it isn't today (init() runs
// exactly once), but the disconnect-before-recreate is cheap insurance.
let windowObservers = [];

// Same SGT day math index.html's own inline countdown script and
// timeline-panel.js both separately recompute — each one small
// calculation, not worth sharing a module for across otherwise-unrelated
// features.
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

// The vertical "seam" between the two columns: a pair of thin metal
// lines (.metal-seam, src/atoms/metal-seam.js) that run full-bleed the
// section's entire height (.kod-seam-line's own negative top/bottom
// offsets, kueh-of-day.css), reading as the butted edges of the two
// panels meeting rather than a bezel around either of them, plus a
// short, sparse column of rivets running alongside it — the vertical
// counterpart to the section's own top/bottom rivet rows (buildRivetRow,
// init() below). Returns a plain element (no observer to track), since
// nothing here is shape- or resize-driven.
function buildSeam() {
  const wrap = document.createElement('div');
  wrap.className = 'kod-seam-wrap';
  wrap.setAttribute('aria-hidden', 'true');

  const line = buildMetalSeam();
  line.classList.add('kod-seam-line');
  wrap.appendChild(line);

  const rivets = buildRivetRow(3, { vertical: true });
  rivets.classList.add('kod-seam-rivets');
  wrap.appendChild(rivets);

  return wrap;
}

function buildContentColumn(kueh) {
  const column = document.createElement('div');
  column.className = 'kod-content-column';

  const overviewPanel = buildOverviewPanel(kueh);
  const { panel: recipePanel, toggleRim, toggle, label, collapse } = buildRecipePanel(kueh);

  const { el: windowEl, refs } = buildContentWindow(overviewPanel, recipePanel);
  const { el: rim, observer } = wrapWithInnerMatteRim(windowEl, { gutter: 0, fillRefs: refs });

  // windowEl's height otherwise jumps instantly whenever its content does
  // (a tab switch, or the recipe collapse expanding/collapsing) — locking
  // the current rendered height right before the change, then animating
  // to the new content's natural height right after, turns both into a
  // smooth resize. windowEl's clip-path is already driven by a
  // ResizeObserver (wrapWithInnerMatteRim's fillRefs), so its shape morphs
  // in sync with the height transition for free.
  function lockWindowHeight() {
    windowEl.style.height = `${windowEl.offsetHeight}px`;
    void windowEl.offsetHeight; // force layout to commit the start height before the mutation that follows
  }

  // scrollHeight can't be used directly here: it's defined as max(content's
  // natural height, the element's current clientHeight), so switching to a
  // *shorter* panel (e.g. Recipe, expanded, back to Overview) reads
  // scrollHeight while windowEl is still at its old, taller locked height —
  // the real (smaller) content height loses that max() comparison and the
  // window never shrinks. Setting height: auto removes that floor so
  // offsetHeight reflects the true natural height instead.
  //
  // That measurement can't happen while the transition is live, though:
  // flipping height to auto and back to a px value with no render in
  // between still makes the browser treat `auto` as the transition's
  // "before" state, which has no interpolatable value, so it just snaps
  // instead of animating (confirmed empirically). Turning the transition
  // off for the measure-then-restore round trip, and only re-enabling it
  // right before setting the real target, keeps `auto` from ever being
  // the value the transition actually sees.
  function settleWindowHeight() {
    const startHeight = windowEl.style.height;
    windowEl.style.transition = 'none';
    windowEl.style.height = 'auto';
    const target = windowEl.offsetHeight;
    windowEl.style.height = startHeight;
    void windowEl.offsetHeight;
    windowEl.style.transition = '';
    windowEl.style.height = `${target}px`;
  }

  const tabGroup = createTabGroup(
    [
      { id: 'overview', label: 'Overview', panel: overviewPanel },
      { id: 'recipe', label: 'Recipe', panel: recipePanel },
    ],
    {
      onBeforeChange: lockWindowHeight,
      onChange(index) {
        // display: none can't transition, so the button used to snap
        // in/out instantly instead of animating with windowEl's resize —
        // .kod-see-more-rim-collapsed (kueh-of-day.css) transitions
        // max-height/opacity/margin instead. That CSS-only collapse
        // doesn't pull the button out of the tab order/accessibility tree
        // the way `hidden` did, so aria-hidden/tabIndex are set by hand
        // here to keep the same behavior.
        if (toggleRim) {
          const collapsed = index !== 1;
          toggleRim.classList.toggle('kod-see-more-rim-collapsed', collapsed);
          toggleRim.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
          toggle.tabIndex = collapsed ? -1 : 0;
        }
        settleWindowHeight();
      },
    }
  );

  if (toggle) {
    // Overview is the initially-selected tab, so the toggle starts collapsed.
    toggleRim.classList.add('kod-see-more-rim-collapsed');
    toggleRim.setAttribute('aria-hidden', 'true');
    toggle.tabIndex = -1;

    toggle.addEventListener('click', () => {
      const willExpand = !collapse.classList.contains('expanded');

      // Reading scrollHeight synchronously right after changing collapse's
      // max-height still reflects its *current* height, not the target —
      // the transition hasn't progressed yet. Computing the delta
      // collapse's height is about to change by, and adding that onto
      // windowEl's current height, sidesteps needing collapse's own
      // transition to finish first — both animate together over the same
      // 0.3s instead of one waiting on the other.
      const collapseCurrentHeight = collapse.offsetHeight;
      // 180 matches .kod-recipe-collapse's own default max-height
      // (kueh-of-day.css) — there's no transition-independent way to ask
      // "what's the collapsed height," so this has to stay in sync with
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
  layout.appendChild(buildSeam());
  layout.appendChild(content.el);

  mount.innerHTML = '';
  mount.appendChild(layout);

  windowObservers.forEach((observer) => observer.disconnect());
  windowObservers = [media.observer, content.observer];
}

// Re-runs just the day-lookup + render step — safe to call repeatedly
// (renderKuehOfDay already clears its own mount and disconnects its old
// observers). Used by init()'s first render and by the dev date-override
// (see index.html, "dev:date-changed") to re-pick the kueh/palette for a
// simulated date without touching the rivet rows added below.
function refresh() {
  const section = document.getElementById('kueh-of-day');
  if (!section) return;

  const index = getDayIndexSGT(KUEH_DATA.length);
  renderKuehOfDay(section, index);
}

export function init() {
  const section = document.getElementById('kueh-of-day');
  if (!section) return;

  refresh();

  // Decorates the section's own .matte-metal-surface panel, not the
  // rotating kueh content — built once here rather than inside
  // renderKuehOfDay, which only owns what changes per kueh/day.
  const topRivets = buildRivetRow();
  topRivets.classList.add('metal-rivet-row-top');
  const bottomRivets = buildRivetRow();
  bottomRivets.classList.add('metal-rivet-row-bottom');
  section.append(topRivets, bottomRivets);

  // TEMP: dev date-override hookup (see index.html, "dev:date-changed") —
  // remove alongside that control before launch.
  window.addEventListener('dev:date-changed', refresh);
}
