// Atom: the glass liquid's own "drop lands in it" reaction — impact flash,
// flying splashlet droplets, a decaying ripple-ring sequence, and a damped
// meniscus/surface wobble on wall contact. Ported from
// wip/drop-ripple-demo.html's own techniques (see that file's header
// comment for the full rationale); tokens/liquid-ripple.js holds the pure
// math/tuning this module animates with. Same "pure DOM-wiring" role
// spring-graphic.js plays for the spring.
//
// Built once per glass (createLiquidRipple), then driven by two calls from
// src/atoms/glass-graphic.js:
//   setTop(top)  — every time setFill() computes a new surface ellipse.
//   impact()     — once, when a drop finishes falling into the liquid.
//
// The glass's own falling drop always lands dead-center (glass-graphic.js's
// dropIntoLiquid always falls straight down the middle) — unlike the
// demo's generic impactAt(px, py), there's no off-center case to handle,
// which is what lets the flash below live as a plain circle *inside*
// rippleGroup (auto-squashed by that group's own transform) rather than a
// manually pre-squashed ellipse the way the demo's own flash needs to be.

import { LIQUID_FLOOR, buildLiquidBodyPath } from '../tokens/glass-shape.js';
import {
  RING_COUNT,
  ringDelayMs,
  ringDurationMs,
  ringOpacityAt,
  RING_MAX_R_FRACTION,
  WALL_BOUNDARY_FRACTION,
  ringStrokeWidthFraction,
  SPLASH_COUNT_MIN,
  SPLASH_COUNT_RANGE,
  SPLASH_DIST_MIN_FRACTION,
  SPLASH_DIST_RANGE_FRACTION,
  SPLASH_RADIUS_FRACTION,
  SPLASH_DUR_MIN_MS,
  SPLASH_DUR_RANGE_MS,
  LANDING_RING_MAX_R_FRACTION,
  LANDING_RING_WIDTH_FRACTION,
  SPLASH_PEAK_LIFT_MIN_FRACTION,
  SPLASH_PEAK_LIFT_RANGE_FRACTION,
  ringWobbleFraction,
  FLASH_DURATION_MS,
  FLASH_START_R_FRACTION,
  FLASH_GROWTH_FRACTION,
  WOBBLE_DURATION_MS,
  WOBBLE_ANTICIPATION_MS,
  easeOutCubic,
  wallArrivalTime,
  wobbleDisplacement,
} from '../tokens/liquid-ripple.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
let uid = 0;

function animate(duration, onFrame, onDone) {
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    onFrame(t);
    if (t < 1) requestAnimationFrame(frame);
    else if (onDone) onDone();
  }
  requestAnimationFrame(frame);
}

/**
 * Builds the ripple system's own layers once and appends them to `svg`
 * (the glass's existing `liquidSvg`) right after its `body`/`floorEl`/
 * `surfaceEl` — returns `{ setTop(top), impact() }`.
 *
 * `body`/`surfaceEl` are the same elements glass-graphic.js's own
 * setFill() already writes to; the wobble below writes to them too (their
 * cy / d), reading whatever the *live* top ellipse is at the moment each
 * frame runs rather than a value snapshotted when the wobble was
 * scheduled — so a fill-level change landing mid-wobble still converges
 * on the new, correct rest position instead of a stale one.
 */
