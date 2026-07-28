// Organism: the Check In section's row list — one row per contributor
// (avatar, title/byline/description, and a placeholder "window" element),
// each pair separated by a full-bleed horizontal seam. Placeholder content
// for now (15 rows, real names, most still awaiting a submitted project) —
// the section itself is revealed by src/organisms/scissors-cut.js; this
// module only builds what's inside it, and runs early enough in
// src/main.js's init order that its content exists before any reveal
// could possibly measure .check-in-collapse's real height.

import { createRetroShape } from '../atoms/retro-shape.js';
import { wrapWithInnerMatteRim } from '../atoms/matte-rim.js';
import { buildMetalSeam } from '../atoms/metal-seam.js';
import { revealWireBundle } from '../atoms/wire-bundle.js';
import { renderKuehSvg, accentForKueh } from '../atoms/kueh-icon.js';
import { KUEH_DATA, KUEH_SHAPE_TABLE } from '../data/kueh.js';

// Full team roster, alphabetical by first name. Seven real submissions so
// far (Amy, Jesslyn, Kaixin, Kevin, Ruth, Samantha, Viki) carry a real tagline;
// everyone else's desc stays "___" until their project lands — see
// scripts/add-contributor.mjs.
const CONTRIBUTORS = [
  { initials: 'AA', name: 'Amanda Ng', title: "Beary's Kueh Shop", desc: "(the one that's a ___)" },
  { initials: 'AY', name: 'Amy Fu', title: 'Gacha Cacha Kueh', desc: "(the one you crack for a Kueh surprise)", url: '/machines/amy/', windowDecors: [{ src: 'images/checkin/bird-amy.svg', position: 'bottom-right' }] },
  { initials: 'GE', name: 'Geraldine Chua', desc: "(the one that's a ___)" },
  {
    initials: 'JN',
    name: 'Jesslyn Teo',
    title: 'A Day For Me',
    desc: "(the one that's a birthday budget planner)",
    url: '/machines/jesslyn/',
    windowDecors: [{ src: 'images/checkin/pow-jesslyn.svg', position: 'top-right' }],
  },
  { initials: 'KC', name: 'Kaixin Cai', title: 'Kara-o-kueh', desc: "(the one that's very punny)" },
  {
    initials: 'KN',
    name: 'Ken Lee',
    title: 'Gatcha-Kueh',
    desc: "(the one you pull, reveal, and collect)",
    url: '/machines/ken/',
    windowDecors: [{ src: 'images/checkin/ondeh-ken.svg', position: 'bottom-right-crop' }],
  },
  { initials: 'KD', name: 'Kevin Dreher', desc: "(the one that's a Singlish translation app)" },
  {
    initials: 'LW',
    name: 'Li Wei Lim',
    title: 'Lapis',
    desc: "(the one that's a snake game)",
    url: '/machines/liwei/',
    windowDecors: [{ src: 'images/checkin/snake-peek.gif', position: 'top-left' }],
  },
  { initials: 'MJ', name: 'Mei Jun Chew', desc: "(the one that's a taste of home)" },
  { initials: 'NA', name: 'Natalia Lionardy', title: 'Care Island', desc: "(the one where you watch today's scene come alive)", url: '/machines/natalia/' },
  { initials: 'NE', name: 'Nicole Ng', desc: "(the one that's a ___)" },
  {
    initials: 'RY',
    name: 'Ruth Yong',
    title: 'Kueh Bakery',
    desc: "(the one that's a stacking game)",
    url: '/machines/ruth/',
    windowDecors: [
      { src: 'images/checkin/string-lights.svg', position: 'top', inline: true },
      { src: 'images/checkin/steam.svg', position: 'bottom', inline: true },
    ],
  },
  { initials: 'SA', name: 'Samantha Tan', title: 'Remember.fm', desc: "(the one that's nostalgic)" },
  { initials: 'SO', name: 'Sophia Himawan', desc: "(the one that's a ___)" },
  {
    initials: 'VI',
    name: 'Viki Yap',
    title: 'Kueh Machine Design Studio',
    desc: "(the one that turns your kueh ideas into reality)",
    url: '/machines/viki/',
    windowDecors: [{ src: 'images/checkin/akk-viki.png', position: 'bottom-left' }],
  },
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
// .checkin-window-outlet is sized to exactly this fraction of the window
// box (CSS) — with that fixed, randomizing its CENTER point uniformly
// across the full 0%-100% of the box naturally yields the requested
// "100% shown (dead center) down to 50% peeking out (center flush with an
// edge)" range with no separate min/max math: at OUTLET_SIZE_PCT 60, a
// center at the 0%/100% edge puts exactly half the image's own width/
// height past that edge, and clip-path (already on fillWrap, from
// createRetroShape below) crops whatever falls outside for free.
const OUTLET_SIZE_PCT = 60;

// The bottom edge is the one direction that isn't allowed the full 50%
// peek — capped to at most 25% of the outlet's own height hanging off the
// bottom. Solving centerY + OUTLET_SIZE_PCT/2 * (peek fraction) <= 100 for
// the max fraction of the box's own height a center-Y can reach, at the
// default OUTLET_SIZE_PCT 60 this works out to a max top of 85% (vs. 100%
// for the other three edges).
const OUTLET_MAX_BOTTOM_PEEK = 0.25;
const OUTLET_MAX_TOP_PCT = 100 - OUTLET_SIZE_PCT * (0.5 - OUTLET_MAX_BOTTOM_PEEK);

// Wire bundles draw themselves in (revealWireBundle's own stroke-draw
// animation) the first time their mount actually scrolls into view, not
// eagerly at build time — same "only exists once it's been scrolled to"
// timing src/organisms/batik-accents.js already uses for the brief-section
// margins, and for the same reason: a fixed-duration draw-in played while
// the element is still off-screen (or, here, while the whole section is
// still collapsed to height: 0) would finish invisibly and just appear
// fully-drawn once you actually reach it. One shared observer for every
// window + both margins rather than one per mount.
//
// threshold: 0 (any pixel visible), not the more typical 0.2 — the margin
// mounts are as tall as the whole check-in section (thousands of px, and
// only growing as more contributors join), so a fraction-of-target
// threshold like 0.2 demands 20% of THAT full height be on-screen
// simultaneously, which can exceed a normal viewport entirely. 0.2 was
// fine for the per-window mounts (~100-180px) it was tuned against; 0
// serves both sizes correctly, at the cost of the (imperceptible) window
// reveal now starting a few px earlier than before.
let wireObserver = null;
const wireQueue = new WeakMap(); // mount -> { beforeNode, options }

// A mount whose `options` is a function (the margins below, via
// marginWireOptions) needs its real rendered size measured at reveal time
// — but the check-in section reveals by animating .check-in-collapse's
// height from 0 to its target over a CSS transition (scissors-cut.js's
// revealCheckin), and .checkin-margin's own height is derived from that
// (top/bottom offsets against the growing section). Measuring too early
// bakes a wrong height into the built SVG's viewBox — the graphic is sized
// via width/height: 100% with no aspect-ratio correction, so once the
// section later reaches its real full height, the already-built graphic
// stretches vertically to match, distorting every bundle position and the
// organizer clips along with it.
//
// Two things have to both be true before it's safe to measure, not just
// one:
// 1. The reveal has actually been TRIGGERED. Before that, the margin is
//    NOT at height 0 — .checkin-margin's top/bottom: -60px offsets against
//    .check-in-section give it a small but non-zero height even while
//    .check-in-collapse itself sits at height: 0, and that sliver can
//    already be scrolled into view (IntersectionObserver's threshold: 0
//    fires on the very first visible pixel) long before anything actually
//    triggers the reveal. Waiting only for "size stopped changing" isn't
//    enough on its own — that idle collapsed sliver IS a stable size, just
//    the wrong one. #check-in's own aria-hidden (removed by scissors-
//    cut.js's revealCheckin/runSequenceReduced, exactly when the reveal
//    actually fires) is the real, purpose-built signal for this — not
//    something this module has to infer from layout.
// 2. Once triggered, the height transition itself needs to actually
//    finish — waited out here via a ResizeObserver settle-check (no
//    further resize for SETTLE_MS) rather than coupling to scissors-
//    cut.js's own transition duration/easing directly.
const SETTLE_MS = 150;

function whenRevealed(cb) {
  const section = document.getElementById('check-in');
  if (!section || !section.hasAttribute('aria-hidden')) {
    cb();
    return;
  }
  const mo = new MutationObserver(() => {
    if (!section.hasAttribute('aria-hidden')) {
      mo.disconnect();
      cb();
    }
  });
  mo.observe(section, { attributes: true, attributeFilter: ['aria-hidden'] });
}

function whenSizeSettles(el, cb) {
  let timer = null;
  const ro = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      ro.disconnect();
      cb();
    }, SETTLE_MS);
  });
  ro.observe(el);
}

