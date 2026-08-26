// "Shared Tray" minigame (Ube Biko). Per
// docs/INTERNATIONAL-MINIGAMES-SET-01.md: six sticky portions get placed
// around a shared tray until it forms one flower-shaped platter.
//
// The three portion art pieces are each pre-drawn at a fixed angle (not
// meant to be freely rotated) -- "upright" is vertical, "side" leans one
// diagonal, "diagonal" leans the other. Each shape therefore has exactly
// two petals it visually belongs in (the two ends of its own axis through
// the tray's centre); a piece dropped on the wrong pair wobbles back.
// There's still no single "correct" petal per piece within its own pair,
// keeping the placement forgiving, but shape now has to match position.
//
// A fixed pool of exactly six pieces (two of each shape) is available,
// consumed as they're placed -- same pattern as restorePattern.js's
// picker. Pieces can be dragged (pointer-based, matches restorePattern's
// approach) and a piece already on the tray can be picked back up and
// moved to a different empty petal of the same shape family.
//
// Contract: start(container, config, onResult)
//   config.savedState — { placements: {slotId: pieceId} } from a
//     previous session, or null. Rebuilds the exact board on mount.
//   config.onProgress(state) — called after every placement/move so the
//     caller can persist it (state shape matches savedState above).
//   config.successPortrait — same success-sparkle treatment as the other
//     minigames', for consistency across all chapters.
// onResult receives { completed: true }

window.KG = window.KG || {};
window.KG.minigames = window.KG.minigames || {};

