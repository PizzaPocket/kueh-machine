# Gatcha-Kueh
**by Ken — a dream-builder**

## Concept

Gatcha-Kueh is a blind-box gacha. Nine traditional kueh live inside a
gachapon-style cabinet, spread across three rarity tiers — Common (60%),
Rare (30%), Ultra Rare (10%). Pull the lever and the machine decides: a
shake, flashing marquee lights, a suspense pause, then the kueh drops into
the dispensing window and reveals itself — name, a procedurally illustrated
SVG, and a short flavour line. Every pull is added to a personal collection,
persisted in `localStorage`, with duplicates tracked as a count rather than
repeated cards.

There's no matching logic here and no input from the user beyond "pull
again" — that's the point. The kueh themselves are still handled with real
respect: each SVG is structurally true to the actual thing (Kueh Lapis is
genuinely layered, Ang Ku Kueh genuinely carries a tortoise-shell mould
texture, Kueh Talam is genuinely a diamond-cut two-stage steam), and the
rarity assignments track real cultural weight — the everyday snacks are
common, the ceremonial and harder-to-find ones are rare or ultra rare.

Built for kuehmachine.com — the "machine" in the name is no longer a
metaphor. It's the actual UI.

## Look and feel

Premium night market meets collectible toy culture. Dark, warm-lit
background rather than the bright/friendly palette of earlier iterations —
a deep near-black with amber/gold ambient glow, like a lit-up stall at
night. Common pulls stay understated; Rare pulls get a green glow and a
bigger banner pop; Ultra Rare pulls get a gold glow, a full-screen light
flash, and the largest confetti burst. The reveal sequence is deliberately
paced (shake → flash → drop → rarity banner → details) so the moment
actually earns the word "reveal."

## Features

- [x] Nine kueh archetypes across three rarity tiers, tier-weighted random
      pull (`js/data.js`)
- [x] Nine structurally distinct procedural SVG illustrations, with an
      extra glow + sparkle treatment automatically applied to Ultra Rare
      pulls (`js/svg.js`)
- [x] A dimensional gachapon machine illustration — glass dome of capsules,
      marquee light strip, dispensing window — driven by CSS classes for
      the shake/flash/drop sequence
- [x] A real pull lever (a `<button>`, keyboard-operable) with its own
      pull animation, separate from the machine's reaction
- [x] A choreographed, timed reveal sequence in `app.js`: shake + flashing
      lights → capsule drop → rarity banner → full detail reveal, with
      confetti intensity and animation weight scaling by rarity
- [x] A full collection grid — locked slots show as "?" with their rarity
      tier visible, unlocked slots show the illustration, name, rarity
      badge, and a duplicate count
- [x] Collection persisted in `localStorage`, survives a page refresh

## Running it

No build step, no install. Open `index.html` in a browser.

## Files

```
index.html       page structure
css/style.css    all styling, incl. the shake/flash/drop animation sequence
js/data.js       nine kuehs, rarity tiers, tier-weighted pull function
js/svg.js        nine kueh illustrations + the machine cabinet illustration
js/app.js        reveal sequence choreography, collection state + persistence
```

## Note on earlier concepts

An earlier version of this project (a wealth-management portfolio tool) is
archived in `_archive/wealth-concept/`. A second version in between — a
"matched gift" generator keyed on occasion and recipient — was overwritten
during this rebuild without being archived first, so it's no longer
recoverable as files (only as conversation history).
