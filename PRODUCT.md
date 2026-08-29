# Kueh Machine

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Kueh Machine visitors explore contributor-made projects and the shared 3D Kueh-verse. Registered visitors can carry one persistent character identity across the site. Named contributors represented in the Kueh-verse can claim ownership of their own character without needing to pre-register a particular email address.

## Product Purpose

Kueh Machine presents a collection of personal interactive projects as one shared showcase. The Kueh-verse makes the contributors and their projects spatial and social, while shared accounts preserve a visitor's identity and progress across the main site and individual projects.

## Positioning

Contributor projects keep their independent visual and interaction styles while participating in one shared account system and one explorable 3D world. Real contributors can become the owners of the characters that represent them.

## Operating Context

The site runs in desktop and mobile browsers. The Kueh-verse is a Godot Web export embedded in the same origin as the main site and contributor projects. Authentication and persisted account data use the existing shared Supabase project. The shared account badge remains the consistent entry point for identity actions.

## Capabilities and Constraints

- A registered account owns one saved character appearance.
- A contributor can claim only their assigned Kueh-verse character using a private, expiring, one-use invitation token.
- No contributor administration UI is required initially; invitations and revocations can be managed through protected backend access.
- A claimed contributor character uses its owner's saved appearance for other visitors.
- When that owner enters the Kueh-verse, their controllable player uses the saved appearance and their duplicate stationary NPC is suppressed for that session.
- Bundled Godot appearances remain the offline and unclaimed fallback.
- The initial editor has a fixed doll camera, live preview, category controls, Save, and Cancel. Zoom, rotation, randomization, and advanced proportion sliders are out of scope initially.
- The current public `/hub/` route and internal hub identifiers may remain until a separate route migration is approved; user-facing terminology is Kueh-verse.

## Brand Commitments

All JavaScript/CSS interfaces follow the established Kueh Machine website and shared account-widget language. Godot interfaces translate the same typography, colors, spacing, superellipse geometry, control hierarchy, focus treatment, and responsive behavior into the 3D experience. Eleblorb's paper-doll structure may inform layout, but Blorb terminology, eyes, pink biological styling, and decorative world are excluded.

## Evidence on Hand

- Main-site visual implementation and tokens under `src/`.
- Shared account implementation in `shared/account-widget.js` and `AUTH.md`.
- Supabase schema documentation under `supabase/migrations/`.
- Kueh-verse Godot UI and procedural figure implementation under `godot/hub/`.
- Existing contributor appearances in `godot/hub/scripts/hub_main.gd`.
- Eleblorb's paper-doll interaction structure in its `inventory_ui.gd` and `player_portrait.gd`.

## Product Principles

- One account should read as one identity everywhere.
- Contributor ownership must be explicit, revocable, and secure by default.
- Preserve authored fallbacks so the Kueh-verse remains resilient without account data.
- Start with a small, understandable editor and add controls only when demonstrated needs justify them.
- Keep web and Godot interfaces recognizably part of the same Kueh Machine system.

## Accessibility & Inclusion

Character choices are not gated by gender. Skin-tone presets should span the inclusive range already used by the procedural NPC system and offer a custom color option. Every swatch also needs a text label, and the editor must support keyboard, controller, and touch input with visible focus states.
