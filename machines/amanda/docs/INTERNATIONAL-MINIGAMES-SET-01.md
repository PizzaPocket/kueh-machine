# International Minigames Set 01

This handoff defines the minigames for Ube Biko, Luk Chup and Pink Songpyeon. Build these only after their story chapters are approved.

## Shared rules

- Present every minigame as an overlay on the active customer scene, never on the homepage.
- Use the existing desktop tray and the existing full-height mobile tray.
- Keep the title, one short instruction, progress, play area and controls visible without page scrolling.
- Prefer tapping over HTML drag and drop. Tap interactions are more reliable on mobile Safari.
- Minimum interactive target size is 44 by 44 CSS pixels.
- Provide a visible selected state using a warm brown outline, a small upward lift and a soft gold pulse.
- Correct placement gives a short star burst and a gentle pop animation.
- Incorrect placement gives a small horizontal wobble. Do not remove progress or punish the player.
- Keep `complete for me`. It must run the same state transitions as normal play and reach the same completion callback.
- Disable input once success begins.
- On success, hide ordinary controls and show the food-only `reference-complete-v1.png` together with the character's existing `happy-v1.png` sprite. Do not use a combined character and food success image.
- Reuse `assets/effects/minigame-success-sparkles-v1.png` for the final sparkle layer.
- Shuffle choices whenever choices are displayed.
- No em dashes in interface copy.

## Sprite sheet usage

Each `asset-sheet-v1.png` is a 2-column by 3-row sheet. Treat it as six equal cells.

```text
cell 1: column 1, row 1
cell 2: column 2, row 1
cell 3: column 1, row 2
cell 4: column 2, row 2
cell 5: column 1, row 3
cell 6: column 2, row 3
```

Use a clipped element with `background-size: 200% 300%`. Do not display the full sheet during gameplay. Keep each cell's entire artwork contained inside its clipping box with `background-repeat: no-repeat`.

## Ube Biko: Shared Tray

### Purpose

Six individual portions become one shared flower platter. The action supports Ube Biko's story about connection and memories being held together.

### Instruction

`Place each sticky piece on the shared tray.`

### Progress

`Shared pieces: 0 of 6`

### Asset paths

```text
assets/minigames/ube-biko-shared-tray/asset-sheet-v1.png
assets/minigames/ube-biko-shared-tray/reference-complete-v1.png
assets/characters/ube-biko/dialogue/happy-v1.png
```

### Sheet cells

1. Empty banana-leaf tray with six placement outlines
2. Upright purple biko portion
3. Diagonal purple biko portion
4. Side-facing purple biko portion
5. Golden coconut centre bowl
6. Completed platter reference

### Interaction

1. Display the empty tray in the centre of the play area.
2. Display three shuffled portion buttons below it. Reuse cells 2, 3 and 4, rotating copies when needed to create all six orientations.
3. The player taps a portion, then taps the matching outlined space.
4. A selected portion remains visibly highlighted until placed or another portion is selected.
5. Use forgiving hit regions. A tap anywhere within the relevant sixth of the tray counts for that placement.
6. Snap the portion to the exact predetermined position. Do not preserve the user's raw tap coordinates.
7. After all six portions are placed, animate cell 5 into the centre.
8. Complete the game once the centre bowl lands.

### Success

- Crossfade the constructed tray to `reference-complete-v1.png`.
- Place Ube Biko's `happy-v1.png` above or just behind the platter as a separate layer.
- Add the shared sparkle overlay.
- Success line: `Every piece found a place at the table!`

### Mobile layout

- Tray width: `min(76vw, 330px)`.
- Choices use one horizontal row of three buttons beneath the tray.
- Portion buttons may be reused after placement until six spaces are filled.
- Do not require dragging.

## Luk Chup: Shape, Paint, Shine

### Purpose

The player completes three sweets through shape, colour and glaze. The sequence supports the trio's story that a shared centre can become many individual forms.

### Instruction

The instruction changes with the current phase:

1. `Match each sweet to its shape.`
2. `Give each fruit its colours.`
3. `Brush on a glossy finish.`

### Progress

`Fruit sweets: 0 of 3`

During each sweet, also show compact phase dots for `shape`, `paint` and `shine`. Use icons or dots, not long labels on mobile.

### Asset paths

```text
assets/minigames/luk-chup-shape-paint-shine/asset-sheet-v1.png
assets/minigames/luk-chup-shape-paint-shine/reference-complete-v1.png
assets/characters/luk-chup/dialogue/happy-v1.png
```

