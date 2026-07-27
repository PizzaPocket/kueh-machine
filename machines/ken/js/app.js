/* ------------------------------------------------------------------
   STATE + ELEMENT REFS
------------------------------------------------------------------- */
const COLLECTION_KEY = "kueh-machine-collection";

const state = {
  collection: JSON.parse(localStorage.getItem(COLLECTION_KEY) || "{}"), // { kuehId: count }
  isPulling: false
};

const els = {
  machineStage: document.getElementById("machine-stage"),
  machineIllustration: document.getElementById("machine-illustration"),
  dispenseWindow: document.getElementById("dispense-window"),
  capsuleLayer: document.getElementById("capsule-layer"),
  capsuleReveal: document.getElementById("capsule-reveal"),
  capsuleBall: document.getElementById("capsule-ball"),
  capsuleKueh: document.getElementById("capsule-kueh"),
  leverBtn: document.getElementById("lever-btn"),
  outputSection: document.getElementById("output-section"),
  outputCard: document.getElementById("output-card"),
  rarityBanner: document.getElementById("rarity-banner"),
  outputIllustration: document.getElementById("output-illustration"),
  outputName: document.getElementById("output-name"),
  outputMeaning: document.getElementById("output-meaning"),
  outputFlavor: document.getElementById("output-flavor"),
  pullAgainBtn: document.getElementById("pull-again-btn"),
  collectionHeading: document.getElementById("collection-heading"),
  collectionGrid: document.getElementById("collection-grid"),
  legendaryGrid: document.getElementById("legendary-grid"),
  modalOverlay: document.getElementById("kueh-modal-overlay"),
  modalClose: document.getElementById("kueh-modal-close"),
  modalIllustration: document.getElementById("kueh-modal-illustration"),
  modalRarity: document.getElementById("kueh-modal-rarity"),
  modalName: document.getElementById("kueh-modal-name"),
  modalMeaning: document.getElementById("kueh-modal-meaning"),
  modalOrigin: document.getElementById("kueh-modal-origin"),
  modalWhen: document.getElementById("kueh-modal-when"),
  modalFacts: document.getElementById("kueh-modal-facts"),
  modalVariantsSection: document.getElementById("kueh-modal-variants-section"),
  modalVariants: document.getElementById("kueh-modal-variants")
};

const CONFETTI_SETTINGS = {
  common: { colors: ["#B8A98F", "#F5EEE2"], intensity: 14 },
  rare: { colors: ["#5FAE71", "#F5EEE2", "#F2A63B"], intensity: 30 },
  ultraRare: { colors: ["#F5C24B", "#E8604B", "#F5EEE2", "#5FAE71"], intensity: 54 }
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------
   COLLECTION PERSISTENCE
------------------------------------------------------------------- */
function saveCollection() {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(state.collection));
}

function addToCollection(kuehId) {
  const isNew = !state.collection[kuehId];
  state.collection[kuehId] = (state.collection[kuehId] || 0) + 1;
  saveCollection();
  return isNew;
}

function renderCollection() {
  const collectedCount = Object.keys(state.collection).length;
  els.collectionHeading.textContent = `${collectedCount} of ${KUEHS.length} collected`;

  els.collectionGrid.innerHTML = KUEHS.map((k) => {
    const count = state.collection[k.id] || 0;
    const rarity = RARITIES[k.rarity];
    if (count === 0) {
      return `
        <div class="collection-card is-locked">
          <div class="collection-card-illustration collection-card-illustration--locked">?</div>
          <p class="collection-card-name">Not yet pulled</p>
          <span class="rarity-badge rarity-badge--${k.rarity}">${rarity.label}</span>
        </div>`;
    }
    return `
      <button type="button" class="collection-card" data-kueh-id="${k.id}">
        <div class="collection-card-illustration">${renderKuehSVG(k.svgType, k.rarity)}</div>
        <p class="collection-card-name">${k.name}${count > 1 ? ` <span class="collection-count">&times;${count}</span>` : ""}</p>
        <span class="rarity-badge rarity-badge--${k.rarity}">${rarity.label}</span>
      </button>`;
  }).join("");
}

