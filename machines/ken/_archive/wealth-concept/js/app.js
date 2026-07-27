/* ------------------------------------------------------------------
   APP STATE
------------------------------------------------------------------- */
const state = {
  lead: null,            // { name, email } captured at signup
  riskTier: 0,           // 0 = quiz not yet taken, 1–4 once submitted
  complexityAcknowledged: false,
  box: {},               // { kuehId: weight } — the real, gated box
  demoBox: []            // [kuehId, …] — the pre-signup sandbox, equal-weighted
};

const LIQUIDITY_LABELS = { 1: "Low", 2: "Low–medium", 3: "Medium", 4: "Medium–high", 5: "High" };

const els = {
  gallery: document.getElementById("gallery"),
  boxEmpty: document.getElementById("box-empty"),
  boxContents: document.getElementById("box-contents"),
  boxVisual: document.getElementById("box-visual"),
  boxList: document.getElementById("box-list"),
  riskFill: document.getElementById("risk-fill"),
  riskCaption: document.getElementById("risk-caption"),
  horizonFill: document.getElementById("horizon-fill"),
  horizonCaption: document.getElementById("horizon-caption"),
  returnFill: document.getElementById("return-fill"),
  returnCaption: document.getElementById("return-caption"),
  liquidityNote: document.getElementById("liquidity-note"),
  detailOverlay: document.getElementById("detail-overlay"),
  detailBody: document.getElementById("detail-body"),
  detailClose: document.getElementById("detail-close"),
  signupOverlay: document.getElementById("signup-overlay"),
  signupForm: document.getElementById("signup-form"),
  signupClose: document.getElementById("signup-close"),
  quizForm: document.getElementById("quiz-form"),
  quizGreeting: document.getElementById("quiz-greeting"),
  profileBarTier: document.getElementById("profile-bar-tier"),
  retakeQuiz: document.getElementById("retake-quiz"),
  compareTable: document.getElementById("compare-table"),
  scatterWrap: document.getElementById("scatter-wrap"),
  scatterLegend: document.getElementById("scatter-legend"),
  tryTray: document.getElementById("try-tray"),
  tryDropzone: document.getElementById("try-dropzone"),
  tryDropzoneEmpty: document.getElementById("try-dropzone-empty"),
  tryEmpty: document.getElementById("try-empty"),
  tryContents: document.getElementById("try-contents"),
  tryList: document.getElementById("try-list"),
  tryRiskFill: document.getElementById("try-risk-fill"),
  tryRiskCaption: document.getElementById("try-risk-caption"),
  tryHorizonFill: document.getElementById("try-horizon-fill"),
  tryHorizonCaption: document.getElementById("try-horizon-caption"),
  tryReturnFill: document.getElementById("try-return-fill"),
  tryReturnCaption: document.getElementById("try-return-caption")
};

/* ------------------------------------------------------------------
   VIEW ROUTING
------------------------------------------------------------------- */
function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
  document.getElementById(`view-${name}`).classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

document.querySelector(".js-go-home").addEventListener("click", () => showView("landing"));

/* ------------------------------------------------------------------
   SIGN-UP MODAL
------------------------------------------------------------------- */
document.querySelectorAll(".js-open-signup").forEach((btn) => {
  btn.addEventListener("click", () => {
    els.signupOverlay.hidden = false;
  });
});
els.signupClose.addEventListener("click", () => (els.signupOverlay.hidden = true));
els.signupOverlay.addEventListener("click", (e) => {
  if (e.target === els.signupOverlay) els.signupOverlay.hidden = true;
});

els.signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(els.signupForm);
  state.lead = { name: data.get("name").trim(), email: data.get("email").trim() };

  els.signupOverlay.hidden = true;
  els.quizGreeting.textContent = state.lead.name
    ? `Thanks, ${state.lead.name.split(" ")[0]} — a few honest questions`
    : "A few honest questions";
  showView("questionnaire");
});

