/* ───────────────────────────────────────────────────────────────────────────
   kueh-canvas.js — isometric layered-kueh renderer

   Ported from the Kueh Lapis Studio canvas in v1 (app.js). Changes made for
   v2: every helper now takes an explicit ctx instead of reading a module
   global, layer colours come from the caller instead of v1's FLAVOURS/THEMES
   system, the full-canvas background is gone so the block can sit inside the
   machine window, and the block is scaled to whatever box it's given rather
   than assuming a large canvas.
   ─────────────────────────────────────────────────────────────────────────── */

const KuehCanvas = (function () {
  'use strict';

  // ─── COLOUR ────────────────────────────────────────────────────────────────
  // The drawing maths works in RGB. Palettes are authored in oklch to match the
  // CSS, so we convert at runtime — that way the canvas can never drift out of
  // sync with the swatches next to it.

  function oklchToRgb(L, C, hDeg) {
    const h = (hDeg * Math.PI) / 180;
    const a = C * Math.cos(h);
    const b = C * Math.sin(h);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;

    const lin = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];

    return lin.map(function (v) {
      const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      return Math.max(0, Math.min(255, Math.round(g * 255)));
    });
  }

  const rgbCache = {};

  // Accepts "oklch(L C H)" or "#rrggbb" and returns [r, g, b].
  function toRgb(color) {
    if (rgbCache[color]) return rgbCache[color];
    let rgb;
    const ok = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i.exec(color);
    if (ok) {
      rgb = oklchToRgb(parseFloat(ok[1]), parseFloat(ok[2]), parseFloat(ok[3]));
    } else {
      const h = color.replace('#', '');
      rgb = [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    rgbCache[color] = rgb;
    return rgb;
  }

  function lighten(color, t) {
    const c = toRgb(color);
    return 'rgb(' + ((c[0] + (255 - c[0]) * t) | 0) + ',' +
      ((c[1] + (255 - c[1]) * t) | 0) + ',' + ((c[2] + (255 - c[2]) * t) | 0) + ')';
  }

  function darken(color, t) {
    const c = toRgb(color);
    return 'rgb(' + ((c[0] * (1 - t)) | 0) + ',' + ((c[1] * (1 - t)) | 0) + ',' +
      ((c[2] * (1 - t)) | 0) + ')';
  }

  function withAlpha(color, a) {
    const c = toRgb(color);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  // ─── TEXTURE ───────────────────────────────────────────────────────────────
  // Built once and reused as a repeating pattern, blurred so it reads as grain
  // rather than static.

  const noiseCanvas = (function () {
    const nc = document.createElement('canvas');
    nc.width = nc.height = 512;
    const nctx = nc.getContext('2d');
    const id = nctx.createImageData(512, 512);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    nctx.putImageData(id, 0, 0);
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = 512;
    const tctx = tmp.getContext('2d');
    tctx.filter = 'blur(1.5px)';
    tctx.drawImage(nc, 0, 0);
    return tmp;
  })();

  function applyTextureOverlay(ctx, x0, y0, bW, bH) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = ctx.createPattern(noiseCanvas, 'repeat');
    ctx.fillRect(x0, y0, bW, bH);
    ctx.restore();
  }

  // Light bleeding through the layer, which is what makes kueh look edible
  // rather than like stacked plastic.
  function drawSubsurface(ctx, x0, ly, bW, lH, color) {
    const c = toRgb(color);
    const cx = x0 + bW * 0.5;
    const cy = ly + lH * 0.48;
    const br = function (v) { return Math.min(255, (v + 60) | 0); };
    const sub = ctx.createRadialGradient(cx, cy, 0, cx, cy, bW * 0.55);
    sub.addColorStop(0, 'rgba(' + br(c[0]) + ',' + br(c[1]) + ',' + br(c[2]) + ',0.28)');
    sub.addColorStop(0.5, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.1)');
    sub.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sub;
    ctx.fillRect(x0, ly, bW, lH);
  }

  // Glutinous rice grains packed into a band — used for the base of a kueh
  // salat, so it doesn't read as a smooth jelly layer.
  function drawGrains(ctx, x0, ly, bW, lH, color) {
    const c = toRgb(color);
    const pale = 'rgba(' + Math.min(255, c[0] + 78) + ',' + Math.min(255, c[1] + 78) +
      ',' + Math.min(255, c[2] + 78) + ',';
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, ly, bW, lH); ctx.clip();
    // Deterministic so the grains don't crawl between redraws.
    let seed = 7;
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const n = Math.round(bW * lH * 0.02);
    for (let i = 0; i < n; i++) {
      const gx = x0 + rnd() * bW;
      const gy = ly + rnd() * lH;
      const r = 0.9 + rnd() * 1.3;
      ctx.beginPath();
      ctx.ellipse(gx, gy, r * 1.45, r, rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = pale + (0.16 + rnd() * 0.4).toFixed(2) + ')';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPointSpecular(ctx, x0, ly, bW, lH) {
    const spotX = x0 + bW * 0.27;
    const spotY = ly + lH * 0.3;
    const rX = bW * 0.22;
    const rY = lH * 0.55;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, ly, bW, lH); ctx.clip();
    ctx.beginPath(); ctx.ellipse(spotX, spotY, rX, rY, 0, 0, Math.PI * 2);
    const sp = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, rX);
    sp.addColorStop(0, 'rgba(255,255,255,0.58)');
    sp.addColorStop(0.35, 'rgba(255,255,255,0.16)');
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp; ctx.fill();
    ctx.restore();
  }

  // ─── SILHOUETTE ────────────────────────────────────────────────────────────
  // Traces the rounded outer outline of the block (all three faces) clockwise.

  function silhouettePath(ctx, x0, y0, bW, bH, dX, dY, cr) {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + cr);
    ctx.lineTo(x0, y0 + bH - cr);
    ctx.arcTo(x0, y0 + bH, x0 + bW, y0 + bH, cr);                     // bottom-left
    ctx.arcTo(x0 + bW, y0 + bH, x0 + bW + dX, y0 + bH + dY, cr);      // bottom-right front
    ctx.arcTo(x0 + bW + dX, y0 + bH + dY, x0 + bW + dX, y0, cr);      // bottom-right side
    ctx.arcTo(x0 + bW + dX, y0 + dY, x0 + dX, y0 + dY, cr);           // top-right
    ctx.arcTo(x0 + dX, y0 + dY, x0, y0, cr);                          // top-left back
    ctx.arcTo(x0, y0, x0, y0 + bH, cr);                               // top-left front
    ctx.closePath();
  }

  // ─── FINISHES ──────────────────────────────────────────────────────────────
  // How each exterior option changes the block: corner softness, how glossy the
  // top reads, and whether the top face gets its own treatment.

  const FINISHES = {
    steamed:   { round: 0.05, maxRound: 12, gloss: 1.0 },
    glutinous: { round: 0.13, maxRound: 26, gloss: 0.55 },
    coconut:   { round: 0.06, maxRound: 14, gloss: 0.3, dust: true },
    torched:   { round: 0.03, maxRound: 8,  gloss: 0.75, scorch: true },
  };

  // Grated-coconut speckle across the top face.
  function drawCoconutDust(ctx, x0, y0, bW, dX, dY) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + bW, y0);
    ctx.lineTo(x0 + bW + dX, y0 + dY);
    ctx.lineTo(x0 + dX, y0 + dY);
    ctx.closePath();
    ctx.clip();
    // Deterministic scatter so the flakes don't crawl between redraws.
    let seed = 1;
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const flakes = Math.round(bW * 0.9);
    for (let i = 0; i < flakes; i++) {
      const u = rnd(), v = rnd();
      const px = x0 + u * bW + v * dX;
      const py = y0 + v * dY;
      ctx.fillStyle = 'rgba(255,253,248,' + (0.35 + rnd() * 0.5).toFixed(2) + ')';
      ctx.fillRect(px, py, 1 + rnd() * 2.2, 1 + rnd() * 1.4);
    }
    ctx.restore();
  }

  // ─── BLOCK ─────────────────────────────────────────────────────────────────

  function drawKueh(ctx, W, H, opts) {
    const colors = opts.colors && opts.colors.length ? opts.colors : ['#2a7a4a', '#f2e4c8'];
    const N = Math.max(1, opts.layers || 1);
    // Bands generalise the layer stack. Lapis and the rest pass a layer count
    // and get N equal bands; kueh salat passes two of unequal weight, the lower
    // one speckled to read as glutinous rice.
    const bandSpec = (opts.bands && opts.bands.length) ? opts.bands : null;
    const fin = FINISHES[opts.finish] || FINISHES.steamed;
    const baseline = opts.baseline == null ? 0.8 : opts.baseline;
    const layerColor = function (i) { return colors[i % colors.length]; };
    const bands = bandSpec || Array.from({ length: N }, function (_, i) {
      return { color: layerColor(i), weight: 1 };
    });
    const topColor = opts.topColor || bands[0].color;
    const bottomColor = bands[bands.length - 1].color;

    // Fit the block to the box it's been handed. v1 assumed a large canvas and
    // used fixed layer heights; here the stack height is driven by the box so
    // it works in both the small machine window and the big chamber.
    const bH = Math.max(28, H * 0.46);
    // Resolve each band to an absolute top edge and height.
    const totalWeight = bands.reduce(function (s, b) { return s + (b.weight || 1); }, 0);
    let runY = 0;
    const rows = bands.map(function (b) {
      const h = bH * (b.weight || 1) / totalWeight;
      const row = { color: b.color, speckle: !!b.speckle, top: runY, h: h };
      runY += h;
      return row;
    });
    const layerH = bH / bands.length;   // only used for corner rounding now
    const bW = Math.min(W * 0.52, bH * 2.4, 380);
    const dX = bW * 0.26;
    const dY = -(bW * 0.076);
    const x0 = (W - (bW + dX)) / 2;
    const y0 = H * baseline - bH;
    const cr = Math.min(bW * fin.round, fin.maxRound, layerH * 1.5);

    // ── Contact shadow ──
    const shX = x0 + (bW + dX) * 0.5;
    const shY = y0 + bH + Math.max(6, H * 0.03);
    const shW = (bW + dX) * 0.56;
    const shH = shW * 0.12;
    const shad = ctx.createRadialGradient(shX, shY, 0, shX, shY + shH * 0.5, shW);
    shad.addColorStop(0, 'rgba(20,12,4,0.42)');
    shad.addColorStop(0.5, 'rgba(20,12,4,0.16)');
    shad.addColorStop(1, 'rgba(20,12,4,0)');
    ctx.fillStyle = shad;
    ctx.beginPath();
    ctx.ellipse(shX, shY, shW, shH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Everything below is clipped to the rounded silhouette.
    ctx.save();
    silhouettePath(ctx, x0, y0, bW, bH, dX, dY, cr);
    ctx.clip();

    // ── Right side face ──
    for (let i = 0; i < rows.length; i++) {
      const color = rows[i].color;
      const y1 = y0 + rows[i].top;
      const y2 = y1 + rows[i].h;
      ctx.beginPath();
      ctx.moveTo(x0 + bW, y1);
      ctx.lineTo(x0 + bW + dX, y1 + dY);
      ctx.lineTo(x0 + bW + dX, y2 + dY);
      ctx.lineTo(x0 + bW, y2);
      ctx.closePath();
      const sg = ctx.createLinearGradient(x0 + bW, y1, x0 + bW + dX, y1 + dY);
      sg.addColorStop(0, darken(color, 0.28));
      sg.addColorStop(1, darken(color, 0.42));
      ctx.fillStyle = sg;
      ctx.fill();
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(x0 + bW, y1);
        ctx.lineTo(x0 + bW + dX, y1 + dY);
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.moveTo(x0 + bW, y0);
    ctx.lineTo(x0 + bW + dX, y0 + dY);
    ctx.lineTo(x0 + bW + dX, y0 + dY + bH);
    ctx.lineTo(x0 + bW, y0 + bH);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Front face ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, bW, bH);
    ctx.clip();

    for (let i = 0; i < rows.length; i++) {
      const color = rows[i].color;
      const ly = y0 + rows[i].top;
      const lh = rows[i].h;

      const fg = ctx.createLinearGradient(x0, 0, x0 + bW, 0);
      fg.addColorStop(0, darken(color, 0.24));
      fg.addColorStop(0.14, color);
      fg.addColorStop(0.52, lighten(color, 0.13));
      fg.addColorStop(0.86, color);
      fg.addColorStop(1, darken(color, 0.2));
      ctx.fillStyle = fg;
      ctx.fillRect(x0, ly, bW, lh + 0.5);

      drawSubsurface(ctx, x0, ly, bW, lh, color);

      // Lower layers sit deeper in shadow.
      ctx.fillStyle = 'rgba(0,0,0,' + (i / rows.length) * 0.05 + ')';
      ctx.fillRect(x0, ly, bW, lh);

      if (rows[i].speckle) drawGrains(ctx, x0, ly, bW, lh, color);

      if (fin.gloss > 0.4) drawPointSpecular(ctx, x0, ly, bW, lh);

      // Seam between layers.
      const seam = Math.max(0.6, lh * 0.09);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x0, ly + lh - seam, bW, seam);
    }

    const edgeFade = ctx.createLinearGradient(x0, 0, x0 + bW, 0);
    edgeFade.addColorStop(0, 'rgba(0,0,0,0.2)');
    edgeFade.addColorStop(0.06, 'rgba(0,0,0,0)');
    edgeFade.addColorStop(0.94, 'rgba(0,0,0,0)');
    edgeFade.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = edgeFade;
    ctx.fillRect(x0, y0, bW, bH);

    ctx.restore(); // end front-face clip

    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, bW, bH); ctx.clip();
    applyTextureOverlay(ctx, x0, y0, bW, bH);
    ctx.restore();

    // ── Top face ──
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + bW, y0);
    ctx.lineTo(x0 + bW + dX, y0 + dY);
    ctx.lineTo(x0 + dX, y0 + dY);
    ctx.closePath();
    const tg = ctx.createLinearGradient(x0, y0 + dY, x0 + bW, y0);
    if (fin.scorch) {
      tg.addColorStop(0, '#8a5a22');
      tg.addColorStop(0.4, '#b07636');
      tg.addColorStop(1, '#6d4118');
    } else {
      tg.addColorStop(0, lighten(topColor, 0.22));
      tg.addColorStop(0.4, lighten(topColor, 0.38));
      tg.addColorStop(1, lighten(topColor, 0.16));
    }
    ctx.fillStyle = tg;
    ctx.fill();

    if (fin.dust) drawCoconutDust(ctx, x0, y0, bW, dX, dY);

    // Sheen across the top.
    if (fin.gloss > 0) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + bW, y0);
      ctx.lineTo(x0 + bW + dX, y0 + dY);
      ctx.lineTo(x0 + dX, y0 + dY);
      ctx.closePath();
      const gloss = ctx.createLinearGradient(x0 + dX, y0 + dY, x0 + bW * 0.65, y0);
      gloss.addColorStop(0, 'rgba(255,255,255,0)');
      gloss.addColorStop(0.22, 'rgba(255,255,255,' + (0.42 * fin.gloss).toFixed(3) + ')');
      gloss.addColorStop(0.52, 'rgba(255,255,255,' + (0.14 * fin.gloss).toFixed(3) + ')');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.fill();
    }

    // Bright lip along the front top edge.
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + bW, y0);
    ctx.lineTo(x0 + bW, y0 + 2); ctx.lineTo(x0, y0 + 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0 + bW, y0);
    ctx.lineTo(x0 + bW + dX, y0 + dY); ctx.lineTo(x0 + dX, y0 + dY);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore(); // end silhouette clip

    ctx.save();
    silhouettePath(ctx, x0, y0, bW, bH, dX, dY, cr);
    ctx.strokeStyle = 'rgba(0,0,0,0.24)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // ── Colour spill onto the surface below ──
    const spill = ctx.createLinearGradient(x0, y0 + bH, x0, y0 + bH + 36);
    spill.addColorStop(0, withAlpha(bottomColor, 0.12));
    spill.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spill;
    ctx.fillRect(x0 - 10, y0 + bH, bW + 20, 38);
  }

  // ─── ATTACH ────────────────────────────────────────────────────────────────
  // Binds a canvas to the renderer, keeping it sized to its box at device
  // resolution and redrawing on resize with whatever options were last given.

  function attach(canvas, defaults) {
    const ctx = canvas.getContext('2d');
    let opts = Object.assign({}, defaults);

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
      // An empty machine draws nothing — the chamber just sits there, waiting.
      if (opts.empty) return;
      drawKueh(ctx, w, h, opts);
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(paint).observe(canvas);
    } else {
      window.addEventListener('resize', paint);
    }

    return {
      draw: function (next) {
        opts = Object.assign(opts, next);
        paint();
      },
    };
  }

  return { attach: attach, draw: drawKueh, toRgb: toRgb };
})();
