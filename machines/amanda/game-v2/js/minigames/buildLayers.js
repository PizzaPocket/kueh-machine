// "Build the Layers" minigame (Kueh Lapis). Per
// docs/ANG-KU-KUEH-AND-KUEH-LAPIS-MINIGAMES.md: 8 thin layers, alternating
// brown/ivory starting with brown. Choose the right batter, then press and
// hold "Spread layer" and release while the thickness indicator is inside
// the calm target band. Not a precision or speed challenge — the target
// band is wide and the sweep is slow.
//
// Contract: start(container, config, onResult)
//   config.savedState — { completedLayers } from a previous session, or
//     null. Rebuilds the exact stack on mount.
//   config.onProgress(state) — called after every successful layer so the
//     caller can persist it (state shape matches savedState above).
//   config.successPortrait — same success-sparkle treatment as Memory
//     Flip's, for consistency across all three chapters' minigames.
// onResult receives { completed: true }

window.KG = window.KG || {};
window.KG.minigames = window.KG.minigames || {};

(function () {
  const PIECES_DIR = "assets/minigames/kueh-lapis-build-layers/pieces";
  const SUCCESS_SPARKLES = "assets/effects/minigame-success-sparkles-v1.png";
  const TOTAL_LAYERS = 8;
  const SWEEP_MS = 2500;
  const TARGET_MIN = 0.3; // 40% band, centered
  const TARGET_MAX = 0.7;

  // Index 0 = widest (goes at the bottom), index 5 = narrowest (goes on top).
  const BROWN_STRIPS = [6, 5, 4, 3, 2, 1].map((n) => `${PIECES_DIR}/strip-brown-${n}.png`);
  const IVORY_STRIPS = [6, 5, 4, 3, 2, 1].map((n) => `${PIECES_DIR}/strip-ivory-${n}.png`);
  const WAVY_BROWN = `${PIECES_DIR}/strip-brown-wavy.png`;
  const WAVY_IVORY = `${PIECES_DIR}/strip-ivory-wavy.png`;
  const EMPTY_TRAY = `${PIECES_DIR}/empty-banana-leaf-tray-v1.png`;
  const POURING_SPOON = `${PIECES_DIR}/pouring-spoon-v1.png`;

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function colorForLayer(index) {
    return index % 2 === 0 ? "brown" : "ivory";
  }

  function stripForLayer(index) {
    const occurrence = Math.floor(index / 2);
    return colorForLayer(index) === "brown" ? BROWN_STRIPS[occurrence] : IVORY_STRIPS[occurrence];
  }

  function start(container, config, onResult) {
    const saved = config.savedState || {};
    const savedCount = Math.min(saved.completedLayers || 0, TOTAL_LAYERS);
    const savedWidths = Array.isArray(saved.layerWidths) ? saved.layerWidths : [];
    const state = {
      completedLayers: savedCount,
      layerWidths: Array.from({ length: savedCount }, (_, index) => savedWidths[index] || 90),
      step: "ready", // ready | spreading | retryLayer
      hintText: "",
      wrongBowl: null,
      done: false
    };

    let sweepStart = null;
    let sweepRaf = null;

    function persist() {
      if (config.onProgress) {
        config.onProgress({
          completedLayers: state.completedLayers,
          layerWidths: state.layerWidths.slice()
        });
      }
    }

    function stackHtml() {
      let html = "";
      for (let i = 0; i < state.completedLayers; i++) {
        const width = state.layerWidths[i] || 90;
        html += `<img src="${stripForLayer(i)}" alt="" class="layers-strip" style="width:${width}%" decoding="sync">`;
      }
      return html;
    }

    function render() {
      const expectedColor = colorForLayer(state.completedLayers);
      const spreadEnabled = state.step === "ready" || state.step === "spreading";
      const retryStrip = state.step === "retryLayer" ? (expectedColor === "brown" ? WAVY_BROWN : WAVY_IVORY) : "";
      const isSpreading = state.step === "spreading";
      const colorLabel = expectedColor === "brown" ? "Brown" : "Ivory";

      container.innerHTML = `
        <div class="layers-game">
          <div class="layers-heading">
            <p class="layers-instruction">Build the cake one patient layer at a time.</p>
            <p class="layers-progress" aria-live="polite">Layer ${state.completedLayers + 1 > TOTAL_LAYERS ? TOTAL_LAYERS : state.completedLayers + 1} of ${TOTAL_LAYERS}</p>
          </div>
          <div class="layers-next ${expectedColor}" aria-live="polite">
            <span class="layers-colour-dot" aria-hidden="true"></span>
            <span>Next: <strong>${colorLabel} batter</strong></span>
          </div>
          <div class="layers-visual ${isSpreading ? "is-pouring" : ""}">
            <img src="${POURING_SPOON}" alt="" class="layers-pouring-spoon" decoding="sync">
            <svg class="layers-batter-pour ${expectedColor}" viewBox="0 0 80 126" aria-hidden="true">
              <path class="layers-pour-sheet" d="M35 3 C38 1 43 1 46 4 C47 25 43 45 44 68 C45 84 58 91 70 104 C61 116 19 116 9 104 C21 91 34 84 35 68 C37 45 33 25 35 3 Z"></path>
              <ellipse class="layers-pour-pool" cx="40" cy="107" rx="31" ry="10"></ellipse>
              <ellipse class="layers-pour-ripple ripple-one" cx="40" cy="113" rx="25" ry="6"></ellipse>
              <ellipse class="layers-pour-ripple ripple-two" cx="40" cy="121" rx="36" ry="4"></ellipse>
            </svg>
            <img src="${EMPTY_TRAY}" alt="Banana leaf-lined serving tray" class="layers-serving-tray" decoding="sync">
            <div class="layers-cake-stack">${stackHtml()}${retryStrip ? `<img src="${retryStrip}" alt="" class="layers-strip layers-strip-wavy">` : ""}</div>
          </div>
          <p class="layers-hint-text" aria-live="polite">${state.hintText || "Tap below to begin pouring."}</p>
          <div class="layers-meter-wrap">
            <div class="layers-meter">
              <div class="layers-meter-target"></div>
              <div class="layers-meter-indicator" id="layersIndicator"></div>
            </div>
            <button type="button" class="primary-btn layers-spread-btn" id="layersSpreadBtn" ${spreadEnabled ? "" : "disabled"}>
              ${isSpreading ? "Tap again in the calm zone" : `Pour ${colorLabel.toLowerCase()} layer`}
            </button>
          </div>
          <button type="button" class="memory-dev-skip" data-layers-action="complete-for-me">complete for me</button>
        </div>`;

      const spreadBtn = document.getElementById("layersSpreadBtn");
      if (spreadBtn && spreadEnabled) {
        spreadBtn.addEventListener("click", () => {
          if (sweepStart !== null) {
            endSweep();
          } else {
            state.step = "spreading";
            startSweep();
          }
        });
      }
    }

    // Same sparkle + happy-portrait treatment as Memory Flip's success
    // moment, appended to the tray frame directly so it covers the whole
    // tray rather than just this game's own container.
    function showSuccess() {
      const frame = document.getElementById("trayStageFrame");
      if (frame) {
        const overlay = document.createElement("div");
        overlay.className = "memory-success-overlay";
        overlay.setAttribute("role", "status");
        overlay.innerHTML = `
          <div class="memory-success-stack">
            <img src="${SUCCESS_SPARKLES}" alt="" class="memory-success-sparkles">
            ${config.successPortrait ? `<img src="${config.successPortrait}" alt="" class="memory-success-kueh">` : ""}
          </div>
          <p class="memory-success-text">Every layer has found its place!</p>`;
        frame.appendChild(overlay);
      }
      setTimeout(() => onResult({ completed: true }), 2200);
    }

    function startSweep() {
      if (sweepRaf) return;
      sweepStart = performance.now();
      const indicator = document.getElementById("layersIndicator");
      const spreadBtn = document.getElementById("layersSpreadBtn");
      if (spreadBtn) spreadBtn.textContent = "Tap again in the calm zone";
      const visual = container.querySelector(".layers-visual");
      if (visual) visual.classList.add("is-pouring");
      function tick(now) {
        const elapsed = now - sweepStart;
        const cycleProgress = (elapsed % (SWEEP_MS * 2)) / SWEEP_MS;
        const progress = cycleProgress <= 1 ? cycleProgress : 2 - cycleProgress;
        if (indicator) indicator.style.left = (progress * 100) + "%";
        sweepRaf = requestAnimationFrame(tick);
      }
      sweepRaf = requestAnimationFrame(tick);
    }

    function endSweep() {
      if (!sweepStart) return;
      const elapsed = performance.now() - sweepStart;
      const cycleProgress = (elapsed % (SWEEP_MS * 2)) / SWEEP_MS;
      const progress = cycleProgress <= 1 ? cycleProgress : 2 - cycleProgress;
      if (sweepRaf) cancelAnimationFrame(sweepRaf);
      sweepRaf = null;
      sweepStart = null;

      if (progress >= TARGET_MIN && progress <= TARGET_MAX) {
        goodLayer(progress);
      } else {
        unevenLayer();
      }
    }

    function goodLayer(progress) {
      const distanceFromCenter = Math.abs(progress - 0.5);
      const centerScore = Math.max(0, 1 - (distanceFromCenter / 0.2));
      state.layerWidths.push(Math.round(82 + (centerScore * 18)));
      state.completedLayers += 1;
      state.step = "ready";
      state.hintText = "";
      persist();
      if (state.completedLayers >= TOTAL_LAYERS) {
        state.done = true;
        render();
        showSuccess();
      } else {
        render();
      }
    }

    function unevenLayer() {
      state.step = "retryLayer";
      state.hintText = "Almost. Let's make this layer a little more even.";
      render();
      setTimeout(() => {
        state.step = "ready";
        state.hintText = "";
        render();
      }, prefersReducedMotion() ? 50 : 700);
    }

    function handleClick(e) {
      if (state.done) return;

      // Dev-only shortcut, same pattern as Memory Flip's — not player-facing.
      const skipBtn = e.target.closest('[data-layers-action="complete-for-me"]');
      if (skipBtn) {
        state.completedLayers = TOTAL_LAYERS;
        state.layerWidths = Array(TOTAL_LAYERS).fill(100);
        state.step = "ready";
        persist();
        state.done = true;
        render();
        showSuccess();
        return;
      }

    }

    container.addEventListener("click", handleClick);
    if (state.completedLayers >= TOTAL_LAYERS) {
      state.done = true;
      showSuccess();
    } else {
      render();
    }
  }

  window.KG.minigames.buildLayers = { start };
})();
