// Organism: picks today's kueh, applies its daily palette, and renders the
// two-column media/content card into the static #kueh-of-day section
// already present in index.html.

import { generatePalette, applyPalette, DEFAULT_THEME } from '../tokens/colors.js';
import { KUEH_DATA, KUEH_SEED_TABLE, KUEH_SHAPE_TABLE } from '../data/kueh.js';
import { renderKuehSvg } from '../atoms/kueh-icon.js';
import { createTabGroup } from '../molecules/tab-group.js';

function titleCase(str) {
  return str.replace(/(^|[\s/(])([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase());
}

// Rotation is anchored to a fixed start date rather than Jan 1, so day 0
// lands on today (when this shipped) — and KUEH_DATA lists the 7
// photographed kueh first, so the first week of real-world days cycles
// through actual photos before reaching the SVG-fallback kueh. Once more
// photos are added, just update KUEH_DATA's `photo` field; no need to
// touch this anchor.
const ROTATION_ANCHOR_UTC = Date.UTC(2026, 6, 2); // 2026-07-02 = day 0

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

function buildMedia(kueh) {
  const wrap = document.createElement('div');
  wrap.className = 'kod-media';

  const tag = document.createElement('p');
  tag.className = 'section-label kod-tag';
  tag.textContent = 'Kueh of the day';
  wrap.appendChild(tag);

  if (kueh.photo) {
    const img = document.createElement('img');
    img.src = kueh.photo;
    img.alt = kueh.name;
    img.loading = 'lazy';
    wrap.appendChild(img);
  } else {
    const template = KUEH_SHAPE_TABLE[kueh.id] || 'disc';
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
  toggle.textContent = 'See more';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', collapse.id);
  toggle.addEventListener('click', () => {
    const expanded = collapse.classList.toggle('expanded');
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle.textContent = expanded ? 'See less' : 'See more';
  });
  panel.appendChild(toggle);

  return panel;
}

function buildContent(kueh) {
  const wrap = document.createElement('div');
  wrap.className = 'kod-content';

  const template = KUEH_SHAPE_TABLE[kueh.id] || 'disc';
  const heading = document.createElement('h2');
  heading.className = 'section-title kod-name';
  heading.innerHTML = `${renderKuehSvg(kueh, template, 22)}<span>${kueh.name}</span>`;
  const icon = heading.querySelector('svg');
  if (icon) icon.classList.add('kueh-icon');
  wrap.appendChild(heading);

  const metaRow = document.createElement('div');
  metaRow.className = 'kod-meta-pills';
  [kueh.category, kueh.occasion].filter(Boolean).forEach((value) => {
    const span = document.createElement('span');
    span.className = 'pill';
    span.textContent = titleCase(value);
    metaRow.appendChild(span);
  });
  wrap.appendChild(metaRow);

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

  mount.innerHTML = '';
  mount.appendChild(card);
}

export function init() {
  const section = document.getElementById('kueh-of-day');
  if (!section) return;

  const index = getDayIndexSGT(KUEH_DATA.length);
  renderKuehOfDay(section, index);
}
