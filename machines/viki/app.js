// ─── DATA ─────────────────────────────────────────────────────────────────────

const FLAVOURS = [
  { id: 'pandan',        name: 'Pandan',        hex: '#2a7a4a' },
  { id: 'butterfly_pea', name: 'Butterfly Pea', hex: '#4a3d9e' },
  { id: 'strawberry',    name: 'Strawberry',    hex: '#d9405a' },
  { id: 'red',           name: 'Red',           hex: '#c82840' },
  { id: 'kaya',          name: 'Kaya',          hex: '#8a6418' },
  { id: 'ube',           name: 'Ube',           hex: '#6e50aa' },
  { id: 'coconut',       name: 'Coconut',       hex: '#f2e4c8' },
  { id: 'mango',         name: 'Mango',         hex: '#f0a028' },
  { id: 'taro',          name: 'Taro',          hex: '#9b7ec8' },
  { id: 'rose',          name: 'Rose',          hex: '#e070a0' },
  { id: 'charcoal',      name: 'Charcoal',      hex: '#2e2e2e' },
  { id: 'white',         name: 'White',         hex: '#f5f2ee' },
  { id: 'pastel_blue',   name: 'Pastel Blue',   hex: '#a8c4e0' },
];

const THEMES = [
  { id: 'classic',  name: 'Classic',  a: 'red',           b: 'pandan',       c: 'coconut'       },
  { id: 'rainbow',  name: 'Rainbow',  rainbow: true  },
  { id: 'garden',   name: 'Garden',   a: 'pandan',        b: 'coconut'       },
  { id: 'cool',     name: 'Cool',     a: 'butterfly_pea', b: 'taro'          },
  { id: 'warm',     name: 'Warm',     a: 'strawberry',    b: 'mango'         },
  { id: 'royal',    name: 'Royal',    a: 'ube',           b: 'rose'          },
  { id: 'earthy',   name: 'Earthy',   a: 'kaya',          b: 'coconut'       },
  { id: 'breeze',   name: 'Breeze',   a: 'white',         b: 'pastel_blue'   },
  { id: 'custom',   name: 'Custom',   custom: true  },
];

// ─── STATE ────────────────────────────────────────────────────────────────────

