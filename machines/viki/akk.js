// ─── DATA ─────────────────────────────────────────────────────────────────────

const COLORS = [
  { id: 'red',    name: 'Red',    hex: '#cc2636' },
  { id: 'pink',   name: 'Pink',   hex: '#e8709a' },
  { id: 'blue',   name: 'Blue',   hex: '#5a8ac8' },
  { id: 'purple', name: 'Purple', hex: '#8a6ac0' },
  { id: 'yellow', name: 'Yellow', hex: '#e8c040' },
  { id: 'white',  name: 'White',  hex: '#f0ece4' },
  { id: 'custom', name: 'Custom', custom: true   },
];

const EFFECTS = [
  { id: 'plain',    name: 'Plain'       },
  { id: 'gradient', name: 'Gradient'    },
  { id: 'gold',     name: 'Gold Flakes' },
];

const DESIGNS = [
  { id: 'tortoise', name: 'Tortoise Shell' },
  { id: 'lotus',    name: 'Lotus Flower'   },
];

// ─── STATE ────────────────────────────────────────────────────────────────────

const state = {
  color:     'red',
  effect:    'plain',
  design:    'tortoise',
  customHex: '#cc2636',
  particles: [],
};

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

function colorHex() {
  if (state.color === 'custom') return state.customHex;
  return (COLORS.find(c => c.id === state.color) || COLORS[0]).hex;
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

// ─── PARTICLES (gold flakes) ──────────────────────────────────────────────────

function generateParticles() {
  state.particles = [];
  if (state.effect !== 'gold') return;
  for (let i = 0; i < 300; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.sqrt(Math.random()) * 0.94;
    state.particles.push({
      ox:    Math.cos(angle) * dist,
      oy:    Math.sin(angle) * dist,
      rot:   Math.random() * Math.PI,
      len:   3 + Math.random() * 5,
      lw:    1.0 + Math.random() * 0.8,
      alpha: 0.40 + Math.random() * 0.45,
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

  const sh = ctx.createRadialGradient(0, lH * 0.1, 0, 0, lH * 0.1, lW * 0.44);
  sh.addColorStop(0, 'rgba(0,0,0,0.20)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(0, lH * 0.24, lW * 0.44, lH * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  leafPath(lW, lH);
  const lg = ctx.createLinearGradient(-lW * 0.38, -lH * 0.38, lW * 0.38, lH * 0.38);
  lg.addColorStop(0,    '#1e5c1a');
  lg.addColorStop(0.35, '#2e7a26');
  lg.addColorStop(0.65, '#256c20');
  lg.addColorStop(1,    '#1c5018');
  ctx.fillStyle = lg;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-lW * 0.46, 0);
  ctx.lineTo( lW * 0.46, 0);
  ctx.strokeStyle = 'rgba(170,220,140,0.55)';
  ctx.lineWidth   = 2.5;
  ctx.stroke();

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

  ctx.beginPath();
  leafPath(lW, lH);
  const sheen = ctx.createLinearGradient(-lW * 0.16, -lH * 0.36, lW * 0.05, lH * 0.08);
  sheen.addColorStop(0, 'rgba(255,255,255,0.14)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fill();

  ctx.beginPath();
  leafPath(lW, lH);
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.restore();
}

// ─── SCALLOP PATH ────────────────────────────────────────────────────────────

// Traces a scalloped ellipse: n bumps, depth as fraction of radius (0–1)
function scallopPath(cx, cy, rX, rY, n, depth) {
  ctx.beginPath();
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const s = 1 + depth * Math.cos(t * n);
    const x = cx + Math.cos(t) * rX * s;
    const y = cy + Math.sin(t) * rY * s;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// ─── LEAF PAD ────────────────────────────────────────────────────────────────

// Ellipse leaf, slightly larger than the scalloped kueh (which reaches rX*1.06, rY*1.06)
function drawLeafPad(cx, cy, rX, rY) {
  const pRX = rX * 1.16;
  const pRY = rY * 1.14;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.04);

  // Drop shadow (subtle ellipse below)
  const sh = ctx.createRadialGradient(pRX * 0.05, pRY * 0.10, 0, pRX * 0.05, pRY * 0.10, pRX * 0.85);
  sh.addColorStop(0, 'rgba(0,0,0,0.18)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(pRX * 0.04, pRY * 0.16, pRX * 0.94, pRY * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leaf body
  const lg = ctx.createLinearGradient(-pRX * 0.3, -pRY * 0.4, pRX * 0.3, pRY * 0.4);
  lg.addColorStop(0,   '#2e8028');
  lg.addColorStop(0.5, '#256c1e');
  lg.addColorStop(1,   '#1e5c18');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.ellipse(0, 0, pRX, pRY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Midrib
  ctx.beginPath();
  ctx.moveTo(-pRX * 0.88, 0);
  ctx.lineTo( pRX * 0.88, 0);
  ctx.strokeStyle = 'rgba(160,220,130,0.50)';
  ctx.lineWidth   = 2.0;
  ctx.stroke();

  // Sheen
  const sheen = ctx.createLinearGradient(-pRX * 0.2, -pRY * 0.35, pRX * 0.1, pRY * 0.06);
  sheen.addColorStop(0, 'rgba(255,255,255,0.14)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.ellipse(0, 0, pRX, pRY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth   = 0.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, pRX, pRY, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// ─── KUEH SHADOW ─────────────────────────────────────────────────────────────

function drawKuehShadow(cx, cy, rX, rY) {
  const sh = ctx.createRadialGradient(cx, cy, rX * 0.30, cx, cy, rX * 1.06);
  sh.addColorStop(0,   'rgba(60,30,10,0)');
  sh.addColorStop(0.7, 'rgba(60,30,10,0.08)');
  sh.addColorStop(1,   'rgba(60,30,10,0.26)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(cx + rX * 0.03, cy + rY * 0.05, rX * 1.04, rY * 1.04, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ─── DESIGN PATTERNS ─────────────────────────────────────────────────────────

function drawAKKMoldDesign(cx, cy, rX, rY) {
  const hex   = colorHex();
  const dark  = darken(hex, 0.28);
  const wall  = lighten(hex, 0.22);
  const wallW = rX * 0.050;
  const sY    = rY / rX;

  // Point on ellipse at angle a, fraction r of rX
  const ep = (a, r) => [cx + Math.cos(a) * rX * r, cy + Math.sin(a) * rY * r];

  // ── Fill entire interior dark (recessed) ──────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(cx, cy, rX * 0.86, rY * 0.86, 0, 0, Math.PI * 2);
  ctx.fillStyle = dark;
  ctx.fill();

  ctx.strokeStyle = wall;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.lineWidth   = wallW;

  // ── Outer border oval ─────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(cx, cy, rX * 0.83, rY * 0.83, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ── 6 slightly curved radial spokes from center to outer border ───────────
  for (let i = 0; i < 6; i++) {
    const a           = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const perp        = a + Math.PI / 2;
    const [ex, ey]    = ep(a, 0.83);
    const bend        = rX * 0.032;   // subtle bow outward
    const cpx = cx + Math.cos(a) * rX * 0.42 + Math.cos(perp) * bend;
    const cpy = cy + Math.sin(a) * rY * 0.42 + Math.sin(perp) * bend * sY;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    ctx.stroke();
  }

  // ── Inner oval (replaces the hexagon — organic, no hard corners) ──────────
  ctx.beginPath();
  ctx.ellipse(cx, cy, rX * 0.52, rY * 0.52, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Fill inside inner oval (slightly less dark — distinct from outer sections)
  ctx.beginPath();
  ctx.ellipse(cx, cy, rX * 0.52, rY * 0.52, 0, 0, Math.PI * 2);
  ctx.fillStyle = darken(hex, 0.16);
  ctx.fill();

  // ── Curved arches in each outer section (replaces X-cross diagonals) ─────
  // Each arch flows from spoke i to spoke i+1, curving toward the outer border
  ctx.lineWidth = wallW * 0.55;
  for (let i = 0; i < 6; i++) {
    const a1   = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const a2   = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const aMid = (a1 + a2) / 2;

    const [lx, ly] = ep(a1,   0.67);   // left anchor on spoke i
    const [rx, ry] = ep(a2,   0.67);   // right anchor on spoke i+1
    const [cpx, cpy] = ep(aMid, 0.81); // control point bulging outward

    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(cpx, cpy, rx, ry);
    ctx.strokeStyle = wall;
    ctx.stroke();
  }

  // ── Lotus ring ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = wall;
  ctx.lineWidth   = wallW;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rX * 0.27, rY * 0.27, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, rX * 0.27, rY * 0.27, 0, 0, Math.PI * 2);
  ctx.fillStyle = darken(hex, 0.08);
  ctx.fill();

  // ── 8 teardrop petals (pointed tip outward, rounded base) ─────────────────
  const petalCount = 8;
  const ph = rX * 0.092;   // petal length
  const pw = rX * 0.048;   // petal half-width

  for (let i = 0; i < petalCount; i++) {
    const a  = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
    const pr = rX * 0.152;
    const px = cx + Math.cos(a) * pr;
    const py = cy + Math.sin(a) * pr * sY;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.scale(1, sY);

    // Teardrop: pointed top (outward), swollen base (toward center)
    ctx.beginPath();
    ctx.moveTo(0, -ph);
    ctx.bezierCurveTo( pw, -ph * 0.25,  pw,  ph * 0.45, 0,  ph * 0.45);
    ctx.bezierCurveTo(-pw,  ph * 0.45, -pw, -ph * 0.25, 0, -ph);
    ctx.fillStyle = wall;
    ctx.fill();

    ctx.restore();
  }

  // ── Center knob ────────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(cx, cy, rX * 0.058, rY * 0.058, 0, 0, Math.PI * 2);
  ctx.fillStyle = wall;
  ctx.fill();
}

function drawLotus(cx, cy, rX, rY) {
  const petalCount = 8;
  const outerR  = rX * 0.65;
  const innerR  = rX * 0.11;
  const scale   = rY / rX;   // perspective compression for y axis
  const hex     = colorHex();

  // Outer border
  ctx.beginPath();
  ctx.ellipse(cx, cy, rX * 0.80, rY * 0.76, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth   = 1.6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // Petals
  for (let i = 0; i < petalCount; i++) {
    const angle  = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
    const midR   = outerR * 0.52;
    const tipX   = cx + Math.cos(angle) * outerR;
    const tipY   = cy + Math.sin(angle) * outerR * scale;
    const midX   = cx + Math.cos(angle) * midR;
    const midY   = cy + Math.sin(angle) * midR * scale;
    const perp   = angle + Math.PI / 2;
    const bulge  = rX * 0.145;
    const lx     = midX + Math.cos(perp) * bulge;
    const ly     = midY + Math.sin(perp) * bulge * scale;
    const rx2    = midX - Math.cos(perp) * bulge;
    const ry2    = midY - Math.sin(perp) * bulge * scale;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(lx, ly, tipX, tipY);
    ctx.quadraticCurveTo(rx2, ry2, cx, cy);
    ctx.fillStyle = lighten(hex, 0.16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth   = 1.2;
    ctx.stroke();

    // Petal vein
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth   = 0.6;
    ctx.stroke();
  }

  // Centre circle
  ctx.beginPath();
  ctx.ellipse(cx, cy, innerR, innerR * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = lighten(hex, 0.22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.20)';
  ctx.lineWidth   = 1.2;
  ctx.stroke();
}

// ─── GOLD FLAKES ─────────────────────────────────────────────────────────────

function drawGoldFlakes(cx, cy, rX, rY) {
  state.particles.forEach(p => {
    ctx.save();
    ctx.translate(cx + p.ox * rX, cy + p.oy * rY);
    ctx.rotate(p.rot);
    ctx.strokeStyle = `rgba(212,175,55,${p.alpha})`;
    ctx.lineWidth   = p.lw;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(-p.len / 2, 0);
    ctx.lineTo( p.len / 2, 0);
    ctx.stroke();
    ctx.restore();
  });
}

// ─── ANG KU KUEH ─────────────────────────────────────────────────────────────

function drawAngKuKueh(cx, cy, rX, rY) {
  const hex = colorHex();

  drawLeafPad(cx, cy, rX, rY);
  drawKuehShadow(cx, cy, rX, rY);

  // ── Kueh body — scalloped top view ───────────────────────────────────────
  // Scallop: 20 bumps, 6% amplitude — matches the rounded-edge AKK mold border
  ctx.save();
  scallopPath(cx, cy, rX, rY, 20, 0.028);
  ctx.clip();

  // Base colour
  ctx.fillStyle = hex;
  ctx.fillRect(cx - rX * 1.2, cy - rY * 1.2, rX * 2.4, rY * 2.4);

  // Dome shading: bright off-centre top-left → dark rim (reads as convex from above)
  const domeG = ctx.createRadialGradient(cx - rX * 0.10, cy - rY * 0.14, 0, cx, cy, rX * 1.02);
  domeG.addColorStop(0,    lighten(hex, 0.50));
  domeG.addColorStop(0.26, lighten(hex, 0.12));
  domeG.addColorStop(0.66, hex);
  domeG.addColorStop(1,    darken(hex, 0.46));
  ctx.fillStyle = domeG;
  ctx.fillRect(cx - rX * 1.2, cy - rY * 1.2, rX * 2.4, rY * 2.4);

  // Gradient effect overlay
  if (state.effect === 'gradient') {
    const grd = ctx.createLinearGradient(cx, cy - rY, cx, cy + rY);
    grd.addColorStop(0, 'rgba(255,255,255,0.30)');
    grd.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = grd;
    ctx.fillRect(cx - rX * 1.2, cy - rY * 1.2, rX * 2.4, rY * 2.4);
  }

  // Mold design
  if (state.design === 'tortoise') drawAKKMoldDesign(cx, cy, rX, rY);
  else                             drawLotus(cx, cy, rX, rY);

  // Gold flakes
  if (state.effect === 'gold') drawGoldFlakes(cx, cy, rX, rY);

  ctx.restore();

  // Specular highlight (soft, off-centre top-left)
  const sp = ctx.createRadialGradient(
    cx - rX * 0.26, cy - rY * 0.32, 0,
    cx - rX * 0.08, cy - rY * 0.08, rX * 0.60
  );
  sp.addColorStop(0,    'rgba(255,255,255,0.68)');
  sp.addColorStop(0.35, 'rgba(255,255,255,0.16)');
  sp.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = sp;
  scallopPath(cx, cy, rX, rY, 20, 0.028);
  ctx.fill();

  // Rim stroke
  scallopPath(cx, cy, rX, rY, 20, 0.028);
  ctx.strokeStyle = darken(hex, 0.30);
  ctx.lineWidth   = 1.5;
  ctx.stroke();
}

// ─── DRAW ─────────────────────────────────────────────────────────────────────

function draw() {
  const W = canvas.width;
  const H = canvas.height;
  if (!W || !H) return;
  ctx.clearRect(0, 0, W, H);

  drawBackground(W, H);

  const cx = W * 0.50;
  const cy = H * 0.52;
  const rX = Math.min(W * 0.22, 140);
  const rY = rX * 0.70;  // top view: oval is ~70% as tall as wide

  drawAngKuKueh(cx, cy, rX, rY);
}

// ─── UI RENDERING ─────────────────────────────────────────────────────────────

function renderColors() {
  const grid = document.getElementById('color-grid');
  grid.innerHTML = COLORS.map(c => `
    <button class="color-chip${c.id === state.color ? ' active' : ''}" data-color="${c.id}">
      <span class="color-chip-circle" style="background:${c.custom ? state.customHex : c.hex}"></span>
      <span class="color-chip-label">${c.name}</span>
    </button>`).join('');

  grid.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.color = btn.dataset.color;
      renderColors();
      draw();
    });
  });

  // Custom colour picker
  const row = document.getElementById('custom-color-row');
  if (state.color === 'custom') {
    row.innerHTML = `
      <div class="custom-color-row" style="margin-top:0.75rem;">
        <label class="custom-color-swatch">
          <input type="color" value="${state.customHex}" id="custom-hex-input">
          <span class="custom-color-block" style="background:${state.customHex}"></span>
          <span class="custom-color-num">Custom colour</span>
        </label>
      </div>`;
    document.getElementById('custom-hex-input').addEventListener('input', e => {
      state.customHex = e.target.value;
      const block = e.target.parentElement.querySelector('.custom-color-block');
      if (block) block.style.background = e.target.value;
      // Update the chip circle too
      const customChip = grid.querySelector('[data-color="custom"] .color-chip-circle');
      if (customChip) customChip.style.background = e.target.value;
      draw();
    });
  } else {
    row.innerHTML = '';
  }
}

function renderEffects() {
  const el = document.getElementById('effect-chips');
  el.innerHTML = EFFECTS.map(e => `
    <button class="chip${e.id === state.effect ? ' active' : ''}" data-effect="${e.id}">${e.name}</button>`
  ).join('');
  el.querySelectorAll('[data-effect]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.effect = btn.dataset.effect;
      generateParticles();
      renderEffects();
      draw();
    });
  });
}

function renderDesigns() {
  const el = document.getElementById('design-chips');
  el.innerHTML = DESIGNS.map(d => `
    <button class="chip${d.id === state.design ? ' active' : ''}" data-design="${d.id}">${d.name}</button>`
  ).join('');
  el.querySelectorAll('[data-design]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.design = btn.dataset.design;
      renderDesigns();
      draw();
    });
  });
}

// ─── RECIPE GENERATOR ────────────────────────────────────────────────────────

function generateAkkRecipeHTML() {
  const col = COLORS.find(c => c.id === state.color);
  const colorName = state.color === 'custom' ? 'Custom' : (col ? col.name : 'Red');

  const coloringAgent = {
    red:    'red food colouring (or 1 tsp red yeast rice powder)',
    pink:   'pink food colouring (or 1 tsp rose extract + pink colouring)',
    blue:   'blue pea flower tea — steep 20 dried flowers in 60ml hot water, cool before use',
    purple: 'purple yam extract or ube paste (1 tsp)',
    yellow: '¼ tsp turmeric powder or a few drops of yellow colouring',
    white:  'no colouring — natural white dough',
    custom: 'food colouring of your choice',
  }[state.color] || 'red food colouring';

  const designNote = state.design === 'tortoise'
    ? 'a traditional tortoise (龜) mould with a diamond lattice shell pattern'
    : 'a lotus flower mould with petal impressions';

  return `
    <div class="modal-eyebrow">Your recipe</div>
    <h2 class="modal-title">${colorName} Ang Ku Kueh</h2>
    <p class="modal-sub">Makes about 20 pieces · ~1.5 hours (including filling prep)</p>

    <h3 class="recipe-section">Dough</h3>
    <ul class="recipe-list">
      <li><span class="recipe-dot"></span>250g glutinous rice flour</li>
      <li><span class="recipe-dot"></span>150g orange sweet potato, steamed and mashed while hot</li>
      <li><span class="recipe-dot"></span>40g vegetable shortening or lard</li>
      <li><span class="recipe-dot"></span>60–80ml warm water (add gradually)</li>
      <li><span class="recipe-dot"></span>${coloringAgent}</li>
      <li><span class="recipe-dot"></span>1 tbsp caster sugar</li>
      <li><span class="recipe-dot"></span>¼ tsp fine salt</li>
    </ul>

    <h3 class="recipe-section">Filling — Mung Bean Paste</h3>
    <ul class="recipe-list">
      <li><span class="recipe-dot"></span>200g split mung beans (yellow, skinless), soaked 2 hours</li>
      <li><span class="recipe-dot"></span>80g caster sugar</li>
      <li><span class="recipe-dot"></span>2 tbsp coconut oil or vegetable shortening</li>
      <li><span class="recipe-dot"></span>¼ tsp fine salt</li>
    </ul>

    <h3 class="recipe-section">You will also need</h3>
    <ul class="recipe-list">
      <li><span class="recipe-dot"></span>${designNote}</li>
      <li><span class="recipe-dot"></span>Small banana leaf squares (~8×8cm), briefly passed over a flame to soften</li>
      <li><span class="recipe-dot"></span>Neutral oil, for greasing the mould and dough</li>
    </ul>

    <h3 class="recipe-section">Method</h3>
    <ol class="recipe-steps">
      <li><strong>Make the filling.</strong> Drain and steam mung beans for 25 minutes until very soft. While warm, mash until smooth. Stir in sugar, salt, and shortening over low heat, stirring constantly until the paste pulls away from the sides and is firm enough to roll. Cool completely, then portion into 15g balls.</li>
      <li><strong>Make the dough.</strong> While the sweet potato is still hot, mix it with the shortening until melted. Add glutinous rice flour, sugar, salt, and colouring. Add warm water a little at a time and knead until smooth, soft, and pliable — about 4–5 minutes. The dough should not crack when bent.</li>
      <li>Portion dough into ~30g pieces. Flatten each into a disc, about 8cm wide.</li>
      <li>Place a filling ball in the centre. Pinch and seal the edges completely, then roll smooth.</li>
      <li><strong>Press.</strong> Lightly oil the mould. Place the filled ball seam-side up into the mould and press firmly to imprint the pattern. Tap gently on the table to release. Place seam-side down on a banana leaf square.</li>
      <li>Repeat for remaining pieces.</li>
      <li><strong>Steam.</strong> Bring steamer to a rolling boil. Arrange kuehs (on their banana leaf squares) in the steamer with space between them. Steam for 10–12 minutes until the dough is set and slightly translucent at the edges.</li>
      <li>Brush lightly with oil while still warm for a shiny finish. Serve warm or at room temperature.</li>
    </ol>

    <p class="recipe-tip"><strong>Tip:</strong> Ang ku kueh dry out quickly. If not eaten on the day, steam briefly for 2–3 minutes to refresh the dough before serving.</p>
  `;
}

// ─── MODAL LOGIC ─────────────────────────────────────────────────────────────

const recipeModal = document.getElementById('recipe-modal');
const orderModal  = document.getElementById('order-modal');

document.getElementById('btn-recipe').addEventListener('click', () => {
  document.getElementById('recipe-content').innerHTML = generateAkkRecipeHTML();
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

renderColors();
renderEffects();
renderDesigns();
draw();
