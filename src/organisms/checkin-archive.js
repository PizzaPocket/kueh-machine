// Organism: the day after check-in, archives the Check In section and
// retires the Timeline's scissors-cut apparatus that reveals it — neither
// is deleted, both are just hidden via CSS classes (index.html: .is-
// archived, .scissors-archived), so they can be restored for a future
// incarnation of the site. Leveling Up needs no gating here at all — it's
// plain always-visible markup in index.html now, same as Getting Started.

const GATE_UTC = Date.UTC(2026, 6, 29, 16, 0, 0); // 30 July 2026 00:00 SGT — the day after the 29 July check-in

// TEMP, for local preview ahead of the real date — reset to false before
// pushing so the site reverts to gating on the real date check.
const FORCE_PREVIEW = false;

export function init() {
  const isPastCheckin = FORCE_PREVIEW || Date.now() >= GATE_UTC;
  if (!isPastCheckin) return;

  const checkIn = document.getElementById('check-in');
  if (checkIn) checkIn.classList.add('is-archived');

  const timeline = document.getElementById('timeline');
  if (timeline) timeline.classList.add('scissors-archived');
}
