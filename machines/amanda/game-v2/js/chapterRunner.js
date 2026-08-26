// Drives a chapter through its beats using structured data from
// js/chapters/*.js. One runner, any chapter — chapters are never
// hard-coded into separate page logic.
//
// Two presentation modes:
//   - "cafe scene": full-bleed background, the customer centered on screen,
//     dialogue/prompts pinned to the bottom. Used for arrival through to
//     the card unlock.
//   - "tray stage": the wood tray frame, used only for the minigame.
//
// Flow: arrival -> minigame-playing -> clue-unlocked
//       -> deduction (retry loop, no hard fail) -> restored -> cardUnlock
//       -> farewell (kueh exits) -> back to the title screen
//
// Autosave checkpoints (save.activeProgress = {chapterId, checkpoint}),
// used by the homepage's "Continue the day": arrival, before-minigame,
// after-minigame, before-deduction. Cleared once the card unlocks — from
// there the chapter is done, nothing left to resume. Pausing mid-minigame
// and resuming restarts the board (per spec) but keeps everything earlier.

window.KG = window.KG || {};

(function () {
  let run = null;

  // Phase a resumed run should land on for each saved checkpoint.
  const CHECKPOINT_PHASE = {
    "arrival": "arrival",
    "before-minigame": "minigame-playing",
    "after-minigame": "clue-unlocked",
    "before-deduction": "deduction"
  };

  function startChapter(chapterId) {
    // A fresh start (first attempt, or restartChapter()) should never
    // resume a minigame mid-way through -- without this, restarting a
    // chapter still handed the minigame its old savedState, since that's
    // keyed by chapter id independently of the dialogue/deduction state
    // that startChapter() otherwise resets.
    const save = window.KG.state.current.save;
    if (save.minigameProgress[chapterId]) {
      delete save.minigameProgress[chapterId];
      window.KG.saveStore.save(save);
    }

    run = {
      chapterId,
      phase: "arrival",
      lineIndex: 0,
      hasEntered: false,
      // Each kueh starts out worried — they're unsettled about the memory
      // they're missing — until their own first line sets something else.
      lastCharacterExpression: "worried",
      paused: false
    };
    saveCheckpoint("arrival");
  }

  // Used by the homepage's "Continue the day" to drop back into a chapter
  // at its last saved checkpoint, skipping straight past the entrance
  // animation since the player has already seen it this session.
  function resumeChapter(chapterId, checkpoint) {
    run = {
      chapterId,
      phase: CHECKPOINT_PHASE[checkpoint] || "arrival",
      lineIndex: 0,
      hasEntered: true,
      // Each kueh starts out worried — they're unsettled about the memory
      // they're missing — until their own first line sets something else.
      lastCharacterExpression: "worried",
      paused: false
    };
  }

  function saveCheckpoint(checkpoint) {
    const save = window.KG.state.current.save;
    save.activeProgress = { chapterId: run.chapterId, checkpoint };
    window.KG.saveStore.save(save);
  }

  function clearActiveProgress() {
    const save = window.KG.state.current.save;
    save.activeProgress = null;
    window.KG.saveStore.save(save);
  }

  function currentChapter() {
    return window.KG.chapters[run.chapterId];
  }

  function shuffledDeductionChoices(deduction) {
    if (!run.deductionChoiceOrder) {
      run.deductionChoiceOrder = deduction.choices.map((choice) => choice.id);
      for (let i = run.deductionChoiceOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [run.deductionChoiceOrder[i], run.deductionChoiceOrder[j]] = [run.deductionChoiceOrder[j], run.deductionChoiceOrder[i]];
      }
    }
    return run.deductionChoiceOrder
      .map((id) => deduction.choices.find((choice) => choice.id === id))
      .filter(Boolean);
  }

  function goToScreen(screen) {
    window.KG.state.current.screen = screen;
    run = null;
    window.KG.render();
  }

  function lineExpression(line, fallback) {
    if (line.speaker === "character") {
      const expr = line.expression || fallback;
      run.lastCharacterExpression = expr;
      return expr;
    }
    return run.lastCharacterExpression || fallback;
  }

  function currentExpression(chapter) {
    if (run.phase === "arrival") {
      return lineExpression(chapter.arrivalLines[run.lineIndex], "neutral");
    }
    if (run.phase === "clue-unlocked") return "happy";
    if (run.phase === "deduction") return "thinking";
    if (run.phase === "deduction-retry") {
      return lineExpression(chapter.deduction.retryDialogue[run.lineIndex], "worried");
    }
    if (run.phase === "restored") {
      return lineExpression(chapter.restoredLines[run.lineIndex], "happy");
    }
    return "neutral";
  }

  // Phases that share the plain cafe-scene shape (wrapCafeScene) --
  // used both to build the dialogue body below and to decide whether a
  // phase change can be patched in place (see patchCafeScene) instead of
  // a full teardown/rebuild of the background+character+counter.
  const CAFE_SCENE_PHASES = ["arrival", "clue-unlocked", "deduction", "deduction-retry", "restored"];

  function buildCafeSceneBody(chapter) {
    if (run.phase === "arrival") {
      const isLast = run.lineIndex === chapter.arrivalLines.length - 1;
      return window.KG.dialogue.renderLine(chapter.character, chapter.arrivalLines[run.lineIndex], {
        continueLabel: isLast ? "Help this kueh!" : "Next"
      });
    }
    if (run.phase === "clue-unlocked") {
      return `
        <div class="dialogue-group">
          <div class="dialogue-bar" role="status">
            <p class="dialogue-speaker">Clue found</p>
            <p class="dialogue-text">${chapter.clueUnlockedText}</p>
          </div>
          <button type="button" class="primary-btn dialogue-cta" data-action="dialogue-advance">Continue</button>
        </div>`;
    }
    if (run.phase === "deduction") {
      const d = chapter.deduction;
      const choices = shuffledDeductionChoices(d)
        .map((c) => `<button type="button" class="choice-btn" data-action="deduction-choice" data-choice-id="${c.id}">${c.text}</button>`)
        .join("");
      return `
        <div class="dialogue-group">
          <div class="dialogue-bar deduction-bar">
            <p class="deduction-prompt">${d.prompt}</p>
            <div class="deduction-choices">${choices}</div>
          </div>
        </div>`;
    }
    if (run.phase === "deduction-retry") {
      const isLast = run.lineIndex === chapter.deduction.retryDialogue.length - 1;
      return window.KG.dialogue.renderLine(chapter.character, chapter.deduction.retryDialogue[run.lineIndex], {
        continueLabel: isLast ? "Try again" : "Next"
      });
    }
    if (run.phase === "restored") {
      return window.KG.dialogue.renderLine(chapter.character, chapter.restoredLines[run.lineIndex]);
    }
    return "";
  }

  function render() {
    const chapter = currentChapter();

    if (run.paused) {
      return wrapPauseOverlay(chapter);
    }

    if (run.phase === "minigame-playing") {
      return wrapTrayStage(`<div class="minigame-mount" id="minigameMount"></div>`);
    }

    if (run.phase === "cardUnlock") {
      return wrapCardReveal(chapter);
    }

    if (run.phase === "farewell") {
      return wrapFarewell(chapter);
    }

    const bodyHtml = buildCafeSceneBody(chapter);
    const expression = currentExpression(chapter);
    return wrapCafeScene(chapter, expression, bodyHtml);
  }

  // Advancing dialogue/choosing a deduction answer happens far more
  // often than any other click in the game, and previously each one
  // called window.KG.render(), which replaces #screenRoot's entire
  // innerHTML -- tearing down and recreating the background, character,
  // and counter images every single time, which is what caused the
  // visible flash on every click. When both the old and new phase stay
  // within the plain cafe-scene shape, patch the character image and
  // dialogue box in place instead and skip the full re-render entirely.
  // Any transition into a structurally different screen (minigame,
  // card reveal, farewell, pause) still falls through to the full
  // window.KG.render() exactly as before.
  function patchCafeScene() {
    const scene = document.querySelector(".cafe-scene");
    if (!scene) return false;
    const charImg = scene.querySelector(".cafe-character-img");
    const progressEl = scene.querySelector(".chapter-progress");
    const bottomEl = scene.querySelector(".cafe-bottom");
    if (!charImg || !progressEl || !bottomEl) return false;

    const chapter = currentChapter();
    const expression = currentExpression(chapter);
    const portrait = chapter.character.portraits[expression] || chapter.character.portraits.neutral;
    if (charImg.getAttribute("src") !== portrait) {
      charImg.setAttribute("src", portrait);
    }
    // Never carries an enter/exit animation class mid-scene -- those only
    // apply on a chapter's very first render or its farewell screen,
    // neither of which goes through this patch path.
    charImg.className = "cafe-character-img";

    progressEl.outerHTML = renderChapterProgress(chapter);
    bottomEl.innerHTML = buildCafeSceneBody(chapter);
    return true;
  }

  // Tries the in-place patch first; falls back to the normal full
  // render (which every other action in the game still uses untouched)
  // whenever the phase change crosses into a different screen shape.
  function renderCafeSceneUpdate(previousPhase) {
    const canPatch = !run.paused
      && CAFE_SCENE_PHASES.indexOf(previousPhase) !== -1
      && CAFE_SCENE_PHASES.indexOf(run.phase) !== -1
      && patchCafeScene();
    if (!canPatch) {
      window.KG.render();
    }
  }

  // Which of the three progress stages (conversation / memory game /
  // remember) is done, current, or upcoming, driven by the story phase.
  function progressStageStatus() {
    if (run.phase === "arrival") {
      return { conversation: "current", memory: "upcoming", remember: "upcoming" };
    }
    if (run.phase === "minigame-playing") {
      return { conversation: "completed", memory: "current", remember: "upcoming" };
    }
    return { conversation: "completed", memory: "completed", remember: "current" };
  }

  const DROPLET_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2C12 2 5 10.5 5 15.2A7 7 0 0 0 19 15.2C19 10.5 12 2 12 2z" fill="#F6C445" stroke="#3D2B1F" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  function progressStage(label, icon, status) {
    const statusLabel = status === "completed" ? "done" : status === "current" ? "in progress" : "not started yet";
    const badge = status === "completed" ? '<span class="progress-stage-check" aria-hidden="true">✓</span>' : "";
    return `
      <span class="progress-stage is-${status}" aria-label="${label}: ${statusLabel}">
        <span class="progress-stage-icon" aria-hidden="true">${icon}</span>
        ${badge}
      </span>`;
  }

  function renderChapterProgress(chapter) {
    const day = Object.keys(window.KG.chapters).indexOf(run.chapterId) + 1;
    const status = progressStageStatus();
    return `
      <div class="chapter-progress" role="group" aria-label="Chapter progress">
        <p class="chapter-progress-label">Day ${day} · ${chapter.character.displayName}</p>
        <div class="chapter-progress-stages">
          ${progressStage("Conversation", "💬", status.conversation)}
          ${progressStage("Memory Game", "🧩", status.memory)}
          ${progressStage("Remember", DROPLET_SVG, status.remember)}
        </div>
      </div>`;
  }

  function wrapCafeScene(chapter, expression, bodyHtml) {
    const enterClass = run.hasEntered ? "" : "kueh-enter";
    run.hasEntered = true;
    const portrait = chapter.character.portraits[expression] || chapter.character.portraits.neutral;

    // Four layers, in order: rear background, animated character, transparent
    // foreground counter, then HTML dialogue UI on top of everything. The
    // first three share one fixed 1672:941 coordinate system so they always
    // scale together. Cards/Chapters are homepage-only for now — not
    // rendered here.
    return `
      <div class="cafe-scene">
        <div class="cafe-stage">
          <img class="cafe-layer cafe-layer-bg" src="assets/scenes/cafe/customer-menu-background-v2.jpg" alt="" decoding="sync">
          <div class="cafe-character-slot">
            <img class="cafe-character-img ${enterClass}" src="${portrait}" alt="${chapter.character.displayName}" decoding="sync">
          </div>
          <img class="cafe-layer cafe-layer-counter" src="assets/scenes/cafe/customer-arrival-counter-v2.webp" alt="" decoding="sync">
        </div>
        <button type="button" class="icon-btn cafe-home-btn" data-action="go-home" aria-label="Home"><img src="assets/ui/beary-home-icon-v1.png" alt=""></button>
        ${renderChapterProgress(chapter)}
        <button type="button" class="icon-btn cafe-pause-btn" data-action="open-pause" aria-label="Pause">⏸</button>
        <div class="cafe-bottom">${bodyHtml}</div>
      </div>`;
  }

  function wrapTrayStage(innerHtml) {
    const chapter = currentChapter();
    const portrait = chapter.character.portraits.thinking || chapter.character.portraits.neutral;
    setTimeout(mountMinigame, 0);
    // Tray renders off-screen (see .tray-stage-frame) then slides up into
    // place, same as V1's bottom sheet — added on a tick so the browser
    // paints the off-screen position first and actually has something to
    // transition from.
    setTimeout(() => {
      const frame = document.getElementById("trayStageFrame");
      if (frame) frame.classList.add("is-open");
    }, 0);
    return `
      <div class="tray-stage">
        <div class="cafe-stage">
          <img class="cafe-layer cafe-layer-bg" src="assets/scenes/cafe/customer-menu-background-v2.jpg" alt="" decoding="sync">
          <div class="cafe-character-slot">
            <img class="cafe-character-img" src="${portrait}" alt="${chapter.character.displayName}" decoding="sync">
          </div>
          <img class="cafe-layer cafe-layer-counter" src="assets/scenes/cafe/customer-arrival-counter-v2.webp" alt="" decoding="sync">
        </div>
        <button type="button" class="icon-btn tray-home-btn" data-action="go-home" aria-label="Home"><img src="assets/ui/beary-home-icon-v1.png" alt=""></button>
        <button type="button" class="icon-btn tray-pause-btn" data-action="open-pause" aria-label="Pause">⏸</button>
        <div class="tray-stage-frame" id="trayStageFrame">
          <div class="tray-stage-inner">${innerHtml}</div>
        </div>
      </div>`;
  }

  // Shown right after "Continue" on the card reveal: same café scene, kueh
  // slides out to the right. Once the exit finishes we return to the title
  // screen — there's only one chapter in this vertical slice, so the "new
  // kueh enters from the left" half of the loop is left for when more
  // chapters exist.
  function wrapFarewell(chapter) {
    const portrait = chapter.character.portraits.happy || chapter.character.portraits.neutral;
    return `
      <div class="cafe-scene">
        <div class="cafe-stage">
          <img class="cafe-layer cafe-layer-bg" src="assets/scenes/cafe/customer-menu-background-v2.jpg" alt="" decoding="sync">
          <div class="cafe-character-slot">
            <img class="cafe-character-img kueh-exit" src="${portrait}" alt="${chapter.character.displayName}" decoding="sync">
          </div>
          <img class="cafe-layer cafe-layer-counter" src="assets/scenes/cafe/customer-arrival-counter-v2.webp" alt="" decoding="sync">
        </div>
      </div>`;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  // Dims the same café scene behind a small menu rather than closing the
  // chapter outright — pausing never discards progress on its own; each
  // option below decides what actually happens next.
  function wrapPauseOverlay(chapter) {
    const portrait = chapter.character.portraits.neutral;
    return `
      <div class="cafe-scene">
        <div class="cafe-stage">
          <img class="cafe-layer cafe-layer-bg" src="assets/scenes/cafe/customer-menu-background-v2.jpg" alt="" decoding="sync">
          <div class="cafe-character-slot">
            <img class="cafe-character-img" src="${portrait}" alt="${chapter.character.displayName}" decoding="sync">
          </div>
          <img class="cafe-layer cafe-layer-counter" src="assets/scenes/cafe/customer-arrival-counter-v2.webp" alt="" decoding="sync">
        </div>
        <div class="pause-overlay">
          <div class="pause-dim"></div>
          <div class="pause-panel" role="dialog" aria-label="Paused">
            <h2 class="pause-heading">Paused</h2>
            <button type="button" class="primary-btn pause-btn" data-action="resume-pause">Resume</button>
            <button type="button" class="secondary-btn pause-btn" data-action="save-and-home">Save &amp; return home</button>
            <button type="button" class="secondary-btn pause-btn" data-action="restart-chapter">Restart this chapter</button>
            <button type="button" class="secondary-btn pause-btn" data-action="open-settings">Settings</button>
          </div>
        </div>
      </div>`;
  }

  // Replaces the plain "Memory restored" dialogue box with a short reveal,
  // overlaid on top of the same café scene (background, kueh, counter) the
  // player has been in the whole chapter — not a separate screen. Dims the
  // scene, brings the card up with a gentle rise/wobble/settle, glow pulse
  // behind it, then reveals the View card / Continue actions once the
  // animation has settled.
  function wrapCardReveal(chapter) {
    const cardHtml = window.KG.collection.renderCharacterCard(chapter.card, {
      extraClass: "card-reveal-card"
    });
    const portrait = chapter.character.portraits.happy || chapter.character.portraits.neutral;

    setTimeout(() => {
      const actions = document.getElementById("cardRevealActions");
      if (actions) actions.hidden = false;
    }, prefersReducedMotion() ? 260 : 1500);

    return `
      <div class="cafe-scene">
        <div class="cafe-stage">
          <img class="cafe-layer cafe-layer-bg" src="assets/scenes/cafe/customer-menu-background-v2.jpg" alt="" decoding="sync">
          <div class="cafe-character-slot">
            <img class="cafe-character-img" src="${portrait}" alt="${chapter.character.displayName}" decoding="sync">
          </div>
          <img class="cafe-layer cafe-layer-counter" src="assets/scenes/cafe/customer-arrival-counter-v2.webp" alt="" decoding="sync">
        </div>
        <div class="card-reveal-overlay">
          <div class="card-reveal-dim"></div>
          <div class="card-reveal-content">
            <div class="card-reveal-text">
              <h2 class="card-reveal-heading">Memory restored!</h2>
              <p class="card-reveal-subheading">You unlocked a new card.</p>
            </div>
            <div class="card-reveal-stack">
              <img src="assets/effects/minigame-success-sparkles-v1.png" alt="" class="card-reveal-sparkle">
              <div class="card-reveal-glow"></div>
              ${cardHtml}
            </div>
            <div class="card-reveal-actions" id="cardRevealActions" hidden>
              <button type="button" class="secondary-btn" data-action="open-collection" data-return-screen="title">View cards</button>
              <button type="button" class="primary-btn" data-action="continue-after-unlock">Continue</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function mountMinigame() {
    const mount = document.getElementById("minigameMount");
    if (!mount) return;
    const chapter = currentChapter();
    const gameType = chapter.minigame.game;

    function onMinigameDone() {
      const save = window.KG.state.current.save;
      delete save.minigameProgress[chapter.id];
      window.KG.saveStore.save(save);
      run.phase = "clue-unlocked";
      saveCheckpoint("after-minigame");
      window.KG.render();
    }

    if (gameType === "restorePattern" || gameType === "buildLayers" || gameType === "sharedTray" || gameType === "foldAWish" || gameType === "shapePaintShine") {
      const save = window.KG.state.current.save;
      // Same "no neutral fallback" reasoning as Memory Flip below — the
      // success moment should always be the happy expression specifically.
      const config = Object.assign({}, chapter.minigame.config, {
        savedState: save.minigameProgress[chapter.id] || null,
        successPortrait: chapter.character.portraits.happy,
        onProgress: (progressState) => {
          save.minigameProgress[chapter.id] = progressState;
          window.KG.saveStore.save(save);
        }
      });
      window.KG.minigames[gameType].start(mount, config, onMinigameDone);
      return;
    }

    // Intentionally no neutral fallback here — the success moment should
    // always show the happy expression specifically. If a character has
    // no happy sprite yet, that's a missing-asset gap to flag, not paper
    // over with the wrong emotion.
    const config = Object.assign({}, chapter.minigame.config, {
      successPortrait: chapter.character.portraits.happy
    });
    window.KG.minigames.memoryFlip.start(mount, config, onMinigameDone);
  }

  function advanceLines(lines) {
    if (run.lineIndex < lines.length - 1) {
      run.lineIndex += 1;
    } else {
      run.lineIndex = 0;
      return true; // finished this line set
    }
    return false;
  }

  function handleAction(action, target) {
    const chapter = currentChapter();

    if (action === "dialogue-advance") {
      const previousPhase = run.phase;
      if (run.phase === "arrival") {
        if (advanceLines(chapter.arrivalLines)) {
          run.phase = "minigame-playing";
          saveCheckpoint("before-minigame");
        }
      } else if (run.phase === "clue-unlocked") {
        run.phase = "deduction";
        saveCheckpoint("before-deduction");
      } else if (run.phase === "deduction-retry") {
        if (advanceLines(chapter.deduction.retryDialogue)) run.phase = "deduction";
      } else if (run.phase === "restored") {
        if (advanceLines(chapter.restoredLines)) {
          unlockCardAndFinish(chapter);
          return;
        }
      }
      renderCafeSceneUpdate(previousPhase);
      return;
    }

    if (action === "deduction-choice") {
      const choice = chapter.deduction.choices.find((c) => c.id === target);
      if (!choice) return;
      const previousPhase = run.phase;
      run.phase = choice.correct ? "restored" : "deduction-retry";
      run.lineIndex = 0;
      renderCafeSceneUpdate(previousPhase);
    }
  }

  // Next chapter in registration order, or null if this was the last one.
  function nextChapterId(chapterId) {
    const ids = Object.keys(window.KG.chapters);
    const idx = ids.indexOf(chapterId);
    if (idx === -1 || idx === ids.length - 1) return null;
    return ids[idx + 1];
  }

  // "Continue" on the card-reveal screen: dismiss the reveal back to the
  // plain café scene, let the kueh walk off to the right, then either bring
  // in the next kueh — entering from the left, same as any chapter's first
  // arrival — or return to the title screen if that was the last chapter.
  // Story state was already saved by unlockCardAndFinish.
  function finishReveal() {
    const finishedChapterId = run.chapterId;
    run.phase = "farewell";
    window.KG.render();
    setTimeout(() => {
      const nextId = nextChapterId(finishedChapterId);
      if (nextId) {
        startChapter(nextId);
        window.KG.render();
      } else {
        goToScreen("title");
      }
    }, prefersReducedMotion() ? 150 : 900);
  }

  // Used by the home button to bail out of an in-progress chapter straight
  // to the title screen, from any phase.
  function exitToTitle() {
    goToScreen("title");
  }

  function unlockCardAndFinish(chapter) {
    const save = window.KG.state.current.save;
    if (save.completedChapters.indexOf(chapter.id) === -1) {
      save.completedChapters.push(chapter.id);
    }
    if (save.unlockedCards.indexOf(chapter.card.id) === -1) {
      save.unlockedCards.push(chapter.card.id);
    }
    save.activeProgress = null; // checkpoint 5: card unlocked — nothing left to resume
    window.KG.saveStore.save(save);
    run.phase = "cardUnlock";
    window.KG.render();
  }

  // ---------- Pause menu actions ----------

  function openPause() {
    run.paused = true;
    window.KG.render();
  }

  function resumePause() {
    run.paused = false;
    window.KG.render();
  }

  // Checkpoints are saved as the story reaches them, so by the time pause
  // is open the latest one is already on disk — this just leaves.
  function saveAndReturnHome() {
    goToScreen("title");
  }

  function restartChapter() {
    const confirmed = window.confirm("Restart this chapter from the beginning?");
    if (!confirmed) return;
    startChapter(run.chapterId);
    window.KG.render();
  }

  window.KG.chapterRunner = {
    startChapter,
    resumeChapter,
    render,
    handleAction,
    finishReveal,
    exitToTitle,
    openPause,
    resumePause,
    saveAndReturnHome,
    restartChapter,
    isActive: () => !!run,
    currentChapterId: () => (run ? run.chapterId : null)
  };
})();
