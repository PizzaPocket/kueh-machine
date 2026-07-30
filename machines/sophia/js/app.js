const STORAGE_KEY = "catscan-cats";
const DEFAULT_CENTER = [1.3521, 103.8198];
const DEFAULT_ZOOM = 15;

const VIBE_LABELS = {
  friendly: "😺 Friendly",
  diva: "💅 Diva",
  shy: "🙈 Shy",
  "food-motivated": "🍖 Food-motivated",
  mysterious: "🕵️ Mysterious",
};

let cats = loadCats();
let pendingLatLng = null;
let openCatId = null;
let markersLayer;

window.map = L.map("map").setView(DEFAULT_CENTER, DEFAULT_ZOOM);
const map = window.map;
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  subdomains: "abcd",
  maxZoom: 20,
}).addTo(map);

markersLayer = L.markerClusterGroup({
  iconCreateFunction: (cluster) => {
    const size = Math.round(Math.max(26, Math.min(54, map.getZoom() * 2.9)));
    return L.divIcon({
      html: `<div class="pixel-cluster" style="width:${size}px;height:${size}px"><span style="font-size:${Math.round(size * 0.32)}px">${cluster.getChildCount()}</span></div>`,
      className: "",
      iconSize: [size, size],
    });
  },
});
map.addLayer(markersLayer);

const markersById = {};
renderPins();
renderFeed();

map.on("click", (e) => {
  pendingLatLng = e.latlng;
  openModal("add-cat-modal");
});

map.on("zoomend", () => {
  const zoom = map.getZoom();
  Object.values(markersById).forEach((marker) => marker.setIcon(pinIcon(zoom)));
});

function loadCats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