const state = {
  layers:       9,
  layerFlavors: Array.from({ length: 9 }, (_, i) => ['red', 'pandan', 'coconut'][i % 3]),
  effect:       'plain',
  rainbow:      false,
  activeTheme:  'classic',
  customColors: ['#2a7a4a', '#f2e4c8', '#e070a0'],
  customCount:  2,
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

function withAlpha(hex, a) {
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function mixColors(hexA, hexB, t) {
  const [r1,g1,b1] = hexToRgb(hexA);
  const [r2,g2,b2] = hexToRgb(hexB);
  return '#' + [
    Math.round(r1 + (r2-r1)*t),
    Math.round(g1 + (g2-g1)*t),
    Math.round(b1 + (b2-b1)*t),
  ].map(v => v.toString(16).padStart(2,'0')).join('');
}

function mixMultiColor(colors, t) {
  if (colors.length === 1) return colors[0];
  const segments = colors.length - 1;
  const scaled   = t * segments;
  const idx      = Math.min(Math.floor(scaled), segments - 1);
  return mixColors(colors[idx], colors[idx + 1], scaled - idx);
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = n => {
    const k = (n + h/30) % 12;
    return Math.round(255*(l - a*Math.max(Math.min(k-3,9-k,1),-1)))
      .toString(16).padStart(2,'0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function flavorHex(id) {
  return (FLAVOURS.find(f => f.id === id) || FLAVOURS[0]).hex;
}

function flavorName(id) {
  return (FLAVOURS.find(f => f.id === id) || FLAVOURS[0]).name;
}

function layerColor(i, N) {
  if (state.rainbow) {
    return hslToHex(Math.round((i / Math.max(N-1,1)) * 270), 68, 78);
  }
  if (state.activeTheme === 'custom') {
    const cols = state.customColors.slice(0, state.customCount);
    if (state.effect === 'gradient') {
      return mixMultiColor(cols, i / Math.max(N-1,1));
    }
    return cols[i % cols.length];
  }
  if (state.effect === 'gradient') {
    const theme = THEMES.find(t => t.id === state.activeTheme);
    const first = flavorHex(theme?.a || state.layerFlavors[0]   || 'pandan');
    const last  = flavorHex(theme?.b || state.layerFlavors[N-1] || 'coconut');
    return mixColors(first, last, i / Math.max(N-1,1));
  }
  return flavorHex(state.layerFlavors[i] || (i%2===0 ? 'pandan' : 'coconut'));
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

// ─── TEXTURE & ANIMATION ──────────────────────────────────────────────────────

const noiseCanvas = (() => {
  const nc   = document.createElement('canvas');
  nc.width   = nc.height = 512;
  const nctx = nc.getContext('2d');
  const id   = nctx.createImageData(512,512);
  const d    = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random()*255|0;
    d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
  }
  nctx.putImageData(id, 0, 0);
  const tmp  = document.createElement('canvas');
  tmp.width  = tmp.height = 512;
  const tctx = tmp.getContext('2d');
  tctx.filter = 'blur(1.5px)';
  tctx.drawImage(nc, 0, 0);
  return tmp;
})();

function applyTextureOverlay(x0, y0, bW, bH) {
  const pattern = ctx.createPattern(noiseCanvas, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.055;
  ctx.fillStyle   = pattern;
  ctx.fillRect(x0, y0, bW, bH);
  ctx.restore();
}

function drawSubsurface(x0, ly, bW, lH, color) {
  const [r,g,b] = hexToRgb(color);
  const cx  = x0 + bW*0.5;
  const cy  = ly + lH*0.48;
  const br  = v => Math.min(255,(v+60)|0);
  const sub = ctx.createRadialGradient(cx,cy,0,cx,cy,bW*0.55);
  sub.addColorStop(0,   `rgba(${br(r)},${br(g)},${br(b)},0.28)`);
  sub.addColorStop(0.5, `rgba(${r},${g},${b},0.1)`);
  sub.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = sub;
  ctx.fillRect(x0, ly, bW, lH);
}

function drawPointSpecular(x0, ly, bW, lH) {
  const spotX = x0 + bW*0.27;
  const spotY = ly + lH*0.3;
  const rX    = bW*0.22;
  const rY    = lH*0.55;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0,ly,bW,lH); ctx.clip();
  ctx.beginPath(); ctx.ellipse(spotX,spotY,rX,rY,0,0,Math.PI*2);
  const sp = ctx.createRadialGradient(spotX,spotY,0,spotX,spotY,rX);
  sp.addColorStop(0,    'rgba(255,255,255,0.58)');
  sp.addColorStop(0.35, 'rgba(255,255,255,0.16)');
  sp.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = sp; ctx.fill();
  ctx.restore();
}


// ─── SILHOUETTE PATH ─────────────────────────────────────────────────────────

// Traces the rounded outer outline of the kueh block (all 3 faces) clockwise.
// Uses arcTo to round each of the 6 corners.
function silhouettePath(x0, y0, bW, bH, dX, dY, cr) {
  ctx.beginPath();
  ctx.moveTo(x0, y0 + cr);                                                        // start on left edge
  ctx.lineTo(x0, y0 + bH - cr);
  ctx.arcTo(x0,       y0+bH,       x0+bW,      y0+bH,      cr); // BL
  ctx.arcTo(x0+bW,    y0+bH,       x0+bW+dX,   y0+bH+dY,   cr); // BR-front
  ctx.arcTo(x0+bW+dX, y0+bH+dY,   x0+bW+dX,   y0,          cr); // BR-right
  ctx.arcTo(x0+bW+dX, y0+dY,      x0+dX,       y0+dY,       cr); // TR
  ctx.arcTo(x0+dX,    y0+dY,      x0,           y0,          cr); // TL-back
  ctx.arcTo(x0,       y0,         x0,           y0+bH,       cr); // TL-front
  ctx.closePath();
}

// ─── BACKGROUND ──────────────────────────────────────────────────────────────

function drawBackground(W, H) {
  const bg = ctx.createRadialGradient(W*0.5,H*0.42,0,W*0.5,H*0.42,W*0.72);
  bg.addColorStop(0,   '#f5f0e8');
  bg.addColorStop(0.5, '#ede7dc');
  bg.addColorStop(1,   '#e2dbd0');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);
  const glow = ctx.createRadialGradient(W*0.5,H*0.38,0,W*0.5,H*0.38,W*0.45);
  glow.addColorStop(0, 'rgba(255,248,235,0.55)');
  glow.addColorStop(1, 'rgba(255,248,235,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,W,H);
}

// ─── KUEH RENDERER ────────────────────────────────────────────────────────────

function drawKueh(W, H) {
  const N  = state.layers;
  const bW = Math.min(W*0.5, 380);
  const layerH = Math.max(9, Math.min(22, 170/N));
  const bH = N * layerH;
  const dX = bW*0.26;
  const dY = -(bW*0.076);
  const x0 = (W - bW) / 2;
  const y0 = H*0.62 - bH;
  const cr = Math.min(bW*0.05, 12);

  const topColor    = layerColor(0, N);
  const bottomColor = layerColor(N-1, N);

  // ── Shadow ────────────────────────────────────────────────────────────────
  const shX  = x0 + (bW+dX)*0.5;
  const shY  = y0 + bH + 16;
  const shW  = (bW+dX)*0.56;
  const shH  = shW*0.12;
  const shad = ctx.createRadialGradient(shX,shY,0,shX,shY+shH*0.5,shW);
  shad.addColorStop(0,   'rgba(80,55,20,0.32)');
  shad.addColorStop(0.5, 'rgba(80,55,20,0.12)');
  shad.addColorStop(1,   'rgba(80,55,20,0)');
  ctx.fillStyle = shad;
  ctx.beginPath();
  ctx.ellipse(shX,shY,shW,shH,0,0,Math.PI*2);
  ctx.fill();

  // ── Clip the entire block to the silhouette with rounded corners ──────────
  ctx.save();
  silhouettePath(x0, y0, bW, bH, dX, dY, cr);
  ctx.clip();

  // ── Right side face ───────────────────────────────────────────────────────
  for (let i = 0; i < N; i++) {
    const color = layerColor(i, N);
    const y1 = y0 + i*layerH;
    const y2 = y0 + (i+1)*layerH;
    ctx.beginPath();
    ctx.moveTo(x0+bW,    y1);
    ctx.lineTo(x0+bW+dX, y1+dY);
    ctx.lineTo(x0+bW+dX, y2+dY);
    ctx.lineTo(x0+bW,    y2);
    ctx.closePath();
    const sg = ctx.createLinearGradient(x0+bW,y1,x0+bW+dX,y1+dY);
    sg.addColorStop(0, darken(color,0.28));
    sg.addColorStop(1, darken(color,0.42));
    ctx.fillStyle = sg;
    ctx.fill();
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(x0+bW,    y1);
      ctx.lineTo(x0+bW+dX, y1+dY);
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth   = 0.7;
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.moveTo(x0+bW,    y0);
  ctx.lineTo(x0+bW+dX, y0+dY);
  ctx.lineTo(x0+bW+dX, y0+dY+bH);
  ctx.lineTo(x0+bW,    y0+bH);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Front face (rectangular inner clip for per-layer effects) ─────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, bW, bH);
  ctx.clip();

  for (let i = 0; i < N; i++) {
    const color = layerColor(i, N);
    const ly    = y0 + i*layerH;

    const fg = ctx.createLinearGradient(x0,0,x0+bW,0);
    fg.addColorStop(0,    darken(color,0.24));
    fg.addColorStop(0.14, color);
    fg.addColorStop(0.52, lighten(color,0.13));
    fg.addColorStop(0.86, color);
    fg.addColorStop(1,    darken(color,0.2));
    ctx.fillStyle = fg;
    ctx.fillRect(x0, ly, bW, layerH+0.5);

    drawSubsurface(x0, ly, bW, layerH, color);

    ctx.fillStyle = `rgba(0,0,0,${(i/N)*0.05})`;
    ctx.fillRect(x0, ly, bW, layerH);

    drawPointSpecular(x0, ly, bW, layerH);

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x0, ly+layerH - Math.max(1,layerH*0.09), bW, Math.max(1,layerH*0.09));
  }

  const edgeFade = ctx.createLinearGradient(x0,0,x0+bW,0);
  edgeFade.addColorStop(0,    'rgba(0,0,0,0.2)');
  edgeFade.addColorStop(0.06, 'rgba(0,0,0,0)');
  edgeFade.addColorStop(0.94, 'rgba(0,0,0,0)');
  edgeFade.addColorStop(1,    'rgba(0,0,0,0.1)');
  ctx.fillStyle = edgeFade;
  ctx.fillRect(x0, y0, bW, bH);

  ctx.restore(); // end front face rect clip

  // ── Texture overlay (front face area, inside silhouette clip) ─────────────
  ctx.save();
  ctx.beginPath(); ctx.rect(x0,y0,bW,bH); ctx.clip();
  applyTextureOverlay(x0, y0, bW, bH);
  ctx.restore();

  // ── Top face ──────────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(x0,           y0);
  ctx.lineTo(x0+bW,        y0);
  ctx.lineTo(x0+bW+dX,     y0+dY);
  ctx.lineTo(x0+dX,        y0+dY);
  ctx.closePath();
  const tg = ctx.createLinearGradient(x0,y0+dY,x0+bW,y0);
  tg.addColorStop(0,   lighten(topColor,0.22));
  tg.addColorStop(0.4, lighten(topColor,0.38));
  tg.addColorStop(1,   lighten(topColor,0.16));
  ctx.fillStyle = tg; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x0,       y0);
  ctx.lineTo(x0+bW,    y0);
  ctx.lineTo(x0+bW+dX, y0+dY);
  ctx.lineTo(x0+dX,    y0+dY);
  ctx.closePath();
  const gloss = ctx.createLinearGradient(x0+dX,y0+dY,x0+bW*0.65,y0);
  gloss.addColorStop(0,    'rgba(255,255,255,0)');
  gloss.addColorStop(0.22, 'rgba(255,255,255,0.42)');
  gloss.addColorStop(0.52, 'rgba(255,255,255,0.14)');
  gloss.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = gloss; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x0,    y0); ctx.lineTo(x0+bW,y0);
  ctx.lineTo(x0+bW, y0+2); ctx.lineTo(x0,y0+2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x0,       y0); ctx.lineTo(x0+bW,    y0);
  ctx.lineTo(x0+bW+dX, y0+dY); ctx.lineTo(x0+dX, y0+dY);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.stroke();

  ctx.restore(); // end silhouette clip

  // ── Silhouette outline (drawn over everything) ────────────────────────────
  ctx.save();
  silhouettePath(x0, y0, bW, bH, dX, dY, cr);
  ctx.strokeStyle = 'rgba(0,0,0,0.24)';
  ctx.lineWidth   = 1;
  ctx.stroke();
  ctx.restore();

  // ── Colour spill ──────────────────────────────────────────────────────────
  const spill = ctx.createLinearGradient(x0, y0+bH, x0, y0+bH+36);
  spill.addColorStop(0, withAlpha(bottomColor, 0.12));
  spill.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spill;
  ctx.fillRect(x0-10, y0+bH, bW+20, 38);
}

// ─── DRAW ────────────────────────────────────────────────────────────────────

function draw() {
  const W = canvas.width;
  const H = canvas.height;
  if (!W || !H) return;
  ctx.clearRect(0,0,W,H);
  drawBackground(W,H);
  drawKueh(W,H);
}

// ─── THEME ────────────────────────────────────────────────────────────────────

function themeColors(t) {
  return t.c ? [t.a, t.b, t.c] : [t.a, t.b];
}

function applyTheme(t) {
  state.activeTheme = t.id;
  if (t.rainbow) {
    state.rainbow = true;
  } else if (t.custom) {
    state.rainbow = false;
  } else {
    state.rainbow = false;
    const cycle = themeColors(t);
    state.layerFlavors = Array.from({ length: state.layers }, (_, i) => cycle[i % cycle.length]);
  }
}

// ─── UI RENDERING ─────────────────────────────────────────────────────────────

function renderThemes() {
  const el = document.getElementById('theme-grid');
  el.innerHTML = THEMES.map(t => {
    const isActive = state.activeTheme === t.id;
    let swatchHtml;
    if (t.rainbow) {
      swatchHtml = `<span class="theme-sw--rainbow"></span>`;
    } else if (t.custom) {
      swatchHtml = `<span class="theme-sw theme-sw--white"></span>`;
    } else {
      const slices = themeColors(t).map(id => `<span class="ts" style="background:${flavorHex(id)}"></span>`).join('');
      swatchHtml = `<span class="theme-sw">${slices}</span>`;
    }
    return `<button class="theme-chip${isActive?' active':''}" data-theme="${t.id}">
      ${swatchHtml}
      <span class="theme-name">${t.name}</span>
    </button>`;
  }).join('');

  el.querySelectorAll('.theme-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(THEMES.find(t => t.id === btn.dataset.theme));
      render();
    });
  });
}

