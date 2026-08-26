/* Kueh Lupis — water tracker, single habit.
   Visual design ported from the Claude Design Canvas handoff in
   "water intake/" (Kueh Water Tracker.dc.html + Organic design system).
   That file isn't runnable here (proprietary {{ }} templating + a JSX
   device-frame runtime) — this is a hand translation of its exact
   values into plain HTML/CSS/JS, adjusted per Natalia's review:
   bespoke per-stage transitions kept (not the prototype's uniform
   crossfade), fun-fact card instead of the "tomorrow's kueh" card,
   free-entry goal + two quick pills instead of five preset pills,
   Cabinet/rotation deferred (no assets yet).

   Cumulative ml logged today drives which of 6 stages is showing
   (goal split into 6 equal shares). Tap anywhere on the kueh screen
   (no icon) opens the log sheet. Every stage transition walks through
   every intermediate stage in order — asset list trimmed to just
   1, 2b, 3, 4, 5b, 6b, 6c per Natalia's call (no separate "before"
   stills for the video stages):
     2 (rice on leaf -> folded) — cuts straight into the fold-motion
       video, no static pre-roll. Rests on the video's own last frame.
     3 (folded) — snappy crossfade (no video for this one).
     4 (tied) — simple crossfade.
     5 (boiling) — cuts straight into the boiling-motion video, rests
       on its last frame + looping bob/steam ambient on top.
     6 (served) — the drizzle-motion video plays straight from
       whatever's already showing, then settles on the finished plate
       + fact card. Known gap: this video's own first frame doesn't
       actually match what it's cutting from — flagged to Natalia,
       she said ship it as-is and revisit the clip later.
   Cold page-loads (e.g. a reload mid-stage) show the same frozen last
   frame as a paused, seeked video rather than autoplaying on every
   visit — only a live transition actually plays a clip.
   Resets to stage 1 every day via the date key. */

const STORAGE_GOAL = "kl_goal";
const STORAGE_PROGRESS = "kl_progress"; // keyed by date inside the stored object
const STORAGE_PROFILE = "kl_profile"; // sex/activity/weight/height, feeds the goal calculator
const STORAGE_HISTORY = "kl_history"; // { "YYYY-MM-DD": totalMl }, mirrored from today's log on every save
const STORAGE_FIRST_USE = "kl_first_use"; // date key of the first day the app was ever opened
const MAX_LOG_ML = 250; // per-log cap (Natalia's explicit call, overrides the prototype's 700ml demo default)
const STAGE_COUNT = 6;
const HOUR_BAR_MAX_ML = 500; // fixed scale for the Day view's hourly chart, not auto-scaled to the day's own max

const ASSETS = {
  riceBowl: "./assets/lupis/rice-bowl.jpg",
  foldMotion: "./assets/lupis/fold-motion.mp4",
  leafFullFold: "./assets/lupis/leaf-full-fold.jpg",
  parcelTied: "./assets/lupis/parcel-tied.jpg",
  boilingMotion: "./assets/lupis/boiling-motion.mp4",
  drizzleMotion: "./assets/lupis/drizzle-motion.mp4",
  lupisFinished: "./assets/lupis/lupis-finished.jpg"
};

const STAGE_IMAGE = [null, ASSETS.riceBowl, null, ASSETS.leafFullFold, ASSETS.parcelTied, null, ASSETS.lupisFinished];
const STAGE_NAMES = [null,
  "Rice, rinsed and soaked",
  "Rice on the leaf",
  "Folded into shape",
  "Tied up tight",
  "Boiling in the pot",
  "Coconut and gula melaka"
];
const AUNTIE_LINES = [null,
  "Rice still soaking. Drink one glass, we start.",
  "Rice on the leaf already. Watch it fold, ah.",
  "Folded up nice. Halfway there.",
  "Tied tight. Next stop, the pot.",
  "Boiling! Almost, almost. Wait ah.",
  "Wah! Coconut, gula melaka, done. Go share."
];

// Goal calculator: weight-driven baseline + a small height adjustment + sex/activity
// bonuses. Not medical advice — a light, explainable formula, tuned so the calculator's
// own default profile (female / sitting / 60kg / 162cm) lands on a clean 1,850ml/day,
// matching the design handoff's example screens.
const GOAL_ML_PER_KG = 30;
const GOAL_HEIGHT_BASE_CM = 150;
const GOAL_ML_PER_CM_OVER_BASE = 4;
const GOAL_MALE_BONUS_ML = 250;
const GOAL_ACTIVE_BONUS_ML = 450;

const PROFILE_DEFAULTS = { sex: "female", activity: "sitting", weightKg: 60, heightCm: 162 };
const WEIGHT_MIN = 35, WEIGHT_MAX = 140;
const HEIGHT_MIN = 130, HEIGHT_MAX = 210;

