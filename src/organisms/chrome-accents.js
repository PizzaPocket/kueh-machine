// Organism: applies the "liquid chrome" treatment (src/tokens/chrome-metal.js)
// to the static decorative elements that aren't owned by another organism —
// the "Machine" wordmark and the guide section's step-cards — plus a single
// blanket sweep that wires up every .text-sheen/.icon-sheen element on the
// page (however it got rendered — static HTML, or dynamic markup from
// another organism/molecule/atom) for the cursor-Y-tracking light accent.
// Centralizing that sweep here, run last (see main.js), means individual
// atoms/organisms that use .text-sheen/.icon-sheen don't each need their own
// registration call and can't accidentally double-register the same
// element. .tab-group-rim is handled inside tab-group.js, the site-nav
// divider inside site-nav.js, since those are real conic-chrome rims, not
// the sheen accent. Kueh of the Day (kueh-of-day.js) dropped its own
// chrome rim in favor of retro-rectangle shapes (src/atoms/retro-shape.js).
// Both wordmarks' rims (.chrome-text-rim, index.html) used to be static
// CSS gradients — "Machine"'s a plain linear-gradient, "Kueh"'s two
// (inner + a thicker outer) added later. All four are wired up here now
// instead, as real conic-gradients (computeConicChromeLayers — same
// helper every other chrome rim on the site uses), since a text-clipped
// conic-gradient sweeps as one coherent band across the whole word rather
// than a flat diagonal streak. Fixed --chrome-angle per layer (not
// registered for cursor rotation, unlike most other conic rims on the
// site) — see WORDMARK_RIM_OUTER_ANGLE below for why.

import { applyLayeredConicChrome, computeConicChromeLayers, registerForSheen, applyIconFillSheen } from '../tokens/chrome-metal.js';
import { attachRetroShapeClip, SMALL_RETRO_SHAPE_OPTS } from '../atoms/retro-shape.js';

// Peaks shared by both wordmarks' rims — matches housing-frame.js's own
// DEFAULT_PEAKS, an irregular (not evenly spaced) sweep so a static,
// non-rotating conic doesn't read as too mechanical.
const WORDMARK_RIM_PEAKS = [40, 165, 250];
// Offset applied to any rim carrying .chrome-text-rim--outer, on top of
// the inner rim's own (default, 0deg) --chrome-angle — same "two rings,
// deliberately different" idea as housing-frame.js's own accentAngle
// default, so the two sweeps visibly disagree instead of lining up into
// what would just read as one thicker band.
const WORDMARK_RIM_OUTER_ANGLE = 55;

// Rims carrying .chrome-text-rim--themed (all of "Kueh"'s, plus
// "Machine"'s thick outer one): same color approach as the water clock's
// outer housing frame (HOUSING_DARK/HOUSING_LIGHT, countdown-clock.js) —
// the day's theme color mixed toward black/white, rather than the neutral
// metal-base/metal-highlight pair computeConicChromeLayers defaults to.
// Dark stop is 90% toward the theme color (not HOUSING_DARK's own 85%) —
// color-mix's first percentage is how much of *that* color survives, so a
// higher number here means less black mixed in, i.e. a lighter dark floor.
// The housing sits on the dark hero background, where crushing all the
// way toward black still reads as lit metal; these rims sit right next to
// "Kueh"'s own lighter .layered-k fill (or "Machine"'s own thin metal
// inner rim), where that same floor read as too close to just black,
// losing the metal read at the shadow end of the sweep. Light stop is 93%
// toward the theme color for the mirrored reason: less white mixed in
// means a dimmer, less blown-out highlight peak.
const KUEH_RIM_DARK = 'color-mix(in srgb, var(--color-primary-strong) 90%, black)';
const KUEH_RIM_LIGHT = 'color-mix(in srgb, var(--color-primary-strong) 93%, white)';

// Rims carrying .chrome-text-rim--metal ("Machine"'s thin inner rim only,
// currently): the exact same two color-mix stops .rim-matte-inner (styles/
// atoms.css) uses — the Kueh of the Day panel windows' own bezel — rather
// than a from-scratch black/white mix. A bespoke 90%/93%-toward-black/white
// pair (matching KUEH_RIM_DARK/LIGHT's own approach, just anchored to
// --metal-base) read as a mismatched shade of gray next to
// .chrome-text-fill, which is itself built from --metal-base by way of
// .matte-metal-surface's recipe (index.html) — reusing .rim-matte-inner's
// literal stops instead keeps every "neutral matte metal" surface on the
// site (this rim, the fill, the KOTD bezel) drawing from one shared
// palette rather than three independently-tuned near-matches.
// 60% toward white, not .rim-matte-inner's own 45% — darkened further so
// the baseline band itself sits noticeably below the highlight peak,
// rather than the two reading close together at this small a scale.
const MACHINE_RIM_DARK = 'color-mix(in srgb, var(--metal-base) 60%, white)';
// 55% toward --metal-highlight, not .rim-matte-inner's own 88% (already
// brought down to 70% once) — a rim this small reads its highlight peak
// at a much smaller scale than the KOTD bezel's own wide band, where 88%
// first got tuned; brought down further here so the peak doesn't blow
// out to near-white against the word's own dimmer .chrome-text-fill.
const MACHINE_RIM_LIGHT = 'color-mix(in srgb, var(--metal-highlight) 55%, var(--metal-base))';

