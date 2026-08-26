// Ondeh-Ondeh chapter content — vertical slice.
// Story dialogue is original/fictional. Any factual/cultural claim is marked
// in `research.claims` with status "unverified-plausible" and must be checked
// against real sources before this ships as final copy. See docs/CLAUDE-HANDOFF.md.

window.KG = window.KG || {};
window.KG.chapters = window.KG.chapters || {};

window.KG.chapters["ondeh-ondeh-01"] = {
  id: "ondeh-ondeh-01",
  character: {
    id: "ondeh-ondeh",
    displayName: "Ondeh-Ondeh",
    memoryQuestion: "What was hidden inside me that made the first bite feel like a surprise?",
    portraits: {
      neutral: "assets/characters/ondeh-ondeh/dialogue/neutral-v1.webp",
      thinking: "assets/characters/ondeh-ondeh/dialogue/thinking-v1.webp",
      worried: "assets/characters/ondeh-ondeh/dialogue/worried-v2.webp",
      remembering: "assets/characters/ondeh-ondeh/dialogue/remembering-v1.webp",
      happy: "assets/characters/ondeh-ondeh/dialogue/happy-v1.webp"
    }
  },

  arrivalLines: [
    { speaker: "beary", text: "Oh! A new face at the counter. Welcome in — what's got you looking so puzzled?" },
    { speaker: "character", expression: "thinking", text: "I know I'm supposed to remember something... about my first bite. But it's like reaching into fog." },
    { speaker: "beary", text: "Take your time. Sometimes a memory hides until something jogs it loose." },
    { speaker: "character", expression: "remembering", text: "Wait — I remember it wasn't just soft. There was something inside. Something that surprised me." },
    { speaker: "beary", text: "Now we're getting somewhere. Let's see if we can find it together." }
  ],

  minigame: {
    id: "ingredient-memory",
    game: "memoryFlip",
    unlocksClueId: "clue-texture-and-filling",
    config: {
      pairCount: 6,
      pairs: [
        { id: "pandan-leaf", image: "assets/minigames/memory-flip/fronts/pandan-v2.webp" },
        { id: "coconut", image: "assets/minigames/memory-flip/fronts/coconut-v2.webp" },
        { id: "palm-sugar", image: "assets/minigames/memory-flip/fronts/palm-sugar-v2.webp" },
        { id: "dough-ball", image: "assets/minigames/memory-flip/fronts/dough-v2.webp" },
        { id: "steamer", image: "assets/minigames/memory-flip/fronts/steamer-v2.webp" },
        { id: "memory-drop", image: "assets/minigames/memory-flip/fronts/memory-drop-v2.webp" }
      ]
    }
  },

  clueUnlockedText: "Clue unlocked: something warm and sweet was hidden right in the center.",

  deduction: {
    id: "final-guess",
    prompt: "Which memory belongs to this customer?",
    choices: [
      { id: "sugar", text: "A pocket of melted palm sugar, hidden in the center", correct: true },
      { id: "peanut", text: "A whole roasted peanut in the center", correct: false },
      { id: "custard", text: "A scoop of cold custard in the center", correct: false }
    ],
    retryDialogue: [
      { speaker: "character", expression: "worried", text: "Hmm... that doesn't feel quite right. Something's missing." },
      { speaker: "beary", text: "No rush. Think back to the flip game — what melted?" }
    ]
  },

  restoredLines: [
    { speaker: "character", expression: "happy", text: "That's it — it wasn't peanut or custard. It was warm, melted palm sugar, hidden right in the middle, waiting to surprise whoever took the first bite. That's me." },
    { speaker: "beary", text: "Welcome back, friend. That memory suits you." }
  ],

  card: {
    id: "card-ondeh-ondeh",
    name: "Ondeh-Ondeh",
    frame: "assets/cards/character-card-frame-ondeh-v1.jpg",
    portrait: "assets/characters/ondeh-ondeh/dialogue/happy-v1.webp",
    portraitAlt: "Ondeh-Ondeh smiling joyfully after recovering their memory.",
    story: "Ondeh-Ondeh arrived with a memory hidden beneath the surface. With Beary’s help, scattered sensations of fragrance, softness and warmth came together. What once felt frightening became the sweetest part of remembering who they were.",
    // Three permanent tag categories: 1) Place — country/region, 2) Food family, 3) Signature trait.
    tags: ["SE Asia", "Kueh", "Filled"]
  },

  research: {
    status: "required",
    claims: [
      { claim: "Ondeh-ondeh is typically filled with melted palm sugar (gula melaka).", status: "unverified-plausible" },
      { claim: "Ondeh-ondeh is typically coated in grated coconut.", status: "unverified-plausible" }
    ],
    sources: []
  }
};