function getWireObserver() {
  if (!wireObserver) {
    wireObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          wireObserver.unobserve(entry.target);
          const queued = wireQueue.get(entry.target);
          if (typeof queued?.options === 'function') {
            whenRevealed(() => {
              whenSizeSettles(entry.target, () => {
                revealWireBundle(entry.target, queued.beforeNode ?? null, queued.options());
              });
            });
          } else {
            revealWireBundle(entry.target, queued?.beforeNode ?? null, queued?.options);
          }
        });
      },
      { threshold: 0 }
    );
  }
  return wireObserver;
}

// `options` may be a function instead of a plain object — resolved lazily
// at actual reveal time (once the mount is intersecting, so definitely
// laid out), for a caller that needs to measure the mount's own real
// rendered size first (the margin strips below: their height is entirely
// content-driven, so there's no fixed size to hand over up front the way
// the per-window bundles have).
function scheduleWireReveal(mount, beforeNode, options) {
  if (!('IntersectionObserver' in window)) {
    revealWireBundle(mount, beforeNode ?? null, typeof options === 'function' ? options() : options);
    return;
  }
  wireQueue.set(mount, { beforeNode: beforeNode ?? null, options });
  getWireObserver().observe(mount);
}

function buildEmptyWindow(contributor) {
  const fillWrap = document.createElement('div');
  fillWrap.className = 'checkin-window-fill';
  // Darker than the outlet graphic's own tones (styles/tokens.css:
  // --metal-shadow alone is #34363d, lighter than the outlet's mid grays)
  // so the outlet reads as sitting IN a recessed socket, not blending into
  // a same-toned backdrop — unlike this window's usual fill (see the
  // module comment above), which deliberately matches the section's own
  // background now that there's real content to contrast against instead.
  const { svg, clipUrl, ...refs } = createRetroShape({ fill: 'color-mix(in srgb, var(--metal-shadow) 55%, black)' });
  fillWrap.appendChild(svg);
  fillWrap.style.clipPath = clipUrl;

  // The socket each contributor's own kueh machine will eventually "plug
  // into" — a plain sibling of the fill SVG above, so it paints in normal
  // stacking order above .retro-shape-fill's own z-index: -1 (styles/
  // atoms.css) without needing a z-index of its own. Random per row (not
  // just once globally) so repeat rows don't all peek out the same way.
  const outlet = document.createElement('img');
  outlet.className = 'checkin-window-outlet';
  outlet.src = 'images/checkin/outlet.svg';
  outlet.alt = '';
  outlet.setAttribute('aria-hidden', 'true');
  outlet.style.width = `${OUTLET_SIZE_PCT}%`;
  outlet.style.height = `${OUTLET_SIZE_PCT}%`;
  outlet.style.left = `${Math.random() * 100}%`;
  outlet.style.top = `${Math.random() * OUTLET_MAX_TOP_PCT}%`;
  fillWrap.appendChild(outlet);

  // Loose cabling glimpsed behind the panel — drawn in (see
  // scheduleWireReveal above) the moment this window scrolls into view,
  // landing between the fill and the outlet (outlet as `beforeNode`) so it
  // paints above the fill but the outlet still paints in front of it,
  // reading as mounted ON the panel with wiring visible around/behind it,
  // not the other way round. TEMP: shown unconditionally on every row,
  // including still-placeholder ones, so the generative pattern itself can
  // be reviewed across all 15 windows at once — restricting it to only
  // rows with a real submitted tagline (once there's an actual "machine"
  // to read as plugged in) is a follow-up, not decided yet.
  scheduleWireReveal(fillWrap, outlet);

  // One-off decorative extras some contributors' rows carry (right now:
  // Amy's bird, Ruth's string lights + rising steam, Jesslyn's wobbling
  // cake — contributor.windowDecors) — each appended last so it paints in
  // front of the outlet/wires rather than getting lost behind them.
  // fillWrap's own clip-path (set above) still crops it to the window's
  // shape like everything else in here. `position` on each spec picks
  // which placement modifier (styles/organisms/check-in.css's own
  // .checkin-window-decor--*) it gets.
  //
  // Three ways a spec can render:
  // - `emoji`: plain text (e.g. Jesslyn's cake), not a drawn asset at all.
  // - `src` + `inline: true`: the SVG's own markup is fetched and injected
  //   (wrapper.innerHTML), not loaded as an <img> — Ruth's two SMIL-
  //   animated decors (string lights, steam) need this; a SIL animation
  //   inside an <img src="...svg"> visibly stutters in most browsers
  //   (the image is treated as a periodically-repainted resource, not a
  //   live part of the render tree, the way an inline <svg> is), where
  //   the exact same markup animates smoothly once it's actually in the
  //   DOM instead of referenced as an external image.
  // - plain `src`: a static (non-animated) <img> — Amy's bird, which has
  //   nothing to animate and so has no reason for the extra fetch.
  for (const decorSpec of contributor?.windowDecors ?? []) {
    const className = `checkin-window-decor checkin-window-decor--${decorSpec.position}`;
    if (decorSpec.emoji) {
      const decor = document.createElement('span');
      decor.className = className;
      decor.setAttribute('aria-hidden', 'true');
      decor.textContent = decorSpec.emoji;
      fillWrap.appendChild(decor);
    } else if (decorSpec.inline) {
      const wrapper = document.createElement('div');
      wrapper.className = className;
      wrapper.setAttribute('aria-hidden', 'true');
      fillWrap.appendChild(wrapper);
      fetch(decorSpec.src)
        .then((res) => res.text())
        .then((svgText) => {
          wrapper.innerHTML = svgText;
          const svgEl = wrapper.querySelector('svg');
          if (!svgEl) return;
          // Let the wrapper's own CSS size drive it (width/height, set by
          // the --top/--bottom modifiers) instead of the file's own fixed
          // pixel width/height attributes.
          svgEl.removeAttribute('width');
          svgEl.removeAttribute('height');
          svgEl.setAttribute('preserveAspectRatio', decorSpec.position === 'bottom' ? 'xMidYMid slice' : 'xMidYMid meet');
        });
    } else {
      const decor = document.createElement('img');
      decor.className = className;
      decor.src = decorSpec.src;
      decor.alt = '';
      decor.setAttribute('aria-hidden', 'true');
      fillWrap.appendChild(decor);
    }
  }

  const { el: rim } = wrapWithInnerMatteRim(fillWrap, { gutter: 0, n: 8, fillRefs: refs });

  // Only contributors with an actual deployed machine (right now: Amy,
  // Jesslyn, Ruth, via vercel.json's per-contributor rewrites) get a
  // clickable window — everyone
  // else's `url` is unset, so their window stays the plain non-interactive
  // div it always was. .rim-matte-inner's own width/height: 100% (styles/
  // atoms.css) means `rim` fills whichever wrapper ends up holding the
  // fixed .checkin-window size/dimensions below, link or not.
  const windowEl = contributor?.url ? document.createElement('a') : document.createElement('div');
  windowEl.className = 'checkin-window';
  windowEl.style.height = `${WINDOW_HEIGHT}px`;
  if (contributor?.url) {
    windowEl.href = contributor.url;
    windowEl.target = '_blank';
    windowEl.rel = 'noopener noreferrer';
    windowEl.setAttribute('aria-label', `Open ${contributor.name}'s Kueh Machine`);
  }
  windowEl.appendChild(rim);
  return windowEl;
}

