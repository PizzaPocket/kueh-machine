// "Restore the Pattern" minigame (Ang Ku Kueh). Per
// docs/ANG-KU-KUEH-AND-KUEH-LAPIS-MINIGAMES.md: seven pattern pieces get
// placed onto seven matching slots on the base. Drag a piece onto its slot,
// or (for keyboard/accessibility) tap a piece then tap its slot — real
// <button> elements throughout, so Tab + Enter/Space also works.
//
// Contract: start(container, config, onResult)
//   config.savedState — { lockedPieceIds } from a previous session, or
//     null. Rebuilds the exact board on mount.
//   config.onProgress(state) — called after every successful placement so
//     the caller can persist it (state shape matches savedState above).
//   config.successPortrait — same success-sparkle treatment as Memory
//     Flip's, for consistency across all three chapters' minigames.
// onResult receives { completed: true }

window.KG = window.KG || {};
window.KG.minigames = window.KG.minigames || {};

(function () {
  const BASE_IMG = "assets/minigames/ang-ku-kueh-restore-pattern/pieces/base-blank.webp";
  const MOULD_IMG = "assets/minigames/ang-ku-kueh-restore-pattern/mould-top-down-v1.webp";
  const REFERENCE_IMG = "assets/minigames/ang-ku-kueh-restore-pattern/pieces/reference-complete.webp";
  const SUCCESS_SPARKLES = "assets/effects/minigame-success-sparkles-v1.png";

  // id, source image, and box (center point + size, all % of the base
  // image) — mapped directly from Amanda's drop-box mockup: a uniform
  // grid where the two middle boxes are wider/taller than the top/bottom
  // pair. An 8px-equivalent gap now sits between each row instead of the
  // boxes overlapping at the seams — % is relative to the base's own
  // (now much smaller, nested-in-the-mould) rendered height, ~5% per gap.
  const PIECES = [
    { id: "upper-left", image: "assets/minigames/ang-ku-kueh-restore-pattern/pieces/piece-upper-left.webp", left: 33.8, top: 15, w: 32, h: 24 },
    { id: "upper-right", image: "assets/minigames/ang-ku-kueh-restore-pattern/pieces/piece-upper-right.webp", left: 66.2, top: 15, w: 32, h: 24 },
    { id: "mid-left", image: "assets/minigames/ang-ku-kueh-restore-pattern/pieces/piece-mid-left.webp", left: 20, top: 50.5, w: 32, h: 43 },
    { id: "mid-right", image: "assets/minigames/ang-ku-kueh-restore-pattern/pieces/piece-mid-right.webp", left: 80, top: 50.5, w: 32, h: 43 },
    { id: "centre", image: "assets/minigames/ang-ku-kueh-restore-pattern/pieces/piece-centre-v1.webp", left: 50, top: 50.5, w: 56, h: 68, slotW: 40.32, slotH: 48.96 },
    { id: "lower-left", image: "assets/minigames/ang-ku-kueh-restore-pattern/pieces/piece-lower-left.webp", left: 33.8, top: 82, w: 32, h: 24 },
    { id: "lower-right", image: "assets/minigames/ang-ku-kueh-restore-pattern/pieces/piece-lower-right.webp", left: 66.2, top: 82, w: 32, h: 24 }
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function labelFor(id) {
    return id.replace("-", " ");
  }

  function start(container, config, onResult) {
    const saved = config.savedState || {};
    const state = {
      lockedPieceIds: (saved.lockedPieceIds || []).slice(),
      selectedPieceId: null,
      pickerOrder: shuffle(PIECES.map((p) => p.id)),
      wobblePieceId: null,
      hoverSlotId: null,
      assembled: false, // true for the 1s beat between the last piece locking and the success sparkle
      done: false
    };

    let drag = null; // { pieceId, ghostEl, moved, startX, startY }

    function persist() {
      if (config.onProgress) {
        config.onProgress({ lockedPieceIds: state.lockedPieceIds });
      }
    }

    function pieceById(id) {
      return PIECES.find((p) => p.id === id);
    }

    function render() {
      const remaining = state.pickerOrder.filter((id) => state.lockedPieceIds.indexOf(id) === -1);

      // Once the last piece locks, swap the seven separate pieces for the
      // single assembled reference art and hold on it briefly before the
      // success sparkle — a beat of "it's whole again" before celebrating.
      const baseContentHtml = state.assembled
        ? `<img src="${REFERENCE_IMG}" alt="" class="pattern-base-img pattern-reference-complete">`
        : `
          <img src="${BASE_IMG}" alt="" class="pattern-base-img" draggable="false">
          ${state.lockedPieceIds
            .map((id) => {
              const piece = pieceById(id);
              return `<img src="${piece.image}" alt="" class="pattern-placed-piece" draggable="false" style="left:${piece.left}%;top:${piece.top}%;width:${piece.w}%;height:${piece.h}%;">`;
            })
            .join("")}
          ${PIECES
            .map((piece) => {
              if (state.lockedPieceIds.indexOf(piece.id) !== -1) return "";
              const isHover = state.hoverSlotId === piece.id;
              return `
                <button
                  type="button"
                  class="pattern-slot ${isHover ? "is-hover" : ""}"
                  style="left:${piece.left}%;top:${piece.top}%;width:${piece.slotW || piece.w}%;height:${piece.slotH || piece.h}%;"
                  data-slot-id="${piece.id}"
                  aria-label="${labelFor(piece.id)} pattern space"
                ></button>`;
            })
            .join("")}`;

      const pickerHtml = remaining
        .map((id) => {
          const piece = pieceById(id);
          const isSelected = state.selectedPieceId === id;
          const isWobble = state.wobblePieceId === id;
          const isDragging = drag && drag.pieceId === id;
          return `
            <button
              type="button"
              class="pattern-piece-btn ${isSelected ? "is-selected" : ""} ${isWobble ? "is-wobble" : ""} ${isDragging ? "is-dragging" : ""}"
              data-piece-id="${id}"
              aria-label="${labelFor(id)} pattern piece"
              aria-pressed="${isSelected}"
            ><img src="${piece.image}" alt="" class="pattern-piece-img" draggable="false"></button>`;
        })
        .join("");

      const doneCount = state.lockedPieceIds.length;

      container.innerHTML = `
        <div class="pattern-game">
          <p class="pattern-instruction">Drag each piece into the pattern Ang Ku Kueh is trying to remember.</p>
          <p class="pattern-progress" aria-live="polite">Pattern pieces: ${doneCount} of ${PIECES.length}</p>
          <div class="pattern-board">
            <div class="pattern-mould-wrap">
              <img src="${MOULD_IMG}" alt="" class="pattern-mould-img" draggable="false">
              <div class="pattern-base-wrap" id="patternBaseWrap">
                ${baseContentHtml}
              </div>
            </div>
          </div>
          <div class="pattern-picker" role="group" aria-label="Available pattern pieces">${pickerHtml}</div>
          <button type="button" class="memory-dev-skip" data-pattern-action="complete-for-me">complete for me</button>
        </div>`;

      bindDragHandles();
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
          <p class="memory-success-text">The pattern feels whole again!</p>`;
        frame.appendChild(overlay);
      }
      setTimeout(() => onResult({ completed: true }), 2200);
    }

    function checkComplete() {
      if (state.lockedPieceIds.length === PIECES.length && !state.done) {
        state.done = true;
        state.assembled = true;
        render();
        setTimeout(showSuccess, 1000);
      }
    }

    function attemptPlace(pieceId, slotId) {
      if (slotId === pieceId) {
        state.lockedPieceIds.push(slotId);
        state.selectedPieceId = null;
        persist();
        render();
        checkComplete();
      } else {
        state.wobblePieceId = pieceId;
        state.selectedPieceId = null;
        render();
        setTimeout(() => {
          state.wobblePieceId = null;
          render();
        }, 500);
      }
    }

    // ---------- Pointer-based drag (mouse + touch in one) ----------

    function bindDragHandles() {
      container.querySelectorAll(".pattern-piece-btn").forEach((btn) => {
        btn.addEventListener("pointerdown", onPointerDown);
      });
    }

    function onPointerDown(e) {
      if (state.done) return;
      const btn = e.currentTarget;
      const pieceId = btn.dataset.pieceId;
      const piece = pieceById(pieceId);
      e.preventDefault();

      const ghost = document.createElement("img");
      ghost.src = piece.image;
      ghost.className = "pattern-drag-ghost";
      ghost.style.width = btn.offsetWidth * 1.1 + "px";
      document.body.appendChild(ghost);

      drag = { pieceId, ghostEl: ghost, moved: false, startX: e.clientX, startY: e.clientY };
      positionGhost(e.clientX, e.clientY);

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", cancelDrag);
    }

    function positionGhost(x, y) {
      if (!drag) return;
      drag.ghostEl.style.left = x + "px";
      drag.ghostEl.style.top = y + "px";
    }

    function onPointerMove(e) {
      if (!drag) return;
      e.preventDefault();
      if (Math.abs(e.clientX - drag.startX) > 4 || Math.abs(e.clientY - drag.startY) > 4) {
        drag.moved = true;
      }
      positionGhost(e.clientX, e.clientY);
      drag.ghostEl.style.display = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      drag.ghostEl.style.display = "";
      const slotEl = under && under.closest(".pattern-slot");
      const newHover = slotEl ? slotEl.dataset.slotId : null;
      if (newHover !== state.hoverSlotId) {
        container.querySelectorAll(".pattern-slot.is-hover").forEach((slot) => slot.classList.remove("is-hover"));
        state.hoverSlotId = newHover;
        if (slotEl) slotEl.classList.add("is-hover");
      }
    }

    function cleanupDrag() {
      if (drag && drag.ghostEl) drag.ghostEl.remove();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", cancelDrag);
      container.querySelectorAll(".pattern-slot.is-hover").forEach((slot) => slot.classList.remove("is-hover"));
      state.hoverSlotId = null;
    }

    function cancelDrag() {
      if (!drag) return;
      cleanupDrag();
      drag = null;
      render();
    }

    function onPointerUp(e) {
      if (!drag) return;
      const pieceId = drag.pieceId;
      const wasDragged = drag.moved;
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const slotEl = under && under.closest(".pattern-slot");
      cleanupDrag();
      drag = null;

      if (slotEl) {
        attemptPlace(pieceId, slotEl.dataset.slotId);
      } else if (!wasDragged) {
        // Treated as a tap, not a drag — fall back to select-then-tap-slot.
        state.selectedPieceId = state.selectedPieceId === pieceId ? null : pieceId;
        render();
      } else {
        render(); // dropped outside any slot — snap back to the picker
      }
    }

    // ---------- Click fallback (keyboard: tab to piece, Enter/Space to
    // select, tab to slot, Enter/Space to place) ----------

    function handleClick(e) {
      if (state.done) return;

      // Dev-only shortcut, same pattern as Memory Flip's — not player-facing.
      const skipBtn = e.target.closest('[data-pattern-action="complete-for-me"]');
      if (skipBtn) {
        state.lockedPieceIds = PIECES.map((p) => p.id);
        state.selectedPieceId = null;
        persist();
        render();
        checkComplete();
        return;
      }

      const slotBtn = e.target.closest(".pattern-slot");
      if (slotBtn && state.selectedPieceId) {
        attemptPlace(state.selectedPieceId, slotBtn.dataset.slotId);
      }
    }

    container.addEventListener("click", handleClick);
    render();
    checkComplete();
  }

  window.KG.minigames.restorePattern = { start };
})();
