// Atom: a single tab control. Selection state (aria-selected, tabindex,
// active styling) is owned by the tab-group molecule that composes these,
// not by the atom itself — this just builds the element with the right
// baseline structure/attributes.

export function createTab({ id, label, selected = false }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tab';
  btn.id = `tab-${id}`;
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-controls', `panel-${id}`);
  btn.setAttribute('aria-selected', selected ? 'true' : 'false');
  btn.tabIndex = selected ? 0 : -1;
  btn.textContent = label;
  btn.dataset.tabId = id;
  return btn;
}
