# Asset manifest and production notes

## Reuse

| Asset | Role | Status |
|---|---|---|
| `../../assets/background.png` | Desktop café backdrop | Existing production asset |
| `../../assets/tray.png` | Desktop game/minigame frame | Existing production asset |
| `../assets/ui/tray-mobile-concept-v1.png` | Portrait phone frame | Concept suitable for layout prototyping |

## New character concepts

| Asset | Intended chapter | Status |
|---|---|---|
| `../assets/character-concepts/ondeh-ondeh-concept-v1.png` | Memory Flip | Direction sheet; expressions are not separated |
| `../assets/character-concepts/kueh-lapis-concept-v1.png` | Assembly | Direction sheet; expressions are not separated |
| `../assets/character-concepts/ang-ku-kueh-concept-v1.png` | Tile Puzzle | Direction sheet; expressions are not separated |
| `../assets/character-concepts/yakgwa-concept-v1.png` | Honey Trail | Direction sheet; research and final sprite separation pending |

## First playable chapter art

| Asset | Role | Status |
|---|---|---|
| `../assets/characters/ondeh-ondeh/expression-sheet-v1.png` | Five dialogue poses | Prototype sheet; checkerboard is baked in, not true alpha |
| `../assets/minigames/memory-flip/ondeh-memory-icons-v1.png` | Ingredient/memory matching art | Prototype sheet with alpha channel; crop/atlas mapping required |

### Ondeh-Ondeh dialogue sprites

Use these individual full-body 1254x1254 PNGs. All have verified alpha:

| Expression key | Asset |
|---|---|
| `neutral` | `../assets/characters/ondeh-ondeh/dialogue/neutral-v1.png` |
| `thinking` | `../assets/characters/ondeh-ondeh/dialogue/thinking-v1.png` |
| `worried` | `../assets/characters/ondeh-ondeh/dialogue/worried-v2.png` |
| `remembering` | `../assets/characters/ondeh-ondeh/dialogue/remembering-v1.png` |
| `happy` | `../assets/characters/ondeh-ondeh/dialogue/happy-v1.png` |

Do not use `worried-v1.png`; its checkerboard is baked into the image. Fit every sprite inside the same CSS character stage with `object-fit: contain` and a consistent bottom anchor.

## Revised customer scene and shared minigame UI

| Asset | Role | Status |
|---|---|---|
| `../assets/scenes/cafe/customer-arrival-background-v1.png` | Empty rear café layer | Ready for integration; 1672x941 |
| `../assets/scenes/cafe/customer-arrival-counter-v1.png` | First counter attempt | Do not use; checkerboard is baked in |
| `../assets/scenes/cafe/customer-arrival-counter-v2.png` | Foreground counter layer | Corrected transparent PNG; 1672x941 |
| `../assets/minigames/shared/card-back-v1.png` | Universal face-down Memory Flip card | Ready for integration; one image reused on every card |
| `../assets/effects/minigame-success-sparkles-v1.png` | Completion effect overlay | Transparent PNG; animate with CSS |

## Collectible card

| Asset | Role | Status |
|---|---|---|
| `../assets/cards/character-card-frame-ondeh-v1.png` | Original Ondeh-Ondeh card frame | Ready; 1086x1448 opaque background with blank HTML safe areas |

See `ONDEH-CARD-SPEC.md` for content, positioning, responsive behaviour, and originality constraints.

## Ondeh-Ondeh Memory Flip fronts

All production fronts are individual 1254x1254 PNG files with verified alpha. Use each file twice.

| Asset | Card subject |
|---|---|
| `../assets/minigames/memory-flip/fronts/pandan-v2.png` | Pandan leaf bundle |
| `../assets/minigames/memory-flip/fronts/coconut-v2.png` | Grated coconut |
| `../assets/minigames/memory-flip/fronts/palm-sugar-v2.png` | Palm-sugar block and droplet |
| `../assets/minigames/memory-flip/fronts/dough-v2.png` | Green dough ball |
| `../assets/minigames/memory-flip/fronts/steamer-v2.png` | Bamboo steamer and steam |
| `../assets/minigames/memory-flip/fronts/memory-drop-v2.png` | Golden memory droplet |

Do not use the corresponding `-v1.png` files; their checkerboards are baked into the pixels.

## Important limitations

- The character sheets have illustrated backgrounds despite being requested as transparent. Use them for review and prototype crops only.
- Do not make fragile production crops from them until the character style is approved.
- The mobile tray has an opaque outer background. It is suitable as a full panel background; if compositing over the café is desired, commission a final transparent version.
- The Ondeh-Ondeh expression sheet and Yakgwa concept display a baked checkerboard rather than true transparency. Do not ship them as isolated sprites.
- Generated motifs are visual concepts, not evidence for historical facts.

## Next art pass after approval

For each approved character, create:

- Neutral full-body transparent PNG.
- Four consistent transparent expression portraits.
- One restored-memory illustration.
- One collectible-card portrait.
- Minigame-specific objects on transparent backgrounds.

Keep all typography, educational copy, buttons, and card statistics in HTML/CSS rather than raster images.

## Generation record

All four new images were produced with the built-in image-generation tool using the existing tray or café artwork as a visual reference. Prompts specified warm storybook illustration, soft brown outlines, no text, and mobile-safe composition. Source generations remain in Codex's generated-images storage; project copies use stable versioned filenames above.
