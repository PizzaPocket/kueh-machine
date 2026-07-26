(function () {
  "use strict";

  const STATE = {
    IDLE: "idle",
    COIN_INSERTED: "coinInserted",
    ROLLING: "rolling",
    CAPSULE_READY: "capsuleReady",
    OPENING: "opening",
    REVEALED: "revealed"
  };

  let state = STATE.IDLE;
  let crackCount = 0;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const ROLL_DURATION = prefersReducedMotion ? 120 : 1100;
  const OPEN_DURATION = prefersReducedMotion ? 120 : 750;

  const CAPSULE_COLORS = ["capsule-blue", "capsule-gold", "capsule-red"];

  const machine = document.getElementById("machine");
  const capsuleBtn = document.getElementById("capsuleBtn");
  const capsuleUse = document.getElementById("capsuleUse");
  const microcopy = document.getElementById("microcopy");
  const coinBtn = document.getElementById("coinBtn");
  const knobBtn = document.getElementById("knobBtn");
  const revealView = document.getElementById("revealView");
  const kuehArt = document.getElementById("kuehArt");
  const kuehName = document.getElementById("kuehName");
  const kuehDesc = document.getElementById("kuehDesc");
  const kuehTaste = document.getElementById("kuehTaste");
  const kuehHistory = document.getElementById("kuehHistory");
  const againBtn = document.getElementById("againBtn");

  function setMicrocopy(text) {
    microcopy.textContent = text;
  }

  function insertCoin() {
    if (state !== STATE.IDLE) return;
    state = STATE.COIN_INSERTED;
    coinBtn.disabled = true;
    coinBtn.classList.add("inserted");
    knobBtn.disabled = false;
    setMicrocopy("Now turn the knob!");
  }

  function pullLever() {
    if (state !== STATE.COIN_INSERTED) return;
    state = STATE.ROLLING;
    knobBtn.disabled = true;
    machine.classList.add("rolling");
    setMicrocopy("Rolling...");

    window.setTimeout(() => {
      machine.classList.remove("rolling");
      state = STATE.CAPSULE_READY;
      crackCount = 0;
      const color =
        CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)];
      capsuleUse.setAttribute("href", `#${color}`);
      capsuleBtn.hidden = false;
      capsuleBtn.classList.add("drop-in");
      capsuleBtn.focus();
      setMicrocopy("Crack it open — click the capsule!");
    }, ROLL_DURATION);
  }

  function crackCapsule() {
    if (state !== STATE.CAPSULE_READY) return;
    crackCount += 1;

    if (crackCount === 1) {
      capsuleBtn.classList.add("crack-1-active");
      setMicrocopy("It's cracking...");
    } else if (crackCount === 2) {
      capsuleBtn.classList.add("crack-2-active");
      setMicrocopy("Almost there...");
    } else {
      openCapsule();
    }
  }

  function openCapsule() {
    state = STATE.OPENING;
    capsuleBtn.classList.add("opening");
    setMicrocopy("Opening!");

    window.setTimeout(() => {
      revealKueh();
    }, OPEN_DURATION);
  }

  function revealKueh() {
    state = STATE.REVEALED;
    const kueh = KUEH_DATA[Math.floor(Math.random() * KUEH_DATA.length)];

    kuehArt.innerHTML = renderKuehArt(kueh);
    kuehName.textContent = kueh.name;
    kuehDesc.textContent = kueh.description;
    kuehTaste.textContent = kueh.taste;
    kuehHistory.textContent = kueh.history;

    revealView.hidden = false;
    againBtn.focus();
  }

  function resetToIdle() {
    state = STATE.IDLE;
    crackCount = 0;

    coinBtn.disabled = false;
    coinBtn.classList.remove("inserted");
    knobBtn.disabled = true;
    machine.classList.remove("rolling");
    capsuleBtn.hidden = true;
    capsuleBtn.classList.remove(
      "drop-in",
      "crack-1-active",
      "crack-2-active",
      "opening"
    );
    setMicrocopy("Insert a coin to begin");

    revealView.hidden = true;
    coinBtn.focus();
  }

  coinBtn.addEventListener("click", insertCoin);
  knobBtn.addEventListener("click", pullLever);
  capsuleBtn.addEventListener("click", crackCapsule);
  againBtn.addEventListener("click", resetToIdle);

  // --- Kueh illustrations (placeholder SVGs — swap for real art anytime) ---
  const INK = "#5B3A29";

  const KUEH_ART = {
    "onde-onde": (k) => `
      <svg viewBox="0 0 120 120" role="img" aria-label="Illustration of ${k.name}">
        <circle cx="38" cy="66" r="17" fill="${k.base}" stroke="${INK}" stroke-width="3" />
        <circle cx="82" cy="62" r="18" fill="${k.base}" stroke="${INK}" stroke-width="3" />
        <circle cx="60" cy="82" r="22" fill="${k.base}" stroke="${INK}" stroke-width="3" />
        <circle cx="33" cy="60" r="2.2" fill="${k.accent}" />
        <circle cx="42" cy="71" r="2.2" fill="${k.accent}" />
        <circle cx="77" cy="56" r="2.2" fill="${k.accent}" />
        <circle cx="87" cy="66" r="2.2" fill="${k.accent}" />
        <circle cx="53" cy="78" r="2.2" fill="${k.accent}" />
        <circle cx="66" cy="88" r="2.2" fill="${k.accent}" />
        <circle cx="60" cy="70" r="2.2" fill="${k.accent}" />
      </svg>`,

    "ang-ku-kueh": (k) => `
      <svg viewBox="0 0 120 120" role="img" aria-label="Illustration of ${k.name}">
        <rect x="20" y="86" width="80" height="12" rx="4" fill="#8FBF7F" stroke="${INK}" stroke-width="2" />
        <path d="M28 90 C24 60 34 34 60 30 C86 34 96 60 92 90 C80 98 40 98 28 90 Z"
          fill="${k.base}" stroke="${INK}" stroke-width="3" />
        <path d="M42 40 C50 34 70 34 78 40" fill="none" stroke="${INK}" stroke-width="2" opacity="0.5" />
        <path d="M36 54 C48 46 72 46 84 54" fill="none" stroke="${INK}" stroke-width="2" opacity="0.5" />
      </svg>`,

    "kueh-lapis": (k) => `
      <svg viewBox="0 0 120 120" role="img" aria-label="Illustration of ${k.name}">
        <rect x="24" y="28" width="72" height="66" rx="6" fill="${k.accent}" stroke="${INK}" stroke-width="3" />
        <rect x="24" y="28" width="72" height="13.2" fill="${k.base}" />
        <rect x="24" y="54.4" width="72" height="13.2" fill="${k.base}" />
        <rect x="24" y="80.8" width="72" height="13.2" fill="${k.base}" />
        <rect x="24" y="28" width="72" height="66" rx="6" fill="none" stroke="${INK}" stroke-width="3" />
      </svg>`,

    "kueh-salat": (k) => `
      <svg viewBox="0 0 120 120" role="img" aria-label="Illustration of ${k.name}">
        <rect x="22" y="30" width="76" height="60" rx="6" fill="${k.accent}" stroke="${INK}" stroke-width="3" />
        <path d="M22 60 L98 60 L98 36 Q98 30 92 30 L28 30 Q22 30 22 36 Z" fill="${k.base}" stroke="${INK}" stroke-width="3" />
        <circle cx="40" cy="42" r="1.6" fill="${INK}" opacity="0.4" />
        <circle cx="58" cy="48" r="1.6" fill="${INK}" opacity="0.4" />
        <circle cx="76" cy="40" r="1.6" fill="${INK}" opacity="0.4" />
        <circle cx="84" cy="50" r="1.6" fill="${INK}" opacity="0.4" />
      </svg>`,

    "kueh-dadar": (k) => `
      <svg viewBox="0 0 120 120" role="img" aria-label="Illustration of ${k.name}">
        <rect x="18" y="50" width="84" height="30" rx="15" fill="${k.base}" stroke="${INK}" stroke-width="3" />
        <path d="M92 50 A15 15 0 0 1 92 80" fill="${k.accent}" stroke="${INK}" stroke-width="3" />
        <path d="M38 58 Q46 65 38 72" fill="none" stroke="${INK}" stroke-width="2" opacity="0.5" />
        <path d="M58 58 Q66 65 58 72" fill="none" stroke="${INK}" stroke-width="2" opacity="0.5" />
        <path d="M78 58 Q84 65 78 72" fill="none" stroke="${INK}" stroke-width="2" opacity="0.5" />
      </svg>`
  };

  function renderKuehArt(kueh) {
    const artFn = KUEH_ART[kueh.id];
    return artFn ? artFn(kueh) : "";
  }
})();
