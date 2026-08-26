// Luk Chup Trio chapter content — same shape as ondeh-ondeh-01.js.
// One customer, three voices (Mango, Mangosteen, Orange), per
// docs/INTERNATIONAL-CHARACTERS-SET-01.md (fictional). Any factual/
// cultural claim is marked in `research.claims` with status
// "unverified-plausible" and must be checked against real sources before
// this ships as final copy.
//
// Per that doc's shared rules: no em dashes anywhere in dialogue or card
// copy for this character set.
//
// Minigame: js/minigames/shapePaintShine.js, built from the source sheet
// at assets/minigames/luk-chup-shape-paint-shine/asset-sheet-v1.png per
// docs/INTERNATIONAL-MINIGAMES-SET-01.md.

window.KG = window.KG || {};
window.KG.chapters = window.KG.chapters || {};

window.KG.chapters["luk-chup-01"] = {
  id: "luk-chup-01",
  character: {
    id: "luk-chup",
    displayName: "Luk Chup Trio",
    memoryQuestion: "What are we, really, underneath these bright colours?",
    portraits: {
      neutral: "assets/characters/luk-chup/dialogue/neutral-soft-v1.png",
      thinking: "assets/characters/luk-chup/dialogue/thinking-soft-v1.webp",
      worried: "assets/characters/luk-chup/dialogue/worried-soft-v1.webp",
      remembering: "assets/characters/luk-chup/dialogue/remembering-soft-v1.png",
      happy: "assets/characters/luk-chup/dialogue/happy-soft-v1.png"
    }
  },

  arrivalLines: [
    { speaker: "beary", text: "Well now, I was not expecting three tiny fruits to visit together. Though... you do not quite smell like fruit. Who are you?" },
    { speaker: "character", expression: "worried", text: "That is exactly what we are trying to remember. Mango says we are sweets, Mangosteen has gone quiet, and Orange keeps laughing whenever someone calls us fruit." },
    { speaker: "beary", text: "Then let's begin with what you do remember. How did you get these shapes and colours?" },
    { speaker: "character", expression: "worried", text: "Tiny brushes. Bright colours. A glossy finish. But nothing from before that. If our centres are all alike, are we only copies wearing different costumes?" },
    { speaker: "beary", text: "Let's look past the colour and shape, then, and see what's underneath." },
    { speaker: "character", expression: "remembering", text: "A smooth mung bean centre. Coconut. Sugar. Patient hands turning one simple mixture into many tiny forms." }
  ],

  minigame: {
    id: "shape-paint-shine",
    game: "shapePaintShine",
    unlocksClueId: "clue-shared-centre",
    config: {}
  },

  clueUnlockedText: "Clue unlocked: a shared beginning did not erase what made each of them different.",

  deduction: {
    id: "final-guess",
    prompt: "What does it really mean that Mango, Mangosteen and Orange share the same soft centre?",
    choices: [
      { id: "same-start-different-self", text: "They came from one shared recipe, but each still grew into their own self", correct: true },
      { id: "just-copies", text: "They are only copies of one another", correct: false },
      { id: "disguise", text: "Their bright colours are a disguise hiding nothing real", correct: false }
    ],
    retryDialogue: [
      { speaker: "character", expression: "worried", text: "That still sounds like something is missing from us. We do not feel like copies." },
      { speaker: "beary", text: "Think about how differently each of you walked in here today." }
    ]
  },

  restoredLines: [
    { speaker: "character", expression: "happy", text: "We can come from the same recipe and still grow into ourselves. Being mistaken for fruit is fine, as long as we get to surprise people afterward." },
    { speaker: "beary", text: "Welcome back, friends. Knowing what connects you does not make your differences any less real." }
  ],

  card: {
    id: "card-luk-chup",
    name: "Luk Chup Trio",
    // Placeholder — no dedicated card frame for this character yet.
    frame: "assets/cards/character-card-frame-ondeh-v1.jpg",
    portrait: "assets/characters/luk-chup/dialogue/happy-soft-v1.png",
    portraitAlt: "Mango, Mangosteen and Orange smiling together, glossy and bright.",
    story: "Mango, Mangosteen and Orange feared that their bright shells were only disguises. With Beary's help, they remembered the soft mung bean sweet beneath their glossy colours. They shared one beginning, but every shape still told a different story.",
    tags: ["Thailand", "Sweet", "Mung Bean"]
  },

  research: {
    status: "required",
    claims: [
      { claim: "Luk chup are Thai sweets commonly shaped like miniature fruits or vegetables.", status: "unverified-plausible" },
      { claim: "Luk chup are typically made from a mung bean mixture, coloured by hand and finished with a glossy agar coating.", status: "unverified-plausible" }
    ],
    sources: []
  }
};
