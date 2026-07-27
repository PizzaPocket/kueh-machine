/* Care Island — wisdom lines (DRAFT, NOT FINAL)
   Natalia asked to review/edit tone and wording before these are treated
   as final copy. Placeholder set below so the app is fully wired and
   testable — swap freely. */

const WISDOMS = [
  { tone: "joking", text: "The butterfly has one job. It is doing it beautifully and slowly." },
  { tone: "wise", text: "A rabbit doesn't apologize for resting between bursts of moving." },
  { tone: "funny", text: "Meadow's fully bloomed. The rabbit is unreasonably smug about it." },
  { tone: "wise", text: "Small, unhurried things are still things. This counts." },
  { tone: "joking", text: "You did the thing. The butterfly, frankly, did less." }
];

// Deterministic pick per day — same day always shows the same line.
function pickWisdom(dayOfYear) {
  const idx = dayOfYear % WISDOMS.length;
  return WISDOMS[idx];
}
