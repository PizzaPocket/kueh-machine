# Kueh Machine: The Great Reverse Makan

By Azri, for kuehmachine.com.
https://azrimasran44.github.io/KuehMachine/

## Concept

Singapore built a Kueh Machine for the National Kueh Festival: scan a kueh, learn the recipe, make perfect batches forever. During a storm it misread one instruction — "make kueh more alive for the next generation" — and took it literally. At midnight every kueh it ever scanned woke up giant and hungry, convinced it's finally humanity's turn to be sampled. You're a lone survivor crossing an HDB estate one tile at a time, trying to reach the Machine before the kueh reach you. The connection to kuehmachine.com isn't a reference — it's the premise: the site's name is the machine that started all of this.

This build is the first full arc: a Start Screen and a skippable storyline sequence set up the whole premise, then three levels carry it through — "HDB Panic" (the street, dodging cars, reaching the lab building), "Ground Floor" (inside the lab, cars replaced by roaming kueh monsters, office furniture cluttering the lanes without one), and "The Machine Floor" (the same idea turned up — denser, faster — ending at the actual Kueh Machine). Coins collected along the way unlock a roster of playable chefs, each with their own iconic kueh. The full concept (more monster types, a boss, an ending twist where the Machine is reprogrammed with "kueh is for sharing") is real and written, just scoped down to ship something whole rather than something half-built everywhere.

## Look & feel

Gameplay — including every playable chef's own sprite — stays chunky pixel art throughout: deep indigo/navy void-deck night, warm amber-gold HUD text (streetlamp glow), mint-green for the Machine and Ondeh-Ondeh, hot pink-red for Ang Ku Kueh and danger states, hand-built 16×16 nearest-neighbor sprites for the player(s), traffic, monsters, the lab building/staircase/Machine goal markers, the ground-floor office set (floor tile, table, chair, plant), and the coin pickup, chunky drop-shadow "pixel-bevel" buttons throughout. Every chef shares Dr Leonard Rizz's own silhouette, recolored and re-accessorized per their signature kueh — the Mystery Character is the same rig again, rendered as a plain dark silhouette. Pixelify Sans for titles/HUD/buttons, Syne (the typeface the rest of kuehmachine.com uses) for body copy.

The Start Screen and the story sequence's 6 illustrations are the exception — real illustrated/animated reference art (smoothly filtered, not pixel-scaled). Those onboarding/narrative moments read as "cinematic," everything you actually play stays retro.

Gameplay sound follows a retro-arcade logic: every cue is a small synthesized chiptune waveform (square/triangle/noise, hand-built the way the sprites are — no stock sound packs), not a recording — an upbeat driving track under gameplay, with a per-move "boink," a landing thud, and win/lose stingers layered on top. The Start Screen and story sequence share one real theme song instead, playing continuously and gaplessly across that whole transition, with sparse electrical clicks, the occasional distant thunder crack under the Start Screen's lightning strikes, and a Pokémon-style blip on every story dialogue advance layered on top. One shared audio system fades and ducks between all of it so nothing ever cuts off abruptly.

## Features

- [x] Start Screen — a full-bleed looping hero video of the lightning-struck rooftop Machine atop a lit office tower at night, its own "RUN KUEH RUN" title and "TAP TO START" prompt baked into the animation; tap anywhere to begin
- [x] Skippable storyline sequence, Pokémon-style — each of the 6 beats is a full-screen illustration with a pixel-art dialogue box (hand-drawn 9-slice frame, not a plain rectangle) overlaid near the bottom, consistent position and size throughout, with a Skip button visible the whole time and progress dots showing how much is left
- [x] Dr Leonard Rizz — the Machine's own creator, the default playable character (the story always stars him regardless of who you've unlocked to play as); the moment the story ends or is skipped, whoever's equipped drops in from above the frame and lands on their starting tile with a little impact bounce, controls locked (and immune to traffic) until they're actually down
- [x] The environment auto-advances independent of the player, Crossy Road-style — a survival buffer drains continuously and only refills when you move toward the Machine, and doesn't start at all until your first move so you always get a clear look at your character before any pressure begins; let it hit zero (or retreat far enough to fall off the bottom of the screen) and the screen shakes and blacks out
- [x] Grid-based lane crossing — swipe or keyboard (arrows/WASD), one tile per move
- [x] Three levels, one continuous run, score carrying across all of them: Level 1 is the street — roads come in clusters of 2-3 lanes (slow and fast cars, alternating direction) separated by a safe grass pathway with trees/bushes to detour around, Crossy Road-style, denser and faster the closer you get to the lab. Levels 2–3 are the lab's ground floor — cars are replaced by roaming kueh monsters, and every crossing lane is *either* a monster lane *or* cluttered with static office furniture (table/chair/plant) to detour around, never both, with a warm tint marking which is which; Level 3 is the same idea tuned harder
- [x] Level 1's death animation fits the setting: get hit by a car and an eagle swoops in, grabs you, and carries you off the top of the screen. Levels 2–3 keep the original kueh-monster lunge (and the monsters still double as the live roaming hazard there too)
- [x] Each level has its own scrolling camera that eases smoothly toward the player rather than snapping — the goal isn't visible until you've made real progress toward it — and a lightweight title-card transition between levels
- [x] Reach Level 1's goal to unlock the lab building, Level 2's to reach the staircase, Level 3's to reach the actual Kueh Machine and win; any death, at any level, restarts the whole run from Level 1 — instant one-thumb retry
- [x] True full-screen canvas on phones; capped to a mobile-width column (not stretched full-width) on desktop browsers
- [x] Pause (manual button + auto-pause when the tab loses focus), with a "3, 2, 1, GO!" countdown before play actually resumes
- [x] Scoring is your fastest completion time, not distance covered — a live in-run timer, a personal best saved locally and synced to your account when signed in, and a public leaderboard of the fastest times across every player (with a one-time nickname prompt on your first qualifying win), reachable from the Start Screen and the Game Over screen
- [x] Full sound design — a real theme song carries the Start Screen and story sequence continuously and gaplessly, layered with random electrical clicks/thunder and a Pokémon-style dialogue-advance blip; gameplay runs on its own synthesized chiptune track with a per-move "boink," a landing thud, and win/lose stingers; music crossfades between scenes, ducks (rather than cutting) under pauses and end-of-level jingles, and keeps playing gaplessly across all 3 levels without restarting
- [x] Sparse Crossy-Road-style coins scattered along every level (never on a blocked cell, sometimes on a live hazard lane for a timing risk), with a running coin balance top-left in the HUD and a unique pickup chime; the balance persists across runs (and syncs to your kuehmachine.com account when signed in) and is spendable in a chef shop reachable from the Retry screen
- [x] A roster of unlockable playable chefs, each with their own iconic kueh (Kueh Lapis, Kueh Dadar, Kueh Salat, Kueh Bingka, Pulut Hitam, Kueh Ambon) and all priced the same in coins — unlocking one equips them immediately, and whichever chef is equipped is who drops in at the start of your next run; a locked "???" Mystery Character teases a future addition

## Backlog (not in this build)

- The Mystery Character — currently a locked, non-interactive "coming soon" silhouette in the chef shop
- More monster types beyond Ang Ku Kueh/Ondeh-Ondeh/Kueh Lapis, a boss, the ending cutscene
- Haptics, reduced-motion mode
