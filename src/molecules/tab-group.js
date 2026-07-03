// Molecule: composes Tab atoms into a floating retro-rectangle tab bar
// and owns the full ARIA tabs pattern (roving tabindex, arrow/Home/End
// key nav, aria-selected/aria-controls/aria-labelledby wiring). Panels
// are supplied by the caller and just get their visibility + ARIA
// attributes managed here — this molecule doesn't render panel content
// itself, so it stays reusable beyond the kueh-of-day organism.

import { createTab } from '../atoms/tab.js';
import { applyLayeredConicChrome } from '../tokens/chrome-metal.js';
import { attachRetroShapeClip, SMALL_RETRO_SHAPE_OPTS } from '../atoms/retro-shape.js';

// px gap between .tab-highlight and the track's own edges on every side —
// see positionHighlight below and .tab-highlight's top/bottom in
// molecules.css, which must match this value.
const HIGHLIGHT_INSET = 2;

// Reshapes `el` to the retro-rectangle silhouette and keeps it in sync
// with el's own live box size (see the tablist's own call below, which
// also repositions the highlight on the same resize via onUpdate).
function shapeElement(el, onUpdate) {
  attachRetroShapeClip(el, SMALL_RETRO_SHAPE_OPTS, onUpdate);
}

/**
 * @param {{id: string, label: string, panel?: HTMLElement}[]} tabs
 * @param {{ onBeforeChange?: (index: number) => void, onChange?: (index: number) => void }} [handlers]
 *   Both are optional hooks around a selection change — onBeforeChange
 *   runs synchronously before anything (aria-selected, panel visibility,
 *   the highlight) mutates, onChange right after. Neither fires for the
 *   initial tab (index 0's selection isn't a "change"). Split into two
 *   hooks, not one, specifically so a consumer can measure state before
 *   the panel swap and compare it against state after — e.g.
 *   kueh-of-day.js locking its content window's current rendered height
 *   in onBeforeChange, then animating to the new panel's natural height
 *   in onChange, since toggling a panel's `hidden` attribute has no
 *   transitionable state of its own to animate through.
 * @returns {HTMLElement} the rim wrapper (append this — it contains the
 *   actual tablist inside it)
 */
export function createTabGroup(tabs, { onBeforeChange, onChange } = {}) {
  const list = document.createElement('div');
  list.className = 'tab-group';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Kueh details');

  // Sits behind the buttons (see .tab-highlight, styles/molecules.css, for
  // the z-index that actually pins it there) and slides/resizes to match
  // whichever tab is selected — see positionHighlight below.
  const highlight = document.createElement('div');
  highlight.className = 'tab-highlight';
  list.appendChild(highlight);

  const buttons = tabs.map((t, i) => createTab({ id: t.id, label: t.label, selected: i === 0 }));
  // Each button's own hover background (.tab:hover) is a real box, so it
  // needs the same clip-path treatment as the rest of the group — without
  // this, only the rim/fill/highlight get reshaped and every tab's own
  // hover/focus-ring stays the old pill (see .tab's border-radius,
  // styles/atoms.css, for the fallback shape browsers that don't clip
  // outline to clip-path fall back to).
  buttons.forEach((btn) => {
    list.appendChild(btn);
    shapeElement(btn);
  });

  tabs.forEach((t, i) => {
    if (!t.panel) return;
    t.panel.id = `panel-${t.id}`;
    t.panel.setAttribute('role', 'tabpanel');
    t.panel.setAttribute('aria-labelledby', `tab-${t.id}`);
    t.panel.hidden = i !== 0;
  });

  let selectedIndex = 0;

  // offsetLeft/Top/Width/Height are relative to .tab-group (the nearest
  // positioned ancestor, via position: relative in CSS), so this lines
  // the highlight up with the selected button without needing scroll-
  // aware getBoundingClientRect math. transform (not left/top) is what
  // makes the slide animate smoothly on the compositor rather than
  // triggering layout every frame. Every dimension is measured from the
  // button itself (not, say, assuming vertical centering falls out of
  // .tab-group's own padding matching HIGHLIGHT_INSET by coincidence —
  // it doesn't: buttons already fill .tab-group's full padded height via
  // flex stretch, so a CSS top/bottom offset equal to .tab-group's own
  // padding lines up flush with the button, not inset beyond it, which
  // is what originally made the horizontal gap read larger than the
  // vertical one) so the gap is identical on all four sides.
  function positionHighlight() {
    const btn = buttons[selectedIndex];
    if (!btn) return;
    highlight.style.width = `${btn.offsetWidth - HIGHLIGHT_INSET * 2}px`;
    highlight.style.height = `${btn.offsetHeight - HIGHLIGHT_INSET * 2}px`;
    highlight.style.transform = `translate(${btn.offsetLeft + HIGHLIGHT_INSET}px, ${btn.offsetTop + HIGHLIGHT_INSET}px)`;
  }

  function selectTab(index, { moveFocus = true } = {}) {
    if (onBeforeChange) onBeforeChange(index);
    selectedIndex = index;
    buttons.forEach((btn, i) => {
      const isSelected = i === index;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      btn.tabIndex = isSelected ? 0 : -1;
      if (tabs[i].panel) tabs[i].panel.hidden = !isSelected;
    });
    positionHighlight();
    if (moveFocus) buttons[index].focus();
    if (onChange) onChange(index);
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
  const glintBand = applyLayeredConicChrome(rim, list, { peaks: [60, 180, 300] });

  shapeElement(rim);
  shapeElement(glintBand);
  // The tablist's own resize (its width changes whenever a button's does,
  // e.g. at a breakpoint) is also exactly when the highlight might need
  // repositioning, so both are driven from this one observer.
  shapeElement(list, positionHighlight);
  shapeElement(highlight);

  return rim;
}