function calcGoal({ sex, activity, weightKg, heightCm }) {
  let ml = weightKg * GOAL_ML_PER_KG;
  if (heightCm > GOAL_HEIGHT_BASE_CM) ml += (heightCm - GOAL_HEIGHT_BASE_CM) * GOAL_ML_PER_CM_OVER_BASE;
  if (sex === "male") ml += GOAL_MALE_BONUS_ML;
  if (activity === "active") ml += GOAL_ACTIVE_BONUS_ML;
  return Math.round(ml / 10) * 10;
}

// Today's advice, shown on Home under the ml counter as "Oh ya—<line>" (prefix added at
// render time in renderHomeAdvice). Keyed by activity from the Goal screen's profile.
// Lines start lowercase since they always continue the fixed "Oh ya—" prefix. Toned down
// from the earlier heavier Singlish draft per Natalia's call — light, not laid on thick.
const AUNTIE_TIPS = {
  sitting: [
    "aircon room dries you out fast. Keep a bottle close by.",
    "sitting all day still needs water — don't wait till you're thirsty."
  ],
  active: [
    "hot and moving today? Top up a bit more than usual.",
    "the more you sweat, the more you need to replace."
  ]
};

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const fmtL = (ml) => (ml / 1000).toFixed(1) + "L";

/* ---------- date / storage ---------- */

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Day count since the app was first opened on this device — shown beside "Today's kueh"
// as a small gamified marker (e.g. "Day 12"). Unrelated to the kueh's own daily reset.
function dayNumber() {
  let first = localStorage.getItem(STORAGE_FIRST_USE);
  if (!first) {
    first = todayKey();
    localStorage.setItem(STORAGE_FIRST_USE, first);
  }
  const [fy, fm, fd] = first.split("-").map(Number);
  const firstDate = new Date(fy, fm - 1, fd);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now - firstDate) / 86400000) + 1;
}

function loadGoal() {
  const raw = localStorage.getItem(STORAGE_GOAL);
  return raw ? parseInt(raw, 10) : 2000;
}
function saveGoal(ml) {
  localStorage.setItem(STORAGE_GOAL, String(ml));
  scheduleStatePush();
}

// Whether the goal has ever been explicitly saved (vs. just defaulting to 2000) — drives
// the goal screen's "first time" vs "adjust" copy.
function hasSavedGoal() {
  return localStorage.getItem(STORAGE_GOAL) !== null;
}

function loadProfile() {
  const raw = localStorage.getItem(STORAGE_PROFILE);
  return raw ? { ...PROFILE_DEFAULTS, ...JSON.parse(raw) } : { ...PROFILE_DEFAULTS };
}
function saveProfile(p) {
  localStorage.setItem(STORAGE_PROFILE, JSON.stringify(p));
  scheduleStatePush();
}

function loadToday() {
  // Dev/testing convenience: ?reset=1 clears today's progress without needing devtools.
  if (new URLSearchParams(location.search).get("reset") === "1") {
    localStorage.removeItem(STORAGE_PROGRESS);
  }
  const raw = localStorage.getItem(STORAGE_PROGRESS);
  if (raw) {
    const data = JSON.parse(raw);
    if (data.date === todayKey()) return data;
  }
  return { date: todayKey(), logs: [], stage: 1 }; // stale or missing -> fresh day, stage resets to 1
}
function saveToday(data) {
  localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(data));
  syncHistory(data.date, totalMl(data));
  scheduleStatePush();
}

/* ---------- history (Day/Week/Month views) ----------
   A flat { "YYYY-MM-DD": totalMl } map, mirrored from today's running total on every
   save so Week/Month can read past AND in-progress-today totals from one place. Not
   pruned — at a few bytes per day this stays tiny for years. */

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_HISTORY);
  return raw ? JSON.parse(raw) : {};
}
function syncHistory(dateKey, totalForDate) {
  const history = loadHistory();
  history[dateKey] = totalForDate;
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
}
function historyTotalFor(dateKey) {
  if (dateKey === todayKey()) return totalMl(today);
  const history = loadHistory();
  return history[dateKey] || 0;
}

/* ---------- stage math ----------
   Stage 1 (start) is always ml<=0, stage 6 (finished) is always ml>=goal
   exactly — it should never appear early. The 4 stages in between
   (2/3/4/5) split the space evenly. */

const MID_STAGE_COUNT = STAGE_COUNT - 2; // 4: stages 2,3,4,5

function totalMl(t) {
  return t.logs.reduce((sum, l) => sum + l.ml, 0);
}
// The ml value at which `stage` begins.
function stageBoundaryMl(stage, goalMl) {
  if (stage <= 1) return 0;
  if (stage >= STAGE_COUNT) return goalMl;
  return ((stage - 2) / MID_STAGE_COUNT) * goalMl;
}
function stageForMl(ml, goalMl) {
  if (ml >= goalMl) return STAGE_COUNT; // finished stage only at true completion
  if (ml <= 0) return 1;
  for (let s = STAGE_COUNT - 1; s >= 2; s--) {
    if (ml >= stageBoundaryMl(s, goalMl)) return s;
  }
  return 1;
}

/* ---------- state ---------- */

let goal = loadGoal();
let today = loadToday();

