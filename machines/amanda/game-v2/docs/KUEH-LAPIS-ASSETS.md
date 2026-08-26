# Kueh Lapis dialogue assets

## Approved character direction

Use the Singapore-recognisable brown baked Kueh Lapis. Do not use the earlier pink or rainbow drafts. The rainbow steamed version should be treated as a separate Jiu Ceng Gao character if it is ever introduced.

The approved character has many fine alternating toasted-brown and warm ivory layers. Preserve this tightly stacked appearance in all future art.

## Dialogue sprites

All final sprites are transparent PNGs under `assets/characters/kueh-lapis/dialogue/`:

- `neutral-v3.png`
- `thinking-v2.png`
- `worried-v1.png`
- `remembering-v1.png`
- `happy-v1.png`

Do not use `neutral-v2.png`, `remembering-raw-v1.png`, or `happy-raw-v1.png`; those are intermediate exports.

## Implementation

Map the expressions to the same dialogue-state system used by Ondeh-Ondeh:

- `neutral`
- `thinking`
- `worried`
- `remembering`
- `happy`

Render every sprite inside one fixed character-stage container using `object-fit: contain` and a shared maximum height. The source canvases differ slightly because the poses have raised arms, effects, or a lifted foot; do not size them from their natural pixel dimensions.

Keep the character visually grounded at the same baseline when changing expressions. A short opacity crossfade is sufficient; do not slide the character in again for every expression.

## Narrative identity

Working tags: `Singapore`, `Cake`, `Layered`.

The chapter theme should connect the many carefully made layers with patience, accumulated effort, and memories built gradually. Cultural and historical claims still require research before publication.
