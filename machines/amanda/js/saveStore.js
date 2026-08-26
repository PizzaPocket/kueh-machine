// Versioned localStorage save. Safe defaults, safe parse, explicit reset.
// If the shared account system is wired in later, this stays the offline
// fallback — nothing here should ever require a signed-in account.

window.KG = window.KG || {};

(function () {
  const SAVE_KEY = "kuehGameSaveV2";
  const SAVE_VERSION = 1;

  function defaultSave() {
    return {
      version: SAVE_VERSION,
      completedChapters: [],
      unlockedCards: [],
      // Coarse checkpoint for "Continue the day" — { chapterId, checkpoint }
      // or null. Checkpoint is one of: arrival, before-minigame,
      // after-minigame, before-deduction. Cleared once a card unlocks —
      // at that point there's nothing left to resume.
      activeProgress: null,
      // Fine-grained in-minigame progress, keyed by chapter id — e.g.
      // { lockedPieceIds, beatsShown } for Restore the Pattern, or
      // { completedLayers, beatsShown } for Build the Layers. Lets pausing
      // and resuming (or leaving and using "Continue the day") rebuild the
      // exact board instead of restarting it. Cleared once that chapter's
      // minigame is completed.
      minigameProgress: {},
      settings: {
        music: true,
        sound: true,
        textSpeed: "normal" // "slow" | "normal" | "fast" — not yet wired to a typing effect
      }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || parsed.version !== SAVE_VERSION) {
        console.warn("KG.saveStore: unknown save version, starting fresh");
        return defaultSave();
      }
      const base = defaultSave();
      return {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings || {}) }
      };
    } catch (err) {
      console.warn("KG.saveStore: failed to load save, using defaults", err);
      return defaultSave();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.warn("KG.saveStore: failed to write save", err);
      return false;
    }
  }

  function reset() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      console.warn("KG.saveStore: failed to clear save", err);
    }
    return defaultSave();
  }

  function hasExistingSave() {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (err) {
      return false;
    }
  }

  window.KG.saveStore = { load, save, reset, hasExistingSave, defaultSave, SAVE_VERSION };
})();
