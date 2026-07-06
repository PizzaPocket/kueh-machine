// Pure tuning constants for the water clock's "drop released" bubble burst —
// same "pure math, zero coupling" role tokens/liquid-ripple.js plays for the
// glass's own splash/ripple system; src/atoms/liquid-bubbles.js is the DOM/
// animation half that consumes this.
//
// Unlike the glass (an ellipse-perspective 3D-ish surface), the water
// clock's liquid is a flat 2D mask reveal, so there's no rx/ry-fraction
// scaling to do here — every value below is already a plain pixel/ms
// constant, small enough to read as "little bubbles" rather than a
// prominent effect.

export const BUBBLE_COUNT_MIN = 4;
export const BUBBLE_COUNT_RANGE = 4; // 4-7 bubbles per burst

export const BUBBLE_STAGGER_MAX_MS = 220; // random per-bubble spawn delay, so the burst feels turbulent, not a synchronized pop

export const BUBBLE_SIZE_MIN_PX = 4;
export const BUBBLE_SIZE_RANGE_PX = 5; // 4-9px diameter

// Rise distance is read directly off the *currently visible* liquid column
// height (--liquid-fill at burst time) — a bubble always travels the full
// way to the real surface, however tall or shallow the water currently is,
// rather than stopping short in a nearly-full tank or overshooting in a
// nearly-empty one.
//
// Duration is derived from that rise distance / speed (see spawnBubble), so
// a long rise in a full tank still reads as the same steady drift rather
// than a fixed-time animation that would look unnaturally fast over a big
// distance — clamped to keep both extremes (a near-empty tank's tiny hop, a
// full tank's long float) inside a reasonable on-screen duration.
export const BUBBLE_SPEED_PX_PER_MS_MIN = 0.09;
export const BUBBLE_SPEED_PX_PER_MS_RANGE = 0.05;
export const BUBBLE_DUR_MIN_MS = 500;
export const BUBBLE_DUR_MAX_MS = 2400;

export const BUBBLE_SPAWN_SPREAD_PX = 9; // ± horizontal jitter on each bubble's start x — kept small so bubbles stay inside the funnel's narrow neck
export const BUBBLE_WOBBLE_PX = 5; // horizontal wobble amplitude as a bubble rises
export const BUBBLE_RISE_OPACITY = 0.9; // steady opacity while rising — bubbles don't fade, they pop

// A real bubble doesn't vanish exactly at the surface — it pokes a little
// above it and bobs there for a moment before popping. Expressed as a
// fraction of the liquid column height (same reasoning as the rise
// distance itself), so it stays proportionally tiny even in a shallow tank.
export const BUBBLE_FLOAT_ABOVE_FRACTION = 0; // 100% total rise, no float above surface

// The burst at the surface once a bubble reaches the top, instead of a
// fade — a quick scale-up + drop to 0 opacity, same "short, self-removing"
// shape as liquid-ripple.js's own impact flash (FLASH_DURATION_MS) but
// tuned much smaller/quicker since this is a single tiny bubble, not a
// whole-surface impact.
export const BUBBLE_POP_DURATION_MS = 160;
export const BUBBLE_POP_SCALE = 2.4;
