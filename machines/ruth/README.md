# Kueh Bakery

A browser-based mobile-first stacking game built as a single HTML/Canvas file with no build step or dependencies.

## Concept

Kueh Bakery puts players in the role of a home baker fulfilling kueh lapis orders for a cast of neighbourhood customers. Each order displays a sequence of coloured glutinous-rice layers to stack — pandan, coconut, rose, blue pea, turmeric, and yam. A sliding layer bar sweeps left and right across the stand; the player taps to place it. Landing on the wrong colour costs a life, while a misaligned tap trims the layer narrower, making the next placement harder. Orders are completed across 20 progressively faster levels spread over five tiers — Apprentice, Junior Baker, Head Baker, Master, and Master Patissier — and scores are posted to a live online leaderboard backed by Supabase.

## Look and Feel

- **Palette** — warm bakery cream and amber throughout; each kueh type has its own distinct colour (deep green for pandan, soft cream for coconut, rose pink, indigo blue, golden yellow, soft purple for yam).
- **Setting** — a cosy illustrated kitchen: string lights, arched windows with drifting clouds, a wooden counter, ingredient jars on a shelf.
- **Map** — a scrollable illustrated world map with a winding golden path through five environment zones (lush meadow → river → forest → snow transition → mountain peak), decorated with trees, bushes, flowers, rocks, a wooden bridge, and snow-capped mountains.
- **Typography** — Fredoka One for display text, Nunito for body and labels; rounded and friendly throughout.
- **Animations** — layers fall onto the stand with gravity, particles burst on correct/wrong placement, string lights flicker, clouds drift, the current-level node pulses on the map.

## Features

- [x] 20-level progression across 5 named tiers
- [x] 6 kueh layer types, each unlocked gradually across levels
- [x] Tap-to-place mechanic with alignment trimming and life system
- [x] 10 illustrated customer personas with canvas-drawn portraits
- [x] 3-step interactive tutorial with animated demo
- [x] Scrollable illustrated level map with per-level star ratings
- [x] Recipe book screen organised by tier
- [x] Live online leaderboard (Supabase — append-only, RLS-protected)
- [x] Score breakdown card on order complete with coin ticker animation
- [x] Background music + sound effects with volume controls and mute toggle
- [x] Vibration feedback on Android (Web Vibration API)
- [x] Mobile-first canvas scaling — full-bleed on any screen size
- [x] Single-file delivery — `index.html` only, no build step

## Stack

| Concern | Solution |
|---|---|
| Rendering | HTML5 Canvas (2D) |
| Fonts / Icons | Google Fonts — Fredoka One, Nunito, Material Icons Round |
| Assets | SVG illustrations (trees, bushes, flowers, rocks, mountains, snowpile) |
| Persistence | Supabase REST API (scores table) |
| Hosting | Any static host — open `index.html` directly in a browser |
