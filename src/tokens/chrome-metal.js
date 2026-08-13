// "Liquid chrome" treatment — a conic-gradient rim (one 360deg sweep, no
// tiling/seam math) applied uniformly to every chrome element regardless of
// shape: a pill (tab-group), a card, a divider, text, a wide short row
// (step-cards) — conic-gradient's default 50%/50% center is already the
// center of mass for any rectangle, however stretched, so there's no need
// to branch by aspect ratio. (Where the gradient's own center sits and
// where the rotation loop looks at the cursor from are two independent
// things — see `center` below vs. the rotation loop's cx/cy.)
//
// Ported from wip/liquid-metal-buttons.html and adapted to this site's
// token system: hardcoded grays/hues become semantic color tokens (so the
// metal retheme with the day's kueh), and glints only ever use
// --color-accent/--color-highlight, so a sparkle always belongs to today's
// palette. Metal tones, glint hues, and the gradient's own center are all
// real parameters, not hardcoded, so a future use site can reach for a
// different material or framing without editing this module.
//
// applyLayeredConicChrome paints glints/metal as two concentric bands — a
// wider flush-to-the-edge metal band with a thinner, more inset glint band
// nested inside it, matching how the reference's own bezel reads up close.

const DEFAULT_DARK = 'var(--color-surface-border)';
const DEFAULT_LIGHT = '#ffffff';
const DEFAULT_GLINT_VARS = ['var(--color-accent)', 'var(--color-highlight)'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Builds the events (center/width/fade/color) a glint layer is made of, in
// degrees around the 0-360 sweep.
function buildGlintEvents(peaks, glintVars) {
  const events = [];
  for (const peak of peaks) {
    if (Math.random() < 0.18) continue; // some transitions get no glint at all
    const count = Math.random() < 0.75 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const sign = Math.random() < 0.5 ? -1 : 1;
      const dist = 3 + Math.random() * 11; // 3-14deg off the peak
      const center = peak + sign * dist;
      const width = 1.5 + Math.random() * 2.5;
      const fade = 1 + Math.random() * 2.5;
      const intensity = 45 + Math.floor(Math.random() * 30); // 45-75% — toned down, not solid
      events.push({ center, width, fade, color: pick(glintVars), intensity });
    }
  }
  events.sort((a, b) => a.center - b.center);
  return events;
}

function eventsToStops(events) {
  const stops = [];
  let cursor = 0;
  for (const ev of events) {
    const fadeInStart = ev.center - ev.width / 2 - ev.fade;
    const solidStart = ev.center - ev.width / 2;
    const solidEnd = ev.center + ev.width / 2;
    const fadeOutEnd = ev.center + ev.width / 2 + ev.fade;
    if (fadeInStart <= cursor || fadeOutEnd >= 360) continue; // skip collisions/out of range
    const glintColor = `color-mix(in srgb, ${ev.color} ${ev.intensity}%, transparent)`;
    stops.push(`transparent ${fadeInStart.toFixed(1)}deg`);
    stops.push(`${glintColor} ${solidStart.toFixed(1)}deg`);
    stops.push(`${glintColor} ${solidEnd.toFixed(1)}deg`);
    stops.push(`transparent ${fadeOutEnd.toFixed(1)}deg`);
    cursor = fadeOutEnd;
  }
  return stops;
}

// `center`: the conic-gradient's own "at <position>" clause (default: CSS's
// implicit "at center", i.e. 50% 50% of the box). Pass an explicit position
// (e.g. "50% -100px") to move the gradient's origin outside the box
// entirely — the visible slice then reads as a much gentler curve, since
// it's a small arc of a much larger circle rather than a tight sweep
// through the box's own center.
function conicOrigin(angleVar, center) {
  return center ? `from var(${angleVar}) at ${center}` : `from var(${angleVar})`;
}

function buildConicMetal(darkVar, lightVar, peaks, center) {
  const step = 360 / peaks.length / 2;
  const stops = [];
  peaks.forEach((peak, i) => {
    stops.push(`${darkVar} ${(peak - step).toFixed(1)}deg`, `${lightVar} ${peak.toFixed(1)}deg`);
    const next = peaks[i + 1] ?? peaks[0] + 360;
    stops.push(`${darkVar} ${(peak + (next - peak) / 2).toFixed(1)}deg`);
  });
  return `conic-gradient(${conicOrigin('--chrome-angle', center)}, ${darkVar} 0deg, ${stops.join(', ')}, ${darkVar} 360deg)`;
}

function buildConicGlints(peaks, glintVars, center) {
  const events = buildGlintEvents(peaks, glintVars);
  const stops = eventsToStops(events);
  const origin = conicOrigin('--chrome-angle', center);
  if (stops.length === 0) return `conic-gradient(${origin}, transparent 0deg, transparent 360deg)`;
  return `conic-gradient(${origin}, transparent 0deg, ${stops.join(', ')}, transparent 360deg)`;
}

// --- shared cursor/scroll-driven loop --------------------------------------
//
// rotationTargets drives --chrome-angle, a full rotation for the metal rims
// (tab-group, step-cards, the site-nav divider) — most of what reads as
// "liquid" rather than a static metallic border. Still active on touch
// devices via scroll (see noPersistentPointer below) — scroll-linked
// rotation is a real effect there too, not a cursor stand-in.
//
// (This loop used to also drive a second, independent effect —
// --sheen-pos, a cursor-Y-tracking light accent on .text-sheen/.icon-sheen
// text and icons — removed as too distracting. .text-sheen is now a plain
// static color; see its own comment in styles/atoms.css.)
//
// This loop runs for the entire life of the page once anything registers,
// so two things keep it from being a permanent full-cost drain:
//   - A shared IntersectionObserver tracks which registered elements are
//     actually on/near screen; tick() skips getBoundingClientRect and the
//     style write entirely for everything else, since most registered
//     elements sit in sections the visitor isn't currently looking at.
//   - noPersistentPointer: on touch devices there's no persistent cursor —
//     a touch point only exists while a finger is down, and letting
//     havePointer latch true after the first touch would just freeze every
//     rim's angle at a stale point forever while still paying the per-
//     frame cost. Touch devices skip the pointer-tracking listener
//     entirely, so rotationTargets falls back to its scroll-only path.

