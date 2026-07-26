# Kueh Machine

**By Amy** — a piece for [kuehmachine.com](https://kuehmachine.com)

## Concept

Kueh Machine simulates a gachapon capsule machine on the web: insert a coin, pull the lever, watch a capsule roll into the tray, crack it open, and meet a traditional Singaporean kueh — its name, taste, and a short bit of history. It's built for people who wouldn't otherwise go looking for this, mainly younger locals and newcomers to Singapore, and leans on the fun of "collecting" to make cultural discovery feel like play rather than homework. The connection to kuehmachine.com is as literal as it gets: this is a machine, and it makes kueh.

## Look & feel

- **Palette**: warm cream/paper background, ink-brown outlines, pastel fills (mint, blush pink, marigold, dusty coral) — lifted from a hand-illustrated kueh reference poster.
- **Type**: "Patrick Hand" for hand-lettered display text (logo, kueh names, machine signage), "Quicksand" for body copy and UI.
- **Illustration**: the machine, capsule, and each kueh are drawn as inline SVG in a simple ink-outline + pastel-fill doodle style. These are placeholders built in code and meant to be swapped for hand-drawn art later without touching the layout or logic.

## Feature checklist (July 29 checkpoint scope)

- [x] Home screen with gachapon machine illustration
- [x] "Insert coin" interaction
- [x] "Pull lever" interaction, with a state lock so it can't be double-triggered mid-animation
- [x] Capsule roll-out animation
- [x] Click-to-crack capsule (multi-click open, per requirements)
- [x] Capsule opening animation
- [x] Kueh reveal card: name, description, taste, history
- [x] Starter dataset of 5 kueh (Onde Onde, Ang Ku Kueh, Kueh Lapis, Kueh Salat, Kueh Dadar)
- [x] "Reveal another" + "Back to machine" navigation
- [x] Responsive layout (mobile-first)
- [x] Keyboard-operable controls with visible focus states
- [x] Respects `prefers-reduced-motion`

**Deferred to post-checkpoint (before August 26):**
- [ ] Grow dataset to 10–20 kueh
- [ ] Light/dark mode toggle
- [ ] Weighted rarity for capsule selection
- [ ] Formal WCAG 2.1 AA audit + fixes
- [ ] Voting feature ("do you like this kueh?") — parked for reassessment, not committed

## Running locally

No build step. Open `index.html` directly in a browser, or serve the folder with any static server.