/* ---------- universal account sync ---------- */

let accountSyncTimer = null;

function accountStateSnapshot() {
  return {
    kind: "drink-lah",
    goal,
    profile,
    today,
    history: loadHistory(),
    firstUse: localStorage.getItem(STORAGE_FIRST_USE)
  };
}

function pushStateToServer() {
  const user = window.KuehAccount.getUser();
  if (!user) return;

  window.KuehAccount.ready
    .then((client) => client.from("natalia_progress").upsert({
      user_id: user.id,
      data: accountStateSnapshot(),
      updated_at: new Date().toISOString()
    }))
    .catch((error) => console.warn("[natalia] sync failed:", error));
}

function scheduleStatePush() {
  window.clearTimeout(accountSyncTimer);
  accountSyncTimer = window.setTimeout(pushStateToServer, 250);
}

function syncStateFromServer() {
  const user = window.KuehAccount.getUser();
  if (!user) return;

  window.KuehAccount.ready
    .then((client) => client
      .from("natalia_progress")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle())
    .then((result) => {
      const server = result && result.data && result.data.data;

      // An older Care Island save may still occupy this row. It belongs to
      // a different app/state shape, so replace it instead of misreading it.
      if (!server || server.kind !== "drink-lah") {
        pushStateToServer();
        return;
      }

      if (localStorage.getItem(STORAGE_GOAL) === null && Number.isFinite(server.goal)) {
        goal = server.goal;
        localStorage.setItem(STORAGE_GOAL, String(goal));
      }
      if (localStorage.getItem(STORAGE_PROFILE) === null && server.profile) {
        profile = { ...PROFILE_DEFAULTS, ...server.profile };
        localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
      }

      const localHistory = loadHistory();
      Object.entries(server.history || {}).forEach(([date, total]) => {
        localHistory[date] = Math.max(localHistory[date] || 0, Number(total) || 0);
      });

      const serverToday = server.today;
      if (
        serverToday &&
        serverToday.date === todayKey() &&
        totalMl(serverToday) > totalMl(today)
      ) {
        today = serverToday;
        localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(today));
      }
      localHistory[today.date] = Math.max(localHistory[today.date] || 0, totalMl(today));
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify(localHistory));

      const localFirstUse = localStorage.getItem(STORAGE_FIRST_USE);
      if (server.firstUse && (!localFirstUse || server.firstUse < localFirstUse)) {
        localStorage.setItem(STORAGE_FIRST_USE, server.firstUse);
      }

      renderProgress();
      renderRestingStage(today.stage);
      renderHomeAdvice();
      pushStateToServer();
    })
    .catch((error) => console.warn("[natalia] fetch failed:", error));
}

window.KuehAccount.ready.then(() => {
  if (window.KuehAccount.getUser()) syncStateFromServer();
});
window.KuehAccount.onAuthStateChange((event) => {
  if (event === "SIGNED_IN") syncStateFromServer();
});

/* ---------- DOM ---------- */

const kuehScreen = document.getElementById("kueh-screen");
const historyScreen = document.getElementById("history-screen");
const goalScreen = document.getElementById("goal-screen");
const tabBar = document.getElementById("tab-bar");
const tabBtns = document.querySelectorAll(".tab-btn");

const waterWash = document.getElementById("water-wash");
const sceneStage = document.getElementById("scene-stage");
const tapLayer = document.getElementById("tap-layer");
const auntieLine = document.getElementById("auntie-line");
const stageChip = document.getElementById("stage-chip");
const factCard = document.getElementById("fact-card");
const factText = document.getElementById("fact-text");
const toast = document.getElementById("toast");
const mlLabel = document.getElementById("ml-label");
const goalLabel = document.getElementById("goal-label");

const sheetBackdrop = document.getElementById("sheet-backdrop");
const waterSheet = document.getElementById("water-sheet");
const glassTrack = document.getElementById("glass-track");
const glassFill = document.getElementById("glass-fill");
const tickColumn = document.getElementById("tick-column");
const draftLabel = document.getElementById("draft-label");
const sizeHint = document.getElementById("size-hint");
const impactText = document.getElementById("impact-text");
const sheetLaterBtn = document.getElementById("sheet-later-btn");
const sheetConfirmBtn = document.getElementById("sheet-confirm-btn");

/* ---------- scene rendering ---------- */

function setStaticStage(src) {
  sceneStage.classList.remove("boiling-active");
  sceneStage.innerHTML = `<img class="stage-img visible" src="${src}" alt="">`;
}

// Generic crossfade to a single new frame (stage 5's tie, stage 6's boil-pot entry).
function playCrossfade(toSrc, holdMs) {
  return new Promise((resolve) => {
    sceneStage.classList.remove("boiling-active");
    const newImg = document.createElement("img");
    newImg.className = "stage-img";
    newImg.src = toSrc;
    sceneStage.appendChild(newImg);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newImg.classList.add("visible");
        sceneStage.querySelectorAll(".stage-img").forEach((img) => {
          if (img !== newImg) img.classList.remove("visible");
        });
      });
    });
    setTimeout(() => {
      sceneStage.querySelectorAll(".stage-img").forEach((img) => {
        if (img !== newImg) img.remove();
      });
      resolve();
    }, holdMs);
  });
}

