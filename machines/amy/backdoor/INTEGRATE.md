# Capsule-open reveal — integration kit

This folder is a working prototype for a new "capsule cracking open" reveal,
built from Amy's own hand-drawn frames instead of the shrink-and-fade
animation currently in her real app. It's meant to be handed to Claude Code
inside her actual project with a prompt like: *"I want to integrate this
into my gacha machine, figure it out from the files in this folder."*

## What's in here

- **`capsule-front-1.svg` … `capsule-front-4.svg`** — the near/outer shell,
  one file per opening stage. Frame 1 is fully closed.
- **`capsule-inner-2.svg` … `capsule-inner-4.svg`** — the concave inner
  surface, stages 2-4 only. There's no `inner-1`: the capsule is sealed at
  frame 1, so there's nothing inside to show yet.
- **`amy-capsule-open-prototype.html`** — a standalone demo of the effect,
  with extra controls (color swatches, a kueh picker) added only so the
  motion could be reviewed in isolation. Those controls do **not** belong in
  the final app.
- **`onde-onde.svg`, `ang-ku-kueh.svg`, `kueh-lapis.svg`, `kueh-salat.svg`,
  `kueh-dadar.svg`** — placeholder kueh art, used only by this demo so it had
  something to reveal. **Don't carry these into the real app** — it already
  has real kueh illustrations via `KUEH_ART`/`KUEH_DATA` in `js/app.js`;
  reuse that instead of these stand-ins.

## How the effect works

Three layers stacked purely by paint order (back to front), no clip-paths,
no repositioning — all the motion comes from swapping which frame is shown:

```
inner layer  (behind)
kueh         (middle — scaled 0 → 1 across frames 1 → 4)
front layer  (in front)
```

Frame 1: only `front-1` is shown (closed), inner hidden, kueh at scale 0.
Frames 2-4: matching `front-N` and `inner-N` swap in, kueh scales up
(`0.5 → 0.8 → 1`) and fades/pops in between them. See `renderFrame()` in the
prototype's `<script>` for the exact logic — it's short and can be adapted
almost directly.

## What to actually change in the real app

1. **`js/app.js`** — `openCapsule()` currently just adds an `.opening` class
   and waits `OPEN_DURATION` (750ms) before calling `revealKueh()`. Replace
   that with a 4-step frame sequence (~200-220ms per step) that swaps the
   front/inner layer content and grows the kueh, the same way
   `renderFrame()` does here. Use the **same kueh already chosen** for the
   reveal (the app picks it via `KUEH_DATA[Math.floor(...)]` before
   `revealKueh()` runs) — feed `renderKuehArt(kueh)`'s output into the
   middle layer instead of picking from the placeholder kueh list in this
   demo.

2. **`css/style.css`** — retire `.capsule.opening svg { animation:
   capsulePop ... }` (the old shrink/fade, `capsulePop` keyframes) in favor
   of the three-layer structure. Position it to match the existing
   `.capsule` element (`left: 71%; top: 85%; width: 27%`) so it drops in
   exactly where the current capsule already sits.

3. **Color** — the real app already randomly picks blue/gold/red for the
   capsule and swaps `<use href="#capsule-COLOR">` on the closed capsule.
   These new frame SVGs are drawn in gold (band color `#BCA076`). Recolor
   them the same way this prototype does — a plain string replace of that
   hex for the chosen color — using the color already rolled in
   `pullLever()`, so the opening frames match the capsule that was cracked.

## Reference

The live prototype (with the review-only color/kueh switchers) was reviewed
at `/machines/amy/backdoor/amy-capsule-open-prototype.html` before this
handoff was written.
