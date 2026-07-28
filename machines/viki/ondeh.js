// ─── DATA ─────────────────────────────────────────────────────────────────────

const EXTERIOR_COLORS = [
  { id: 'green',  name: 'Green',   hex: '#72c47e' },
  { id: 'blue',   name: 'Blue',    hex: '#5a8ac8' },
  { id: 'pink',   name: 'Pink',    hex: '#e07898' },
  { id: 'white',  name: 'White',   hex: '#f0ece4' },
  { id: 'purple', name: 'Purple',  hex: '#8a6ac0' },
  { id: 'yellow', name: 'Yellow',  hex: '#e8c840' },
];

const FILLINGS = [
  { id: 'gula_melaka',    name: 'Gula Melaka',    hex: '#5c2a0a', glossy: true  },
  { id: 'kaya',           name: 'Kaya',           hex: '#7a8a2a', glossy: false },
  { id: 'custard',        name: 'Custard',        hex: '#f0c840', glossy: false },
  { id: 'nutella',        name: 'Nutella',        hex: '#3a1a08', glossy: false },
  { id: 'chocolate',      name: 'Chocolate',      hex: '#2c1206', glossy: false },
  { id: 'red_bean',       name: 'Red Bean',       hex: '#7a1a36', glossy: false },
  { id: 'taro',           name: 'Taro',           hex: '#9b7ec8', glossy: false },
  { id: 'durian',         name: 'Durian',         hex: '#c8b448', glossy: true  },
  { id: 'salted_egg',     name: 'Salted Egg',     hex: '#f0920a', glossy: true  },
  { id: 'matcha_cream',   name: 'Matcha Cream',   hex: '#5a8030', glossy: false },
];

const COATINGS = [
  { id: 'coconut',        name: 'Coconut Flakes'   },
  { id: 'toasted_coconut',name: 'Toasted Coconut'  },
  { id: 'sesame',         name: 'Sesame Seeds'     },
  { id: 'peanuts',        name: 'Crushed Peanuts'  },
  { id: 'sugar',          name: 'Powdered Sugar'   },
  { id: 'matcha',         name: 'Matcha Powder'    },
  { id: 'cocoa',          name: 'Cocoa Powder'     },
];

// ─── STATE ────────────────────────────────────────────────────────────────────

const state = {
  exterior:        'green',
  customExterior:  '#72c47e',
  filling:         'gula_melaka',
  coating:         'coconut',
  particles:       [],
};

// ─── DRIP ANIMATION ──────────────────────────────────────────────────────────

const drips = [
  { ox: -0.18, progress: 0.08, speed: 0.0050 },
  { ox:  0.11, progress: 0.62, speed: 0.0038 },
];

function updateDrips() {
  drips.forEach(d => {
    d.progress += d.speed;
    if (d.progress >= 1) {
      d.progress = 0;
      d.ox = (Math.random() * 0.56 - 0.28);
    }
  });
}

function drawDrips(cx, cy, fillR, faceR) {
  const fill   = fillingData();
  const [fr, fg, fb] = hexToRgb(fill.hex);
  // Drips are slightly darker — gravity pools denser liquid at the tip
  const dripR = (fr * 0.80) | 0;
  const dripG = (fg * 0.80) | 0;
  const dripB = (fb * 0.80) | 0;
  // Max drip extension: from anchor to near the faceR boundary
  const maxLen = (faceR - fillR) * 1.05 + fillR * 0.20;

  drips.forEach(d => {
    // Anchor sits inside the filling circle — the filling disc drawn on top will hide the top of the drip
    const anchorX = cx + d.ox * fillR * 0.28;
    const anchorY = cy + fillR * 0.82;
    const dripLen = maxLen * d.progress;
    // Neck narrows as the drip stretches and thins before the next drop forms
    const neckW   = fillR * 0.092 * (1 - d.progress * 0.44);

    if (dripLen < 1) return;

    function dripPath() {
      ctx.beginPath();
      ctx.moveTo(anchorX - neckW, anchorY);
      ctx.bezierCurveTo(
        anchorX - neckW * 0.68, anchorY + dripLen * 0.36,
        anchorX - neckW * 0.20, anchorY + dripLen * 0.83,
        anchorX,                anchorY + dripLen
      );
      ctx.bezierCurveTo(
        anchorX + neckW * 0.20, anchorY + dripLen * 0.83,
        anchorX + neckW * 0.68, anchorY + dripLen * 0.36,
        anchorX + neckW,        anchorY
      );
      ctx.closePath();
    }

    dripPath();
    ctx.fillStyle = `rgb(${dripR},${dripG},${dripB})`;
    ctx.fill();

    // Wet sheen on drip — more prominent for glossy fillings
    const sheenAlpha = fill.glossy ? 0.50 : 0.20;
    if (dripLen > fillR * 0.08) {
      const sp = ctx.createRadialGradient(
        anchorX - neckW * 0.30, anchorY + dripLen * 0.60, 0,
        anchorX,                anchorY + dripLen * 0.65, neckW * 2.2
      );
      sp.addColorStop(0, `rgba(255,255,255,${sheenAlpha})`);
      sp.addColorStop(1, 'rgba(255,255,255,0)');
      dripPath();
      ctx.fillStyle = sp;
      ctx.fill();
    }
  });
}

