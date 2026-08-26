# Kueh Machine

**by Viki** — a part of [kuehmachine.com](https://kuehmachine.com)

## The concept

A factory that makes kueh nobody has made before. The machine starts empty. You
pull a kueh off a running conveyor belt and drop it in the hopper, hit Modify to
open the hatch, and get at its insides — fillings, dyes, finishes, and thin
layer sheets you stack one at a time. Hit run, the steamer shakes, and the
machine prints you a recipe for the thing you just invented.

That last part is the whole point. The machine industrialises something that
resists being industrialised, and what it hands back is instructions for making
it by hand.

It's one screen. The machine is the whole thing.

The connection to the machine is direct: this *is* the kueh machine, taken
literally. Kueh is handmade, repetitive, patient work — nine layers of lapis
poured and set one at a time. Putting that on a conveyor belt and giving it a
control panel is the joke and the point at once. The machine industrialises
something that resists being industrialised, and what comes out is still
one-of-a-kind.

## Look and feel

- **Palette** — cream and sand paper stock, pandan green as the working colour,
  rose for the run button, gula melaka brown and blue pea for the dyes. All
  authored in oklch so the canvas and the CSS chips stay in step.
- **Type** — Instrument Serif for headlines, JetBrains Mono for machine readouts
  and labels, Space Grotesk for body copy.
- **Signature element** — inside the chamber, the kueh is drawn live on a
  `<canvas>` as an isometric block: layered, textured, with light bleeding
  through each layer and a specular highlight on the front face. The finish you
  pick changes it — coconut dust speckles the top, a torched top caramelises it,
  a glutinous coat rounds the corners off.
- **Two views of the same kueh** — the machine window on the landing page shows
  the kueh's own photograph, the one that was sitting on the belt. The canvas
  render is kept for the chamber, where you're building rather than looking.
- **Seven kuehs go deep.** Each has its own chamber, its own controls, and its
  own way of being drawn:
  - **Kueh lapis** — named flavours, nine themes, a custom picker, and plain or
    gradient colour runs across up to twenty layers. No filling and no finish,
    because a lapis is nothing but coloured sheets.
  - **Ondeh ondeh** — a dough colour, ten fillings and seven coatings, drawn as
    two balls on a banana leaf with one cut open. The gula melaka stretches and
    drips out of the cut face on a loop. No layers, because it's a ball.
  - **Kueh salat** — two decisions only: what the custard on top tastes of, and
    what colour the glutinous rice underneath is dyed. Drawn as two unequal
    bands, the lower one speckled with rice grains.
  - **Kueh bangkit** — three decisions: the mould it's pressed into, the colour
    the dough is dyed, and what it's flavoured with. Dye and flavouring go in
    separately, so a rose-tinted biscuit can taste of durian.
  - **Kueh bahulu** — the brass mould, and what goes in the batter. Flavour
    carries the colour here: a bahulu's tint comes from what's in it.
  - **Kueh tutu** — the mould, the colour of the steamed rice flour, and what's
    packed inside. Served on its square of leaf, with the filling showing
    through the thin top.
  - **Ang ku kueh** — the press, the colour of the glutinous skin, and the
    filling. Tortoise and peach moulds included, both stamped with their
    pattern, on a leaf square under a wet-looking skin.

  Those four are drawn flat from directly above, because a moulded kueh is all
  silhouette — the shape is the design. They share one renderer.

  Kueh dadar and kueh bingka are still down. They load into the machine fine but
  open onto an **In maintenance** panel rather than controls that don't mean
  anything yet. The panel counts the lines off the belt data, so it can't claim
  the wrong number as studios get added.

- **The machine has opinions.** Every run is graded out of 100, and it grades
  *decisions* rather than ingredients — which is the only thing that generalises,
  since kueh lapis has no flavour to judge but every kueh has a traditional
  default and choices you can push away from it. Three things feed the number:
  how many decisions you changed, how far each one went, and how much they pull
  against each other. That last one is what stops it being a boldness slider —
  a wild filling inside a traditional shell beats everything set to maximum,
  because cranking every control is bold but not especially creative. The
  untouched default scores low on purpose. *"A perfectly good kueh. Now go and
  ruin it."*

## Built

- Plain HTML, CSS and JavaScript. No build step, no dependencies, no CDN.
- Project assets use relative paths so the folder can be dropped into a
  subdirectory of kuehmachine.com. The universal account widget is loaded from
  `/shared/account-widget.js`; recipes and machine builds remain ephemeral.
- Fonts and kueh photos are bundled in `assets/`.

## Files

| | |
|---|---|
| `index.html` | Page structure |
| `styles.css` | Font faces, tokens and all component styles |
| `app.js` | State, the machine's behaviour, and rendering |
| `kueh-canvas.js` | The isometric layered-kueh renderer, carried over from v1 |
| `ondeh-canvas.js` | The ondeh ondeh renderer, carried over from v1 |
| `topview-canvas.js` | The moulded kuehs — bangkit, bahulu, tutu and ang ku, from above |
| `assets/kueh-machine-logo.svg` | The logo lockup (source; inlined into `index.html`) |
| `assets/kueh/` | The nine kueh photographs |
| `assets/fonts/` | Instrument Serif, JetBrains Mono, Space Grotesk |

## Feature checklist

- [x] Machine sits empty, with a greyed-out kueh as a hint of what goes in
- [x] Conveyor belt you can drag a kueh off, or click if you're on a phone —
      the two lanes carry different halves, so nothing appears twice
- [x] Machine hopper that accepts a dropped kueh and loads its preset
- [x] Drop animation and a rattling machine while it swallows the kueh
- [x] Modify button opens the hatch — disabled until something's loaded
- [x] Interior view — drag in fillings, dyes and finishes
- [x] Kueh lapis gets v1's full colour studio: 9–20 layers, nine themes,
      a 1–3 colour custom picker, and plain or gradient runs
- [x] Ondeh ondeh gets v1's studio too: exterior colour with a custom picker,
      ten interior fillings, seven coatings, and the animated gula melaka drip
- [x] Kueh salat gets two settings: custard flavour and rice colour
- [x] Kueh bangkit gets three: mould, colour and flavour, drawn top-down
- [x] Kueh bahulu gets two: the brass mould and the batter flavour
- [x] Kueh tutu gets three: mould, exterior colour and interior filling
- [x] Ang ku kueh gets three: mould, skin colour and interior filling
- [x] The two unbuilt kuehs open onto an "In maintenance" panel
- [x] Every run is graded out of 100 on creativity, with a verdict and one
      line naming what drove the score
- [x] A run ejects you from the hatch and feeds a recipe card out of the
      machine's output slot, polaroid-style
- [x] The card is serial-stamped and specific to your build — layer count drives
      the quantities, your colours become named ingredients
- [x] It carries a picture of the kueh you actually made, lifted off the canvas
- [x] The card prints to paper cleanly (Cmd-P), on its own, at A4
- [x] Live canvas kueh that redraws as you change layers, colour and finish
- [x] Rolling machine log
- [x] Run cycle with steam and a shaking machine
- [x] Works on mobile — every drag target is also a click target

## Running it

Open `index.html` in a browser. That's all — no server needed.
