/* Care Island — state, onboarding, and island rendering */

const STORAGE_HABITS = "ci_habits";
const STORAGE_ONBOARDED = "ci_onboarded";

const BUILTIN_DEFS = {
  water: { icon: "💧", name: "Water", unit: "L", defaultGoal: 2, step: 0.5, min: 0.5,
    sipMl: 50, glassOptions: [100, 250, 500] },
  exercise: { icon: "🏃", name: "Exercise", unit: "min", defaultGoal: 20, step: 5, min: 5,
    levels: [{ label: "Quick", frac: 0.3 }, { label: "Full", frac: 1 }] },
  walk: { icon: "🚶", name: "Walk", unit: "min", defaultGoal: 10, step: 5, min: 5,
    levels: [{ label: "Short", frac: 0.3 }, { label: "Long", frac: 1 }] }
};

function defaultHabitState() {
  return {
    water: { included: true, goal: BUILTIN_DEFS.water.defaultGoal },
    exercise: { included: true, goal: BUILTIN_DEFS.exercise.defaultGoal },
    walk: { included: true, goal: BUILTIN_DEFS.walk.defaultGoal },
    custom: []
  };
}

function loadHabits() {
  const raw = localStorage.getItem(STORAGE_HABITS);
  return raw ? JSON.parse(raw) : defaultHabitState();
}

function saveHabits(state) {
  localStorage.setItem(STORAGE_HABITS, JSON.stringify(state));
  pushStateToServer();
}

function activeHabitCount(state) {
  const builtinCount = ["water", "exercise", "walk"].filter((k) => state[k].included).length;
  return builtinCount + state.custom.length;
}

/* ---------- shared habit editor (used by onboarding + settings) ---------- */

function renderHabitEditor(container, state, onChange) {
  container.innerHTML = "";

  ["water", "exercise", "walk"].forEach((key) => {
    const def = BUILTIN_DEFS[key];
    const row = document.createElement("div");
    row.className = "goal-row";
    row.innerHTML = `
      <label class="goal-toggle">
        <input type="checkbox" ${state[key].included ? "checked" : ""}>
        <span>${def.icon} ${def.name}</span>
      </label>
      <div class="goal-input">
        <input type="number" min="${def.min}" step="${def.step}" value="${state[key].goal}">
        <span class="unit">${def.unit} / day</span>
      </div>`;
    const checkbox = row.querySelector('input[type="checkbox"]');
    const goalInput = row.querySelector('input[type="number"]');
    checkbox.addEventListener("change", () => {
      state[key].included = checkbox.checked;
      row.classList.toggle("dim", !checkbox.checked);
      onChange();
    });
    goalInput.addEventListener("input", () => {
      const v = parseFloat(goalInput.value);
      if (!isNaN(v) && v > 0) state[key].goal = v;
    });
    container.appendChild(row);
  });

  const customHeading = document.createElement("h2");
  customHeading.textContent = "Your own habits";
  customHeading.style.marginTop = "20px";
  customHeading.style.fontSize = "1.15rem";
  container.appendChild(customHeading);

  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent = "Simple tap-to-log, no levels.";
  container.appendChild(hint);

  const list = document.createElement("div");
  list.id = "custom-habit-list";
  container.appendChild(list);

  function renderCustomList() {
    list.innerHTML = "";
    state.custom.forEach((h) => {
      const item = document.createElement("div");
      item.className = "custom-habit-item";
      item.innerHTML = `<span>${h.icon} ${h.name}</span><button type="button" aria-label="Remove">✕</button>`;
      item.querySelector("button").addEventListener("click", () => {
        state.custom = state.custom.filter((c) => c.id !== h.id);
        renderCustomList();
        onChange();
      });
      list.appendChild(item);
    });
  }
  renderCustomList();

  const form = document.createElement("form");
  form.id = "custom-habit-form";
  form.innerHTML = `
    <select>
      <option value="💊">💊 Vitamin</option>
      <option value="🦠">🦠 Probiotic</option>
      <option value="📓">📓 Journal</option>
      <option value="🍳">🍳 Cook</option>
      <option value="📖">📖 Read</option>
      <option value="🧘">🧘 Stretch</option>
      <option value="😴">😴 Sleep early</option>
      <option value="✨">✨ Other</option>
    </select>
    <input type="text" placeholder="Name this habit" maxlength="24">
    <button type="submit">Add</button>`;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const select = form.querySelector("select");
    const nameInput = form.querySelector("input[type='text']");
    const name = nameInput.value.trim();
    if (!name) return;
    state.custom.push({ id: "custom-" + Date.now() + "-" + Math.floor(Math.random() * 1000), icon: select.value, name });
    nameInput.value = "";
    renderCustomList();
    onChange();
  });
  container.appendChild(form);
}

