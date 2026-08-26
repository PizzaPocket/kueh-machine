const STORAGE_KEY = "catscan-cats";
const DEFAULT_CENTER = [1.3521, 103.8198];
// Was 15 (one specific neighborhood, disorienting on first load) — 11
// shows the whole island's coastline with comfortable margin in the
// map panel's actual size; checked 10/11/12 directly and 11 was the
// best fit (10 shrinks Singapore to a small shape crowded by Johor/
// Batam, 12 already clips the north and east coastlines at the panel
// edges).
const DEFAULT_ZOOM = 11;

const VIBE_LABELS = {
  friendly: "Friendly",
  diva: "Diva",
  shy: "Shy",
  "food-motivated": "Food-motivated",
  mysterious: "Mysterious",
};

const VIBE_ICONS = {
  friendly: "Smile",
  diva: "Sparkles",
  shy: "EyeOff",
  "food-motivated": "Drumstick",
  mysterious: "VenetianMask",
};

// Renders a Lucide icon (loaded via CDN, see index.html) as an inline SVG
// string. Color is deliberately left to CSS (currentColor) rather than set
// here, so each icon picks up the ink/white/etc. of whatever badge it sits
// inside instead of being hardcoded per call site.
function lucideIcon(name, { size = 20, strokeWidth = 2.5, className = "" } = {}) {
  const el = lucide.createElement(lucide[name], {
    width: size,
    height: size,
    "stroke-width": strokeWidth,
  });
  if (className) el.setAttribute("class", className);
  return el.outerHTML;
}

let cats = loadCats();
let pendingLatLng = null;
let openCatId = null;
let markersLayer;

// Touch/coarse-pointer devices get a higher minimum pin/cluster size so
// zoomed-out markers never shrink below the 44px accessible tap target.
// Mouse/trackpad users keep the smaller floor since precise pointers
// don't need it (matches how Google/Apple Maps behave).
const IS_COARSE_POINTER = window.matchMedia("(pointer: coarse)").matches;
const PIN_MIN_SIZE = IS_COARSE_POINTER ? 44 : 16;
const CLUSTER_MIN_SIZE = IS_COARSE_POINTER ? 44 : 26;

window.map = L.map("map").setView(DEFAULT_CENTER, DEFAULT_ZOOM);
const map = window.map;
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  subdomains: "abcd",
  maxZoom: 20,
}).addTo(map);

