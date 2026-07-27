/* ------------------------------------------------------------------
   KUEH MACHINE — GACHA DATA MODEL

   Tier probability is exactly what's stated: pick a tier by its
   published weight (60 / 30 / 10), then pick uniformly among the
   kuehs inside that tier. No per-kueh weighting hidden inside a
   tier — "common" means all three commons are equally likely.
------------------------------------------------------------------- */

const RARITIES = {
  common:    { label: "Common",     weight: 60, color: "#B8A98F", glow: "#B8A98F" },
  rare:      { label: "Rare",       weight: 30, color: "#5FAE71", glow: "#5FAE71" },
  ultraRare: { label: "Ultra Rare", weight: 10, color: "#F5C24B", glow: "#F5C24B" },
  /* weight 0 — not in the pull pool yet. The mechanics for how someone
     actually gets one of these are still undecided, so pullKueh() must
     never select this tier until that's built. */
  legendary: { label: "Legendary",  weight: 0,  color: "#B085F5", glow: "#B085F5" }
};

const KUEHS = [
  /* ---------------- COMMON ---------------- */
  {
    id: "bahulu",
    name: "Kueh Bahulu",
    svgType: "bahulu",
    rarity: "common",
    meaning: "A small, ridged sponge cake from a mould that's been in the family for generations. The taste of a reunion table.",
    flavor: [
      "Warm, familiar, a little nostalgic.",
      "The one that tastes like somebody's grandmother's kitchen.",
      "Simple ingredients, generations of the same recipe."
    ],
    detail: {
      origin: "Believed to have Portuguese-Eurasian roots from colonial-era Melaka, adapted with local ingredients and pressed into carved wooden or copper moulds passed down through families.",
      whenEaten: "A Chinese New Year and festive staple baked in batches for visiting guests, though many households treat it as an everyday snack year-round.",
      funFacts: [
        "The ridged shape comes from the mould, not a cutter — every family's mould leaves a slightly different pattern.",
        "Traditionally baked over charcoal in a two-sided pan, heated from the top and bottom separately."
      ],
      variants: [
        { name: "Bahulu Ikan", description: "Pressed into a fish-shaped mould instead of the classic ridged dome, common in Peranakan households." },
        { name: "Pandan Bahulu", description: "Pandan juice folded into the batter for a green tint and a grassy aroma." }
      ]
    }
  },
  {
    id: "ondeh",
    name: "Ondeh-Ondeh",
    svgType: "ondeh",
    rarity: "common",
    meaning: "A quiet green sphere with a small surprise of palm sugar at the centre — it gives itself away only when you bite in.",
    flavor: [
      "Small, green, and hiding something sweet.",
      "Every stall has these. There's a reason for that.",
      "Unassuming on the outside. That's kind of the point."
    ],
    detail: {
      origin: "Rooted in Malay and Indonesian klepon, the pandan-and-gula-melaka combination travelled across the region and became a fixture of Peranakan kueh trays.",
      whenEaten: "An everyday teatime snack, usually sold fresh in the morning since the palm sugar centre is best eaten the same day it's made.",
      funFacts: [
        "The molten centre only works because the palm sugar filling is chilled solid before the dough is wrapped around it.",
        "Its Indonesian cousin, klepon, is nearly identical but is usually rolled in fresh grated coconut mixed with a pinch of salt."
      ],
      variants: [
        { name: "Blue pea ondeh", description: "Dough tinted violet-blue with butterfly pea flower instead of pandan green." },
        { name: "Ondeh ubi", description: "Purple sweet potato worked into the dough for a denser, earthier bite." }
      ]
    }
  },
  {
    id: "dadar",
    name: "Kueh Dadar",
    svgType: "dadar",
    rarity: "common",
    meaning: "A pandan crepe rolled carefully around its filling, sealed like something meant to be handed over, not just eaten.",
    flavor: [
      "Rolled up and ready to travel.",
      "Looks simple from outside. Good things are rolled up inside.",
      "A tidy little parcel from the machine."
    ],
    detail: {
      origin: "A pandan crepe rolled around grated coconut, found across Malay, Peranakan, and Indonesian kitchens alike — each tracing back to the same technique of a thin, flexible pancake wrapped around a sweet filling.",
      whenEaten: "A common breakfast or teatime kueh, sold from morning kueh stalls and best eaten the same day it's made.",
      funFacts: [
        "The green colour traditionally comes from pandan leaf juice, not food colouring, extracted by blending and straining the leaves.",
        "In Indonesia, the same kueh is called dadar gulung and is often filled with a darker, more caramelised coconut filling."
      ],
      variants: [
        { name: "Dadar Gulung", description: "The Indonesian version, often with a richer, gula melaka-cooked coconut filling." },
        { name: "Suji Dadar", description: "Uses suji leaf alongside pandan for a deeper green and a slightly different aroma." }
      ]
    }
  },

  /* ---------------- RARE ---------------- */
  {
    id: "lapis",
    name: "Kueh Lapis",
    svgType: "lapis",
    rarity: "rare",
    meaning: "Built one thin layer at a time, each one set before the next is poured. There's no shortcut to it — the patience is the point.",
    flavor: [
      "Nine layers of somebody's patience.",
      "Nothing about this one was rushed. Good pull.",
      "Slow to make, worth the wait."
    ],
    detail: {
      origin: "A layered steamed kueh with roots in Indonesian and Peranakan kitchens. Its name simply means 'layers' — pouring and steaming one thin layer at a time is the entire technique.",
      whenEaten: "Served at celebrations and special occasions, since the many layers are seen as auspicious, tied to ideas of abundance and prosperity.",
      funFacts: [
        "Traditional kueh lapis can have nine, twelve, or more layers, each poured and steamed individually before the next goes on — a process that can take hours.",
        "It's eaten by peeling each layer apart one at a time, which is considered part of the experience, not just the presentation."
      ],
      variants: [
        { name: "Lapis Legit", description: "An Indonesian oven-baked spiced butter cake, distinct from the steamed rice-flour version but sharing the name and the layering." },
        { name: "Sarawak Lapis", description: "An especially intricate variant arranged into geometric patterns across dozens of thin layers." }
      ]
    }
  },
  {
    id: "salat",
    name: "Kueh Salat",
    svgType: "salat",
    rarity: "rare",
    meaning: "Two distinct layers that only work because they're together — a firm glutinous rice base carrying a soft, fragrant pandan custard top.",
    flavor: [
      "Two layers, one kueh. Balanced pull.",
      "The base holds it up. The top is why you remember it.",
      "Doesn't happen by accident, this one."
    ],
    detail: {
      origin: "A two-layer Peranakan kueh pairing a glutinous rice base with a silky pandan-coconut custard top, considered one of the defining kuehs of Nyonya cooking.",
      whenEaten: "A festive, ceremonial kueh traditionally served at Peranakan weddings, Chinese New Year, and other significant family occasions.",
      funFacts: [
        "The custard top is traditionally coloured and flavoured with fresh pandan juice, which is part of what separates a well-made salat from an average one.",
        "It's typically cut into diamonds or squares and served at room temperature — chilling it firms the custard up too much."
      ],
      variants: [
        { name: "Blue glutinous rice salat", description: "The rice base tinted with butterfly pea flower for a blue-and-green two-tone effect." },
        { name: "Egg-rich custard salat", description: "A richer version using more egg yolk in the custard for a deeper yellow and denser set." }
      ]
    }
  },
  {
    id: "angku",
    name: "Ang Ku Kueh",
    svgType: "angku",
    rarity: "rare",
    meaning: "Pressed in a wooden mould shaped for luck, dyed the red that means good fortune. Traditionally reserved for family milestones.",
    flavor: [
      "The red one. Reserved for occasions that matter.",
      "Pressed for luck, and it seems to be working.",
      "Not an everyday pull."
    ],
    detail: {
      origin: "Its name literally means 'red tortoise cake' — the tortoise, a symbol of longevity in Chinese culture, is pressed into the dough using a carved wooden mould.",
      whenEaten: "Traditionally offered at birthdays, especially a baby's first-month celebration, and other milestones tied to wishes for a long life.",
      funFacts: [
        "The red dye traditionally symbolises good fortune and joy — the colour is about the occasion, not the filling.",
        "The wooden moulds used to press the tortoise pattern are often heirlooms, carved decades ago and reused for generations."
      ],
      variants: [
        { name: "Peanut ang ku kueh", description: "Ground roasted peanut and sugar filling instead of the more common sweetened mung bean." },
        { name: "Mini ang ku kueh", description: "A bite-sized version, often served at large gatherings where guests take one each." }
      ]
    }
  },

  /* ---------------- ULTRA RARE ---------------- */
  {
    id: "talam",
    name: "Kueh Talam",
    svgType: "talam",
    rarity: "ultraRare",
    meaning: "Steamed in two careful stages — a savoury-sweet base set firm before a silken coconut layer is poured over it — then cut into neat diamonds.",
    flavor: [
      "Cut into a diamond because an ordinary square wouldn't do it justice.",
      "Two stages, two textures, one very lucky pull.",
      "The machine doesn't give this one up easily."
    ],
    detail: {
      origin: "A two-stage steamed kueh — 'talam' refers to the tray it's traditionally steamed and served in — with a savoury-sweet base set first before a silken coconut layer is poured on top.",
      whenEaten: "A teatime treat and gathering staple, valued for the contrast between its firmer base and soft coconut top.",
      funFacts: [
        "The base is often flavoured with pandan, corn, or yam, while the top layer is almost always a plain coconut custard for contrast.",
        "It's traditionally cut into diamonds, a shape shared with several other Malay and Peranakan kuehs to mark a special-occasion cut versus an everyday square."
      ],
      variants: [
        { name: "Talam Ubi", description: "Sweet potato mashed into the base layer for a denser, earthier version." },
        { name: "Talam Jagung", description: "Sweet corn kernels folded into the base for extra texture and sweetness." }
      ]
    }
  },
  {
    id: "koswee",
    name: "Kueh Ko Swee",
    svgType: "koswee",
    rarity: "ultraRare",
    meaning: "A glossy, jelly-soft kueh with a telltale dimple pressed into its centre, rolled in fresh coconut just before it's served.",
    flavor: [
      "Glossy, jelly-soft, and genuinely hard to land.",
      "That dimple in the centre isn't an accident — it's the signature.",
      "You don't see this one in the machine often."
    ],
    detail: {
      origin: "Made from a rice and tapioca flour batter, steamed until translucent, with a distinctive dimple pressed into the centre before it's rolled in fresh grated coconut.",
      whenEaten: "A traditional teatime kueh that's become less common at everyday stalls, more often found at kueh specialists or made at home for occasions.",
      funFacts: [
        "The dimple isn't decorative — it's pressed in with a thumb or spoon while the kueh is still warm, and it's considered a mark of a well-made one.",
        "It's typically flavoured with either pandan for green or gula melaka for a deep amber-brown."
      ],
      variants: [
        { name: "Gula melaka ko swee", description: "Made with palm sugar instead of pandan, giving it an amber colour and a caramel-like flavour." },
        { name: "Sesame-coated ko swee", description: "Rolled in toasted sesame instead of coconut, more common in some Peranakan households." }
      ]
    }
  },
  {
    id: "pulut-hitam",
    name: "Pulut Hitam",
    svgType: "pulutHitam",
    rarity: "ultraRare",
    meaning: "Black glutinous rice, slow-cooked for hours to a deep purple-black, served pooled in fresh coconut milk. More ceremony than snack.",
    flavor: [
      "Hours of slow cooking, distilled into one very rare pull.",
      "This one usually shows up for something worth celebrating.",
      "Deep, dark, and the rarest thing the machine holds."
    ],
    detail: {
      origin: "A black glutinous rice porridge, slow-cooked for hours until the rice breaks down into a deep purple-black, then served pooled in fresh coconut milk.",
      whenEaten: "Traditionally served warm as a dessert, especially in cooler weather or as a comforting end to a meal, though it's enjoyed year-round.",
      funFacts: [
        "The rice isn't dyed — it's a variety of glutinous rice with a dark bran layer that turns the whole pot deep purple as it cooks down.",
        "It's usually served with a swirl of thick coconut milk on top, and the bitter-sweet contrast between the two is intentional, not a garnish afterthought."
      ],
      variants: [
        { name: "Pulut hitam with sago", description: "Small sago pearls added for extra texture alongside the black rice." },
        { name: "Chilled pulut hitam", description: "Served cold, more common in warmer climates or as a refreshing variation." }
      ]
    }
  }
];