/* ---------- date / scene helpers ---------- */

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function todayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function progressStorageKey(date) {
  return "ci_progress_" + todayKey(date);
}

function loadTodayProgress(date) {
  const raw = localStorage.getItem(progressStorageKey(date));
  return raw ? JSON.parse(raw) : {};
}

function saveTodayProgress(date, progress) {
  localStorage.setItem(progressStorageKey(date), JSON.stringify(progress));
  pushStateToServer();
}

function tierForPercent(pct) {
  if (pct <= 0) return 0;
  if (pct < 34) return 1;
  if (pct < 67) return 2;
  if (pct < 100) return 3;
  return 4;
}

/* ---------- water: cumulative ml log ----------
   Every tap adds to the running total — Sip always +50ml, Glass adds
   whichever size was picked. Modeled as an ordered log so "undo" is just
   "drop the last entry," whichever type it was. */

function waterLogTotalMl(entry) {
  if (!entry || !entry.log) return 0;
  return entry.log.reduce((total, e) => {
    if (e.type === "sip") return total + BUILTIN_DEFS.water.sipMl;
    if (e.type === "glass") return total + e.ml;
    return total;
  }, 0);
}

function waterFracToday() {
  const goalMl = habitState.water.goal * 1000;
  if (goalMl <= 0) return 0;
  return Math.min(waterLogTotalMl(todayProgress.water) / goalMl, 1);
}

/* ---------- app state ---------- */

let habitState = loadHabits();
let today = new Date();
let todayProgress = loadTodayProgress(today);
let waterPickerOpen = false;

// ── Account sync (shared/account-widget.js) ─────────────────────────
// localStorage (STORAGE_HABITS/ci_progress_<date>, above) stays the
// source of truth for guests and for the first paint on every load —
// this only adds a Supabase copy on top when signed in, synced to
// natalia_progress (supabase/migrations/0004_natalia_progress.sql).
// progressByDay isn't read by any UI yet (there's no history view, just
// today's island) — the data's there for one to be built later, same
// spirit as Ken's/Amy's collection tracking.
let progressByDay = {};

function pushStateToServer() {
  const user = window.KuehAccount.getUser();
  if (!user) return; // guest — localStorage above is already the whole story
  progressByDay[todayKey(today)] = todayProgress;
  window.KuehAccount.ready.then((client) =>
    client.from("natalia_progress").upsert({
      user_id: user.id,
      data: { habits: habitState, progress: progressByDay },
      updated_at: new Date().toISOString()
    })
  ).catch((e) => console.warn("[natalia] sync failed:", e));
}

function syncStateFromServer() {
  const user = window.KuehAccount.getUser();
  if (!user) return;
  window.KuehAccount.ready
    .then((client) => client.from("natalia_progress").select("data").eq("user_id", user.id).maybeSingle())
    .then((res) => {
      const server = (res && res.data && res.data.data) || {};
      const serverProgress = server.progress || {};
      let changed = false;

      // Past days: adopt anything the server has that this browser
      // doesn't already have its own record of — never overwrites a day
      // this browser already logged itself.
      Object.keys(serverProgress).forEach((dateKey) => {
        if (dateKey === todayKey(today)) return;
        if (!(dateKey in progressByDay)) progressByDay[dateKey] = serverProgress[dateKey];
      });

      // Today is live on screen right now — only adopt the server's copy
      // if this browser hasn't logged anything today itself, so a real
      // local session in progress can never get clobbered by an older
      // server snapshot.
      const localTodayEmpty = Object.keys(todayProgress).length === 0;
      if (localTodayEmpty && serverProgress[todayKey(today)]) {
        todayProgress = serverProgress[todayKey(today)];
        localStorage.setItem(progressStorageKey(today), JSON.stringify(todayProgress));
        changed = true;
      }

      if (changed) renderIsland();
      pushStateToServer();
    })
    .catch((e) => console.warn("[natalia] fetch failed:", e));
}