/* ------------------------------------------------------------------
   QUESTIONNAIRE
------------------------------------------------------------------- */
els.quizForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(els.quizForm);
  const risk = Number(data.get("risk"));
  const horizon = Number(data.get("horizon"));
  const goal = Number(data.get("goal"));

  if (!risk || !horizon || !goal) {
    alert("One more thing — please answer all three questions.");
    return;
  }

  const tier = Math.round((risk + horizon + goal) / 3);
  state.riskTier = Math.min(4, Math.max(1, tier));

  els.profileBarTier.textContent = `${RISK_TIERS[state.riskTier]} — ${
    state.riskTier === 4 ? "the full spread is within reach" : "gallery unlocked to match"
  }`;

  renderGallery();
  renderBox();
  showView("workspace");
});

els.retakeQuiz.addEventListener("click", () => showView("questionnaire"));

/* ------------------------------------------------------------------
   UNLOCK LOGIC
------------------------------------------------------------------- */
function isUnlocked(kueh) {
  if (kueh.unlockTier === 0) return true;
  if (kueh.unlockTier === 4) return state.riskTier >= 4 && state.complexityAcknowledged;
  return state.riskTier >= kueh.unlockTier;
}

function unlockHint(kueh) {
  if (kueh.unlockTier === 4) return "Unlocks at the Aggressive profile, plus a complexity acknowledgment.";
  return `Unlocks at the ${RISK_TIERS[kueh.unlockTier]} profile.`;
}