// Step-cards are much wider than tall, the same situation timeline-panel.js's
// own thin windows are in — solveClearingExponent's auto content-clearance
// solve pushes toward the rectangular ceiling on a box this shape, so this
// uses the same fixed, deliberately round exponent instead (gutter: 0 since
// these nest flush inside .steps-list, no floating breathing room needed).
// One shared opts object for the card/glint-band/fill trio, so all three
// solve to the exact same curve rather than each drifting independently.
const STEP_CARD_SHAPE_OPTS = { gutter: 0, n: 8 };

export function init() {
  // Each step-card gets its own independently-randomized glints (real
  // per-element randomness, not a shared pattern trying to fake 8 rows
  // looking distinct). .step-card is the outer metal band; its original
  // children (heading, body, icon — see index.html) move into a new
  // .step-card-fill div, which applyLayeredConicChrome nests inside the
  // auto-inserted .chrome-rim-glint band — same three-element pattern
  // .tab-group-rim uses, just built here since step-cards are static HTML
  // rather than JS-rendered content. Reshaped to the retro-rectangle
  // silhouette (retro-shape.js), same as every other chrome-banded control
  // on the site (.btn-rim/.chrome-rim-glint/.btn, src/atoms/button.js).
  document.querySelectorAll('.step-card').forEach((card) => {
    const fill = document.createElement('div');
    fill.className = 'step-card-fill';
    while (card.firstChild) fill.appendChild(card.firstChild);
    const glintBand = applyLayeredConicChrome(card, fill, { peaks: [60, 180, 300] });
    attachRetroShapeClip(card, STEP_CARD_SHAPE_OPTS);
    attachRetroShapeClip(glintBand, STEP_CARD_SHAPE_OPTS);
    attachRetroShapeClip(fill, STEP_CARD_SHAPE_OPTS);
  });

  // Download CLAUDE.md button — same small-control retro-rectangle shape
  // as .btn/.tab (SMALL_RETRO_SHAPE_OPTS). Used to have a plain 1px CSS
  // border for definition, but a straight border stroke doesn't follow a
  // clip-path'd corner's curve (it just gets cut off at an angle, reading
  // as a bug rather than a rounded edge) — so this splits into the same
  // flat two-layer rim/fill nest .step-card uses, minus the chrome glint
  // band: .file-card becomes the outer rim (a solid-color band, its
  // thickness set by padding), its original children move into a new
  // .file-card-fill div nested inside, and both get their own matching
  // clip-path so the "border" is really the rim color showing through the
  // gap between the two clipped shapes — same trick .btn-rim/.btn use for
  // their chrome ring.
  document.querySelectorAll('.file-card').forEach((card) => {
    const fill = document.createElement('div');
    fill.className = 'file-card-fill';
    while (card.firstChild) fill.appendChild(card.firstChild);
    card.appendChild(fill);
    attachRetroShapeClip(card, SMALL_RETRO_SHAPE_OPTS);
    attachRetroShapeClip(fill, SMALL_RETRO_SHAPE_OPTS);
  });

  // Leveling Up's "n00b level" badges (.n00b-pill, index.html) — same
  // small-control shape as .btn/.tab/.file-card above, but no rim/fill
  // split needed: unlike .tab (background lives on a sibling .tab-fill),
  // .n00b-pill already paints its own flat background directly, so this
  // is the plain "just reshape this element's own silhouette" case
  // attachRetroShapeClip's own doc comment describes (retro-shape.js).
  document.querySelectorAll('.n00b-pill').forEach((pill) => {
    attachRetroShapeClip(pill, SMALL_RETRO_SHAPE_OPTS);
  });

  // Wordmark rims: two text-clipped conic sweeps per word (see the
  // constants above), using computeConicChromeLayers's metal output only
  // — no glints — matching housing-frame.js's own outer housing (same
  // flat/static-material look, not the sparkly interactive rim treatment
  // buttons/tabs get). Whether a given rim is the thin inner layer or the
  // thick outer one — and therefore whether it gets
  // WORDMARK_RIM_OUTER_ANGLE on top of --chrome-angle's own 0deg initial
  // value (styles/tokens.css) — comes from whether it also carries
  // .chrome-text-rim--outer; color source comes from which of --themed/
  // --metal it carries. Every rim carries exactly one of those two, so
  // this covers both wordmarks' inner *and* outer layers in one pass.
  const wireWordmarkRim = (darkVar, lightVar) => (el) => {
    const { metal } = computeConicChromeLayers(WORDMARK_RIM_PEAKS, { darkVar, lightVar });
    el.style.backgroundImage = metal;
    if (el.classList.contains('chrome-text-rim--outer')) {
      el.style.setProperty('--chrome-angle', `${WORDMARK_RIM_OUTER_ANGLE}deg`);
    }
  };
  document.querySelectorAll('.chrome-text-rim--themed').forEach(wireWordmarkRim(KUEH_RIM_DARK, KUEH_RIM_LIGHT));
  document.querySelectorAll('.chrome-text-rim--metal').forEach(wireWordmarkRim(MACHINE_RIM_DARK, MACHINE_RIM_LIGHT));

  document.querySelectorAll('.text-sheen').forEach((el) => registerForSheen(el));
  document.querySelectorAll('.icon-sheen').forEach((el) => applyIconFillSheen(el));
}