/* ------------------------------------------------------------------
   LEGENDARY — a rarer tier above Ultra Rare. Deliberately kept out of
   KUEHS and out of pullKueh()'s pool: there's no mechanic yet for how
   someone actually earns one, so for now the collection UI renders
   these as locked and shrouded (no art, no name shown). The real
   content is written and ready for whenever that mechanic exists.
------------------------------------------------------------------- */
const LEGENDARY_KUEHS = [
  {
    id: "pulut-tai-tai",
    name: "Kueh Pulut Tai Tai",
    svgType: "pulutTaiTai",
    rarity: "legendary",
    meaning: "Blue glutinous rice pressed and steamed until dense, traditionally paired with a spread of kaya — a kueh reserved for the most significant Peranakan celebrations.",
    flavor: [
      "A wedding-table classic, rarely seen outside real occasions.",
      "Blue rice, pressed dense, built for celebration.",
      "The machine barely acknowledges this one exists."
    ],
    detail: {
      origin: "Coloured with butterfly pea flower and pressed into a dense block after steaming, kueh pulut tai tai is a Peranakan festive staple traditionally served sliced and spread with kaya.",
      whenEaten: "Reserved for weddings, engagements, and major family celebrations — not a kueh you'd typically find at an everyday stall.",
      funFacts: [
        "The blue colour comes entirely from butterfly pea flower, with no artificial dye involved.",
        "It's traditionally pressed under weight after steaming, which is what gives it its dense, sliceable texture."
      ],
      variants: [
        { name: "Pulut tai tai with kaya", description: "Served sliced with a thick layer of homemade coconut kaya spread on top." }
      ]
    }
  },
  {
    id: "seri-muka",
    name: "Kueh Seri Muka",
    svgType: "seriMuka",
    rarity: "legendary",
    meaning: "A firm glutinous rice base beneath a glossy, jade-green pandan custard — its name means 'shining face,' and a well-made one lives up to it.",
    flavor: [
      "Shining face, steady hands — this one takes both.",
      "The custard has to set glass-smooth, or it doesn't count.",
      "Rare enough that most people only know it by reputation."
    ],
    detail: {
      origin: "Its name, 'seri muka,' means 'shining face' — a reference to the smooth, glossy finish the pandan custard top should have when it's set correctly.",
      whenEaten: "A festive kueh served at celebrations and gatherings, closely related to kueh salat but recognised by its own name and reputation.",
      funFacts: [
        "A well-made seri muka has a custard top smooth enough to reflect light — an uneven surface is considered a sign of a rushed batch.",
        "The rice base is steamed with coconut milk before the custard is poured on, so it holds its shape as a distinct, separate layer."
      ],
      variants: [
        { name: "Blue rice seri muka", description: "The glutinous rice base tinted blue with butterfly pea flower instead of left plain." }
      ]
    }
  },
  {
    id: "nagasari",
    name: "Nagasari",
    svgType: "nagasari",
    rarity: "legendary",
    meaning: "A whole piece of banana hidden inside a steamed pandan rice-flour custard, wrapped and sealed in banana leaf — you don't know what's inside until you unwrap it.",
    flavor: [
      "Wrapped, sealed, and hiding something inside.",
      "You have to unwrap this one to actually understand it.",
      "The machine keeps this one folded away."
    ],
    detail: {
      origin: "A steamed rice-flour and coconut milk custard wrapped around a piece of banana, then folded and sealed inside banana leaf before steaming — found across Malay, Peranakan, and Indonesian kitchens.",
      whenEaten: "An everyday snack in many households, though the banana-leaf wrapping and hand-folding make it feel more like something someone's grandmother made than a factory line.",
      funFacts: [
        "The banana leaf isn't just packaging — steaming inside it gives the custard a faint smoky, herbal aroma that plastic wrap can't replicate.",
        "The banana used is usually a firmer, starchier variety that holds its shape after steaming rather than turning to mush."
      ],
      variants: [
        { name: "Nagasari with jackfruit", description: "Ripe jackfruit used instead of banana for a sweeter, more fragrant filling." }
      ]
    }
  },
  {
    id: "bingka-ubi",
    name: "Kueh Bingka Ubi",
    svgType: "bingkaUbi",
    rarity: "legendary",
    meaning: "A baked tapioca cake with a deep golden, caramelised top — one of the few kuehs that goes into an oven instead of a steamer.",
    flavor: [
      "Baked, not steamed — an outlier even among kuehs.",
      "That caramelised top doesn't happen by accident.",
      "The oven-baked one. Doesn't show up often."
    ],
    detail: {
      origin: "Made from grated tapioca, coconut milk, and sugar, then baked until the top turns a deep golden brown — unusual among kuehs, which are almost all steamed rather than baked.",
      whenEaten: "A teatime treat, often made at home for gatherings since the baking time makes it less practical for high-volume stall selling.",
      funFacts: [
        "The caramelised top comes from the natural sugars in the batter browning under direct heat, not a separate glaze.",
        "Because tapioca doesn't behave like wheat flour, getting the texture right — firm but not rubbery — takes practice most bakers only get from repetition."
      ],
      variants: [
        { name: "Bingka ubi with pandan", description: "Pandan juice added to the batter for a green-tinted version with a grassier aroma." }
      ]
    }
  },
  {
    id: "lopes",
    name: "Kueh Lopes",
    svgType: "lopes",
    rarity: "legendary",
    meaning: "Glutinous rice packed into a leaf-wrapped triangle and boiled for hours, then rolled in fresh coconut and finished with dark palm sugar syrup.",
    flavor: [
      "Hours of boiling for one triangle of rice.",
      "Coconut, palm sugar, and a lot of patience.",
      "Rare because almost nobody has the time to make it anymore."
    ],
    detail: {
      origin: "Glutinous rice is packed tightly into a leaf-wrapped triangle and boiled for several hours until dense and chewy, then rolled in grated coconut and drizzled with dark palm sugar syrup.",
      whenEaten: "A traditional teatime kueh that's become rarer as fewer people have time for the long boiling process — more often found at dedicated kueh sellers than made at home now.",
      funFacts: [
        "The leaf wrapping isn't just for shape — it keeps the rice compact under pressure while it boils for hours, which is what gives lopes its dense, chewy bite.",
        "The dark syrup is gula melaka, palm sugar simmered down until thick enough to cling to the coconut coating instead of running off."
      ],
      variants: [
        { name: "Black glutinous rice lopes", description: "Made with black glutinous rice instead of white, for a deeper colour and a slightly nuttier flavour." }
      ]
    }
  }
];

/* ------------------------------------------------------------------
   TIER-WEIGHTED PULL
   Pick a tier by its published probability, then pick uniformly
   among the kuehs inside it.
------------------------------------------------------------------- */
function pullKueh() {
  const tiers = Object.entries(RARITIES); // [ [id, {weight,...}], ... ]
  const total = tiers.reduce((sum, [, t]) => sum + t.weight, 0);
  let r = Math.random() * total;
  let chosenTier = tiers[0][0];
  for (const [id, t] of tiers) {
    if (r < t.weight) { chosenTier = id; break; }
    r -= t.weight;
  }
  const pool = KUEHS.filter((k) => k.rarity === chosenTier);
  return pool[Math.floor(Math.random() * pool.length)];
}
