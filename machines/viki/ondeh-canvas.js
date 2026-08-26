/* ───────────────────────────────────────────────────────────────────────────
   ondeh-canvas.js — ondeh ondeh renderer

   Ported from the Ondeh Ondeh Studio in v1 (ondeh.js). Two balls on a banana
   leaf: one whole, one cut open so you can see the filling and the gula melaka
   running out of it. Changes for v2: helpers take an explicit ctx, the
   full-canvas background is dropped so it sits inside the dark chamber, and the
   drip loop can be started and stopped so it isn't burning frames while the
   hatch is shut.
   ─────────────────────────────────────────────────────────────────────────── */

const OndehCanvas = (function () {
  'use strict';

  // ─── COLOUR ────────────────────────────────────────────────────────────────

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function lighten(hex, t) {
    const c = hexToRgb(hex);
    return 'rgb(' + ((c[0] + (255 - c[0]) * t) | 0) + ',' +
      ((c[1] + (255 - c[1]) * t) | 0) + ',' + ((c[2] + (255 - c[2]) * t) | 0) + ')';
  }

  function darken(hex, t) {
    const c = hexToRgb(hex);
    return 'rgb(' + ((c[0] * (1 - t)) | 0) + ',' + ((c[1] * (1 - t)) | 0) + ',' +
      ((c[2] * (1 - t)) | 0) + ')';
  }

  // ─── PARTICLES ─────────────────────────────────────────────────────────────
  // Scattered once per coating change, then reused every frame so the flakes
  // don't crawl around between redraws.

  const POWDERS = { sugar: 1, matcha: 1, cocoa: 1 };

  function makeParticles(coating) {
    const isPowder = !!POWDERS[coating];
    const n = isPowder ? 1200 : 500;
    const maxDist = isPowder ? 0.98 : 0.96;
    const out = [];
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * maxDist;
      out.push({
        ox: Math.cos(angle) * dist,
        oy: Math.sin(angle) * dist,
        rot: Math.random() * Math.PI,
        len: 6 + Math.random() * 11,
        lw: 1.4 + Math.random() * 1.4,
        alpha: 0.52 + Math.random() * 0.42,
        size: isPowder ? 1.5 + Math.random() * 1.2 : 0.9,
      });
    }
    return out;
  }

  function drawFlakes(ctx, ps, cx, cy, r, color) {
    ps.forEach(function (p) {
      ctx.save();
      ctx.translate(cx + p.ox * r, cy + p.oy * r);
      ctx.rotate(p.rot);
      ctx.strokeStyle = 'rgba(' + color + ',' + p.alpha + ')';
      ctx.lineWidth = p.lw;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-p.len / 2, 0);
      ctx.lineTo(p.len / 2, 0);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawSeeds(ctx, ps, cx, cy, r, color, rx, ry) {
    ps.forEach(function (p) {
      ctx.save();
      ctx.translate(cx + p.ox * r, cy + p.oy * r);
      ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(' + color + ',' + p.alpha + ')';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPowder(ctx, ps, cx, cy, r, dotColor) {
    ctx.fillStyle = dotColor;
    ps.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(cx + p.ox * r, cy + p.oy * r, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawCoating(ctx, ps, coating, cx, cy, r) {
    switch (coating) {
      case 'coconut':         drawFlakes(ctx, ps, cx, cy, r, '255,252,240'); break;
      case 'toasted_coconut': drawFlakes(ctx, ps, cx, cy, r, '200,148,55'); break;
      case 'sesame':          drawSeeds(ctx, ps, cx, cy, r, '210,175,100', 2.4, 4.4); break;
      case 'peanuts':         drawSeeds(ctx, ps, cx, cy, r, '188,148,72', 3.2, 5.2); break;
      case 'sugar':           drawPowder(ctx, ps, cx, cy, r, 'rgba(255,255,255,0.88)'); break;
      case 'matcha':          drawPowder(ctx, ps, cx, cy, r, 'rgba(58,98,18,0.90)'); break;
      case 'cocoa':           drawPowder(ctx, ps, cx, cy, r, 'rgba(48,20,5,0.90)'); break;
    }
  }

  // ─── BANANA LEAF ───────────────────────────────────────────────────────────

  function leafPath(ctx, lW, lH) {
    ctx.moveTo(0, -lH * 0.50);
    ctx.bezierCurveTo(lW * 0.28, -lH * 0.50, lW * 0.50, -lH * 0.28, lW * 0.50, 0);
    ctx.bezierCurveTo(lW * 0.50, lH * 0.28, lW * 0.28, lH * 0.50, 0, lH * 0.50);
    ctx.bezierCurveTo(-lW * 0.28, lH * 0.50, -lW * 0.50, lH * 0.28, -lW * 0.50, 0);
    ctx.bezierCurveTo(-lW * 0.50, -lH * 0.28, -lW * 0.28, -lH * 0.50, 0, -lH * 0.50);
    ctx.closePath();
  }

  function drawBananaLeaf(ctx, W, H, cy) {
    const lW = W * 0.78;
    const lH = H * 0.24;

    ctx.save();
    ctx.translate(W * 0.5, cy);
    ctx.rotate(-0.08);

    const sh = ctx.createRadialGradient(0, lH * 0.1, 0, 0, lH * 0.1, lW * 0.44);
    sh.addColorStop(0, 'rgba(0,0,0,0.32)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(0, lH * 0.24, lW * 0.44, lH * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    leafPath(ctx, lW, lH);
    const lg = ctx.createLinearGradient(-lW * 0.38, -lH * 0.38, lW * 0.38, lH * 0.38);
    lg.addColorStop(0, '#1e5c1a');
    lg.addColorStop(0.35, '#2e7a26');
    lg.addColorStop(0.65, '#256c20');
    lg.addColorStop(1, '#1c5018');
    ctx.fillStyle = lg;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-lW * 0.46, 0);
    ctx.lineTo(lW * 0.46, 0);
    ctx.strokeStyle = 'rgba(170,220,140,0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (let i = 0; i < 13; i++) {
      const x = -lW * 0.43 + (lW * 0.86) * i / 12;
      const maxY = lH * 0.42 * (1 - Math.pow(Math.abs(x) / (lW * 0.50), 1.2));
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + lW * 0.030, -maxY);
      ctx.moveTo(x, 0);
      ctx.lineTo(x + lW * 0.030, maxY);
      ctx.strokeStyle = 'rgba(160,215,130,0.22)';
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }

    ctx.beginPath();
    leafPath(ctx, lW, lH);
    const sheen = ctx.createLinearGradient(-lW * 0.16, -lH * 0.36, lW * 0.05, lH * 0.08);
    sheen.addColorStop(0, 'rgba(255,255,255,0.14)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fill();

    ctx.beginPath();
    leafPath(ctx, lW, lH);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // ─── SPHERE ────────────────────────────────────────────────────────────────

  function drawSphereShading(ctx, cx, cy, r) {
    const sg = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx, cy, r * 1.05);
    sg.addColorStop(0, 'rgba(255,255,255,0.32)');
    sg.addColorStop(0.45, 'rgba(255,255,255,0)');
    sg.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = sg;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  function drawSpecular(ctx, cx, cy, r) {
    const sp = ctx.createRadialGradient(cx - r * 0.30, cy - r * 0.32, 0, cx - r * 0.20, cy - r * 0.22, r * 0.42);
    sp.addColorStop(0, 'rgba(255,255,255,0.78)');
    sp.addColorStop(0.4, 'rgba(255,255,255,0.22)');
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  function drawBallShadow(ctx, cx, cy, r) {
    const sh = ctx.createRadialGradient(cx, cy + r * 0.88, 0, cx, cy + r * 0.88, r * 0.76);
    sh.addColorStop(0, 'rgba(0,0,0,0.34)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.04, cy + r * 0.90, r * 0.72, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFullBall(ctx, o, ps, cx, cy, r) {
    drawBallShadow(ctx, cx, cy, r);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = o.exterior;
    ctx.fill();
    drawSphereShading(ctx, cx, cy, r);
    drawCoating(ctx, ps, o.coating, cx, cy, r);
    drawSpecular(ctx, cx, cy, r);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ─── DRIPS ─────────────────────────────────────────────────────────────────
  // Gula melaka creeping out of the cut face and stretching until it drops.

  function updateDrips(drips) {
    drips.forEach(function (d) {
      d.progress += d.speed;
      if (d.progress >= 1) {
        d.progress = 0;
        d.ox = Math.random() * 0.56 - 0.28;
      }
    });
  }

  function drawDrips(ctx, o, drips, cx, cy, fillR, faceR) {
    const c = hexToRgb(o.filling);
    // Drips read slightly darker — gravity pools the denser syrup at the tip.
    const dr = (c[0] * 0.80) | 0, dg = (c[1] * 0.80) | 0, db = (c[2] * 0.80) | 0;
    const maxLen = (faceR - fillR) * 1.05 + fillR * 0.20;

    drips.forEach(function (d) {
      const anchorX = cx + d.ox * fillR * 0.28;
      const anchorY = cy + fillR * 0.82;
      const dripLen = maxLen * d.progress;
      const neckW = fillR * 0.092 * (1 - d.progress * 0.44);
      if (dripLen < 1) return;

      function dripPath() {
        ctx.beginPath();
        ctx.moveTo(anchorX - neckW, anchorY);
        ctx.bezierCurveTo(
          anchorX - neckW * 0.68, anchorY + dripLen * 0.36,
          anchorX - neckW * 0.20, anchorY + dripLen * 0.83,
          anchorX, anchorY + dripLen);
        ctx.bezierCurveTo(
          anchorX + neckW * 0.20, anchorY + dripLen * 0.83,
          anchorX + neckW * 0.68, anchorY + dripLen * 0.36,
          anchorX + neckW, anchorY);
        ctx.closePath();
      }

      dripPath();
      ctx.fillStyle = 'rgb(' + dr + ',' + dg + ',' + db + ')';
      ctx.fill();

      const sheenAlpha = o.glossy ? 0.50 : 0.20;
      if (dripLen > fillR * 0.08) {
        const sp = ctx.createRadialGradient(
          anchorX - neckW * 0.30, anchorY + dripLen * 0.60, 0,
          anchorX, anchorY + dripLen * 0.65, neckW * 2.2);
        sp.addColorStop(0, 'rgba(255,255,255,' + sheenAlpha + ')');
        sp.addColorStop(1, 'rgba(255,255,255,0)');
        dripPath();
        ctx.fillStyle = sp;
        ctx.fill();
      }
    });
  }

  function drawCrossSectionBall(ctx, o, ps, drips, cx, cy, r) {
    const faceR = r * 0.95;   // cut face sits inside the rim so the coating peeks
    const fillR = r * 0.60;

    drawBallShadow(ctx, cx, cy, r);

    // Back hemisphere — no specular, it's behind the cut.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = darken(o.exterior, 0.08);
    ctx.fill();
    drawSphereShading(ctx, cx, cy, r);
    drawCoating(ctx, ps, o.coating, cx, cy, r);
    ctx.restore();

    // Cut face.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = lighten(o.exterior, 0.18);
    ctx.fillRect(cx - faceR, cy - faceR, faceR * 2, faceR * 2);

    const rimG = ctx.createRadialGradient(cx, cy, faceR * 0.76, cx, cy, faceR);
    rimG.addColorStop(0, 'rgba(0,0,0,0)');
    rimG.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = rimG;
    ctx.fillRect(cx - faceR, cy - faceR, faceR * 2, faceR * 2);

    // Drawn before the filling disc so the disc hides where each drip anchors.
    drawDrips(ctx, o, drips, cx, cy, fillR, faceR);

    const fg = ctx.createRadialGradient(cx - fillR * 0.18, cy - fillR * 0.18, 0, cx, cy, fillR);
    fg.addColorStop(0, lighten(o.filling, 0.24));
    fg.addColorStop(0.55, o.filling);
    fg.addColorStop(1, darken(o.filling, 0.32));
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(cx, cy, fillR, 0, Math.PI * 2);
    ctx.fill();

    if (o.glossy) {
      const gloss = ctx.createRadialGradient(
        cx - fillR * 0.32, cy - fillR * 0.36, 0,
        cx - fillR * 0.10, cy - fillR * 0.10, fillR * 0.72);
      gloss.addColorStop(0, 'rgba(255,255,255,0.42)');
      gloss.addColorStop(0.5, 'rgba(255,255,255,0.10)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.arc(cx, cy, fillR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, fillR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.20)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const faceShade = ctx.createLinearGradient(
      cx - faceR, cy - faceR, cx + faceR * 0.4, cy + faceR * 0.4);
    faceShade.addColorStop(0, 'rgba(255,255,255,0.07)');
    faceShade.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = faceShade;
    ctx.fillRect(cx - faceR, cy - faceR, faceR * 2, faceR * 2);

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.20)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawScene(ctx, W, H, o, ps, drips) {
    const leafCY = H * 0.66;
    drawBananaLeaf(ctx, W, H, leafCY);
    const r = Math.min(W * 0.19, H * 0.23);
    // Back ball first so the cut one overlaps it.
    drawFullBall(ctx, o, ps, W * 0.61, leafCY - r * 0.88, r);
    drawCrossSectionBall(ctx, o, ps, drips, W * 0.39, leafCY - r * 0.68, r);
  }

  // ─── ATTACH ────────────────────────────────────────────────────────────────

  function attach(canvas) {
    const ctx = canvas.getContext('2d');
    let opts = { exterior: '#72c47e', filling: '#5c2a0a', glossy: true, coating: 'coconut' };
    let particles = makeParticles(opts.coating);
    let raf = null;

    const drips = [
      { ox: -0.18, progress: 0.08, speed: 0.0050 },
      { ox: 0.11, progress: 0.62, speed: 0.0038 },
    ];

    function paint() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawScene(ctx, w, h, opts, particles, drips);
    }

    function tick() {
      updateDrips(drips);
      paint();
      raf = requestAnimationFrame(tick);
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(paint).observe(canvas);
    } else {
      window.addEventListener('resize', paint);
    }

    return {
      draw: function (next) {
        // Only rescatter when the coating actually changes — otherwise the
        // flakes would jump on every unrelated redraw.
        if (next.coating && next.coating !== opts.coating) {
          particles = makeParticles(next.coating);
        }
        opts = Object.assign(opts, next);
        paint();
      },
      // The drips only animate while the hatch is open.
      start: function () { if (!raf) tick(); },
      stop: function () { if (raf) { cancelAnimationFrame(raf); raf = null; } },
    };
  }

  return { attach: attach };
})();
