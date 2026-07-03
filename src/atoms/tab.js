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

  // Label lives in its own child span, not directly on the button: the
  // button itself still needs a real, unclipped background-color for its
  // :hover state (the selected-tab highlight itself is a separate sliding
  // element behind the button now — see .tab-highlight,
  // src/molecules/tab-group.js — but hover applies directly to .tab), and
  // .text-sheen's background-clip: text clips *every* background layer on
  // the box it's applied to — color included, not just its own gradient
  // image. Putting .text-sheen on a separate child keeps hover's
  // background-color on the button's own box, untouched by the child's
  // clip.
  const labelEl = document.createElement('span');
  labelEl.className = 'text-sheen';
  labelEl.textContent = label;
  btn.appendChild(labelEl);

  return btn;
}
