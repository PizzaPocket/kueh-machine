/* ------------------------------------------------------------------
   STATE + ELEMENT REFS
------------------------------------------------------------------- */
const COLLECTION_KEY = "kueh-machine-collection";
const STOP_MOTION_FRAMES = [1, 2, 3, 4, 5, 6, 7, 8].map((frame) => `./Resources/images/optimized/Set 2/${frame}.webp`);
const STOP_MOTION_SCALES = [0.4, 0.515, 0.63, 0.745, 0.855, 0.97, 1.085, 1.2];
const STOP_MOTION_GLOW_MULTIPLIERS = [1, 1, 1.18, 1.28, 1.55, 1.9, 2.3, 2.75];
const STOP_MOTION_GLOW_OPACITIES = [0.72, 0.72, 0.9, 0.95, 1, 1, 1, 1];
const STOP_MOTION_PRELOADS = STOP_MOTION_FRAMES.map((source) => {
  const image = new Image();
  image.src = source;
  return image;
});
const COLLECTION_IMAGES = {
  bahulu: "./Resources/images/optimized/Kueh balls/bahulu.webp",
  dadar: "./Resources/images/optimized/Kueh balls/dadar.webp",
  lapis: "./Resources/images/optimized/Kueh balls/lapis.webp",
  ondeh: "./Resources/images/optimized/Kueh balls/ondeh.webp",
  salat: "./Resources/images/optimized/Kueh balls/salat.webp",
  angku: "./Resources/images/optimized/Kueh balls/ang ku kueh.webp",
  talam: "./Resources/images/optimized/Kueh balls/talam.webp",
  koswee: "./Resources/images/optimized/Kueh balls/ko swee.webp?v=2",
  "pulut-hitam": "./Resources/images/optimized/Kueh balls/pulut hitam.webp?v=2"
};
const SHOP_PRICES = {
  bahulu: 12,
  ondeh: 12,
  dadar: 14,
  lapis: 18,
  salat: 18,
  angku: 20,
  talam: 24,
  koswee: 24,
  "pulut-hitam": 28
};
const shopBag = {};
const KUEH_MAKERS = [
  { name: "Bengawan Solo", address: "Multiple locations", website: "https://www.bengawansolo.com.sg/", image: "./Resources/images/optimized/shops/bengawan-solo.webp" },
  { name: "Ji Xiang Confectionery", address: "Block 1 Everton Park, #01-33, Singapore 081001", website: "https://jixiangeverton.com.sg", image: "./Resources/images/optimized/shops/jixiang.webp" },
  { name: "Kueh Ho Jiak", address: "6 Tanjong Pagar Plaza, #02-20, Singapore 081006", website: "https://kuehhojiak.com", image: "./Resources/images/optimized/shops/kueh-ho-jiak.webp" },
  { name: "Kim Choo Kueh Chang", address: "60 Joo Chiat Place, Singapore 427784", website: "https://www.kimchoo.com/", image: "./Resources/images/optimized/shops/kim-choo.webp" },
  { name: "Ollella", address: "135 Amoy St, #01-04 Far East Square, Singapore 049964", website: "https://ollella.com", image: "./Resources/images/optimized/shops/ollella.webp" }
];

const state = {
  collection: JSON.parse(localStorage.getItem(COLLECTION_KEY) || "{}"), // { kuehId: count }
  isPulling: false
};

