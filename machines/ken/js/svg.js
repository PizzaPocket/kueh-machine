/* ------------------------------------------------------------------
   PROCEDURAL KUEH ILLUSTRATIONS

   Nine kuehs, each structurally true to the real thing. Ultra-rare
   kuehs get a visibly more elaborate treatment — an outer glow and
   a few sparkle marks — so specialness reads instantly, not just in
   a badge. viewBox is 0 0 240 240 for all nine.
------------------------------------------------------------------- */

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function shade(color, amt) {
  let r, g, b;
  if (color.startsWith("rgb")) {
    // shade() is often called on a color that's already the output of shade() —
    // accept "rgb(r,g,b)" as input too, not just "#hex", or this silently collapses to black.
    [r, g, b] = color.match(/\d+(\.\d+)?/g).map(Number);
  } else {
    const n = parseInt(color.slice(1), 16);
    r = (n >> 16) & 0xff;
    g = (n >> 8) & 0xff;
    b = n & 0xff;
  }
  r = Math.min(255, Math.max(0, r + amt));
  g = Math.min(255, Math.max(0, g + amt));
  b = Math.min(255, Math.max(0, b + amt));
  return `rgb(${r},${g},${b})`;
}

function sparkleMark(cx, cy, size, color) {
  const s = size;
  return `<path d="M ${cx} ${cy - s} L ${cx + s * 0.28} ${cy - s * 0.28} L ${cx + s} ${cy} L ${cx + s * 0.28} ${cy + s * 0.28} L ${cx} ${cy + s} L ${cx - s * 0.28} ${cy + s * 0.28} L ${cx - s} ${cy} L ${cx - s * 0.28} ${cy - s * 0.28} Z" fill="${color}" opacity="${rand(0.55, 0.9).toFixed(2)}"/>`;
}

const SPARKLE_SPOTS = [
  { x: 42, y: 54 }, { x: 200, y: 44 }, { x: 208, y: 172 }, { x: 34, y: 176 }
];

function ultraRareWrap(inner, glowColor) {
  const sparkles = SPARKLE_SPOTS.map((p) => sparkleMark(p.x, p.y, rand(6, 10), glowColor)).join("");
  return `
    <svg viewBox="0 0 240 240" class="kueh-illustration is-ultra-rare">
      <defs>
        <filter id="ultra-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="blur"/>
          <feFlood flood-color="${glowColor}" flood-opacity="0.55"/>
          <feComposite in2="blur" operator="in" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#ultra-glow)">${inner}</g>
      ${sparkles}
    </svg>`;
}

