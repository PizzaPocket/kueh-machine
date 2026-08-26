// "Fold a Wish" minigame (Pink Songpyeon). Per
// docs/INTERNATIONAL-MINIGAMES-SET-01.md: place the dough, choose a
// filling, fold, then seal the curved edge -- four short steps that
// support Songpyeon's story that her half-moon shape was never
// unfinished. Every filling choice is culturally plausible, so there is
// no wrong choice, only a small colour change.
//
// The flat dough starts resting below the board (not overlapping it) and
// is dragged up onto the folding guide; fillings are dragged from their
// tray onto the dough once it's placed. Both use the same pointer-based
// ghost-drag approach as restorePattern.js/sharedTray.js, with tap-to-
// select-then-tap-target kept as a fallback for keyboard/no-drag input.
//
// Contract: start(container, config, onResult)
//   config.savedState — { step, fillingId, sealedIndices } from a
//     previous session, or null. Rebuilds the exact board on mount.
//   config.onProgress(state) — called after every completed step so the
//     caller can persist it (state shape matches savedState above).
//   config.successPortrait — same success-sparkle treatment as the other
//     minigames', for consistency across all chapters.
// onResult receives { completed: true }

window.KG = window.KG || {};
window.KG.minigames = window.KG.minigames || {};

(function () {
  const DIR = "assets/minigames/songpyeon-fold-a-wish";
  const BOARD_IMG = `${DIR}/board-guide-v2.webp`;
  const DOUGH_IMG = `${DIR}/dough-flat-v2.webp`;
  const DOUGH_FOLDED_IMG = `${DIR}/dough-folded-partial-v2.webp`;
  const REFERENCE_IMG = `${DIR}/reference-complete-v3.webp`;
  const SUCCESS_SPARKLES = "assets/effects/minigame-success-sparkles-v1.png";

  // All three fillings are culturally plausible -- the choice only
  // changes the small centre colour shown once placed, never correctness.
  // `image` defaults to the shared spoon art; once distinct per-filling
  // assets exist, add an `image` override per entry here and nothing else
  // needs to change.
  const FILLINGS = [
    { id: "sesame", label: "Sesame", image: `${DIR}/filling-sesame-v1.webp`, filled: `${DIR}/dough-filled-sesame-v1.webp` },
    { id: "chestnut", label: "Chestnut", image: `${DIR}/filling-chestnut-v1.webp`, filled: `${DIR}/dough-filled-chestnut-v1.webp` },
    { id: "bean", label: "Sweet bean", image: `${DIR}/filling-sweet-bean-v1.webp`, filled: `${DIR}/dough-filled-sweet-bean-v1.webp` }
  ];

  const SEAL_POINTS = 5;
  const SEAL_POSITIONS = [[24, 65], [37, 72], [50, 75], [63, 72], [76, 65]];
  const STEP_ORDER = ["placeDough", "placeFilling", "fold", "seal"];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function start(container, config, onResult) {
    const saved = config.savedState || {};
    const state = {
      step: STEP_ORDER.indexOf(saved.step) !== -1 ? saved.step : "placeDough",
      selectedDough: false,
      fillingId: saved.fillingId || null,
      selectedFillingId: null,
      sealedIndices: Array.isArray(saved.sealedIndices) ? saved.sealedIndices.slice() : [],
      done: false
    };

    let drag = null; // { role, ghostEl, moved, startX, startY }

    function persist() {
      if (config.onProgress) {
        config.onProgress({
          step: state.step,
          fillingId: state.fillingId,
          sealedIndices: state.sealedIndices.slice()
        });
      }
    }

    function fillingById(id) {
      return FILLINGS.find((f) => f.id === id);
    }

    function fillingImage(f) {
      return f.image;
    }

    function stepNumber() {
      const idx = STEP_ORDER.indexOf(state.step);
      return idx === -1 ? 1 : idx + 1;
    }

    function instructionText() {
      if (state.step === "placeDough") return "Drag the dough onto the folding guide.";
      if (state.step === "placeFilling") return "Drag a filling onto the dough.";
      if (state.step === "fold") return "Fold the dough into a half moon.";
      return "Tap each point to seal the curved edge.";
    }

    function boardHtml() {
      if (state.step === "placeDough") {
        return `<img src="${BOARD_IMG}" alt="" class="wish-board-img">
          <button
            type="button"
            class="wish-guide-target"
            data-drop-role="dough-target"
            aria-label="Folding guide"
          ></button>`;
      }

      if (state.step === "placeFilling") {
        return `
          <img src="${BOARD_IMG}" alt="" class="wish-board-img">
          <button
            type="button"
            class="wish-dough-placed-btn ${state.selectedFillingId ? "is-drop-ready" : ""}"
            data-drop-role="filling-target"
            aria-label="Dough on the folding guide"
          ><img src="${DOUGH_IMG}" alt="" class="wish-dough-placed-img"></button>
        `;
      }

      if (state.step === "fold") {
        const chosenFilling = fillingById(state.fillingId);
        return `
          <img src="${BOARD_IMG}" alt="" class="wish-board-img">
          <img src="${chosenFilling.filled}" alt="Pink Songpyeon dough with ${chosenFilling.label.toLowerCase()} filling" class="wish-dough-placed">
          <span class="wish-fold-arrow" aria-hidden="true">&#8593;</span>
        `;
      }

      if (state.step === "seal") {
        const ridges = SEAL_POSITIONS.map((pos, i) => {
          const isSealed = state.sealedIndices.indexOf(i) !== -1;
          return `<span class="wish-seal-point ${isSealed ? "is-sealed" : ""}" style="left:${pos[0]}%;top:${pos[1]}%" data-seal-index="${i}" role="button" tabindex="0" aria-label="Seal point ${i + 1} of ${SEAL_POINTS}"></span>`;
        });
        return `
          <img src="${BOARD_IMG}" alt="" class="wish-board-img">
          <div class="wish-seal-stage">
            <img src="${DOUGH_FOLDED_IMG}" alt="" class="wish-dough-folded">
            <div class="wish-seal-ring">${ridges.join("")}</div>
          </div>
        `;
      }

      return `
        <img src="${BOARD_IMG}" alt="" class="wish-board-img">
        <img src="${REFERENCE_IMG}" alt="" class="wish-reference-img">
      `;
    }

    function doughRestHtml() {
      if (state.step !== "placeDough") return "";
      const isDragging = drag && drag.role === "dough";
      return `
        <div class="wish-tray-row">
          <button
            type="button"
            class="wish-dough-btn ${state.selectedDough ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}"
            data-drag-role="dough"
            aria-label="Flat dough disk"
            aria-pressed="${state.selectedDough}"
          ><img src="${DOUGH_IMG}" alt="" class="wish-dough-img" draggable="false"></button>
        </div>`;
    }

    function fillingPickerHtml() {
      if (state.step !== "placeFilling") return "";
      return `
        <div class="wish-picker" role="group" aria-label="Fillings">${FILLINGS
          .map((f) => {
            const isSelected = state.selectedFillingId === f.id;
            const isDragging = drag && drag.role === "filling" && drag.fillingId === f.id;
            return `
              <button type="button" class="wish-filling-btn ${isSelected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}" data-drag-role="filling" data-filling-id="${f.id}" aria-label="${f.label} filling">
                <img src="${fillingImage(f)}" alt="" class="wish-spoon-img" draggable="false">
                <span class="wish-filling-label">${f.label}</span>
              </button>`;
          })
          .join("")}</div>`;
    }

    function render() {
      const done = state.step === "complete";
      container.innerHTML = `
        <div class="wish-game">
          <p class="wish-instruction">${instructionText()}</p>
          <p class="wish-progress" aria-live="polite">A wish in the making: ${done ? 4 : stepNumber()} of 4</p>
          <div class="wish-board">${boardHtml()}</div>
          ${doughRestHtml()}
          ${fillingPickerHtml()}
          ${state.step === "fold"
            ? `<button type="button" class="primary-btn wish-fold-btn" data-wish-action="fold">Fold</button>`
            : ""}
          <button type="button" class="memory-dev-skip" data-wish-action="complete-for-me">complete for me</button>
        </div>`;

      bindDragHandles();
    }

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
          <p class="memory-success-text">Her wish was folded safely inside!</p>`;
        frame.appendChild(overlay);
      }
      setTimeout(() => onResult({ completed: true }), 2200);
    }

    function finish() {
      state.done = true;
      state.step = "complete";
      render();
      setTimeout(showSuccess, 1000);
    }

    function placeDough() {
      state.step = "placeFilling";
      state.selectedDough = false;
      persist();
      render();
    }

    function placeFilling(fillingId) {
      state.fillingId = fillingId;
      state.selectedFillingId = null;
      state.step = "fold";
      persist();
      render();
    }

    function sealPoint(index) {
      if (state.sealedIndices.indexOf(index) !== -1) return;
      state.sealedIndices.push(index);
      persist();
      if (state.sealedIndices.length >= SEAL_POINTS) {
        finish();
      } else {
        render();
      }
    }

    // ---------- Pointer-based drag (mouse + touch in one) ----------

    function bindDragHandles() {
      container.querySelectorAll("[data-drag-role]").forEach((btn) => {
        btn.addEventListener("pointerdown", onPointerDown);
      });
    }

    function onPointerDown(e) {
      if (state.done) return;
      const btn = e.currentTarget;
      const role = btn.dataset.dragRole;
      e.preventDefault();

      const imgSrc = role === "dough" ? DOUGH_IMG : fillingImage(fillingById(btn.dataset.fillingId));
      const ghost = document.createElement("img");
      ghost.src = imgSrc;
      ghost.className = "wish-drag-ghost";
      ghost.style.width = btn.offsetWidth * 1.1 + "px";
      document.body.appendChild(ghost);

      drag = { role, fillingId: btn.dataset.fillingId || null, ghostEl: ghost, moved: false, startX: e.clientX, startY: e.clientY, hoverTarget: null };
      positionGhost(e.clientX, e.clientY);

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", cancelDrag);
      window.addEventListener("blur", cancelDrag);
    }

    function positionGhost(x, y) {
      if (!drag) return;
      drag.ghostEl.style.left = x + "px";
      drag.ghostEl.style.top = y + "px";
    }

    function dropRoleFor(dragRole) {
      return dragRole === "dough" ? "dough-target" : "filling-target";
    }

    function onPointerMove(e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.startX) > 4 || Math.abs(e.clientY - drag.startY) > 4) {
        drag.moved = true;
      }
      positionGhost(e.clientX, e.clientY);
      drag.ghostEl.style.display = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      drag.ghostEl.style.display = "";
      const targetEl = under && under.closest(`[data-drop-role="${dropRoleFor(drag.role)}"]`);
      const newHover = targetEl ? true : false;
      if (newHover !== drag.hoverTarget) {
        drag.hoverTarget = newHover;
        container.querySelectorAll("[data-drop-role]").forEach((el) => el.classList.toggle("is-hover", el === targetEl));
      }
    }

    function onPointerUp(e) {
      if (!drag) return;
      const role = drag.role;
      const fillingId = drag.fillingId;
      const wasDragged = drag.moved;
      drag.ghostEl.style.display = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const targetEl = under && under.closest(`[data-drop-role="${dropRoleFor(role)}"]`);
      clearDrag();

      if (targetEl && role === "dough") {
        placeDough();
      } else if (targetEl && role === "filling") {
        placeFilling(fillingId);
      } else if (!wasDragged) {
        if (role === "dough") {
          state.selectedDough = !state.selectedDough;
        } else {
          state.selectedFillingId = state.selectedFillingId === fillingId ? null : fillingId;
        }
        render();
      } else {
        render();
      }
    }

    function clearDrag() {
      if (drag && drag.ghostEl) drag.ghostEl.remove();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", cancelDrag);
      window.removeEventListener("blur", cancelDrag);
      drag = null;
    }

    function cancelDrag() {
      if (!drag) return;
      clearDrag();
      render();
    }

    // ---------- Click fallback (keyboard: select, then tap the target) ----------

    function handleClick(e) {
      if (state.done) return;

      const skipBtn = e.target.closest('[data-wish-action="complete-for-me"]');
      if (skipBtn) {
        state.fillingId = state.fillingId || FILLINGS[0].id;
        state.sealedIndices = SEAL_POSITIONS.map((_, i) => i);
        persist();
        finish();
        return;
      }

      if (state.step === "placeDough" && state.selectedDough && e.target.closest('[data-drop-role="dough-target"]')) {
        placeDough();
        return;
      }

      if (state.step === "placeFilling" && state.selectedFillingId && e.target.closest('[data-drop-role="filling-target"]')) {
        placeFilling(state.selectedFillingId);
        return;
      }

      if (state.step === "fold" && e.target.closest('[data-wish-action="fold"]')) {
        state.step = "seal";
        persist();
        render();
        return;
      }

      if (state.step === "seal") {
        const point = e.target.closest(".wish-seal-point");
        if (point) {
          sealPoint(Number(point.dataset.sealIndex));
        }
      }
    }

    // Swipe-up on the dough during the fold step is a fallback for the
    // visible Fold button, per the doc's accessibility note.
    let touchStartY = null;
    function onFoldPointerDown(e) {
      if (state.step === "fold") touchStartY = e.clientY;
    }
    function onFoldPointerUp(e) {
      if (state.step === "fold" && touchStartY !== null && touchStartY - e.clientY > 30) {
        state.step = "seal";
        persist();
        render();
      }
      touchStartY = null;
    }

    container.addEventListener("click", handleClick);
    container.addEventListener("pointerdown", onFoldPointerDown);
    container.addEventListener("pointerup", onFoldPointerUp);
    render();
  }

  window.KG.minigames.foldAWish = { start };
})();
