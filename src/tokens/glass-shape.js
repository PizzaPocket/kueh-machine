// Pure geometry for the hanging glass — no DOM, same role src/tokens/
// spring.js and src/tokens/superellipse.js play for their own shapes.
// Every number here lives in the artwork's own native 200×141 viewBox
// space (wip/Glass/*.svg) — src/atoms/glass-graphic.js renders an <svg
// viewBox="0 0 200 141"> so these coordinates apply directly, with no
// separate scale factor of their own; a *consumer* rendering at a
// different pixel size (src/organisms/timeline-panel.js, for the string's
// rim/base tie-points) scales these numbers by its own renderWidth/200 and
// renderHeight/141.
//
// The glass is drawn viewed from slightly above (not straight-on) — its
// rim and base both read as ellipses, not flat lines. Every constant below
// is derived directly from the back-layer artwork's own path data (see
// each comment), not guessed/eyeballed.

// Copied verbatim from images/glass/glass-back.svg's own first path (the
// solid outer silhouette) — used as an exact SVG clip-path for the frosted
// blur layer (src/atoms/glass-graphic.js), rather than a `mask-image`
// referencing the asset by URL: `mask-mode: alpha` on an external SVG
// mask-image is inconsistently supported, and fell back to unmasked
// (blurring the whole rectangular layer, not just the cup) — a `<clipPath>`
// built from this same exact path has no such ambiguity.
export const OUTER_SILHOUETTE_D =
  'M100 0C127.37 0 152.169 1.56847 170.144 4.11035C179.123 5.38023 186.442 6.8991 191.537 8.60254C194.078 9.45203 196.126 10.366 197.558 11.3555C198.951 12.3184 200 13.5234 200 15C200 16.0124 199.506 16.8965 198.747 17.6631L185.607 43.0684C185.179 43.8968 184.882 44.7878 184.727 45.708L171.532 123.993C170.754 128.608 167.405 132.231 163.103 133.504C158 137.756 131.692 140.999 100 140.999C68.3072 140.999 41.9972 137.757 36.8965 133.504C32.5948 132.231 29.2455 128.607 28.4678 123.993L15.2734 45.708C15.1183 44.7878 14.8211 43.8968 14.3926 43.0684L1.25195 17.6631C0.493078 16.8966 0 16.0122 0 15C0 13.5234 1.04904 12.3184 2.44238 11.3555C3.87422 10.366 5.9221 9.45203 8.46289 8.60254C13.5578 6.8991 20.8766 5.38023 29.8564 4.11035C47.8312 1.56848 72.6302 0 100 0Z';

// Derived from the outer silhouette path's own extremal points: the
// leftmost/rightmost rim points (0,15) and (200,15) share one y — that's
// the ellipse's own vertical center — and the topmost point (100,0) is
// exactly 15 above it, so ry falls out as 15 too, not an independent
// number.
export const OUTER_RIM = { cx: 100, cy: 15, rx: 100, ry: 15 };

// Same derivation, mirrored at the bottom: side points (28.4678,123.993)
// and (171.532,123.993) share a y (the base ellipse's own vertical
// center); the bottom-most point (100,140.999) is 17.006 below that.
export const OUTER_BASE = { cx: 100, cy: 124, rx: 71.5, ry: 17 };

// The wall isn't a single straight cone from rim to base — the outer
// path's own two L (straight-line) segments between the rim and base
// taper at two different rates: a much steeper flare in a short band right
// under the rim (200,17.66 -> 185.6,43.07: half-width 100 -> ~85.6 over
// just ~25px of y), then a far gentler taper for the rest of the body
// (184.7,45.7 -> 171.5,124: half-width ~84.7 -> 71.5 over ~78px) — this is
// the "fluted toward the top" flare. FLUTE_Y/FLUTE_HALF is the breakpoint
// between those two measured segments (averaging each segment's own two
// endpoints).
const FLUTE_Y = 44;
const FLUTE_HALF = 85;

