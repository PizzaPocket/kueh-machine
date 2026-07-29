// Organism: reveals the #randomiser section once the 29 July 2pm SGT
// check-in deadline passes — the same gate scissors-cut.js uses to cut the
// Timeline string and reveal #check-in, so both open at once. Mostly an
// aria-hidden toggle (styles/organisms/randomiser.css hides the section
// while aria-hidden="true" is set): the widget itself lives inside an
// iframe, so there's no height/content to build here the way check-in.js
// builds #check-in's row list — just:
//   - the top/bottom rivet rows dressing up the section's own
//     .matte-metal-surface panel, same as Kueh of the Day and the Timeline
//     (buildRivetRow, src/atoms/rivets.js);
//   - reshaping the iframe's wrapper into the site's superellipse "retro
//     rectangle" (attachRetroShapeClip, src/atoms/retro-shape.js) — the
//     wrapper, not the iframe itself, since that atom appends a defs-only
//     <svg> as a child of whatever it's attached to, and an iframe only
//     renders that as light-DOM fallback content, not guaranteed to behave
//     like a normal element's children;
//   - a small postMessage handshake with the widget (a separate HTML
//     document, randomiser.html, with no access to this page's CSS custom
//     properties on its own) so its accent color can follow today's
//     kueh-of-day palette rather than staying a fixed hardcoded blue.
// The order-drawn message (the widget telling this page what order it
// drew, so the Check In rows above can sort to match) is handled in
// src/organisms/check-in.js instead, right next to the rows it moves.

import { buildRivetRow } from '../atoms/rivets.js';
import { attachRetroShapeClip } from '../atoms/retro-shape.js';

const CHECKIN_UTC = Date.UTC(2026, 6, 29, 6, 0, 0); // 29 July 2026, 2:00pm SGT — matches scissors-cut.js's own deadline

export function init() {
  const section = document.getElementById('randomiser');
  if (!section) return;
  if (Date.now() < CHECKIN_UTC) return;
  section.removeAttribute('aria-hidden');

  const topRivets = buildRivetRow();
  topRivets.classList.add('metal-rivet-row-top');
  const bottomRivets = buildRivetRow();
  bottomRivets.classList.add('metal-rivet-row-bottom');
  section.append(topRivets, bottomRivets);

  const frameWrap = section.querySelector('.randomiser-frame-wrap');
  const frame = section.querySelector('.randomiser-frame');
  if (!frameWrap || !frame) return;

  // gutter: 0 — this wrap fills its parent .randomiser-frame-shadow's box
  // edge to edge (that's the one carrying the box-shadow, index.html/
  // randomiser.css), rather than floating as a shape inset within a larger
  // container the way the Kueh of the Day windows are — so the shape needs
  // to hug the wrap's own edges flush, not inset from them (same reasoning
  // src/atoms/button.js's own flush-nested rim/glint/btn shapes use
  // SMALL_RETRO_SHAPE_OPTS' gutter: 0 for).
  attachRetroShapeClip(frameWrap, { gutter: 0 });

  // The widget posts 'ready' once its own script has run (see
  // randomiser.html) — replying only then, rather than guessing at the
  // iframe's 'load' event, sidesteps any race between that event and the
  // widget's own listener actually being attached. event.source (not just
  // event.data.type) is checked so an unrelated frame/extension posting a
  // same-shaped message can't spoof this.
  window.addEventListener('message', (event) => {
    if (event.data?.type !== 'kueh-randomiser:ready' || event.source !== frame.contentWindow) return;
    const rootStyle = getComputedStyle(document.documentElement);
    const accent = rootStyle.getPropertyValue('--color-accent').trim();
    // --color-accent itself is a light, pastel tier by design (src/tokens/
    // colors.js) — fine as the button's own fill, but too low-contrast for
    // the "Drop" header word against the widget's cream background. Sent
    // separately as headerAccent so the button and the header word can
    // pull from different tiers of the same day's palette, rather than
    // reusing --color-accent for both.
    const headerAccent = rootStyle.getPropertyValue('--color-primary-strong').trim();
    frame.contentWindow.postMessage({ type: 'kueh-randomiser:theme', accent, headerAccent }, '*');
  });
}
