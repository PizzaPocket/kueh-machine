# Care Island

by Natalia — kuehmachine.com

## Concept

A tap-based self-care nudge tool. You define at least three habits (built-in
leveled ones — water, exercise, walk — plus fully custom binary habits like
vitamins or journaling), and each day's care shows up as a living island
scene: sky, water, and land reveal in proportion to how much of today's list
is done. The scene itself rotates on a fixed daily cycle — lake & swans,
forest & fireflies, meadow & rabbit and butterfly — never random, always
predictable. Hit 100% and the scene's signature creature appears alongside
one short "wisdom" line for the day.

Nothing accumulates across days. No streaks, no history, no growing asset —
each day is a full cycle that resets clean. The connection to kuehmachine.com
is in that shape: small inputs producing a complete, living output within a
single cycle, repetition without stockpiling.

## Look & feel

Flat, torn-paper cutout / collage style. Warm paper background, muted
earth-and-accent palette, deterministic jagged "cut" edges on every land and
water shape (procedurally generated, not random per load — the island's
silhouette stays put, only color and reveal change). Calm, unhurried pacing;
no gamified urgency.

## Feature checklist

- [x] Onboarding: set goals for water/exercise/walk, add custom habits (min 3 total to begin)
- [x] Daily scene rotation (lake / forest / meadow), date-derived, no storage needed
- [x] Progressive reveal in 5 tiers based on % of habits completed
- [x] Tap-to-log UI: preset levels for leveled habits, single tap for binary habits
- [x] Today's progress persists via localStorage (keyed by date, no cross-day accumulation)
- [x] Signature creature + daily wisdom line unlock at 100%
- [x] Settings screen to edit habit list without losing today's progress
- [ ] Wisdom line copy — drafted in `wisdoms.js`, **pending Natalia's review before final**

## Files

- `index.html` / `style.css` / `script.js` — structure, styling, state & logic
- `scenes.js` — procedural torn-paper SVG scene rendering
- `wisdoms.js` — daily wisdom line copy (draft, not final)
