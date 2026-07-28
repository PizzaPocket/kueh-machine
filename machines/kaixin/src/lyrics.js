// Time-synced lyrics from lrclib.net — free, no API key required.
import { punifySong } from "./puns.js";
import { isBlocked } from "./blocklist.js";

const TIME_TAG = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

function parseLRC(lrcText) {
  const lines = [];
  for (const rawLine of lrcText.split("\n")) {
    const matches = [...rawLine.matchAll(TIME_TAG)];
    if (matches.length === 0) continue;
    const text = rawLine.replace(TIME_TAG, "").trim();
    if (!text) continue;
    for (const match of matches) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = Number(match[3].padEnd(3, "0")) / 1000;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

function normalize(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Scores how likely a candidate result is the song the person actually
// searched for, so "Crazy for You" doesn't get confused with "Beautiful
// Crazy" just because both results mention "crazy" somewhere.
function scoreMatch(candidate, query, artistHint, durationHint) {
  const track = normalize(candidate.trackName);
  const q = normalize(query);
  let score = 0;

  if (track === q) score += 100;
  else if (track.includes(q) || q.includes(track)) score += 60;
  else {
    const queryWords = new Set(q.split(/\s+/).filter(Boolean));
    const trackWords = track.split(/\s+/).filter(Boolean);
    const overlap = trackWords.filter((word) => queryWords.has(word)).length;
    const overlapRatio = queryWords.size ? overlap / queryWords.size : 0;
    score += overlapRatio * 50;
  }

  if (artistHint) {
    const artist = normalize(candidate.artistName);
    const hint = normalize(artistHint);
    if (artist && hint && (artist.includes(hint) || hint.includes(artist))) {
      score += 70;
    }
  }

  // The strongest signal of all: a candidate whose runtime matches the
  // video we're actually playing is almost certainly the same
  // recording, which means it'll stay in sync for the whole song
  // instead of just at the point we happened to nudge it to.
  if (durationHint && candidate.duration) {
    const diff = Math.abs(candidate.duration - durationHint);
    if (diff <= 2) score += 120;
    else if (diff <= 5) score += 60;
    else if (diff <= 10) score += 15;
    else score -= 30;
  }

  return score;
}

// Official YouTube uploads are almost always titled "Artist - Track", so
// pulling the artist out of the video title is a much stronger signal
// than the channel name (which is often a generic aggregator channel).
export function guessArtistFromTitle(rawTitle) {
  const cleaned = rawTitle
    .replace(/[([][^)\]]*(official|lyrics?|audio|video|hd|4k)[^)\]]*[)\]]/gi, "")
    .trim();

  for (const separator of [" - ", " – ", " — ", " | "]) {
    if (cleaned.includes(separator)) {
      return cleaned.split(separator)[0].trim();
    }
  }
  return null;
}

// "Topic" channels are auto-generated per-artist by YouTube and named
// literally "<Artist> - Topic" — strip that suffix so it's usable as an
// artist name for matching instead of a literal string nothing matches.
export function cleanChannelName(channel) {
  return channel.replace(/\s*-\s*topic$/i, "").trim();
}

async function searchLrclib(params) {
  const url = new URL("https://lrclib.net/api/search");
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const response = await fetch(url);
  if (!response.ok) return [];
  return response.json();
}

// Returns the top lyric candidates for a search, best guess first, so the
// person searching can confirm the right one rather than the app quietly
// guessing. lrclib is a crowd-sourced database — sometimes mislabeled —
// so a human picking beats a scoring formula picking blind.
//
// lrclib's free-text `q` search and its precise `track_name`/`artist_name`
// search don't always return the same results — the precise search finds
// records the free-text one misses — so we try precise first (when we
// have an artist guess) and fall back to free text.
export async function findLyricsCandidates(query, artistHint, durationHint) {
  let results = [];
  if (artistHint) {
    results = await searchLrclib({ track_name: query, artist_name: artistHint });
  }
  if (results.filter((r) => r.syncedLyrics).length === 0) {
    results = await searchLrclib({ q: query });
  }

  const candidates = results.filter((result) => result.syncedLyrics && !isBlocked(result.id));

  const scored = candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreMatch(candidate, query, artistHint, durationHint),
      preview: firstLyricLines(candidate),
    }))
    .sort((a, b) => b.score - a.score);

  // Crowd-submitted duplicates often share the exact same lyrics text
  // (sometimes exactly wrong text) under different ids — without this,
  // the same mislabeled entry can fill multiple slots and crowd out
  // whatever's genuinely different, including the correct one.
  const seenContent = new Set();
  const deduped = [];
  for (const candidate of scored) {
    const signature = normalize(candidate.plainLyrics?.slice(0, 200));
    if (seenContent.has(signature)) continue;
    seenContent.add(signature);
    deduped.push(candidate);
  }

  return deduped.slice(0, 4);
}

// A couple of real opening lines is often the fastest way to catch a
// mislabeled entry — a title and artist can say "Kit Chan - Home" while
// the actual lyrics underneath are somebody else's song entirely, and
// no amount of metadata matching can catch that. Seeing the words does.
function firstLyricLines(candidate) {
  const source = candidate.plainLyrics || "";
  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.slice(0, 2).join(" / ");
}

export function buildLyricsFromCandidate(candidate, overrides = {}) {
  const rawLines = parseLRC(candidate.syncedLyrics).map((line) => ({
    time: line.time,
    original: line.text,
  }));
  return punifySong(rawLines, overrides);
}
