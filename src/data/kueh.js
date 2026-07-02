// Trimmed, extended copy of ../../wip/kueh-database.json, inlined as a JS
// module rather than fetched — matches the site's zero-dependency,
// single-deploy architecture and avoids fetch() breaking under file://.
// wip/kueh-database.json remains the source-of-truth raw export; this file
// is the maintained/extended copy the live page actually reads.
//
// flavor_profile / origin_sentence / recipe are new content, authored for
// this feature (not present in the original export) and currently only
// written for the first 7 photographed kueh. Same caveat as the original
// dataset's own note: worth a human read-through for accuracy before this
// goes live.

export const KUEH_DATA = [
  {
    id: 'ang-ku-kueh',
    name: 'Ang Ku Kueh',
    origin: 'Hokkien Chinese (Fujian), adopted into Peranakan cuisine',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'festive/ritual',
    description: 'Oval, tortoise-shell-shaped glutinous rice cake with a soft chewy skin, traditionally dyed red and filled with sweet mung bean paste. Used in birthdays and religious offerings.',
    photo: 'images/kueh/ang-ku-kueh.png',
    flavor_profile: ['Sweet', 'Chewy', 'Mung Bean', 'Glutinous'],
    origin_sentence: 'A Hokkien Chinese tradition brought into Peranakan kitchens, its red tortoise-shell shape symbolizes longevity at birthdays and temple offerings.',
    recipe: {
      ingredients: [
        '200g glutinous rice flour',
        '150g mung bean paste (store-bought or home-cooked)',
        '1 tbsp sugar',
        '1 tbsp oil, plus extra for greasing',
        'Red food coloring',
        '150ml warm water',
        'Banana leaf squares, greased',
      ],
      steps: [
        'Knead glutinous rice flour, sugar, oil, red coloring, and warm water into a smooth, pliable dough.',
        'Divide the dough and flatten each piece into a small disc.',
        'Wrap a spoonful of mung bean paste inside each disc and seal into a ball.',
        'Press the ball into a greased tortoise mold to shape, then unmold onto a piece of banana leaf.',
        'Steam over medium heat for about 8 minutes, then brush lightly with oil to keep the skin glossy.',
      ],
    },
  },
  {
    id: 'ondeh-ondeh',
    name: 'Ondeh-Ondeh',
    origin: 'Malay/Javanese, adopted into Peranakan cuisine',
    category: 'sweet',
    texture: 'boiled',
    occasion: 'everyday',
    description: 'Pandan-green glutinous rice balls filled with liquid palm sugar, rolled in grated coconut. Bursts with syrup when bitten.',
    photo: 'images/kueh/ondeh-ondeh.png',
    flavor_profile: ['Sweet', 'Chewy', 'Coconut', 'Gula Melaka'],
    origin_sentence: 'Rooted in Malay and Javanese kitchens (known as klepon in Indonesia), it became a Peranakan teatime staple for the way it bursts with molten palm sugar.',
    recipe: {
      ingredients: [
        '200g glutinous rice flour',
        '1 tbsp pandan juice or a few drops of pandan extract',
        '130ml water',
        '100g gula melaka (palm sugar), chopped small',
        '1 cup grated coconut, steamed with a pinch of salt',
      ],
      steps: [
        'Mix glutinous rice flour with pandan juice and water into a soft, non-sticky dough.',
        'Pinch off small pieces and flatten into discs.',
        'Wrap a small piece of gula melaka inside each disc and roll into a smooth ball.',
        'Boil the balls in water until they float to the surface, then lift out with a slotted spoon.',
        'Roll the warm balls in grated coconut while still damp so it sticks.',
      ],
    },
  },
  {
    id: 'kueh-lapis',
    name: 'Kueh Lapis',
    origin: 'Peranakan/Indonesian',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'festive',
    description: 'Steamed layered cake, traditionally built up layer by layer in contrasting colors. Eaten by peeling apart each soft, slightly chewy layer.',
    photo: 'images/kueh/kueh-lapis.png',
    flavor_profile: ['Sweet', 'Chewy', 'Coconut', 'Layered'],
    origin_sentence: 'A Peranakan and Indonesian favorite built up color by color, steamed one layer at a time until it can be peeled apart by hand.',
    recipe: {
      ingredients: [
        '200g rice flour',
        '100g tapioca flour',
        '200g sugar',
        '600ml coconut milk',
        '400ml water',
        'Food coloring, 2-3 colors of your choice',
      ],
      steps: [
        'Whisk rice flour, tapioca flour, sugar, coconut milk, and water into a smooth, thin batter.',
        'Divide the batter evenly between your chosen colors.',
        'Ladle a thin layer of the first color into a greased tin and steam for about 5 minutes until set.',
        'Add the next color on top and steam again; repeat, alternating colors, until the tin is full.',
        'Steam the final layer a little longer, then cool completely before slicing.',
      ],
    },
  },
  {
    id: 'kueh-salat',
    name: 'Kueh Salat',
    origin: 'Malay/Peranakan',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'festive',
    description: 'Two-tiered kueh with a base of steamed glutinous rice and a top layer of silky pandan-coconut custard.',
    photo: 'images/kueh/kueh-salat.png',
    flavor_profile: ['Sweet', 'Custardy', 'Pandan', 'Coconut'],
    origin_sentence: 'A Malay and Peranakan two-tier kueh pairing a base of glutinous rice with a silky pandan-coconut custard steamed on top.',
    recipe: {
      ingredients: [
        '300g glutinous rice, soaked overnight',
        '200ml coconut milk (for the rice), pinch of salt',
        '3 eggs',
        '200ml coconut milk (for the custard)',
        '80g sugar',
        '3 tbsp pandan juice',
      ],
      steps: [
        'Steam the soaked glutinous rice with coconut milk and salt until tender, then press firmly into a flat tin.',
        'Whisk eggs, coconut milk, sugar, and pandan juice together and strain for a smooth custard.',
        'Pour the custard over the pressed rice layer.',
        'Steam over low heat until the custard is set but still soft, covering the tin to stop condensation dripping in.',
        'Cool completely before cutting into squares.',
      ],
    },
  },
  {
    id: 'kueh-dadar',
    name: 'Kueh Dadar',
    origin: 'Malay/Indonesian/Peranakan',
    category: 'sweet',
    texture: 'raw/uncooked filling in cooked crepe',
    occasion: 'everyday',
    description: 'Thin pandan-flavored crepe rolled around a sweet coconut and palm sugar filling.',
    photo: 'images/kueh/kueh-dadar.png',
    flavor_profile: ['Sweet', 'Coconut', 'Gula Melaka', 'Pandan'],
    origin_sentence: 'A Malay, Indonesian, and Peranakan crepe rolled around sweet coconut and palm sugar, colored green with pandan.',
    recipe: {
      ingredients: [
        '120g flour',
        '1 egg',
        '200ml coconut milk',
        '3 tbsp pandan juice',
        '1 cup grated coconut',
        '80g gula melaka, chopped',
        'Pinch of salt',
      ],
      steps: [
        'Whisk flour, egg, coconut milk, and pandan juice into a smooth, thin batter.',
        'Cook the coconut, gula melaka, and a pinch of salt in a pan until the sugar melts and coats the coconut.',
        'Pour a thin layer of batter into a lightly greased pan and swirl to form a crepe; cook until just set.',
        'Spoon the coconut filling along one edge of the crepe.',
        'Fold in the sides and roll up into a neat log.',
      ],
    },
  },
  {
    id: 'kueh-bahulu',
    name: 'Kueh Bahulu',
    origin: 'Malay, Portuguese-influenced',
    category: 'sweet',
    texture: 'baked',
    occasion: 'festive (Hari Raya)',
    description: 'Small, dense-yet-airy sponge cakes baked in fish or flower-shaped molds, popular during Hari Raya.',
    photo: 'images/kueh/kueh-bahulu.png',
    flavor_profile: ['Sweet', 'Eggy', 'Light', 'Toasty'],
    origin_sentence: 'A Malay sponge cake with Portuguese-influenced roots, baked in fish or flower-shaped molds and especially popular during Hari Raya.',
    recipe: {
      ingredients: [
        '4 eggs',
        '150g sugar',
        '150g flour, sifted',
        '1/2 tsp baking powder',
        '1/2 tsp vanilla extract',
      ],
      steps: [
        'Whisk eggs and sugar together until thick, pale, and tripled in volume.',
        'Fold in the sifted flour and baking powder in batches, keeping the batter airy.',
        'Stir in the vanilla extract.',
        'Spoon the batter into greased bahulu molds, filling each about three-quarters full.',
        'Bake in a hot oven until golden and a skewer comes out clean, then unmold while warm.',
      ],
    },
  },
  {
    id: 'kueh-talam',
    name: 'Kueh Talam',
    origin: 'Malay/Peranakan',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'everyday',
    description: 'Two-layered steamed cake, usually a sweet pandan or mung bean base topped with a salty-sweet coconut milk layer.',
    photo: 'images/kueh/kueh-talam.png',
    flavor_profile: ['Sweet', 'Savory-sweet', 'Pandan', 'Coconut'],
    origin_sentence: 'A Malay and Peranakan two-layer steamed cake pairing a sweet pandan or mung bean base with a lightly salted coconut milk top.',
    recipe: {
      ingredients: [
        '120g rice flour (for the base)',
        '30g tapioca flour (for the base)',
        '100g sugar',
        '300ml pandan juice (or water with pandan extract)',
        '50g rice flour (for the top)',
        '20g tapioca flour (for the top)',
        '250ml coconut milk',
        '1/2 tsp salt',
      ],
      steps: [
        "Mix the base layer's rice flour, tapioca flour, sugar, and pandan juice into a smooth batter.",
        'Pour into a greased tin and steam until just set, about 10-15 minutes.',
        "Whisk the top layer's rice flour, tapioca flour, coconut milk, and salt into a smooth mixture.",
        'Pour gently over the set base layer.',
        'Steam again until the top layer is set but still soft, then cool before slicing.',
      ],
    },
  },
  {
    id: 'kueh-ku',
    name: 'Kueh Ku',
    origin: 'Chinese/Peranakan',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'festive/ritual',
    description: 'Similar to ang ku kueh but often smaller, softer-skinned, and made in varied colors, pressed with a wooden or plastic mold.',
  },
  {
    id: 'kueh-pie-tee',
    name: 'Kueh Pie Tee',
    origin: 'Peranakan',
    category: 'savory',
    texture: 'fried',
    occasion: 'festive',
    description: 'Crispy thin pastry cups filled with a savory stir-fried mix of turnip, carrot, and shrimp, garnished fresh at the table.',
  },
  {
    id: 'kueh-lapis-legit',
    name: 'Kueh Lapis Legit',
    origin: 'Indonesian/Dutch colonial',
    category: 'sweet',
    texture: 'baked',
    occasion: 'festive (Chinese New Year, Christmas)',
    description: 'Rich, buttery spiced layer cake baked one thin layer at a time under a grill, a legacy of Dutch colonial baking traditions.',
  },
  {
    id: 'putu-piring',
    name: 'Putu Piring',
    origin: 'Malay/South Indian influenced',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'everyday',
    description: 'Small steamed rice flour discs with a pocket of melted palm sugar inside, served with fresh grated coconut.',
  },
  {
    id: 'kueh-bingka',
    name: 'Kueh Bingka Ubi',
    origin: 'Malay/Peranakan',
    category: 'sweet',
    texture: 'baked',
    occasion: 'festive',
    description: 'Dense, chewy baked tapioca cake with a caramelized golden crust, similar in spirit to bibingka.',
  },
  {
    id: 'kueh-koci',
    name: 'Kueh Koci',
    origin: 'Malay/Peranakan',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'festive',
    description: 'Pyramid-shaped glutinous rice dumpling wrapped in banana leaf, filled with sweet coconut and palm sugar.',
  },
  {
    id: 'apam-balik',
    name: 'Apam Balik',
    origin: 'Malay/Chinese',
    category: 'sweet',
    texture: 'grilled/pan-fried',
    occasion: 'everyday',
    description: 'Folded pancake with a crisp, lacy exterior and a soft interior, filled with crushed peanuts and sugar.',
  },
  {
    id: 'kueh-tutu',
    name: 'Kueh Tutu',
    origin: 'Chinese/Malay-Singaporean',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'everyday',
    description: 'Small steamed rice flour cakes pressed in a mold and steamed over a pandan leaf, giving a fragrant aroma; filled with ground peanut or palm sugar.',
  },
  {
    id: 'kueh-kosui',
    name: 'Kueh Kosui',
    origin: 'Malay/Peranakan',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'everyday',
    description: 'Translucent, jelly-like steamed cake made with palm sugar, served in small cups topped with grated coconut.',
  },
  {
    id: 'kueh-ubi-kayu',
    name: 'Kueh Ubi Kayu',
    origin: 'Malay',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'everyday',
    description: 'Soft, moist steamed cassava cake, mildly sweet, often topped with grated coconut.',
  },
  {
    id: 'kueh-lopez',
    name: 'Kueh Lopez',
    origin: 'Malay/Indonesian (Betawi)',
    category: 'sweet',
    texture: 'boiled',
    occasion: 'everyday',
    description: 'Diamond-shaped glutinous rice cake, boiled wrapped in leaves, rolled in coconut, and drizzled with palm sugar syrup.',
  },
  {
    id: 'curry-puff',
    name: 'Curry Puff',
    origin: 'Malay, Indian/Portuguese-influenced',
    category: 'savory',
    texture: 'fried or baked',
    occasion: 'everyday',
    description: 'Crescent-shaped pastry filled with spiced curried potato and sometimes egg or chicken, a beloved teatime snack.',
  },
  {
    id: 'otak-otak',
    name: 'Otak-Otak',
    origin: 'Malay/Peranakan/Indonesian',
    category: 'savory',
    texture: 'grilled',
    occasion: 'everyday',
    description: 'Spiced fish paste wrapped in banana leaf and grilled over charcoal; often grouped with kueh in hawker contexts even though savory.',
  },
  {
    id: 'kueh-kochi-hijau',
    name: 'Pulut Inti',
    origin: 'Malay',
    category: 'sweet',
    texture: 'steamed',
    occasion: 'festive',
    description: 'Compressed glutinous rice (sometimes dyed blue with bunga telang) topped with sweet caramelized coconut.',
  },
  {
    id: 'kueh-cucur',
    name: 'Kueh Cucur',
    origin: 'Malay',
    category: 'sweet',
    texture: 'fried',
    occasion: 'everyday',
    description: 'Deep-fried disc of sweetened batter with a crisp edge and soft, spongy, caramel-colored center.',
  },
];

