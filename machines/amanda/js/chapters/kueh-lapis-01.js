// Kueh Lapis chapter content — same shape as ondeh-ondeh-01.js.
// Story dialogue adapted from docs/CHARACTER-STORIES-01-03.md (fictional).
// Any factual/cultural claim is marked in `research.claims` with status
// "unverified-plausible" and must be checked against real sources before
// this ships as final copy.
//
// Minigame: js/minigames/buildLayers.js, built from the source sheet at
// assets/minigames/kueh-lapis-build-layers/asset-sheet-v1.png per
// docs/ANG-KU-KUEH-AND-KUEH-LAPIS-MINIGAMES.md. No dedicated card frame
// for this character yet, so the card below still uses Ondeh-Ondeh's.

window.KG = window.KG || {};
window.KG.chapters = window.KG.chapters || {};

window.KG.chapters["kueh-lapis-01"] = {
  id: "kueh-lapis-01",
  character: {
    id: "kueh-lapis",
    displayName: "Kueh Lapis",
    memoryQuestion: "Why did it take so many layers to make just one of me?",
    portraits: {
      // Filenames per docs/KUEH-LAPIS-ASSETS.md — do not use neutral-v2,
      // remembering-raw-v1, or happy-raw-v1; those are intermediate exports.
      neutral: "assets/characters/kueh-lapis/dialogue/neutral-soft-v1.png",
      thinking: "assets/characters/kueh-lapis/dialogue/thinking-soft-v1.webp",
      worried: "assets/characters/kueh-lapis/dialogue/worried-soft-v1.webp",
      remembering: "assets/characters/kueh-lapis/dialogue/remembering-soft-v1.png",
      happy: "assets/characters/kueh-lapis/dialogue/happy-soft-v1.png"
    }
  },

  arrivalLines: [
    { speaker: "beary", text: "Whoa, no need to rush in like that! Come sit, catch your breath." },
    { speaker: "character", expression: "thinking", text: "Sorry — I'm late. I've been trying to remember everything at once, and the harder I try, the more it all blurs together." },
    { speaker: "beary", text: "Slow down. You don't have to remember it all in one go." },
    { speaker: "character", expression: "remembering", text: "I remember warmth. Patience. Someone watching over me carefully while I was made — one layer at a time." },
    { speaker: "beary", text: "That's a good place to start. Let's see what those layers are hiding." }
  ],

  minigame: {
    id: "build-the-layers",
    game: "buildLayers",
    unlocksClueId: "clue-many-thin-layers",
    config: {}
  },

  clueUnlockedText: "Clue unlocked: every thin layer was made one at a time, with patience.",

  deduction: {
    id: "final-guess",
    prompt: "What is Kueh Lapis really made of?",
    choices: [
      { id: "layers", text: "Many small layers, each added with care", correct: true },
      { id: "one-big-memory", text: "One big memory they forgot to hold onto", correct: false },
      { id: "mistake", text: "A mistake made while rushing", correct: false }
    ],
    retryDialogue: [
      { speaker: "character", expression: "worried", text: "Hmm... that doesn't feel right. It wasn't one big thing." },
      { speaker: "beary", text: "Think back to the layers you just built — was it one piece, or many?" }
    ]
  },

  restoredLines: [
    { speaker: "character", expression: "happy", text: "I kept searching for one big memory. But I'm made from all the little ones — layer after layer, each one mattered." },
    { speaker: "beary", text: "Welcome back, friend. Every layer of you got you here." }
  ],

  card: {
    id: "card-kueh-lapis",
    name: "Kueh Lapis",
    // Placeholder — no dedicated card frame for this character yet.
    frame: "assets/cards/character-card-frame-ondeh-v1.jpg",
    portrait: "assets/characters/kueh-lapis/dialogue/happy-soft-v1.png",
    portraitAlt: "Kueh Lapis smiling warmly after remembering their many layers.",
    story: "Kueh Lapis is formed from many delicate layers, each added with patience and care. They once believed their smallest memories did not matter, until they saw how every thin layer helped create something rich, complete and worth waiting for.",
    tags: ["SE Asia", "Cake", "Layered"]
  },

  research: {
    status: "required",
    claims: [
      { claim: "Kueh lapis is a Singapore/Indonesian layered cake made by baking or steaming one thin layer at a time.", status: "unverified-plausible" }
    ],
    sources: []
  }
};