function renderLayerSection() {
  const section = document.getElementById('layer-colors-section');
  if (state.activeTheme !== 'custom') { section.innerHTML = ''; return; }

  const countBtns = [1,2,3].map(n => `
    <button class="chip${n===state.customCount?' active':''}" data-count="${n}">${n} colour${n>1?'s':''}</button>
  `).join('');

  const colorSwatches = Array.from({ length: state.customCount }, (_, i) => `
    <label class="custom-color-swatch">
      <input type="color" value="${state.customColors[i]}" data-cidx="${i}">
      <span class="custom-color-block" style="background:${state.customColors[i]}"></span>
      <span class="custom-color-num">${i+1}</span>
    </label>`).join('');

  section.innerHTML = `
    <div class="ctrl-label">Colours</div>
    <div class="chip-row custom-count-row">${countBtns}</div>
    <div class="custom-color-row">${colorSwatches}</div>`;

  section.querySelectorAll('[data-count]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.customCount = parseInt(btn.dataset.count);
      render();
    });
  });

  section.querySelectorAll('input[type="color"]').forEach(inp => {
    const idx = parseInt(inp.dataset.cidx);
    inp.addEventListener('input', () => {
      state.customColors[idx] = inp.value;
      const block = inp.parentElement.querySelector('.custom-color-block');
      if (block) block.style.background = inp.value;
      draw();
    });
  });
}

