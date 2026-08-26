// The heart of Kara-o-kueh: common song words swapped for like-sounding
// Singapore/Malaysian words — food, but also local vernacular and
// exclamations, since "sounds like it belongs here" matters more than
// "is technically a food." The bar isn't a strict rhyme — "beehoonful"
// isn't one — but it IS a strict syllable count: the replacement has to
// have the same number of syllables as the original, landing on the
// same beat. That's the actual trick behind "beehoonful" (3 syllables,
// same as "beautiful") and "curryous" (3, same as "curious"). Padding a
// food word in as an extra syllable — "amazing" becoming a 4-syllable
// "otahmazing" — breaks the rhythm and just reads as noise. Count it out
// loud, not just read it. And the replacement has to be a real, standalone
// food or local term on its own — "fire" -> "fry" matched the syllable
// count, but "fry" alone is a cooking verb, not a named food, the same
// problem as "falling" -> "fryling" (not a real word at all). Add more
// anytime, format is: word: replacement.

export const PUN_DICTIONARY = {
  // The "kueh-" family
  crazy: "kuehzy",
  crave: "kuehve",
  create: "kuehate",
  creating: "kuehating",
  credible: "kuehdible",
  incredible: "inkuehdible",
  cake: "kueh",
  care: "kueh",
  cares: "kuehs",

  // Structural blends — same syllable count, middle sound swapped
  beautiful: "beehoonful",
  wonderful: "wantonful",
  curious: "curryous",
  going: "goreng",

  // "wanton" already carries the "to" sound the way "wanna" does — so
  // this has to be matched and replaced as a whole phrase, before the
  // standalone "want" rule below gets to it, otherwise "want to" ends up
  // as the clunky "wanton to" instead of just absorbing it.
  "want to": "wanton",
  want: "wanton",
  wanna: "wanton",

  // The "curry" family — sorry/worry/hurry are all close "-orry/-urry"
  // rhymes, and "worried" happens to land on "curried," a real word
  sorry: "curry",
  worry: "curry",
  worried: "curried",
  hurry: "curry",

  special: "sambal",
  // "satay" is 2 syllables but way/day/yeah are all 1 — that mismatch is
  // why these felt off originally. "Kueh" (often said closer to "kway")
  // is 1 syllable and actually fits. "Say" fits the same syllable count
  // but doesn't get punned — it's a verb carrying real meaning ("don't
  // say" is an instruction), so swapping it for a food noun breaks the
  // sentence into nonsense. "Yeah" is just a filler exclamation, so it
  // can become anything and still read fine.
  way: "kueh",
  ways: "kueh",
  day: "kueh",
  days: "kueh",
  yeah: "kueh",

  shock: "shiok",

  // Dim sum and hawker fare — near-homophones across the board
  one: "bun",
  guy: "gai",
  wish: "fish",
  luck: "duck",
  grab: "crab",
  drawn: "prawn",
  goodbye: "vadai",
  silly: "chilli",
  kitchen: "chicken",
  copy: "kopi",
  coffee: "kopi",

  // "I'm coming" and "ayam kambing" (chicken, mutton) share a strong
  // rhythmic echo across the whole phrase — coming/kambing especially.
  // "coming" also gets its own entry below for when it shows up without
  // "I'm" in front of it — this rule has to stay listed first so the
  // full phrase gets matched before the standalone word rule can.
  "i'm coming": "ayam kambing",
  coming: "kambing",
  "you say": "thosai",
  "you tell": "youtiao",

  // Exact homophones, not just rhymes — these cost nothing when sung
  // out loud, which makes them the best kind of pun in here.
  me: "mee",
  low: "loh",
  "i am": "ayam",
  what: "huat",
  // "hae" + "bee" spells out "hae-bee" (dried shrimp) — a real compound
  // term that also happens to be a near-perfect match for "baby"
  // (HAY-bee / BAY-bee).
  baby: "hae-bee",
};

function matchCase(source, target) {
  if (source === source.toUpperCase()) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return target[0].toUpperCase() + target.slice(1);
  }
  return target;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// \b (word boundary) is defined in terms of ASCII letters/digits, so it
// silently matches nothing at all in Japanese, Chinese, or other
// non-Latin scripts — there's no "boundary" for it to find there. Those
// scripts don't rely on spaces to separate words the way English does
// anyway, so a plain substring match is the correct behavior for them,
// not just a fallback.
function buildPattern(word) {
  const escaped = escapeRegExp(word);
  const isNonLatin = /[^\x00-\x7F]/.test(word);
  return new RegExp(isNonLatin ? escaped : `\\b${escaped}\\b`, "gi");
}

// Wrapping each replacement in a pair of Unicode private-use characters
// (never used by any real text, so they can't collide with actual lyrics)
// lets the UI later find exactly which words got swapped, without needing
// to separately track positions through every regex pass. A marked span
// is inert to every later pass too, since a dictionary key only ever
// matches original English words, never text a previous pass replaced.
const MARK_START = "";
const MARK_END = "";
const MARK_PATTERN = new RegExp(`${MARK_START}(.*?)${MARK_END}`, "g");

// No caps, no rarity gating — every match gets punned, every time it
// appears. A line that repeats a phrase on purpose ("who cares, baby...")
// should come out punned the same way each time, not fade out partway
// through the song.
function punifyLine(line, overrides) {
  let result = line;

  // Song-specific corrections go first — deliberate, hand-picked fixes
  // for one particular song, layered on top of the general dictionary.
  for (const [word, replacement] of Object.entries(overrides)) {
    result = result.replace(
      buildPattern(word),
      (match) => `${MARK_START}${matchCase(match, replacement)}${MARK_END}`
    );
  }

  for (const [word, replacement] of Object.entries(PUN_DICTIONARY)) {
    if (word in overrides) continue;
    result = result.replace(
      buildPattern(word),
      (match) => `${MARK_START}${matchCase(match, replacement)}${MARK_END}`
    );
  }
  return result;
}

// Splits a marked-up line into plain-text and pun segments, so the UI can
// style just the words that actually got swapped without needing to
// re-derive which ones those were.
function splitIntoSegments(marked) {
  const segments = [];
  let lastIndex = 0;
  for (const match of marked.matchAll(MARK_PATTERN)) {
    if (match.index > lastIndex) segments.push({ text: marked.slice(lastIndex, match.index), isPun: false });
    segments.push({ text: match[1], isPun: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < marked.length) segments.push({ text: marked.slice(lastIndex), isPun: false });
  return segments;
}

export function punifySong(lines, overrides = {}) {
  return lines.map((line) => {
    const marked = punifyLine(line.original, overrides);
    return {
      ...line,
      text: marked.replace(MARK_PATTERN, "$1"),
      segments: splitIntoSegments(marked),
    };
  });
}
