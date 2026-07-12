// Organism: the Check In section's row list — one row per contributor
// (avatar, title/byline/description, and a placeholder "window" element),
// each pair separated by a full-bleed horizontal seam. Placeholder content
// for now (11 rows, most still unnamed) — the section itself is revealed
// by src/organisms/scissors-cut.js; this module only builds what's inside
// it, and runs early enough in src/main.js's init order that its content
// exists before any reveal could possibly measure .check-in-collapse's
// real height.

import { createRetroShape } from '../atoms/retro-shape.js';
import { wrapWithInnerMatteRim } from '../atoms/matte-rim.js';
import { buildMetalSeam } from '../atoms/metal-seam.js';

// Two real submissions so far; the rest are unfilled placeholder rows
// (clearly generic name/description, not fabricated people) reserving
// space for the other nine team members' entries.
const CONTRIBUTORS = [
  { initials: 'KC', name: 'Kaixin Cai', desc: "(the one that's a puzzle game)" },
  { initials: 'KD', name: 'Kevin Dreher', desc: "(the one that's a Singlish translation app)" },
  ...Array.from({ length: 9 }, (_, i) => ({
    initials: `C${i + 3}`,
    name: `Contributor ${i + 3}`,
    desc: "(the one that's a ___)",
  })),
];

const AVATAR_HEIGHT = 52; // matches .checkin-avatar's own CSS (check-in.css)
const WINDOW_HEIGHT = AVATAR_HEIGHT * 2;

function buildSeam() {
  const seam = buildMetalSeam({ horizontal: true });
  seam.classList.add('checkin-seam');
  return seam;
}

// Same construction as KOTD's own buildContentWindow + wrapWithInnerMatteRim
// pairing (kueh-of-day.js) — a retro-rectangle fill wrapped in the static
// matte rim, not just a bare clipped shape. Filled with --metal-shadow, the
// same token the section itself uses as its own background (check-in.css),
// so the window reads as an inset frame rather than a contrasting block —
// the rim is what gives it visible presence, not the fill color. `rim`
// (the wrapper wrapWithInnerMatteRim returns) is what actually gets placed
// in the row; it already carries its own ResizeObserver (shaped:true,
// the default) driving both its own bands' shape and, via fillRefs, the
// nested fill's.
//
// n: 8 (fixed, not auto-solved) — same fix timeline-panel.js's own
// THIN_WINDOW_SHADOW-adjacent windows needed: this box is much shorter/
// wider than a typical retro-rectangle consumer, and with no actual
// content inside to clear, solveClearingExponent's content-clearance solve
// pushes the corner exponent toward its rectangular ceiling, reading as
// square corners instead of the intended superellipse swell.
function buildEmptyWindow() {
  const fillWrap = document.createElement('div');
  fillWrap.className = 'checkin-window-fill';
  const { svg, clipUrl, ...refs } = createRetroShape({ fill: 'var(--metal-shadow)' });
  fillWrap.appendChild(svg);
  fillWrap.style.clipPath = clipUrl;

  const { el: rim } = wrapWithInnerMatteRim(fillWrap, { gutter: 0, n: 8, fillRefs: refs });
  rim.classList.add('checkin-window');
  rim.style.height = `${WINDOW_HEIGHT}px`;
  return rim;
}

function buildRow(contributor, index) {
  const row = document.createElement('div');
  row.className = 'container checkin-row';
  if (index % 2 === 1) row.classList.add('checkin-row-reverse');

  const avatar = document.createElement('div');
  avatar.className = 'checkin-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = contributor.initials;

  const info = document.createElement('div');
  info.className = 'checkin-info';

  const title = document.createElement('p');
  title.className = 'checkin-title';
  title.textContent = 'Kueh Machine';

  const byline = document.createElement('p');
  byline.className = 'checkin-byline';
  byline.textContent = `by ${contributor.name}`;

  const desc = document.createElement('p');
  desc.className = 'checkin-desc';
  desc.textContent = contributor.desc;

  info.append(title, byline, desc);
  row.append(buildEmptyWindow(), avatar, info);
  return row;
}

export function init() {
  const checkin = document.getElementById('check-in');
  const collapse = checkin && checkin.querySelector('.check-in-collapse');
  if (!collapse) return;

  collapse.appendChild(buildSeam());
  CONTRIBUTORS.forEach((contributor, i) => {
    collapse.appendChild(buildRow(contributor, i));
    collapse.appendChild(buildSeam());
  });
}