function render() {
  draw();
  renderThemes();
  renderLayerSection();
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

document.getElementById('layer-slider').addEventListener('input', e => {
  const newN   = parseInt(e.target.value);
  state.layers = newN;
  document.getElementById('layer-display').textContent = newN;

  if (!state.rainbow && state.activeTheme !== 'custom') {
    const theme = THEMES.find(t => t.id === state.activeTheme);
    if (theme && theme.a) {
      const cycle = themeColors(theme);
      state.layerFlavors = Array.from({ length: newN }, (_, i) => cycle[i % cycle.length]);
    }
  } else {
    state.layerFlavors = Array.from({ length: newN }, (_, i) => i%2===0 ? 'pandan' : 'coconut');
  }

  render();
});

document.querySelectorAll('#effect-chips .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    state.effect = btn.dataset.val;
    document.querySelectorAll('#effect-chips .chip')
      .forEach(b => b.classList.toggle('active', b===btn));
    render();
  });
});

// ─── RECIPE GENERATOR ────────────────────────────────────────────────────────

function generateRecipeHTML() {
  const N = state.layers;
  let colourGroups = [];

  if (state.rainbow) {
    const hues  = [0, 38, 60, 120, 200, 240, 270];
    const names = ['Red','Orange','Yellow','Green','Cyan','Blue','Violet'];
    hues.forEach((h, i) => {
      const count = Math.round(N / hues.length) + (i < N % hues.length ? 1 : 0);
      if (count > 0) colourGroups.push({ name: names[i], hex: hslToHex(h, 68, 78), count });
    });
  } else if (state.activeTheme === 'custom') {
    state.customColors.slice(0, state.customCount).forEach((hex, idx) => {
      let count = 0;
      for (let i = 0; i < N; i++) if (i % state.customCount === idx) count++;
      colourGroups.push({ name: `Colour ${idx + 1}`, hex, count });
    });
  } else {
    const theme = THEMES.find(t => t.id === state.activeTheme);
    themeColors(theme).forEach(id => {
      const count = state.layerFlavors.filter(f => f === id).length;
      colourGroups.push({ name: flavorName(id), hex: flavorHex(id), count });
    });
  }

  const rf  = Math.round(250 * N / 9 / 25) * 25;
  const tf  = Math.round(125 * N / 9 / 25) * 25;
  const cm  = Math.round(500 * N / 9 / 50) * 50;
  const sg  = Math.round(200 * N / 9 / 25) * 25;
  const mlPerLayer = Math.round(cm / N);
  const mlPerGroup = Math.round(cm / colourGroups.length);

  const colourDesc = {
    'Pandan':        'pandan extract or blended pandan juice',
    'Coconut':       'plain (uncoloured)',
    'Red':           'red food colouring',
    'Strawberry':    'red food colouring',
    'Butterfly Pea': 'butterfly pea flower tea (steep 6 flowers in 2 tbsp hot water)',
    'Ube':           'ube extract',
    'Taro':          'purple food colouring',
    'Rose':          'pink food colouring + a drop of rose water',
    'Mango':         'yellow food colouring',
    'Kaya':          'brown-green food colouring',
    'Charcoal':      'activated charcoal powder (¼ tsp)',
    'White':         'plain (uncoloured)',
    'Pastel Blue':   'blue food colouring (1–2 drops only)',
  };

  const colourLines = colourGroups.map(g => {
    const desc = colourDesc[g.name] || 'food colouring to match';
    return `<li><span class="recipe-dot" style="background:${g.hex}"></span><strong>${g.name}</strong> — ${desc} (${g.count} layer${g.count !== 1 ? 's' : ''})</li>`;
  }).join('');

  const themeName  = state.rainbow ? 'Rainbow' : state.activeTheme === 'custom' ? 'Custom' : (THEMES.find(t => t.id === state.activeTheme)?.name || '');
  const colourFlow = colourGroups.map(g => `<strong>${g.name}</strong>`).join(' → ');

  return `
    <div class="modal-eyebrow">Recipe</div>
    <h2 class="modal-title">${themeName} Kueh Lapis</h2>
    <p class="modal-sub">${N} layers &middot; Makes one 7-inch square tray</p>

    <h3 class="recipe-section">Ingredients</h3>
    <ul class="recipe-list">
      <li>${rf}g rice flour</li>
      <li>${tf}g tapioca starch</li>
      <li>${cm}ml full-fat coconut milk</li>
      <li>${sg}g caster sugar</li>
      <li>½ tsp fine salt</li>
      <li>Neutral oil, for greasing</li>
    </ul>

    <h3 class="recipe-section">Colourings</h3>
    <ul class="recipe-list">${colourLines}</ul>

    <h3 class="recipe-section">Method</h3>
    <ol class="recipe-steps">
      <li>Grease a 7-inch square pan and line the base with baking paper.</li>
      <li>Whisk rice flour, tapioca starch, coconut milk, sugar, and salt in a large bowl until smooth. Strain through a fine sieve.</li>
      <li>Divide batter into ${colourGroups.length} equal portions (~${mlPerGroup}ml each). Stir in colourings: ${colourFlow}.</li>
      <li>Bring steamer to a rolling boil. Place the empty pan inside to preheat for 2 minutes.</li>
      <li>Pour the first colour into the hot pan — about ${mlPerLayer}ml per layer, just enough to cover the base thinly. Steam for 3–4 minutes until just set (surface no longer looks wet).</li>
      <li>Pour the next colour directly on top. Steam 3–4 minutes. Continue cycling ${colourFlow}, until all ${N} layers are done.</li>
      <li>On the final layer, steam for 10–12 minutes until fully cooked through.</li>
      <li>Remove from steamer. Cool completely at room temperature for at least 2 hours before unmoulding — do not refrigerate while warm.</li>
      <li>Cut into fingers using a sharp, lightly oiled knife. Wipe the blade between each cut for clean edges.</li>
    </ol>

    <p class="recipe-tip"><strong>Tip:</strong> Prop the steamer lid ajar with a chopstick to prevent condensation dripping onto the layers.</p>
  `;
}

// ─── MODAL LOGIC ─────────────────────────────────────────────────────────────

const recipeModal = document.getElementById('recipe-modal');
const orderModal  = document.getElementById('order-modal');

document.getElementById('btn-recipe').addEventListener('click', () => {
  document.getElementById('recipe-content').innerHTML = generateRecipeHTML();
  recipeModal.hidden = false;
});

document.getElementById('btn-order').addEventListener('click', () => {
  orderModal.hidden = false;
});

document.getElementById('recipe-close').addEventListener('click', () => { recipeModal.hidden = true; });
document.getElementById('order-close').addEventListener('click',  () => { orderModal.hidden  = true; });

recipeModal.addEventListener('click', e => { if (e.target === recipeModal) recipeModal.hidden = true; });
orderModal.addEventListener('click',  e => { if (e.target === orderModal)  orderModal.hidden  = true; });

// ─── INIT ────────────────────────────────────────────────────────────────────

render();