// The fold sequence (stage 3 — the neat folded triangle): a snappier frame swap than the
// generic crossfade, distinct from the plain slideshow treatment.
function playFoldFrame(toSrc) {
  return playCrossfade(toSrc, 420);
}

// Plays a video once (muted, inline) in place of the current frame, then resolves when it
// ends — leaving the element in place, frozen on its last frame, as the resting visual.
// Shares the .stage-img sizing/opacity/blend rules so it slots into the same layer as the
// static images. If autoplay is ever blocked, resolves immediately rather than hanging.
function playVideoOnce(src) {
  return new Promise((resolve) => {
    sceneStage.classList.remove("boiling-active");
    const vid = document.createElement("video");
    vid.className = "stage-img";
    vid.src = src;
    vid.muted = true;
    vid.playsInline = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("muted", "");
    sceneStage.appendChild(vid);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        vid.classList.add("visible");
        sceneStage.querySelectorAll(".stage-img").forEach((el) => {
          if (el !== vid) el.classList.remove("visible");
        });
      });
    });
    const cleanup = () => {
      sceneStage.querySelectorAll(".stage-img").forEach((el) => {
        if (el !== vid) el.remove();
      });
      resolve();
    };
    vid.addEventListener("ended", cleanup, { once: true });
    vid.play().catch(cleanup);
  });
}

// Resting state for a video stage on a COLD render (page load / reload mid-stage, no live
// transition to play): a paused video, shown on its first frame. Ideally this would seek
// to the LAST frame instead, matching what you see right after a live transition plays
// through — but these clips can't seek to arbitrary timestamps at all (tested: any
// non-zero currentTime snaps back to 0, repeatedly, in Chromium) — likely a keyframe/seek-
// table gap from how they were encoded. Not fixable from here; a re-export with proper
// seek support would let this show the true last frame instead. Flagging rather than
// faking it with a fast hidden playback-to-end hack, which would flash motion on every load.
function renderVideoFrozen(src) {
  sceneStage.classList.remove("boiling-active");
  sceneStage.innerHTML = `<video class="stage-img visible" src="${src}" muted playsinline preload="metadata"></video>`;
}

// Adds the looping bob + drifting steam wisps on top of whatever's currently showing
// (stage 5, boiling) — pure CSS/SVG overlay, doesn't care if it's an img or a video underneath.
function addBoilingAmbient() {
  sceneStage.classList.add("boiling-active");
  const steam = document.createElement("div");
  steam.className = "steam-wrap";
  steam.innerHTML = `<div class="steam-wisp"></div><div class="steam-wisp"></div><div class="steam-wisp"></div><div class="steam-wisp"></div>`;
  sceneStage.appendChild(steam);
}

function showFactCard() {
  if (!today.factText) {
    today.factText = randomFrom(LUPIS_FACTS);
    saveToday(today);
  }
  factText.textContent = today.factText;
  factCard.classList.remove("hidden");
}

function renderRestingStage(stage) {
  factCard.classList.add("hidden");
  if (stage === 2) renderVideoFrozen(ASSETS.foldMotion);
  else if (stage === 5) { renderVideoFrozen(ASSETS.boilingMotion); addBoilingAmbient(); }
  else setStaticStage(STAGE_IMAGE[stage]);
  if (stage === 6) showFactCard();
  auntieLine.textContent = AUNTIE_LINES[stage];
  stageChip.textContent = `${stage}/${STAGE_COUNT}`;
}

// Plays the transition INTO the given stage (assumes the previous stage is already resting on screen).
function transitionIntoStage(stage) {
  let anim;
  if (stage === 2) anim = playVideoOnce(ASSETS.foldMotion);
  else if (stage === 3) anim = playFoldFrame(ASSETS.leafFullFold);
  else if (stage === 4) anim = playCrossfade(ASSETS.parcelTied, 700);
  else if (stage === 5) anim = playVideoOnce(ASSETS.boilingMotion).then(() => addBoilingAmbient());
  else if (stage === 6) anim = playVideoOnce(ASSETS.drizzleMotion).then(() => playCrossfade(ASSETS.lupisFinished, 700)).then(() => showFactCard());
  else anim = Promise.resolve();

  return anim.then(() => {
    auntieLine.textContent = AUNTIE_LINES[stage];
    stageChip.textContent = `${stage}/${STAGE_COUNT}`;
  });
}

async function walkToStage(fromStage, toStage) {
  let s = fromStage;
  while (s < toStage) {
    s += 1;
    await transitionIntoStage(s);
  }
}

/* ---------- progress + toast ---------- */

function renderProgress() {
  const total = totalMl(today);
  waterWash.style.height = Math.min(1, total / goal) * 100 + "%";
  mlLabel.textContent = fmt(total);
  goalLabel.textContent = fmt(goal);
}