function buildRow(contributor, index) {
  const row = document.createElement('div');
  row.className = 'container checkin-row';
  if (index % 2 === 1) row.classList.add('checkin-row-reverse');

  // One of the Kueh of the Day icon templates (src/atoms/kueh-icon.js),
  // each in that specific kueh's own color palette rather than a shared
  // site color — cycling through KUEH_DATA by row index (not random) so a
  // given contributor's icon stays stable across reloads, matching the
  // avatar's usual role as a fixed identity marker. Background is that
  // same kueh's own accentForKueh — the exact color its badge would use
  // on kueh-of-day.js's own tag (.kod-tag-icon-face's `background:
  // var(--color-accent)`), just resolved per-icon instead of read off the
  // page-wide (and here, wrong-kueh) --color-accent custom property.
  const avatar = document.createElement('div');
  avatar.className = 'checkin-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  const kueh = KUEH_DATA[index % KUEH_DATA.length];
  avatar.innerHTML = renderKuehSvg(kueh, KUEH_SHAPE_TABLE[kueh.id] || 'disc', AVATAR_HEIGHT);
  avatar.style.background = accentForKueh(kueh);

  const info = document.createElement('div');
  info.className = 'checkin-info';

  const title = document.createElement('p');
  title.className = 'checkin-title';
  title.textContent = contributor.title ?? 'Kueh Machine';

  const byline = document.createElement('p');
  byline.className = 'checkin-byline';
  byline.textContent = `by ${contributor.name}`;

  const desc = document.createElement('p');
  desc.className = 'checkin-desc';
  desc.textContent = contributor.desc;

  info.append(title, byline, desc);
  row.append(buildEmptyWindow(contributor), avatar, info);
  return row;
}