/** Half-width of the glass's own OUTER wall at a given y (native space). */
function outerHalfWidthAt(y) {
  if (y <= OUTER_RIM.cy) return OUTER_RIM.rx;
  if (y <= FLUTE_Y) {
    const t = (y - OUTER_RIM.cy) / (FLUTE_Y - OUTER_RIM.cy);
    return OUTER_RIM.rx + (FLUTE_HALF - OUTER_RIM.rx) * t;
  }
  if (y <= OUTER_BASE.cy) {
    const t = (y - FLUTE_Y) / (OUTER_BASE.cy - FLUTE_Y);
    return FLUTE_HALF + (OUTER_BASE.rx - FLUTE_HALF) * t;
  }
  // Below the base ellipse's own center, the boundary is that ellipse's
  // own bottom-half curve, not a further straight taper.
  const dy = Math.min(y - OUTER_BASE.cy, OUTER_BASE.ry);
  return OUTER_BASE.rx * Math.sqrt(Math.max(0, 1 - (dy / OUTER_BASE.ry) ** 2));
}

/** The ellipse "flatness" (ry) of a horizontal slice at a given y. Doesn't
 * flute as sharply as the half-width does — a plain taper between the
 * rim's and base's own ry is a close enough read of the art. */
function outerRyAt(y) {
  const t = Math.max(0, Math.min(1, (y - OUTER_RIM.cy) / (OUTER_BASE.cy - OUTER_RIM.cy)));
  return OUTER_RIM.ry + (OUTER_BASE.ry - OUTER_RIM.ry) * t;
}

// The liquid's own inner floor — always the same regardless of fill level
// (it's the container's physical inside-bottom). Taken directly from
// wip/Glass/Example - Liquid.svg's own fixed bottom ellipse — that
// reference asset already draws this, unlike the rim (which the Liquid
// example doesn't independently confirm at fraction 1, see WALL_INSET
// below for how the rim end is inferred instead).
export const LIQUID_FLOOR = { cx: 100, cy: 128.5, rx: 62, ry: 8.5 };

// How far inset the liquid's own wall sits from the outer wall — derived
// by comparing the Liquid reference's OWN top ellipse (a mid-fill
// example: rx 75 at y 71) and its floor ellipse (rx 62 at y 128.5)
// against outerHalfWidthAt() at those same two heights (~80.4 and ~69.0
// respectively) — insets of ~5.4 and ~7.0, averaged to one constant
// rather than modeled as its own function, since both land in the same
// ballpark and a single wall thickness is a reasonable simplification.
const WALL_INSET = 6;

/**
 * The liquid's own top (surface) ellipse at a given fill fraction (0 =
 * empty, sitting exactly on the floor; 1 = full, right up at the rim).
 * Interpolates height between the floor's own topmost point and the
 * rim's, then reads the *outer* wall's half-width/ry at that height and
 * insets it by the wall thickness — which is what makes the surface
 * ellipse's own width correctly follow the cup's taper (including the
 * fluted band near the top) as the fill level rises through it, rather
 * than a fixed size that only happens to be right at one fill level.
 */
export function liquidTopEllipseAt(fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  const floorY = LIQUID_FLOOR.cy - LIQUID_FLOOR.ry;
  const rimY = OUTER_RIM.cy;
  const y = floorY + (rimY - floorY) * f;
  const outerHalf = outerHalfWidthAt(y);
  const rx = Math.max(LIQUID_FLOOR.rx * 0.98, outerHalf - WALL_INSET);
  const ry = outerRyAt(y) * (rx / outerHalf);
  return { cx: 100, cy: y, rx, ry };
}

// fmt/ellipsePoint/arc helpers below build the liquid's own body path —
// straight walls connecting the top ellipse's own left/right extreme
// points down to the floor ellipse's, closed by each ellipse's own
// bottom-front arc (not their full circumference — the top/floor
// <ellipse> elements drawn separately over this body supply that, same
// two-layer structure the Liquid reference asset itself uses: a body
// path plus full ellipses layered on top, rather than one single
// self-intersecting outline).
function fmt(n) {
  return Math.round(n * 100) / 100;
}