function showToast(text) {
  toast.textContent = text;
  toast.style.animation = "none";
  toast.classList.remove("hidden");
  // force reflow so the animation restarts even if triggered again quickly
  void toast.offsetWidth;
  toast.style.animation = "";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 1900);
}

let transitioning = false;

async function applyLog(ml) {
  if (transitioning) return;
  today.logs.push({ ml, ts: Date.now() });
  renderProgress();
  showToast(`+${fmt(ml)} ml`);

  const total = totalMl(today);
  const newStage = stageForMl(total, goal);
  const oldStage = today.stage;

  if (newStage > oldStage) {
    transitioning = true;
    tapLayer.style.pointerEvents = "none";
    await walkToStage(oldStage, newStage);
    tapLayer.style.pointerEvents = "auto";
    transitioning = false;
  }

  today.stage = newStage;
  saveToday(today);
}

/* ---------- screen switching ---------- */

const SCREENS = { kueh: kuehScreen, history: historyScreen, goal: goalScreen };

function showScreen(name) {
  Object.entries(SCREENS).forEach(([key, el]) => el.classList.toggle("hidden", key !== name));
  tabBtns.forEach((btn) => btn.classList.toggle("selected", btn.dataset.tab === name));
  if (name === "history") renderHistoryScreen();
  if (name === "goal") renderGoalScreen();
}

tabBtns.forEach((btn) => btn.addEventListener("click", () => showScreen(btn.dataset.tab)));

/* ---------- goal calculator ---------- */

let profile = loadProfile();

function renderGoalScreen() {
  const heading = document.getElementById("goal-heading");
  const subhead = document.getElementById("goal-subhead");
  const resultKicker = document.getElementById("goal-result-kicker");
  const saveBtn = document.getElementById("goal-save-btn");
  const calcValue = document.getElementById("goal-calc-value");

  const calculated = calcGoal(profile);
  calcValue.textContent = fmt(calculated);

  const firstTime = !hasSavedGoal();
  heading.innerHTML = firstTime ? "Let's set<br>your goal" : "Adjust your<br>goal";
  subhead.textContent = firstTime ? "First time here—tell us a bit about you" : "Update your details anytime.";
  resultKicker.textContent = firstTime ? "Your calculated goal" : "Your goal";

  if (firstTime) {
    saveBtn.textContent = "Set my goal";
  } else if (calculated === goal) {
    saveBtn.textContent = "This is your goal";
  } else {
    saveBtn.textContent = "Update my goal";
  }

  document.querySelectorAll("#sex-toggle .pill-toggle-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === profile.sex);
  });
  document.querySelectorAll("#activity-toggle .pill-toggle-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === profile.activity);
  });
  document.getElementById("weight-value").textContent = profile.weightKg;
  document.getElementById("height-value").textContent = profile.heightCm;
  document.getElementById("weight-fill").style.width =
    ((profile.weightKg - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * 100 + "%";
  document.getElementById("height-fill").style.width =
    ((profile.heightCm - HEIGHT_MIN) / (HEIGHT_MAX - HEIGHT_MIN)) * 100 + "%";

  renderHomeAdvice(); // activity may have just changed — keep Home's tip in sync
}

function updateProfile(patch) {
  profile = { ...profile, ...patch };
  saveProfile(profile);
  renderGoalScreen();
}

// Today's Auntie tip, shown on Home under the ml counter — no "Auntie says:" label, just
// the line itself. Picked once per day (cached on `today`, like the stage-6 fun fact) so
// it doesn't re-roll on every log; re-picked if the activity profile changes so it stays
// relevant to what's currently selected on the Goal screen.
function renderHomeAdvice() {
  if (!today.tipText || today.tipActivity !== profile.activity) {
    today.tipText = randomFrom(AUNTIE_TIPS[profile.activity]);
    today.tipActivity = profile.activity;
    saveToday(today);
  }
  document.getElementById("home-advice").textContent = `Oh ya—${today.tipText}`;
}

// Cheap subset of renderGoalScreen for continuous drag feedback — value labels, fill
// widths, the calculated number, the save button's label. Skips the tip re-roll and
// toggle classes (untouched by a weight/height drag) so dragging doesn't flicker the
// Auntie tip on every pixel of movement; the full render (and one tip re-roll) happens
// once when the drag ends, via updateProfile.
function renderGoalNumbers() {
  const calculated = calcGoal(profile);
  document.getElementById("goal-calc-value").textContent = fmt(calculated);
  const firstTime = !hasSavedGoal();
  const saveBtn = document.getElementById("goal-save-btn");
  saveBtn.textContent = firstTime ? "Set my goal" : calculated === goal ? "This is your goal" : "Update my goal";
  document.getElementById("weight-value").textContent = profile.weightKg;
  document.getElementById("height-value").textContent = profile.heightCm;
  document.getElementById("weight-fill").style.width =
    ((profile.weightKg - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * 100 + "%";
  document.getElementById("height-fill").style.width =
    ((profile.heightCm - HEIGHT_MIN) / (HEIGHT_MAX - HEIGHT_MIN)) * 100 + "%";
}

function wireStepperDrag(trackEl, min, max, onLiveChange, onCommit) {
  let dragging = false;
  const valueFromX = (clientX) => {
    const rect = trackEl.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(min + ratio * (max - min));
  };
  trackEl.addEventListener("pointerdown", (e) => {
    dragging = true;
    trackEl.setPointerCapture(e.pointerId);
    onLiveChange(valueFromX(e.clientX));
  });
  trackEl.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    onLiveChange(valueFromX(e.clientX));
  });
  trackEl.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    onCommit();
  });
}