(function () {
  const DIR = "assets/minigames/ube-biko-shared-tray";
  const TRAY_IMG = `${DIR}/tray-empty-v2.webp`;
  const REFERENCE_IMG = `${DIR}/reference-complete-v2.webp`;
  const SUCCESS_SPARKLES = "assets/effects/minigame-success-sparkles-v1.png";

  // The three crops follow the vertical and two diagonal cavity shapes.
  // Slot rotations align their long axes and turn each topping inward.
  const SHAPES = {
    upright: `${DIR}/portion-upright-v2.webp`,
    side: `${DIR}/portion-side-v2.webp`,
    diagonal: `${DIR}/portion-diagonal-v2.webp`
  };

  // Two pieces of each shape -- a fixed pool of six, not infinitely reusable.
  const PIECES = [
    { id: "upright-1", shape: "upright" },
    { id: "upright-2", shape: "upright" },
    { id: "side-1", shape: "side" },
    { id: "side-2", shape: "side" },
    { id: "diagonal-1", shape: "diagonal" },
    { id: "diagonal-2", shape: "diagonal" }
  ];

  const SLOTS = [
    { id: "petal-1", left: 50, top: 27, shape: "upright", rotate: 180 },
    { id: "petal-2", left: 69, top: 39, shape: "diagonal", rotate: 30 },
    { id: "petal-3", left: 69, top: 61, shape: "side", rotate: 195 },
    { id: "petal-4", left: 50, top: 73, shape: "upright" },
    { id: "petal-5", left: 31, top: 61, shape: "diagonal", rotate: 210 },
    { id: "petal-6", left: 31, top: 39, shape: "side", rotate: 15 }
  ];
  const SLOT_W = 25;
  const SLOT_H = 25;

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
      placements: Object.assign({}, saved.placements || {}), // slotId -> pieceId
      selectedPieceId: null, // for tap-to-select fallback (keyboard/no-drag)
      pickerOrder: shuffle(PIECES.map((p) => p.id)),
      assembled: false,
      done: false
    };

    let drag = null; // { pieceId, fromSlotId, ghostEl, moved, startX, startY }

    function persist() {
      if (config.onProgress) {
        config.onProgress({ placements: Object.assign({}, state.placements) });
      }
    }

    function pieceById(id) {
      return PIECES.find((p) => p.id === id);
    }

    function slotById(id) {
      return SLOTS.find((s) => s.id === id);
    }

    function placedCount() {
      return Object.keys(state.placements).length;
    }

    function pieceIdInSlot(slotId) {
      return state.placements[slotId] || null;
    }

    function slotForPiece(pieceId) {
      return Object.keys(state.placements).find((slotId) => state.placements[slotId] === pieceId) || null;
    }

    function unplacedPieceIds() {
      const placedIds = Object.values(state.placements);
      return state.pickerOrder.filter((id) => placedIds.indexOf(id) === -1);
    }

    function render() {
      const filledCount = placedCount();

      const trayContentHtml = state.assembled
        ? `<img src="${REFERENCE_IMG}" alt="" class="tray-reference-img">`
        : `
          <img src="${TRAY_IMG}" alt="" class="tray-empty-img" draggable="false">
          ${SLOTS.map((slot) => {
            const pieceId = pieceIdInSlot(slot.id);
            if (!pieceId) return "";
            const piece = pieceById(pieceId);
            const isDragging = drag && drag.pieceId === pieceId;
            return `
              <button
                type="button"
                class="tray-placed-btn ${isDragging ? "is-dragging" : ""}"
                style="left:${slot.left}%;top:${slot.top}%;width:${SLOT_W}%;height:${SLOT_H}%;"
                data-piece-id="${piece.id}"
                data-from-slot-id="${slot.id}"
                aria-label="Placed sticky piece, tap to pick up"
              ><img src="${SHAPES[slot.shape]}" alt="" class="tray-placed-img" draggable="false" style="${slot.rotate ? `transform:rotate(${slot.rotate}deg);` : ""}"></button>`;
          }).join("")}
          ${SLOTS.map((slot) => {
            if (pieceIdInSlot(slot.id)) return "";
            const isSelected = !!state.selectedPieceId;
            const matchesSelected = !!state.selectedPieceId;
            return `
              <button
                type="button"
                class="tray-slot ${isSelected ? "is-selectable" : ""} ${matchesSelected ? "is-match" : ""}"
                style="left:${slot.left}%;top:${slot.top}%;width:${SLOT_W}%;height:${SLOT_H}%;"
                data-slot-id="${slot.id}"
                data-shape="${slot.shape}"
                aria-label="Empty space on the shared tray"
              ></button>`;
          }).join("")}`;

      const pickerHtml = unplacedPieceIds()
        .map((id) => {
          const piece = pieceById(id);
          const isSelected = state.selectedPieceId === id;
          const isDragging = drag && drag.pieceId === id;
          return `
            <button
              type="button"
              class="tray-portion-btn ${isSelected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}"
              data-piece-id="${id}"
              aria-label="Sticky portion"
              aria-pressed="${isSelected}"
            ><img src="${SHAPES[piece.shape]}" alt="" class="tray-portion-img" draggable="false"></button>`;
        })
        .join("");

      container.innerHTML = `
        <div class="tray-game">
          <p class="tray-instruction">Drag each sticky piece onto a matching space.</p>
          <p class="tray-progress" aria-live="polite">Shared pieces: ${filledCount} of 6</p>
          <div class="tray-board">${trayContentHtml}</div>
          <div class="tray-picker" role="group" aria-label="Available portions">${pickerHtml}</div>
          <button type="button" class="memory-dev-skip" data-tray-action="complete-for-me">complete for me</button>
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
          <p class="memory-success-text">Every piece found a place at the table!</p>`;
        frame.appendChild(overlay);
      }
      setTimeout(() => onResult({ completed: true }), 2200);
    }

    function checkComplete() {
      if (placedCount() === 6 && !state.done) {
        state.done = true;
        state.assembled = true;
        render();
        setTimeout(showSuccess, 1000);
      }
    }

    // pieceId may already be on the tray (moving) or still in the picker
    // (first placement) -- either way it's removed from wherever it was
    // before landing in the new slot.
    function attemptPlace(pieceId, slotId) {
      const piece = pieceById(pieceId);
      const slot = slotById(slotId);
      if (pieceIdInSlot(slotId)) return false;
      const fromSlot = slotForPiece(pieceId);
      if (fromSlot) delete state.placements[fromSlot];
      state.placements[slotId] = pieceId;
      state.selectedPieceId = null;
      persist();
      render();
      checkComplete();
      return true;
    }

    // ---------- Pointer-based drag (mouse + touch in one) ----------

    function bindDragHandles() {
      container.querySelectorAll(".tray-portion-btn, .tray-placed-btn").forEach((btn) => {
        btn.addEventListener("pointerdown", onPointerDown);
      });
    }

    function onPointerDown(e) {
      if (state.done) return;
      const btn = e.currentTarget;
      const pieceId = btn.dataset.pieceId;
      const fromSlotId = btn.dataset.fromSlotId || null;
      const piece = pieceById(pieceId);
      e.preventDefault();

      const ghost = document.createElement("img");
      ghost.src = SHAPES[piece.shape];
      ghost.className = "tray-drag-ghost";
      ghost.style.width = btn.offsetWidth * 1.15 + "px";
      document.body.appendChild(ghost);

      drag = { pieceId, fromSlotId, ghostEl: ghost, moved: false, startX: e.clientX, startY: e.clientY, hoverSlotId: null };
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

    function onPointerMove(e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.startX) > 4 || Math.abs(e.clientY - drag.startY) > 4) {
        drag.moved = true;
      }
      positionGhost(e.clientX, e.clientY);
      drag.ghostEl.style.display = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      drag.ghostEl.style.display = "";
      const slotEl = under && under.closest(".tray-slot");
      const newHover = slotEl ? slotEl.dataset.slotId : null;
      if (newHover !== drag.hoverSlotId) {
        drag.hoverSlotId = newHover;
        highlightHover(newHover);
      }
    }

    function highlightHover(slotId) {
      container.querySelectorAll(".tray-slot").forEach((el) => {
        el.classList.toggle("is-hover", el.dataset.slotId === slotId);
      });
    }

    function onPointerUp(e) {
      if (!drag) return;
      const pieceId = drag.pieceId;
      const wasDragged = drag.moved;
      drag.ghostEl.style.display = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const slotEl = under && under.closest(".tray-slot");
      clearDrag();

      if (slotEl) {
        attemptPlace(pieceId, slotEl.dataset.slotId);
      } else if (!wasDragged) {
        state.selectedPieceId = state.selectedPieceId === pieceId ? null : pieceId;
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

    // ---------- Click fallback (keyboard: select a piece, then a slot) ----------

    function handleClick(e) {
      if (state.done) return;

      const skipBtn = e.target.closest('[data-tray-action="complete-for-me"]');
      if (skipBtn) {
        state.placements = {};
        SLOTS.forEach((slot) => {
          const match = PIECES.find((p) => p.shape === slot.shape && Object.values(state.placements).indexOf(p.id) === -1);
          state.placements[slot.id] = match.id;
        });
        state.selectedPieceId = null;
        persist();
        render();
        checkComplete();
        return;
      }

      const slotBtn = e.target.closest(".tray-slot");
      if (slotBtn && state.selectedPieceId) {
        attemptPlace(state.selectedPieceId, slotBtn.dataset.slotId);
      }
    }

    container.addEventListener("click", handleClick);
    render();
    checkComplete();
  }

  window.KG.minigames.sharedTray = { start };
})();