window.KuehAccount.ready.then(() => {
  if (window.KuehAccount.getUser()) syncStateFromServer();
});
window.KuehAccount.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") syncStateFromServer();
});

function allHabitsList() {
  const list = [];
  if (habitState.water.included) {
    list.push({ id: "water", icon: BUILTIN_DEFS.water.icon, name: BUILTIN_DEFS.water.name, type: "water" });
  }
  ["exercise", "walk"].forEach((key) => {
    if (habitState[key].included) {
      list.push({ id: key, icon: BUILTIN_DEFS[key].icon, name: BUILTIN_DEFS[key].name, type: "levels", levels: BUILTIN_DEFS[key].levels });
    }
  });
  habitState.custom.forEach((h) => {
    list.push({ id: h.id, icon: h.icon, name: h.name, type: "levels", levels: [{ label: "Done", frac: 1 }] });
  });
  return list;
}

function computePercent() {
  const list = allHabitsList();
  if (list.length === 0) return 0;
  const sum = list.reduce((acc, h) => {
    if (h.type === "water") return acc + waterFracToday();
    return acc + (todayProgress[h.id]?.frac || 0);
  }, 0);
  return Math.round((sum / list.length) * 100);
}

/* ---------- rendering: island ---------- */

const sceneFullbg = document.getElementById("scene-fullbg");
const wisdomPanel = document.getElementById("wisdom-panel");
const wisdomText = document.getElementById("wisdom-text");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const habitIconsEl = document.getElementById("habit-icons");

const sheetBackdrop = document.getElementById("sheet-backdrop");
const habitSheet = document.getElementById("habit-sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetBody = document.getElementById("sheet-body");
const sheetUndoBtn = document.getElementById("sheet-undo-btn");
const sheetDoneBtn = document.getElementById("sheet-done-btn");

let openSheetHabitId = null;

function habitFrac(h) {
  return h.type === "water" ? waterFracToday() : (todayProgress[h.id]?.frac || 0);
}

function renderIsland() {
  const list = allHabitsList();
  const pct = computePercent();
  const tier = tierForPercent(pct);

  sceneFullbg.innerHTML = renderMeadowScene(pct);

  progressFill.style.width = pct + "%";
  progressLabel.textContent = pct + "%";

  if (tier === 4) {
    const w = pickWisdom(dayOfYear(today));
    wisdomText.textContent = w.text;
    wisdomPanel.classList.remove("hidden");
  } else {
    wisdomPanel.classList.add("hidden");
  }

  habitIconsEl.innerHTML = "";
  list.forEach((h) => {
    const wrap = document.createElement("div");
    wrap.className = "habit-icon-wrap";
    wrap.style.setProperty("--frac", habitFrac(h));
    wrap.innerHTML = `<button class="habit-icon-btn" aria-label="${h.name}">${h.icon}</button>`;
    wrap.querySelector("button").addEventListener("click", () => openSheet(h.id));
    habitIconsEl.appendChild(wrap);
  });

  // Keep an open sheet live as taps land (e.g. the scene/progress updating behind it).
  if (openSheetHabitId) {
    const h = list.find((x) => x.id === openSheetHabitId);
    if (h) renderSheetBody(h);
    else closeSheet();
  }
}

/* ---------- habit bottom sheet ---------- */

function openSheet(habitId) {
  const h = allHabitsList().find((x) => x.id === habitId);
  if (!h) return;
  openSheetHabitId = habitId;
  sheetTitle.textContent = `${h.icon} ${h.name}`;
  renderSheetBody(h);
  habitSheet.classList.add("open");
  sheetBackdrop.classList.add("open");
}

function closeSheet() {
  openSheetHabitId = null;
  habitSheet.classList.remove("open");
  sheetBackdrop.classList.remove("open");
}

function renderSheetBody(h) {
  if (h.type === "water") buildWaterSheet(h);
  else buildLevelSheet(h);
}

function buildLevelSheet(h) {
  const entry = todayProgress[h.id];
  sheetBody.innerHTML = `
    <p class="sheet-subtitle">${entry ? Math.round(entry.frac * 100) : 0}% logged today</p>
    <div class="level-buttons"></div>`;
  const wrap = sheetBody.querySelector(".level-buttons");
  h.levels.forEach((lvl, idx) => {
    const btn = document.createElement("button");
    btn.className = "level-btn" + (h.levels.length === 1 ? " tap-btn" : "");
    btn.textContent = lvl.label;
    const isActive = entry && entry.levelIndex === idx;
    if (isActive) btn.classList.add("active");
    btn.addEventListener("click", () => {
      if (isActive) {
        delete todayProgress[h.id];
      } else {
        todayProgress[h.id] = { frac: lvl.frac, levelIndex: idx };
      }
      saveTodayProgress(today, todayProgress);
      renderIsland();
    });
    wrap.appendChild(btn);
  });

  sheetUndoBtn.disabled = !entry;
  sheetUndoBtn.onclick = () => {
    if (!todayProgress[h.id]) return;
    delete todayProgress[h.id];
    saveTodayProgress(today, todayProgress);
    renderIsland();
  };
}

function buildWaterSheet(h) {
  const entry = todayProgress.water;
  const log = entry?.log || [];
  const totalMl = waterLogTotalMl(entry);
  const goalMl = habitState.water.goal * 1000;

  sheetBody.innerHTML = `
    <p class="sheet-subtitle">${totalMl} / ${goalMl} ml</p>
    <div class="water-controls">
      <button class="level-btn" id="water-sip-btn">Sip · 50ml</button>
      <button class="level-btn" id="water-glass-btn">Glass</button>
    </div>
    <div class="glass-picker ${waterPickerOpen ? "" : "hidden"}">
      ${BUILTIN_DEFS.water.glassOptions.map((ml) => `<button class="level-btn glass-option" data-ml="${ml}">${ml}ml</button>`).join("")}
    </div>`;

  function logAndRerender(entryEvent) {
    if (!todayProgress.water) todayProgress.water = { log: [] };
    todayProgress.water.log.push(entryEvent);
    saveTodayProgress(today, todayProgress);
    renderIsland();
  }

  sheetBody.querySelector("#water-sip-btn").addEventListener("click", () => {
    logAndRerender({ type: "sip" });
  });

  sheetBody.querySelector("#water-glass-btn").addEventListener("click", () => {
    waterPickerOpen = !waterPickerOpen;
    renderIsland();
  });

  sheetBody.querySelectorAll(".glass-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      waterPickerOpen = false;
      logAndRerender({ type: "glass", ml: parseInt(btn.dataset.ml, 10) });
    });
  });

  sheetUndoBtn.disabled = log.length === 0;
  sheetUndoBtn.onclick = () => {
    if (!todayProgress.water || todayProgress.water.log.length === 0) return;
    todayProgress.water.log.pop();
    saveTodayProgress(today, todayProgress);
    renderIsland();
  };
}