wireStepperDrag(
  document.getElementById("weight-track"), WEIGHT_MIN, WEIGHT_MAX,
  (v) => { profile.weightKg = v; renderGoalNumbers(); },
  () => updateProfile({ weightKg: profile.weightKg })
);
wireStepperDrag(
  document.getElementById("height-track"), HEIGHT_MIN, HEIGHT_MAX,
  (v) => { profile.heightCm = v; renderGoalNumbers(); },
  () => updateProfile({ heightCm: profile.heightCm })
);

document.querySelectorAll("#sex-toggle .pill-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => updateProfile({ sex: btn.dataset.value }));
});
document.querySelectorAll("#activity-toggle .pill-toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => updateProfile({ activity: btn.dataset.value }));
});
document.getElementById("weight-minus").addEventListener("click", () =>
  updateProfile({ weightKg: Math.max(WEIGHT_MIN, profile.weightKg - 1) })
);
document.getElementById("weight-plus").addEventListener("click", () =>
  updateProfile({ weightKg: Math.min(WEIGHT_MAX, profile.weightKg + 1) })
);
document.getElementById("height-minus").addEventListener("click", () =>
  updateProfile({ heightCm: Math.max(HEIGHT_MIN, profile.heightCm - 1) })
);
document.getElementById("height-plus").addEventListener("click", () =>
  updateProfile({ heightCm: Math.min(HEIGHT_MAX, profile.heightCm + 1) })
);

document.getElementById("goal-save-btn").addEventListener("click", () => {
  const calculated = calcGoal(profile);
  goal = calculated;
  saveGoal(goal);
  renderProgress();
  renderGoalScreen();
  showToast(`Goal set to ${fmt(goal)} ml`);
});

/* ---------- history screen ---------- */

let historyRange = "day";
let weekOffset = 0; // 0 = this week, -1 = last week, ...
let monthOffset = 0; // 0 = this month, -1 = last month, ...

function startOfWeek(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
function dateKey(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

let activeTooltip = null;
function dismissTooltip() {
  if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; }
}
document.addEventListener("click", (e) => {
  if (activeTooltip && !e.target.closest(".bar-pill")) dismissTooltip();
});

function makeBar(labelText, ml, maxMl, colorClass, tooltipLabel) {
  const item = document.createElement("div");
  item.className = "bar-item";
  const pct = maxMl > 0 ? Math.min(1, ml / maxMl) * 100 : 0;
  item.innerHTML = `<div class="bar-pill"><div class="bar-pill-fill ${ml > 0 ? colorClass : ""}" style="height:${pct}%"></div></div><div class="bar-label">${labelText}</div>`;
  const pill = item.querySelector(".bar-pill");
  pill.addEventListener("click", (e) => {
    e.stopPropagation();
    dismissTooltip();
    const tip = document.createElement("div");
    tip.className = "bar-tooltip";
    tip.textContent = `${fmt(ml)} ml${tooltipLabel ? " · " + tooltipLabel : ""}`;
    pill.appendChild(tip);
    requestAnimationFrame(() => tip.classList.add("visible"));
    activeTooltip = tip;
    clearTimeout(makeBar._t);
    makeBar._t = setTimeout(dismissTooltip, 2200);
  });
  return item;
}

function renderHistoryScreen() {
  document.querySelectorAll(".segmented-btn").forEach((btn) =>
    btn.classList.toggle("selected", btn.dataset.range === historyRange)
  );
  document.getElementById("history-day").classList.toggle("hidden", historyRange !== "day");
  document.getElementById("history-week").classList.toggle("hidden", historyRange !== "week");
  document.getElementById("history-month").classList.toggle("hidden", historyRange !== "month");
  dismissTooltip();

  if (historyRange === "day") renderDayHistory();
  else if (historyRange === "week") renderWeekHistory();
  else renderMonthHistory();
}

document.querySelectorAll(".segmented-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    historyRange = btn.dataset.range;
    renderHistoryScreen();
  });
});

const DAY_BLURBS = [
  { max: 0, text: "Not yet start ah. Go drink some." },
  { max: 49, text: "Just started. Keep going." },
  { max: 99, text: "Halfway already, don't slack." },
  { max: Infinity, text: "Wah steady, goal reached!" }
];
function dayBlurbFor(pct) {
  return DAY_BLURBS.find((b) => pct <= b.max).text;
}

