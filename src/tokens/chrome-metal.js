// "Liquid chrome" treatment — a conic-gradient rim (a single 360deg sweep,
// so nothing tiles/repeats and there's no seam math to get right) applied
// uniformly to every chrome element, whatever its shape: a pill (tab-group),
// a card, a divider line, text, a wide short row (step-cards). An earlier
// version split closed shapes (conic) from open/thin ones (a separate
// one-shot linear-gradient code path) on the assumption that conic would
// look distorted on an extreme aspect ratio — that was never actually
// verified, just assumed, and wasn't worth the doubled code path. Every
// element is a rectangle with a real center; conic-gradient already
// defaults to centering at 50%/50% of the box, which is the center of mass
// for a uniform rectangle regardless of how stretched it is — though where
// the gradient's own center sits and where the rotation loop looks at the
// cursor from are two independent things (see `center` below vs. the
// rotation loop's cx/cy).
//
// Ported from the wip/liquid-metal-buttons.html reference and adapted to
// this site's token system: hardcoded grays/hues become our semantic color
// tokens (so the metal retheme with the day's kueh), and glints only ever
// use --color-accent/--color-highlight rather than arbitrary generated
// hues, so a sparkle always belongs to today's palette. Metal tones, glint
// hues, and the gradient's own center are all real parameters (not
// hardcoded), so a future use site can reach for a different material or
// framing without editing this module.

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

// --- rotation loop, shared across every chrome element --------------------

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

function startRotationLoop() {
  if (loopStarted) return;
  loopStarted = true;
  lastScrollY = window.scrollY;

  window.addEventListener('pointermove', (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    havePointer = true;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) {
      pointerX = t.clientX;
      pointerY = t.clientY;
      havePointer = true;
    }
  }, { passive: true });

  window.addEventListener('scroll', () => {
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    scrollAngle += delta * 0.6;
  }, { passive: true });

  function tick() {
    for (const target of rotationTargets) {
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
 * whatever --chrome-angle it already has (its CSS fallback, or one set via
 * applyConicChrome's `interactive: false`) instead of animating.
 */
export function registerForRotation(el) {
  if (!el || prefersReducedMotion) return;
  rotationTargets.push({ el, current: 0 });
  startRotationLoop();
}

/**
 * Computes the two conic gradient strings (glints, metal) for a given set
 * of peaks. Exposed separately from applyConicChrome for callers that need
 * to compose the layers themselves — the step-cards, which still use the
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
 * Applies a conic "liquid chrome" rim to an element — el's own background
 * is set directly, so for a rim+fill pattern (a pill or card) el should be
 * the rim layer (its padding defines the rim thickness), not the fill.
 *
 * `targetProperty`: for a treatment actually painted on a ::after
 * pseudo-element, JS can't touch its style directly — pass a property name
 * here instead, and read it back via var() on the pseudo-element in CSS,
 * since custom properties inherit down to pseudo-elements even though
 * direct style access doesn't reach them.
 *
 * `interactive`: false gives the element a fixed --chrome-angle instead of
 * registering it for cursor/scroll rotation — for the "Machine" wordmark,
 * whose rim sits directly behind a separate solid-color fill layer at an
 * exact pixel alignment, a moving rim reads as a rendering glitch rather
 * than a reflection, since the two layers visually drift apart as one
 * rotates and the other doesn't.
 *
 * `center`: see conicOrigin() above — moves the gradient's own origin, not
 * the point the rotation loop looks at the cursor from (that's always the
 * element's real center, in the rotation loop itself).
 */
export function applyConicChrome(
  el,
  {
    peaks = [60, 180, 300],
    glintVars = DEFAULT_GLINT_VARS,
    darkVar = DEFAULT_DARK,
    lightVar = DEFAULT_LIGHT,
    center = null,
    targetProperty = null,
    interactive = true,
    fixedAngle = 0,
  } = {}
) {
  if (!el) return;
  const { metal, glints } = computeConicChromeLayers(peaks, { glintVars, darkVar, lightVar, center });
  const value = `${glints}, ${metal}`;

  if (targetProperty) el.style.setProperty(targetProperty, value);
  else el.style.backgroundImage = value;

  if (interactive) registerForRotation(el);
  else el.style.setProperty('--chrome-angle', `${fixedAngle}deg`);
}
