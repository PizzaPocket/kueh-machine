# Drink Lah (Kueh Lupis water tracker)

by Natalia — kuehmachine.com

## Concept

A water-intake tracker where your daily progress is visualised as kueh
lupis being made, from raw rice to the finished, coconut-and-syrup
plate. Tap anywhere on the screen to log a drink — drag a glass to
choose the amount (max 250ml per log), confirm, and the kueh advances
through its 6 stages as your cumulative total climbs toward the day's
goal. Two of those stages play a real video clip on transition (the
leaf folding shut, the parcels boiling) rather than a static crossfade,
with the rest using bespoke transition techniques (fast frame-swap,
simple crossfade, or a top-to-bottom wipe) matched to what's actually
happening in that stage. The finished stage — and its fun fact about
kueh lupis — only appears once the goal is truly reached, never early.

Auntie-voiced micro-copy runs throughout: a line per stage as it's
cooking, a live reaction near the glass as you drag (picked from a
bracket matching how much you're about to log), and a daily "Oh
ya—..." tip under the home counter, keyed to whatever activity level
is set on the Goal screen.

The kueh itself still resets to stage 1 every day — that reset is
deliberate, the same shape as the machine's other parts, a small
repeated act completing within a single cycle. What changed: the app
now also remembers each day's total behind the scenes, so a History
tab can show it back to you. The daily reset is about what you *see*
on the home screen, not about throwing the data away.

A Goal tab replaces the old free-entry goal screen with a calculator:
pick sex and activity level, drag or nudge weight and height, and it
recommends a daily ml target (editable anytime — profile changes
recompute the number live). A History tab adds Day / Week / Month
views: today's total plus an hourly bar chart, a 7-day bar chart
against your goal line with weekly stats, and a month calendar with
per-day totals. Tapping a bar in the Day or Week chart pops a small
tooltip with the exact ml logged. A small "Day N" counter next to the
kicker tracks days since first opening the app — separate from the
kueh's own daily reset.

## Look & feel

Visual design ported from a Claude Design Canvas handoff (warm
cream-and-terracotta "Organic" system, Caprasimo display type over
Figtree body text). Full-bleed kueh art with a rising water-tint wash
behind it doubling as the progress indicator — no separate progress
bar. Bottom sheet for logging, full-screen takeover for the goal
setting.

## Feature checklist

- [x] Tap-anywhere logging: drag-to-fill glass, live Singlish reaction by amount dragged
- [x] 6-stage kueh progression, cumulative ml vs. goal (goal split into 4 even mid-stages; finished stage only at true 100%)
- [x] Per-stage bespoke transitions: fold (video), tie (crossfade), boil (video + ambient bob/steam), serve (video + wipe)
- [x] Auntie-voiced stage lines, live drag reaction, daily "Oh ya—" tip under the home counter
- [x] Goal calculator: sex/activity/weight/height (drag or ± buttons) → recommended ml/day, editable anytime
- [x] Small floating tab bar (Home / History / Goal), persistent across screens
- [x] "Day N" counter beside the home kicker — days since first open, independent of the kueh's daily reset
- [x] History — Day: today's total + hourly bar chart (fixed 500ml scale, contrast color under/over)
- [x] History — Week: 7-day bar chart vs. goal line, average/day, average % goal reached, best day
- [x] History — Month: calendar grid, per-day totals, goal-reached days marked
- [x] Tap a Day/Week bar for an exact-ml tooltip
- [x] Kueh resets automatically at the next calendar day; history persists behind it
- [x] iOS safe-area aware (notch/Dynamic Island/home indicator) via `viewport-fit=cover`

## Known gaps

- `drizzle-motion.mp4`'s first frame doesn't match the boiling-pot
  frame it cuts from (starts on the bare folded parcel instead) —
  cosmetic jump at that one transition, flagged and shipped as-is per
  Natalia's call; fixable with a re-export.
- Videos can't seek to a non-zero timestamp (tested, always snaps back
  to 0) — a cold page reload mid-stage shows the clip's first frame
  rather than its last, unlike right after watching it play through.
  Fine as a resting state, just a minor inconsistency; a re-export
  with proper seek support would fix it.
- Fact-card copy in `lupis-wisdom.js` is draft, reused from an earlier
  project — worth a final read-through.
- The goal calculator's formula (30ml/kg + a small height term + sex
  and activity bonuses) is a light, explainable estimate, not a
  medical one — tuned so the default profile lands on a clean number,
  not sourced from a specific guideline. Worth a sanity-check read.
- `water-jug.png` is a real cutout (the original photo's checker
  studio backdrop is genuinely removed, not masked), but the handle
  loop still shows a faint soft blur where the checker pattern was
  visible *through* the glass in the original shot — not fixable by
  cutting the background out further, since that's the object's own
  photographed content. A source photo on a plain background would
  cut cleaner if ever worth re-shooting.
- Week's "average goal reached %" and Month's "under/over goal"
  summary are my own reasonable definitions (per-day % capped at 100
  then averaged across all 7 days; month total vs. goal × days elapsed)
  since the handoff screenshots didn't specify the exact math — worth
  a read to confirm they match what you had in mind.

## Files

- `index.html` / `style.css` / `script.js` — structure, styling, all state & stage logic
- `lupis-wisdom.js` — fun-fact copy for the completed stage (draft)
- `assets/lupis/` — the 7 kueh images/videos + `water-jug.png` (History and Goal screens)