function renderDayHistory() {
  const total = totalMl(today);
  const pct = goal > 0 ? Math.min(1, total / goal) * 100 : 0;
  document.getElementById("day-ml-label").textContent = fmt(total);
  document.getElementById("day-goal-label").textContent = fmt(goal);
  document.getElementById("day-bar-fill").style.width = pct + "%";
  document.getElementById("day-blurb").textContent = dayBlurbFor(pct);

  const buckets = [7, 9, 11, 13, 15, 17, 19, 21]; // 2-hour buckets, 7am-9pm
  const sums = buckets.map((h) => {
    const next = h + 2;
    return today.logs
      .filter((l) => {
        const hr = new Date(l.ts || Date.now()).getHours();
        return hr >= h && hr < next;
      })
      .reduce((s, l) => s + l.ml, 0);
  });
  const row = document.getElementById("hour-bars");
  row.innerHTML = "";
  buckets.forEach((h, i) => {
    const label = h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
    const colorClass = sums[i] >= HOUR_BAR_MAX_ML ? "" : "under-goal";
    row.appendChild(makeBar(label, sums[i], HOUR_BAR_MAX_ML, colorClass));
  });
}

function renderWeekHistory() {
  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const totals = days.map((d) => historyTotalFor(dateKey(d)));

  const weekEnd = days[6];
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const fmtDate = (d, withMonth) =>
    d.getDate() + (withMonth ? " " + d.toLocaleString("en-US", { month: "short" }) : "");
  document.getElementById("week-range-label").textContent = sameMonth
    ? `${fmtDate(weekStart, false)} – ${fmtDate(weekEnd, true)}`
    : `${fmtDate(weekStart, true)} – ${fmtDate(weekEnd, true)}`;

  const maxTotal = Math.max(goal * 1.15, ...totals, 1);
  const row = document.getElementById("week-bars");
  row.innerHTML = "";
  const goalPct = Math.min(1, goal / maxTotal) * 100;
  const goalLine = document.createElement("div");
  goalLine.className = "goal-line";
  goalLine.style.bottom = goalPct + "%";
  goalLine.innerHTML = `<span class="goal-line-label">${fmt(goal)} ml goal</span>`;
  row.appendChild(goalLine);

  const labels = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  days.forEach((d, i) => {
    const colorClass = totals[i] >= goal ? "" : "under-goal";
    row.appendChild(makeBar(labels[i], totals[i], maxTotal, colorClass));
  });

  const daysWithGoalPct = totals.map((t) => Math.min(1, t / goal));
  const avgMl = totals.reduce((s, t) => s + t, 0) / 7;
  const avgPct = (daysWithGoalPct.reduce((s, p) => s + p, 0) / 7) * 100;
  document.getElementById("week-avg-ml").textContent = fmt(avgMl);
  document.getElementById("week-avg-pct").textContent = Math.round(avgPct);

  let bestIdx = 0;
  totals.forEach((t, i) => { if (t > totals[bestIdx]) bestIdx = i; });
  document.getElementById("week-best-day").textContent =
    totals[bestIdx] > 0 ? `${labels[bestIdx][0]}${labels[bestIdx][1].toLowerCase()} · ${fmt(totals[bestIdx])} ml` : "No logs yet";
}
document.getElementById("week-prev-btn").addEventListener("click", () => { weekOffset -= 1; renderWeekHistory(); });
document.getElementById("week-next-btn").addEventListener("click", () => { weekOffset = Math.min(0, weekOffset + 1); renderWeekHistory(); });

function renderMonthHistory() {
  const base = new Date();
  const viewed = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = viewed.getFullYear(), month = viewed.getMonth();
  document.getElementById("month-title-label").textContent = viewed.toLocaleString("en-US", { month: "long", year: "numeric" });

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid

  const grid = document.getElementById("month-grid");
  grid.innerHTML = "";
  for (let i = 0; i < leadingBlanks; i++) grid.appendChild(document.createElement("div"));

  let monthTotal = 0, elapsedDays = 0;
  const todayStr = todayKey();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = dateKey(d);
    const isFuture = key > todayStr;
    const total = isFuture ? 0 : historyTotalFor(key);
    if (!isFuture) { monthTotal += total; elapsedDays += 1; }

    const cell = document.createElement("div");
    cell.className = "month-cell" + (total > 0 ? " has-data" : "") + (key === todayStr ? " is-today" : "");
    let inner = `<span class="month-day-num">${day}</span>`;
    if (total >= goal) {
      inner += `<img class="month-cell-jug" src="./assets/lupis/water-jug.png?v=17" alt="Goal reached">`;
    } else if (total > 0) {
      inner += `<span class="month-cell-value">${fmtL(total)}</span>`;
    }
    cell.innerHTML = inner;
    grid.appendChild(cell);
  }

  const expected = goal * elapsedDays;
  const diff = expected - monthTotal;
  const summary = document.getElementById("month-summary");
  if (elapsedDays === 0) {
    summary.innerHTML = `<span class="month-summary-icon"></span> No logs yet this month.`;
  } else {
    summary.innerHTML = `<span class="month-summary-icon"></span> Reached ${fmt(monthTotal)} ml · ${fmtL(Math.abs(diff))} ${diff > 0 ? "under" : "over"} goal`;
  }
}
document.getElementById("month-prev-btn").addEventListener("click", () => { monthOffset -= 1; renderMonthHistory(); });
document.getElementById("month-next-btn").addEventListener("click", () => { monthOffset = Math.min(0, monthOffset + 1); renderMonthHistory(); });

