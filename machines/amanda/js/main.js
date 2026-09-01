// Top-level game state, screen router, and single delegated event listener.
// Screens: title | chapter | collection | chapters
// Settings is not a screen — it's a popup (like the pause menu) that can
// layer on top of any of the above without navigating away from it.

window.KG = window.KG || {};

(function () {
  // Lucide Settings icon, inlined so it inherits the button's currentColor
  // and never falls back to a platform-specific emoji glyph.
  const SETTINGS_ICON_SVG = `
    <svg class="hero-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;

  const state = {
    current: {
      screen: "title",
      save: null,
      settingsOpen: false,
      previewCardId: null,
      chaptersReturnScreen: "title",
      collectionReturnScreen: "title"
    }
  };
  window.KG.state = state;

  function render() {
    const root = document.getElementById("screenRoot");
    const s = state.current;
    let html = "";

    if (s.screen === "title") html = renderTitle();
    else if (s.screen === "chapter") html = window.KG.chapterRunner.render();
    else if (s.screen === "collection") html = window.KG.collection.renderGrid(s.save, s.previewCardId);
    else if (s.screen === "chapters") html = renderChapters();

    if (s.settingsOpen) html += renderSettingsPopup();

    root.innerHTML = html;
    root.setAttribute("data-screen", s.screen);
  }
  window.KG.render = render;

  function renderTitle() {
    const s = state.current;
    const activeProgress = s.save.activeProgress;
    const ctaLabel = activeProgress ? "Continue the day" : "Start the day";
    const ctaAction = activeProgress ? "continue-day" : "start-day";
    // Hidden for now, regardless of completion state — still reachable via
    // Settings > Reset progress if it's needed before this comes back.
    const newGameBtn = "";

    // Background is the same 1672:941 cover-scaled coordinate system as the
    // café scene, so the Cards/Chapters hotspots line up the same way here
    // as they do mid-chapter.
    return `
      <div class="hero-full">
        <div class="cafe-stage">
          <img class="cafe-layer cafe-layer-bg" src="assets/scenes/cafe/home-menu-background-v1.jpg" alt="Beary's Kueh Shop — Beary in cafe apron and cap, behind the counter" decoding="sync">
        </div>
        ${window.KG.cafeMenu.renderHotspots()}
        ${window.KG.cafeMenu.renderMobileNav()}
        <button type="button" class="icon-btn hero-settings-btn" data-action="open-settings" aria-label="Open settings">${SETTINGS_ICON_SVG}</button>
        <div class="hero-cta-stack">
          <button type="button" class="hero-cta" data-action="${ctaAction}">
            <span class="cta-star star-1" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L22 9.2l-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.4-.6z" fill="#F6C445" stroke="#3D2B1F" stroke-width="2.2" stroke-linejoin="round"/></svg></span>
            <span class="cta-star star-2" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L22 9.2l-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.4-.6z" fill="#F6C445" stroke="#3D2B1F" stroke-width="2.2" stroke-linejoin="round"/></svg></span>
            <span class="cta-star star-3" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L22 9.2l-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.4-.6z" fill="#F6C445" stroke="#3D2B1F" stroke-width="2.2" stroke-linejoin="round"/></svg></span>
            <span class="cta-star star-4" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L22 9.2l-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.4-.6z" fill="#F6C445" stroke="#3D2B1F" stroke-width="2.2" stroke-linejoin="round"/></svg></span>
            <span class="cta-star star-5" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L22 9.2l-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.4-.6z" fill="#F6C445" stroke="#3D2B1F" stroke-width="2.2" stroke-linejoin="round"/></svg></span>
            ${ctaLabel}
          </button>
          <p class="hero-storyline">Beary helps lost kuehs piece together their memories, one sweet story at a time.</p>
          ${newGameBtn}
        </div>
      </div>`;
  }

  // Only one or two chapters exist so far, but the list is being designed
  // for a full set — pad it with generic locked rows up to this count
  // until more chapters ship.
  const TOTAL_CHAPTER_SLOTS = 6;

  function lockedChapterRow() {
    return `
      <div class="chapters-row chapters-row-locked">
        <span class="chapters-row-lock" aria-hidden="true">🔒</span>
        <div class="chapters-row-text">
          <p class="chapters-row-name">???</p>
          <p class="chapters-row-status">Locked</p>
        </div>
      </div>`;
  }

  // Minimal seed of the future "Guest Book" chapter-select screen (see
  // docs/CLAUDE-HANDOFF.md notes) — just enough for the Chapters hotspot to
  // lead somewhere real.
  //
  // Same locked/unlocked logic as the Collection page: a row only reveals
  // its real name, portrait, and "Memory restored" status once that kueh's
  // story is fully completed. No exceptions for the chapter currently in
  // progress or whichever one happens to be first — matches
  // collection.js's isUnlocked() gate exactly, both keyed off completion.
  function renderChapters() {
    const s = state.current;
    const chapterIds = Object.keys(window.KG.chapters);
    const rows = chapterIds
      .map((id) => {
        const chapter = window.KG.chapters[id];
        const done = s.save.completedChapters.indexOf(chapter.id) !== -1;
        if (!done) return lockedChapterRow();
        return `
          <button type="button" class="chapters-row" data-action="open-chapter" data-chapter-id="${chapter.id}">
            <img src="${chapter.character.portraits.neutral}" alt="" class="chapters-row-img">
            <div class="chapters-row-text">
              <p class="chapters-row-name">${chapter.character.displayName}</p>
              <p class="chapters-row-status">Memory restored</p>
            </div>
          </button>`;
      })
      .join("");
    const emptySlots = Math.max(0, TOTAL_CHAPTER_SLOTS - chapterIds.length);
    const emptyRows = new Array(emptySlots).fill(lockedChapterRow()).join("");

    return `
      <div class="screen screen-chapters">
        <div class="screen-header">
          <button type="button" class="icon-btn" data-action="close-chapters" aria-label="Close chapters"><img src="assets/ui/beary-home-icon-v1.png" alt=""></button>
          <h2>Chapters</h2>
          <span></span>
        </div>
        <div class="chapters-list">${rows}${emptyRows}</div>
        <p class="chapters-hint">More kueh are on their way.</p>
      </div>`;
  }

  // Popup, not a screen — layers on top of whatever's currently showing
  // (title, a paused chapter, collection, chapters) the same way the pause
  // menu overlays the café scene, and closing it just removes the overlay
  // rather than navigating anywhere.
  function renderSettingsPopup() {
    const settings = state.current.save.settings;
    return `
      <div class="pause-overlay settings-overlay">
        <div class="pause-dim"></div>
        <div class="pause-panel settings-panel" role="dialog" aria-label="Settings">
          <h2 class="pause-heading">Settings</h2>
          <div class="settings-list">
            <label class="settings-row">
              <span>Music</span>
              <input type="checkbox" data-setting="music" ${settings.music ? "checked" : ""}>
            </label>
            <label class="settings-row">
              <span>Sound effects</span>
              <input type="checkbox" data-setting="sound" ${settings.sound ? "checked" : ""}>
            </label>
            <label class="settings-row">
              <span>Text speed</span>
              <select data-setting="textSpeed">
                <option value="slow" ${settings.textSpeed === "slow" ? "selected" : ""}>Slow</option>
                <option value="normal" ${settings.textSpeed === "normal" ? "selected" : ""}>Normal</option>
                <option value="fast" ${settings.textSpeed === "fast" ? "selected" : ""}>Fast</option>
              </select>
            </label>
          </div>
          <button type="button" class="danger-btn" data-action="reset-save">Reset progress</button>
          <button type="button" class="primary-btn pause-btn" data-action="close-settings">Close</button>
        </div>
      </div>`;
  }

  function handleClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const s = state.current;

    window.KG.audio.unlockOnFirstInteraction();

    if (action === "start-day") {
      const firstChapterId = Object.keys(window.KG.chapters)[0];
      window.KG.chapterRunner.startChapter(firstChapterId);
      s.screen = "chapter";
      return render();
    }

    if (action === "continue-day") {
      const progress = s.save.activeProgress;
      if (!progress) return;
      window.KG.chapterRunner.resumeChapter(progress.chapterId, progress.checkpoint);
      s.screen = "chapter";
      return render();
    }

    if (action === "open-chapter") {
      const chapterId = btn.dataset.chapterId;
      const progress = s.save.activeProgress;
      if (progress && progress.chapterId === chapterId) {
        window.KG.chapterRunner.resumeChapter(chapterId, progress.checkpoint);
      } else {
        window.KG.chapterRunner.startChapter(chapterId);
      }
      s.screen = "chapter";
      return render();
    }

    if (action === "open-pause") {
      return window.KG.chapterRunner.openPause();
    }

    if (action === "resume-pause") {
      return window.KG.chapterRunner.resumePause();
    }

    if (action === "save-and-home") {
      return window.KG.chapterRunner.saveAndReturnHome();
    }

    if (action === "restart-chapter") {
      return window.KG.chapterRunner.restartChapter();
    }

    if (action === "open-collection") {
      // "View cards" on the card-reveal screen sets data-return-screen so
      // closing Collection from there goes home instead of back into the
      // customer scene the reveal was covering -- that chapter is already
      // done at that point, there's nothing left to return to mid-scene.
      s.collectionReturnScreen = btn.dataset.returnScreen || s.screen;
      s.previewCardId = null;
      s.screen = "collection";
      return render();
    }

    if (action === "preview-card") {
      s.previewCardId = btn.dataset.cardId;
      return render();
    }

    if (action === "close-card-preview") {
      s.previewCardId = null;
      return render();
    }

    if (action === "close-collection") {
      s.previewCardId = null;
      s.screen = s.collectionReturnScreen || "title";
      return render();
    }

    if (action === "open-chapters") {
      s.chaptersReturnScreen = s.screen;
      s.screen = "chapters";
      return render();
    }

    if (action === "close-chapters") {
      s.screen = s.chaptersReturnScreen || "title";
      return render();
    }

    if (action === "go-home") {
      if (window.KG.chapterRunner.isActive()) return window.KG.chapterRunner.exitToTitle();
      s.screen = "title";
      return render();
    }

    if (action === "open-settings") {
      s.settingsOpen = true;
      return render();
    }

    if (action === "close-settings") {
      s.settingsOpen = false;
      return render();
    }

    if (action === "reset-save") {
      const confirmed = window.confirm("Reset all progress? This cannot be undone.");
      if (!confirmed) return;
      s.save = window.KG.saveStore.reset();
      s.settingsOpen = false;
      s.screen = "title";
      return render();
    }

    if (action === "dialogue-advance") {
      return window.KG.chapterRunner.handleAction("dialogue-advance");
    }

    if (action === "deduction-choice") {
      return window.KG.chapterRunner.handleAction("deduction-choice", btn.dataset.choiceId);
    }

    if (action === "continue-after-unlock") {
      return window.KG.chapterRunner.finishReveal();
    }
  }

  function handleChange(e) {
    const el = e.target;
    if (!el.dataset.setting) return;
    const s = state.current;
    const key = el.dataset.setting;
    const value = el.type === "checkbox" ? el.checked : el.value;
    s.save.settings[key] = value;
    window.KG.saveStore.save(s.save);
    if (key === "music") window.KG.audio.setMusicEnabled(value);
    if (key === "sound") window.KG.audio.setSoundEnabled(value);
  }

  function init() {
    state.current.save = window.KG.saveStore.load();
    const root = document.getElementById("screenRoot");
    root.addEventListener("click", handleClick);
    root.addEventListener("change", handleChange);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.current.previewCardId) {
        state.current.previewCardId = null;
        render();
      }
    });
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
