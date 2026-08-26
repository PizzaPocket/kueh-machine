// ---------- Data banks ----------

const KUEH_NAMES = [
  "Kueh Lapis", "Ang Ku Kueh", "Ondeh-Ondeh", "Kueh Salat",
  "Kueh Dadar", "Kueh Bingka", "Kueh Ku", "Kueh Pie Tee",
  "Kueh Talam", "Kueh Lapis Sagu", "Kueh Kosui", "Kueh Ambon",
  "Kueh Bahulu", "Kueh Ketayap"
];

const FACTS = [
  "Kueh is a term used across Southeast Asia for bite-sized snacks and cakes — sweet or savoury.",
  "Ang Ku Kueh gets its name from its mould — 'ang ku' means 'red tortoise'.",
  "Ondeh-Ondeh is filled with liquid palm sugar, so the first bite is always a small surprise.",
  "Kueh Lapis means 'layered cake' — some versions have over 20 thin layers, steamed one at a time.",
  "Many kueh get their green colour from real pandan leaves, not food dye.",
  "Kueh Salat has two layers: a savoury glutinous rice base and a sweet pandan custard top.",
  "Kueh Pie Tee is nicknamed 'top hat' for its crispy, cup-shaped shell."
];

const BEAR_STORY_TEMPLATES = [
  "Today the bear's pick is {kueh} — sold out by 11am, as usual.",
  "The bear recommends the {kueh}. Ask nicely and it might tell you why.",
  "Fresh batch of {kueh} just came out. The bear already ate one.",
  "The bear says the {kueh} is best enjoyed slowly, with tea.",
  "A regular orders {kueh} every single day. The bear knows their name."
];

const ACCENT_COLORS = ["#E8998D", "#8FAE7D", "#E8B96A"];

const PHOTO_SOURCES = {
  "1x1": "./assets/photo-bakery.jpg",
  "4x3": "./assets/photo-cafe-window.jpg"
};

const ICON_IMAGE = "./assets/icon-teddy-heart.png";

const PICKER_IMAGES = {
  story: "./assets/picker-story.png",
  icons: "./assets/picker-icons.png",
  photobook: "./assets/picker-photobook.png",
  build: "./assets/picker-build.png"
};

const KUEH_COLOR_IMAGES = {
  cream: PICKER_IMAGES.story,
  pink: PICKER_IMAGES.icons,
  green: PICKER_IMAGES.photobook,
  purple: PICKER_IMAGES.build
};

const KUEH_COLOR_LABELS = { cream: "Cream", pink: "Pink", green: "Green", purple: "Purple" };

// ---------- Helpers ----------

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

// ---------- Category content renderers ----------

function renderStoryContent() {
  const cards = Array.from({ length: 6 }, () => {
    const useStory = Math.random() < 0.5;
    const text = useStory
      ? pick(BEAR_STORY_TEMPLATES).replace("{kueh}", pick(KUEH_NAMES))
      : pick(FACTS);
    return `<article class="gen-card story-card"><p>${text}</p></article>`;
  }).join("");

  return `
    <div class="category-header">
      <p class="hint">Generate a fresh batch of kueh stories and fun facts.</p>
      <div class="header-actions">
        <button class="refresh-btn" data-action="refresh"><span aria-hidden="true">↻</span> Refresh</button>
      </div>
    </div>
    <section class="output-grid">${cards}</section>`;
}

