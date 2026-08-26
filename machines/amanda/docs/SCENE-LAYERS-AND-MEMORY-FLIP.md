# Approved scene flow and Memory Flip correction

## Customer-arrival scene

Use four visual layers in this order:

1. `assets/scenes/cafe/customer-arrival-background-v1.png` — rear café scene.
2. Character sprite — animated from off-screen left to the centre.
3. `assets/scenes/cafe/customer-arrival-counter-v2.png` — transparent foreground counter.
4. Dialogue UI — HTML above the scene layers.

Do not use `customer-arrival-counter-v1.png`; its checkerboard is baked into the bitmap. V2 is the corrected alpha asset.

Recommended implementation:

- Give the scene a fixed 1672:941 design coordinate system through `aspect-ratio`.
- Scale all visual layers together with `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain`.
- Place the customer with bottom/left values relative to the scene container, not the viewport.
- Animate only `transform` and `opacity`.
- Stop the character in the centre behind the counter.
- When reduced motion is requested, show the character at the final position without the walk-in animation.
- Keep the dialogue box and “Help this kueh!” button as accessible HTML, never inside an image.

## Memory Flip card backs

Use `assets/minigames/shared/card-back-v1.png` as the identical back of all twelve cards.

There are six unique front images. Each front image appears exactly twice, producing six literal image-image pairs. Do not create text cards and do not use dialogue-expression portraits as substitute pair art.

Rules:

- First card opens and waits.
- Matching second card leaves both cards face up and marks the pair complete.
- Non-matching second card pauses briefly, then both cards close.
- Block additional selections during the mismatch pause.
- A successful match briefly shows small stars around the two matched cards.
- Complete only after all six pairs are matched.
- Then show the success overlay and continue to the next story beat.

Use `assets/effects/minigame-success-sparkles-v1.png` for the completion overlay. The effect is a static transparent PNG; animate its scale, opacity, and gentle rotation with CSS. Respect `prefers-reduced-motion` by showing a short fade only.

## Prototype status

The café background, corrected counter, card back, success overlay, and six individual card fronts are ready for layout integration.

Use only the `-v2.png` fronts below; their transparency has been verified:

- `assets/minigames/memory-flip/fronts/pandan-v2.png`
- `assets/minigames/memory-flip/fronts/coconut-v2.png`
- `assets/minigames/memory-flip/fronts/palm-sugar-v2.png`
- `assets/minigames/memory-flip/fronts/dough-v2.png`
- `assets/minigames/memory-flip/fronts/steamer-v2.png`
- `assets/minigames/memory-flip/fronts/memory-drop-v2.png`

Add each path to the deck twice, then shuffle all twelve cards. The `-v1.png` files are retained as generation history but contain baked checkerboards and must not be used.
