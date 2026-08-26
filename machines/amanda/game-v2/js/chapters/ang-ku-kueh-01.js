// Ang Ku Kueh chapter content — same shape as ondeh-ondeh-01.js.
// Story dialogue adapted from docs/CHARACTER-STORIES-01-03.md (fictional).
// Any factual/cultural claim is marked in `research.claims` with status
// "unverified-plausible" and must be checked against real sources before
// this ships as final copy.
//
// Full dialogue expression set is now in — see
// assets/characters/ang-ku-kueh/dialogue/. worried-v1 is the repaired
// transparent version per docs/ANG-KU-KUEH-AND-KUEH-LAPIS-MINIGAMES.md.
//
// Minigame: js/minigames/restorePattern.js, built from the source sheet
// at assets/minigames/ang-ku-kueh-restore-pattern/asset-sheet-v1.png per
// docs/ANG-KU-KUEH-AND-KUEH-LAPIS-MINIGAMES.md. No dedicated card frame
// for this character yet, so the card below still uses Ondeh-Ondeh's.

window.KG = window.KG || {};
window.KG.chapters = window.KG.chapters || {};

window.KG.chapters["ang-ku-kueh-01"] = {
  id: "ang-ku-kueh-01",
  character: {
    id: "ang-ku-kueh",
    displayName: "Ang Ku Kueh",
    memoryQuestion: "What does the pattern pressed into me actually mean?",
    portraits: {
      neutral: "assets/characters/ang-ku-kueh/dialogue/neutral-soft-v1.png",
      thinking: "assets/characters/ang-ku-kueh/dialogue/thinking-soft-v1.webp",
      worried: "assets/characters/ang-ku-kueh/dialogue/worried-soft-v1.webp",
      remembering: "assets/characters/ang-ku-kueh/dialogue/remembering-soft-v1.png",
      happy: "assets/characters/ang-ku-kueh/dialogue/happy-soft-v1.png"
    }
  },

  arrivalLines: [
    { speaker: "beary", text: "Well hello there — welcome in. I can't help but notice that pattern on you. It's beautiful." },
    { speaker: "character", expression: "thinking", text: "Thank you... I think. Something's pressed into me, and I know it matters, but I can't remember why." },
    { speaker: "beary", text: "Every mark tells a story. Let's see if yours wants to be remembered." },
    { speaker: "character", expression: "remembering", text: "Wait — I see it now. A carved mould. A banana leaf. Red dough, and careful hands pressing something into me." },
    { speaker: "beary", text: "Now we're getting somewhere. Let's piece it together." }
  ],

  minigame: {
    id: "restore-pattern",
    game: "restorePattern",
    unlocksClueId: "clue-pressed-with-care",
    config: {}
  },

  clueUnlockedText: "Clue unlocked: the pattern was pressed by careful, caring hands.",

  deduction: {
    id: "final-guess",
    prompt: "What does the pattern on Ang Ku Kueh really mean?",
    choices: [
      { id: "wish", text: "A wish for happiness and long life, passed down with love", correct: true },
      { id: "warning", text: "A warning to be careful", correct: false },
      { id: "label", text: "A label showing which stall they came from", correct: false }
    ],
    retryDialogue: [
      { speaker: "character", expression: "worried", text: "Hmm... that doesn't feel right. It wasn't a warning." },
      { speaker: "beary", text: "Think about who pressed it into you — and why they'd take the time." }
    ]
  },

  restoredLines: [
    { speaker: "character", expression: "happy", text: "I thought the pattern was telling me who I had to become. It was really someone wishing me a good life." },
    { speaker: "beary", text: "Welcome back, friend. That's a wish worth carrying." }
  ],

  card: {
    id: "card-ang-ku-kueh",
    name: "Ang Ku Kueh",
    // Placeholder — no dedicated card frame for this character yet.
    frame: "assets/cards/character-card-frame-ondeh-v1.jpg",
    portrait: "assets/characters/ang-ku-kueh/dialogue/happy-soft-v1.png",
    portraitAlt: "Ang Ku Kueh resting on a leaf, the pattern on their surface visible.",
    story: "Resting on a green leaf and marked with an intricate pattern, Ang Ku Kueh carries wishes of happiness and longevity. They once felt burdened by the symbol on their surface, but learned that it was a gift of hope passed down with care.",
    tags: ["SE Asia", "Kueh", "Moulded"]
  },

  research: {
    status: "required",
    claims: [
      { claim: "Ang ku kueh is a mould-pressed kueh traditionally associated with celebrations and good wishes.", status: "unverified-plausible" },
      { claim: "Ang ku kueh is typically served resting on a piece of banana leaf.", status: "unverified-plausible" }
    ],
    sources: []
  }
};
