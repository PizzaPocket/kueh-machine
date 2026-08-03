# Peranakan tile generator — integration kit

This folder is a prototype exploring Ken's existing `.hero-tile-bg` motif
(the repeating background tile behind his hero section) plus a new
procedural generator that produces fresh tile designs in the same spirit,
inspired by real Peranakan/Portuguese reference tiles. It's meant to be
handed to Claude Code inside Ken's actual project with a prompt like:
*"I want to integrate this into my gacha machine, figure it out from the
files in this folder."*

## What's in here

- **`tile.svg`** — the exact tile currently baked into `css/style.css` as an
  inline data-URI (`.hero-tile-bg`'s `background-image`), extracted into its
  own file for convenience. Not required for integration, just a reference.
- **`tile-row.html`** — the working prototype: the real tile shown 2x4, plus
  a "Peranakan tile generator" section with a "Generate Tiles" button that
  produces a brand-new random tile design each click.

## How the generator works

Everything lives in one `<script>` block in `tile-row.html`:

- **`PALETTES`** — 8 named color sets (bg / frame / medallion / corner /
  line colors), some Peranakan-classic, one pulled from Ken's own site
  variables so results can still feel native to his palette.
- **`petal(cx, cy, angle, len, width)`** — returns a bezier path string for
  one curvy pointed petal. Every flower motif is built from rings of these
  (`petalRing`), not primitive circles/ellipses — that distinction mattered
  after review, keep it that way in anything added later.
- **`MEDALLIONS`** — an array of functions (quatrefoil, starburst, clover,
  diamond-star, pommee-cross, scroll-rosette, star-in-clover), each drawing
  one center motif given two colors.
- **`FRAME_STYLES`** / **`CORNERS`** — the lattice/diamond/scallop framing
  and the small corner accents, mixed in independently of the medallion.
- **`generateCornerDropTile(p)`** — a second tile *composition*, not just a
  new motif: it draws quarter-rosettes centered exactly on the tile's four
  corners. SVG clips each to its own quarter automatically, so when the same
  tile repeats edge-to-edge, four adjacent corners reconstruct one full
  medallion sitting on the grout line — the same technique real tile sets
  use (see the reference photos this was built against). `generateTileSvg()`
  picks this mode about a third of the time.

Calling `generateTileSvg()` returns a full standalone `<svg>...</svg>`
string; `paintGeneratedGrid()` turns that into a data-URI and sets it as a
tiling CSS `background-image` on a 4-tile-wide, 2-tile-tall box.

## What to actually change in the real app

1. **If you just want the existing hero background as a real file** instead
   of an inline data-URI: drop `tile.svg` into `machines/ken/` (an `assets/`
   folder doesn't exist yet — this project keeps everything inline) and
   point `.hero-tile-bg`'s `background-image` at it with `url("./tile.svg")`
   instead of the long encoded string in `css/style.css`.

2. **If you want the generator itself live on the site** — e.g. a "shuffle
   the background" easter egg, or a dedicated tile-pattern section — lift
   `PALETTES`, `petal`/`petalRing`, `MEDALLIONS`, `FRAME_STYLES`, `CORNERS`,
   `generateCornerDropTile`, and `generateTileSvg` more or less as-is into
   `js/app.js` (or a new `js/tiles.js`), and call `generateTileSvg()`
   wherever you want a fresh pattern — e.g. re-rolling `.hero-tile-bg`'s
   `background-image` on load, or on a button press styled with the site's
   existing `.btn.btn-primary`.

3. **Keep the petal-based curves, don't reintroduce scrollwork shapes.** An
   earlier pass tried hand-drawn paisley/scroll bezier curves and they read
   as squiggles rather than ornamentation once actually reviewed — the
   petal ring construction is the one that held up, so anything new should
   build on that rather than freehanding new curve shapes blind.

## Reference

The live prototype was reviewed at
`/machines/ken/backdoor/tile-row.html` before this handoff was written.