/* ---------- water log sheet + drag-to-fill glass ---------- */

const TICKS = [50, 100, 150, 200, 250].filter((t) => t <= MAX_LOG_ML);

function renderTicks() {
  tickColumn.innerHTML = TICKS.map(
    (t) => `<div class="tick" style="bottom:${(t / MAX_LOG_ML) * 100}%">
      <div class="tick-dash"></div><div class="tick-label">${t}</div>
    </div>`
  ).join("");
}
renderTicks();

// Singlish micro-copy reacting to the dragged amount, live, near the glass/ml counter.
// One random line per bracket, re-rolled only when the drag actually crosses into a new
// bracket (not on every pixel of movement) — see reactionLineFor() below.
// Edit/add lines here; the bracket-picking logic doesn't need to change.
const SINGLISH_REACTIONS = [
  { max: 50, lines: ["Eh, ok lah, a start.", "Every sip counts leh.", "Alright, baby steps first."] },
  { max: 100, lines: ["Ok, warming up.", "Small small also ok.", "Only a bit ah. Ok, can."] },
  { max: 150, lines: ["Not bad, keep going ah.", "Can can, steady.", "Alright lor, decent one."] },
  { max: 200, lines: ["Wah, solid one!", "Now we talking sia.", "Nice, good effort."] },
  { max: 250, lines: ["Wah power lah you!", "Confirm hydrated already.", "Gao dim, full send."] }
];

function reactionBracketFor(ml) {
  for (const b of SINGLISH_REACTIONS) {
    if (ml <= b.max) return b;
  }
  return SINGLISH_REACTIONS[SINGLISH_REACTIONS.length - 1];
}

let currentReactionBracket = null;
let currentReactionLine = "";

function reactionLineFor(ml) {
  const bracket = reactionBracketFor(ml);
  if (bracket !== currentReactionBracket) {
    currentReactionBracket = bracket;
    currentReactionLine = randomFrom(bracket.lines);
  }
  return currentReactionLine;
}

function impactLineFor(draft) {
  const total = totalMl(today);
  const after = total + draft;
  if (after >= goal) return "This one finishes the whole kueh. Coconut time.";
  const resultStage = stageForMl(after, goal);
  const remaining = stageBoundaryMl(resultStage + 1, goal) - after;
  return `${fmt(remaining)} ml more after this to finish "${STAGE_NAMES[resultStage]}".`;
}

let dragging = false;
let pendingMl = 0;

function mlFromPointer(clientY) {
  const rect = glassTrack.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (rect.bottom - clientY) / rect.height));
  return Math.round(ratio * MAX_LOG_ML); // continuous, 1ml precision, matching the design (no snapping)
}

function setGlassVisual(ml) {
  const ratio = ml / MAX_LOG_ML;
  glassFill.style.height = ratio * 100 + "%";
  draftLabel.textContent = fmt(ml);
  sizeHint.textContent = reactionLineFor(ml);
  impactText.textContent = impactLineFor(ml);
  sheetConfirmBtn.disabled = ml <= 0;
}

function openWaterSheet() {
  currentReactionBracket = null; // fresh random line each time the sheet opens
  pendingMl = 0;
  setGlassVisual(0);
  waterSheet.classList.add("open");
  sheetBackdrop.classList.add("open");
}
function closeWaterSheet() {
  waterSheet.classList.remove("open");
  sheetBackdrop.classList.remove("open");
}

tapLayer.addEventListener("click", openWaterSheet);
sheetBackdrop.addEventListener("click", closeWaterSheet);
sheetLaterBtn.addEventListener("click", closeWaterSheet);

glassTrack.addEventListener("pointerdown", (e) => {
  dragging = true;
  glassTrack.setPointerCapture(e.pointerId);
  pendingMl = mlFromPointer(e.clientY);
  setGlassVisual(pendingMl);
});
glassTrack.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  pendingMl = mlFromPointer(e.clientY);
  setGlassVisual(pendingMl);
});
glassTrack.addEventListener("pointerup", () => {
  dragging = false;
});

sheetConfirmBtn.addEventListener("click", () => {
  if (pendingMl <= 0) return;
  closeWaterSheet();
  applyLog(pendingMl);
});

/* ---------- boot ---------- */

document.getElementById("day-number").textContent = `· Day ${dayNumber()}`;
renderProgress();
renderRestingStage(today.stage);
renderHomeAdvice();
showScreen("kueh");
