/* ───────────────────────────────────────────────────────────────────────────
   app.js — Kueh Machine

   Ported from the v2.0 artifact component. The data tables and behaviour are
   carried over as-is; the React/DCLogic layer is replaced by a plain state
   object, a setState that re-renders, and static DOM built once at init.
   ─────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ─── DATA ──────────────────────────────────────────────────────────────────

  const PALETTES = {
    pandan:  { label: 'Pandan',       swatch: 'oklch(0.63 0.12 148)', layers: ['oklch(0.68 0.13 148)', 'oklch(0.95 0.03 92)'], top: 'oklch(0.55 0.11 148)' },
    rose:    { label: 'Rose',         swatch: 'oklch(0.63 0.12 25)',  layers: ['oklch(0.68 0.14 22)',  'oklch(0.97 0.02 90)'], top: 'oklch(0.57 0.13 22)'  },
    bluepea: { label: 'Blue pea',     swatch: 'oklch(0.5 0.11 268)',  layers: ['oklch(0.52 0.11 268)', 'oklch(0.94 0.02 92)'], top: 'oklch(0.44 0.1 268)'  },
    gula:    { label: 'Gula melaka',  swatch: 'oklch(0.48 0.09 62)',  layers: ['oklch(0.52 0.09 62)',  'oklch(0.86 0.05 82)'], top: 'oklch(0.42 0.08 60)'  },
  };

  const FILLINGS = {
    gula:    { label: 'Gula melaka', swatch: 'oklch(0.45 0.08 60)',  desc: 'a molten palm-sugar core that runs the second you bite' },
    kaya:    { label: 'Kaya',        swatch: 'oklch(0.72 0.11 118)', desc: 'coconut-egg jam folded through the middle' },
    peanut:  { label: 'Peanut',      swatch: 'oklch(0.68 0.09 78)',  desc: 'coarse sugared peanut, crunchy in the worst best way' },
    redbean: { label: 'Red bean',    swatch: 'oklch(0.42 0.08 22)',  desc: 'slow-cooked red bean, only lightly sweet' },
    durian:  { label: 'Durian',      swatch: 'oklch(0.78 0.12 100)', desc: 'D24 paste, unapologetic' },
  };

  const EXTERIORS = {
    steamed:   { label: 'Steamed skin',    desc: 'glossy steamed skin' },
    glutinous: { label: 'Glutinous coat',  desc: 'a chewy glutinous wrap' },
    coconut:   { label: 'Coconut dust',    desc: 'rolled in fresh grated coconut' },
    torched:   { label: 'Torched top',     desc: 'a blowtorched sugar lid' },
  };

  // `h` is the belt slot height in px. The images are trimmed so the kueh's
  // bottom edge is the image's bottom edge — that's what seats them on the
  // belt — so these values are the pre-trim sizes scaled by how much shorter
  // each image became, which keeps them all looking the size they were.
  // Ordered tallest, shortest, next-tallest, next-shortest … so the silhouette
  // rises and falls along the belt instead of clumping similar heights together.
  // The loop wraps 84 → 94, so the rhythm carries across the join too.
  const BELT_SHAPES = [
{ id: 'ondeh',   src: './assets/kueh/ondeh.png',   alt: 'Ondeh ondeh',  h: 95, note: 'Explodes on contact. Bib provided.',                 preset: { layers: 4, palette: 'pandan',  filling: 'gula',   exterior: 'coconut'   } },
    { id: 'bangkit', src: './assets/kueh/bangkit.png', alt: 'Kueh bangkit', h: 81, note: 'Dissolves the moment it touches your tongue.',       preset: { layers: 3, palette: 'pandan',  filling: 'kaya',   exterior: 'steamed'   } },
{ id: 'tutu',    src: './assets/kueh/tutu.png',    alt: 'Tutu kueh',    h: 94, note: 'Steamed in a cloth ring, gone in two bites.',        preset: { layers: 6, palette: 'gula',    filling: 'peanut', exterior: 'steamed'   } },
    { id: 'salat',   src: './assets/kueh/salat.png',   alt: 'Kueh salat',   h: 82, note: 'Pandan custard on blue pea glutinous rice.',         preset: { layers: 5, palette: 'bluepea', filling: 'kaya',   exterior: 'steamed'   } },
    { id: 'angku',   src: './assets/kueh/angku.png',   alt: 'Ang ku kueh',  h: 92, note: 'Tortoise-stamped, peanut inside, lucky apparently.', preset: { layers: 3, palette: 'rose',    filling: 'peanut', exterior: 'glutinous' } },
    { id: 'lapis',   src: './assets/kueh/lapis.png',   alt: 'Kueh lapis',   h: 84, note: 'The house standard. Peeled, never bitten.',          preset: { layers: 9, palette: 'rose',    filling: 'kaya',   exterior: 'steamed'   } },
    { id: 'bingka',  src: './assets/kueh/bingka.png',  alt: 'Kueh bingka',  h: 92, note: 'Baked until the top blisters and the edges pull away.',   preset: { layers: 4, palette: 'gula',    filling: 'kaya',   exterior: 'torched'   } },
    { id: 'dadar',   src: './assets/kueh/dadar.png',   alt: 'Kueh dadar',   h: 86, note: 'Pandan crepe rolled around sweet grated coconut.',   preset: { layers: 3, palette: 'pandan',  filling: 'gula',   exterior: 'coconut'   } },
    { id: 'bahulu',  src: './assets/kueh/bahulu.png',  alt: 'Kueh bahulu',  h: 90, note: 'Baked in a brass mould, best dunked in coffee.',     preset: { layers: 4, palette: 'gula',    filling: 'kaya',   exterior: 'torched'   } },
  ];

  const RUN_MS = 1800;     // how long a run takes
  const LOAD_MS = 900;     // how long the machine rattles while swallowing a kueh

  // ─── LAPIS STUDIO ──────────────────────────────────────────────────────────
  // Kueh lapis is the one we built properly in v1, so it keeps its own colour
  // system: named flavours, themes, a custom picker and plain/gradient runs.
  // Every other kueh uses the simpler v2 dye cards.

  const FLAVOURS = [
    { id: 'pandan',        name: 'Pandan',        hex: '#2a7a4a' },
    { id: 'butterfly_pea', name: 'Butterfly Pea', hex: '#4a3d9e' },
    { id: 'strawberry',    name: 'Strawberry',    hex: '#d9405a' },
    { id: 'red',           name: 'Red',           hex: '#c82840' },
    { id: 'kaya',          name: 'Kaya',          hex: '#8a6418' },
    { id: 'ube',           name: 'Ube',           hex: '#6e50aa' },
    { id: 'coconut',       name: 'Coconut',       hex: '#f2e4c8' },
    { id: 'mango',         name: 'Mango',         hex: '#f0a028' },
    { id: 'taro',          name: 'Taro',          hex: '#9b7ec8' },
    { id: 'rose',          name: 'Rose',          hex: '#e070a0' },
    { id: 'charcoal',      name: 'Charcoal',      hex: '#2e2e2e' },
    { id: 'white',         name: 'White',         hex: '#f5f2ee' },
    { id: 'pastel_blue',   name: 'Pastel Blue',   hex: '#a8c4e0' },
  ];

  const THEMES = [
    { id: 'classic', name: 'Classic', a: 'red',           b: 'pandan',     c: 'coconut'     },
    { id: 'rainbow', name: 'Rainbow', rainbow: true },
    { id: 'garden',  name: 'Garden',  a: 'pandan',        b: 'coconut'     },
    { id: 'cool',    name: 'Cool',    a: 'butterfly_pea', b: 'taro'        },
    { id: 'warm',    name: 'Warm',    a: 'strawberry',    b: 'mango'       },
    { id: 'royal',   name: 'Royal',   a: 'ube',           b: 'rose'        },
    { id: 'earthy',  name: 'Earthy',  a: 'kaya',          b: 'coconut'     },
    { id: 'breeze',  name: 'Breeze',  a: 'white',         b: 'pastel_blue' },
    { id: 'custom',  name: 'Custom',  custom: true },
  ];

  const LAPIS_MIN = 9, LAPIS_MAX = 20;   // v1's layer range
  const KUEH_MIN = 3, KUEH_MAX = 14;     // v2's range for everything else

  // ─── ONDEH STUDIO ──────────────────────────────────────────────────────────
  // The other kueh we built properly in v1: a dough colour, a filling that
  // drips, and something to roll it in.

  const EXTERIOR_COLORS = [
    { id: 'green',  name: 'Green',  hex: '#72c47e' },
    { id: 'blue',   name: 'Blue',   hex: '#5a8ac8' },
    { id: 'pink',   name: 'Pink',   hex: '#e07898' },
    { id: 'white',  name: 'White',  hex: '#f0ece4' },
    { id: 'purple', name: 'Purple', hex: '#8a6ac0' },
    { id: 'yellow', name: 'Yellow', hex: '#e8c840' },
  ];

  const ONDEH_FILLINGS = [
    { id: 'gula_melaka',  name: 'Gula Melaka',  hex: '#5c2a0a', glossy: true },
    { id: 'kaya',         name: 'Kaya',         hex: '#7a8a2a', glossy: false },
    { id: 'custard',      name: 'Custard',      hex: '#f0c840', glossy: false },
    { id: 'nutella',      name: 'Nutella',      hex: '#3a1a08', glossy: false },
    { id: 'chocolate',    name: 'Chocolate',    hex: '#2c1206', glossy: false },
    { id: 'red_bean',     name: 'Red Bean',     hex: '#7a1a36', glossy: false },
    { id: 'taro',         name: 'Taro',         hex: '#9b7ec8', glossy: false },
    { id: 'durian',       name: 'Durian',       hex: '#c8b448', glossy: true },
    { id: 'salted_egg',   name: 'Salted Egg',   hex: '#f0920a', glossy: true },
    { id: 'matcha_cream', name: 'Matcha Cream', hex: '#5a8030', glossy: false },
  ];

  const COATINGS = [
    { id: 'coconut',         name: 'Coconut Flakes' },
    { id: 'toasted_coconut', name: 'Toasted Coconut' },
    { id: 'sesame',          name: 'Sesame Seeds' },
    { id: 'peanuts',         name: 'Crushed Peanuts' },
    { id: 'sugar',           name: 'Powdered Sugar' },
    { id: 'matcha',          name: 'Matcha Powder' },
    { id: 'cocoa',           name: 'Cocoa Powder' },
  ];

  // ─── SALAT STUDIO ──────────────────────────────────────────────────────────
  // Two bands and two decisions: what the custard on top tastes of, and what
  // colour the glutinous rice underneath is dyed.

  const CUSTARDS = [
    { id: 'pandan', name: 'Pandan',      hex: '#4f9a55',
      note: 'Blend 12 pandan leaves with 120ml water and squeeze through a cloth for the custard.' },
    { id: 'coconut', name: 'Coconut',    hex: '#efe4c8',
      note: 'Leave the custard uncoloured and use thick first-press coconut milk.' },
    { id: 'gula', name: 'Gula Melaka',   hex: '#a56b2e',
      note: 'Melt 80g gula melaka into the coconut milk before whisking it into the custard.' },
    { id: 'durian', name: 'Durian',      hex: '#d6bd4a',
      note: 'Fold 100g durian flesh, well mashed, into the custard once it has thickened.' },
    { id: 'kaya', name: 'Kaya',          hex: '#9c9c33',
      note: 'Whisk 60g kaya into the custard base and cut the sugar by half.' },
  ];

  const RICE_COLOURS = [
    { id: 'bluepea', name: 'Blue pea',  hex: '#5a7fc0',
      note: 'Steep 25 dried butterfly pea flowers in 100ml hot water, then soak part of the rice in it for the marbled blue.' },
    { id: 'plain', name: 'Plain',       hex: '#f0e9db',
      note: 'Leave the rice undyed — soak in plain water overnight.' },
    { id: 'pandan', name: 'Pandan',     hex: '#7fae63',
      note: 'Soak the rice in pandan juice overnight for an even green.' },
    { id: 'rose', name: 'Rose',         hex: '#dd8fa6',
      note: 'Tint the soaking water with a drop of pink colouring and ½ tsp rose water.' },
    { id: 'turmeric', name: 'Turmeric', hex: '#e3c257',
      note: 'Add ½ tsp turmeric to the soaking water for a deep yellow base.' },
    { id: 'charcoal', name: 'Charcoal', hex: '#4c4a48',
      note: 'Stir ½ tsp activated charcoal powder into the soaking water.' },
  ];

  // ─── BANGKIT STUDIO ────────────────────────────────────────────────────────
  // One decision: which mould it's pressed into. A bangkit is all silhouette,
  // so the shape is the whole design — hence the top-down view.

  const MOULDS = [
    { id: 'flower',  name: 'Flower',  hex: '#f0e6cf', rarity: 0,
      note: 'The six-petal press every tin of bangkit comes with.' },
    { id: 'rosette', name: 'Rosette', hex: '#efe4cb', rarity: 1,
      note: 'A scalloped rim with two impressed rings inside.' },
    { id: 'star',    name: 'Star',    hex: '#f2e8d2', rarity: 1,
      note: 'Six points, spokes pressed from the centre.' },
    { id: 'leaf',    name: 'Leaf',    hex: '#eee3c8', rarity: 2,
      note: 'A pointed oval with a midrib and veins running off it.' },
    { id: 'fish',    name: 'Fish',    hex: '#f1e7d0', rarity: 2,
      note: 'Body, tail and scales. The hardest mould to turn out cleanly.' },
  ];

  // Dye and flavouring go into the dough separately, so these are two controls,
  // not one — a rose-tinted bangkit that tastes of pandan is a real thing.
  const BANGKIT_COLOURS = [
    { id: 'plain',    name: 'Plain',    hex: '#f0e6cf', bold: 0,
      note: 'Left undyed — the tapioca bakes to its own pale cream.' },
    { id: 'pandan',   name: 'Pandan',   hex: '#cddcb2', bold: 1,
      note: 'A tablespoon of pandan juice in the coconut cream.' },
    { id: 'rose',     name: 'Rose',     hex: '#f0cdd3', bold: 2,
      note: 'A single drop of pink colouring. More than that and it turns garish.' },
    { id: 'bluepea',  name: 'Blue pea', hex: '#ccd7e8', bold: 2,
      note: 'Butterfly pea steeped and strained into the wet mix.' },
    { id: 'turmeric', name: 'Turmeric', hex: '#eddaa6', bold: 1,
      note: 'A quarter teaspoon of turmeric, sifted in with the flour.' },
    { id: 'cocoa',    name: 'Cocoa',    hex: '#d8bda0', bold: 2,
      note: 'Two teaspoons of cocoa, which also takes the edge off the sweetness.' },
  ];

  const BANGKIT_FLAVOURS = [
    { id: 'coconut', name: 'Coconut',     bold: 0,
      note: 'Thick first-press coconut cream and nothing else. The original.' },
    { id: 'pandan',  name: 'Pandan',      bold: 1,
      note: 'Pandan leaves dry-fried with the flour, then a spoon of the juice in the dough.' },
    { id: 'gula',    name: 'Gula melaka', bold: 2,
      note: 'Swap 60g of the sugar for grated gula melaka. It browns faster, so watch the oven.' },
    { id: 'kaya',    name: 'Kaya',        bold: 2,
      note: 'Two tablespoons of kaya beaten into the yolks. Cut the sugar to compensate.' },
    { id: 'durian',  name: 'Durian',      bold: 3,
      note: 'Freeze-dried durian powder, 20g. Fresh flesh has too much water and the dough will not hold.' },
    { id: 'ginger',  name: 'Ginger',      bold: 2,
      note: 'A teaspoon of ground ginger with the flour. Warms the finish considerably.' },
  ];

  // ─── BAHULU STUDIO ─────────────────────────────────────────────────────────
  // The brass mould and what goes in the batter. Flavour carries the colour
  // here — a bahulu's tint comes from what's in it and how far it baked.

  const BAHULU_SHAPES = [
    { id: 'flower',  name: 'Flower',  rarity: 0, note: 'The eight-cup flower tray, the one every kitchen has.' },
    { id: 'shell',   name: 'Shell',   rarity: 1, note: 'A fluted fan. Ridges hold the crust and it browns unevenly, which is the point.' },
    { id: 'star',    name: 'Star',    rarity: 1, note: 'Six points. The tips catch first, so pull them early.' },
    { id: 'fish',    name: 'Fish',    rarity: 2, note: 'An old mould, rarely cast now. The tail overbakes if you are not watching.' },
    { id: 'heart',   name: 'Heart',   rarity: 2, note: 'Sentimental, and awkward to grease into the corners.' },
  ];

  const BAHULU_FLAVOURS = [
    { id: 'plain',   name: 'Plain',        hex: '#d9a25c', bold: 0,
      note: 'Nothing but egg, sugar and flour. The whole trick is in the beating.' },
    { id: 'pandan',  name: 'Pandan',       hex: '#aeb168', bold: 1,
      note: 'Two tablespoons of pandan juice, folded in at the very end.' },
    { id: 'gula',    name: 'Gula melaka',  hex: '#b87b3f', bold: 2,
      note: 'Half the sugar swapped for grated gula melaka. It browns faster — drop the oven 10°C.' },
    { id: 'orange',  name: 'Orange',       hex: '#e0a04a', bold: 2,
      note: 'The zest of two oranges beaten in with the eggs.' },
    { id: 'cocoa',   name: 'Cocoa',        hex: '#8d5c3e', bold: 2,
      note: 'Sift 30g cocoa in with the flour and add a spoon more sugar to balance it.' },
  ];

  // ─── TUTU STUDIO ───────────────────────────────────────────────────────────
  // Mould, the colour of the steamed rice flour, and what is packed inside.

  const TUTU_SHAPES = [
    { id: 'flower',  name: 'Flower',  rarity: 0, note: 'The standard press, stamped straight out of the steamer tube.' },
    { id: 'round',   name: 'Round',   rarity: 0, note: 'No press at all — just the tube. Plain and quick.' },
    { id: 'star',    name: 'Star',    rarity: 1, note: 'Points that crack a little as it steams. Some stalls do this on purpose.' },
    { id: 'heart',   name: 'Heart',   rarity: 2, note: 'Nobody presses tutu into hearts. There is no reason you cannot.' },
  ];

  const TUTU_COLOURS = [
    { id: 'plain',    name: 'Plain',    hex: '#f2ece0', bold: 0, note: 'Undyed rice flour, steamed white.' },
    { id: 'pandan',   name: 'Pandan',   hex: '#cfdfb6', bold: 1, note: 'Pandan juice worked through the flour before steaming.' },
    { id: 'rose',     name: 'Rose',     hex: '#f2d2d8', bold: 2, note: 'A drop of pink into the water used to damp the flour.' },
    { id: 'bluepea',  name: 'Blue pea', hex: '#ccd8ea', bold: 2, note: 'Butterfly pea steeping water, strained, used to damp the flour.' },
    { id: 'turmeric', name: 'Turmeric', hex: '#eedcaa', bold: 1, note: 'A pinch of turmeric sifted through the dry flour.' },
  ];

  const TUTU_FILLINGS = [
    { id: 'peanut',  name: 'Peanut',      hex: '#c69a5e', bold: 0,
      note: 'Roasted peanuts crushed coarse with sugar. The one everybody queues for.' },
    { id: 'coconut', name: 'Gula coconut', hex: '#8a5a2a', bold: 0,
      note: 'Grated coconut cooked down with gula melaka until it just holds together.' },
    { id: 'cocoa',   name: 'Chocolate',   hex: '#4a2c1c', bold: 2,
      note: 'Chopped dark chocolate. It melts in the steamer and runs when you bite.' },
    { id: 'redbean', name: 'Red bean',    hex: '#7a3040', bold: 1,
      note: 'Thick red bean paste, only lightly sweetened.' },
    { id: 'durian',  name: 'Durian',      hex: '#c8b448', bold: 3,
      note: 'D24 paste, frozen into small mounds first so it survives the steam.' },
  ];

  // ─── ANG KU STUDIO ─────────────────────────────────────────────────────────
  // Mould, the colour of the glutinous skin, and what's packed inside it.

  const ANGKU_SHAPES = [
    { id: 'tortoise', name: 'Tortoise', rarity: 0,
      note: 'The shell press. Longevity, and the reason anyone recognises an ang ku.' },
    { id: 'peach',    name: 'Peach',    rarity: 1,
      note: 'The longevity peach, cleft and stem pressed in. Brought out for birthdays.' },
    { id: 'flower',   name: 'Flower',   rarity: 1,
      note: 'A six-petal press. Less traditional, easier to unmould cleanly.' },
    { id: 'fish',     name: 'Fish',     rarity: 2,
      note: 'Abundance. An old mould, and the tail tears if the dough is too soft.' },
    { id: 'round',    name: 'Round',    rarity: 2,
      note: 'No press at all. Nothing stamped, nothing claimed.' },
  ];

  const ANGKU_COLOURS = [
    { id: 'red',    name: 'Red',    hex: '#cf3f42', bold: 0, note: 'Red colouring worked into the dough — the colour it has always been.' },
    { id: 'orange', name: 'Orange', hex: '#e08238', bold: 1, note: 'Sweet potato mashed into the dough, which tints it and softens the skin.' },
    { id: 'green',  name: 'Pandan', hex: '#6fa356', bold: 1, note: 'Pandan juice in place of some of the water.' },
    { id: 'yellow', name: 'Yellow', hex: '#e0b840', bold: 2, note: 'Steamed pumpkin worked through the dough.' },
    { id: 'purple', name: 'Yam',    hex: '#8f6bb0', bold: 2, note: 'Purple sweet potato, steamed and mashed very fine.' },
    { id: 'white',  name: 'White',  hex: '#efe6d8', bold: 2, note: 'Left undyed. Unusual enough that people ask what it is.' },
  ];

  const ANGKU_FILLINGS = [
    { id: 'peanut',  name: 'Peanut',      hex: '#c69a5e', bold: 0,
      note: 'Roasted peanuts ground with sugar until it just holds. The default.' },
    { id: 'mungbean', name: 'Mung bean',  hex: '#d8c070', bold: 0,
      note: 'Split mung beans steamed soft, mashed with sugar and a little oil.' },
    { id: 'redbean', name: 'Red bean',    hex: '#7a3040', bold: 1,
      note: 'Thick red bean paste, only lightly sweetened.' },
    { id: 'coconut', name: 'Gula coconut', hex: '#8a5a2a', bold: 1,
      note: 'Grated coconut cooked down with gula melaka until sticky.' },
    { id: 'sesame',  name: 'Black sesame', hex: '#332b28', bold: 2,
      note: 'Toasted black sesame ground with sugar and lard until it forms a paste.' },
    { id: 'salted',  name: 'Salted egg',  hex: '#e8922a', bold: 3,
      note: 'Steamed salted yolks mashed with a little custard powder. Not traditional. Very good.' },
  ];

  function mould() {
    return MOULDS.filter(function (m) { return m.id === state.mould; })[0] || MOULDS[0];
  }

  function pick(list, id) {
    return list.filter(function (x) { return x.id === id; })[0] || list[0];
  }

  function bangkitColour() {
    return BANGKIT_COLOURS.filter(function (c) { return c.id === state.bangkitColour; })[0]
      || BANGKIT_COLOURS[0];
  }

  function bangkitFlavour() {
    return BANGKIT_FLAVOURS.filter(function (f) { return f.id === state.bangkitFlavour; })[0]
      || BANGKIT_FLAVOURS[0];
  }

  function custard() {
    return CUSTARDS.filter(function (c) { return c.id === state.custard; })[0] || CUSTARDS[0];
  }

  function riceColour() {
    return RICE_COLOURS.filter(function (c) { return c.id === state.rice; })[0] || RICE_COLOURS[0];
  }

  function doughHex() {
    if (state.doughColor === 'custom') return state.customDough;
    const c = EXTERIOR_COLORS.filter(function (x) { return x.id === state.doughColor; })[0];
    return (c || EXTERIOR_COLORS[0]).hex;
  }

  function ondehFilling() {
    return ONDEH_FILLINGS.filter(function (f) { return f.id === state.ondehFilling; })[0]
      || ONDEH_FILLINGS[0];
  }

  // ─── RECIPES ───────────────────────────────────────────────────────────────
  // What the machine hands back. Both generators are carried over from v1 and
  // are parametric on the same state the studios drive — change the layer count
  // and the quantities move with it.
  //
  // These build HTML strings. Every value comes from a fixed table except the
  // custom hex colours, which the browser constrains to #rrggbb.

  const COLOUR_DESC = {
    'Pandan':        'pandan extract or blended pandan juice',
    'Coconut':       'plain (uncoloured)',
    'Red':           'red food colouring',
    'Strawberry':    'red food colouring',
    'Butterfly Pea': 'butterfly pea flower tea (steep 6 flowers in 2 tbsp hot water)',
    'Ube':           'ube extract',
    'Taro':          'purple food colouring',
    'Rose':          'pink food colouring + a drop of rose water',
    'Mango':         'yellow food colouring',
    'Kaya':          'brown-green food colouring',
    'Charcoal':      'activated charcoal powder (¼ tsp)',
    'White':         'plain (uncoloured)',
    'Pastel Blue':   'blue food colouring (1–2 drops only)',
    // The rainbow theme names its own groups; v1 had no entries for these and
    // they all fell through to the generic line.
    'Orange':        'orange food colouring, or two parts yellow to one part red',
    'Yellow':        'yellow food colouring',
    'Green':         'pandan extract, or green food colouring',
    'Cyan':          'blue food colouring with a single drop of green',
    'Blue':          'butterfly pea flower tea (steep 6 flowers in 2 tbsp hot water)',
    'Violet':        'ube extract, or purple food colouring',
  };

  function lapisRecipeHTML() {
    const N = state.layers;
    const colourGroups = [];

    if (state.rainbow) {
      const hues = [0, 38, 60, 120, 200, 240, 270];
      const names = ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Violet'];
      hues.forEach(function (h, i) {
        const count = Math.round(N / hues.length) + (i < N % hues.length ? 1 : 0);
        if (count > 0) colourGroups.push({ name: names[i], hex: hslToHex(h, 68, 78), count: count });
      });
    } else if (state.theme === 'custom') {
      state.customColors.slice(0, state.customCount).forEach(function (hex, idx) {
        let count = 0;
        for (let i = 0; i < N; i++) if (i % state.customCount === idx) count++;
        colourGroups.push({ name: 'Colour ' + (idx + 1), hex: hex, count: count });
      });
    } else {
      const theme = THEMES.filter(function (t) { return t.id === state.theme; })[0];
      themeColors(theme).forEach(function (id) {
        const count = state.layerFlavors.filter(function (f) { return f === id; }).length;
        colourGroups.push({ name: flavorName(id), hex: flavorHex(id), count: count });
      });
    }

    // Quantities scale off v1's nine-layer baseline, rounded to sane increments.
    const rf = Math.round(250 * N / 9 / 25) * 25;
    const tf = Math.round(125 * N / 9 / 25) * 25;
    const cm = Math.round(500 * N / 9 / 50) * 50;
    const sg = Math.round(200 * N / 9 / 25) * 25;
    const mlPerLayer = Math.round(cm / N);
    const mlPerGroup = Math.round(cm / colourGroups.length);

    const colourLines = colourGroups.map(function (g) {
      const desc = COLOUR_DESC[g.name] || 'food colouring to match';
      return '<li><span class="recipe-dot" style="background:' + g.hex + '"></span>' +
        '<strong>' + g.name + '</strong> — ' + desc +
        ' (' + g.count + ' layer' + (g.count !== 1 ? 's' : '') + ')</li>';
    }).join('');

    const themeObj = THEMES.filter(function (t) { return t.id === state.theme; })[0];
    const themeName = state.rainbow ? 'Rainbow'
      : state.theme === 'custom' ? 'Custom' : ((themeObj && themeObj.name) || '');
    const colourFlow = colourGroups.map(function (g) { return '<strong>' + g.name + '</strong>'; }).join(' → ');

    return {
      title: themeName + ' Kueh Lapis',
      yield: N + ' layers · Makes one 7-inch square tray',
      body:
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Ingredients</h3>' +
          '<ul class="recipe-list">' +
            '<li>' + rf + 'g rice flour</li>' +
            '<li>' + tf + 'g tapioca starch</li>' +
            '<li>' + cm + 'ml full-fat coconut milk</li>' +
            '<li>' + sg + 'g caster sugar</li>' +
            '<li>½ tsp fine salt</li>' +
            '<li>Neutral oil, for greasing</li>' +
          '</ul>' +
          '<h3 class="recipe-section">Colourings</h3>' +
          '<ul class="recipe-list">' + colourLines + '</ul>' +
        '</div>' +
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Method</h3>' +
          '<ol class="recipe-steps">' +
            '<li>Grease a 7-inch square pan and line the base with baking paper.</li>' +
            '<li>Whisk rice flour, tapioca starch, coconut milk, sugar, and salt in a large bowl until smooth. Strain through a fine sieve.</li>' +
            '<li>Divide batter into ' + colourGroups.length + ' equal portions (~' + mlPerGroup + 'ml each). Stir in colourings: ' + colourFlow + '.</li>' +
            '<li>Bring steamer to a rolling boil. Place the empty pan inside to preheat for 2 minutes.</li>' +
            '<li>Pour the first colour into the hot pan — about ' + mlPerLayer + 'ml per layer, just enough to cover the base thinly. Steam for 3–4 minutes until just set (surface no longer looks wet).</li>' +
            '<li>Pour the next colour directly on top. Steam 3–4 minutes. Continue cycling ' + colourFlow + ', until all ' + N + ' layers are done.</li>' +
            '<li>On the final layer, steam for 10–12 minutes until fully cooked through.</li>' +
            '<li>Remove from steamer. Cool completely at room temperature for at least 2 hours before unmoulding — do not refrigerate while warm.</li>' +
            '<li>Cut into fingers using a sharp, lightly oiled knife. Wipe the blade between each cut for clean edges.</li>' +
          '</ol>' +
          '<p class="recipe-tip"><strong>Tip:</strong> Prop the steamer lid ajar with a chopstick to prevent condensation dripping onto the layers.</p>' +
        '</div>',
    };
  }

  const DOUGH_INGREDIENT = {
    green:  'fresh pandan juice (blend 10 pandan leaves with 80ml water, squeeze through cloth)',
    blue:   'butterfly pea flower tea (steep 20 dried flowers in 80ml hot water, cool)',
    pink:   '80ml water + ½ tsp rose or strawberry extract, plus a drop of pink food colouring',
    white:  'plain water (no colouring)',
    purple: '80ml water + ½ tsp ube extract or purple yam powder',
    yellow: '80ml water + ¼ tsp turmeric powder, stirred until dissolved',
  };

  const FILLING_NOTE = {
    gula_melaka:  'Roughly chop 120g gula melaka (palm sugar) into small pieces. Do not melt — it will dissolve during cooking.',
    kaya:         'Use 120g thick store-bought kaya, chilled until firm enough to scoop.',
    custard:      'Make a thick custard from 2 egg yolks, 30g sugar, 15g cornflour, and 80ml coconut milk. Cool completely and chill until firm.',
    nutella:      'Freeze 120g Nutella in a small tray in teaspoon-sized portions for at least 2 hours before use.',
    chocolate:    'Chop 120g dark chocolate (70%) into small pieces, about 1 tsp per ball.',
    red_bean:     'Use 120g thick red bean paste (store-bought or homemade). Chill until firm.',
    taro:         'Steam and mash 150g taro with 1 tbsp sugar and a pinch of salt. Cool completely.',
    durian:       'Use 120g fresh durian flesh, seeds removed. Portion into small mounds and freeze for 30 minutes.',
    salted_egg:   'Use 3 salted egg yolks, steamed for 8 minutes and cooled. Quarter each yolk.',
    matcha_cream: 'Mix 80g cream cheese with 1 tsp matcha powder and 1 tbsp icing sugar until smooth. Chill.',
  };

  const COATING_NOTE = {
    coconut:         'Use 200g freshly grated coconut (white part only). Mix with ½ tsp salt and a pinch of sugar.',
    toasted_coconut: 'Toast 200g grated coconut in a dry pan over low heat, stirring constantly, until golden and fragrant.',
    sesame:          'Mix 150g white sesame seeds with 1 tbsp sugar. Toast lightly in a dry pan.',
    peanuts:         'Crush 150g roasted peanuts coarsely. Mix with 1 tbsp sugar.',
    sugar:           'Sift 100g icing sugar onto a plate. Roll balls immediately after cooking while still moist.',
    matcha:          'Mix 80g icing sugar with 2 tsp matcha powder. Sift together onto a plate.',
    cocoa:           'Mix 80g icing sugar with 2 tbsp unsweetened cocoa powder. Sift together onto a plate.',
  };
  // ─── QUALITY CONTROL ───────────────────────────────────────────────────────
  // One score, and it grades decisions rather than ingredients. That matters:
  // "flavour" can't be a universal axis when kueh lapis has no flavour control,
  // but every kueh has a traditional default and choices you can push away from
  // it. Three things go into the number:
  //
  //   Reach   /30  how many of the available decisions you changed
  //   Daring  /35  how far each of those choices went from standard
  //   Tension /35  how much the choices pull against each other
  //
  // Tension is what stops this being a boldness slider. A wild filling inside a
  // traditional shell beats everything set to maximum, because cranking every
  // control is bold but not especially creative.

  function band(total) {
    if (total >= 90) return 'Certified unhinged. Ship it.';
    if (total >= 76) return 'Genuinely inventive.';
    if (total >= 60) return 'A real departure.';
    if (total >= 42) return 'One foot off the path.';
    return 'A perfectly good kueh. Now go and ruin it.';
  }

  // Rough distance between two hexes, 0–1. Unweighted on purpose: luminance
  // weighting buries blue, which had pandan-on-blue-pea reading as near-identical.
  function colourGap(a, b) {
    const c1 = hexToRgb(a), c2 = hexToRgb(b);
    const d = Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2));
    return Math.min(1, d / 200);
  }

  // Fillings and coatings that genuinely fight each other, in a good way.
  const ONDEH_CLASH = {
    durian: { sugar: 1, cocoa: 1, matcha: 1 },
    salted_egg: { cocoa: 1, matcha: 1, sugar: 1 },
    nutella: { sesame: 1, peanuts: 1 },
    matcha_cream: { cocoa: 1, peanuts: 1 },
    chocolate: { sesame: 1, matcha: 1 },
  };

  // Batters that fight the mould they're poured into: heavy or dark mixtures in
  // moulds with fine points, which colour at the tips long before the centre sets.
  const BAHULU_ODD = {
    cocoa:  { fish: 1, heart: 1, star: 1 },
    gula:   { star: 1, fish: 1 },
    orange: { fish: 1, heart: 1 },
    pandan: { heart: 1 },
  };

  // A choice: what it is, whether you moved it, and how far out the pick is.
  function choice(label, name, changed, bold) {
    return { label: label, name: name, changed: !!changed, bold: bold };
  }

  // Normalise a 0..n rating onto 0..1.
  function lvl(v, max) { return Math.min(1, Math.max(0, v / max)); }

  // ─── PER-KUEH DESCRIPTORS ──────────────────────────────────────────────────
  // Each returns the choices on the table, and one tension reading: how much
  // those choices argue with each other, 0–1.

  const SPECS = {
    lapis: function () {
      const t = THEMES.filter(function (x) { return x.id === state.theme; })[0];
      const themeName = state.rainbow ? 'Rainbow'
        : state.theme === 'custom' ? 'Custom' : ((t && t.name) || 'Classic');
      // How far the palette itself is from the classic red/pandan/coconut run.
      const themeBold = state.rainbow ? 1
        : state.theme === 'custom' ? lvl(state.customCount, 3)
          : state.theme === 'classic' ? 0 : 0.55;
      const span = (state.layers - LAPIS_MIN) / (LAPIS_MAX - LAPIS_MIN);
      return {
        choices: [
          choice('colour run', themeName, state.theme !== 'classic' || state.rainbow, themeBold),
          choice('layer count', state.layers + ' layers', state.layers !== LAPIS_MIN, span),
          choice('effect', state.effect === 'gradient' ? 'a gradient' : 'plain bands',
            state.effect !== 'plain', state.effect === 'gradient' ? 0.5 : 0),
        ],
        // Internal tension: how much the layers disagree with each other.
        // Rainbow argues with itself constantly; one custom colour never does.
        tension: state.rainbow ? 1
          : state.theme === 'custom' ? lvl(state.customCount - 1, 2)
            : (t && t.c ? 0.7 : 0.45) * (state.effect === 'gradient' ? 0.6 : 1),
        tensionNote: state.rainbow
          ? 'Seven colours arguing all the way down the tray.'
          : state.theme === 'custom' && state.customCount === 1
            ? 'One colour, top to bottom. Nothing in there disagrees with anything.'
            : themeName + ' layers alternating' +
              (state.effect === 'gradient' ? ', softened into each other.' : ', cleanly banded.'),
      };
    },

    ondeh: function () {
      const f = ondehFilling();
      const c = COATINGS.filter(function (x) { return x.id === state.coating; })[0] || COATINGS[0];
      const custom = state.doughColor === 'custom';
      const clash = (ONDEH_CLASH[f.id] || {})[c.id];
      return {
        choices: [
          choice('skin', custom ? 'a colour you mixed' : state.doughColor,
            state.doughColor !== 'green', custom ? 1 : 0.6),
          choice('filling', f.name, f.id !== 'gula_melaka', f.id === 'durian' || f.id === 'salted_egg' ? 1 : 0.55),
          choice('coating', c.name, c.id !== 'coconut', 0.6),
        ],
        tension: clash ? 1 : (f.id === 'gula_melaka' && c.id === 'coconut') ? 0 : 0.45,
        tensionNote: clash
          ? f.name + ' rolled in ' + c.name.toLowerCase() + '. Reckless, and the machine approves.'
          : (f.id === 'gula_melaka' && c.id === 'coconut')
            ? 'Gula melaka and fresh coconut. Perfect, and made ten thousand times before.'
            : f.name + ' with ' + c.name.toLowerCase() + ' — it holds together.',
      };
    },

    salat: function () {
      const cu = custard(), ri = riceColour();
      const gap = colourGap(cu.hex, ri.hex);
      return {
        choices: [
          choice('custard', cu.name, cu.id !== 'pandan', cu.id === 'durian' || cu.id === 'gula' ? 1 : 0.5),
          choice('rice', ri.name, ri.id !== 'bluepea', ri.id === 'charcoal' ? 1 : 0.5),
        ],
        tension: gap,
        tensionNote: gap > 0.5
          ? cu.name + ' over ' + ri.name.toLowerCase() + ' — the two halves argue, in a good way.'
          : gap > 0.28 ? 'The two layers sit close in tone. Subtle rather than striking.'
            : 'Both halves nearly the same colour. It reads as one slab, not two.',
      };
    },

    bangkit: function () {
      const m = mould(), c = bangkitColour(), f = bangkitFlavour();
      const mismatch = (c.id !== 'plain' && f.id !== 'coconut' && c.id !== f.id);
      return {
        choices: [
          choice('mould', m.name, m.id !== 'flower', lvl(m.rarity, 2)),
          choice('colour', c.name, c.id !== 'plain', lvl(c.bold, 2)),
          choice('flavour', f.name, f.id !== 'coconut', lvl(f.bold, 3)),
        ],
        tension: mismatch ? 1 : (c.id === 'plain' && f.id === 'coconut') ? 0 : 0.4,
        tensionNote: mismatch
          ? c.name + ' on the outside, ' + f.name.toLowerCase() + ' on the tongue. Nobody sees it coming.'
          : (c.id === 'plain' && f.id === 'coconut')
            ? 'Undyed and tasting of coconut, exactly as it comes out of every tin.'
            : 'Colour and flavour pulling the same way.',
      };
    },

    bahulu: function () {
      const sh = pick(BAHULU_SHAPES, state.bahuluShape);
      const f = pick(BAHULU_FLAVOURS, state.bahuluFlavour);
      // Bahulu has only two controls, so tension can't be derived from how far
      // apart they are — breadth and friction would then exclude each other and
      // the score could never reach the top. It's a pairing table instead, like
      // ondeh's, so a bold batter in an awkward mould can score on all three.
      const odd = (BAHULU_ODD[f.id] || {})[sh.id];
      const classic = sh.id === 'flower' && f.id === 'plain';
      return {
        choices: [
          choice('mould', sh.name, sh.id !== 'flower', lvl(sh.rarity, 2)),
          choice('batter', f.name, f.id !== 'plain', lvl(f.bold, 2)),
        ],
        tension: odd ? 1 : classic ? 0 : 0.45,
        tensionNote: odd
          ? f.name + ' batter in a ' + sh.name.toLowerCase() + ' mould — the fine points catch long before the middle sets.'
          : classic
            ? 'The flower tray and a plain batter. The bahulu at every open house.'
            : f.name + ' in a ' + sh.name.toLowerCase() + ' mould, which behaves itself.',
      };
    },

    tutu: function () {
      const sh = pick(TUTU_SHAPES, state.tutuShape);
      const c = pick(TUTU_COLOURS, state.tutuColour);
      const f = pick(TUTU_FILLINGS, state.tutuFilling);
      const gapT = Math.max(colourGap(c.hex, f.hex), lvl(f.bold, 3) * 0.8);
      return {
        choices: [
          choice('mould', sh.name, sh.id !== 'flower', lvl(sh.rarity, 2)),
          choice('colour', c.name, c.id !== 'plain', lvl(c.bold, 2)),
          choice('filling', f.name, f.id !== 'peanut', lvl(f.bold, 3)),
        ],
        tension: gapT,
        tensionNote: f.bold >= 2
          ? f.name + ' inside a tutu. The steamer was not built with that in mind.'
          : c.id === 'plain' && f.id === 'peanut'
            ? 'White, peanut, on its square of leaf. The one from the stall.'
            : c.name + ' outside, ' + f.name.toLowerCase() + ' in.',
      };
    },

    angku: function () {
      const sh = pick(ANGKU_SHAPES, state.angkuShape);
      const c = pick(ANGKU_COLOURS, state.angkuColour);
      const f = pick(ANGKU_FILLINGS, state.angkuFilling);
      const gapT = Math.max(colourGap(c.hex, f.hex) * 0.8, lvl(f.bold, 3));
      return {
        choices: [
          choice('mould', sh.name, sh.id !== 'tortoise', lvl(sh.rarity, 2)),
          choice('skin', c.name, c.id !== 'red', lvl(c.bold, 2)),
          choice('filling', f.name, f.id !== 'peanut', lvl(f.bold, 3)),
        ],
        tension: gapT,
        tensionNote: f.bold >= 3
          ? f.name + ' in an ang ku. Somebody is going to have opinions about this.'
          : c.id === 'white'
            ? 'A white ang ku with ' + f.name.toLowerCase() + ' inside. People will pick it up to ask.'
            : c.id === 'red' && f.id === 'peanut'
              ? 'Red, tortoise-pressed, peanut inside. The full-month party version.'
              : c.name + ' skin around ' + f.name.toLowerCase() + '.',
      };
    },
  };

  function scoreKueh() {
    const spec = SPECS[state.loadedId];
    if (!spec) return null;
    const s = spec();
    const cs = s.choices;

    const reach = cs.filter(function (c) { return c.changed; }).length / cs.length;
    const daring = cs.reduce(function (a, c) { return a + c.bold; }, 0) / cs.length;
    const tension = s.tension;

    // Base 22 so an untouched default doesn't read as a zero — it scores low
    // because it is, by definition, uncreative, but 0/100 looks like a fault
    // rather than a starting point. 22 + 24 + 27 + 27 tops out at 100.
    const total = Math.round(22 + reach * 24 + daring * 27 + tension * 27);

    // The one line of why comes from whichever component carried the score, so
    // it explains the number rather than restating the choices.
    let note;
    if (tension >= daring && tension >= reach) {
      note = s.tensionNote;
    } else if (daring >= reach) {
      const boldest = cs.slice().sort(function (a, b) { return b.bold - a.bold; })[0];
      note = boldest.bold < 0.2
        ? 'Every choice left where it was found.'
        : boldest.name + ' is the furthest thing here from the standard ' + s.choices.length +
          '-decision build.';
    } else {
      const left = cs.filter(function (c) { return !c.changed; });
      note = left.length
        ? 'Changed all but the ' + left.map(function (c) { return c.label; }).join(' and ') + '.'
        : 'Every decision on the panel moved.';
    }

    return { total: total, verdict: band(total), note: note };
  }

  function angkuRecipeHTML() {
    const sh = pick(ANGKU_SHAPES, state.angkuShape);
    const c = pick(ANGKU_COLOURS, state.angkuColour);
    const f = pick(ANGKU_FILLINGS, state.angkuFilling);
    return {
      title: f.name + ' Ang Ku Kueh' + (c.id === 'red' ? '' : ' in ' + c.name),
      yield: sh.name + ' mould · Makes about 20 · ~2 hours',
      body:
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Skin</h3>' +
          '<ul class="recipe-list">' +
            '<li><span class="recipe-dot" style="background:' + c.hex + '"></span>250g glutinous rice flour</li>' +
            '<li>200g sweet potato, steamed and mashed smooth</li>' +
            '<li>60g caster sugar</li>' +
            '<li>2 tbsp oil, plus more for the mould</li>' +
            '<li>About 80ml warm water, added slowly</li>' +
            '<li>Squares of banana leaf, oiled</li>' +
          '</ul>' +
          '<h3 class="recipe-section">Colour — ' + c.name + '</h3>' +
          '<ul class="recipe-list"><li>' + c.note + '</li></ul>' +
          '<h3 class="recipe-section">Filling — ' + f.name + '</h3>' +
          '<ul class="recipe-list"><li>' + f.note + '</li></ul>' +
          '<h3 class="recipe-section">Mould — ' + sh.name + '</h3>' +
          '<ul class="recipe-list"><li>' + sh.note + '</li></ul>' +
        '</div>' +
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Method</h3>' +
          '<ol class="recipe-steps">' +
            '<li>Roll the filling into 20 balls of about 20g and chill them firm. Cold filling is far easier to wrap.</li>' +
            '<li>Mix the mashed sweet potato, sugar and oil into the glutinous rice flour. Add the warm water a spoonful at a time until it comes together as a soft, pliable dough — like an earlobe, not like putty.</li>' +
            '<li>Rest the dough covered for 20 minutes.</li>' +
            '<li>Divide into 20 pieces of about 30g. Flatten each into a disc, sit a filling ball in the centre, and pinch the dough closed around it. Roll smooth between your palms.</li>' +
            '<li>Oil the ' + sh.name.toLowerCase() + ' mould generously. Press each ball in, flatten the back, and knock it out onto an oiled leaf square.</li>' +
            '<li>Steam over medium heat for 8 minutes. High heat will blow the pattern flat.</li>' +
            '<li>Brush the tops with oil the moment they come out — that is what gives the skin its shine and stops them sticking to each other.</li>' +
          '</ol>' +
          '<p class="recipe-tip"><strong>Tip:</strong> Prop the steamer lid ajar. A drop of condensation on the skin leaves a mark that never goes.</p>' +
        '</div>',
    };
  }

  function bahuluRecipeHTML() {
    const sh = pick(BAHULU_SHAPES, state.bahuluShape);
    const f = pick(BAHULU_FLAVOURS, state.bahuluFlavour);
    return {
      title: f.name + ' Kueh Bahulu',
      yield: sh.name + ' mould · Makes about 40 · ~50 minutes',
      body:
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Batter</h3>' +
          '<ul class="recipe-list">' +
            '<li><span class="recipe-dot" style="background:' + f.hex + '"></span>5 eggs, at room temperature</li>' +
            '<li>150g caster sugar</li>' +
            '<li>150g plain flour, sifted twice</li>' +
            '<li>½ tsp baking powder</li>' +
            '<li>Melted butter, for greasing the mould</li>' +
          '</ul>' +
          '<h3 class="recipe-section">Flavour — ' + f.name + '</h3>' +
          '<ul class="recipe-list"><li>' + f.note + '</li></ul>' +
          '<h3 class="recipe-section">Mould — ' + sh.name + '</h3>' +
          '<ul class="recipe-list"><li>' + sh.note + '</li></ul>' +
        '</div>' +
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Method</h3>' +
          '<ol class="recipe-steps">' +
            '<li>Put the brass mould in the oven at 190°C to heat through. It must be properly hot before any batter goes near it.</li>' +
            '<li>Beat the eggs and sugar for a full 10 minutes, until pale, thick, and holding a ribbon on the surface for three seconds. This is the entire recipe — there is no raising agent doing the work for you.</li>' +
            '<li>Sift the flour and baking powder over in three additions, folding with a spatula. Stop the moment it disappears.</li>' +
            '<li>Take the hot mould out and brush every cup with melted butter. It should hiss.</li>' +
            '<li>Fill each cup just under the rim. Bake 10–12 minutes until risen and golden at the edges.</li>' +
            '<li>Turn out immediately onto a rack — left in the mould they steam themselves soft.</li>' +
            '<li>Re-grease and reheat the mould between batches.</li>' +
          '</ol>' +
          '<p class="recipe-tip"><strong>Tip:</strong> If the bahulu stick, the mould was not hot enough. Cold brass grips; hot brass releases.</p>' +
        '</div>',
    };
  }

  function tutuRecipeHTML() {
    const sh = pick(TUTU_SHAPES, state.tutuShape);
    const c = pick(TUTU_COLOURS, state.tutuColour);
    const f = pick(TUTU_FILLINGS, state.tutuFilling);
    return {
      title: f.name + ' Kueh Tutu' + (c.id === 'plain' ? '' : ' in ' + c.name),
      yield: sh.name + ' mould · Makes about 24 · ~40 minutes',
      body:
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Cake</h3>' +
          '<ul class="recipe-list">' +
            '<li><span class="recipe-dot" style="background:' + c.hex + '"></span>300g rice flour</li>' +
            '<li>60g caster sugar</li>' +
            '<li>¼ tsp fine salt</li>' +
            '<li>About 120ml water, a spoon at a time</li>' +
            '<li>Squares of banana or pandan leaf, to serve on</li>' +
          '</ul>' +
          '<h3 class="recipe-section">Colour — ' + c.name + '</h3>' +
          '<ul class="recipe-list"><li>' + c.note + '</li></ul>' +
          '<h3 class="recipe-section">Filling — ' + f.name + '</h3>' +
          '<ul class="recipe-list"><li>' + f.note + '</li></ul>' +
        '</div>' +
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Method</h3>' +
          '<ol class="recipe-steps">' +
            '<li>Rub the water into the rice flour with your fingertips until it holds together when squeezed but breaks apart when you poke it. Add the water slowly — too much and it steams into a paste.</li>' +
            '<li>Push the flour through a fine sieve twice. It should end up like damp sand.</li>' +
            '<li>Stir through the sugar and salt.</li>' +
            '<li>Half-fill the ' + sh.name.toLowerCase() + ' mould with flour. Press a hollow in the middle, spoon in the filling, then cover with more flour and level the top. Do not compact it.</li>' +
            '<li>Steam over high heat for 5–6 minutes. The surface should look set and matte.</li>' +
            '<li>Knock out onto a square of leaf and serve straight away. Tutu is at its best within minutes and goes stiff within the hour.</li>' +
          '</ol>' +
          '<p class="recipe-tip"><strong>Tip:</strong> Squeeze a handful before you steam. It should clump, then crumble under a finger. If it stays in a ball, it is too wet.</p>' +
        '</div>',
    };
  }

  function bangkitRecipeHTML() {
    const m = mould();
    const c = bangkitColour();
    const f = bangkitFlavour();
    return {
      title: f.name + ' Kueh Bangkit' + (c.id === 'plain' ? '' : ' in ' + c.name),
      yield: m.name + ' mould · Makes about 60 · ~90 minutes, most of it drying',
      body:
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Dough</h3>' +
          '<ul class="recipe-list">' +
            '<li><span class="recipe-dot" style="background:' + c.hex + '"></span>500g tapioca flour</li>' +
            '<li>6 pandan leaves, cut into short lengths</li>' +
            '<li>200ml thick coconut cream</li>' +
            '<li>2 egg yolks</li>' +
            '<li>180g caster sugar</li>' +
            '<li>¼ tsp fine salt</li>' +
          '</ul>' +
          '<h3 class="recipe-section">Colour — ' + c.name + '</h3>' +
          '<ul class="recipe-list"><li>' + c.note + '</li></ul>' +
          '<h3 class="recipe-section">Flavour — ' + f.name + '</h3>' +
          '<ul class="recipe-list"><li>' + f.note + '</li></ul>' +
          '<h3 class="recipe-section">Mould — ' + m.name + '</h3>' +
          '<ul class="recipe-list"><li>' + m.note + '</li></ul>' +
        '</div>' +
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Method</h3>' +
          '<ol class="recipe-steps">' +
            '<li>Dry-fry the tapioca flour with the pandan leaves over low heat for 15 minutes, stirring constantly. Leave it overnight — the flour must be bone dry or the biscuits will not melt.</li>' +
            '<li>Sift the cooled flour twice and discard the pandan.</li>' +
            '<li>Beat the egg yolks with the sugar until pale, then beat in the coconut cream and salt.</li>' +
            '<li>Add the flour a little at a time, cutting it in with a knife rather than kneading. Stop as soon as it holds together — overworked dough bakes hard.</li>' +
            '<li>Roll to 1cm and press firmly into the ' + m.name.toLowerCase() + ' mould. Knock it out onto a lined tray.</li>' +
            '<li>Bake at 160°C for 15–18 minutes. They should stay pale — colour means overbaked.</li>' +
            '<li>Cool completely on the tray. They firm up as they cool and will crumble if moved warm.</li>' +
            '<li>Store airtight the moment they are cold. Bangkit goes soft in an afternoon of open air.</li>' +
          '</ol>' +
          '<p class="recipe-tip"><strong>Tip:</strong> The test is on the tongue, not in the mouth — a good bangkit should collapse before you have chewed it.</p>' +
        '</div>',
    };
  }

  function salatRecipeHTML() {
    const cu = custard();
    const ri = riceColour();

    return {
      title: cu.name + ' Kueh Salat on ' + ri.name + ' Rice',
      yield: 'Two layers · Makes one 7-inch square tray',
      body:
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Rice base — ' + ri.name + '</h3>' +
          '<ul class="recipe-list">' +
            '<li><span class="recipe-dot" style="background:' + ri.hex + '"></span>300g glutinous rice, soaked overnight</li>' +
            '<li>' + ri.note + '</li>' +
            '<li>120ml coconut milk</li>' +
            '<li>½ tsp fine salt</li>' +
          '</ul>' +
          '<h3 class="recipe-section">Custard — ' + cu.name + '</h3>' +
          '<ul class="recipe-list">' +
            '<li><span class="recipe-dot" style="background:' + cu.hex + '"></span>4 eggs</li>' +
            '<li>' + cu.note + '</li>' +
            '<li>300ml coconut milk</li>' +
            '<li>120g caster sugar</li>' +
            '<li>40g plain flour + 20g rice flour</li>' +
          '</ul>' +
        '</div>' +
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Method</h3>' +
          '<ol class="recipe-steps">' +
            '<li>Drain the soaked rice well. Toss with the coconut milk and salt.</li>' +
            '<li>Line a 7-inch square tin and press the rice in firmly. Steam for 25 minutes.</li>' +
            '<li>Take it out and press the rice down hard with the back of an oiled spoon — a compacted base is what stops the custard seeping in.</li>' +
            '<li>Whisk the custard ingredients until completely smooth, then strain twice through a fine sieve.</li>' +
            '<li>Cook the custard over low heat, stirring constantly, until it thickens to a pouring cream. Do not let it boil.</li>' +
            '<li>Pour the warm custard over the hot rice base through a sieve. Skim off any bubbles.</li>' +
            '<li>Steam on low for 35–40 minutes, lid wrapped in a cloth, until the custard is just set with a slight wobble.</li>' +
            '<li>Cool completely — at least 4 hours — before cutting. Warm kueh salat will not hold an edge.</li>' +
          '</ol>' +
          '<p class="recipe-tip"><strong>Tip:</strong> Keep the steam low once the custard is on. A hard boil curdles it and you get a pitted surface instead of a glassy one.</p>' +
        '</div>',
    };
  }

  function ondehRecipeHTML() {
    const ext = state.doughColor === 'custom'
      ? { id: 'custom', name: 'Custom', hex: state.customDough }
      : (EXTERIOR_COLORS.filter(function (c) { return c.id === state.doughColor; })[0] || EXTERIOR_COLORS[0]);
    const fill = ondehFilling();
    const coat = COATINGS.filter(function (c) { return c.id === state.coating; })[0] || COATINGS[0];

    const doughLine = DOUGH_INGREDIENT[ext.id] || 'food colouring of your choice (80ml water)';
    const fillingNote = FILLING_NOTE[fill.id] || 'Prepare filling as desired.';
    const coatingNote = COATING_NOTE[coat.id] || 'Prepare coating as desired.';

    return {
      title: ext.name + ' Ondeh Ondeh with ' + fill.name + ' &amp; ' + coat.name,
      yield: 'Makes about 20 pieces · ~45 minutes',
      body:
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Dough</h3>' +
          '<ul class="recipe-list">' +
            '<li><span class="recipe-dot" style="background:' + ext.hex + '"></span>250g glutinous rice flour</li>' +
            '<li>' + doughLine + '</li>' +
            '<li>50ml coconut milk</li>' +
            '<li>¼ tsp fine salt</li>' +
          '</ul>' +
          '<h3 class="recipe-section">Filling — ' + fill.name + '</h3>' +
          '<ul class="recipe-list">' +
            '<li><span class="recipe-dot" style="background:' + fill.hex + '"></span>' + fillingNote + '</li>' +
          '</ul>' +
          '<h3 class="recipe-section">Coating — ' + coat.name + '</h3>' +
          '<ul class="recipe-list"><li>' + coatingNote + '</li></ul>' +
        '</div>' +
        '<div class="recipe-col">' +
          '<h3 class="recipe-section">Method</h3>' +
          '<ol class="recipe-steps">' +
            '<li>Prepare the filling and coating first. Set aside.</li>' +
            '<li>Combine glutinous rice flour and salt. Add the colouring liquid and coconut milk gradually, mixing with a fork, then knead by hand until the dough is smooth and pliable — about 3 minutes. It should not crack when you roll it.</li>' +
            '<li>Divide into 20 equal portions (~18g each). Roll each into a smooth ball, then flatten into a disc about 6cm wide.</li>' +
            '<li>Place a portion of filling in the centre. Pinch the edges together to seal fully, then roll gently between your palms to smooth.</li>' +
            '<li>Bring a large pot of water to a rolling boil. Add the balls in batches of 8–10. Cook until they float to the surface, then continue for 1 minute more.</li>' +
            '<li>Scoop out with a slotted spoon. Roll immediately in the coating while the surface is still moist so it sticks.</li>' +
            '<li>Serve warm. Ondeh ondeh are best eaten within a few hours — the dough firms up as it cools.</li>' +
          '</ol>' +
          '<p class="recipe-tip"><strong>Tip:</strong> Don\'t overfill — a heaped teaspoon of filling is enough. Too much and the ball will burst in the water.</p>' +
        '</div>',
    };
  }

  function flavorHex(id) {
    const f = FLAVOURS.filter(function (x) { return x.id === id; })[0];
    return (f || FLAVOURS[0]).hex;
  }

  function flavorName(id) {
    const f = FLAVOURS.filter(function (x) { return x.id === id; })[0];
    return (f || FLAVOURS[0]).name;
  }

  function themeColors(t) { return t.c ? [t.a, t.b, t.c] : [t.a, t.b]; }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function mixColors(a, b, t) {
    const c1 = hexToRgb(a), c2 = hexToRgb(b);
    return '#' + [0, 1, 2].map(function (i) {
      return Math.round(c1[i] + (c2[i] - c1[i]) * t).toString(16).padStart(2, '0');
    }).join('');
  }

  function mixMultiColor(colors, t) {
    if (colors.length === 1) return colors[0];
    const segments = colors.length - 1;
    const scaled = t * segments;
    const idx = Math.min(Math.floor(scaled), segments - 1);
    return mixColors(colors[idx], colors[idx + 1], scaled - idx);
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = function (n) {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
        .toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }

  // ─── STATE ─────────────────────────────────────────────────────────────────

  const state = {
    layers: 9,
    filling: 'gula',
    exterior: 'steamed',
    palette: 'pandan',
    phase: 'idle',
    interior: false,
    dragging: null,
    over: false,
    loaded: null,
    loadedId: null,
    serial: null,          // minted on each completed run, printed on the card
    recipe: false,         // whether a card is currently on the page
    log: ['> hatch sealed', '> hopper empty'],

    // Lapis studio only
    theme: 'classic',
    effect: 'plain',
    rainbow: false,
    layerFlavors: [],
    customColors: ['#2a7a4a', '#f2e4c8', '#e070a0'],
    customCount: 2,

    // Ondeh studio only. `exterior` is already the v2 finish, so the dough
    // colour gets its own name.
    doughColor: 'green',
    customDough: '#72c47e',
    ondehFilling: 'gula_melaka',
    coating: 'coconut',

    // Salat studio only
    custard: 'pandan',
    rice: 'bluepea',

    // Bangkit studio only
    mould: 'flower',
    bangkitColour: 'plain',
    bangkitFlavour: 'coconut',

    // Bahulu studio only
    bahuluShape: 'flower',
    bahuluFlavour: 'plain',

    // Tutu studio only
    tutuShape: 'flower',
    tutuColour: 'plain',
    tutuFilling: 'peanut',

    // Ang ku studio only
    angkuShape: 'tortoise',
    angkuColour: 'red',
    angkuFilling: 'peanut',
  };

  function isLapis() { return state.loadedId === 'lapis'; }
  function isOndeh() { return state.loadedId === 'ondeh'; }
  function isSalat() { return state.loadedId === 'salat'; }
  function isBangkit() { return state.loadedId === 'bangkit'; }
  function isBahulu()  { return state.loadedId === 'bahulu'; }
  function isTutu()    { return state.loadedId === 'tutu'; }
  function isAngku()   { return state.loadedId === 'angku'; }

  // Which kuehs have a studio built. Everything else opens onto maintenance.
  const STUDIO_IDS = { lapis: 1, ondeh: 1, salat: 1, bangkit: 1, bahulu: 1, tutu: 1, angku: 1 };
  function ownStudioFor(id) { return !!STUDIO_IDS[id]; }

  // Counted off the belt rather than written down, so the panel can't claim
  // the wrong number of lines after a studio is added.
  function maintenanceNote() {
    const down = BELT_SHAPES.filter(function (b) { return !ownStudioFor(b.id); })
      .map(function (b) { return b.alt.toLowerCase(); });
    const live = BELT_SHAPES.length - down.length;
    const list = down.length === 1 ? down[0]
      : down.slice(0, -1).join(', ') + ' and ' + down[down.length - 1];
    return live + ' of the ' + BELT_SHAPES.length + ' lines are running. Only ' +
      list + ' ' + (down.length === 1 ? 'is' : 'are') + ' still down.';
  }

  let runTimer = null;
  let loadTimer = null;

  function setState(patch) {
    Object.assign(state, patch);
    render();
  }

  function note(text) {
    state.log = ['> ' + text].concat(state.log).slice(0, 5);
  }

  // ─── LAPIS COLOUR ──────────────────────────────────────────────────────────

  // Refills the per-layer flavour cycle for the active theme, the way v1 did
  // whenever the theme or the layer count changed.
  function refillFlavors() {
    const t = THEMES.filter(function (x) { return x.id === state.theme; })[0];
    if (t && t.a) {
      const cycle = themeColors(t);
      state.layerFlavors = Array.from({ length: state.layers }, function (_, i) {
        return cycle[i % cycle.length];
      });
    } else {
      state.layerFlavors = Array.from({ length: state.layers }, function (_, i) {
        return i % 2 === 0 ? 'pandan' : 'coconut';
      });
    }
  }

  function applyTheme(id) {
    const t = THEMES.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    state.theme = t.id;
    state.rainbow = !!t.rainbow;
    refillFlavors();
  }

  function lapisLayerColor(i, N) {
    if (state.rainbow) {
      return hslToHex(Math.round((i / Math.max(N - 1, 1)) * 270), 68, 78);
    }
    if (state.theme === 'custom') {
      const cols = state.customColors.slice(0, state.customCount);
      if (state.effect === 'gradient') return mixMultiColor(cols, i / Math.max(N - 1, 1));
      return cols[i % cols.length];
    }
    if (state.effect === 'gradient') {
      const t = THEMES.filter(function (x) { return x.id === state.theme; })[0];
      const first = flavorHex((t && t.a) || state.layerFlavors[0] || 'pandan');
      const last = flavorHex((t && t.b) || state.layerFlavors[N - 1] || 'coconut');
      return mixColors(first, last, i / Math.max(N - 1, 1));
    }
    return flavorHex(state.layerFlavors[i] || (i % 2 === 0 ? 'pandan' : 'coconut'));
  }

  // The renderer walks colors[i % length], so handing it exactly N entries
  // gives it a per-layer colour without any change to the canvas code.
  function lapisColors() {
    const N = state.layers;
    return Array.from({ length: N }, function (_, i) { return lapisLayerColor(i, N); });
  }

  // ─── ELEMENTS ──────────────────────────────────────────────────────────────

  const $ = function (id) { return document.getElementById(id); };

  const el = {
    hero: document.querySelector('.hero'),
    machine: $('machine'), machineBody: $('machine-body'), steam: $('steam'),
    hopperHint: $('hopper-hint'), rail: $('belt-rail'),
    beltLeft: $('belt-left'), beltRight: $('belt-right'), beltMobile: $('belt-mobile'),
    statusLabel: $('status-label'), statusLabel2: $('status-label-2'),
    readout: $('readout'), readout2: $('readout-2'),
    modify: $('modify'), runChamber: $('run-chamber'),
    machineKueh: $('machine-kueh'), machinePlate: $('machine-plate'),
    interior: $('interior'), chamber: $('chamber'), chamberHint: $('chamber-hint'),
    closeHatch: $('close-hatch'), log: $('log'),
    fillingCards: $('filling-cards'), finishCards: $('finish-cards'), dyeCards: $('dye-cards'),
    layers2: $('layers-2'), layersOut2: $('layers-out-2'),
    layersRowMain: $('layers-row-main'),
    layersL: $('layers-l'), layersOutL: $('layers-out-l'),
    rackLeft: $('rack-left'), dyeRack: $('dye-rack'), lapisRack: $('lapis-rack'),
    fillingRack: $('filling-rack'), finishRack: $('finish-rack'),
    ondehRack: $('ondeh-rack'),
    salatRack: $('salat-rack'), custardGrid: $('custard-grid'), riceGrid: $('rice-grid'),
    bangkitRack: $('bangkit-rack'), mouldGrid: $('mould-grid'), mouldNote: $('mould-note'),
    bangkitColourGrid: $('bangkit-colour-grid'), bangkitFlavourChips: $('bangkit-flavour-chips'),
    bahuluRack: $('bahulu-rack'), bahuluShapeGrid: $('bahulu-shape-grid'),
    bahuluShapeNote: $('bahulu-shape-note'), bahuluFlavourGrid: $('bahulu-flavour-grid'),
    tutuRack: $('tutu-rack'), tutuShapeGrid: $('tutu-shape-grid'),
    tutuShapeNote: $('tutu-shape-note'), tutuColourGrid: $('tutu-colour-grid'),
    tutuFillingGrid: $('tutu-filling-grid'),
    angkuRack: $('angku-rack'), angkuShapeGrid: $('angku-shape-grid'),
    angkuShapeNote: $('angku-shape-note'), angkuColourGrid: $('angku-colour-grid'),
    angkuFillingGrid: $('angku-filling-grid'),
    topviewCanvas: $('topview-canvas'),
    interiorBody: $('interior-body'), maintenance: $('maintenance'),
    maintTitle: $('maint-title'), maintNote: $('maint-note'), maintClose: $('maint-close'),
    recipe: $('recipe'), recipeCard: $('recipe-card'), recipeSerial: $('recipe-serial'),
    recipeTitle: $('recipe-title'), recipeYield: $('recipe-yield'),
    recipeBody: $('recipe-body'), recipePrint: $('recipe-print'),
    recipeShot: $('recipe-shot'), recipeShotImg: $('recipe-shot-img'),
    qc: $('qc'), qcScore: $('qc-score'), qcVerdict: $('qc-verdict'), qcWhy: $('qc-why'),
    exteriorGrid: $('exterior-grid'), ondehFillingChips: $('ondeh-filling-chips'),
    coatingChips: $('coating-chips'), ondehCanvas: $('ondeh-canvas'),
    chamberCanvasEl: $('chamber-canvas'),
    themeGrid: $('theme-grid'), customColors: $('custom-colors'),
    customCount: $('custom-count'), customSwatches: $('custom-swatches'),
    effectChips: $('effect-chips'),
  };

  // Only the chamber renders on canvas — the machine window shows the photo.
  const chamberCanvas = KuehCanvas.attach($('chamber-canvas'), { baseline: 0.84 });
  const ondehCanvas = OndehCanvas.attach($('ondeh-canvas'));
  const topViewCanvas = TopViewCanvas.attach($('topview-canvas'));

  // ─── DRAG AND DROP ─────────────────────────────────────────────────────────
  // Every draggable also responds to click, so the whole app works on touch
  // devices, where HTML5 drag events don't fire.

  function beginDrag(kind, key) {
    return function (ev) {
      if (ev.dataTransfer) {
        ev.dataTransfer.setData('text/plain', kind + ':' + key);
        ev.dataTransfer.effectAllowed = 'copy';
      }
      setState({ dragging: kind });
    };
  }

  function endDrag() { setState({ dragging: null, over: false }); }

  function allowDrop(ev) {
    ev.preventDefault();
    if (!state.over) setState({ over: true });
  }

  function leaveDrop() { setState({ over: false }); }

  function readDrop(ev) {
    ev.preventDefault();
    const raw = ev.dataTransfer ? ev.dataTransfer.getData('text/plain') : '';
    const bits = String(raw).split(':');
    return { kind: bits[0], key: bits[1] };
  }

  // Loading only fills the hopper — the machine rattles for a moment as it
  // swallows the kueh, then settles. Opening it up is a separate, deliberate
  // step: the Modify button.
  function loadKueh(id) {
    const b = BELT_SHAPES.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    clearTimeout(loadTimer);
    clearTimeout(runTimer);
    note(b.alt + ' loaded into the hopper');
    const patch = Object.assign(
      { loaded: b.alt, loadedId: b.id, dragging: null, over: false, phase: 'loading' },
      b.preset
    );
    // Lapis opens on v1's defaults: nine layers, the classic red/pandan/coconut
    // run, plain effect.
    if (b.id === 'lapis') {
      patch.layers = LAPIS_MIN;
      patch.effect = 'plain';
    }
    // A new kueh in the hopper clears the last one's recipe.
    patch.recipe = false;
    patch.serial = null;
    // Bangkit opens on the mould every tin comes with.
    if (b.id === 'angku') {
      patch.angkuShape = 'tortoise'; patch.angkuColour = 'red'; patch.angkuFilling = 'peanut';
    }
    if (b.id === 'bahulu') { patch.bahuluShape = 'flower'; patch.bahuluFlavour = 'plain'; }
    if (b.id === 'tutu') {
      patch.tutuShape = 'flower'; patch.tutuColour = 'plain'; patch.tutuFilling = 'peanut';
    }
    if (b.id === 'bangkit') {
      patch.mould = 'flower';
      patch.bangkitColour = 'plain';
      patch.bangkitFlavour = 'coconut';
    }
    // Salat opens on the traditional pairing: pandan custard, blue pea rice.
    if (b.id === 'salat') {
      patch.custard = 'pandan';
      patch.rice = 'bluepea';
    }
    // Ondeh opens on v1's defaults: green dough, gula melaka, coconut flakes.
    if (b.id === 'ondeh') {
      patch.doughColor = 'green';
      patch.ondehFilling = 'gula_melaka';
      patch.coating = 'coconut';
    }
    Object.assign(state, patch);
    if (b.id === 'lapis') applyTheme('classic');
    setState({});
    loadTimer = setTimeout(function () {
      setState({ phase: 'idle' });
    }, LOAD_MS);
  }

  function onDropMachine(ev) {
    const d = readDrop(ev);
    if (d.kind === 'kueh') loadKueh(d.key);
    else setState({ over: false, dragging: null });
  }

  function onDropChamber(ev) {
    const d = readDrop(ev);
    if (d.kind === 'filling') {
      note(FILLINGS[d.key].label + ' piped in');
      setState({ filling: d.key, over: false, dragging: null, phase: 'idle' });
    } else if (d.kind === 'exterior') {
      note(EXTERIORS[d.key].label + ' applied');
      setState({ exterior: d.key, over: false, dragging: null, phase: 'idle' });
    } else if (d.kind === 'palette') {
      note(PALETTES[d.key].label + ' dye released');
      setState({ palette: d.key, over: false, dragging: null, phase: 'idle' });
    } else if (d.kind === 'kueh') {
      loadKueh(d.key);
    } else {
      setState({ over: false, dragging: null });
    }
  }


  // Layer changes have to refresh the lapis flavour cycle, exactly as v1 did.
  function setLayers(n) {
    state.layers = n;
    if (isLapis()) refillFlavors();
    setState({ phase: 'idle' });
  }

  // ─── ACTIONS ───────────────────────────────────────────────────────────────

  // Lifts the chamber render off the canvas so the card can show the kueh you
  // actually built. Downscaled — it prints at a few centimetres wide, so the
  // full-resolution bitmap would be wasted bytes in the data URL.
  const SHOT_W = 520;

  // Which canvas the chamber is actually showing. Getting this wrong captures a
  // canvas that was never painted, which is a blank picture on the card.
  function liveCanvas() {
    if (isOndeh()) return el.ondehCanvas;
    if (isBangkit() || isBahulu() || isTutu() || isAngku()) return el.topviewCanvas;
    return el.chamberCanvasEl;
  }

  function captureKueh() {
    const src = liveCanvas();
    if (!src || !src.width || !src.height) return null;
    try {
      const out = document.createElement('canvas');
      out.width = SHOT_W;
      out.height = Math.round(SHOT_W * src.height / src.width);
      out.getContext('2d').drawImage(src, 0, 0, out.width, out.height);
      return out.toDataURL('image/png');
    } catch (e) {
      return null;   // nothing here should taint the canvas, but don't gamble on it
    }
  }

  // Fills the card. Called once per completed run rather than from render(),
  // so we're not rebuilding the HTML on every state change. Must run while the
  // hatch is still open — a hidden canvas has no size to read from.
  function mintRecipe() {
    const r = isLapis() ? lapisRecipeHTML()
      : isOndeh() ? ondehRecipeHTML()
        : isSalat() ? salatRecipeHTML()
          : isBangkit() ? bangkitRecipeHTML()
            : isBahulu() ? bahuluRecipeHTML()
              : isTutu() ? tutuRecipeHTML()
                : isAngku() ? angkuRecipeHTML() : null;
    if (!r) { state.recipe = false; return; }
    el.recipeSerial.textContent = state.serial;
    el.recipeTitle.innerHTML = r.title;
    el.recipeYield.textContent = r.yield;
    el.recipeBody.innerHTML = r.body;

    const shot = captureKueh();
    if (shot) el.recipeShotImg.setAttribute('src', shot);
    el.recipeShot.hidden = !shot;

    const qc = scoreKueh();
    el.qc.hidden = !qc;
    if (qc) {
      el.qcScore.textContent = qc.total;
      el.qcVerdict.textContent = qc.verdict;
      el.qcWhy.textContent = qc.note;
    }

    state.recipe = true;
  }

  // Replays the print animation. Has to run after render() has unhidden the
  // section — animations don't start inside a display:none ancestor.
  function replayPrint() {
    el.recipeCard.style.animation = 'none';
    void el.recipeCard.offsetWidth;
    el.recipeCard.style.animation = '';
  }

  // The hatch pops open and the card feeds out. Scrolling stops short of the
  // recipe so the conveyor stays on screen above it — the card reads as coming
  // out from under the machine rather than arriving from nowhere.
  const BELT_PEEK = 150;
  const SCROLL_MS = 520;    // roughly how long a smooth scroll of ~700px takes
  // Read from CSS so the feed duration is set in exactly one place.
  const PRINT_MS = (function () {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--print-ms');
    return parseFloat(v) || 2200;
  })();

  let printTimer = null;
  let feedTimer = null;

  function ejectRecipe() {
    clearTimeout(printTimer);

    const target = Math.max(0, el.hero.offsetHeight - BELT_PEEK);
    const far = Math.abs(window.scrollY - target) > 8;
    const still = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Hold the card just inside the slot while the page travels down, so the
    // print isn't spent off-screen before you get there.
    if (!still) el.recipeCard.classList.add('is-waiting');

    window.scrollTo({ top: target, behavior: (far && !still) ? 'smooth' : 'auto' });

    // Always fires, so the card can never be left stuck in its held state.
    clearTimeout(feedTimer);
    printTimer = setTimeout(function () {
      el.recipeCard.classList.remove('is-waiting');
      if (still) return;
      replayPrint();
      // The slot works for as long as paper is moving through it.
      el.recipe.classList.add('is-feeding');
      feedTimer = setTimeout(function () {
        el.recipe.classList.remove('is-feeding');
      }, PRINT_MS);
    }, (far && !still) ? SCROLL_MS : 30);
  }

  function run() {
    if (state.phase === 'running' || state.phase === 'loading' || !state.loaded) return;
    clearTimeout(runTimer);
    setState({ phase: 'running' });
    runTimer = setTimeout(function () {
      state.phase = 'done';
      state.serial = 'KM-' + String(Math.floor(1000 + Math.random() * 8999));
      mintRecipe();
      // The hatch pops open on its own — the run is finished, and what you came
      // for is now downstairs in the tray.
      state.interior = false;
      state.dragging = null;
      state.over = false;
      render();
      if (state.recipe) ejectRecipe();
    }, RUN_MS);
  }

  // ─── STATIC DOM ────────────────────────────────────────────────────────────

  const cardRefs = { filling: {}, exterior: {}, palette: {} };
  const themeRefs = {};
  const countRefs = {};
  const swatchRefs = {};
  const doughRefs = {};
  const ondehFillRefs = {};
  const coatingRefs = {};
  const custardRefs = {};
  const mouldRefs = {};
  const bColourRefs = {};
  const bFlavourRefs = {};
  const bahuluShapeRefs = {}, bahuluFlavRefs = {};
  const tutuShapeRefs = {}, tutuColRefs = {}, tutuFillRefs = {};
  const angkuShapeRefs = {}, angkuColRefs = {}, angkuFillRefs = {};
  const riceRefs = {};

  // Each lane gets its own half of the belt, so the same kueh is never sitting
  // to the left of the machine and to the right of it at once. Split by
  // alternating *pairs* rather than alternating items — taking every other kueh
  // would put all the tall ones in one lane and all the short ones in the
  // other, undoing the tallest/shortest ordering of BELT_SHAPES.
  function laneShapes(laneIndex) {
    return BELT_SHAPES.filter(function (_, i) {
      return Math.floor(i / 2) % 2 === laneIndex;
    });
  }

  function buildBelt() {
    function fillLane(lane, shapes) {
      // Two full cycles per lane so the -50% loop is seamless.
      for (let cycle = 0; cycle < 2; cycle++) {
        shapes.forEach(function (b) {
          const slot = document.createElement('div');
          slot.className = 'belt-slot';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'belt-kueh';
          btn.draggable = true;
          btn.style.height = b.h + 'px';
          btn.style.backgroundImage = 'url(' + b.src + ')';
          btn.title = 'Drag me into the machine';
          btn.setAttribute('aria-label', 'Load ' + b.alt + ' into the machine');
          btn.addEventListener('dragstart', beginDrag('kueh', b.id));
          btn.addEventListener('dragend', endDrag);
          btn.addEventListener('click', function () { loadKueh(b.id); });
          slot.appendChild(btn);
          lane.appendChild(slot);
        });
      }
    }

    // The desktop steamer conceals the join between two deliberately distinct
    // half-belts. Mobile exposes the belt below it, so it gets one uninterrupted
    // lane containing the complete sequence instead of revealing that join.
    fillLane(el.beltLeft, laneShapes(0));
    fillLane(el.beltRight, laneShapes(1));
    fillLane(el.beltMobile, BELT_SHAPES);
  }

  function buildCards(container, dict, kind, key, swatchClass) {
    Object.keys(dict).forEach(function (k) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ing' + (swatchClass ? ' ' + swatchClass : '');
      btn.draggable = true;
      if (dict[k].swatch) {
        const i = document.createElement('i');
        i.style.background = dict[k].swatch;
        btn.appendChild(i);
      }
      btn.appendChild(document.createTextNode(dict[k].label));
      btn.addEventListener('dragstart', beginDrag(kind, k));
      btn.addEventListener('dragend', endDrag);
      btn.addEventListener('click', function () {
        const patch = { phase: 'idle' };
        patch[key] = k;
        note(dict[k].label + ' selected');
        setState(patch);
      });
      cardRefs[key][k] = btn;
      container.appendChild(btn);
    });
  }

  function buildThemeGrid() {
    THEMES.forEach(function (t) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-chip';
      btn.dataset.theme = t.id;

      const sw = document.createElement('span');
      if (t.rainbow) {
        sw.className = 'theme-sw theme-sw--rainbow';
      } else if (t.custom) {
        sw.className = 'theme-sw theme-sw--custom';
      } else {
        sw.className = 'theme-sw';
        themeColors(t).forEach(function (id) {
          const s = document.createElement('span');
          s.className = 'ts';
          s.style.background = flavorHex(id);
          sw.appendChild(s);
        });
      }
      btn.appendChild(sw);

      const name = document.createElement('span');
      name.className = 'theme-name';
      name.textContent = t.name;
      btn.appendChild(name);

      btn.addEventListener('click', function () {
        applyTheme(t.id);
        note(t.name + ' theme');
        setState({ phase: 'idle' });
      });

      themeRefs[t.id] = btn;
      el.themeGrid.appendChild(btn);
    });
  }

  function buildCustomControls() {
    [1, 2, 3].forEach(function (n) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = n + ' colour' + (n > 1 ? 's' : '');
      btn.addEventListener('click', function () { setState({ customCount: n }); });
      countRefs[n] = btn;
      el.customCount.appendChild(btn);
    });

    for (let i = 0; i < 3; i++) {
      const label = document.createElement('label');
      label.className = 'custom-color-swatch';

      const input = document.createElement('input');
      input.type = 'color';
      input.value = state.customColors[i];

      const block = document.createElement('span');
      block.className = 'custom-color-block';
      block.style.background = state.customColors[i];

      const num = document.createElement('span');
      num.className = 'custom-color-num';
      num.textContent = String(i + 1);

      input.addEventListener('input', function () {
        state.customColors[i] = input.value;
        block.style.background = input.value;
        render();
      });

      label.appendChild(input);
      label.appendChild(block);
      label.appendChild(num);
      swatchRefs[i] = label;
      el.customSwatches.appendChild(label);
    }
  }

  function buildExteriorGrid() {
    EXTERIOR_COLORS.forEach(function (c) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-chip';
      btn.innerHTML = '<span class="color-chip-circle"></span>' +
        '<span class="color-chip-label"></span>';
      btn.querySelector('.color-chip-circle').style.background = c.hex;
      btn.querySelector('.color-chip-label').textContent = c.name;
      btn.addEventListener('click', function () {
        note(c.name + ' dough');
        setState({ doughColor: c.id, phase: 'idle' });
      });
      doughRefs[c.id] = btn;
      el.exteriorGrid.appendChild(btn);
    });

    // Custom dough colour — a native picker dressed as one more chip.
    const label = document.createElement('label');
    label.className = 'color-chip color-chip--custom';
    const input = document.createElement('input');
    input.type = 'color';
    input.value = state.customDough;
    const circle = document.createElement('span');
    circle.className = 'color-chip-circle';
    circle.style.background = state.customDough;
    const text = document.createElement('span');
    text.className = 'color-chip-label';
    text.textContent = 'Custom';
    input.addEventListener('input', function () {
      state.customDough = input.value;
      circle.style.background = input.value;
      setState({ doughColor: 'custom', phase: 'idle' });
    });
    label.appendChild(input);
    label.appendChild(circle);
    label.appendChild(text);
    doughRefs.custom = label;
    el.exteriorGrid.appendChild(label);
  }

  // Shape pickers across all three top-view kuehs. Silhouettes, not swatches —
  // a shape control has to show shapes.
  function buildShapeGrid(container, list, key, refs, label) {
    list.forEach(function (item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-chip';
      const cv = document.createElement('canvas');
      cv.className = 'mould-chip';
      const lab = document.createElement('span');
      lab.className = 'color-chip-label';
      lab.textContent = item.name;
      btn.appendChild(cv); btn.appendChild(lab);
      btn.addEventListener('click', function () {
        const patch = { phase: 'idle' };
        patch[key] = item.id;
        note(item.name + ' ' + label);
        setState(patch);
      });
      refs[item.id] = { btn: btn, canvas: cv };
      container.appendChild(btn);
    });
  }

  function paintShapeChips(refs, tint) {
    Object.keys(refs).forEach(function (id) {
      TopViewCanvas.chip(refs[id].canvas, id, tint);
    });
  }

  function markShapeGrid(refs, active) {
    Object.keys(refs).forEach(function (id) {
      refs[id].btn.classList.toggle('active', active === id);
    });
  }

  // The mould picker shows silhouettes rather than swatches — it's a shape
  // control, so a row of near-identical cream dots would say nothing.
  function buildMouldGrid() {
    MOULDS.forEach(function (m) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-chip';
      const cv = document.createElement('canvas');
      cv.className = 'mould-chip';
      const label = document.createElement('span');
      label.className = 'color-chip-label';
      label.textContent = m.name;
      btn.appendChild(cv);
      btn.appendChild(label);
      btn.addEventListener('click', function () {
        note(m.name + ' mould');
        setState({ mould: m.id, phase: 'idle' });
      });
      mouldRefs[m.id] = { btn: btn, canvas: cv };
      el.mouldGrid.appendChild(btn);
    });
  }

  // Swatch grid without the custom picker — used for both salat controls.
  function buildColourGrid(container, list, key, refs, label) {
    list.forEach(function (c) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-chip';
      btn.innerHTML = '<span class="color-chip-circle"></span><span class="color-chip-label"></span>';
      btn.querySelector('.color-chip-circle').style.background = c.hex;
      btn.querySelector('.color-chip-label').textContent = c.name;
      btn.addEventListener('click', function () {
        const patch = { phase: 'idle' };
        patch[key] = c.id;
        note(c.name + ' ' + label);
        setState(patch);
      });
      refs[c.id] = btn;
      container.appendChild(btn);
    });
  }

  function buildOndehChips(container, list, key, refs, label) {
    list.forEach(function (item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = item.name;
      btn.addEventListener('click', function () {
        const patch = { phase: 'idle' };
        patch[key] = item.id;
        note(item.name + ' ' + label);
        setState(patch);
      });
      refs[item.id] = btn;
      container.appendChild(btn);
    });
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  function render() {
    const running = state.phase === 'running';
    const loading = state.phase === 'loading';
    const shaking = running || loading;
    const empty = !state.loaded;
    const p = PALETTES[state.palette];

    // Machine — shakes both while swallowing a kueh and while steaming one.
    el.machine.classList.toggle('is-running', shaking);
    el.machineBody.classList.toggle('is-over', !!(state.over && state.dragging));
    el.hopperHint.hidden = !state.dragging;

    // The window shows an empty plate until a kueh is loaded, then the kueh's
    // own photo.
    const shape = state.loadedId
      ? BELT_SHAPES.filter(function (x) { return x.id === state.loadedId; })[0]
      : null;
    el.machinePlate.classList.toggle('is-hidden', !empty);
    el.machineKueh.hidden = empty;
    if (shape && el.machineKueh.getAttribute('src') !== shape.src) {
      el.machineKueh.setAttribute('src', shape.src);
      // Changing src doesn't restart a CSS animation, so retrigger it by hand
      // to get the drop as the kueh lands in the window.
      el.machineKueh.classList.remove('is-dropping');
      void el.machineKueh.offsetWidth;
      el.machineKueh.classList.add('is-dropping');
    }
    el.machineKueh.alt = shape ? shape.alt + ' in the machine' : '';

    const statusLabel = empty ? 'empty'
      : loading ? 'loading'
        : running ? 'steaming'
          : state.phase === 'done' ? 'done' : 'loaded';
    // All kept short — the readout is a narrow strip that clips with an
    // ellipsis, and it gets narrower still on phones.
    const readout = empty
      ? '> feed me a kueh'
      : loading
        ? '> loading…'
        : running
          ? '> folding layer ' + state.layers + '…'
          : state.phase === 'done'
            ? '> done. take it warm.'
            : '> ' + state.loaded.toLowerCase() + ' loaded';

    el.statusLabel.textContent = statusLabel;
    // The machine loaded it fine; it's the line inside that's down.
    el.statusLabel2.textContent =
      ownStudioFor(state.loadedId) ? statusLabel : 'maintenance';
    el.readout.textContent = readout;
    el.readout2.textContent = readout;
    el.runChamber.textContent = running ? 'Steaming' : 'Run';
    // Nothing to open up until a kueh has finished dropping in.
    el.modify.disabled = empty || loading;

    // Interior
    el.interior.hidden = !state.interior;
    el.chamber.classList.toggle('is-over', !!(state.over && state.dragging));
    el.chamberHint.textContent = state.loaded ? state.loaded + ' in chamber' : 'drag ingredients in';
    el.log.textContent = '';
    state.log.forEach(function (line) {
      const d = document.createElement('div');
      d.textContent = line;
      el.log.appendChild(d);
    });

    // Controls — lapis drives layers from its own studio on the left, and an
    // ondeh has no layers at all, so the slider under the chamber steps aside
    // for both.
    const lapis = isLapis();
    const ondeh = isOndeh();
    const salat = isSalat();
    const bangkit = isBangkit();
    const bahulu = isBahulu();
    const tutu = isTutu();
    const angku = isAngku();
    el.layersRowMain.hidden = ownStudioFor(state.loadedId);
    el.layers2.value = state.layers;
    el.layersOut2.textContent = state.layers;
    el.layersL.value = state.layers;
    el.layersOutL.textContent = state.layers;

    ['filling', 'exterior', 'palette'].forEach(function (key) {
      Object.keys(cardRefs[key]).forEach(function (k) {
        cardRefs[key][k].classList.toggle('is-active', state[key] === k);
      });
    });

    // Only lapis and ondeh have a studio built. The rest open onto a
    // maintenance notice rather than controls that don't mean anything.
    const ownStudio = ownStudioFor(state.loadedId);
    el.interiorBody.hidden = !ownStudio;
    el.maintenance.hidden = ownStudio;
    if (!ownStudio && state.loaded) {
      el.maintTitle.textContent = 'The ' + state.loaded.toLowerCase() +
        ' line isn\'t running yet.';
      el.maintNote.textContent = maintenanceNote();
    }

    el.fillingRack.hidden = ownStudio;
    el.finishRack.hidden = ownStudio;
    el.dyeRack.hidden = ownStudio;
    el.lapisRack.hidden = !lapis;
    el.ondehRack.hidden = !ondeh;
    el.salatRack.hidden = !salat;
    el.bangkitRack.hidden = !bangkit;
    el.bahuluRack.hidden = !bahulu;
    el.tutuRack.hidden = !tutu;
    el.angkuRack.hidden = !angku;
    el.rackLeft.classList.toggle('is-lapis', ownStudio);

    Object.keys(themeRefs).forEach(function (id) {
      themeRefs[id].classList.toggle('active', state.theme === id);
    });
    el.customColors.hidden = state.theme !== 'custom';
    Object.keys(countRefs).forEach(function (n) {
      countRefs[n].classList.toggle('is-active', state.customCount === Number(n));
    });
    Object.keys(swatchRefs).forEach(function (i) {
      swatchRefs[i].hidden = Number(i) >= state.customCount;
    });
    Array.prototype.forEach.call(el.effectChips.children, function (b) {
      b.classList.toggle('is-active', b.dataset.val === state.effect);
    });

    // Ondeh studio
    Object.keys(doughRefs).forEach(function (id) {
      doughRefs[id].classList.toggle('active', state.doughColor === id);
    });
    Object.keys(ondehFillRefs).forEach(function (id) {
      ondehFillRefs[id].classList.toggle('is-active', state.ondehFilling === id);
    });
    Object.keys(coatingRefs).forEach(function (id) {
      coatingRefs[id].classList.toggle('is-active', state.coating === id);
    });

    // Salat studio
    Object.keys(custardRefs).forEach(function (id) {
      custardRefs[id].classList.toggle('active', state.custard === id);
    });
    Object.keys(riceRefs).forEach(function (id) {
      riceRefs[id].classList.toggle('active', state.rice === id);
    });

    // Bangkit studio
    Object.keys(mouldRefs).forEach(function (id) {
      mouldRefs[id].btn.classList.toggle('active', state.mould === id);
    });
    Object.keys(bColourRefs).forEach(function (id) {
      bColourRefs[id].classList.toggle('active', state.bangkitColour === id);
    });
    Object.keys(bFlavourRefs).forEach(function (id) {
      bFlavourRefs[id].classList.toggle('is-active', state.bangkitFlavour === id);
    });
    if (bahulu) {
      markShapeGrid(bahuluShapeRefs, state.bahuluShape);
      Object.keys(bahuluFlavRefs).forEach(function (id) {
        bahuluFlavRefs[id].classList.toggle('active', state.bahuluFlavour === id);
      });
      el.bahuluShapeNote.textContent = pick(BAHULU_SHAPES, state.bahuluShape).note;
      paintShapeChips(bahuluShapeRefs, pick(BAHULU_FLAVOURS, state.bahuluFlavour).hex);
    }
    if (angku) {
      markShapeGrid(angkuShapeRefs, state.angkuShape);
      Object.keys(angkuColRefs).forEach(function (id) {
        angkuColRefs[id].classList.toggle('active', state.angkuColour === id);
      });
      Object.keys(angkuFillRefs).forEach(function (id) {
        angkuFillRefs[id].classList.toggle('active', state.angkuFilling === id);
      });
      el.angkuShapeNote.textContent = pick(ANGKU_SHAPES, state.angkuShape).note;
      paintShapeChips(angkuShapeRefs, pick(ANGKU_COLOURS, state.angkuColour).hex);
    }
    if (tutu) {
      markShapeGrid(tutuShapeRefs, state.tutuShape);
      Object.keys(tutuColRefs).forEach(function (id) {
        tutuColRefs[id].classList.toggle('active', state.tutuColour === id);
      });
      Object.keys(tutuFillRefs).forEach(function (id) {
        tutuFillRefs[id].classList.toggle('active', state.tutuFilling === id);
      });
      el.tutuShapeNote.textContent = pick(TUTU_SHAPES, state.tutuShape).note;
      paintShapeChips(tutuShapeRefs, pick(TUTU_COLOURS, state.tutuColour).hex);
    }
    if (bangkit) {
      el.mouldNote.textContent = mould().note;
      // Repaint the silhouettes in the dough colour so the picker previews it.
      const tint = bangkitColour().hex;
      Object.keys(mouldRefs).forEach(function (id) {
        TopViewCanvas.chip(mouldRefs[id].canvas, id, tint);
      });
    }

    el.recipe.hidden = !state.recipe;

    // Canvas — an ondeh is a ball on a leaf, everything else is a layered
    // block. Only one of the two is ever on screen.
    const topView = bangkit || bahulu || tutu || angku;
    el.chamberCanvasEl.hidden = ondeh || topView;
    el.ondehCanvas.hidden = !ondeh;
    el.topviewCanvas.hidden = !topView;

    if (topView) {
      ondehCanvas.stop();
      if (bangkit) {
        topViewCanvas.draw({ kind: 'bangkit', shape: state.mould,
          colour: bangkitColour().hex, filling: null });
      } else if (bahulu) {
        topViewCanvas.draw({ kind: 'bahulu', shape: state.bahuluShape,
          colour: pick(BAHULU_FLAVOURS, state.bahuluFlavour).hex, filling: null });
      } else if (tutu) {
        topViewCanvas.draw({ kind: 'tutu', shape: state.tutuShape,
          colour: pick(TUTU_COLOURS, state.tutuColour).hex,
          filling: pick(TUTU_FILLINGS, state.tutuFilling).hex });
      } else {
        topViewCanvas.draw({ kind: 'angku', shape: state.angkuShape,
          colour: pick(ANGKU_COLOURS, state.angkuColour).hex,
          filling: pick(ANGKU_FILLINGS, state.angkuFilling).hex });
      }
    } else if (ondeh) {
      const f = ondehFilling();
      ondehCanvas.draw({
        exterior: doughHex(),
        filling: f.hex,
        glossy: f.glossy,
        coating: state.coating,
      });
      // The drips only animate while the hatch is open.
      if (state.interior) ondehCanvas.start(); else ondehCanvas.stop();
    } else if (salat) {
      ondehCanvas.stop();
      // Two unequal bands: custard on top, a thicker speckled rice base below.
      const cu = custard(), ri = riceColour();
      chamberCanvas.draw({
        bands: [
          { color: cu.hex, weight: 0.42 },
          { color: ri.hex, weight: 0.58, speckle: true },
        ],
        topColor: cu.hex,
        finish: 'steamed',
        empty: empty,
      });
    } else {
      ondehCanvas.stop();
      // Lapis mixes its own per-layer colours; everything else alternates the
      // two-tone palette.
      const colors = lapis ? lapisColors() : p.layers;
      chamberCanvas.draw({
        bands: null,          // draw() merges, so clear salat's bands explicitly
        layers: state.layers,
        colors: colors,
        topColor: lapis ? colors[0] : p.top,
        finish: state.exterior,
        empty: empty,
      });
    }
  }

  // ─── WIRING ────────────────────────────────────────────────────────────────

  function init() {
    buildBelt();
    buildCards(el.fillingCards, FILLINGS, 'filling', 'filling', null);
    buildCards(el.finishCards, EXTERIORS, 'exterior', 'exterior', null);
    buildCards(el.dyeCards, PALETTES, 'palette', 'palette', 'ing--dye');
    buildThemeGrid();
    buildCustomControls();
    buildExteriorGrid();
    buildOndehChips(el.ondehFillingChips, ONDEH_FILLINGS, 'ondehFilling', ondehFillRefs, 'filling');
    buildOndehChips(el.coatingChips, COATINGS, 'coating', coatingRefs, 'coating');
    buildColourGrid(el.custardGrid, CUSTARDS, 'custard', custardRefs, 'custard');
    buildColourGrid(el.riceGrid, RICE_COLOURS, 'rice', riceRefs, 'rice');
    buildMouldGrid();
    buildColourGrid(el.bangkitColourGrid, BANGKIT_COLOURS, 'bangkitColour', bColourRefs, 'dough');
    buildOndehChips(el.bangkitFlavourChips, BANGKIT_FLAVOURS, 'bangkitFlavour', bFlavourRefs, 'flavour');
    buildShapeGrid(el.bahuluShapeGrid, BAHULU_SHAPES, 'bahuluShape', bahuluShapeRefs, 'mould');
    buildColourGrid(el.bahuluFlavourGrid, BAHULU_FLAVOURS, 'bahuluFlavour', bahuluFlavRefs, 'batter');
    buildShapeGrid(el.tutuShapeGrid, TUTU_SHAPES, 'tutuShape', tutuShapeRefs, 'mould');
    buildColourGrid(el.tutuColourGrid, TUTU_COLOURS, 'tutuColour', tutuColRefs, 'cake');
    buildColourGrid(el.tutuFillingGrid, TUTU_FILLINGS, 'tutuFilling', tutuFillRefs, 'filling');
    buildShapeGrid(el.angkuShapeGrid, ANGKU_SHAPES, 'angkuShape', angkuShapeRefs, 'mould');
    buildColourGrid(el.angkuColourGrid, ANGKU_COLOURS, 'angkuColour', angkuColRefs, 'skin');
    buildColourGrid(el.angkuFillingGrid, ANGKU_FILLINGS, 'angkuFilling', angkuFillRefs, 'filling');

    el.machineBody.addEventListener('dragover', allowDrop);
    el.machineBody.addEventListener('dragleave', leaveDrop);
    el.machineBody.addEventListener('drop', onDropMachine);

    el.chamber.addEventListener('dragover', allowDrop);
    el.chamber.addEventListener('dragleave', leaveDrop);
    el.chamber.addEventListener('drop', onDropChamber);

    el.modify.addEventListener('click', function () {
      if (state.loaded) setState({ interior: true });
    });
    el.runChamber.addEventListener('click', run);
    // Just closes. A finished run ejects you and scrolls on its own; closing by
    // hand means you're abandoning the run, so stay where you are.
    [el.closeHatch, el.maintClose].forEach(function (btn) {
      btn.addEventListener('click', function () {
        setState({ interior: false, dragging: null, over: false });
      });
    });

    el.recipePrint.addEventListener('click', function () { window.print(); });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && state.interior) {
        setState({ interior: false, dragging: null, over: false });
      }
    });

    [el.layers2, el.layersL].forEach(function (slider) {
      slider.addEventListener('input', function (ev) {
        setLayers(Number(ev.target.value));
      });
    });

    Array.prototype.forEach.call(el.effectChips.children, function (b) {
      b.addEventListener('click', function () {
        setState({ effect: b.dataset.val, phase: 'idle' });
      });
    });

    render();
  }

  init();
})();
