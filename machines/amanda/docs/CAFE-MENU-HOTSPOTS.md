# Cafe menu hotspots

## Assets

- Homepage: `assets/scenes/cafe/home-menu-background-v1.png`
- Customer scene: `assets/scenes/cafe/customer-menu-background-v1.png`

Both assets are 1672 × 941 (the same ratio and coordinate system as the existing cafe art).

## Meaning

- Left glass kueh display = **Cards** / collection.
- Right tabbed clipboard = **Chapters**.

The book crests, tabs, and sparkles are painted into the scene. Do not bake the words “Cards” or “Chapters” into another image. Implement each control as a real HTML `<button>` positioned over the matching object.

## Desktop hotspot starting positions

Use percentages so the controls follow the responsive `object-fit: cover` scene container. These are starting values and should be visually checked in-browser:

### Cards

- `left: 8%`
- `top: 55%`
- `width: 26%`
- `height: 23%`

### Chapters — homepage

- `left: 64%`
- `top: 49%`
- `width: 10%`
- `height: 23%`

### Chapters — customer scene

- `left: 65%`
- `top: 52%`
- `width: 9%`
- `height: 20%`

## Interaction and visual feedback

- Give the buttons accessible names exactly `Open kueh cards` and `Open chapters`.
- Keep a small visible label badge (`Cards`, `Chapters`) attached to each object; do not rely on an invisible mystery hotspot.
- On hover or keyboard focus, add a warm outline and a gentle glow. The display-case sparkles may twinkle; the clipboard may tilt by no more than 2 degrees.
- Clicking either control opens an overlay/page without resetting the current story. Closing it returns the player to the exact dialogue or minigame state.
- While the final card-unlock animation is actively playing, disable these two menu controls until the animation finishes.
- Do not make the whole left or right side of the screen clickable. Keep the hit area tied to the illustrated object.

## Mobile behavior

Do not depend on tiny background objects as the only access method. For narrow screens, retain the object hotspots if visible, and also show a compact fixed two-button menu: `Cards` and `Chapters`. Use the same icons/labels and open the same views. The buttons must have at least a 44 × 44 CSS-pixel tap target and must not cover dialogue choices or the pause/close control.

## Layering in the customer scene

Use this order:

1. `customer-menu-background-v1.png`
2. customer/kueh sprite
3. existing transparent counter foreground
4. dialogue UI and controls
5. Cards/Chapters overlays and pause control

The revised customer background deliberately keeps the central walking lane empty.
