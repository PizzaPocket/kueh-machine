// Atom: the water clock's own "drop just released" reaction — a little
// burst of bubbles rising from the spout, like the vacuum-draw effect of
// pulling liquid from the bottom of a water-cooler tank. Same "pure DOM-
// wiring" role src/atoms/liquid-ripple.js plays for the glass's own splash/
// ripple system; src/tokens/liquid-bubbles.js holds the tuning this module
// animates with.
//
// Stateless (unlike createLiquidRipple) — there's no live moving reference
// to track between calls, so a single spawnBubbleBurst(container) call is
// all a caller needs, fired once per drop release.
//
// Because .countdown-liquid (the container passed in) already carries a
// bottom-up mask-image revealing it to the current water level, the rising
// stage below gets clipped to the real submerged portion for free just by
// living inside it. But that same mask hard-clips anything above the fill
// line — so once a bubble reaches the surface, it's moved out to
// .countdown-liquid's own (unmasked) parent for its last bit of float +
// pop, or that moment would just vanish invisibly instead of being seen
// poking above the water.

import {
  BUBBLE_COUNT_MIN,
  BUBBLE_COUNT_RANGE,
  BUBBLE_STAGGER_MAX_MS,
  BUBBLE_SIZE_MIN_PX,
  BUBBLE_SIZE_RANGE_PX,
  BUBBLE_SPEED_PX_PER_MS_MIN,
  BUBBLE_SPEED_PX_PER_MS_RANGE,
  BUBBLE_DUR_MIN_MS,
  BUBBLE_DUR_MAX_MS,
  BUBBLE_SPAWN_SPREAD_PX,
  BUBBLE_WOBBLE_PX,
  BUBBLE_RISE_OPACITY,
  BUBBLE_FLOAT_ABOVE_FRACTION,
  BUBBLE_POP_DURATION_MS,
  BUBBLE_POP_SCALE,
} from '../tokens/liquid-bubbles.js';

// container's inline --liquid-fill (set every tick by index.html's
// updateLiquidFill/rippleLiquid) is the live water level, as a percentage
// of the container's own height — reading it here is what lets a bubble's
// rise distance track the real surface instead of a fixed guess.
function liquidHeightPx(container) {
  const raw = container.style.getPropertyValue('--liquid-fill');
  const fillPercent = parseFloat(raw);
  return ((Number.isFinite(fillPercent) ? fillPercent : 50) / 100) * container.clientHeight;
}

function spawnBubble(container, originX, originY, liquidHeight) {
  const size = BUBBLE_SIZE_MIN_PX + Math.random() * BUBBLE_SIZE_RANGE_PX;
  const rise = liquidHeight; // the submerged stage: all the way to the real surface
  const floatAbove = liquidHeight * BUBBLE_FLOAT_ABOVE_FRACTION; // then a touch further, poking above it, before popping
  const speed = BUBBLE_SPEED_PX_PER_MS_MIN + Math.random() * BUBBLE_SPEED_PX_PER_MS_RANGE;
  const duration = Math.min(BUBBLE_DUR_MAX_MS, Math.max(BUBBLE_DUR_MIN_MS, rise / speed));
  const startX = originX + (Math.random() * 2 - 1) * BUBBLE_SPAWN_SPREAD_PX;
  const wobbleDir = Math.random() < 0.5 ? -1 : 1;
  const wobble = BUBBLE_WOBBLE_PX * (0.5 + Math.random() * 0.5);
  const driftX = wobbleDir * wobble * 0.3; // final horizontal drift, carried through into the float/pop stage too

  const bubble = document.createElement('div');
  bubble.className = 'countdown-liquid-bubble';
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${startX - size / 2}px`;
  bubble.style.top = `${originY - size / 2}px`;
  container.appendChild(bubble);

  // Rising: fades in quickly, then holds a steady opacity all the way up —
  // no fade-out here, since these bubbles pop at the surface rather than
  // dissolving mid-rise. fill: 'forwards' holds the risen position/opacity
  // so the float/pop stage below has something to animate from.
  const rising = bubble.animate(
    [
      { transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
      { transform: `translate(${(wobbleDir * wobble).toFixed(1)}px, ${(-rise * 0.4).toFixed(1)}px) scale(1)`, opacity: BUBBLE_RISE_OPACITY, offset: 0.2 },
      { transform: `translate(${(-wobbleDir * wobble * 0.6).toFixed(1)}px, ${(-rise * 0.75).toFixed(1)}px) scale(1.05)`, opacity: BUBBLE_RISE_OPACITY, offset: 0.75 },
      { transform: `translate(${driftX.toFixed(1)}px, ${(-rise).toFixed(1)}px) scale(1.1)`, opacity: BUBBLE_RISE_OPACITY },
    ],
    { duration, easing: 'ease-out', fill: 'forwards' }
  );

  rising.onfinish = () => {
    // .countdown-liquid's own mask-image hard-clips anything above the
    // current fill line, so moving to its parent for this last bit is
    // what makes "poking above the surface" actually visible instead of
    // vanishing right at the boundary. Their boxes align 1:1 (both
    // position:absolute; inset:0 off .countdown-viewport), so the
    // current left/top + the rise/drift already applied carries over
    // unchanged — only the transform needs resetting to the equivalent
    // static offset now that it's baked into left/top instead.
    bubble.style.left = `${parseFloat(bubble.style.left) + driftX}px`;
    bubble.style.top = `${parseFloat(bubble.style.top) - rise}px`;
    bubble.style.transform = 'scale(1.1)';
    container.parentNode.appendChild(bubble);

    const pop = bubble.animate(
      [
        { transform: 'scale(1.1) translateY(0)', opacity: BUBBLE_RISE_OPACITY },
        { transform: `scale(${BUBBLE_POP_SCALE}) translateY(${(-floatAbove).toFixed(1)}px)`, opacity: 0 },
      ],
      { duration: BUBBLE_POP_DURATION_MS, easing: 'ease-out' }
    );
    pop.onfinish = () => bubble.remove();
  };
}

/**
 * Spawns a randomized burst of little bubbles rising from `container`'s own
 * bottom-center (the water clock's spout, in `.countdown-liquid`'s own box
 * coordinates — see this module's header for why no funnel-geometry math
 * is needed to find that point). Call once per drop release.
 */
export function spawnBubbleBurst(container) {
  const originX = container.clientWidth / 2;
  const originY = container.clientHeight;
  const liquidHeight = liquidHeightPx(container);
  const count = BUBBLE_COUNT_MIN + Math.floor(Math.random() * (BUBBLE_COUNT_RANGE + 1));

  for (let i = 0; i < count; i++) {
    const delay = Math.random() * BUBBLE_STAGGER_MAX_MS;
    setTimeout(() => spawnBubble(container, originX, originY, liquidHeight), delay);
  }
}
