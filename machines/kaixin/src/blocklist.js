// lrclib is a crowd-sourced database and sometimes an entry is flat-out
// mislabeled — correct track/artist name, wrong lyrics underneath, no way
// to detect that automatically from metadata alone. Once a person catches
// one, this remembers it so it's never suggested again, on any search.

const STORAGE_KEY = "karaokueh-blocked-lyrics";

function readBlockedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeBlockedIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function isBlocked(lyricsId) {
  return readBlockedIds().has(lyricsId);
}

export function blockLyrics(lyricsId) {
  const ids = readBlockedIds();
  ids.add(lyricsId);
  writeBlockedIds(ids);
}

export function getAllBlockedIds() {
  return [...readBlockedIds()];
}