function renderIconsContent() {
  const tiles = Array.from({ length: 8 }, () => {
    const filename = `teddy-heart-icon-${uid()}.png`;
    return `
      <div class="icon-tile" tabindex="0">
        <div class="icon-tile-inner"><img src="${ICON_IMAGE}" alt="Teddy bear holding a heart icon" class="icon-img"></div>
        <div class="tile-actions">
          <a class="dl-btn" href="${ICON_IMAGE}" download="${filename}">⬇ PNG</a>
          <a class="dl-btn" href="https://vectorizer.ai/" target="_blank" rel="noopener">✎ SVG</a>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="category-header">
      <p class="hint">Choose any icon to download!</p>
      <div class="header-actions">
        <button class="refresh-btn" data-action="refresh"><span aria-hidden="true">↻</span> Refresh</button>
      </div>
    </div>
    <div class="icon-grid">${tiles}</div>`;
}

let currentAspect = "1x1";

function renderPhotobookContent() {
  const cols = currentAspect === "4x3" ? 2 : 3;
  const count = currentAspect === "4x3" ? 4 : 6;
  const src = PHOTO_SOURCES[currentAspect];
  const tiles = Array.from({ length: count }, () => {
    const filename = `kueh-photo-${uid()}.jpg`;
    return `
      <div class="photo-tile">
        <img src="${src}" alt="Placeholder cafe illustration" class="photo-img ratio-${currentAspect}">
        <a class="dl-btn" href="${src}" download="${filename}">⬇ PNG</a>
      </div>`;
  }).join("");

  return `
    <div class="category-header">
      <p class="hint">Choose any image to download!</p>
      <div class="header-actions">
        <select class="aspect-select" id="aspectSelect">
          <option value="1x1" ${currentAspect === "1x1" ? "selected" : ""}>Aspect ratio 1:1</option>
          <option value="4x3" ${currentAspect === "4x3" ? "selected" : ""}>Aspect ratio 4:3</option>
        </select>
        <button class="refresh-btn" data-action="refresh"><span aria-hidden="true">↻</span> Refresh</button>
      </div>
    </div>
    <div class="photo-grid cols-${cols}">${tiles}</div>`;
}

let buildState = { type: "product", image: "kueh", color: "pink", story: "fact" };
let buildResult = null; // { price, storyText } — only rerolled by Make it! / Refresh

function buildField(key, label, options) {
  const opts = options
    .map(([val, text]) => `<option value="${val}" ${buildState[key] === val ? "selected" : ""}>${text}</option>`)
    .join("");
  return `
    <label class="build-field">
      <span class="build-field-label">${label}</span>
      <select class="build-select" data-field="${key}">${opts}</select>
    </label>`;
}

const BUILD_COLOR_SWATCHES = [
  ["cream", "#F3E3C8"],
  ["pink", "#E8998D"],
  ["green", "#8FAE7D"],
  ["purple", "#B497D6"]
];

function buildColorField() {
  const swatches = BUILD_COLOR_SWATCHES.map(
    ([key, hex]) => `<button type="button" class="color-swatch ${buildState.color === key ? "is-active" : ""}" data-field="color" data-value="${key}" style="background:${hex}" aria-label="${KUEH_COLOR_LABELS[key]}"></button>`
  ).join("");
  return `
    <div class="build-field">
      <span class="build-field-label">Color</span>
      <div class="color-swatch-row">${swatches}</div>
    </div>`;
}

function buildStoryText() {
  if (buildState.story === "fact") return pick(FACTS);
  if (buildState.story === "pick") return pick(BEAR_STORY_TEMPLATES).replace("{kueh}", pick(KUEH_NAMES));
  return "";
}

function rollBuildResult() {
  buildResult = {
    price: (1.2 + Math.random() * 3.3).toFixed(2),
    storyText: buildStoryText()
  };
}

function renderBuildContent() {
  const isBear = buildState.image === "bear";
  const isIconType = buildState.type === "icon";

  const imgSrc = isBear ? ICON_IMAGE : KUEH_COLOR_IMAGES[buildState.color];
  const imgAlt = isBear ? "Teddy bear holding a heart icon" : `${KUEH_COLOR_LABELS[buildState.color]} kueh`;
  const name = isBear ? "Beary Charm" : `${KUEH_COLOR_LABELS[buildState.color]} Kueh`;
  const filename = `${name.toLowerCase().replace(/\s+/g, "-")}-${uid()}.png`;

  const fieldParts = [
    buildField("type", "Type of Component", [["product", "Product card"], ["icon", "Icon"]]),
    buildField("image", "Image", [["kueh", "Kueh"], ["bear", "Bear Icon"]])
  ];
  if (!isBear) fieldParts.push(buildColorField());
  if (!isIconType) {
    fieldParts.push(buildField("story", "Story", [["fact", "Beary's fun fact"], ["pick", "Beary's pick"], ["none", "None"]]));
  }
  const fields = fieldParts.join("");

  let previewHtml;
  if (!buildResult) {
    previewHtml = `<p class="build-empty-hint">Click "Make it!" to preview your card.</p>`;
  } else if (isIconType) {
    previewHtml = `
      <div class="icon-tile-inner build-preview-art"><img src="${imgSrc}" alt="${imgAlt}" class="icon-img"></div>
      <div class="build-dl-row">
        <a class="dl-btn build-icon-dl" href="${imgSrc}" download="${filename}">⬇ PNG</a>
        <a class="dl-btn build-icon-dl" href="https://vectorizer.ai/" target="_blank" rel="noopener">✎ SVG</a>
      </div>`;
  } else {
    previewHtml = `
      <article class="gen-card build-preview-card">
        <div class="art"><img src="${imgSrc}" alt="${imgAlt}" class="build-preview-img"></div>
        <div class="build-card-text">
          <h3>${name}</h3>
          <p class="price">$${buildResult.price}</p>
          ${buildResult.storyText ? `<p>${buildResult.storyText}</p>` : ""}
        </div>
        <a class="purchase-btn" href="${imgSrc}" download="${filename}">Purchase</a>
      </article>
      <div class="build-dl-row">
        <a class="dl-btn build-icon-dl" href="${imgSrc}" download="${filename}">⬇ PNG</a>
        <a class="dl-btn build-icon-dl" href="https://vectorizer.ai/" target="_blank" rel="noopener">✎ SVG</a>
      </div>`;
  }

  return `
    <div class="category-header">
      <p class="hint">Create your own product card!</p>
      <div class="header-actions">
        <button class="refresh-btn" data-action="build-refresh"><span aria-hidden="true">↻</span> Refresh</button>
      </div>
    </div>
    <div class="build-layout">
      <div class="build-fields">
        ${fields}
        <button class="generate-btn" id="buildMakeBtn">Make it! 🐻</button>
      </div>
      <div class="build-preview">${previewHtml}</div>
    </div>`;
}

const CATEGORY_RENDERERS = {
  story: renderStoryContent,
  icons: renderIconsContent,
  photobook: renderPhotobookContent,
  build: renderBuildContent
};

// ---------- Navigation: picker <-> detail view ----------

const pickerView = document.getElementById("pickerView");
const detailView = document.getElementById("detailView");
const categoryTabs = document.getElementById("categoryTabs");
const categoryContent = document.getElementById("categoryContent");
let currentCategory = null;

function showCategory(category) {
  currentCategory = category;
  pickerView.hidden = true;
  detailView.hidden = false;
  categoryTabs.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.category === category);
  });
  categoryContent.innerHTML = CATEGORY_RENDERERS[category]();
}

