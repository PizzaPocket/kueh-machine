// Reconstructs historically introduced brief content while the archive's
// Time Machine moves through the project. The timestamp is the actual commit
// that added Leveling Up: 27 July 2026, 10:06:32pm SGT.

const LEVELING_UP_LIVE_UTC = Date.UTC(2026, 6, 27, 14, 6, 32);

export function init() {
  const levelingUpIsLive = Date.now() >= LEVELING_UP_LIVE_UTC;

  document.querySelectorAll('[data-history-after="leveling-up"]').forEach((element) => {
    element.hidden = !levelingUpIsLive;
  });

  document.querySelectorAll('[data-history-before="leveling-up"]').forEach((element) => {
    element.hidden = levelingUpIsLive;
  });
}