/* ------------------------------------------------------------------
   GALLERY
------------------------------------------------------------------- */
function renderGallery() {
  els.gallery.innerHTML = "";

  const needsAck = state.riskTier >= 4 && !state.complexityAcknowledged;
  if (needsAck) {
    const ackCard = document.createElement("div");
    ackCard.className = "ack-banner";
    ackCard.innerHTML = `
      <label class="ack-option">
        <input type="checkbox" id="ack-checkbox">
        <span>I understand that Bonus Income and Private Reserve are less liquid and more complex than the other kuehs, and I'm comfortable exploring them anyway.</span>
      </label>
    `;
    els.gallery.appendChild(ackCard);
    document.getElementById("ack-checkbox").addEventListener("change", (e) => {
      state.complexityAcknowledged = e.target.checked;
      renderGallery();
    });
  }

  KUEHS.forEach((kueh) => {
    const unlocked = isUnlocked(kueh);
    const inBox = Object.prototype.hasOwnProperty.call(state.box, kueh.id);

    const card = document.createElement("article");
    card.className = "kueh-card" + (unlocked ? "" : " is-locked") + (inBox ? " is-in-box" : "");

    card.innerHTML = `
      <div class="kueh-swatch" style="background: linear-gradient(135deg, ${kueh.palette[0]}, ${kueh.palette[1]})">
        ${unlocked ? "" : `<span class="lock-icon" aria-hidden="true">&#128274;</span>`}
      </div>
      <div class="kueh-card-body">
        <p class="kueh-name">${kueh.kuehName}</p>
        <p class="kueh-label">${kueh.label}</p>
        ${unlocked
          ? `<p class="kueh-meta">Risk ${kueh.risk}/5 &middot; ${kueh.horizon[0]}–${kueh.horizon[1]} yrs</p>`
          : `<p class="kueh-hint">${unlockHint(kueh)}</p>`}
      </div>
      ${unlocked && inBox ? `<span class="in-box-badge">In box</span>` : ""}
    `;

    if (unlocked) {
      card.addEventListener("click", () => openDetail(kueh));
    }

    els.gallery.appendChild(card);
  });
}

/* ------------------------------------------------------------------
   DETAIL MODAL
------------------------------------------------------------------- */
function openDetail(kueh) {
  const inBox = Object.prototype.hasOwnProperty.call(state.box, kueh.id);

  els.detailBody.innerHTML = `
    <div class="detail-swatch" style="background: linear-gradient(135deg, ${kueh.palette[0]}, ${kueh.palette[1]})"></div>
    <p class="eyebrow">${kueh.technicalTerm}</p>
    <h3>${kueh.kuehName}</h3>
    <p class="detail-label">${kueh.label}</p>
    <p class="detail-blurb">${kueh.blurb}</p>
    <p class="detail-suits"><strong>Suits:</strong> ${kueh.suits}</p>

    <div class="detail-stats">
      <div class="stat"><span>Risk</span><div class="stat-track"><div class="stat-fill" style="width:${kueh.risk * 20}%"></div></div></div>
      <div class="stat"><span>Liquidity</span><div class="stat-track"><div class="stat-fill" style="width:${kueh.liquidity * 20}%"></div></div></div>
      <div class="stat"><span>Complexity</span><div class="stat-track"><div class="stat-fill" style="width:${kueh.complexity * 20}%"></div></div></div>
    </div>
    <p class="detail-figures">Horizon ${kueh.horizon[0]}–${kueh.horizon[1]} years &middot; Target return ${kueh.returnRange[0]}–${kueh.returnRange[1]}% p.a.</p>

    <button class="btn ${inBox ? "btn-secondary" : "btn-primary"}" id="detail-toggle-box">
      ${inBox ? "Remove from box" : "Add to box"}
    </button>
  `;

  document.getElementById("detail-toggle-box").addEventListener("click", () => {
    toggleBox(kueh.id);
    openDetail(kueh);
    renderGallery();
    renderBox();
  });

  els.detailOverlay.hidden = false;
}

els.detailClose.addEventListener("click", closeDetail);
els.detailOverlay.addEventListener("click", (e) => {
  if (e.target === els.detailOverlay) closeDetail();
});
function closeDetail() {
  els.detailOverlay.hidden = true;
}

/* ------------------------------------------------------------------
   BOX MANAGEMENT
------------------------------------------------------------------- */
function toggleBox(kuehId) {
  if (state.box[kuehId]) {
    delete state.box[kuehId];
  } else {
    state.box[kuehId] = 1;
  }
}

function adjustWeight(kuehId, delta) {
  const next = Math.min(3, Math.max(0.5, (state.box[kuehId] || 1) + delta));
  state.box[kuehId] = Math.round(next * 2) / 2;
  renderBox();
}

function removeFromBox(kuehId) {
  delete state.box[kuehId];
  renderBox();
  renderGallery();
}

/* ------------------------------------------------------------------
   BOX RENDER + PROFILE MATH
------------------------------------------------------------------- */
function renderBox() {
  const ids = Object.keys(state.box);

  if (ids.length === 0) {
    els.boxEmpty.hidden = false;
    els.boxContents.hidden = true;
    return;
  }

  els.boxEmpty.hidden = true;
  els.boxContents.hidden = false;

  const items = ids.map((id) => ({ kueh: KUEHS.find((k) => k.id === id), weight: state.box[id] }));
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  items.forEach((i) => (i.pct = (i.weight / totalWeight) * 100));

  els.boxVisual.innerHTML = items
    .map(
      (i) => `<div class="box-segment" style="width:${i.pct}%; background: linear-gradient(135deg, ${i.kueh.palette[0]}, ${i.kueh.palette[1]})" title="${i.kueh.kuehName} — ${Math.round(i.pct)}%"></div>`
    )
    .join("");

  els.boxList.innerHTML = items
    .map(
      (i) => `
      <li class="box-item">
        <span class="box-item-swatch" style="background: linear-gradient(135deg, ${i.kueh.palette[0]}, ${i.kueh.palette[1]})"></span>
        <span class="box-item-name">${i.kueh.kuehName}<small>${i.kueh.label}</small></span>
        <span class="box-item-controls">
          <button type="button" data-action="minus" data-id="${i.kueh.id}" aria-label="Decrease allocation">&minus;</button>
          <span class="box-item-pct">${Math.round(i.pct)}%</span>
          <button type="button" data-action="plus" data-id="${i.kueh.id}" aria-label="Increase allocation">&plus;</button>
          <button type="button" class="box-item-remove" data-action="remove" data-id="${i.kueh.id}" aria-label="Remove">&times;</button>
        </span>
      </li>`
    )
    .join("");

  els.boxList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === "plus") adjustWeight(id, 0.5);
      if (btn.dataset.action === "minus") adjustWeight(id, -0.5);
      if (btn.dataset.action === "remove") removeFromBox(id);
    });
  });

  paintProfile(computeProfile(items), {
    riskFill: els.riskFill,
    riskCaption: els.riskCaption,
    horizonFill: els.horizonFill,
    horizonCaption: els.horizonCaption,
    returnFill: els.returnFill,
    returnCaption: els.returnCaption,
    liquidityNote: els.liquidityNote
  });
}

/* ------------------------------------------------------------------
   SHARED PROFILE MATH (used by the real box and the try-it sandbox)
------------------------------------------------------------------- */
function computeProfile(items) {
  return {
    weightedRisk: items.reduce((sum, i) => sum + i.kueh.risk * (i.pct / 100), 0),
    weightedLiquidity: items.reduce((sum, i) => sum + i.kueh.liquidity * (i.pct / 100), 0),
    horizonMin: items.reduce((sum, i) => sum + i.kueh.horizon[0] * (i.pct / 100), 0),
    horizonMax: items.reduce((sum, i) => sum + i.kueh.horizon[1] * (i.pct / 100), 0),
    returnMin: items.reduce((sum, i) => sum + i.kueh.returnRange[0] * (i.pct / 100), 0),
    returnMax: items.reduce((sum, i) => sum + i.kueh.returnRange[1] * (i.pct / 100), 0)
  };
}

function paintProfile(profile, target) {
  target.riskFill.style.width = `${(profile.weightedRisk / 5) * 100}%`;
  const nearestTier = RISK_TIERS[Math.min(4, Math.max(1, Math.round(profile.weightedRisk)))];
  target.riskCaption.textContent = `${profile.weightedRisk.toFixed(1)} / 5 — ${nearestTier} profile`;

  const hMinPct = (profile.horizonMin / 10) * 100;
  const hMaxPct = (profile.horizonMax / 10) * 100;
  target.horizonFill.style.left = `${hMinPct}%`;
  target.horizonFill.style.width = `${Math.max(2, hMaxPct - hMinPct)}%`;
  target.horizonCaption.textContent = `${profile.horizonMin.toFixed(1)}–${profile.horizonMax.toFixed(1)} years`;

  const rMinPct = (profile.returnMin / 16) * 100;
  const rMaxPct = (profile.returnMax / 16) * 100;
  target.returnFill.style.left = `${rMinPct}%`;
  target.returnFill.style.width = `${Math.max(2, rMaxPct - rMinPct)}%`;
  target.returnCaption.textContent = `${profile.returnMin.toFixed(1)}–${profile.returnMax.toFixed(1)}% p.a.`;

  if (target.liquidityNote) {
    target.liquidityNote.textContent = `Liquidity: ${LIQUIDITY_LABELS[Math.min(5, Math.max(1, Math.round(profile.weightedLiquidity)))]}`;
  }
}

/* ------------------------------------------------------------------
   LANDING — TRY-IT SANDBOX (drag/tap, no sign-up required)
------------------------------------------------------------------- */
function renderTryTray() {
  els.tryTray.innerHTML = KUEHS.map((k) => {
    const added = state.demoBox.includes(k.id);
    return `
      <button type="button" class="try-chip${added ? " is-added" : ""}" draggable="${!added}" data-id="${k.id}" ${added ? "disabled" : ""}>
        <span class="try-chip-swatch" style="background: linear-gradient(135deg, ${k.palette[0]}, ${k.palette[1]})"></span>
        ${k.kuehName}${added ? " &middot; added" : ""}
      </button>`;
  }).join("");

  els.tryTray.querySelectorAll(".try-chip").forEach((chip) => {
    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", chip.dataset.id);
      chip.classList.add("is-dragging");
    });
    chip.addEventListener("dragend", () => chip.classList.remove("is-dragging"));
    chip.addEventListener("click", () => addToDemoBox(chip.dataset.id));
  });
}

function addToDemoBox(kuehId) {
  if (!state.demoBox.includes(kuehId)) state.demoBox.push(kuehId);
  renderTryTray();
  renderTryBox();
}

function removeFromDemoBox(kuehId) {
  state.demoBox = state.demoBox.filter((id) => id !== kuehId);
  renderTryTray();
  renderTryBox();
}

function renderTryBox() {
  els.tryDropzoneEmpty.hidden = state.demoBox.length > 0;
  els.tryDropzone.querySelectorAll(".try-dropped-chip").forEach((el) => el.remove());

  state.demoBox.forEach((id) => {
    const kueh = KUEHS.find((k) => k.id === id);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "try-dropped-chip";
    chip.dataset.id = id;
    chip.setAttribute("aria-label", `Remove ${kueh.kuehName}`);
    chip.innerHTML = `
      <span class="try-chip-swatch" style="background: linear-gradient(135deg, ${kueh.palette[0]}, ${kueh.palette[1]})"></span>
      ${kueh.kuehName} <span aria-hidden="true">&times;</span>`;
    chip.addEventListener("click", () => removeFromDemoBox(id));
    els.tryDropzone.appendChild(chip);
  });

  if (state.demoBox.length === 0) {
    els.tryEmpty.hidden = false;
    els.tryContents.hidden = true;
    return;
  }
  els.tryEmpty.hidden = true;
  els.tryContents.hidden = false;

  const items = state.demoBox.map((id) => ({ kueh: KUEHS.find((k) => k.id === id), pct: 100 / state.demoBox.length }));

  els.tryList.innerHTML = items
    .map(
      (i) => `
      <li class="box-item">
        <span class="box-item-swatch" style="background: linear-gradient(135deg, ${i.kueh.palette[0]}, ${i.kueh.palette[1]})"></span>
        <span class="box-item-name">${i.kueh.kuehName}<small>${i.kueh.label}</small></span>
        <span class="box-item-pct">${Math.round(i.pct)}%</span>
      </li>`
    )
    .join("");

  paintProfile(computeProfile(items), {
    riskFill: els.tryRiskFill,
    riskCaption: els.tryRiskCaption,
    horizonFill: els.tryHorizonFill,
    horizonCaption: els.tryHorizonCaption,
    returnFill: els.tryReturnFill,
    returnCaption: els.tryReturnCaption
  });
}

els.tryDropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  els.tryDropzone.classList.add("is-dragover");
});
els.tryDropzone.addEventListener("dragleave", (e) => {
  if (e.target === els.tryDropzone) els.tryDropzone.classList.remove("is-dragover");
});
els.tryDropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  els.tryDropzone.classList.remove("is-dragover");
  const id = e.dataTransfer.getData("text/plain");
  if (id) addToDemoBox(id);
});

/* ------------------------------------------------------------------
   LANDING — COMPARISON TABLE
------------------------------------------------------------------- */
function renderCompareTable() {
  const header = `
    <div class="compare-row compare-head" role="row">
      <div class="compare-cell compare-cell-name" role="columnheader">Kueh</div>
      <div class="compare-cell" role="columnheader">Risk</div>
      <div class="compare-cell" role="columnheader">Liquidity</div>
      <div class="compare-cell" role="columnheader">Complexity</div>
      <div class="compare-cell compare-cell-text" role="columnheader">Horizon</div>
      <div class="compare-cell compare-cell-text" role="columnheader">Target return</div>
    </div>`;

  const rows = KUEHS.map(
    (k) => `
    <div class="compare-row" role="row">
      <div class="compare-cell compare-cell-name" role="cell">
        <span class="compare-swatch" style="background:${k.chartColor}"></span>
        <span class="compare-names"><strong>${k.kuehName}</strong><small>${k.label}</small></span>
      </div>
      <div class="compare-cell" role="cell">
        <div class="compare-bar-track"><div class="compare-bar-fill" style="width:${k.risk * 20}%; background:${k.chartColor}"></div></div>
        <span class="compare-value">${k.risk}/5</span>
      </div>
      <div class="compare-cell" role="cell">
        <div class="compare-bar-track"><div class="compare-bar-fill" style="width:${k.liquidity * 20}%; background:${k.chartColor}"></div></div>
        <span class="compare-value">${k.liquidity}/5</span>
      </div>
      <div class="compare-cell" role="cell">
        <div class="compare-bar-track"><div class="compare-bar-fill" style="width:${k.complexity * 20}%; background:${k.chartColor}"></div></div>
        <span class="compare-value">${k.complexity}/5</span>
      </div>
      <div class="compare-cell compare-cell-text" role="cell">${k.horizon[0]}–${k.horizon[1]} yrs</div>
      <div class="compare-cell compare-cell-text" role="cell">${k.returnRange[0]}–${k.returnRange[1]}%</div>
    </div>`
  ).join("");

  els.compareTable.innerHTML = header + rows;
}

/* ------------------------------------------------------------------
   LANDING — RISK / RETURN SCATTER
------------------------------------------------------------------- */
function renderScatter() {
  const W = 640, H = 340;
  const marginLeft = 44, marginRight = 20, marginTop = 20, marginBottom = 40;
  const plotW = W - marginLeft - marginRight;
  const plotH = H - marginTop - marginBottom;

  const xFor = (risk) => marginLeft + ((risk - 0.5) / 5) * plotW;
  const yFor = (val) => marginTop + (1 - val / 16) * plotH;

  const yTicks = [0, 4, 8, 12, 16];
  const gridLines = yTicks
    .map(
      (t) => `
      <line x1="${marginLeft}" y1="${yFor(t)}" x2="${W - marginRight}" y2="${yFor(t)}" class="chart-grid"></line>
      <text x="${marginLeft - 10}" y="${yFor(t) + 4}" class="chart-axis-label" text-anchor="end">${t}%</text>`
    )
    .join("");

  const xTicks = [1, 2, 3, 4, 5]
    .map(
      (r) => `<text x="${xFor(r)}" y="${H - marginBottom + 22}" class="chart-axis-label" text-anchor="middle">${r}</text>`
    )
    .join("");

  const marks = KUEHS.map((k) => {
    const x = xFor(k.risk);
    const yMin = yFor(k.returnRange[0]);
    const yMax = yFor(k.returnRange[1]);
    return `
      <g class="scatter-mark" data-id="${k.id}">
        <rect x="${x - 24}" y="${marginTop}" width="48" height="${plotH}" class="scatter-hit"></rect>
        <line x1="${x}" y1="${yMin}" x2="${x}" y2="${yMax}" stroke="${k.chartColor}" stroke-width="4" stroke-linecap="round" class="scatter-line"></line>
        <circle cx="${x}" cy="${yMax}" r="6" fill="${k.chartColor}" stroke="var(--paper)" stroke-width="2"></circle>
        <circle cx="${x}" cy="${yMin}" r="4" fill="${k.chartColor}" stroke="var(--paper)" stroke-width="2"></circle>
        <text x="${x}" y="${yMax - 14}" class="chart-mark-label" text-anchor="middle">${k.kuehName}</text>
      </g>`;
  }).join("");

  els.scatterWrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="scatter-svg" role="img" aria-label="Risk versus target return for each kueh">
      ${gridLines}
      <line x1="${marginLeft}" y1="${H - marginBottom}" x2="${W - marginRight}" y2="${H - marginBottom}" class="chart-axis"></line>
      ${xTicks}
      <text x="${(marginLeft + W - marginRight) / 2}" y="${H - 4}" class="chart-axis-title" text-anchor="middle">Risk score (1–5)</text>
      ${marks}
    </svg>
    <div class="chart-tooltip" id="chart-tooltip" hidden></div>
  `;

  els.scatterLegend.innerHTML = KUEHS.map(
    (k) => `<span class="legend-item"><span class="legend-swatch" style="background:${k.chartColor}"></span>${k.kuehName}</span>`
  ).join("");

  const tooltip = document.getElementById("chart-tooltip");
  const wrap = els.scatterWrap;
  els.scatterWrap.querySelectorAll(".scatter-mark").forEach((mark) => {
    const kueh = KUEHS.find((k) => k.id === mark.dataset.id);
    mark.addEventListener("mouseenter", () => {
      mark.classList.add("is-hovered");
      tooltip.hidden = false;
      tooltip.innerHTML = `<strong>${kueh.kuehName}</strong> — ${kueh.label}<br>Risk ${kueh.risk}/5 &middot; Target return ${kueh.returnRange[0]}–${kueh.returnRange[1]}% p.a.`;
    });
    mark.addEventListener("mousemove", (e) => {
      const rect = wrap.getBoundingClientRect();
      tooltip.style.left = `${e.clientX - rect.left + 14}px`;
      tooltip.style.top = `${e.clientY - rect.top + 14}px`;
    });
    mark.addEventListener("mouseleave", () => {
      mark.classList.remove("is-hovered");
      tooltip.hidden = true;
    });
  });
}

/* ------------------------------------------------------------------
   INIT
------------------------------------------------------------------- */
renderCompareTable();
renderScatter();
renderTryTray();
renderTryBox();
renderGallery();
renderBox();