/** The liquid's own inner wall half-width — the *same* fluted taper as the
 * outer wall (outerHalfWidthAt), just inset by the wall thickness. This is
 * what the side walls below actually sample, rather than a straight line
 * from the surface ellipse straight down to the floor ellipse — a
 * straight line would cut across the fluted band instead of following it,
 * visibly wrong whenever the current fill level sits at or near that
 * flared region. */
function innerHalfWidthAt(y) {
  return outerHalfWidthAt(y) - WALL_INSET;
}

const WALL_STEPS = 8;

// Samples innerHalfWidthAt between two heights, but pins the first/last
// sample to the exact half-width the caller hands in (the top/floor
// ellipse's own real rx) rather than whatever innerHalfWidthAt happens to
// compute there — WALL_INSET is one averaged constant, not an exact fit
// to the floor ellipse's own hand-authored rx, so pinning the endpoints
// is what keeps the wall meeting each ellipse without a visible seam/kink
// while every point *between* them still genuinely follows the taper.
function sampleWall(fromY, toY, fromHalf, toHalf) {
  const points = [];
  for (let i = 0; i <= WALL_STEPS; i++) {
    const t = i / WALL_STEPS;
    const y = fromY + (toY - fromY) * t;
    const half = i === 0 ? fromHalf : i === WALL_STEPS ? toHalf : innerHalfWidthAt(y);
    points.push({ y, half });
  }
  return points;
}

/**
 * The liquid body's own path `d` — just the fluted-taper walls (see
 * innerHalfWidthAt above), closing flush with a plain straight line at the
 * top (y = top.cy) and another at the bottom (y = floor's own "shoulder",
 * floor.cy - floor.ry). Deliberately does NOT also trace either ellipse's
 * own front-bottom arc the way the reference asset's hand-drawn body path
 * does — dipping the body's own top edge down past top.cy back into the
 * wall region it just came from (mirrored at the bottom) makes the path
 * self-intersect, which rendered as a stray extra "ellipse" artifact right
 * at the surface/floor line once anything is layered on top of it. The
 * *separate*, fully opaque top/floor <ellipse>s (drawn after this body —
 * see createGlassGraphic) supply that dipped "looking down at a disk"
 * look entirely on their own, flush against these same straight edges, so
 * nothing needs to double up on tracing it.
 *
 * The walls extend to each ellipse's own vertical CENTER (cy), not its
 * near edge (cy ± ry) — an ellipse's half-width only equals its own rx at
 * its center; pinning the wall's end to rx at the *edge* (where the true
 * half-width is 0) was both geometrically inconsistent and left the
 * floor ellipse's entire upper half exposed below the body as a visibly
 * separate floating oval, rather than mostly covered by it with only its
 * lower crescent peeking out (compare wip/Glass/Example - Liquid.svg's
 * own proportions — a thin sliver of floor, not a full separate disk).
 */
export function buildLiquidBodyPath(top, floor) {
  const cx = top.cx; // same as floor.cx — both centered on the glass's own vertical axis
  const wallTopY = top.cy;
  const wallBottomY = floor.cy;

  const leftWall = sampleWall(wallTopY, wallBottomY, top.rx, floor.rx);
  const rightWall = sampleWall(wallBottomY, wallTopY, floor.rx, top.rx);

  const leftWallD = leftWall.map((p, i) => `${i === 0 ? 'M' : 'L'} ${fmt(cx - p.half)},${fmt(p.y)}`).join(' ');
  const rightWallD = rightWall.map((p) => `L ${fmt(cx + p.half)},${fmt(p.y)}`).join(' ');

  return (
    `${leftWallD} ` +
    `L ${fmt(cx + floor.rx)},${fmt(wallBottomY)} ` +
    `${rightWallD} ` +
    `L ${fmt(cx - top.rx)},${fmt(wallTopY)} ` +
    `Z`
  );
}
