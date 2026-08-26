// Ube Biko chapter content — same shape as ondeh-ondeh-01.js.
// Story adapted from docs/INTERNATIONAL-CHARACTERS-SET-01.md (fictional).
// Any factual/cultural claim is marked in `research.claims` with status
// "unverified-plausible" and must be checked against real sources before
// this ships as final copy.
//
// Per that doc's shared rules: no em dashes anywhere in dialogue or card
// copy for this character set.
//
// Minigame: js/minigames/sharedTray.js, built from the source sheet at
// assets/minigames/ube-biko-shared-tray/asset-sheet-v1.png per
// docs/INTERNATIONAL-MINIGAMES-SET-01.md.

window.KG = window.KG || {};
window.KG.chapters = window.KG.chapters || {};

window.KG.chapters["ube-biko-01"] = {
  id: "ube-biko-01",
  character: {
    id: "ube-biko",
    displayName: "Ube Biko",
    memoryQuestion: "Was it my job to keep everyone together?",
    portraits: {
      neutral: "assets/characters/ube-biko/dialogue/neutral-soft-v1.png",
      thinking: "assets/characters/ube-biko/dialogue/thinking-soft-v1.webp",
      worried: "assets/characters/ube-biko/dialogue/worried-soft-v1.webp",
      remembering: "assets/characters/ube-biko/dialogue/remembering-soft-v1.png",
      happy: "assets/characters/ube-biko/dialogue/happy-soft-v1.png"
    }
  },

  arrivalLines: [
    { speaker: "character", expression: "worried", text: "I keep remembering the same words: stay close, stick together. But I can't remember who they were meant for." },
    { speaker: "beary", text: "You sound as if you've been carrying those words all by yourself." },
    { speaker: "character", expression: "worried", text: "What if keeping everyone together was my job? What if they drift apart when I'm not there?" },
    { speaker: "beary", text: "Maybe you were never the glue. Maybe you helped them remember a promise they made to each other." },
    { speaker: "character", expression: "remembering", text: "A celebration. One wide tray cut into many portions. People making room for one another, then passing each piece from hand to hand." }
  ],

  minigame: {
    id: "shared-tray",
    game: "sharedTray",
    unlocksClueId: "clue-held-together",
    config: {}
  },

  clueUnlockedText: "Clue unlocked: sticky rice can carry a wish for people to stay close.",

  deduction: {
    id: "final-guess",
    prompt: "What was Ube Biko helping everyone remember?",
    choices: [
      { id: "held-together", text: "To choose closeness and keep sharing with one another", correct: true },
      { id: "careless", text: "To avoid serving food from one large tray", correct: false },
      { id: "difficult", text: "To make one person responsible for holding everyone together", correct: false }
    ],
    retryDialogue: [
      { speaker: "character", expression: "worried", text: "That still makes it sound like everything depended on me." },
      { speaker: "beary", text: "Look at the tray you completed. Did one piece hold the others together, or did every piece find its place?" }
    ]
  },

  restoredLines: [
    { speaker: "character", expression: "happy", text: "I wasn't responsible for keeping everyone together. I was a reminder that they wanted to stay close." },
    { speaker: "beary", text: "Welcome back, friend. A shared table can carry a promise, but the people around it choose to keep that promise." }
  ],

  card: {
    id: "card-ube-biko",
    name: "Ube Biko",
    // Placeholder — no dedicated card frame for this character yet.
    frame: "assets/cards/character-card-frame-ondeh-v1.jpg",
    portrait: "assets/characters/ube-biko/dialogue/happy-soft-v1.png",
    portraitAlt: "Ube Biko smiling warmly, a little golden coconut clinging to their side.",
    story: "Ube Biko feared it was their job to stop everyone from drifting apart. A shared tray helped them remember that sticky rice can carry a wish for closeness. They were never the glue. They were a sweet reminder that people choose to stay connected.",
    tags: ["Philippines", "Rice Cake", "Coconut"]
  },

  research: {
    status: "partially-verified",
    claims: [
      { claim: "Biko is a Filipino sticky rice cake made from glutinous rice, coconut milk and sugar.", status: "verified" },
      { claim: "Sticky rice can symbolise the hope that love and devotion will remain close.", status: "verified-contextual" },
      { claim: "Rice cakes including biko are commonly served during festivals and town fiestas.", status: "verified" },
      { claim: "Ube biko is a purple ube variation of biko.", status: "requires-source" }
    ],
    sources: [
      "https://pidswebs.pids.gov.ph/CDN/PUBLICATIONS/pidsdps0515.pdf",
      "https://www.philrice.gov.ph/wp-content/uploads/2015/08/2015-3q-philrice-magazine-all-for-rice.pdf"
    ]
  }
};
