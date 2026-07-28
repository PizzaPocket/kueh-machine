// Sometimes a pun that's fine in general doesn't work for one specific
// song — or a song has its own ad-libs and quirks worth a custom joke
// that wouldn't make sense applied everywhere else. These are corrections
// scoped to a single lyrics entry (by its lrclib id), layered on top of
// the global dictionary rather than replacing it.

const STORAGE_KEY = "karaokueh-song-overrides";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getOverridesForSong(lyricsCandidateId) {
  if (!lyricsCandidateId) return {};
  const store = readStore();
  return store[lyricsCandidateId] ?? {};
}

export function setOverrideForSong(lyricsCandidateId, word, replacement) {
  if (!lyricsCandidateId) return;
  const store = readStore();
  const songOverrides = store[lyricsCandidateId] ?? {};
  songOverrides[word.trim().toLowerCase()] = replacement.trim();
  store[lyricsCandidateId] = songOverrides;
  writeStore(store);
}

export function getAllOverrides() {
  return readStore();
}
