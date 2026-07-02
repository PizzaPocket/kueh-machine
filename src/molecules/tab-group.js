// Molecule: composes Tab atoms into a floating pill tab bar and owns the
// full ARIA tabs pattern (roving tabindex, arrow/Home/End key nav,
// aria-selected/aria-controls/aria-labelledby wiring). Panels are supplied
// by the caller and just get their visibility + ARIA attributes managed
// here — this molecule doesn't render panel content itself, so it stays
// reusable beyond the kueh-of-day organism.

import { createTab } from '../atoms/tab.js';
import { applyConicChrome } from '../tokens/chrome-metal.js';

/**
 * @param {{id: string, label: string, panel?: HTMLElement}[]} tabs
 * @returns {HTMLElement} the rim wrapper (append this — it contains the
 *   actual tablist inside it)
 */
export function createTabGroup(tabs) {
  const list = document.createElement('div');
  list.className = 'tab-group';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Kueh details');

  const buttons = tabs.map((t, i) => createTab({ id: t.id, label: t.label, selected: i === 0 }));
  buttons.forEach((btn) => list.appendChild(btn));

  tabs.forEach((t, i) => {
    if (!t.panel) return;
    t.panel.id = `panel-${t.id}`;
    t.panel.setAttribute('role', 'tabpanel');
    t.panel.setAttribute('aria-labelledby', `tab-${t.id}`);
    t.panel.hidden = i !== 0;
  });

  function selectTab(index, { moveFocus = true } = {}) {
    buttons.forEach((btn, i) => {
      const isSelected = i === index;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      btn.tabIndex = isSelected ? 0 : -1;
      if (tabs[i].panel) tabs[i].panel.hidden = !isSelected;
    });
    if (moveFocus) buttons[index].focus();
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => selectTab(i, { moveFocus: false }));

    btn.addEventListener('keydown', (e) => {
      let newIndex = null;
      if (e.key === 'ArrowRight') newIndex = (i + 1) % buttons.length;
      else if (e.key === 'ArrowLeft') newIndex = (i - 1 + buttons.length) % buttons.length;
      else if (e.key === 'Home') newIndex = 0;
      else if (e.key === 'End') newIndex = buttons.length - 1;

      if (newIndex !== null) {
        e.preventDefault();
        selectTab(newIndex);
      }
    });
  });

  const rim = document.createElement('div');
  rim.className = 'tab-group-rim';
  rim.appendChild(list);
  applyConicChrome(rim, { peaks: [60, 180, 300] });

  return rim;
}