const SVG_GENERATORS = {

  /* ---------------- KUEH LAPIS — alternating stacked layers (RARE) ---------------- */
  lapis() {
    // rainbow cycle: a thick red band, then thin yellow and green accent bands, repeating
    const cycleColors = ["#E23A2E", "#F3C23A", "#3F9E52"];
    const cycleWeights = [1.6, 0.7, 0.7];
    const boxX = 56, boxW = 128, boxY = 46, boxH = 148;
    const layerCount = 9;
    const totalWeight = (cycleWeights[0] + cycleWeights[1] + cycleWeights[2]) * (layerCount / 3);
    const unit = boxH / totalWeight;
    let y = boxY;
    let layers = "";
    for (let i = 0; i < layerCount; i++) {
      const weight = cycleWeights[i % 3];
      const h = weight * unit + rand(-1.5, 1.5);
      const inset = rand(0, 3);
      const color = shade(cycleColors[i % 3], rand(-8, 8));
      layers += `<rect x="${boxX + inset}" y="${y.toFixed(1)}" width="${(boxW - inset * 2).toFixed(1)}" height="${Math.max(5, h).toFixed(1)}" fill="${color}"/>`;
      y += h + 0.6;
    }
    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-lapis" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <clipPath id="lapis-clip"><rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6"/></clipPath>
        </defs>
        <g filter="url(#soft-shadow-lapis)">
          <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6" fill="${cycleColors[2]}"/>
          <g clip-path="url(#lapis-clip)">${layers}</g>
          <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6" fill="none" stroke="#00000022" stroke-width="1"/>
        </g>
      </svg>`;
  },

  /* ---------------- ONDEH-ONDEH — cluster of green spheres (COMMON) ---------------- */
  ondeh() {
    const base = "#4FA65B";
    const positions = [
      { cx: 92, cy: 138, r: rand(30, 36) },
      { cx: 148, cy: 132, r: rand(28, 34) },
      { cx: 120, cy: 96, r: rand(26, 32) }
    ];
    let spheres = "";
    positions.forEach((p, i) => {
      const tone = shade(base, rand(-14, 14));
      const gradId = `ondeh-grad-${i}`;
      const dots = Array.from({ length: 4 }, () => {
        const a = rand(0, Math.PI * 2);
        const d = rand(p.r * 0.2, p.r * 0.65);
        return `<circle cx="${(p.cx + Math.cos(a) * d).toFixed(1)}" cy="${(p.cy + Math.sin(a) * d).toFixed(1)}" r="${rand(1.4, 2.4).toFixed(1)}" fill="#F5EEE2" opacity="0.85"/>`;
      }).join("");
      spheres += `
        <defs><radialGradient id="${gradId}" cx="35%" cy="30%">
          <stop offset="0%" stop-color="${shade(tone, 30)}"/>
          <stop offset="100%" stop-color="${tone}"/>
        </radialGradient></defs>
        <circle cx="${p.cx}" cy="${p.cy}" r="${p.r.toFixed(1)}" fill="url(#${gradId})"/>
        ${dots}`;
    });
    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-ondeh" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
        </defs>
        <g filter="url(#soft-shadow-ondeh)">${spheres}</g>
      </svg>`;
  },

  /* ---------------- ANG KU KUEH — red oval, tortoise-shell ridges (RARE) ---------------- */
  angku() {
    const red = shade("#E2503D", rand(-8, 8));
    const cx = 120, cy = 118;
    const rx = rand(52, 58), ry = rand(66, 72);
    let ridges = "";
    for (let i = 1; i <= 3; i++) {
      const s = i / 4;
      ridges += `<ellipse cx="${cx}" cy="${cy}" rx="${(rx * s).toFixed(1)}" ry="${(ry * s).toFixed(1)}" fill="none" stroke="${shade(red, -40)}" stroke-width="1.4" opacity="0.55"/>`;
    }
    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-angku" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <radialGradient id="angku-grad" cx="35%" cy="28%">
            <stop offset="0%" stop-color="${shade(red, 30)}"/>
            <stop offset="100%" stop-color="${red}"/>
          </radialGradient>
        </defs>
        <g filter="url(#soft-shadow-angku)">
          <rect x="86" y="192" width="68" height="14" rx="3" fill="#4FA65B"/>
          <ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="url(#angku-grad)"/>
          ${ridges}
        </g>
      </svg>`;
  },

  /* ---------------- KUEH SALAT — two-tone rectangle (RARE) ---------------- */
  salat() {
    const green = "#4FA65B", cream = "#F5DFB0";
    const boxX = 58, boxW = 124, boxY = 52, boxH = 136;
    const baseH = boxH * rand(0.34, 0.4);
    const topH = boxH - baseH;
    let hatch = "";
    for (let i = 0; i < 5; i++) {
      const hy = boxY + boxH - baseH + 8 + i * ((baseH - 16) / 5);
      hatch += `<line x1="${boxX + 8}" y1="${hy.toFixed(1)}" x2="${boxX + boxW - 8}" y2="${hy.toFixed(1)}" stroke="#00000018" stroke-width="1"/>`;
    }
    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-salat" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <linearGradient id="salat-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${shade(green, 18)}"/>
            <stop offset="100%" stop-color="${green}"/>
          </linearGradient>
          <clipPath id="salat-clip"><rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6"/></clipPath>
        </defs>
        <g filter="url(#soft-shadow-salat)">
          <g clip-path="url(#salat-clip)">
            <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${topH.toFixed(1)}" fill="url(#salat-grad)"/>
            <rect x="${boxX}" y="${(boxY + topH).toFixed(1)}" width="${boxW}" height="${baseH.toFixed(1)}" fill="${cream}"/>
            ${hatch}
          </g>
          <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6" fill="none" stroke="#00000022" stroke-width="1"/>
        </g>
      </svg>`;
  },

  /* ---------------- KUEH BAHULU — ridged golden dome (COMMON) ---------------- */
  bahulu() {
    const gold = shade("#F2A63B", rand(-10, 10));
    const cx = 120, cy = 128;
    const rx = 62, ry = rand(46, 52);
    let ridges = "";
    for (let i = -3; i <= 3; i++) {
      const x = cx + i * (rx / 4.2);
      ridges += `<path d="M ${x.toFixed(1)} ${(cy - ry + 6).toFixed(1)} Q ${(x + i * 2).toFixed(1)} ${cy} ${x.toFixed(1)} ${(cy + ry - 6).toFixed(1)}" fill="none" stroke="${shade(gold, -45)}" stroke-width="1.6" opacity="0.5"/>`;
    }
    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-bahulu" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <radialGradient id="bahulu-grad" cx="35%" cy="25%">
            <stop offset="0%" stop-color="${shade(gold, 34)}"/>
            <stop offset="100%" stop-color="${gold}"/>
          </radialGradient>
          <clipPath id="bahulu-clip"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry.toFixed(1)}"/></clipPath>
        </defs>
        <g filter="url(#soft-shadow-bahulu)">
          <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry.toFixed(1)}" fill="url(#bahulu-grad)"/>
          <g clip-path="url(#bahulu-clip)">${ridges}</g>
        </g>
      </svg>`;
  },

  /* ---------------- KUEH DADAR — pandan crepe roll, shredded-coconut cut end (COMMON) ---------------- */
  dadar() {
    const green = shade("#4FA65B", rand(-8, 8));
    const fillingBase = "#EF8425";
    const logX = 62, logY = 90, logW = 138, logH = rand(50, 58);
    const endCx = logX + 15, endCy = logY + logH / 2, endR = logH / 2 - 2;
    const wall = rand(6.5, 8);
    const innerR = endR - wall;

    // fibrous shredded-coconut filling — short irregular strands, not a spiral
    const shredTones = [shade(fillingBase, 30), fillingBase, shade(fillingBase, -30)];
    const shreds = Array.from({ length: 46 }, () => {
      const a = rand(0, Math.PI * 2);
      const d = rand(0, innerR * 0.82);
      const x = endCx + Math.cos(a) * d;
      const y = endCy + Math.sin(a) * d;
      const sa = rand(0, Math.PI * 2);
      const len = rand(2, 5);
      const x2 = x + Math.cos(sa) * len;
      const y2 = y + Math.sin(sa) * len;
      const tone = shredTones[Math.floor(rand(0, shredTones.length))];
      return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${tone}" stroke-width="${rand(1.4, 2.4).toFixed(1)}" stroke-linecap="round" opacity="${rand(0.7, 1).toFixed(2)}"/>`;
    }).join("");

    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-dadar" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <linearGradient id="dadar-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${shade(green, -8)}"/>
            <stop offset="100%" stop-color="${shade(green, 16)}"/>
          </linearGradient>
          <clipPath id="dadar-log-clip"><rect x="${logX}" y="${logY}" width="${logW}" height="${logH.toFixed(1)}" rx="${(logH / 2).toFixed(1)}"/></clipPath>
          <clipPath id="dadar-fill-clip"><circle cx="${endCx}" cy="${endCy}" r="${innerR.toFixed(1)}"/></clipPath>
        </defs>
        <g filter="url(#soft-shadow-dadar)">
          <rect x="${logX}" y="${logY}" width="${logW}" height="${logH.toFixed(1)}" rx="${(logH / 2).toFixed(1)}" fill="url(#dadar-grad)"/>
          <g clip-path="url(#dadar-log-clip)">
            <ellipse cx="${(logX + logW * 0.35).toFixed(1)}" cy="${(logY + 6).toFixed(1)}" rx="${(logW * 0.4).toFixed(1)}" ry="6" fill="#FFFFFF" opacity="0.15"/>
          </g>
          <circle cx="${endCx}" cy="${endCy}" r="${endR.toFixed(1)}" fill="${shade(green, -6)}"/>
          <circle cx="${endCx}" cy="${endCy}" r="${innerR.toFixed(1)}" fill="${shade(fillingBase, -16)}"/>
          <g clip-path="url(#dadar-fill-clip)">${shreds}</g>
          <circle cx="${endCx}" cy="${endCy}" r="${endR.toFixed(1)}" fill="none" stroke="#00000028" stroke-width="1.4"/>
        </g>
      </svg>`;
  },

  /* ---------------- KUEH TALAM — diamond-cut two-tone (ULTRA RARE) ---------------- */
  talam() {
    const yellow = "#F2A63B", white = "#F5EEE2";
    const cx = 120, cy = 122, half = rand(68, 74);
    const splitFrac = rand(0.42, 0.5); // fraction of the diamond height that's the yellow base (bottom)
    const top = { x: cx, y: cy - half };
    const right = { x: cx + half, y: cy };
    const bottom = { x: cx, y: cy + half };
    const left = { x: cx - half, y: cy };
    const splitY = bottom.y - (bottom.y - top.y) * splitFrac;
    // interpolate left/right x where the split line crosses the diamond's upper edges
    const lerp = (a, b, t) => a + (b - a) * t;
    const diamond = `M ${top.x} ${top.y} L ${right.x} ${right.y} L ${bottom.x} ${bottom.y} L ${left.x} ${left.y} Z`;
    const splitLeft = { x: lerp(left.x, top.x, (left.y - splitY) / (left.y - top.y)), y: splitY };
    const splitRight = { x: lerp(right.x, top.x, (right.y - splitY) / (right.y - top.y)), y: splitY };
    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-talam" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <clipPath id="talam-clip"><path d="${diamond}"/></clipPath>
        </defs>
        <g filter="url(#soft-shadow-talam)">
          <g clip-path="url(#talam-clip)">
            <rect x="40" y="40" width="160" height="160" fill="${yellow}"/>
            <path d="M ${splitLeft.x.toFixed(1)} ${splitLeft.y.toFixed(1)} L ${splitRight.x.toFixed(1)} ${splitRight.y.toFixed(1)} L ${right.x} ${right.y} L ${top.x} ${top.y} Z" fill="${white}"/>
          </g>
          <path d="${diamond}" fill="none" stroke="#00000025" stroke-width="1.4"/>
        </g>
      </svg>`;
  },

  /* ---------------- KUEH KO SWEE — glossy jelly diamond, centre dimple (ULTRA RARE) ---------------- */
  koswee() {
    const amber = "#B5652F";
    const cx = 120, cy = 122, half = rand(64, 70);
    const top = { x: cx, y: cy - half };
    const right = { x: cx + half, y: cy };
    const bottom = { x: cx, y: cy + half };
    const left = { x: cx - half, y: cy };
    const diamond = `M ${top.x} ${top.y} L ${right.x} ${right.y} L ${bottom.x} ${bottom.y} L ${left.x} ${left.y} Z`;
    const coconut = Array.from({ length: 10 }, () => {
      const x = rand(cx - half * 0.7, cx + half * 0.7);
      const y = bottom.y - rand(2, 12);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rand(1.6, 2.6).toFixed(1)}" fill="#F5EEE2" opacity="0.9"/>`;
    }).join("");
    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-koswee" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <radialGradient id="koswee-grad" cx="38%" cy="30%">
            <stop offset="0%" stop-color="${shade(amber, 55)}"/>
            <stop offset="55%" stop-color="${amber}"/>
            <stop offset="100%" stop-color="${shade(amber, -25)}"/>
          </radialGradient>
          <clipPath id="koswee-clip"><path d="${diamond}"/></clipPath>
        </defs>
        <g filter="url(#soft-shadow-koswee)">
          <path d="${diamond}" fill="url(#koswee-grad)"/>
          <ellipse cx="${cx}" cy="${cy}" rx="10" ry="7" fill="#00000020"/>
          <path d="M ${cx - 30} ${cy - 40} L ${cx - 6} ${cy - 16}" stroke="#F5EEE2" stroke-width="6" stroke-linecap="round" opacity="0.35"/>
          <g clip-path="url(#koswee-clip)">${coconut}</g>
          <path d="${diamond}" fill="none" stroke="#00000030" stroke-width="1.4"/>
        </g>
      </svg>`;
  },

  /* ---------------- PULUT HITAM — dark rice mound in coconut milk (ULTRA RARE) ---------------- */
  pulutHitam() {
    const dark = "#2A1B33";
    const cx = 120, cy = 138;
    const poolRx = rand(78, 86), poolRy = rand(30, 34);
    const moundRx = rand(52, 58), moundRy = rand(34, 38);
    const grains = Array.from({ length: 22 }, () => {
      const a = rand(0, Math.PI * 2);
      const d = rand(4, moundRx * 0.75);
      const x = cx + Math.cos(a) * d;
      const y = cy - moundRy * 0.35 + Math.sin(a) * d * (moundRy / moundRx);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rand(1.2, 2.2).toFixed(1)}" fill="${shade(dark, rand(20, 50))}" opacity="0.7"/>`;
    }).join("");
    return `
      <svg viewBox="0 0 240 240" class="kueh-illustration">
        <defs>
          <filter id="soft-shadow-pulut" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <radialGradient id="pulut-mound-grad" cx="35%" cy="25%">
            <stop offset="0%" stop-color="${shade(dark, 26)}"/>
            <stop offset="100%" stop-color="${dark}"/>
          </radialGradient>
        </defs>
        <g filter="url(#soft-shadow-pulut)">
          <ellipse cx="${cx}" cy="${(cy + moundRy * 0.7).toFixed(1)}" rx="${poolRx.toFixed(1)}" ry="${poolRy.toFixed(1)}" fill="#F5EEE2" opacity="0.92"/>
          <ellipse cx="${cx}" cy="${cy.toFixed(1)}" rx="${moundRx.toFixed(1)}" ry="${moundRy.toFixed(1)}" fill="url(#pulut-mound-grad)"/>
          <g>${grains}</g>
          <ellipse cx="${(cx - moundRx * 0.3).toFixed(1)}" cy="${(cy - moundRy * 0.5).toFixed(1)}" rx="${(moundRx * 0.3).toFixed(1)}" ry="${(moundRy * 0.18).toFixed(1)}" fill="#FFFFFF" opacity="0.12"/>
        </g>
      </svg>`;
  }

};

