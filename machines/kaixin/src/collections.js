// Saved "ready to sing" playlists — songs the host has already tried and
// confirmed work well (right lyrics match, good sync), organized into
// named collections like "90s Baby" or "So 2020" so people with no ideas
// can pick from a list instead of searching. Lives in the browser via
// localStorage, since this is a one-host, one-device party tool.

const STORAGE_KEY = "karaokueh-collections";

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

export function getCollections() {
  return readStore();
}

export function saveSongToCollection(collectionName, song) {
  const name = collectionName.trim();
  if (!name) return;

  const store = readStore();
  const existing = store[name] ?? [];
  store[name] = [...existing.filter((s) => s.videoId !== song.videoId), song];
  writeStore(store);
}

// A song that plays all the way through to the end is a decent signal
// it was enjoyed (a skip means the opposite) — so it's worth being able
// to find again without having to remember to hit save mid-party. This
// is just a normal collection that fills itself automatically, capped
// so it doesn't grow forever over a long night.
export const RECENTLY_PLAYED = "Recently Played";
const RECENTLY_PLAYED_LIMIT = 15;

export function saveToRecentlyPlayed(song) {
  saveSongToCollection(RECENTLY_PLAYED, song);
  const store = readStore();
  const list = store[RECENTLY_PLAYED] ?? [];
  if (list.length > RECENTLY_PLAYED_LIMIT) {
    store[RECENTLY_PLAYED] = list.slice(list.length - RECENTLY_PLAYED_LIMIT);
    writeStore(store);
  }
}

export function removeSongFromCollection(collectionName, videoId) {
  const store = readStore();
  if (!store[collectionName]) return;

  store[collectionName] = store[collectionName].filter((song) => song.videoId !== videoId);
  if (store[collectionName].length === 0) delete store[collectionName];
  writeStore(store);
}

export function deleteCollection(collectionName) {
  const store = readStore();
  delete store[collectionName];
  writeStore(store);
}