markersLayer = L.markerClusterGroup({
  iconCreateFunction: (cluster) => {
    const size = Math.round(Math.max(CLUSTER_MIN_SIZE, Math.min(54, map.getZoom() * 2.9)));
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

// --- Supabase sync (Stage 2) ---
// Read/write cats via the shared account widget's Supabase client when
// someone's signed in, matching the REAL sophia_cats table already live
// on the shared project (created by Leonard — different column names
// than database.sql originally assumed; see database.sql's own comments
// for the full story). Signed out — or any failure at all — always falls
// back to the local-storage path above, unchanged.
//
// New photos are uploaded to the public cat-photos bucket and stored in
// photo_url. The legacy photo column remains readable so existing base64
// rows such as "Whiskers" do not need a risky one-shot migration.

let supabaseUserId = null; // set once signed in AND a sophia_cats read succeeds; null otherwise

// names/sightings on the real table are already { name/note, by, date } —
// the exact same shape every render function in this file expects — so
// unlike an earlier version of this code, no per-item key renaming is
// needed in either direction. This mapper only translates the cat-level
// column names (discovered_by -> discoveredBy, etc.).
function supabaseRowToCat(row) {
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    vibe: row.vibe,
    // New uploads use Storage and photo_url. Keep reading photo so the
    // existing Whiskers row and any other legacy base64 records still work.
    photo: row.photo_url || row.photo || null,
    names: row.names || [],
    sightings: row.sightings || [],
    discoveredBy: row.discovered_by,
    discoveredDate: row.discovered_date,
  };
}

// Runs on load and again on every auth change. Signed-in sessions render
// the shared table; signing out immediately restores the local browser's
// own cats without requiring a reload.
async function syncWithSupabase() {
  if (!window.KuehAccount) return;
  try {
    await window.KuehAccount.ready;
    const session = window.KuehAccount.getSession();
    if (!session) {
      supabaseUserId = null;
      cats = loadCats();
      renderPins();
      renderFeed();
      return;
    }
    const client = window.KuehAccount.getClient();
    const { data, error } = await client.from("sophia_cats").select("*");
    if (error) throw error;
    supabaseUserId = session.user.id;
    cats = (data || []).map(supabaseRowToCat);
    renderPins();
    renderFeed();
  } catch (err) {
    supabaseUserId = null;
    console.warn("[Cat Scan] Supabase sync unavailable, using local storage instead:", err);
  }
}

syncWithSupabase();
if (window.KuehAccount) {
  window.KuehAccount.onAuthStateChange(() => syncWithSupabase());
}

async function uploadPhotoToSupabase(blob) {
  const client = window.KuehAccount.getClient();
  const objectPath = `${supabaseUserId}/${crypto.randomUUID()}.jpg`;
  const { error } = await client.storage.from("cat-photos").upload(objectPath, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return {
    path: objectPath,
    publicUrl: client.storage.from("cat-photos").getPublicUrl(objectPath).data.publicUrl,
  };
}

async function insertCatToSupabase(localCat, photoUrl) {
  try {
    const client = window.KuehAccount.getClient();
    const { data, error } = await client
      .from("sophia_cats")
      .insert({
        // The real "id" column has no default generator — it's NOT NULL
        // with no default, so the client has to supply one. Reusing the
        // same id already generated for localCat (via makeId()) means it
        // stays identical whether this insert succeeds or falls back to
        // local storage, instead of the row having two different ids
        // depending on which path it took.
        id: localCat.id,
        lat: localCat.lat,
        lng: localCat.lng,
        vibe: localCat.vibe,
        photo: null,
        photo_url: photoUrl || null,
        names: localCat.names,
        sightings: localCat.sightings,
        discovered_by: localCat.discoveredBy,
        discovered_date: localCat.discoveredDate,
        user_id: supabaseUserId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return supabaseRowToCat(data);
  } catch (err) {
    console.warn("[Cat Scan] Supabase insert failed, saving locally instead:", err);
    return null;
  }
}

async function appendToCatInSupabase(kind, catId, value, by) {
  try {
    const client = window.KuehAccount.getClient();
    const functionName = kind === "name" ? "sophia_append_name" : "sophia_append_sighting";
    const valueKey = kind === "name" ? "p_name" : "p_note";
    const { data, error } = await client
      .rpc(functionName, { p_cat_id: catId, [valueKey]: value, p_by: by })
      .single();
    if (error) throw error;
    return supabaseRowToCat(data);
  } catch (err) {
    console.warn(`[Cat Scan] Supabase ${kind} append failed, saving locally instead:`, err);
    return null;
  }
}

// Signed-out (or no profile / no display_name yet, e.g. a brand new
// account) all resolve to null here — every caller just leaves the field
// blank in that case, same as today's signed-out behavior.
async function getSignedInDisplayName() {
  if (!window.KuehAccount) return null;
  try {
    await window.KuehAccount.ready;
    const session = window.KuehAccount.getSession();
    if (!session) return null;
    const profile = window.KuehAccount.getProfile();
    return (profile && profile.display_name) || null;
  } catch {
    return null;
  }
}

// Locked, not just pre-filled: signed in means this always shows (and
// enforces) the real account name, so it can't be swapped to someone
// else's or left blank to dodge accountability for what's submitted.
// Signed out unconditionally clears + unlocks, rather than only filling
// an empty field — so a field left locked from an earlier signed-in
// state doesn't linger as stale, still-editable text after signing out.
async function applyAccountNameField(input) {
  const displayName = await getSignedInDisplayName();
  if (displayName) {
    input.value = displayName;
    input.readOnly = true;
  } else {
    input.value = "";
    input.readOnly = false;
  }
}

map.on("click", (e) => {
  pendingLatLng = e.latlng;
  openModal("add-cat-modal");
  applyAccountNameField(document.getElementById("discoverer-name-input"));
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

// Tap the dimmed backdrop to close, same as the X — a second way out if
// the panel content is tall enough to need scrolling.
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal.id);
  });
});

document.getElementById("info-btn").addEventListener("click", () => openModal("info-modal"));

// The account badge's own top offset (15px) and horizontal inset (10px
// under 480px viewport width, 32px at/above it) are hardcoded in mode:
// 'fixed' and aren't exposed through init() — only anchor/size are. Sizing
// it down to the documented minimum keeps its footprint small enough that
// .info-btn (positioned in CSS to sit just to its left, see the
// `right: 82px` / `right: 58px` rules at the end of style.css matching
// this same 480px split) has room without the two overlapping.
if (window.KuehAccount) {
  window.KuehAccount.init({ anchor: "top-right", size: 40 });
}

const vibeSelect = document.getElementById("cat-vibe-input");
const vibeOtherInput = document.getElementById("cat-vibe-other-input");

vibeSelect.addEventListener("change", () => {
  const isOther = vibeSelect.value === "other";
  vibeOtherInput.classList.toggle("hidden", !isOther);
  vibeOtherInput.required = isOther;
  if (isOther) vibeOtherInput.focus();
});

function pinIcon(zoom) {
  const size = Math.round(Math.max(PIN_MIN_SIZE, Math.min(46, zoom * 2.4)));
  return L.divIcon({
    className: "pixel-pin",
    html: lucideIcon("Cat", { size: Math.round(size * 0.6), strokeWidth: 2.5 }),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function renderPins() {
  markersLayer.clearLayers();
  // markersById is const (not reassignable) and was never cleared before —
  // harmless while cats only ever grew, but once the whole array can be
  // swapped out wholesale (signing in/out re-fetches from Supabase), old
  // ids would linger here pointing at markers no longer on the map.
  Object.keys(markersById).forEach((id) => delete markersById[id]);
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
  const openProfile = `map.closePopup(); openCatProfile('${cat.id}');`;
  return `
    <div class="pin-popup">
      <a href="#" class="pin-popup-name" onclick="${openProfile} return false;">${escapeHtml(primaryName)}</a>
      <div class="pin-popup-photo" onclick="${openProfile}">
        ${cat.photo ? `<img src="${cat.photo}" alt="${escapeHtml(primaryName)}">` : lucideIcon("PawPrint", { size: 28, strokeWidth: 2.25, className: "pin-popup-photo-fallback" })}
      </div>
    </div>
  `;
}

document.getElementById("add-cat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!pendingLatLng) return;

  const name = document.getElementById("cat-name-input").value.trim();
  const vibeSelectValue = document.getElementById("cat-vibe-input").value;
  const vibe = vibeSelectValue === "other" ? vibeOtherInput.value.trim() : vibeSelectValue;
  const discoverer = document.getElementById("discoverer-name-input").value.trim();
  const photoFile = document.getElementById("cat-photo-input").files[0];

  const finish = async (photoAsset) => {
    const now = new Date().toISOString();
    const localCat = {
      id: makeId(),
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      vibe,
      photo: photoAsset?.dataUrl || null,
      names: [{ name, by: discoverer, date: now }],
      discoveredBy: discoverer,
      discoveredDate: now,
      sightings: [],
    };

    let uploadedPhoto = null;
    if (supabaseUserId && photoAsset?.blob) {
      try {
        uploadedPhoto = await uploadPhotoToSupabase(photoAsset.blob);
      } catch (err) {
        console.warn("[Cat Scan] Photo upload failed; saving the shared cat without a photo:", err);
        window.alert("The photo could not be uploaded. Cat Scan will save this sighting without it.");
      }
    }

    const remoteCat = supabaseUserId
      ? await insertCatToSupabase(localCat, uploadedPhoto?.publicUrl || null)
      : null;
    if (!remoteCat && uploadedPhoto) {
      // Avoid leaving an unused object behind when the table insert fails.
      const client = window.KuehAccount.getClient();
      const { error: cleanupError } = await client.storage.from("cat-photos").remove([uploadedPhoto.path]);
      if (cleanupError) console.warn("[Cat Scan] Could not clean up an unused photo:", cleanupError);
    }
    const newCat = remoteCat || localCat;
    cats.push(newCat);
    if (!remoteCat) saveCats(); // signed out, or the Supabase write failed — local storage either way
    renderPins();
    renderFeed();
    e.target.reset();
    vibeOtherInput.classList.add("hidden");
    vibeOtherInput.required = false;
    pendingLatLng = null;
    closeModal("add-cat-modal");

    const marker = markersById[newCat.id];
    markersLayer.zoomToShowLayer(marker, () => openCatProfile(newCat.id));
  };

  if (photoFile) {
    resizeImageFile(photoFile)
      .then(finish)
      .catch(() => finish(null));
  } else {
    finish(null);
  }
});

// Mobile camera photos are frequently several MB at full resolution.
// Downscale once, then keep both forms: a Blob for authenticated Storage
// uploads and a data URL for the signed-out local fallback.
function resizeImageFile(file, maxDim = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Could not prepare this photo."));
            return;
          }
          resolve({ blob, dataUrl: canvas.toDataURL("image/jpeg", quality) });
        }, "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openCatProfile(catId) {
  openCatId = catId;
  renderCatProfile();
  openModal("cat-profile-modal");
  applyAccountNameField(document.getElementById("new-name-by-input"));
  applyAccountNameField(document.getElementById("new-sighting-by-input"));
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
    <span class="vibe-tag">${lucideIcon(VIBE_ICONS[cat.vibe] || "Tag", { size: 14, strokeWidth: 2.5, className: "vibe-icon" })}${escapeHtml(VIBE_LABELS[cat.vibe] || cat.vibe)}</span>
    <div class="cat-names">${namesHtml}</div>
    <p class="discovered-by">First spotted by <span class="credit-underline">${escapeHtml(cat.discoveredBy)}</span> on ${formatDate(cat.discoveredDate)}</p>
    <hr>
    <h3>Sightings</h3>
    ${sightingsHtml}
  `;
}

document.getElementById("add-name-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cat = cats.find((c) => c.id === openCatId);
  if (!cat) return;

  const name = document.getElementById("new-name-input").value.trim();
  const by = document.getElementById("new-name-by-input").value.trim();
  const remoteCat = supabaseUserId && (await appendToCatInSupabase("name", cat.id, name, by));
  if (remoteCat) {
    cats[cats.indexOf(cat)] = remoteCat;
  } else {
    cat.names.push({ name, by, date: new Date().toISOString() });
    saveCats();
  }

  renderCatProfile();
  renderFeed();
  e.target.reset();
  applyAccountNameField(document.getElementById("new-name-by-input"));
});

document.getElementById("add-sighting-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cat = cats.find((c) => c.id === openCatId);
  if (!cat) return;

  const note = document.getElementById("new-sighting-input").value.trim();
  const by = document.getElementById("new-sighting-by-input").value.trim();
  const remoteCat = supabaseUserId && (await appendToCatInSupabase("sighting", cat.id, note, by));
  if (remoteCat) {
    cats[cats.indexOf(cat)] = remoteCat;
  } else {
    cat.sightings.push({ note, by, date: new Date().toISOString() });
    saveCats();
  }

  renderCatProfile();
  renderFeed();
  e.target.reset();
  applyAccountNameField(document.getElementById("new-sighting-by-input"));
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
              : lucideIcon("Cat", { size: 20, strokeWidth: 2.25, className: "feed-thumb-fallback" })
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