const els = {
  machineStage: document.getElementById("machine-stage"),
  machineIllustration: document.getElementById("machine-illustration"),
  stopMotionLayer: document.getElementById("stop-motion-layer"),
  stopMotionFrameA: document.getElementById("stop-motion-frame-a"),
  stopMotionFrameB: document.getElementById("stop-motion-frame-b"),
  dispenseWindow: document.getElementById("dispense-window"),
  dispenseBall: document.getElementById("dispense-ball"),
  capsuleLayer: document.getElementById("capsule-layer"),
  capsuleReveal: document.getElementById("capsule-reveal"),
  capsuleBall: document.getElementById("capsule-ball"),
  capsuleKueh: document.getElementById("capsule-kueh"),
  leverBtn: document.getElementById("lever-btn"),
  gatchaCta: document.getElementById("gatcha-cta"),
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
  makersCarousel: document.getElementById("makers-carousel"),
  makersPrev: document.getElementById("makers-prev"),
  makersNext: document.getElementById("makers-next"),
  shopGrid: document.getElementById("shop-grid"),
  shopBagButton: document.getElementById("shop-bag-button"),
  shopBagCount: document.getElementById("shop-bag-count"),
  shopProductOverlay: document.getElementById("shop-product-overlay"),
  shopProductClose: document.getElementById("shop-product-close"),
  shopProductImage: document.getElementById("shop-product-image"),
  shopProductRarity: document.getElementById("shop-product-rarity"),
  shopProductTitle: document.getElementById("shop-product-title"),
  shopProductSubtitle: document.getElementById("shop-product-subtitle"),
  shopProductEdition: document.getElementById("shop-product-edition"),
  shopProductSpecification: document.getElementById("shop-product-specification"),
  shopProductPrice: document.getElementById("shop-product-price"),
  shopProductQuantity: document.getElementById("shop-product-quantity"),
  shopProductAdd: document.getElementById("shop-product-add"),
  shopTrayOverlay: document.getElementById("shop-tray-overlay"),
  shopTrayClose: document.getElementById("shop-tray-close"),
  shopTrayItems: document.getElementById("shop-tray-items"),
  shopTrayEmpty: document.getElementById("shop-tray-empty"),
  shopTotal: document.getElementById("shop-total"),
  shopCheckoutButton: document.getElementById("shop-checkout-button"),
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
function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
function renderKuehIllustration(kueh) {
  const image = COLLECTION_IMAGES[kueh.id];
  return image
    ? `<span class="kueh-ball-frame rarity-${kueh.rarity}"><img class="kueh-ball-illustration" src="${image}" alt=""></span>`
    : renderKuehSVG(kueh.svgType, kueh.rarity);
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
  pushCollectionToServer();
  return isNew;
}

/* ------------------------------------------------------------------
   ACCOUNT SYNC — guests keep using localStorage, while signed-in
   collections are merged with the universal Kueh Machine account.
------------------------------------------------------------------- */
function pushCollectionToServer() {
  const user = window.KuehAccount.getUser();
  if (!user) return;

  window.KuehAccount.ready
    .then((client) => client.from("ken_collection").upsert({
      user_id: user.id,
      data: state.collection,
      updated_at: new Date().toISOString()
    }))
    .catch((error) => console.warn("[ken] collection sync failed:", error));
}

// Keep the highest count for every kueh, so neither browser-local nor
// account progress can be lost when somebody signs in on another device.
function syncCollectionFromServer() {
  const user = window.KuehAccount.getUser();
  if (!user) return;

  window.KuehAccount.ready
    .then((client) => client
      .from("ken_collection")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle())
    .then((result) => {
      const serverCollection = (result && result.data && result.data.data) || {};
      let localChanged = false;
      let serverBehind = false;

      Object.keys(serverCollection).forEach((id) => {
        if ((state.collection[id] || 0) < serverCollection[id]) {
          state.collection[id] = serverCollection[id];
          localChanged = true;
        }
      });
      Object.keys(state.collection).forEach((id) => {
        if (state.collection[id] > (serverCollection[id] || 0)) serverBehind = true;
      });

      if (localChanged) {
        saveCollection();
        renderCollection();
      }
      if (localChanged || serverBehind) pushCollectionToServer();
    })
    .catch((error) => console.warn("[ken] collection fetch failed:", error));
}

window.KuehAccount.ready.then(() => {
  if (window.KuehAccount.getUser()) syncCollectionFromServer();
});
window.KuehAccount.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") syncCollectionFromServer();
});

