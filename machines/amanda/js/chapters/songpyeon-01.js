// Pink Songpyeon chapter content — same shape as ondeh-ondeh-01.js.
// Story adapted from docs/INTERNATIONAL-CHARACTERS-SET-01.md (fictional).
// Any factual/cultural claim is marked in `research.claims` with status
// "unverified-plausible" and must be checked against real sources before
// this ships as final copy.
//
// Per that doc's shared rules: no em dashes anywhere in dialogue or card
// copy for this character set.
//
// Minigame: js/minigames/foldAWish.js, built from the source sheet at
// assets/minigames/songpyeon-fold-a-wish/asset-sheet-v1.png per
// docs/INTERNATIONAL-MINIGAMES-SET-01.md.

window.KG = window.KG || {};
window.KG.chapters = window.KG.chapters || {};

window.KG.chapters["songpyeon-01"] = {
  id: "songpyeon-01",
  character: {
    id: "songpyeon",
    displayName: "Pink Songpyeon",
    memoryQuestion: "If I cannot remember whose hands made me, how do I know where I belong?",
    portraits: {
      neutral: "assets/characters/songpyeon/dialogue/neutral-soft-v1.png",
      thinking: "assets/characters/songpyeon/dialogue/thinking-soft-v1.webp",
      worried: "assets/characters/songpyeon/dialogue/worried-soft-v1.webp",
      remembering: "assets/characters/songpyeon/dialogue/remembering-soft-v1.png",
      happy: "assets/characters/songpyeon/dialogue/happy-soft-v1.png"
    }
  },

  arrivalLines: [
    { speaker: "character", expression: "worried", text: "I remember sitting among so many others, with warm hands all around us. But every face has disappeared from my memory." },
    { speaker: "beary", text: "What can you still remember about those hands?" },
    { speaker: "character", expression: "worried", text: "They folded soft rice dough around sesame, beans and chestnuts. I cannot remember which filling was mine, or who folded me. What if that means I no longer belong with them?" },
    { speaker: "beary", text: "Maybe belonging is not hidden inside one exact filling. Let's rebuild the memory and see what the hands were sharing." },
    { speaker: "character", expression: "remembering", text: "The scent of pine needles as we steamed. Families gathered close, shaping each piece by hand and filling the table with wishes for one another." }
  ],

  minigame: {
    id: "fold-a-wish",
    game: "foldAWish",
    unlocksClueId: "clue-shaped-like-a-wish",
    config: {}
  },

  clueUnlockedText: "Clue unlocked: every filling was different, but each piece was folded with the same shared care.",

  deduction: {
    id: "final-guess",
    prompt: "What made Pink Songpyeon part of that gathering?",
    choices: [
      { id: "shared-care", text: "The care, wishes and time everyone shared while making the songpyeon together", correct: true },
      { id: "exact-filling", text: "Remembering the exact filling that was placed inside her", correct: false },
      { id: "one-maker", text: "Finding the one person who folded her", correct: false }
    ],
    retryDialogue: [
      { speaker: "character", expression: "worried", text: "I still cannot see a single face clearly. Maybe the memory was never about only one person." },
      { speaker: "beary", text: "Think about everything the families were doing together, and what each pair of hands added to the table." }
    ]
  },

  restoredLines: [
    { speaker: "character", expression: "happy", text: "I do not need to remember one pair of hands to know I belonged there. I was part of something everyone made and shared together." },
    { speaker: "beary", text: "Welcome back, friend. Sometimes home is not one hand holding on to you. It is all the care that helped shape you." }
  ],

  card: {
    id: "card-songpyeon",
    name: "Pink Songpyeon",
    // Placeholder — no dedicated card frame for this character yet.
    frame: "assets/cards/character-card-frame-ondeh-v1.jpg",
    portrait: "assets/characters/songpyeon/dialogue/happy-soft-v1.png",
    portraitAlt: "Pink Songpyeon smiling after remembering the gathering where she was made.",
    story: "Pink Songpyeon remembered warm hands, sweet fillings and the scent of pine, but she could not remember who had folded her. With Beary's help, she discovered that she belonged to the whole gathering. Every piece was different, yet each carried the care and wishes that families shared together.",
    tags: ["Korea", "Tteok", "Filled"]
  },

  research: {
    status: "required",
    claims: [
      { claim: "Songpyeon are half moon shaped rice cakes traditionally associated with the Korean harvest festival Chuseok.", status: "unverified-plausible" },
      { claim: "Songpyeon are traditionally filled with ingredients such as sesame seeds, beans or chestnuts and steamed over pine needles.", status: "unverified-plausible" }
    ],
    sources: []
  }
};
