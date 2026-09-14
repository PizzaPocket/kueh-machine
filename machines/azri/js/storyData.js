// Flat page list — each entry is exactly one tap's worth of text. A
// narrative beat spanning more than one tap is just consecutive entries
// sharing the same beatIndex/illustration; the renderer never needs to
// special-case "beat" vs "page." Progress dots count distinct
// beatIndex values, not raw page count.
//
// Each beat now has one dedicated full-span reference image (beat1.png
// through beat6.png, one per beatIndex) rather than a shared/reused
// illustration — the illustration key doubles as the texture key
// directly, no separate lookup table needed.
export const STORY_PAGES = [
  { beatIndex: 0, illustration: 'beat1', lines: ["Dr Leonard Rizz, from Earth-13, has built the Kueh Machine — a device that can preserve Singapore's iconic kuehs forever."] },
  { beatIndex: 0, illustration: 'beat1', lines: ["He invites Singapore's top chefs to bring their signature kuehs for the first scan."] },

  { beatIndex: 1, illustration: 'beat2', lines: ['The goal? Keep our kueh traditions alive — for generations to come.'] },
  { beatIndex: 1, illustration: 'beat2', lines: ['One by one, the chefs place their kuehs onto the scanner.'] },

  { beatIndex: 2, illustration: 'beat3', lines: ['Suddenly, the sky turns dark. Something strange is coming.'] },
  { beatIndex: 2, illustration: 'beat3', lines: ["The chefs exchange nervous looks. Something isn't right."] },

  { beatIndex: 3, illustration: 'beat4', lines: ['A blinding flash tears through the sky and strikes the Kueh Machine!'], effect: 'flash' },
  { beatIndex: 3, illustration: 'beat4', lines: ['Sparks fly. The scan keeps going.'] },

  { beatIndex: 4, illustration: 'beat5', lines: ['The kuehs begin to grow, twist, and transform into monsters.'] },
  { beatIndex: 4, illustration: 'beat5', lines: ["They're alive. And they're hungry."] },

  { beatIndex: 5, illustration: 'beat6', lines: ['Chaos erupts as everyone runs for their lives.'] },
  { beatIndex: 5, illustration: 'beat6', lines: ["Every kueh has turned. Reach the top floor and shut down the machine before it's too late."] },
];

export const STORY_BEAT_COUNT = new Set(STORY_PAGES.map((p) => p.beatIndex)).size;
