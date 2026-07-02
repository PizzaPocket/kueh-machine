# Design system philosophy

**Work at the system level.** Every styling decision either strengthens the design system or creates drift. Before adding a visual property to a single component, ask whether it belongs in an atom, a token, or a shared rule. Local hardcoded values — colors, sizes, spacing, radii, font sizes — are a last resort, acceptable only when a property is genuinely unique to one context. If you write the same value twice, it belongs in the system.

**Prefer reusable enhancements over local fixes.** When a component needs a new behavior or style, look first at whether that change should live in an atom or molecule that other consumers can inherit. A refinement made to a base component benefits every surface that renders it. A refinement made inline in one organism helps nothing else and will diverge as the codebase grows.

**The atoms are the source of truth.** Base interactive elements (buttons, inputs, textareas, toggles, badges) encode the canonical styling for their interaction tier. If a feature component overrides what an atom provides, the override is probably wrong — fix the atom, not the consumer. If you write an interactive element more than once, it belongs in atoms or molecules.

# Content and voice rules

These apply whenever writing prose for this project: case study copy, UI microcopy, commit messages, or any text that appears on the site.

**No em dashes, and understand why.** The em dash ban is not cosmetic. The problem it removes is structural: the two-clause em dash sentence is a mechanism for writing an incomplete thought, inserting a beat, and then generating a second clause to close it. Neither clause has to stand on its own, so neither has to mean anything on its own. LLMs reach for this pattern because it mimics the rhythm of considered prose while requiring no consideration. It also produces the faux-dramatic pause that gives AI writing its characteristic overcooked tone.

The ban extends to the underlying structure, not just the punctuation. Splitting "X — Y" into "X. Y." does not fix the problem if X or Y still cannot stand alone. The test is whether each sentence says something without leaning on the other. If it does not, rewrite until it does. Use a comma, semicolon, or colon when joining punctuation is needed.

**Parentheses are intentional style.** Use them for de-emphasized clauses (the kind of aside that earns its place without stopping the sentence). Do not remove or flatten parenthetical asides when editing copy.

**No hollow intensifiers.** Cut before publishing: genuinely, truly, deeply, incredibly, remarkable, actually, highly, real, wonderful. Say the thing directly. If a sentence needs an intensifier to land, rewrite the sentence.

**Active voice.** "I led the team" not "the team was led."

**Complete sentences.** Fragments are almost never appropriate in prose copy.

**Be concise.** Two to four sentences for most answers. Cut the last sentence when in doubt.

# Component rules

## Colors and contrast

**Always pair text tokens with background tokens.** When a component shifts its background to a tinted or subtle surface, the text color must shift to a token that is guaranteed to pass 4.5:1 contrast against that exact surface — not against the page background. A text token calibrated for the page background will fail on a tinted surface.

The rule: **whenever a component changes its background, verify that its text token is calibrated against the new background, not the default one.**

Never use an accent color (calibrated against the page background) as a text color on a subtle/tinted background.

## Radius

Use a fixed set of radius tiers — never choose a radius locally based on what looks right in isolation. Define the tiers in your design tokens and refer to them semantically:

- **Content containers** (cards, modals, lists, grouped option lists): a capped radius (e.g. max 32px) so it reads as a container, not a pill.
- **Standard interactive elements** (buttons, single-line text inputs): a shared mid-tier radius. Buttons and single-line inputs always share the same radius so they read as the same family of interactive object.
- **Multi-line textareas**: use the same capped radius as content containers, not the button radius. A pill/stadium radius applied to a textarea will visibly distort as the element grows in height — the corner arc changes with height. A capped radius stays visually consistent regardless of how tall the textarea gets.
- **Pill/chip interactive elements** (suggestion pills, tag filters): a fully rounded (xl) radius.
- **Micro decorative elements** (progress bar tracks, thin indicators): a minimal radius.

## Icons

All inline SVG icons follow three size tiers — never use other sizes without explicit justification:

- **14×14, strokeWidth 1.5** — tight inline contexts (inline indicators, small badges, dense UI chips).
- **16×16, strokeWidth 1.5** — standard decorative icons within components (lock, info, checkmark, status indicators).
- **20×20, strokeWidth 2.0** — primary interactive controls that stand alone as touch targets (nav controls, send button, scroll hints).