function makeId() {
  return "cat-" + Math.random().toString(36).slice(2, 10);
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

document.querySelectorAll(".close-btn").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

function pinIcon(zoom) {
  const size = Math.round(Math.max(16, Math.min(46, zoom * 2.4)));
  return L.divIcon({
    className: "pixel-pin",
    html: `<span style="font-size:${Math.round(size * 0.55)}px">🐱</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function renderPins() {
  markersLayer.clearLayers();
  const zoom = map.getZoom();
  cats.forEach((cat) => {
    const marker = L.marker([cat.lat, cat.lng], { icon: pinIcon(zoom) });
    marker.bindPopup(pinPopupContent(cat), { maxWidth: 180, minWidth: 150 });
    markersLayer.addLayer(marker);
    markersById[cat.id] = marker;
  });
}

function pinPopupContent(cat) {
  const primaryName = cat.names[0].name;
  return `
    <div class="pin-popup">
      <a href="#" class="pin-popup-name" onclick="map.closePopup(); openCatProfile('${cat.id}'); return false;">${escapeHtml(primaryName)}</a>
      <div class="pin-popup-photo">
        ${cat.photo ? `<img src="${cat.photo}" alt="${escapeHtml(primaryName)}">` : `<span class="pin-popup-photo-fallback">🐾</span>`}
      </div>
    </div>
  `;
}

document.getElementById("add-cat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!pendingLatLng) return;

  const name = document.getElementById("cat-name-input").value.trim();
  const vibe = document.getElementById("cat-vibe-input").value;
  const discoverer = document.getElementById("discoverer-name-input").value.trim();
  const photoFile = document.getElementById("cat-photo-input").files[0];

  const finish = (photoDataUrl) => {
    const now = new Date().toISOString();
    const newCat = {
      id: makeId(),
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      vibe,
      photo: photoDataUrl || null,
      names: [{ name, by: discoverer, date: now }],
      discoveredBy: discoverer,
      discoveredDate: now,
      sightings: [],
    };
    cats.push(newCat);
    saveCats();
    renderPins();
    renderFeed();
    e.target.reset();
    pendingLatLng = null;
    closeModal("add-cat-modal");

    const marker = markersById[newCat.id];
    markersLayer.zoomToShowLayer(marker, () => openCatProfile(newCat.id));
  };

  if (photoFile) {
    const reader = new FileReader();
    reader.onload = () => finish(reader.result);
    reader.readAsDataURL(photoFile);
  } else {
    finish(null);
  }
});

function openCatProfile(catId) {
  openCatId = catId;
  renderCatProfile();
  openModal("cat-profile-modal");
}

function renderCatProfile() {
  const cat = cats.find((c) => c.id === openCatId);
  if (!cat) return;

  const namesHtml = cat.names
    .map(
      (n, i) => `
        <div class="cat-name-block">
          <div class="cat-name-heading${i === 0 ? " cat-name-heading--primary" : ""}">${escapeHtml(n.name)}</div>
          <div class="cat-name-credit">by <span class="credit-underline">${escapeHtml(n.by)}</span></div>
        </div>
      `
    )
    .join("");

  const sightingsHtml = cat.sightings.length
    ? cat.sightings
        .map(
          (s) => `
            <div class="sighting-entry">
              <p class="sighting-quote">"${escapeHtml(s.note)}"</p>
              <p class="sighting-credit">by <span class="credit-underline">${escapeHtml(s.by)}</span>, ${formatDate(s.date)}</p>
            </div>
          `
        )
        .join("")
    : `<p class="sighting-entry sighting-empty">No sightings logged yet.</p>`;

  document.getElementById("cat-profile-content").innerHTML = `
    ${
      cat.photo
        ? `<div class="cat-photo-frame">
             <img class="cat-photo" src="${cat.photo}" alt="Cat photo">
           </div>`
        : ""
    }
    <span class="vibe-tag">${VIBE_LABELS[cat.vibe] || cat.vibe}</span>
    <div class="cat-names">${namesHtml}</div>
    <p class="discovered-by">First spotted by <span class="credit-underline">${escapeHtml(cat.discoveredBy)}</span> on ${formatDate(cat.discoveredDate)}</p>
    <hr>
    <h3>Sightings</h3>
    ${sightingsHtml}
  `;
}

document.getElementById("add-name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const cat = cats.find((c) => c.id === openCatId);
  if (!cat) return;

  const name = document.getElementById("new-name-input").value.trim();
  const by = document.getElementById("new-name-by-input").value.trim();

  cat.names.push({ name, by, date: new Date().toISOString() });
  saveCats();
  renderCatProfile();
  renderFeed();
  e.target.reset();
});

document.getElementById("add-sighting-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const cat = cats.find((c) => c.id === openCatId);
  if (!cat) return;

  const note = document.getElementById("new-sighting-input").value.trim();
  const by = document.getElementById("new-sighting-by-input").value.trim();

  cat.sightings.push({ note, by, date: new Date().toISOString() });
  saveCats();
  renderCatProfile();
  renderFeed();
  e.target.reset();
});

function getRecentActivity() {
  const events = [];

  cats.forEach((cat) => {
    const primaryName = cat.names[0].name;

    events.push({
      catId: cat.id,
      photo: cat.photo,
      date: cat.discoveredDate,
      label: `New cat: <strong>${escapeHtml(primaryName)}</strong>`,
    });

    cat.names.slice(1).forEach((n) => {
      events.push({
        catId: cat.id,
        photo: cat.photo,
        date: n.date,
        label: `<strong>${escapeHtml(primaryName)}</strong> also known as "${escapeHtml(n.name)}"`,
      });
    });

    cat.sightings.forEach((s) => {
      events.push({
        catId: cat.id,
        photo: cat.photo,
        date: s.date,
        label: `<strong>${escapeHtml(primaryName)}</strong> spotted — "${escapeHtml(s.note)}"`,
      });
    });
  });

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events;
}

function renderFeed() {
  const list = document.getElementById("feed-list");
  const events = getRecentActivity().slice(0, 30);

  if (!events.length) {
    list.innerHTML = `<p class="feed-empty">No sightings yet — be the first!</p>`;
    return;
  }

  list.innerHTML = events
    .map(
      (ev) => `
        <li class="feed-item" data-cat-id="${ev.catId}">
          ${
            ev.photo
              ? `<img class="feed-thumb" src="${ev.photo}" alt="">`
              : `<span class="feed-thumb-fallback">🐱</span>`
          }
          <div class="feed-text">${ev.label}</div>
        </li>
      `
    )
    .join("");

  list.querySelectorAll(".feed-item").forEach((item) => {
    item.addEventListener("click", () => {
      const marker = markersById[item.dataset.catId];
      if (!marker) return;
      markersLayer.zoomToShowLayer(marker, () => openCatProfile(item.dataset.catId));
    });
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