/* ------------------------------------------------------------------
   LEGENDARY — always locked, always shrouded. No pull mechanic exists
   for this tier yet, so these cards are inert: no click handler, no
   name or art shown, just a teaser that the tier exists.
------------------------------------------------------------------- */
function renderLegendary() {
  els.legendaryGrid.innerHTML = LEGENDARY_KUEHS.map(() => `
    <div class="legendary-card">
      <div class="legendary-card-icon">?</div>
      <p class="legendary-card-label">???</p>
      <span class="rarity-badge rarity-badge--legendary">Legendary</span>
    </div>`).join("");
}

/* ------------------------------------------------------------------
   CONFETTI — intensity scales with rarity
------------------------------------------------------------------- */
function burstConfetti(container, colors, intensity) {
  container.querySelectorAll(".confetti-piece").forEach((el) => el.remove());
  for (let i = 0; i < intensity; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 120;
    piece.style.setProperty("--tx", `${(Math.cos(angle) * distance).toFixed(0)}px`);
    piece.style.setProperty("--ty", `${(Math.sin(angle) * distance).toFixed(0)}px`);
    piece.style.setProperty("--rot", `${Math.floor(Math.random() * 480 - 240)}deg`);
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 100}ms`;
    container.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

/* ------------------------------------------------------------------
   THE REVEAL SEQUENCE
   pull -> suspense (shake + flash) -> drop -> capsule rises + cracks
   open above the machine -> details settle in below
------------------------------------------------------------------- */
function resetCapsule() {
  els.capsuleLayer.className = "capsule-layer";
  els.capsuleReveal.className = "capsule-reveal";
  els.capsuleBall.className = "capsule-ball";
  els.capsuleKueh.innerHTML = "";
}

async function playCapsuleReveal(kueh, rarity) {
  els.capsuleReveal.style.setProperty("--capsule-color", rarity.color);
  els.capsuleReveal.style.setProperty("--capsule-color-dark", shade(rarity.color, -40));
  els.capsuleReveal.classList.add(`rarity-${kueh.rarity}`);
  els.capsuleLayer.classList.add("is-active");

  // rise up in front of the machine, growing into a large capsule
  await sleep(30);
  els.capsuleReveal.classList.add("is-risen");
  await sleep(560);

  // crack the shell open
  els.capsuleBall.classList.add("is-opening");
  els.capsuleKueh.innerHTML = renderKuehSVG(kueh.svgType, kueh.rarity);
  await sleep(430);

  // the kueh pops into view with a light burst
  els.capsuleReveal.classList.add("is-revealed");
  const settings = CONFETTI_SETTINGS[kueh.rarity];
  burstConfetti(els.capsuleReveal, settings.colors, settings.intensity);

  if (kueh.rarity === "ultraRare") {
    document.body.classList.add("is-flash");
    setTimeout(() => document.body.classList.remove("is-flash"), 400);
  }
}

async function doPull() {
  if (state.isPulling) return;
  state.isPulling = true;
  els.leverBtn.disabled = true;
  els.outputSection.hidden = true;
  resetCapsule();

  const kueh = pullKueh();
  const rarity = RARITIES[kueh.rarity];

  // 1. pull the lever
  els.leverBtn.classList.add("is-pulling");

  // 2. suspense: shake the cabinet, flash the marquee
  els.machineStage.classList.add("is-shaking");
  els.machineIllustration.classList.add("is-flashing");
  const suspenseMs = kueh.rarity === "ultraRare" ? 2000 : 1600;
  await sleep(suspenseMs);
  els.machineStage.classList.remove("is-shaking");
  els.machineIllustration.classList.remove("is-flashing");
  els.leverBtn.classList.remove("is-pulling");

  // 3. the capsule drops into the dispensing window, bounces, then falls out the chute
  els.dispenseWindow.style.setProperty("--capsule-color", rarity.color);
  els.dispenseWindow.classList.add("is-dropping");
  await sleep(900);
  els.dispenseWindow.classList.remove("is-dropping");

  // 4. the capsule rises above the machine and cracks open
  await playCapsuleReveal(kueh, rarity);

  // 5. the details settle in below, while the opened capsule holds
  reveal(kueh, rarity);
  await sleep(kueh.rarity === "ultraRare" ? 1700 : 1200);
  els.capsuleLayer.classList.remove("is-active");
  els.capsuleReveal.classList.remove("is-risen");

  state.isPulling = false;
  els.leverBtn.disabled = false;
}

function reveal(kueh, rarity) {
  const isNew = addToCollection(kueh.id);
  renderCollection();

  els.outputCard.className = `output-card rarity-${kueh.rarity}`;
  els.rarityBanner.textContent = rarity.label + (kueh.rarity === "ultraRare" ? "!" : "");
  els.outputIllustration.innerHTML = renderKuehSVG(kueh.svgType, kueh.rarity);
  els.outputName.textContent = kueh.name + (isNew ? " · New" : "");
  els.outputMeaning.textContent = kueh.meaning;
  els.outputFlavor.textContent = pick(kueh.flavor);

  els.outputSection.hidden = false;
  els.outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ------------------------------------------------------------------
   KUEH DETAIL MODAL — opened from an unlocked collection card
------------------------------------------------------------------- */
function openKuehModal(kueh) {
  const rarity = RARITIES[kueh.rarity];
  const detail = kueh.detail;

  els.modalOverlay.className = "kueh-modal-overlay";
  els.modalOverlay.classList.add(`rarity-${kueh.rarity}`);
  els.modalIllustration.innerHTML = renderKuehSVG(kueh.svgType, kueh.rarity);
  els.modalRarity.textContent = rarity.label;
  els.modalRarity.className = `rarity-badge rarity-badge--${kueh.rarity}`;
  els.modalName.textContent = kueh.name;
  els.modalMeaning.textContent = kueh.meaning;
  els.modalOrigin.textContent = detail.origin;
  els.modalWhen.textContent = detail.whenEaten;
  els.modalFacts.innerHTML = detail.funFacts.map((f) => `<li>${f}</li>`).join("");

  if (detail.variants && detail.variants.length) {
    els.modalVariantsSection.hidden = false;
    els.modalVariants.innerHTML = detail.variants.map((v) => `
      <div class="kueh-modal-variant">
        <p class="kueh-modal-variant-name">${v.name}</p>
        <p class="kueh-modal-variant-desc">${v.description}</p>
      </div>`).join("");
  } else {
    els.modalVariantsSection.hidden = true;
    els.modalVariants.innerHTML = "";
  }

  els.modalOverlay.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => els.modalOverlay.classList.add("is-open"));
  els.modalClose.focus();
}

function closeKuehModal() {
  els.modalOverlay.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  setTimeout(() => { els.modalOverlay.hidden = true; }, 250);
}

/* ------------------------------------------------------------------
   EVENTS
------------------------------------------------------------------- */
els.leverBtn.addEventListener("click", doPull);
els.pullAgainBtn.addEventListener("click", doPull);

els.collectionGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".collection-card[data-kueh-id]");
  if (!card) return;
  const kueh = KUEHS.find((k) => k.id === card.dataset.kuehId);
  if (kueh) openKuehModal(kueh);
});
els.modalClose.addEventListener("click", closeKuehModal);
els.modalOverlay.addEventListener("click", (e) => {
  if (e.target === els.modalOverlay) closeKuehModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modalOverlay.hidden) closeKuehModal();
});

/* ------------------------------------------------------------------
   INIT
------------------------------------------------------------------- */
els.machineIllustration.innerHTML = renderMachineSVG();
renderCollection();
renderLegendary();
