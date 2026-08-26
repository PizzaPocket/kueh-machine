# Ondeh-Ondeh collectible card

## Frame asset

`assets/cards/character-card-frame-ondeh-v1.png`

Dimensions: 1086x1448 (3:4 portrait). The frame is intentionally opaque. Render all content as HTML positioned above it; do not bake text into the bitmap.

## Card content

Name:

`Ondeh-Ondeh`

Portrait:

`assets/characters/ondeh-ondeh/dialogue/happy-v1.png`

Short restored-memory story:

> Ondeh-Ondeh arrived with a memory hidden beneath the surface. With Beary’s help, scattered sensations of fragrance, softness and warmth came together. What once felt frightening became the sweetest part of remembering who they were.

Exactly three front-card tags:

1. `Kueh`
2. `Filled`
3. `Coconut`

These tags support collection filtering. Cultural region, historical context, ingredients, and source links belong in the expanded detail view after research, not on this compact front.

## Percentage placement map

Position all content relative to one `.character-card` container with `aspect-ratio: 3 / 4`:

- Name safe area: left 14%, top 3.5%, width 72%, height 8.5%.
- Portrait safe area: left 11%, top 13%, width 78%, height 44%.
- Story safe area: left 11%, top 61.5%, width 78%, height 22.5%.
- Tags row: left 11%, top 88%, width 78%, height 7%.

Use `object-fit: contain` for the portrait and bottom-centre it inside the portrait area. Keep the full leaves and feet visible.

## Behaviour

- Card appears after the restored-memory scene.
- Begin with the card slightly smaller and dimmed, then reveal with the existing success sparkles.
- Respect reduced motion with a simple opacity fade.
- After reveal, provide `View card` and `Continue` actions outside the card artwork.
- The card itself can become a button only when it opens the detail view; otherwise use a non-interactive article.
- On phones, fit the full card within the viewport without forcing sideways scrolling.

## Accessibility

- Render the name as a heading, not part of the image.
- Use the short story as real paragraph text.
- Use a list for tags.
- Portrait alt text: `Ondeh-Ondeh smiling joyfully after recovering their memory.`
- Treat the decorative frame as background imagery.

## Originality boundary

This uses the familiar broad hierarchy of collectible character cards—art above, information below—but must not add Pokémon-specific yellow borders, energy symbols, HP, attacks, rarity marks, typography, stats, or terminology.
