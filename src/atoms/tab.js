// Atom: a single tab control. Selection state (aria-selected, tabindex,
// active styling) is owned by the tab-group molecule that composes these,
// not by the atom itself — this just builds the element with the right
// baseline structure/attributes. The .text-sheen light-catching accent
// (src/tokens/chrome-metal.js) is registered in one blanket sweep by
// chrome-accents.js once everything's mounted, not per-atom here.

export function createTab({ id, label, selected = false }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tab';
  btn.id = `tab-${id}`;
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-controls', `panel-${id}`);
  btn.setAttribute('aria-selected', selected ? 'true' : 'false');
  btn.tabIndex = selected ? 0 : -1;
  btn.dataset.tabId = id;

  // .tab-fill: the hover-state background, split into its own decorative
  // layer instead of living directly on .tab — see .tab-fill's own comment
  // (styles/atoms.css) for why: it needs to stack *below* .tab-highlight
  // (src/molecules/tab-group.js's sliding selection indicator) while the
  // label below stacks *above* it, and a single element's background and
  // content can't independently take two different stacking positions
  // relative to a sibling.
  const fill = document.createElement('span');
  fill.className = 'tab-fill';
  fill.setAttribute('aria-hidden', 'true');
  btn.appendChild(fill);

  // Label lives in its own child span, not directly on the button: same
  // "separate box from the hover background" reasoning as .tab-fill above,
  // plus .text-sheen's background-clip: text clips *every* background
  // layer on the box it's applied to — color included, not just its own
  // gradient image — so it can't share a box with .tab-fill's own
  // background either.
  const labelEl = document.createElement('span');
  labelEl.className = 'text-sheen';
  labelEl.textContent = label;
  btn.appendChild(labelEl);

  return btn;
}