function resetToPicker() {
  currentCategory = null;
  pickerView.hidden = false;
  detailView.hidden = true;
  categoryTabs.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("is-active"));
}

document.querySelectorAll(".picker-card").forEach((card) => {
  card.addEventListener("click", () => showCategory(card.dataset.category));
});

categoryTabs.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => showCategory(btn.dataset.category));
});

document.getElementById("homeBtn").addEventListener("click", resetToPicker);

// Populate the picker screen's preview art
document.getElementById("pickerArtStory").innerHTML = `<img src="${PICKER_IMAGES.story}" alt="Kueh with a bite taken out">`;
document.getElementById("pickerArtIcons").innerHTML = `<img src="${PICKER_IMAGES.icons}" alt="Pink flower-shaped kueh">`;
document.getElementById("pickerArtPhotobook").innerHTML = `<img src="${PICKER_IMAGES.photobook}" alt="Pandan kueh with a bite taken out">`;
document.getElementById("pickerArtBuild").innerHTML = `<img src="${PICKER_IMAGES.build}" alt="Purple layered kueh block">`;

// ---------- Interactions inside the detail view ----------

categoryContent.addEventListener("click", (e) => {
  const refreshBtn = e.target.closest(".refresh-btn");
  if (refreshBtn) {
    if (currentCategory === "build") {
      rollBuildResult();
      categoryContent.innerHTML = renderBuildContent();
    } else {
      categoryContent.innerHTML = CATEGORY_RENDERERS[currentCategory]();
    }
    return;
  }

  if (e.target.closest("#buildMakeBtn")) {
    rollBuildResult();
    categoryContent.innerHTML = renderBuildContent();
    return;
  }

  const swatch = e.target.closest(".color-swatch");
  if (swatch && !swatch.disabled) {
    buildState.color = swatch.dataset.value;
    categoryContent.innerHTML = renderBuildContent();
  }
});

categoryContent.addEventListener("change", (e) => {
  if (e.target.id === "aspectSelect") {
    currentAspect = e.target.value;
    categoryContent.innerHTML = renderPhotobookContent();
    return;
  }

  if (e.target.classList.contains("build-select")) {
    const field = e.target.dataset.field;
    buildState[field] = e.target.value;
    if (field === "story" && buildResult) {
      buildResult.storyText = buildStoryText();
    }
    categoryContent.innerHTML = renderBuildContent();
  }
});

// ---------- Bottom sheet ----------

const heroCta = document.getElementById("heroCta");
const bottomSheet = document.getElementById("bottomSheet");
const sheetBackdrop = document.getElementById("sheetBackdrop");
const sheetClose = document.getElementById("sheetClose");

function openSheet() {
  resetToPicker();
  bottomSheet.classList.add("is-open");
  sheetBackdrop.classList.add("is-open");
  bottomSheet.setAttribute("aria-hidden", "false");
}

function closeSheet() {
  bottomSheet.classList.remove("is-open");
  sheetBackdrop.classList.remove("is-open");
  bottomSheet.setAttribute("aria-hidden", "true");
}

heroCta.addEventListener("click", openSheet);
sheetClose.addEventListener("click", closeSheet);
sheetBackdrop.addEventListener("click", closeSheet);
