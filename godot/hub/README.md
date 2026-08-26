# Kueh Machine Hub

An isolated Godot 4.7 Compatibility-renderer project for the Kueh Machine contributor hub. It does not depend on Eleblorb's project settings or autoloads.

## Run locally

Open this folder in Godot and run `main.tscn`.

Controls:

- WASD: move
- Shift: run
- Space: jump
- Mouse: look
- F: talk
- Escape: release the mouse

## Export for the site

Install the Godot web export templates, select the included `Web` preset, and export. The preset writes to `machines/hub/index.html` in the Kueh Machine repository.

The preset is deliberately single-threaded, so the static site does not need COOP/COEP headers. Commit the generated `machines/hub/` files when the build is ready to publish.

## Content notes

Contributor configuration, dialogue, positions, destinations, and display types live in `scripts/hub_main.gd`. Geraldine and Kevin currently have NPCs without displays or project links. Nicole and Samantha are configured as active projects.
