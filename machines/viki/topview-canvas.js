/* ───────────────────────────────────────────────────────────────────────────
   topview-canvas.js — the moulded kuehs, drawn from directly above

   Kueh bangkit, kueh bahulu and kueh tutu are all defined by the mould they're
   pressed into, so they're all drawn flat from above where the silhouette does
   the work. They share the shape paths, the impressed detail and the palette
   derivation, and differ only in surface: bangkit is a matte pale biscuit,
   bahulu a glossy baked sponge, tutu a soft steamed cake on a leaf with its
   filling showing through.

   Grew out of the bangkit renderer once the second and third one needed the
   same machinery.
   ─────────────────────────────────────────────────────────────────────────── */

const TopViewCanvas = (function () {
  'use strict';

  // ─── COLOUR ────────────────────────────────────────────────────────────────

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function lighten(hex, t) {
    const c = hexToRgb(hex);
    return 'rgb(' + ((c[0] + (255 - c[0]) * t) | 0) + ',' + ((c[1] + (255 - c[1]) * t) | 0) +
      ',' + ((c[2] + (255 - c[2]) * t) | 0) + ')';
  }
  function darken(hex, t, a) {
    const c = hexToRgb(hex);
    const r = (c[0] * (1 - t)) | 0, g = (c[1] * (1 - t)) | 0, b = (c[2] * (1 - t)) | 0;
    return a == null ? 'rgb(' + r + ',' + g + ',' + b + ')'
      : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function palette(base) {
    return {
      light:   lighten(base, 0.34),
      body:    base,
      deep:    darken(base, 0.13),
      baked:   darken(base, 0.30),
      impress: darken(base, 0.44, 0.45),
      rim:     darken(base, 0.22, 0.5),
      crumbUp: lighten(base, 0.6),
      crumbDn: darken(base, 0.35),
    };
  }

  // ─── SHAPES ────────────────────────────────────────────────────────────────
  // Each traces a closed path centred on (cx, cy) with radius R.

  function flowerPath(ctx, cx, cy, R) {
    ctx.beginPath();
    const petals = 6, pr = R * 0.44, ring = R * 0.56;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
      ctx.moveTo(cx + Math.cos(a) * ring + pr, cy + Math.sin(a) * ring);
      ctx.arc(cx + Math.cos(a) * ring, cy + Math.sin(a) * ring, pr, 0, Math.PI * 2);
    }
    ctx.moveTo(cx + R * 0.42, cy);
    ctx.arc(cx, cy, R * 0.42, 0, Math.PI * 2);
  }

  function fishPath(ctx, cx, cy, R) {
    const bx = cx + R * 0.12;
    ctx.beginPath();
    ctx.moveTo(bx + R * 0.82, cy);
    ctx.bezierCurveTo(bx + R * 0.7, cy - R * 0.6, bx - R * 0.3, cy - R * 0.62, bx - R * 0.62, cy - R * 0.16);
    ctx.bezierCurveTo(bx - R * 0.72, cy - R * 0.04, bx - R * 0.72, cy + R * 0.04, bx - R * 0.62, cy + R * 0.16);
    ctx.bezierCurveTo(bx - R * 0.3, cy + R * 0.62, bx + R * 0.7, cy + R * 0.6, bx + R * 0.82, cy);
    ctx.closePath();
    ctx.moveTo(bx - R * 0.42, cy);
    ctx.lineTo(bx - R * 1.24, cy - R * 0.60);
    ctx.quadraticCurveTo(bx - R * 0.98, cy, bx - R * 1.24, cy + R * 0.60);
    ctx.closePath();
  }

  function leafPath(ctx, cx, cy, R) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - R * 0.92);
    ctx.bezierCurveTo(cx + R * 0.72, cy - R * 0.38, cx + R * 0.6, cy + R * 0.5, cx, cy + R * 0.92);
    ctx.bezierCurveTo(cx - R * 0.6, cy + R * 0.5, cx - R * 0.72, cy - R * 0.38, cx, cy - R * 0.92);
    ctx.closePath();
  }

  function rosettePath(ctx, cx, cy, R) {
    const scallops = 14;
    ctx.beginPath();
    for (let i = 0; i < scallops; i++) {
      const a = (i / scallops) * Math.PI * 2;
      const x = cx + Math.cos(a) * R * 0.84, y = cy + Math.sin(a) * R * 0.84;
      if (i === 0) ctx.moveTo(x + R * 0.19, y);
      ctx.arc(x, y, R * 0.19, 0, Math.PI * 2);
    }
    ctx.moveTo(cx + R * 0.84, cy);
    ctx.arc(cx, cy, R * 0.84, 0, Math.PI * 2);
  }

  function starPath(ctx, cx, cy, R) {
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? R * 0.95 : R * 0.44;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function roundPath(ctx, cx, cy, R) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.88, 0, Math.PI * 2);
    ctx.closePath();
  }

  function heartPath(ctx, cx, cy, R) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + R * 0.86);
    ctx.bezierCurveTo(cx - R * 1.05, cy + R * 0.06, cx - R * 0.62, cy - R * 0.92, cx, cy - R * 0.28);
    ctx.bezierCurveTo(cx + R * 0.62, cy - R * 0.92, cx + R * 1.05, cy + R * 0.06, cx, cy + R * 0.86);
    ctx.closePath();
  }

  // A fan opening upward from a rounded hinge — the classic brass bahulu mould.
  // The outer edge is one arc rather than segments, which kept coming out
  // faceted and lopsided.
  function shellPath(ctx, cx, cy, R) {
    const oy = cy + R * 0.46;
    const a0 = Math.PI * 1.16, a1 = Math.PI * 1.84;
    const sx = cx + Math.cos(a0) * R * 1.02, sy = oy + Math.sin(a0) * R * 1.02;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.arc(cx, oy, R * 1.02, a0, a1);
    ctx.quadraticCurveTo(cx + R * 0.34, oy - R * 0.12, cx + R * 0.17, oy);
    ctx.quadraticCurveTo(cx, oy + R * 0.17, cx - R * 0.17, oy);
    ctx.quadraticCurveTo(cx - R * 0.34, oy - R * 0.12, sx, sy);
    ctx.closePath();
  }

  // The classic ang ku oval, wider than it is tall.
  function tortoisePath(ctx, cx, cy, R) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 0.95, R * 0.72, 0, 0, Math.PI * 2);
    ctx.closePath();
  }

  // Cleft and stem at the top, tapering to a point — the longevity peach.
  function peachPath(ctx, cx, cy, R) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + R * 0.92);
    ctx.bezierCurveTo(cx - R * 0.98, cy + R * 0.30, cx - R * 0.85, cy - R * 0.75, cx - R * 0.18, cy - R * 0.52);
    ctx.quadraticCurveTo(cx, cy - R * 0.30, cx + R * 0.18, cy - R * 0.52);
    ctx.bezierCurveTo(cx + R * 0.85, cy - R * 0.75, cx + R * 0.98, cy + R * 0.30, cx, cy + R * 0.92);
    ctx.closePath();
  }

  const SHAPES = {
    tortoise: { path: tortoisePath, dot: false },
    peach:    { path: peachPath,    dot: false },
    flower:  { path: flowerPath,  dot: true },
    rosette: { path: rosettePath, dot: true },
    star:    { path: starPath,    dot: true },
    leaf:    { path: leafPath,    dot: false },
    fish:    { path: fishPath,    dot: false },
    round:   { path: roundPath,   dot: true },
    heart:   { path: heartPath,   dot: false },
    shell:   { path: shellPath,   dot: false },
  };

  // ─── IMPRESSED DETAIL ──────────────────────────────────────────────────────

  function impress(ctx, shape, cx, cy, R, pal) {
    ctx.save();
    ctx.strokeStyle = pal.impress;
    ctx.lineCap = 'round';

    if (shape === 'flower' || shape === 'star') {
      ctx.lineWidth = R * 0.035;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.28, cy + Math.sin(a) * R * 0.28);
        ctx.lineTo(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.24, 0, Math.PI * 2); ctx.stroke();

    } else if (shape === 'fish') {
      const bx = cx + R * 0.12;
      ctx.lineWidth = R * 0.03;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(bx - R * 0.1 + i * R * 0.26, cy, R * 0.30, -1.05, 1.05);
        ctx.stroke();
      }
      ctx.fillStyle = pal.impress;
      ctx.beginPath(); ctx.arc(bx + R * 0.5, cy - R * 0.14, R * 0.075, 0, Math.PI * 2); ctx.fill();

    } else if (shape === 'leaf') {
      ctx.lineWidth = R * 0.04;
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 0.78); ctx.lineTo(cx, cy + R * 0.78); ctx.stroke();
      ctx.lineWidth = R * 0.025;
      for (let i = -3; i <= 3; i++) {
        const y = cy + i * R * 0.2;
        const spread = R * 0.4 * (1 - Math.abs(i) / 4.2);
        ctx.beginPath();
        ctx.moveTo(cx, y); ctx.lineTo(cx + spread, y + R * 0.14);
        ctx.moveTo(cx, y); ctx.lineTo(cx - spread, y + R * 0.14);
        ctx.stroke();
      }

    } else if (shape === 'rosette' || shape === 'round') {
      ctx.lineWidth = R * 0.03;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.56, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.30, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.34, cy + Math.sin(a) * R * 0.34);
        ctx.lineTo(cx + Math.cos(a) * R * 0.52, cy + Math.sin(a) * R * 0.52);
        ctx.stroke();
      }

    } else if (shape === 'shell') {
      // Ridges fanning out from the hinge.
      const oy = cy + R * 0.42;
      ctx.lineWidth = R * 0.035;
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI + Math.PI * 0.22 + (i / 6) * Math.PI * 0.56;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.20, oy + Math.sin(a) * R * 0.20);
        ctx.lineTo(cx + Math.cos(a) * R * 0.90, oy + Math.sin(a) * R * 0.90);
        ctx.stroke();
      }

    } else if (shape === 'tortoise') {
      // The shell: a central plate, a border, and the segments between them.
      ctx.lineWidth = R * 0.032;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.76, R * 0.56, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.34, R * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.36, cy + Math.sin(a) * R * 0.27);
        ctx.lineTo(cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.55);
        ctx.stroke();
      }

    } else if (shape === 'peach') {
      // The crease, and a leaf off the stem.
      ctx.lineWidth = R * 0.035;
      ctx.beginPath();
      ctx.moveTo(cx, cy - R * 0.34);
      ctx.quadraticCurveTo(cx - R * 0.08, cy + R * 0.24, cx, cy + R * 0.74);
      ctx.stroke();
      ctx.lineWidth = R * 0.028;
      ctx.beginPath();
      ctx.moveTo(cx + R * 0.06, cy - R * 0.40);
      ctx.quadraticCurveTo(cx + R * 0.46, cy - R * 0.50, cx + R * 0.54, cy - R * 0.20);
      ctx.stroke();

    } else {   // heart
      ctx.lineWidth = R * 0.032;
      ctx.beginPath();
      ctx.moveTo(cx, cy + R * 0.62);
      ctx.bezierCurveTo(cx - R * 0.70, cy - R * 0.02, cx - R * 0.42, cy - R * 0.62, cx, cy - R * 0.16);
      ctx.bezierCurveTo(cx + R * 0.42, cy - R * 0.62, cx + R * 0.70, cy - R * 0.02, cx, cy + R * 0.62);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Fine speckle. Deterministic so it doesn't crawl between redraws.
  function speckle(ctx, cx, cy, R, pal, density) {
    let seed = 11;
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const n = Math.round(R * density);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * R;
      const up = rnd() > 0.45;
      ctx.globalAlpha = up ? 0.3 + rnd() * 0.4 : 0.08 + rnd() * 0.16;
      ctx.fillStyle = up ? pal.crumbUp : pal.crumbDn;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.5 + rnd() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── LEAF MAT ──────────────────────────────────────────────────────────────
  // Tutu kueh always arrives on a square of pandan or banana leaf.

  function leafMat(ctx, cx, cy, R) {
    const s = R * 1.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.06);
    ctx.fillStyle = 'rgba(10,6,2,0.4)';
    ctx.fillRect(-s + 3, -s * 0.72 + 5, s * 2, s * 1.44);
    const g = ctx.createLinearGradient(-s, -s * 0.7, s, s * 0.7);
    g.addColorStop(0, '#2f7a28');
    g.addColorStop(0.5, '#256b20');
    g.addColorStop(1, '#1c5218');
    ctx.fillStyle = g;
    ctx.fillRect(-s, -s * 0.72, s * 2, s * 1.44);
    ctx.strokeStyle = 'rgba(170,220,140,0.22)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-s, i * s * 0.16);
      ctx.lineTo(s, i * s * 0.16);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ─── SCENE ─────────────────────────────────────────────────────────────────

  function drawScene(ctx, W, H, o) {
    const kind = o.kind || 'bangkit';
    const sh = SHAPES[o.shape] || SHAPES.flower;
    const pal = palette(o.colour || '#f0e6cf');
    const cx = W / 2, cy = H * 0.5;
    const R = Math.min(W * 0.27, H * 0.34);

    if (kind === 'tutu' || kind === 'angku') leafMat(ctx, cx, cy, R);

    // Contact shadow.
    ctx.save();
    ctx.translate(0, R * 0.09);
    sh.path(ctx, cx, cy, R);
    ctx.fillStyle = 'rgba(12,8,3,0.4)';
    ctx.filter = 'blur(7px)';
    ctx.fill();
    ctx.restore();
    ctx.filter = 'none';

    // Body.
    sh.path(ctx, cx, cy, R);
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.34, R * 0.05, cx, cy, R * 1.15);
    g.addColorStop(0, pal.light);
    g.addColorStop(0.55, pal.body);
    g.addColorStop(1, pal.deep);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    sh.path(ctx, cx, cy, R);
    ctx.clip();

    // Surface, per kind.
    if (kind === 'bahulu') {
      // Baked: darker toward the edge, with a wet-looking highlight.
      speckle(ctx, cx, cy, R * 1.05, pal, 2.5);
      const bake = ctx.createRadialGradient(cx, cy, R * 0.35, cx, cy, R * 1.05);
      bake.addColorStop(0, 'rgba(0,0,0,0)');
      bake.addColorStop(1, darken(o.colour || '#d9a25c', 0.42, 0.5));
      ctx.fillStyle = bake;
      ctx.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
      impress(ctx, o.shape, cx, cy, R, pal);
      const gloss = ctx.createRadialGradient(
        cx - R * 0.32, cy - R * 0.38, 0, cx - R * 0.22, cy - R * 0.26, R * 0.7);
      gloss.addColorStop(0, 'rgba(255,255,255,0.5)');
      gloss.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);

    } else if (kind === 'angku') {
      // A glutinous skin: wet-looking, and the filling reads as a darker mass
      // sitting just under it.
      if (o.filling) {
        const fr = R * 0.5;
        const fg = ctx.createRadialGradient(cx, cy, fr * 0.15, cx, cy, fr);
        fg.addColorStop(0, darken(o.filling, 0.05, 0.62));
        fg.addColorStop(0.72, darken(o.filling, 0.12, 0.4));
        fg.addColorStop(1, darken(o.filling, 0.2, 0));
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.ellipse(cx, cy, fr, fr * 0.78, 0, 0, Math.PI * 2); ctx.fill();
      }
      impress(ctx, o.shape, cx, cy, R, pal);
      const wet = ctx.createRadialGradient(
        cx - R * 0.34, cy - R * 0.36, 0, cx - R * 0.2, cy - R * 0.24, R * 0.78);
      wet.addColorStop(0, 'rgba(255,255,255,0.62)');
      wet.addColorStop(0.4, 'rgba(255,255,255,0.16)');
      wet.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = wet;
      ctx.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);

    } else if (kind === 'tutu') {
      // Steamed and matte, with the filling showing through the thin top.
      speckle(ctx, cx, cy, R * 1.05, pal, 3.5);
      if (o.filling) {
        const fr = R * 0.44;
        const fg = ctx.createRadialGradient(cx, cy, fr * 0.2, cx, cy, fr);
        fg.addColorStop(0, o.filling);
        fg.addColorStop(0.7, darken(o.filling, 0.1, 0.85));
        fg.addColorStop(1, darken(o.filling, 0.2, 0));
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(cx, cy, fr, 0, Math.PI * 2); ctx.fill();
      }
      impress(ctx, o.shape, cx, cy, R, pal);

    } else {
      speckle(ctx, cx, cy, R * 1.05, pal, 5);
      impress(ctx, o.shape, cx, cy, R, pal);
    }

    // Rim just inside the outline.
    ctx.lineWidth = R * 0.13;
    ctx.strokeStyle = pal.rim;
    sh.path(ctx, cx, cy, R);
    ctx.stroke();
    ctx.restore();

    // Outline.
    sh.path(ctx, cx, cy, R);
    ctx.lineWidth = Math.max(1, R * 0.018);
    ctx.strokeStyle = pal.baked;
    ctx.stroke();

    // The dot of colouring a bangkit traditionally gets.
    if (kind === 'bangkit' && sh.dot) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.1, 0, Math.PI * 2);
      const dg = ctx.createRadialGradient(cx - R * 0.03, cy - R * 0.03, 0, cx, cy, R * 0.1);
      dg.addColorStop(0, '#e8607a');
      dg.addColorStop(1, '#c33450');
      ctx.fillStyle = dg;
      ctx.fill();
    }
  }

  // ─── ATTACH ────────────────────────────────────────────────────────────────

  function attach(canvas) {
    const ctx = canvas.getContext('2d');
    let opts = { kind: 'bangkit', shape: 'flower', colour: '#f0e6cf' };

    function paint() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawScene(ctx, w, h, opts);
    }

    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(paint).observe(canvas);
    else window.addEventListener('resize', paint);

    return { draw: function (next) { opts = Object.assign(opts, next); paint(); } };
  }

  // Silhouette for the shape pickers — a shape control has to show shapes.
  function chip(canvas, shapeId, colour) {
    const sh = SHAPES[shapeId] || SHAPES.flower;
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth || 30, h = canvas.clientHeight || 26;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    sh.path(ctx, w / 2, h / 2, Math.min(w, h) * 0.42);
    ctx.fillStyle = colour || '#f0e6cf';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = darken(colour || '#f0e6cf', 0.32, 0.8);
    ctx.stroke();
  }

  return { attach: attach, chip: chip };
})();