### Sheet cells

1. Ceramic work plate with mango, mangosteen and orange wells
2. Three unpainted ivory sweets
3. Edible colour palette and brush
4. Clear glaze bowl and brush
5. Three finished fruit sweets without faces
6. Completed presentation plate

### Interaction

The game has three short rounds, one for each fruit. Shuffle their order on every play.

#### Shape phase

- Show one unpainted sweet and the three plate wells.
- The player taps the matching silhouette.
- Snap it into the well on a correct choice.

#### Paint phase

- Show four large colour swatches taken from the palette: yellow, magenta, orange and green.
- Mango requires yellow, then green for the lower edge and leaf.
- Mangosteen requires magenta, then green for the crown.
- Orange requires orange, then green for the leaf.
- Indicate the next paintable region with a gentle pulse. This is guidance, not a written clue.
- Tapping a colour paints the active region using a crossfade or CSS overlay. Exact brush tracing is unnecessary.

#### Shine phase

- Show the glaze bowl.
- The player taps the sweet three times. Each tap adds one moving white highlight and raises the gloss level.
- On the third tap, the fruit gives a small sparkle and the next fruit begins.

### Success

- Show `reference-complete-v1.png` centred.
- Layer the Luk Chup trio's `happy-v1.png` separately above or behind it.
- Add the shared sparkle overlay.
- Success line: `Three bright shapes, one sweet beginning!`

### Mobile layout

- Work plate width: `min(72vw, 310px)`.
- Keep all three wells visible simultaneously.
- Swatches appear in one row with at least 48px tap targets.
- Never use browser-native drag and drop.

## Pink Songpyeon: Fold a Wish

### Purpose

The player fills and folds one rice cake into an intentional half-moon. The action supports Songpyeon's discovery that her crescent shape is not incomplete.

### Instruction

The instruction changes with the current step:

1. `Set the dough on the folding guide.`
2. `Place the sweet filling in the centre.`
3. `Fold the dough into a half-moon.`
4. `Seal the curved edge gently.`

### Progress

`A wish in the making: 1 of 4`

### Asset paths

```text
assets/minigames/songpyeon-fold-a-wish/asset-sheet-v1.png
assets/minigames/songpyeon-fold-a-wish/reference-complete-v1.png
assets/characters/songpyeon/dialogue/happy-v1.png
```

### Sheet cells

1. Wooden work board with half-moon folding guide
2. Flat pink rice dough disk
3. Sesame filling spoon
4. Dough with filling in the centre
5. Partly folded half-moon
6. Finished sealed songpyeon on pine needles

### Interaction

1. Start with the board and dough displayed separately. The player taps the dough, then the board. Snap the dough to the guide.
2. Present three shuffled filling spoon buttons. One is sesame from cell 3. The other two may be created as simple CSS variations using warm chestnut brown and pale bean-gold colours. Every filling is culturally plausible, so there is no failure choice. The selected filling changes the small centre colour only.
3. Once a filling is selected, crossfade to cell 4.
4. Show a curved animated arrow from the bottom half of the dough toward the top. The player taps `Fold`, or swipes upward anywhere across the dough. Crossfade to cell 5.
5. Draw five large invisible checkpoints along the curved edge. The player taps or traces across them in either direction. Each completed checkpoint adds a tiny pressed ridge.
6. Use a very forgiving trace. Pointer movement within 36 CSS pixels of a checkpoint counts.
7. Once all five checkpoints are reached, crossfade to cell 6 and finish.

### Success

- Show `reference-complete-v1.png` centred.
- Layer Songpyeon's `happy-v1.png` separately above or behind it.
- Add the shared sparkle overlay.
- Success line: `The little moon was complete all along!`

### Mobile layout

- Work board width: `min(70vw, 300px)`.
- Filling choices use a single row.
- Support both pointer tracing and the visible `Fold` button so the chapter remains accessible.
- Prevent page scrolling only while the player is actively tracing the seal. Restore normal touch behaviour immediately afterward.

## Completion callback

All three modules should expose the same shape as the existing minigames:

```js
window.KG.minigames.start({
  id,
  mount,
  onComplete
});
```

If the project retains separate functions instead, keep their outward behaviour identical. Each module must call `onComplete()` exactly once after the success animation, including when `complete for me` is used.

## Do not implement yet

- Do not add these customers to chapter selection until their dialogue chapters are approved.
- Do not unlock their cards yet.
- Do not insert educational quiz questions into these minigames.
- Do not replace the current three approved chapters.
