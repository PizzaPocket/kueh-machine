// Audio stub. No autoplay before user interaction — every entry point here
// is only ever called from inside a click/keydown handler. No actual audio
// files exist yet, so this just tracks enabled state until real assets land.

window.KG = window.KG || {};

(function () {
  let musicEnabled = true;
  let soundEnabled = true;
  let unlocked = false;

  function unlockOnFirstInteraction() {
    unlocked = true;
  }

  function setMusicEnabled(value) {
    musicEnabled = !!value;
  }

  function setSoundEnabled(value) {
    soundEnabled = !!value;
  }

  function playMusic(_trackId) {
    if (!unlocked || !musicEnabled) return;
    // No audio assets yet — stub only.
  }

  function stopMusic() {
    // No-op until real audio exists.
  }

  function playSfx(_sfxId) {
    if (!unlocked || !soundEnabled) return;
    // No audio assets yet — stub only.
  }

  window.KG.audio = {
    unlockOnFirstInteraction,
    setMusicEnabled,
    setSoundEnabled,
    playMusic,
    stopMusic,
    playSfx
  };
})();