sheetDoneBtn.addEventListener("click", closeSheet);
sheetBackdrop.addEventListener("click", closeSheet);

/* ---------- screen switching ---------- */

const screens = {
  onboarding: document.getElementById("onboarding"),
  island: document.getElementById("island"),
  settings: document.getElementById("settings")
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

/* ---------- onboarding wiring ---------- */

const onboardEditor = document.getElementById("onboard-editor");
const beginBtn = document.getElementById("begin-btn");
const countWarning = document.getElementById("habit-count-warning");

function refreshOnboardValidity() {
  const count = activeHabitCount(habitState);
  const ok = count >= 3;
  beginBtn.disabled = !ok;
  countWarning.classList.toggle("hidden", ok);
}

renderHabitEditor(onboardEditor, habitState, refreshOnboardValidity);
refreshOnboardValidity();

beginBtn.addEventListener("click", () => {
  if (activeHabitCount(habitState) < 3) return;
  saveHabits(habitState);
  localStorage.setItem(STORAGE_ONBOARDED, "true");
  today = new Date();
  todayProgress = loadTodayProgress(today);
  showScreen("island");
  renderIsland();
});

/* ---------- settings wiring ---------- */

const settingsEditor = document.getElementById("settings-editor");
const settingsBtn = document.getElementById("settings-btn");
const settingsDoneBtn = document.getElementById("settings-done-btn");

settingsBtn.addEventListener("click", () => {
  renderHabitEditor(settingsEditor, habitState, () => {});
  showScreen("settings");
});

settingsDoneBtn.addEventListener("click", () => {
  saveHabits(habitState);
  showScreen("island");
  renderIsland();
});

/* ---------- boot ---------- */

if (localStorage.getItem(STORAGE_ONBOARDED) === "true" && activeHabitCount(habitState) >= 3) {
  showScreen("island");
  renderIsland();
} else {
  showScreen("onboarding");
}
