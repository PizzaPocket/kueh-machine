// Memory Flip minigame. Pure image-image pairs — each image appears exactly
// twice, all sharing one card back. Matches stay face-up with a small star
// burst. Mismatches stay visible (not auto-flipped) until the player clicks
// another card, at which point they flip closed and the new click is
// treated as a fresh first flip. On completion, shows the sparkle success
// overlay before handing control back to the chapter runner.
//
// Cards are real <button> elements so mouse, touch, and keyboard
// (Enter/Space) all work through native browser behavior.
//
// Contract: start(container, config, onResult)
// onResult receives { completed, mistakes, elapsedMs }

window.KG = window.KG || {};
window.KG.minigames = window.KG.minigames || {};

(function () {
  const CARD_BACK = "assets/minigames/shared/card-back-v1.webp";
  const SUCCESS_SPARKLES = "assets/effects/minigame-success-sparkles-v1.png";


  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function start(container, config, onResult) {
    const pairCount = Math.min(config.pairCount || config.pairs.length, config.pairs.length);
    const selectedPairs = shuffle(config.pairs).slice(0, pairCount);

    // Front images are only inserted into the DOM (and so only fetched) the
    // moment a card is first flipped -- with no head start, that first flip
    // shows a blank/loading card until the network catches up. Kick off the
    // fetch+decode for every front in this round right away, while the
    // player is still looking at face-down backs, so by the time they flip
    // anything it's already cached.
    selectedPairs.forEach((pair) => {
      const preload = new Image();
      preload.src = pair.image;
    });

    let deck = [];
    selectedPairs.forEach((pair) => {
      deck.push({ uid: pair.id + "-a", pairId: pair.id, image: pair.image });
      deck.push({ uid: pair.id + "-b", pairId: pair.id, image: pair.image });
    });
    deck = shuffle(deck);

    const state = {
      deck,
      flipped: [],
      matchedPairIds: [],
      justMatchedPairId: null,
      awaitingResolve: false, // true when 2 mismatched cards are shown, waiting on the next click
      mistakes: 0,
      done: false,
      startedAt: Date.now()
    };

    function cardHtml(card) {
      const isFlipped = state.flipped.indexOf(card.uid) !== -1;
      const isMatched = state.matchedPairIds.indexOf(card.pairId) !== -1;
      const faceUp = isFlipped || isMatched;
      const stateLabel = isMatched ? "matched" : faceUp ? "face up" : "face down";
      const showStars = isMatched && card.pairId === state.justMatchedPairId;

      const inner = faceUp
        ? `<img src="${card.image}" alt="" class="memory-card-img" decoding="sync">`
        : `<img src="${CARD_BACK}" alt="" class="memory-card-back-img" decoding="sync">`;

      const stars = showStars
        ? `<span class="memory-star memory-star-1" aria-hidden="true">✦</span>
           <span class="memory-star memory-star-2" aria-hidden="true">✦</span>
           <span class="memory-star memory-star-3" aria-hidden="true">✦</span>`
        : "";

      return `
        <button
          type="button"
          class="memory-card ${faceUp ? "is-face-up" : ""} ${isMatched ? "is-matched" : ""}"
          data-uid="${card.uid}"
          ${isMatched ? "disabled" : ""}
          aria-label="Memory card, ${stateLabel}"
        >${inner}${stars}</button>`;
    }

    function render() {
      container.innerHTML = `
        <div class="memory-flip-grid">
          ${state.deck.map(cardHtml).join("")}
        </div>
        <p class="memory-flip-status" aria-live="polite">
          ${state.matchedPairIds.length} of ${pairCount} pairs matched
        </p>
        <button type="button" class="memory-dev-skip">complete for me</button>`;
    }

    // Dev-only shortcut so testing doesn't require replaying the game every
    // time — not part of the player-facing flow.
    function completeForMe() {
      if (state.done) return;
      state.matchedPairIds = selectedPairs.map((p) => p.id);
      state.justMatchedPairId = null;
      state.flipped = [];
      state.done = true;
      container.removeEventListener("click", handleClick);
      render();
      showSuccess(Date.now() - state.startedAt);
    }

    function handleClick(e) {
      if (e.target.closest(".memory-dev-skip")) return completeForMe();
      if (state.done) return;
      const btn = e.target.closest(".memory-card");
      if (!btn) return;
      const uid = btn.dataset.uid;
      const card = state.deck.find((c) => c.uid === uid);
      if (!card) return;
      if (state.matchedPairIds.indexOf(card.pairId) !== -1) return;

      // A mismatched pair is on screen — this click's job is to close it first.
      if (state.awaitingResolve) {
        state.flipped = [];
        state.awaitingResolve = false;
      }

      if (state.flipped.indexOf(uid) !== -1) return;
      if (state.flipped.length >= 2) return;

      if (state.justMatchedPairId) state.justMatchedPairId = null;
      state.flipped.push(uid);
      render();

      if (state.flipped.length === 2) {
        const [firstUid, secondUid] = state.flipped;
        const first = state.deck.find((c) => c.uid === firstUid);
        const second = state.deck.find((c) => c.uid === secondUid);

        if (first.pairId === second.pairId) {
          state.matchedPairIds.push(first.pairId);
          state.justMatchedPairId = first.pairId;
          state.flipped = [];
          render();

          setTimeout(() => {
            if (state.justMatchedPairId === first.pairId) {
              state.justMatchedPairId = null;
              if (!state.done) render();
            }
          }, 900);

          if (state.matchedPairIds.length === pairCount) {
            state.done = true;
            const elapsedMs = Date.now() - state.startedAt;
            container.removeEventListener("click", handleClick);
            setTimeout(() => showSuccess(elapsedMs), 500);
          }
        } else {
          state.mistakes += 1;
          state.awaitingResolve = true;
        }
      }
    }

    function showSuccess(elapsedMs) {
      // Covers the whole tray frame (not just the card grid), so it's
      // appended to the tray frame directly rather than nested inside the
      // grid's own container.
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
          <p class="memory-success-text">All memories found!</p>`;
        frame.appendChild(overlay);
      }
      setTimeout(() => {
        onResult({ completed: true, mistakes: state.mistakes, elapsedMs });
      }, 2200);
    }

    container.addEventListener("click", handleClick);
    render();
  }

  window.KG.minigames.memoryFlip = { start };
})();