function renderKuehSVG(svgType, rarity) {
  const raw = SVG_GENERATORS[svgType]();
  if (rarity !== "ultraRare") return raw;
  const inner = raw.replace(/^\s*<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return ultraRareWrap(inner, RARITIES.ultraRare.glow);
}

/* ------------------------------------------------------------------
   THE MACHINE — a dimensional gacha cabinet. Static backdrop; the
   marquee bulbs and dispensing window are targeted by CSS classes
   for the shake/flash/drop sequence.
------------------------------------------------------------------- */
function renderMachineSVG() {
  // capsule stock, two-tone spheres in a boxy glass case — reds/pinks/blacks/whites like the reference
  const capsuleColors = ["#E23A2E", "#EEE3CC", "#1C1712", "#F0879E", "#F5C24B", "#5FAE71"];
  const positions = [
    { cx: 76, cy: 130, r: 13 }, { cx: 104, cy: 108, r: 12 }, { cx: 134, cy: 132, r: 14 },
    { cx: 164, cy: 112, r: 12 }, { cx: 92, cy: 158, r: 12 }, { cx: 122, cy: 166, r: 13 },
    { cx: 152, cy: 156, r: 12 }, { cx: 120, cy: 84, r: 11 }, { cx: 90, cy: 92, r: 9 },
    { cx: 150, cy: 88, r: 10 }, { cx: 178, cy: 138, r: 10 }, { cx: 66, cy: 108, r: 9 }
  ];
  const capsules = positions
    .map((p, i) => {
      const color = capsuleColors[i % capsuleColors.length];
      return `
        <clipPath id="cap-clip-${i}"><circle cx="${p.cx}" cy="${p.cy}" r="${p.r}"/></clipPath>
        <circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="#EEE3CC"/>
        <g clip-path="url(#cap-clip-${i})">
          <rect x="${p.cx - p.r}" y="${p.cy - p.r}" width="${p.r * 2}" height="${p.r}" fill="${color}"/>
        </g>
        <circle cx="${p.cx - p.r * 0.35}" cy="${p.cy - p.r * 0.35}" r="${p.r * 0.22}" fill="#FFFFFF" opacity="0.6"/>
        <circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="none" stroke="#00000025" stroke-width="1"/>`;
    })
    .join("");

  // a thin strip of indicator lights set into the top cap
  const bulbXs = [58, 79, 100, 141, 162, 183];
  const bulbs = bulbXs
    .map((x, i) => `<circle class="marquee-bulb" cx="${x}" cy="14" r="3" style="animation-delay:${i * 80}ms"/>`)
    .join("");

  return `
    <svg viewBox="0 0 240 320" class="machine-illustration-svg">
      <defs>
        <filter id="machine-shadow" x="-30%" y="-20%" width="160%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
        <linearGradient id="machine-body-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E23A2E"/>
          <stop offset="100%" stop-color="#B92A20"/>
        </linearGradient>
        <linearGradient id="chrome-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F5F3EE"/>
          <stop offset="45%" stop-color="#ACA69D"/>
          <stop offset="55%" stop-color="#D2CDC3"/>
          <stop offset="100%" stop-color="#75706A"/>
        </linearGradient>
        <linearGradient id="chrome-grad-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#75706A"/>
          <stop offset="50%" stop-color="#F5F3EE"/>
          <stop offset="100%" stop-color="#75706A"/>
        </linearGradient>
        <linearGradient id="glass-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#EDF3F2" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#EDF3F2" stop-opacity="0.05"/>
        </linearGradient>
      </defs>

      <g filter="url(#machine-shadow)">

        <!-- top cap + red tab -->
        <rect x="44" y="8" width="152" height="14" rx="5" fill="url(#chrome-grad-h)"/>
        <rect x="112" y="1" width="16" height="10" rx="3" fill="#E23A2E"/>
        ${bulbs}

        <!-- corner posts -->
        <rect x="45" y="20" width="6" height="176" fill="url(#chrome-grad)"/>
        <rect x="189" y="20" width="6" height="176" fill="url(#chrome-grad)"/>

        <!-- glass case -->
        <rect x="51" y="24" width="138" height="140" rx="4" fill="url(#glass-grad)"/>
        ${capsules}
        <rect x="51" y="24" width="138" height="140" rx="4" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.25"/>
        <rect x="58" y="30" width="18" height="120" fill="#FFFFFF" opacity="0.06"/>

        <!-- chrome frame bar under the glass -->
        <rect x="44" y="190" width="152" height="12" rx="3" fill="url(#chrome-grad-h)"/>

        <!-- red base -->
        <rect x="40" y="198" width="160" height="108" rx="14" fill="url(#machine-body-grad)"/>
        <rect x="40" y="198" width="160" height="108" rx="14" fill="none" stroke="#00000020" stroke-width="1"/>

        <!-- twist knob -->
        <circle cx="120" cy="240" r="28" fill="url(#chrome-grad)"/>
        <circle cx="120" cy="240" r="28" fill="none" stroke="#5A564F" stroke-width="1" opacity="0.4"/>
        <path d="M 145 240 L 162 232 Q 168 240 162 248 Z" fill="url(#chrome-grad)"/>
        <circle cx="120" cy="240" r="8" fill="#E23A2E"/>
        <circle cx="114" cy="234" r="4" fill="#FFFFFF" opacity="0.35"/>

        <!-- small info card -->
        <rect x="150" y="272" width="32" height="24" rx="3" fill="#F0E6D2"/>
        <line x1="155" y1="280" x2="177" y2="280" stroke="#B8A98F" stroke-width="1.4"/>
        <line x1="155" y1="286" x2="171" y2="286" stroke="#B8A98F" stroke-width="1.4"/>

        <!-- dispensing flap -->
        <rect x="56" y="272" width="68" height="26" rx="5" fill="url(#chrome-grad)"/>
        <rect x="61" y="277" width="58" height="16" rx="3" fill="#12100C"/>

        <!-- keyhole -->
        <circle cx="120" cy="298" r="2.6" fill="#12100C"/>
        <rect x="118.7" y="299" width="2.6" height="4" fill="#12100C"/>

      </g>
    </svg>`;
}