// The margin strips' own height is entirely content-driven (styles/
// organisms/check-in.css: top/bottom, not a fixed height — stretches to
// match .check-in-section's real height, however many rows that ends up
// being), so unlike the per-window bundles there's no fixed size to hand
// buildWireBundle up front. Instead each margin's options are resolved
// lazily (see scheduleWireReveal) once it's actually laid out: viewHeight
// matches its real aspect ratio (so sag/bleed/stroke-width, all tuned in
// viewBox units, read at a consistent scale rather than stretching thin
// down a tall narrow strip), and bundleCount scales with real height at a
// deliberately sparse ratio — one bundle per ~400px — rather than the
// per-window density, since a solid wall of cable the full height of the
// section would overwhelm the rows it's meant to sit behind.
const MARGIN_PX_PER_BUNDLE = 400;

function marginWireOptions(mount) {
  // The margin's INNER edge (facing the row content) is the one side that
  // doesn't actually leave the visible page the way top/bottom/outer do —
  // those are hard-clipped by .check-in-section's own overflow:hidden a
  // few px past the margin's own edge, but the inner edge only bleeds a
  // short way into the visible gutter (styles/organisms/check-in.css's own
  // overflow:visible comment) before just stopping in open space. Passing
  // which side that is lets buildWireBundle route those strands through a
  // marked junction node instead (see its own comment) — left margin's
  // inner side faces right, right margin's faces left.
  const innerSide = mount.classList.contains('checkin-margin-left') ? 'right' : 'left';
  return () => {
    const { width, height } = mount.getBoundingClientRect();
    return {
      viewHeight: Math.round(100 * (height / width)),
      bundleCount: Math.max(3, Math.round(height / MARGIN_PX_PER_BUNDLE)),
      innerSide,
      // The per-window graphics draw fine at revealWireBundle's own base
      // speed, but a margin strip covers many times the real on-screen
      // distance at that same viewBox-unit speed, which reads as rushed —
      // slowed down here rather than in the shared default so the window
      // graphics stay untouched.
      speedScale: 2.6,
    };
  };
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

  checkin.querySelectorAll('.checkin-margin').forEach((mount) => {
    scheduleWireReveal(mount, null, marginWireOptions(mount));
  });
}