function renderCollection() {
  const collectedCount = Object.keys(state.collection).length;
  els.collectionHeading.textContent = `${collectedCount} of ${KUEHS.length} collected`;
  els.collectionGrid.innerHTML = KUEHS.map((kueh) => {
    const count = state.collection[kueh.id] || 0;
    const rarity = RARITIES[kueh.rarity];
    if (!count) return `<div class="collection-card is-locked"><div class="collection-card-illustration collection-card-illustration--locked">?</div><p class="collection-card-name">Not yet pulled</p><span class="rarity-badge rarity-badge--${kueh.rarity}">${rarity.label}</span></div>`;
    return `<button type="button" class="collection-card" data-kueh-id="${kueh.id}"><div class="collection-card-illustration">${renderKuehIllustration(kueh)}</div><p class="collection-card-name">${kueh.name}${count > 1 ? ` <span class="collection-count">&times;${count}</span>` : ""}</p><span class="rarity-badge rarity-badge--${kueh.rarity}">${rarity.label}</span></button>`;
  }).join("");
  renderShop();
}

function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderShop() {
  const unlocked = KUEHS.filter((kueh) => state.collection[kueh.id]);
  els.shopGrid.innerHTML = unlocked.length ? unlocked.map((kueh) => `<button type="button" class="shop-card" data-shop-kueh-id="${kueh.id}"><span class="shop-card-image">${renderKuehIllustration(kueh)}</span><span class="shop-card-details"><strong>${kueh.name}</strong><span>${formatPrice(SHOP_PRICES[kueh.id])}</span></span><span class="shop-card-action">View details</span></button>`).join("") : `<p class="shop-empty-state">Pull a kueh to unlock it in the shop.</p>`;
}

function renderMakers() {
  els.makersCarousel.innerHTML = KUEH_MAKERS.map((maker) => `
    <article class="maker-card">
      <img class="maker-card-image" src="${maker.image}" alt="${maker.name} storefront" loading="lazy" decoding="async">
      <div class="maker-card-body">
        <h3>${maker.name}</h3>
        <p>${maker.address}</p>
        <a href="${maker.website}" target="_blank" rel="noreferrer">Visit website <span aria-hidden="true">&rarr;</span></a>
      </div>
    </article>`).join("");
}

function moveMakers(direction) {
  const amount = els.makersCarousel.clientWidth * 0.82;
  els.makersCarousel.scrollBy({ left: direction * amount, behavior: "smooth" });
}

function openShopProduct(kueh) {
  selectedShopKueh = kueh;
  els.shopProductImage.innerHTML = renderKuehIllustration(kueh);
  els.shopProductRarity.textContent = RARITIES[kueh.rarity].label;
  els.shopProductRarity.className = `rarity-badge rarity-badge--${kueh.rarity}`;
  els.shopProductTitle.textContent = kueh.name;
  els.shopProductSubtitle.textContent = kueh.meaning;
  els.shopProductEdition.textContent = `${RARITIES[kueh.rarity].label} edition`;
  els.shopProductSpecification.textContent = kueh.detail.whenEaten;
  els.shopProductPrice.textContent = formatPrice(SHOP_PRICES[kueh.id]);
  els.shopProductQuantity.value = 1;
  els.shopProductAdd.textContent = "Add to bag";
  els.shopProductOverlay.hidden = false;
  document.body.classList.add("shop-product-open");
  requestAnimationFrame(() => els.shopProductOverlay.classList.add("is-open"));
  els.shopProductClose.focus();
}

function closeShopProduct() {
  els.shopProductOverlay.classList.remove("is-open");
  document.body.classList.remove("shop-product-open");
  setTimeout(() => { els.shopProductOverlay.hidden = true; }, 250);
}

function renderShopBag() {
  const items = Object.entries(shopBag).map(([id, quantity]) => ({ kueh: KUEHS.find((item) => item.id === id), quantity }));
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + SHOP_PRICES[item.kueh.id] * item.quantity, 0);
  els.shopBagCount.textContent = itemCount;
  els.shopTrayItems.innerHTML = items.map(({ kueh, quantity }) => `<div class="shop-tray-item"><div class="shop-tray-item-image">${renderKuehIllustration(kueh)}</div><div class="shop-tray-item-info"><strong>${kueh.name}</strong><span>${formatPrice(SHOP_PRICES[kueh.id])}</span></div><div class="shop-quantity" aria-label="Quantity for ${kueh.name}"><button type="button" data-shop-action="decrease" data-shop-kueh-id="${kueh.id}" aria-label="Decrease ${kueh.name} quantity">-</button><span>${quantity}</span><button type="button" data-shop-action="increase" data-shop-kueh-id="${kueh.id}" aria-label="Increase ${kueh.name} quantity">+</button></div></div>`).join("");
  els.shopTrayEmpty.hidden = items.length > 0;
  els.shopTotal.textContent = formatPrice(subtotal);
  els.shopCheckoutButton.disabled = items.length === 0;
}

