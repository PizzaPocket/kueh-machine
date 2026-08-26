# Kueh Partee

Built by **Jesslyn** for [kuehmachine.com](https://kuehmachine.com).

## Concept

A single-page birthday-planning app for a 10-year-old, dressed as a
Peranakan-kueh-themed party. The child gets a $2,000 budget and plans their
day — a party, a wanted gift, an activity with family or friends, or any mix
of the three — while a kueh-lapis budget meter, a need/want tag on every
choice, and a glass Savings Jar that fills up with leftover money quietly
teach the habits of spending and saving well. Nothing here treats a bigger
or more expensive day as a better one: the cheapest option in every category
is framed just as warmly as the priciest, and the end screen celebrates
saving as much as it celebrates spending. For the party and activity paths,
the child also designs an invitation card and keeps a simple in-session
guest list as RSVPs come in.

It connects back to kuehmachine.com two ways: literally, in its Peranakan
kueh dress-up (the palette, the icon set, the layered jar and meter), and
structurally — the app itself works like a small machine, feeding it a
budget and a set of choices to produce a plan, a card, and a savings goal.

## Look & feel

- **Palette** — fixed Peranakan colours as CSS variables in `theme.css`:
  coconut cream `#FFF7E9` (background), pandan green `#3FA34D`,
  butterfly-pea blue `#4A5DAE`, gula-melaka amber `#C77D3A`, ang-ku rose
  `#E23B54`, nyonya turquoise `#2BB6B0`, and deep text `#2A2A4A`. The
  child's favourite-colour pick on the welcome screen selects one of the
  five accent hues to theme buttons and highlights throughout.
- **Type** — **Baloo 2** for headings (rounded, friendly, a little bubbly)
  and **Quicksand** for body text (clean, geometric, easy to read on a
  tablet).
- A faint Peranakan majolica-tile pattern sits behind everything on the
  page, and cards carry a thin, light border accent — enough texture to
  feel handmade, never enough to fight the text sitting on top of it.
- Every icon is a small hand-drawn kueh-themed SVG (no emoji) — kueh
  lapis, ang ku kueh, pineapple tarts and friends stand in for balloons,
  gifts and print buttons alike.
- Big, chunky, touch-friendly buttons and cards throughout — designed to
  work as well with a finger on an iPad as with a mouse.

## Features

- [x] Welcome screen: name + favourite Peranakan colour, live "[Name]'s
      Kueh Partee" title, colour-themes the whole app
- [x] Choose-your-celebration screen: party / gift / activity, pick one or
      mix several
- [x] Party planner: 5 categories × 3 price tiers each, shown as clickable
      cards
- [x] Gift browser with a "save up" plan (adjustable weekly amount) when a
      gift is out of budget
- [x] Activity picker: beach day, jungle lodge, rainforest resort
- [x] Live budget meter ($2,000) styled as a kueh-lapis bar — it builds up
      in coloured layers as you spend, and spills over the top in a rose
      "drip" if you go past budget
- [x] Need/Want tagging on every selected item
- [x] Glass Savings Jar that fills with leftover budget, topped with a
      child-named savings goal
- [x] Friendly end-of-day summary with a trade-off note that treats
      saving as a win
- [x] Invitation card creator: theme, colours, date, place, message —
      printable and saveable as an image
- [x] In-session RSVP guest list, exportable as CSV
- [x] Tablet-friendly layout throughout

## Running it

No build step — just open `index.html` in a browser.

`style.css` holds the app's structure and layout; `theme.css` layers the
Kueh Partee palette, majolica background, and jar/meter visuals on top of
it.