// ─── COLOR UTILITIES ──────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function lighten(hex, t) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${(r+(255-r)*t)|0},${(g+(255-g)*t)|0},${(b+(255-b)*t)|0})`;
}

function darken(hex, t) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${(r*(1-t))|0},${(g*(1-t))|0},${(b*(1-t))|0})`;
}

function exteriorHex() {
  if (state.exterior === 'custom') return state.customExterior;
  return (EXTERIOR_COLORS.find(c => c.id === state.exterior) || EXTERIOR_COLORS[0]).hex;
}

function fillingData() {
  return FILLINGS.find(f => f.id === state.filling) || FILLINGS[0];
}

// ─── CANVAS ──────────────────────────────────────────────────────────────────

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

const ro = new ResizeObserver(() => {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  draw();
});
ro.observe(canvas);

// ─── PARTICLES ───────────────────────────────────────────────────────────────

function generateParticles() {
  state.particles = [];
  const isPowder = state.coating === 'sugar' || state.coating === 'matcha' || state.coating === 'cocoa';
  const n       = isPowder ? 1200 : 500;
  const maxDist = isPowder ? 0.98  : 0.96;
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.sqrt(Math.random()) * maxDist;
    state.particles.push({
      ox:    Math.cos(angle) * dist,
      oy:    Math.sin(angle) * dist,
      rot:   Math.random() * Math.PI,
      len:   6 + Math.random() * 11,
      lw:    1.4 + Math.random() * 1.4,
      alpha: 0.52 + Math.random() * 0.42,
      size:  isPowder ? 1.5 + Math.random() * 1.2 : 0.9,
    });
  }
}

// ─── BACKGROUND ──────────────────────────────────────────────────────────────

function drawBackground(W, H) {
  const bg = ctx.createRadialGradient(W*0.5, H*0.42, 0, W*0.5, H*0.42, W*0.72);
  bg.addColorStop(0,   '#f5f0e8');
  bg.addColorStop(0.5, '#ede7dc');
  bg.addColorStop(1,   '#e2dbd0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W*0.5, H*0.38, 0, W*0.5, H*0.38, W*0.45);
  glow.addColorStop(0, 'rgba(255,248,235,0.55)');
  glow.addColorStop(1, 'rgba(255,248,235,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

// ─── BANANA LEAF ─────────────────────────────────────────────────────────────

function leafPath(lW, lH) {
  ctx.moveTo(0, -lH * 0.50);
  ctx.bezierCurveTo( lW*0.28, -lH*0.50,  lW*0.50, -lH*0.28,  lW*0.50,  0);
  ctx.bezierCurveTo( lW*0.50,  lH*0.28,  lW*0.28,  lH*0.50,  0,        lH*0.50);
  ctx.bezierCurveTo(-lW*0.28,  lH*0.50, -lW*0.50,  lH*0.28, -lW*0.50,  0);
  ctx.bezierCurveTo(-lW*0.50, -lH*0.28, -lW*0.28, -lH*0.50,  0,       -lH*0.50);
  ctx.closePath();
}

function drawBananaLeaf(W, H) {
  const cx = W * 0.50;
  const cy = H * 0.63;
  const lW = W * 0.72;
  const lH = H * 0.26;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08);

  // Ambient shadow under leaf
  const sh = ctx.createRadialGradient(0, lH * 0.1, 0, 0, lH * 0.1, lW * 0.44);
  sh.addColorStop(0, 'rgba(0,0,0,0.20)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(0, lH * 0.24, lW * 0.44, lH * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leaf body
  ctx.beginPath();
  leafPath(lW, lH);
  const lg = ctx.createLinearGradient(-lW * 0.38, -lH * 0.38, lW * 0.38, lH * 0.38);
  lg.addColorStop(0,    '#1e5c1a');
  lg.addColorStop(0.35, '#2e7a26');
  lg.addColorStop(0.65, '#256c20');
  lg.addColorStop(1,    '#1c5018');
  ctx.fillStyle = lg;
  ctx.fill();

  // Midrib
  ctx.beginPath();
  ctx.moveTo(-lW * 0.46, 0);
  ctx.lineTo( lW * 0.46, 0);
  ctx.strokeStyle = 'rgba(170,220,140,0.55)';
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // Lateral veins
  for (let i = 0; i < 13; i++) {
    const x    = -lW * 0.43 + (lW * 0.86) * i / 12;
    const maxY = lH * 0.42 * (1 - Math.pow(Math.abs(x) / (lW * 0.50), 1.2));
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + lW * 0.030, -maxY);
    ctx.moveTo(x, 0);
    ctx.lineTo(x + lW * 0.030,  maxY);
    ctx.strokeStyle = 'rgba(160,215,130,0.22)';
    ctx.lineWidth   = 0.85;
    ctx.stroke();
  }

  // Sheen
  ctx.beginPath();
  leafPath(lW, lH);
  const sheen = ctx.createLinearGradient(-lW * 0.16, -lH * 0.36, lW * 0.05, lH * 0.08);
  sheen.addColorStop(0, 'rgba(255,255,255,0.14)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fill();

  // Outline
  ctx.beginPath();
  leafPath(lW, lH);
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.restore();
}

// ─── COATING ─────────────────────────────────────────────────────────────────

function drawFlakes(cx, cy, r, color) {
  state.particles.forEach(p => {
    ctx.save();
    ctx.translate(cx + p.ox * r, cy + p.oy * r);
    ctx.rotate(p.rot);
    ctx.strokeStyle = `rgba(${color},${p.alpha})`;
    ctx.lineWidth   = p.lw;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(-p.len / 2, 0);
    ctx.lineTo( p.len / 2, 0);
    ctx.stroke();
    ctx.restore();
  });
}

function drawDots(cx, cy, r, color) {
  state.particles.forEach(p => {
    ctx.save();
    ctx.translate(cx + p.ox * r, cy + p.oy * r);
    ctx.rotate(p.rot);
    ctx.fillStyle = `rgba(${color},${p.alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.4, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPowder(cx, cy, r, dotColor) {
  ctx.fillStyle = dotColor;
  state.particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(cx + p.ox * r, cy + p.oy * r, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCoating(cx, cy, r) {
  switch (state.coating) {
    case 'coconut':
      drawFlakes(cx, cy, r, '255,252,240');
      break;
    case 'toasted_coconut':
      drawFlakes(cx, cy, r, '200,148,55');
      break;
    case 'sesame':
      drawDots(cx, cy, r, '210,175,100');
      break;
    case 'peanuts':
      state.particles.forEach(p => {
        ctx.save();
        ctx.translate(cx + p.ox * r, cy + p.oy * r);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(188,148,72,${p.alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.2, 5.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      break;
    case 'sugar':
      drawPowder(cx, cy, r, 'rgba(255,255,255,0.88)');
      break;
    case 'matcha':
      drawPowder(cx, cy, r, 'rgba(58,98,18,0.90)');
      break;
    case 'cocoa':
      drawPowder(cx, cy, r, 'rgba(48,20,5,0.90)');
      break;
  }
}

// ─── SPHERE HELPERS ──────────────────────────────────────────────────────────

function drawSphereShading(cx, cy, r) {
  const sg = ctx.createRadialGradient(cx - r*0.28, cy - r*0.28, 0, cx, cy, r * 1.05);
  sg.addColorStop(0,    'rgba(255,255,255,0.32)');
  sg.addColorStop(0.45, 'rgba(255,255,255,0)');
  sg.addColorStop(1,    'rgba(0,0,0,0.30)');
  ctx.fillStyle = sg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function drawSpecular(cx, cy, r) {
  const sp = ctx.createRadialGradient(cx - r*0.30, cy - r*0.32, 0, cx - r*0.20, cy - r*0.22, r * 0.42);
  sp.addColorStop(0,   'rgba(255,255,255,0.78)');
  sp.addColorStop(0.4, 'rgba(255,255,255,0.22)');
  sp.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = sp;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function drawBallShadow(cx, cy, r) {
  const sh = ctx.createRadialGradient(cx, cy + r * 0.88, 0, cx, cy + r * 0.88, r * 0.76);
  sh.addColorStop(0, 'rgba(0,0,0,0.28)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.04, cy + r * 0.90, r * 0.72, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ─── FULL BALL ────────────────────────────────────────────────────────────────

function drawFullBall(cx, cy, r) {
  const hex = exteriorHex();

  drawBallShadow(cx, cy, r);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = hex;
  ctx.fill();

  drawSphereShading(cx, cy, r);
  drawCoating(cx, cy, r);
  drawSpecular(cx, cy, r);

  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth   = 1;
  ctx.stroke();
}

// ─── CROSS-SECTION BALL ──────────────────────────────────────────────────────

function drawCrossSectionBall(cx, cy, r) {
  const hex    = exteriorHex();
  const fill   = fillingData();
  const faceR  = r * 0.95; // cut face slightly smaller so coated exterior peeks at edge
  const fillR  = r * 0.60; // filling radius

  drawBallShadow(cx, cy, r);

  // Back hemisphere — full sphere with coating, no specular (it's behind)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = darken(hex, 0.08);
  ctx.fill();
  drawSphereShading(cx, cy, r);
  drawCoating(cx, cy, r);
  ctx.restore();

  // Cut face — flat disc on top
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
  ctx.clip();

  // Dough ring (cut surface of the dough — slightly lighter and more matte)
  ctx.fillStyle = lighten(hex, 0.18);
  ctx.fillRect(cx - faceR, cy - faceR, faceR * 2, faceR * 2);

  // Rim depth shadow (darkens toward the edge of the cut face)
  const rimG = ctx.createRadialGradient(cx, cy, faceR * 0.76, cx, cy, faceR);
  rimG.addColorStop(0, 'rgba(0,0,0,0)');
  rimG.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = rimG;
  ctx.fillRect(cx - faceR, cy - faceR, faceR * 2, faceR * 2);

  // Drips — drawn before the filling circle so the filling disc covers the anchor point
  // Only the portion that extends past the fillR boundary is visible
  drawDrips(cx, cy, fillR, faceR);

  // Filling
  const fg = ctx.createRadialGradient(cx - fillR*0.18, cy - fillR*0.18, 0, cx, cy, fillR);
  fg.addColorStop(0,    lighten(fill.hex, 0.24));
  fg.addColorStop(0.55, fill.hex);
  fg.addColorStop(1,    darken(fill.hex, 0.32));
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(cx, cy, fillR, 0, Math.PI * 2);
  ctx.fill();

  // Gloss on filling (gula melaka is syrupy and reflective)
  if (fill.glossy) {
    const gloss = ctx.createRadialGradient(cx - fillR*0.32, cy - fillR*0.36, 0, cx - fillR*0.10, cy - fillR*0.10, fillR * 0.72);
    gloss.addColorStop(0,   'rgba(255,255,255,0.42)');
    gloss.addColorStop(0.5, 'rgba(255,255,255,0.10)');
    gloss.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.arc(cx, cy, fillR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dough-to-filling border
  ctx.beginPath();
  ctx.arc(cx, cy, fillR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.20)';
  ctx.lineWidth   = 1.2;
  ctx.stroke();

  // Subtle face shading (top-left light, bottom-right shadow)
  const faceShade = ctx.createLinearGradient(cx - faceR, cy - faceR, cx + faceR*0.4, cy + faceR*0.4);
  faceShade.addColorStop(0, 'rgba(255,255,255,0.07)');
  faceShade.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = faceShade;
  ctx.fillRect(cx - faceR, cy - faceR, faceR * 2, faceR * 2);

  ctx.restore();

  // Outer outline
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.20)';
  ctx.lineWidth   = 1;
  ctx.stroke();
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────

function draw() {
  const W = canvas.width;
  const H = canvas.height;
  if (!W || !H) return;
  ctx.clearRect(0, 0, W, H);

  drawBackground(W, H);
  drawBananaLeaf(W, H);

  const r      = Math.min(W * 0.16, H * 0.20);
  const leafCY = H * 0.63;

  // Back ball (full) — right side, drawn first so cross-section overlaps it
  drawFullBall(W * 0.61, leafCY - r * 0.88, r);

  // Front ball (cross-section) — left side, drawn on top
  drawCrossSectionBall(W * 0.39, leafCY - r * 0.68, r);
}

// ─── UI RENDERING ─────────────────────────────────────────────────────────────

function renderExterior() {
  const el = document.getElementById('exterior-grid');
  const isCustom = state.exterior === 'custom';
  el.innerHTML = EXTERIOR_COLORS.map(c => `
    <button class="color-chip${c.id === state.exterior ? ' active' : ''}" data-ext="${c.id}">
      <span class="color-chip-circle" style="background:${c.hex}"></span>
      <span class="color-chip-label">${c.name}</span>
    </button>`).join('') + `
    <label class="color-chip${isCustom ? ' active' : ''}" id="custom-ext-chip" style="position:relative;">
      <input type="color" value="${state.customExterior}" id="custom-ext-input"
             style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:none;padding:0;">
      <span class="color-chip-circle" id="custom-ext-circle" style="background:${state.customExterior};pointer-events:none;"></span>
      <span class="color-chip-label" style="pointer-events:none;">Custom</span>
    </label>`;

  el.querySelectorAll('[data-ext]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.exterior = btn.dataset.ext;
      renderExterior();
      draw();
    });
  });

  const input  = document.getElementById('custom-ext-input');
  const circle = document.getElementById('custom-ext-circle');
  const chip   = document.getElementById('custom-ext-chip');

  input.addEventListener('input', e => {
    state.customExterior = e.target.value;
    state.exterior = 'custom';
    circle.style.background = e.target.value;
    el.querySelectorAll('.color-chip').forEach(b => b.classList.remove('active'));
    chip.classList.add('active');
    draw();
  });

  input.addEventListener('change', () => {
    renderExterior();
    draw();
  });
}

function renderFilling() {
  const el = document.getElementById('filling-chips');
  el.innerHTML = FILLINGS.map(f => `
    <button class="chip${f.id === state.filling ? ' active' : ''}" data-fill="${f.id}">${f.name}</button>`
  ).join('');
  el.querySelectorAll('[data-fill]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filling = btn.dataset.fill;
      renderFilling();
      draw();
    });
  });
}

function renderCoating() {
  const el = document.getElementById('coating-chips');
  el.innerHTML = COATINGS.map(c => `
    <button class="chip${c.id === state.coating ? ' active' : ''}" data-coat="${c.id}">${c.name}</button>`
  ).join('');
  el.querySelectorAll('[data-coat]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.coating = btn.dataset.coat;
      generateParticles();
      renderCoating();
      draw();
    });
  });
}

// ─── RECIPE GENERATOR ────────────────────────────────────────────────────────

function generateOndehRecipeHTML() {
  const ext  = state.exterior === 'custom'
    ? { id: 'custom', name: 'Custom', hex: state.customExterior }
    : (EXTERIOR_COLORS.find(c => c.id === state.exterior) || EXTERIOR_COLORS[0]);
  const fill = fillingData();
  const coat = COATINGS.find(c => c.id === state.coating) || COATINGS[0];

  const colorIngredient = {
    green:  'fresh pandan juice (blend 10 pandan leaves with 80ml water, squeeze through cloth)',
    blue:   'butterfly pea flower tea (steep 20 dried flowers in 80ml hot water, cool)',
    pink:   '80ml water + ½ tsp rose or strawberry extract, plus a drop of pink food colouring',
    white:  'plain water (no colouring)',
    purple: '80ml water + ½ tsp ube extract or purple yam powder',
    yellow: '80ml water + ¼ tsp turmeric powder, stirred until dissolved',
  }[ext.id] || 'food colouring of your choice (80ml water)';

  const fillingNote = {
    gula_melaka:  'Roughly chop 120g gula melaka (palm sugar) into small pieces. Do not melt — it will dissolve during cooking.',
    kaya:         'Use 120g thick store-bought kaya, chilled until firm enough to scoop.',
    custard:      'Make a thick custard from 2 egg yolks, 30g sugar, 15g cornflour, and 80ml coconut milk. Cool completely and chill until firm.',
    nutella:      'Freeze 120g Nutella in a small tray in teaspoon-sized portions for at least 2 hours before use.',
    chocolate:    'Chop 120g dark chocolate (70%) into small pieces, about 1 tsp per ball.',
    red_bean:     'Use 120g thick red bean paste (store-bought or homemade). Chill until firm.',
    taro:         'Steam and mash 150g taro with 1 tbsp sugar and a pinch of salt. Cool completely.',
    durian:       'Use 120g fresh durian flesh, seeds removed. Portion into small mounds and freeze for 30 minutes.',
    salted_egg:   'Use 3 salted egg yolks, steamed for 8 minutes and cooled. Quarter each yolk.',
    matcha_cream: 'Mix 80g cream cheese with 1 tsp matcha powder and 1 tbsp icing sugar until smooth. Chill.',
  }[fill.id] || 'Prepare filling as desired.';

  const coatingNote = {
    coconut:         'Use 200g freshly grated coconut (white part only). Mix with ½ tsp salt and a pinch of sugar.',
    toasted_coconut: 'Toast 200g grated coconut in a dry pan over low heat, stirring constantly, until golden and fragrant.',
    sesame:          'Mix 150g white sesame seeds with 1 tbsp sugar. Toast lightly in a dry pan.',
    peanuts:         'Crush 150g roasted peanuts coarsely. Mix with 1 tbsp sugar.',
    sugar:           'Sift 100g icing sugar onto a plate. Roll balls immediately after cooking while still moist.',
    matcha:          'Mix 80g icing sugar with 2 tsp matcha powder. Sift together onto a plate.',
    cocoa:           'Mix 80g icing sugar with 2 tbsp unsweetened cocoa powder. Sift together onto a plate.',
  }[coat.id] || 'Prepare coating as desired.';

  return `
    <div class="modal-eyebrow">Your recipe</div>
    <h2 class="modal-title">${ext.name} Ondeh Ondeh<br>with ${fill.name} &amp; ${coat.name}</h2>
    <p class="modal-sub">Makes about 20 pieces &middot; ~45 minutes</p>

    <h3 class="recipe-section">Dough</h3>
    <ul class="recipe-list">
      <li><span class="recipe-dot"></span>250g glutinous rice flour</li>
      <li><span class="recipe-dot"></span>${colorIngredient}</li>
      <li><span class="recipe-dot"></span>50ml coconut milk</li>
      <li><span class="recipe-dot"></span>¼ tsp fine salt</li>
    </ul>

    <h3 class="recipe-section">Filling — ${fill.name}</h3>
    <ul class="recipe-list">
      <li><span class="recipe-dot"></span>${fillingNote}</li>
    </ul>

    <h3 class="recipe-section">Coating — ${coat.name}</h3>
    <ul class="recipe-list">
      <li><span class="recipe-dot"></span>${coatingNote}</li>
    </ul>

    <h3 class="recipe-section">Method</h3>
    <ol class="recipe-steps">
      <li>Prepare the filling and coating first. Set aside.</li>
      <li>Combine glutinous rice flour and salt. Add the colouring liquid and coconut milk gradually, mixing with a fork, then knead by hand until the dough is smooth and pliable — about 3 minutes. It should not crack when you roll it.</li>
      <li>Divide into 20 equal portions (~18g each). Roll each into a smooth ball, then flatten into a disc about 6cm wide.</li>
      <li>Place a portion of filling in the centre. Pinch the edges together to seal fully, then roll gently between your palms to smooth.</li>
      <li>Bring a large pot of water to a rolling boil. Add the balls in batches of 8–10. Cook until they float to the surface, then continue for 1 minute more.</li>
      <li>Scoop out with a slotted spoon. Roll immediately in the coating while the surface is still moist so it sticks.</li>
      <li>Serve warm. Ondeh ondeh are best eaten within a few hours — the dough firms up as it cools.</li>
    </ol>

    <p class="recipe-tip"><strong>Tip:</strong> Don't overfill — a heaped teaspoon of filling is enough. Too much and the ball will burst in the water.</p>
  `;
}

// ─── MODAL LOGIC ─────────────────────────────────────────────────────────────

const recipeModal = document.getElementById('recipe-modal');
const orderModal  = document.getElementById('order-modal');

document.getElementById('btn-recipe').addEventListener('click', () => {
  document.getElementById('recipe-content').innerHTML = generateOndehRecipeHTML();
  recipeModal.hidden = false;
});

document.getElementById('btn-order').addEventListener('click', () => {
  orderModal.hidden = false;
});

document.getElementById('recipe-close').addEventListener('click', () => { recipeModal.hidden = true; });
document.getElementById('order-close').addEventListener('click',  () => { orderModal.hidden  = true; });

recipeModal.addEventListener('click', e => { if (e.target === recipeModal) recipeModal.hidden = true; });
orderModal.addEventListener('click',  e => { if (e.target === orderModal)  orderModal.hidden  = true; });

// ─── INIT ─────────────────────────────────────────────────────────────────────

generateParticles();
renderExterior();
renderFilling();
renderCoating();

function loop() {
  updateDrips();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