const rotationTargets = [];
let loopStarted = false;
let pointerX = 0;
let pointerY = 0;
let havePointer = false;
let scrollAngle = 0;
let lastScrollY = 0;

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

const noPersistentPointer =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(hover: none), (pointer: coarse)').matches
    : false;

let visibilityObserver = null;
const recordsByEl = new WeakMap();

function observeVisibility(target) {
  if (typeof IntersectionObserver === 'undefined') {
    target.visible = true; // no observer support — fail open rather than never animating
    return;
  }
  if (!visibilityObserver) {
    visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const records = recordsByEl.get(entry.target);
          if (!records) continue;
          for (const record of records) record.visible = entry.isIntersecting;
        }
      },
      { rootMargin: '150px' }
    );
  }
  let records = recordsByEl.get(target.el);
  if (!records) {
    records = [];
    recordsByEl.set(target.el, records);
  }
  records.push(target);
  visibilityObserver.observe(target.el);
}

function startSharedLoop() {
  if (loopStarted) return;
  loopStarted = true;
  lastScrollY = window.scrollY;

  if (!noPersistentPointer) {
    window.addEventListener('pointermove', (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      havePointer = true;
    }, { passive: true });
  }

  window.addEventListener('scroll', () => {
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    scrollAngle += delta * 0.6;
  }, { passive: true });

  function tick() {
    for (const target of rotationTargets) {
      if (!target.visible) continue;
      const rect = target.el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let angle = scrollAngle;
      if (havePointer) {
        const dx = pointerX - cx;
        const dy = pointerY - cy;
        angle = Math.atan2(dy, dx) * (180 / Math.PI) + scrollAngle * 0.3;
      }

      const diff = ((angle - target.current + 540) % 360) - 180;
      target.current += diff * 0.08;
      target.el.style.setProperty('--chrome-angle', `${target.current}deg`);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Registers an element's --chrome-angle to be driven by cursor position and
 * scroll. A no-op under prefers-reduced-motion — the element keeps
 * whatever --chrome-angle it already has (its CSS fallback, or a fixed
 * value set directly) instead of animating.
 */
function registerForRotation(el) {
  if (!el || prefersReducedMotion) return;
  const target = { el, current: 0, visible: false };
  rotationTargets.push(target);
  observeVisibility(target);
  startSharedLoop();
}

/**
 * Computes the two conic gradient strings (glints, metal) for a given set
 * of peaks. Exposed separately for callers that need to compose the
 * layers themselves — the step-cards, which still use the
 * padding-box/border-box dual-layer trick to keep a per-card fill color,
 * and need each layer explicitly tagged border-box rather than relying on
 * background's default box per layer.
 */
export function computeConicChromeLayers(
  peaks,
  { glintVars = DEFAULT_GLINT_VARS, darkVar = DEFAULT_DARK, lightVar = DEFAULT_LIGHT, center = null } = {}
) {
  return {
    metal: buildConicMetal(darkVar, lightVar, peaks, center),
    glints: buildConicGlints(peaks, glintVars, center),
  };
}

/**
 * Wires up a two-band chrome rim: outerEl (already created by the caller,
 * with its own padding/border-radius/box-shadow — its padding is the metal
 * band's thickness, flush to the true outer edge) gets metal-only chrome;
 * a new .chrome-rim-glint element (its padding is the glint band's
 * thickness — see styles/atoms.css) is inserted between outerEl and
 * fillEl and gets glint-only chrome. Two independently-registered rotation
 * targets, so each band computes its own angle from its own (near-
 * identical) center rather than one property cascading to the other.
 *
 * Ported from a reference (wip/liquid-metal-buttons.html) where the base
 * metal shading reads as a wider band sitting flush to the outer edge,
 * with the dynamic chromatic glint as its own thinner, more inset stroke
 * nested just inside it, rather than one shared-thickness band painting
 * both layers together. Geometry (how thick each band is) stays a CSS
 * concern — this function only wires up the DOM nesting and the two paint
 * layers.
 *
 * Returns the glint band element (fillEl's new direct parent) in case a
 * caller needs to keep a handle on it; most callers can ignore the return
 * value; the DOM connection is already made.
 */
export function applyLayeredConicChrome(outerEl, fillEl, opts = {}) {
  if (!outerEl || !fillEl) return null;
  const {
    peaks = [60, 180, 300],
    glintVars = DEFAULT_GLINT_VARS,
    darkVar = DEFAULT_DARK,
    lightVar = DEFAULT_LIGHT,
    center = null,
  } = opts;

  const { metal, glints } = computeConicChromeLayers(peaks, { glintVars, darkVar, lightVar, center });

  outerEl.style.backgroundImage = metal;
  registerForRotation(outerEl);

  const glintBand = document.createElement('div');
  glintBand.className = 'chrome-rim-glint';
  glintBand.style.backgroundImage = glints;
  glintBand.appendChild(fillEl);
  outerEl.appendChild(glintBand);
  registerForRotation(glintBand);

  return glintBand;
}