// Hand-authored, not parsed from the free-text `color` field — at this
// scale (22 entries) direct authoring is more reliable than trying to
// distinguish "golden brown" from "golden yellow" from "brown, layered"
// programmatically.
//
// Three hues per kueh, chosen to match what the food actually looks like —
// not derived by rotating one seed hue through a fixed offset. An earlier
// version did that and produced results like kueh lapis legit (a warm,
// neutral spiced brown cake) rendering with pink and blue tones, because a
// mechanical hue rotation doesn't know what color gula melaka or a banana
// leaf actually is. Each tier is still generated by the same OKLCH
// lightness/chroma formula (generatePalette in colors.js) — only the hue
// input for each tier is now authored to reflect the real kueh:
//   primary   — the dominant body color (drives the main ramp + text tint)
//   accent    — the realistic companion color actually present (gula melaka
//               gold/brown, coconut cream, banana leaf, etc.), not a blind
//               complementary rotation
//   highlight — a supporting tertiary shade, usually a variant within the
//               same real-world palette as primary/accent
//
// mode:
//   'chromatic' — normal case
//   'neutral'   — genuinely colorless primary ("white"/"white/cream") — the
//                 primary ramp stays a warm low-chroma neutral, but accent
//                 still carries real color (e.g. putu piring's rice is
//                 white, but its palm sugar core is a rich brown)
//   'signature' — kueh-lapis itself: no seed, generatePalette() is skipped
//                 entirely and DEFAULT_THEME is used verbatim, since the
//                 multicolor rainbow-layer kueh already *is* this site's
//                 own palette
export const KUEH_SEED_TABLE = {
  'ang-ku-kueh': {
    mode: 'chromatic',
    primary:   { h: 12,  c: 0.16 }, // red tortoise skin
    accent:    { h: 50,  c: 0.10 }, // banana leaf / cream underside
    highlight: { h: 350, c: 0.11 }, // softer coral-red
  },
  'ondeh-ondeh': {
    mode: 'chromatic',
    primary:   { h: 150, c: 0.13 }, // pandan green
    accent:    { h: 42,  c: 0.12 }, // gula melaka core
    highlight: { h: 60,  c: 0.07 }, // warm coconut cream
  },
  'kueh-lapis': { mode: 'signature', primary: null, accent: null, highlight: null },
  'kueh-salat': {
    mode: 'chromatic',
    primary:   { h: 138, c: 0.12 }, // glutinous rice + pandan custard, green
    accent:    { h: 68,  c: 0.05 }, // pale eggy custard cream
    highlight: { h: 160, c: 0.09 }, // deeper leaf green
  },
  'kueh-dadar': {
    mode: 'chromatic',
    primary:   { h: 145, c: 0.13 }, // pandan crepe
    accent:    { h: 40,  c: 0.12 }, // gula melaka filling
    highlight: { h: 55,  c: 0.05 }, // coconut cream
  },
  'kueh-bahulu': {
    mode: 'chromatic',
    primary:   { h: 80,  c: 0.14 }, // golden sponge
    accent:    { h: 45,  c: 0.13 }, // toasty baked amber
    highlight: { h: 70,  c: 0.05 }, // pale eggy cream
  },
  'kueh-talam': {
    mode: 'chromatic',
    primary:   { h: 136, c: 0.10 }, // pandan/mung bean base
    accent:    { h: 65,  c: 0.04 }, // coconut milk top
    highlight: { h: 155, c: 0.08 }, // deeper green
  },
  'kueh-ku': {
    mode: 'chromatic',
    primary:   { h: 40,  c: 0.14 }, // orange mold dye
    accent:    { h: 340, c: 0.10 }, // pink mold variant (it genuinely comes in this)
    highlight: { h: 85,  c: 0.12 }, // yellow mold variant
  },
  'kueh-pie-tee': {
    mode: 'chromatic',
    primary:   { h: 50,  c: 0.12 }, // crispy golden-brown cup
    accent:    { h: 30,  c: 0.14 }, // carrot/turnip filling
    highlight: { h: 110, c: 0.08 }, // fresh vegetable green garnish
  },
  'kueh-lapis-legit': {
    mode: 'chromatic',
    primary:   { h: 35,  c: 0.09 }, // warm spiced brown
    accent:    { h: 55,  c: 0.09 }, // buttery gold
    highlight: { h: 25,  c: 0.08 }, // deeper spice-brown
  },
  'putu-piring': {
    mode: 'neutral',
    primary:   { h: 40, c: 0.02 }, // white rice flour
    accent:    { h: 35, c: 0.10 }, // gula melaka core
    highlight: { h: 50, c: 0.03 }, // grated coconut
  },
  'kueh-bingka': {
    mode: 'chromatic',
    primary:   { h: 48, c: 0.13 }, // golden-brown baked crust
    accent:    { h: 30, c: 0.13 }, // deep caramelized edge
    highlight: { h: 55, c: 0.05 }, // pale tapioca cream
  },
  'kueh-koci': {
    mode: 'chromatic',
    primary:   { h: 345, c: 0.10 }, // pink dye (the pink variant)
    accent:    { h: 90,  c: 0.07 }, // banana leaf wrap
    highlight: { h: 40,  c: 0.04 }, // coconut filling cream
  },
  'apam-balik': {
    mode: 'chromatic',
    primary:   { h: 52, c: 0.12 }, // golden pancake
    accent:    { h: 32, c: 0.12 }, // toasted brown crust
    highlight: { h: 45, c: 0.07 }, // crushed peanut tan
  },
  'kueh-tutu': {
    mode: 'neutral',
    primary:   { h: 40,  c: 0.02 }, // white rice flour
    accent:    { h: 35,  c: 0.10 }, // peanut/gula melaka filling
    highlight: { h: 140, c: 0.05 }, // pandan leaf lining, faint green
  },
  'kueh-kosui': {
    mode: 'chromatic',
    primary:   { h: 32, c: 0.12 }, // palm sugar jelly, brown
    accent:    { h: 45, c: 0.03 }, // grated white coconut topping
    highlight: { h: 20, c: 0.11 }, // deeper amber
  },
  'kueh-ubi-kayu': {
    mode: 'neutral',
    primary:   { h: 40, c: 0.03 }, // pale cassava cream
    accent:    { h: 45, c: 0.08 }, // caramelized golden edges
    highlight: { h: 50, c: 0.02 }, // coconut topping
  },
  'kueh-lopez': {
    mode: 'chromatic',
    primary:   { h: 145, c: 0.12 }, // pandan-tinted glutinous rice
    accent:    { h: 38,  c: 0.12 }, // gula melaka syrup
    highlight: { h: 55,  c: 0.04 }, // coconut coating
  },
  'curry-puff': {
    mode: 'chromatic',
    primary:   { h: 50, c: 0.13 }, // golden-brown pastry
    accent:    { h: 70, c: 0.14 }, // curried potato filling, turmeric yellow
    highlight: { h: 30, c: 0.11 }, // deep pastry-brown
  },
  'otak-otak': {
    mode: 'chromatic',
    primary:   { h: 22, c: 0.15 }, // spiced fish paste, orange-red
    accent:    { h: 75, c: 0.08 }, // banana leaf wrap
    highlight: { h: 10, c: 0.12 }, // deeper charred red-brown
  },
  'kueh-kochi-hijau': {
    mode: 'chromatic',
    primary:   { h: 235, c: 0.10 }, // bunga telang blue
    accent:    { h: 40,  c: 0.12 }, // caramelized coconut topping
    highlight: { h: 220, c: 0.05 }, // soft white-blue rice
  },
  'kueh-cucur': {
    mode: 'chromatic',
    primary:   { h: 35, c: 0.13 }, // dark fried brown
    accent:    { h: 48, c: 0.11 }, // lighter caramel edge
    highlight: { h: 22, c: 0.10 }, // deep toasted brown center
  },
};

// Hand-authored shape-template mapping — same reliability reasoning as the
// seed table above. Falls back to 'disc' if an id is ever missing.
export const KUEH_SHAPE_TABLE = {
  'ang-ku-kueh':       'dome',
  'ondeh-ondeh':       'dome',
  'kueh-lapis':        'layered-bars',
  'kueh-salat':        'layered-bars',
  'kueh-dadar':        'disc',
  'kueh-bahulu':       'dome',
  'kueh-talam':        'layered-bars',
  'kueh-ku':           'dome',
  'kueh-pie-tee':      'dome',
  'kueh-lapis-legit':  'layered-bars',
  'putu-piring':       'disc',
  'kueh-bingka':       'disc',
  'kueh-koci':         'pyramid',
  'apam-balik':        'crescent',
  'kueh-tutu':         'dome',
  'kueh-kosui':        'dome',
  'kueh-ubi-kayu':     'disc',
  'kueh-lopez':        'pyramid',
  'curry-puff':        'crescent',
  'otak-otak':         'disc',
  'kueh-kochi-hijau':  'dome',
  'kueh-cucur':        'disc',
};
