# Claude implementation handoff

## Product direction

Turn the current placeholder generator into a cozy, story-led browser game inspired by the conversational pacing of café narrative games, without copying another game's interface, writing, characters, or branding.

The player experiences the shop from Beary's perspective. Each customer is an anthropomorphic kueh with an incomplete memory. Conversation and one short activity reveal clues. The player makes a gentle final deduction; success restores the memory and unlocks a collectible educational card.

## Vertical-slice scope

Build only the reusable engine and three short chapters:

1. Ondeh-Ondeh — sensory/filling mystery; Memory Flip activity.
2. Kueh Lapis — sequence/layers mystery; Assembly activity.
3. Ang Ku Kueh — shape/occasion/symbol mystery; Tile Puzzle activity.

Each chapter has three clue beats, but only one minigame:

1. Conversation clue.
2. Minigame clue.
3. Final deduction.
4. Restored-memory scene and card unlock.

Wrong deductions are recoverable. Show supportive dialogue and allow another attempt; do not create a hard fail state.

## Required screens

- Title/continue screen.
- Café/customer arrival screen.
- Tray dialogue screen.
- Tray minigame screen.
- Final deduction screen.
- Memory-restored/card-unlock screen.
- Collection grid.
- Card detail view.
- Settings overlay with music, sound, text speed, and reset-save controls.

## Architecture

Do not hard-code each chapter into separate page logic. Build one chapter runner driven by structured data.

Suggested modules:

- `gameState`: active chapter, beat, clues, completed chapters, unlocked cards, settings.
- `chapterRunner`: enters beats and resolves dialogue choices, activities, and deductions.
- `dialogueRenderer`: speaker, portrait/expression, text, and choices.
- `minigames`: reusable `memoryFlip`, `assembly`, and `tilePuzzle` adapters with a common completion callback.
- `collection`: derives unlocked cards from completed chapter IDs.
- `saveStore`: versioned localStorage record with safe defaults and a reset method.
- `audioManager`: optional stubs initially; no autoplay before user interaction.

The supplied JSON file is an example contract, not fully researched publication copy.

## State flow

`title -> cafe -> dialogue -> minigame -> dialogue -> deduction -> restored -> cardUnlock -> cafe`

Allow the collection and settings screens to open from the café and return to the previous state.

## Tray presentation

Desktop:

- Retain the illustrated café background.
- Reuse `assets/tray.png` as the landscape frame.
- Keep the frame fixed while only the inner content area changes or scrolls.

Mobile:

- Use `game-v2/assets/ui/tray-mobile-concept-v1.png` as the portrait frame concept.
- Let the game panel occupy nearly the full viewport.
- Keep paws and wood frame decorative and non-interactive.
- Put all readable text and controls in HTML above the artwork, never inside the bitmap.
- Respect safe-area insets and virtual-keyboard resizing.

Use a CSS custom property for the inner safe area rather than positioning every screen independently. Switch the tray artwork through a media query or `<picture>` source.

## Responsive and accessibility requirements

- Start at 360px phone width and scale through tablet and desktop.
- Minimum 44px touch targets.
- No hover-only information or interaction.
- Support pointer, touch, and keyboard.
- For assembly and puzzles, provide tap-select/tap-place as well as dragging.
- Keep dialogue text at least 16px on phones.
- Use visible focus styles, semantic buttons, dialog labeling, and live-region announcements for clue/card unlocks.
- Escape closes optional overlays, not story-critical screens.
- Respect `prefers-reduced-motion`.
- Never rely on color alone for puzzle state or correctness.

## Minigame contracts

Every minigame receives configuration data and calls one result handler:

```js
startMinigame(config, ({ completed, mistakes, elapsedMs }) => {
  // Persist only completion for story progression.
  // Performance may alter optional dialogue, never block educational content.
});
```

### Memory Flip

- Six pairs on desktop; four or six pairs on phones depending on available height.
- Pair relationships may be image-image or image-concept.
- Include a non-timed mode by default.

### Assembly

- Place layers or preparation stages in a defined order.
- Do not imply one recipe is universal when regional variants exist.
- Phone interaction must work without precise dragging.

### Tile Puzzle

- Use a small 2x3 or 3x3 grid for the vertical slice.
- Prefer swapping/tapping tiles on phones rather than freeform jigsaw physics.

## Collectible cards

Card front:

- Original character artwork.
- Kueh name.
- Decorative region-inspired motif used respectfully.
- Chapter completion mark.

Card detail/back:

- Region/cultural connections.
- Main ingredients, noting variants.
- Traditional occasions or meanings where verified.
- Short restored memory.
- Source links or a “Learn more” area in the eventual production build.

Do not use Pokémon's frame, symbols, terminology, rarity system, or trade dress. This is an original cozy collection system.

## Content and research boundaries

- Treat `chapter-schema.example.json` as placeholder narrative structure.
- Before final copy, verify each factual claim using reliable museums, cultural institutions, government heritage resources, books, or expert-reviewed sources.
- Describe origins with nuance when multiple regions or communities share a food.
- Avoid presenting one family recipe as the only authentic recipe.
- Do not use character flaws or memory loss to mock languages, accents, cultures, or age.

## Recommended build sequence

1. Create a new V2 app shell while leaving V1 runnable.
2. Implement responsive tray and screen router.
3. Implement state, save migration/versioning, and dialogue runner.
4. Complete one Ondeh-Ondeh chapter end-to-end with temporary crops from the concept sheet.
5. Add collection and card unlock.
6. Add reusable assembly and tile-puzzle modules.
7. Load the other two chapters from data.
8. Test phone, tablet, desktop, keyboard, reduced motion, and save recovery.

## Definition of done for the vertical slice

- A new player can complete all three chapters.
- Reloading preserves progress and settings.
- Every chapter unlocks exactly one card.
- The collection correctly reflects locked/unlocked cards.
- All activities work with mouse, touch, and keyboard.
- No educational claim ships without review status and source metadata.
- V1 remains unchanged and runnable until the user approves replacement.