export function createLiquidRipple({ svg, body, surfaceEl }) {
  const clipId = `tl-glass-ripple-clip-${uid++}`;

  const meniscusEl = document.createElementNS(SVG_NS, 'ellipse');
  meniscusEl.setAttribute('class', 'tl-glass-liquid-meniscus');
  meniscusEl.setAttribute('stroke-width', '1');
  meniscusEl.setAttribute('opacity', '0.18');

  const defs = document.createElementNS(SVG_NS, 'defs');
  const clipPath = document.createElementNS(SVG_NS, 'clipPath');
  clipPath.setAttribute('id', clipId);
  const clipEl = document.createElementNS(SVG_NS, 'ellipse');
  clipPath.appendChild(clipEl);
  defs.appendChild(clipPath);

  // Rings + flash are drawn as plain circles at the origin, in an
  // untransformed "circle space" — this single group transform (see
  // setTop below) squashes the whole group into the surface ellipse's own
  // perspective at once, which is also why off-axis rings (splashlet
  // landing ripples) still come out correctly oriented/offset rather than
  // centered on the wrong point.
  const rippleLayer = document.createElementNS(SVG_NS, 'g');
  rippleLayer.setAttribute('clip-path', `url(#${clipId})`);
  const rippleGroup = document.createElementNS(SVG_NS, 'g');
  rippleLayer.appendChild(rippleGroup);

  // Splashlets fly in real (already-squashed) display coordinates plus a
  // genuine unsquashed vertical arc-lift — a droplet's ballistic height
  // above the surface isn't itself an elliptical-perspective quantity, so
  // this layer deliberately sits outside rippleGroup's own transform.
  const fxLayer = document.createElementNS(SVG_NS, 'g');

  svg.append(meniscusEl, defs, rippleLayer, fxLayer);

  let canonicalTop = null;

  function setTop(top) {
    canonicalTop = top;
    const k = top.ry / top.rx;
    meniscusEl.setAttribute('cx', top.cx);
    meniscusEl.setAttribute('cy', top.cy);
    meniscusEl.setAttribute('rx', top.rx);
    meniscusEl.setAttribute('ry', top.ry);
    clipEl.setAttribute('cx', top.cx);
    clipEl.setAttribute('cy', top.cy);
    clipEl.setAttribute('rx', top.rx * WALL_BOUNDARY_FRACTION);
    clipEl.setAttribute('ry', top.ry * WALL_BOUNDARY_FRACTION);
    rippleGroup.setAttribute('transform', `translate(${top.cx} ${top.cy}) scale(1 ${k})`);
  }

  function spawnRing(ux, uy, maxR, delay, duration, startWidth, baseOpacity) {
    setTimeout(() => {
      const ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('class', 'tl-glass-liquid-ring');
      ring.setAttribute('cx', ux.toFixed(2));
      ring.setAttribute('cy', uy.toFixed(2));
      ring.setAttribute('r', '0.001');
      ring.setAttribute('stroke-width', startWidth);
      ring.setAttribute('opacity', baseOpacity);
      rippleGroup.appendChild(ring);
      animate(
        duration,
        (t) => {
          const e = easeOutCubic(t);
          ring.setAttribute('r', (maxR * e).toFixed(2));
          ring.setAttribute('stroke-width', (startWidth * (1 - 0.8 * t)).toFixed(2));
          ring.setAttribute('opacity', (baseOpacity * (1 - t)).toFixed(2));
        },
        () => ring.remove()
      );
    }, delay);
  }

  function spawnFlash(rx) {
    const startR = rx * FLASH_START_R_FRACTION;
    const growth = rx * FLASH_GROWTH_FRACTION;
    const flash = document.createElementNS(SVG_NS, 'circle');
    flash.setAttribute('class', 'tl-glass-liquid-flash');
    flash.setAttribute('cx', '0');
    flash.setAttribute('cy', '0');
    flash.setAttribute('r', startR.toFixed(2));
    flash.setAttribute('opacity', '0.55');
    rippleGroup.appendChild(flash);
    animate(
      FLASH_DURATION_MS,
      (t) => {
        const e = easeOutCubic(t);
        flash.setAttribute('r', (startR + growth * e).toFixed(2));
        flash.setAttribute('opacity', (0.55 * (1 - t)).toFixed(2));
      },
      () => flash.remove()
    );
  }

  function spawnSplashlets(top) {
    const { rx, ry, cx, cy } = top;
    const k = ry / rx;
    const count = SPLASH_COUNT_MIN + Math.floor(Math.random() * SPLASH_COUNT_RANGE);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = rx * (SPLASH_DIST_MIN_FRACTION + Math.random() * SPLASH_DIST_RANGE_FRACTION);
      const outUx = Math.cos(angle) * dist;
      const outUy = Math.sin(angle) * dist; // circle-space, squashed manually below (fxLayer sits outside rippleGroup)
      const endDisp = { x: cx + outUx, y: cy + outUy * k };
      const radius = rx * SPLASH_RADIUS_FRACTION;
      const drop = document.createElementNS(SVG_NS, 'circle');
      drop.setAttribute('class', 'tl-glass-liquid-splashlet');
      drop.setAttribute('cx', cx.toFixed(2));
      drop.setAttribute('cy', cy.toFixed(2));
      drop.setAttribute('r', radius.toFixed(2));
      drop.setAttribute('opacity', '0.95');
      fxLayer.appendChild(drop);
      const peakLift = ry * (SPLASH_PEAK_LIFT_MIN_FRACTION + Math.random() * SPLASH_PEAK_LIFT_RANGE_FRACTION);
      const duration = SPLASH_DUR_MIN_MS + Math.random() * SPLASH_DUR_RANGE_MS;
      animate(
        duration,
        (t) => {
          const x = cx + (endDisp.x - cx) * t;
          const yLinear = cy + (endDisp.y - cy) * t;
          const arc = -peakLift * Math.sin(Math.PI * t);
          drop.setAttribute('cx', x.toFixed(2));
          drop.setAttribute('cy', (yLinear + arc).toFixed(2));
          drop.setAttribute('opacity', (0.95 * (1 - t * 0.9)).toFixed(2));
          drop.setAttribute('r', (radius * (1 - t * 0.5)).toFixed(2));
        },
        () => {
          drop.remove();
          const maxR = rx * LANDING_RING_MAX_R_FRACTION;
          const width = rx * LANDING_RING_WIDTH_FRACTION;
          spawnRing(outUx, outUy, maxR, 0, 260, width, 0.4); // tiny ripple where the droplet lands
        }
      );
    }
  }

  function wobbleMeniscus(amplitude, delay) {
    setTimeout(() => {
      animate(
        WOBBLE_DURATION_MS,
        (t) => {
          const elapsed = t * WOBBLE_DURATION_MS;
          const dy = wobbleDisplacement(elapsed, amplitude);
          const topNow = canonicalTop.cy + dy;
          meniscusEl.setAttribute('cy', topNow.toFixed(2));
          meniscusEl.setAttribute('stroke-width', (1 + Math.abs(dy) * 0.4).toFixed(2));
          meniscusEl.setAttribute('opacity', Math.min(0.6, 0.18 + Math.abs(dy) * 0.18).toFixed(2));
          surfaceEl.setAttribute('cy', topNow.toFixed(2));
          body.setAttribute('d', buildLiquidBodyPath({ ...canonicalTop, cy: topNow }, LIQUID_FLOOR));
        },
        () => {
          meniscusEl.setAttribute('cy', canonicalTop.cy);
          meniscusEl.setAttribute('stroke-width', '1');
          meniscusEl.setAttribute('opacity', '0.18');
          surfaceEl.setAttribute('cy', canonicalTop.cy);
          body.setAttribute('d', buildLiquidBodyPath(canonicalTop, LIQUID_FLOOR));
        }
      );
    }, delay);
  }

  function impact() {
    const top = canonicalTop;
    spawnFlash(top.rx);
    spawnSplashlets(top);

    const wallBoundary = top.rx * WALL_BOUNDARY_FRACTION;
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = {
        maxR: top.rx * RING_MAX_R_FRACTION,
        delay: ringDelayMs(i),
        dur: ringDurationMs(i),
      };
      const opacity = ringOpacityAt(i);
      if (opacity > 0) {
        const width = top.rx * ringStrokeWidthFraction(i);
        spawnRing(0, 0, ring.maxR, ring.delay, ring.dur, width, opacity);
      }
      const arrival = wallArrivalTime(ring, wallBoundary);
      if (arrival !== null) {
        const wobbleAmp = top.ry * ringWobbleFraction(i);
        wobbleMeniscus(wobbleAmp, Math.max(0, arrival - WOBBLE_ANTICIPATION_MS));
      }
    }
  }

  return { setTop, impact };
}