function openShopTray() {
  els.shopTrayOverlay.hidden = false;
  document.body.classList.add("shop-tray-open");
  requestAnimationFrame(() => els.shopTrayOverlay.classList.add("is-open"));
}

function closeShopTray() {
  els.shopTrayOverlay.classList.remove("is-open");
  document.body.classList.remove("shop-tray-open");
  setTimeout(() => { els.shopTrayOverlay.hidden = true; }, 250);
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
async function playStopMotion(duration) {
  resetStopMotionFrames();
  [els.stopMotionFrameA, els.stopMotionFrameB].forEach((image) => image.style.removeProperty("transition"));
  els.machineStage.classList.add("is-stop-motion");
  els.stopMotionLayer.classList.add("is-playing");
  const frameDuration = 160;
  let visibleFrame = els.stopMotionFrameA;
  let incomingFrame = els.stopMotionFrameB;

  visibleFrame.classList.remove("is-visible");
  incomingFrame.classList.remove("is-visible");
  setStopMotionFrame(visibleFrame, STOP_MOTION_FRAMES[0], 0, 0.275);
  visibleFrame.style.transform = "translate(-50%, -50%) scale(0.275)";
  visibleFrame.style.opacity = "0.35";
  await nextPaint();
  visibleFrame.classList.add("is-visible");
  visibleFrame.style.opacity = "1";
  visibleFrame.style.transform = "translate(-50%, -50%) scale(0.4)";
  await Promise.all(STOP_MOTION_PRELOADS.map((image) => image.decode().catch(() => undefined)));
  await sleep(frameDuration);

  for (const [index, frame] of STOP_MOTION_FRAMES.slice(1).entries()) {
    const previousScale = STOP_MOTION_SCALES[index];
    const nextScale = setStopMotionFrame(incomingFrame, frame, index + 1, previousScale);
    await incomingFrame.decode().catch(() => undefined);
    await nextPaint();
    incomingFrame.classList.add("is-visible");
    visibleFrame.classList.remove("is-visible");
    incomingFrame.style.transform = `translate(-50%, -50%) scale(${nextScale})`;
    await sleep(frameDuration);
    [visibleFrame, incomingFrame] = [incomingFrame, visibleFrame];
  }

  await sleep(350);
  els.stopMotionLayer.classList.remove("is-playing");
  els.machineStage.classList.remove("is-stop-motion");
}

function resetStopMotionFrames() {
  [els.stopMotionFrameA, els.stopMotionFrameB].forEach((image) => {
    image.classList.remove("is-visible");
    image.removeAttribute("src");
    image.style.transition = "none";
    image.style.opacity = "0";
  });
}

function setStopMotionFrame(image, source, frameIndex, initialScale) {
  const scale = STOP_MOTION_SCALES[frameIndex];
  const glowMultiplier = STOP_MOTION_GLOW_MULTIPLIERS[frameIndex];
  image.src = source;
  image.style.transform = `translate(-50%, -50%) scale(${initialScale ?? scale})`;
  els.stopMotionLayer.style.setProperty("--glow-size", `${180 * scale * glowMultiplier}px`);
  els.stopMotionLayer.style.setProperty("--glow-core-size", `${58 * scale * glowMultiplier}px`);
  els.stopMotionLayer.style.setProperty("--glow-opacity", STOP_MOTION_GLOW_OPACITIES[frameIndex]);
  els.stopMotionLayer.style.setProperty("--glow-core-opacity", STOP_MOTION_GLOW_OPACITIES[frameIndex]);
  return scale;
}

async function doPull() {
  if (state.isPulling) return;
  state.isPulling = true;
  els.machineStage.scrollIntoView({ behavior: "smooth", block: "start" });
  els.leverBtn.disabled = true;
  els.gatchaCta.disabled = true;
  els.outputSection.hidden = true;

  const kueh = pullKueh();

  // 1. press and turn the separate knob layer before the reveal
  els.leverBtn.classList.add("is-pressed");
  await sleep(180);
  els.dispenseBall.classList.remove("is-rolling");
  void els.dispenseBall.offsetWidth;
  els.dispenseBall.classList.add("is-rolling");

  // 2. suspense: advance through the photographed capsule frames
  const suspenseMs = kueh.rarity === "ultraRare" ? 4000 : 3200;
  await playStopMotion(suspenseMs);
  els.leverBtn.classList.remove("is-pressed");

  // 3. settle the details below the finished frame
  const rarity = RARITIES[kueh.rarity];
  reveal(kueh, rarity);

  state.isPulling = false;
  els.leverBtn.disabled = false;
  els.gatchaCta.disabled = false;
}

function reveal(kueh, rarity) {
  const isNew = addToCollection(kueh.id);
  renderCollection();

  els.outputCard.className = `output-card rarity-${kueh.rarity}`;
  els.rarityBanner.textContent = rarity.label + (kueh.rarity === "ultraRare" ? "!" : "");
  els.outputIllustration.innerHTML = renderKuehIllustration(kueh);
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
  els.modalIllustration.innerHTML = renderKuehIllustration(kueh);
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
els.gatchaCta.addEventListener("click", doPull);
els.pullAgainBtn.addEventListener("click", doPull);

els.collectionGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".collection-card[data-kueh-id]");
  if (!card) return;
  const kueh = KUEHS.find((k) => k.id === card.dataset.kuehId);
  if (kueh) openKuehModal(kueh);
});
els.shopGrid.addEventListener("click", (e) => {
  const card = e.target.closest("[data-shop-kueh-id]");
  if (!card) return;
  const kueh = KUEHS.find((item) => item.id === card.dataset.shopKuehId);
  if (kueh) openShopProduct(kueh);
});
els.shopProductClose.addEventListener("click", closeShopProduct);
els.shopProductOverlay.addEventListener("click", (e) => {
  if (e.target === els.shopProductOverlay) closeShopProduct();
});
els.shopProductAdd.addEventListener("click", () => {
  const quantity = Math.max(1, Math.min(9, Number(els.shopProductQuantity.value) || 1));
  shopBag[selectedShopKueh.id] = (shopBag[selectedShopKueh.id] || 0) + quantity;
  renderShopBag();
  els.shopProductAdd.textContent = "Added to bag";
});
els.makersPrev.addEventListener("click", () => moveMakers(-1));
els.makersNext.addEventListener("click", () => moveMakers(1));
els.makersCarousel.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") moveMakers(-1);
  if (e.key === "ArrowRight") moveMakers(1);
});
els.shopBagButton.addEventListener("click", openShopTray);
els.shopTrayClose.addEventListener("click", closeShopTray);
els.shopTrayOverlay.addEventListener("click", (e) => {
  if (e.target === els.shopTrayOverlay) closeShopTray();
  const control = e.target.closest("[data-shop-action]");
  if (!control) return;
  const id = control.dataset.shopKuehId;
  if (control.dataset.shopAction === "increase") shopBag[id] += 1;
  if (control.dataset.shopAction === "decrease") {
    shopBag[id] -= 1;
    if (shopBag[id] <= 0) delete shopBag[id];
  }
  renderShopBag();
});
els.shopCheckoutButton.addEventListener("click", () => {
  els.shopCheckoutButton.textContent = "Coming soon";
  setTimeout(() => { els.shopCheckoutButton.textContent = "Checkout"; }, 1600);
});
els.modalClose.addEventListener("click", closeKuehModal);
els.modalOverlay.addEventListener("click", (e) => {
  if (e.target === els.modalOverlay) closeKuehModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modalOverlay.hidden) closeKuehModal();
  if (e.key === "Escape" && !els.shopProductOverlay.hidden) closeShopProduct();
  if (e.key === "Escape" && !els.shopTrayOverlay.hidden) closeShopTray();
});

/* ------------------------------------------------------------------
   INIT
------------------------------------------------------------------- */
STOP_MOTION_FRAMES.forEach((src) => {
  const image = new Image();
  image.src = src;
});
renderCollection();
renderMakers();
renderShopBag();
