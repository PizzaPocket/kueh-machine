import { searchVideos, createPlayer, PlayerState } from "./youtube.js";
import { findLyricsCandidates, buildLyricsFromCandidate, guessArtistFromTitle, cleanChannelName } from "./lyrics.js";
import {
  getCollections,
  saveSongToCollection,
  removeSongFromCollection,
  deleteCollection,
  saveToRecentlyPlayed,
} from "./collections.js";
import { blockLyrics } from "./blocklist.js";
import { getOverridesForSong, setOverrideForSong } from "./songOverrides.js";
import { punifySong } from "./puns.js";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchStatus = document.getElementById("search-status");
const searchResultsEl = document.getElementById("search-results");
const lyricsPickerEl = document.getElementById("lyrics-picker");
const lyricsPickerOptionsEl = document.getElementById("lyrics-picker-options");
const nowPlayingEl = document.getElementById("now-playing");
const nowPlayingLabel = document.getElementById("now-playing-label");
const lyricsIntroStatus = document.getElementById("lyrics-intro-status");
const lyricsDisplay = document.getElementById("lyrics-display");
const queueListEl = document.getElementById("queue-list");
const queueCountEl = document.getElementById("queue-count");
const emptyQueueEl = document.getElementById("empty-queue");
const skipSongBtn = document.getElementById("skip-song-btn");
const saveSongBtn = document.getElementById("save-song-btn");
const reportLyricsBtn = document.getElementById("report-lyrics-btn");
const savePickerEl = document.getElementById("save-picker");
const savePickerExistingEl = document.getElementById("save-picker-existing");
const savePickerForm = document.getElementById("save-picker-form");
const savePickerInput = document.getElementById("save-picker-input");
const fixWordBtn = document.getElementById("fix-word-btn");
const fixWordPickerEl = document.getElementById("fix-word-picker");
const fixWordForm = document.getElementById("fix-word-form");
const fixWordOriginalInput = document.getElementById("fix-word-original");
const fixWordReplacementInput = document.getElementById("fix-word-replacement");
const collectionsListEl = document.getElementById("collections-list");
const collectionsCountEl = document.getElementById("collections-count");
const emptyCollectionsEl = document.getElementById("empty-collections");

const state = {
  queue: [],
  current: null,
  player: null,
  pollHandle: null,
  scrollPausedUntil: 0,
};

// If someone's actively scrolling the lyrics box themselves, don't fight
// them — pause auto-scroll for a few seconds after any manual scroll
// gesture.
["wheel", "touchstart", "pointerdown"].forEach((eventName) => {
  lyricsDisplay.addEventListener(eventName, () => {
    state.scrollPausedUntil = Date.now() + 4000;
  });
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  // Starting a new search means abandoning whatever the previous one was
  // in the middle of — without this, the lyrics picker from the last
  // search just sits there while new results load in hidden underneath
  // it, making the search bar look dead.
  lyricsPickerEl.hidden = true;
  lyricsPickerOptionsEl.innerHTML = "";
  searchResultsEl.hidden = false;
  searchStatus.textContent = "searching...";
  searchResultsEl.innerHTML = "";

  try {
    const results = await searchVideos(query);
    if (results.length === 0) {
      searchStatus.textContent = "no results — try a different title";
      return;
    }
    searchStatus.textContent = "";
    renderSearchResults(results, query);
  } catch (error) {
    searchStatus.textContent = error.message;
  }
});

function renderSearchResults(results, originalQuery) {
  searchResultsEl.innerHTML = "";
  results.forEach((result) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "result-card";
    card.innerHTML = `
      <img src="${result.thumbnail}" alt="" />
      <span class="result-title">${escapeHtml(result.title)}${result.syncFriendly ? '<span class="sync-friendly-badge">🎤 best for karaoke</span>' : ""}</span>
      <span class="result-channel">${escapeHtml(result.channel)}</span>
    `;
    card.addEventListener("click", () => chooseVideo(result, originalQuery));
    searchResultsEl.appendChild(card);
  });
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
}

async function chooseVideo(video, originalQuery) {
  searchResultsEl.hidden = true;
  lyricsPickerEl.hidden = false;
  lyricsPickerOptionsEl.innerHTML = `<p class="lyrics-status">looking for lyrics...</p>`;

  const artistHint = guessArtistFromTitle(video.title) ?? cleanChannelName(video.channel);
  const candidates = await findLyricsCandidates(originalQuery, artistHint, video.durationSeconds).catch(() => []);

  renderLyricsPicker(candidates, video, originalQuery);
}

function renderLyricsPicker(candidates, video, originalQuery) {
  lyricsPickerOptionsEl.innerHTML = "";

  candidates.forEach((candidate, index) => {
    const row = document.createElement("div");
    row.className = "lyrics-option-row";
    row.innerHTML = `
      <button type="button" class="lyrics-option${index === 0 ? " is-best" : ""}">
        <span class="lyrics-option-text">
          <span class="lyrics-option-track">${escapeHtml(candidate.trackName)}${index === 0 ? '<span class="lyrics-option-best-badge">closest match</span>' : ""}</span>
          <span class="lyrics-option-artist">${escapeHtml(candidate.artistName)}</span>
          ${candidate.preview ? `<span class="lyrics-option-preview">"${escapeHtml(candidate.preview)}"</span>` : ""}
        </span>
        <span class="lyrics-option-duration">${formatDuration(candidate.duration)}</span>
      </button>
      <button type="button" class="lyrics-option-reject" title="wrong lyrics — don't suggest this again">🚫</button>
    `;
    row.querySelector(".lyrics-option").addEventListener("click", () =>
      finalizeAddToQueue(
        video,
        buildLyricsFromCandidate(candidate, getOverridesForSong(candidate.id)),
        candidate.id
      )
    );
    row.querySelector(".lyrics-option-reject").addEventListener("click", () => {
      blockLyrics(candidate.id);
      renderLyricsPicker(candidates.filter((c) => c.id !== candidate.id), video, originalQuery);
    });
    lyricsPickerOptionsEl.appendChild(row);
  });

  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "lyrics-option lyrics-option-skip";
  skip.textContent = candidates.length
    ? "none of these — play without synced lyrics"
    : "no lyrics found — play without synced lyrics";
  skip.addEventListener("click", () => finalizeAddToQueue(video, [], null));
  lyricsPickerOptionsEl.appendChild(skip);
}

function enqueueSong(song) {
  state.queue.push(song);
  renderQueue();
  if (!state.current) {
    playNext();
  }
}

function finalizeAddToQueue(video, lines, lyricsCandidateId) {
  enqueueSong({
    videoId: video.videoId,
    title: video.title,
    channel: video.channel,
    thumbnail: video.thumbnail,
    lines,
    lyricsStatus: lines.length > 0 ? "ok" : "missing",
    offset: 0,
    lyricsCandidateId: lyricsCandidateId ?? null,
  });

  searchInput.value = "";
  searchResultsEl.hidden = false;
  searchResultsEl.innerHTML = "";
  lyricsPickerEl.hidden = true;
  lyricsPickerOptionsEl.innerHTML = "";
  searchStatus.textContent = `added "${video.title}" to the queue`;
}

// Songs added from a saved collection carry their own lyrics and sync
// offset from last time — no re-searching or re-matching needed, since
// that was already verified when it was saved.
function addSavedSongToQueue(saved) {
  enqueueSong({
    videoId: saved.videoId,
    title: saved.title,
    channel: saved.channel,
    thumbnail: saved.thumbnail,
    lines: saved.lines,
    lyricsStatus: saved.lines?.length > 0 ? "ok" : "missing",
    offset: saved.offset ?? 0,
    lyricsCandidateId: saved.lyricsCandidateId ?? null,
  });
  searchStatus.textContent = `added "${saved.title}" to the queue`;
}

function renderQueue() {
  // state.queue includes whatever is currently playing (it's only
  // dropped once it ends) — but "Up Next" should only ever show what
  // hasn't played yet.
  const upcoming = state.queue.filter((song) => song !== state.current);
  queueCountEl.textContent = String(upcoming.length);
  emptyQueueEl.hidden = upcoming.length > 0;
  queueListEl.innerHTML = "";
  upcoming.forEach((song) => {
    const item = document.createElement("li");
    item.className = "queue-item";
    item.innerHTML = `
      <button type="button" class="queue-item-play" title="play this now">
        <img src="${song.thumbnail}" alt="" />
        <div>
          <span class="queue-title">${escapeHtml(song.title)}</span>
          <span class="queue-channel">${escapeHtml(song.channel)}</span>
        </div>
      </button>
    `;
    item.querySelector(".queue-item-play").addEventListener("click", () => playFromQueue(song));
    queueListEl.appendChild(item);
  });
}

// Clicking a queued song means "play this right now," not "wait your
// turn" — drop whatever's currently playing and jump straight to it,
// keeping everything else in the queue in the same relative order.
function playFromQueue(song) {
  if (song === state.current) return;
  state.queue = state.queue.filter((s) => s !== state.current);
  state.queue = [song, ...state.queue.filter((s) => s !== song)];
  playNext();
}

function playNext() {
  const upcoming = state.queue.find((song) => song !== state.current);
  if (!upcoming) {
    state.current = null;
    nowPlayingEl.hidden = true;
    if (state.pollHandle) clearInterval(state.pollHandle);
    // Without this, the player keeps playing (audio and all) behind the
    // now-hidden panel once the queue runs out.
    if (state.player && typeof state.player.stopVideo === "function") {
      state.player.stopVideo();
    }
    renderQueue();
    return;
  }

  state.current = upcoming;
  nowPlayingEl.hidden = false;
  nowPlayingLabel.textContent = `${upcoming.title} — ${upcoming.channel}`;
  savePickerEl.hidden = true;
  fixWordPickerEl.hidden = true;
  fixWordBtn.hidden = !upcoming.lyricsCandidateId;
  reportLyricsBtn.hidden = !upcoming.lyricsCandidateId;
  reportLyricsBtn.textContent = "🚫 lyrics don't match — report";
  reportLyricsBtn.disabled = false;
  renderQueue();
  renderLyricsList(upcoming);
  updateLyricsHighlight(upcoming, -1);

  if (state.player) {
    state.player.loadVideoById(upcoming.videoId);
  } else {
    createPlayer("yt-player", upcoming.videoId, {
      onReady: () => {},
      onStateChange: handlePlayerStateChange,
    }).then((player) => {
      state.player = player;
    });
  }

  startPolling();
}

function handlePlayerStateChange(event) {
  if (event.data === PlayerState.ENDED) {
    // Playing all the way through (as opposed to being skipped) is a
    // decent signal it was enjoyed — worth remembering automatically.
    if (state.current) {
      saveToRecentlyPlayed({
        videoId: state.current.videoId,
        title: state.current.title,
        channel: state.current.channel,
        thumbnail: state.current.thumbnail,
        lines: state.current.lines,
        offset: state.current.offset,
        lyricsCandidateId: state.current.lyricsCandidateId,
      });
      renderCollections();
    }
    state.queue = state.queue.filter((song) => song !== state.current);
    playNext();
  }
}

function skipCurrentSong() {
  if (!state.current) return;
  state.queue = state.queue.filter((song) => song !== state.current);
  playNext();
}

skipSongBtn.addEventListener("click", skipCurrentSong);

function updateNowPlayingLyrics() {
  if (!state.player || !state.current || typeof state.player.getCurrentTime !== "function") return;
  const time = state.player.getCurrentTime() - state.current.offset;
  const lines = state.current.lines;
  if (!lines || lines.length === 0) return;

  let index = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].time <= time) index = i;
    else break;
  }
  updateLyricsHighlight(state.current, index);
}

function startPolling() {
  if (state.pollHandle) clearInterval(state.pollHandle);
  state.pollHandle = setInterval(updateNowPlayingLyrics, 200);
}

function resyncToLine(song, line) {
  if (song !== state.current || !state.player || typeof state.player.getCurrentTime !== "function") return;
  state.current.offset = state.player.getCurrentTime() - line.time;
  updateNowPlayingLyrics();
}

// Builds the lyric line elements once per song, not once per poll tick.
// Rebuilding on every 200ms tick was tearing down and recreating every
// element constantly, which meant a tap could land mid-rebuild and never
// register as a click at all.
function renderLyricsList(song) {
  lyricsIntroStatus.hidden = true;
  lyricsDisplay.innerHTML = "";

  if (song.lyricsStatus === "missing" || !song.lines || song.lines.length === 0) {
    lyricsDisplay.innerHTML = `<p class="lyrics-status">couldn't find synced lyrics for this one — sing from memory!</p>`;
    return;
  }

  song.lines.forEach((line) => {
    const p = document.createElement("p");
    p.className = "lyric-line";
    const segments = line.segments ?? [{ text: line.text, isPun: false }];
    segments.forEach((segment) => {
      if (segment.isPun) {
        const span = document.createElement("span");
        span.className = "pun-word";
        span.textContent = segment.text;
        p.appendChild(span);
      } else {
        p.appendChild(document.createTextNode(segment.text));
      }
    });
    // Tapping a line re-syncs on the spot — this is what actually keeps
    // things on track when two recordings run at slightly different
    // tempos, since a single fixed offset can't correct a drift that
    // keeps growing over the length of the song.
    p.addEventListener("click", () => resyncToLine(song, line));
    lyricsDisplay.appendChild(p);
  });
}

// Called on every poll tick — just toggles which line is highlighted and
// scrolls it into view, without touching the DOM elements themselves.
function updateLyricsHighlight(song, currentIndex) {
  if (song.lyricsStatus === "missing" || !song.lines || song.lines.length === 0) return;

  lyricsIntroStatus.hidden = !(currentIndex === -1 && song.lines[0]?.time > 3);

  const children = lyricsDisplay.children;
  for (let i = 0; i < children.length; i += 1) {
    children[i].classList.toggle("is-current", i === currentIndex);
    children[i].classList.toggle("is-near", i === currentIndex - 1 || i === currentIndex + 1);
  }

  const currentEl = children[currentIndex];
  if (currentEl && Date.now() > state.scrollPausedUntil) {
    // Scroll only the lyrics box itself, not the whole page — scrollIntoView
    // walks up through every scrollable ancestor including the document,
    // which was fighting anyone trying to scroll the page to the top.
    const target = currentEl.offsetTop - lyricsDisplay.clientHeight / 2 + currentEl.clientHeight / 2;
    lyricsDisplay.scrollTo({ top: target, behavior: "smooth" });
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

saveSongBtn.addEventListener("click", () => {
  if (!state.current) return;
  savePickerEl.hidden = !savePickerEl.hidden;
  fixWordPickerEl.hidden = true;
  if (!savePickerEl.hidden) renderSavePickerOptions();
});

reportLyricsBtn.addEventListener("click", () => {
  if (!state.current?.lyricsCandidateId) return;
  blockLyrics(state.current.lyricsCandidateId);
  reportLyricsBtn.textContent = "🚫 reported — won't suggest this again";
  reportLyricsBtn.disabled = true;
});

fixWordBtn.addEventListener("click", () => {
  if (!state.current?.lyricsCandidateId) return;
  fixWordPickerEl.hidden = !fixWordPickerEl.hidden;
  savePickerEl.hidden = true;
  if (!fixWordPickerEl.hidden) fixWordOriginalInput.focus();
});

fixWordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const original = fixWordOriginalInput.value.trim();
  const replacement = fixWordReplacementInput.value.trim();
  if (!original || !replacement || !state.current?.lyricsCandidateId) return;

  setOverrideForSong(state.current.lyricsCandidateId, original, replacement);
  reapplyOverridesToCurrentSong();

  fixWordOriginalInput.value = "";
  fixWordReplacementInput.value = "";
  searchStatus.textContent = `"${original}" → "${replacement}" applied for this song`;
});

// Re-punifies the currently playing song from its original (un-punned)
// text, picking up any override just added, without needing to re-fetch
// anything from lrclib — the raw text is already sitting in .original.
function reapplyOverridesToCurrentSong() {
  if (!state.current?.lines) return;
  const overrides = getOverridesForSong(state.current.lyricsCandidateId);
  const rawLines = state.current.lines.map((line) => ({ time: line.time, original: line.original }));
  state.current.lines = punifySong(rawLines, overrides);
  renderLyricsList(state.current);
  updateNowPlayingLyrics();
}

function renderSavePickerOptions() {
  savePickerExistingEl.innerHTML = "";
  Object.keys(getCollections()).forEach((name) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "save-picker-pill";
    pill.textContent = name;
    pill.addEventListener("click", () => handleSaveToCollection(name));
    savePickerExistingEl.appendChild(pill);
  });
}

savePickerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = savePickerInput.value.trim();
  if (!name) return;
  handleSaveToCollection(name);
  savePickerInput.value = "";
});

function handleSaveToCollection(collectionName) {
  if (!state.current) return;
  saveSongToCollection(collectionName, {
    videoId: state.current.videoId,
    title: state.current.title,
    channel: state.current.channel,
    thumbnail: state.current.thumbnail,
    lines: state.current.lines,
    offset: state.current.offset,
    lyricsCandidateId: state.current.lyricsCandidateId,
  });
  savePickerEl.hidden = true;
  searchStatus.textContent = `saved "${state.current.title}" to "${collectionName}"`;
  renderCollections();
}

function renderCollections() {
  const collections = getCollections();
  const names = Object.keys(collections);
  const totalSongs = names.reduce((sum, name) => sum + collections[name].length, 0);

  collectionsCountEl.textContent = String(totalSongs);
  emptyCollectionsEl.hidden = totalSongs > 0;
  collectionsListEl.innerHTML = "";

  names.forEach((name) => {
    const group = document.createElement("div");
    group.className = "collection-group";
    group.innerHTML = `
      <div class="collection-header">
        <span class="collection-name">${escapeHtml(name)}</span>
        <button type="button" class="collection-delete" aria-label="Delete collection ${escapeHtml(name)}">delete</button>
      </div>
      <div class="collection-songs"></div>
    `;

    const songsEl = group.querySelector(".collection-songs");
    collections[name].forEach((song) => {
      const chip = document.createElement("div");
      chip.className = "collection-song-chip";
      chip.innerHTML = `
        <button type="button" class="collection-song-play">
          <img src="${song.thumbnail}" alt="" />
          <span>${escapeHtml(song.title)}</span>
        </button>
        <button type="button" class="collection-song-remove" aria-label="Remove ${escapeHtml(song.title)}">×</button>
      `;
      chip.querySelector(".collection-song-play").addEventListener("click", () => addSavedSongToQueue(song));
      chip.querySelector(".collection-song-remove").addEventListener("click", () => {
        if (!confirm(`Remove "${song.title}" from "${name}"?`)) return;
        removeSongFromCollection(name, song.videoId);
        renderCollections();
      });
      songsEl.appendChild(chip);
    });

    group.querySelector(".collection-delete").addEventListener("click", () => {
      const count = collections[name].length;
      const songWord = count === 1 ? "song" : "songs";
      if (!confirm(`Delete the whole "${name}" collection? This removes ${count} ${songWord} and can't be undone.`)) return;
      deleteCollection(name);
      renderCollections();
    });

    collectionsListEl.appendChild(group);
  });
}

// Merge each bundled seed once. The previous all-or-nothing check meant an
// unrelated saved preference could prevent the starter songs from appearing.
async function seedFromBundle() {
  const seedVersionKey = "karaokueh-seed-version";
  const seedVersion = "1";
  if (localStorage.getItem(seedVersionKey) === seedVersion) return;
  try {
    const response = await fetch("./seed-data.json");
    if (!response.ok) return;
    const bundle = await response.json();

    const savedCollections = JSON.parse(localStorage.getItem("karaokueh-collections") || "{}");
    Object.entries(bundle.collections || {}).forEach(([name, seedSongs]) => {
      const savedSongs = savedCollections[name] || [];
      const savedIds = new Set(savedSongs.map((song) => song.videoId));
      savedCollections[name] = [...savedSongs, ...seedSongs.filter((song) => !savedIds.has(song.videoId))];
    });
    localStorage.setItem("karaokueh-collections", JSON.stringify(savedCollections));

    const savedBlocked = JSON.parse(localStorage.getItem("karaokueh-blocked-lyrics") || "[]");
    localStorage.setItem(
      "karaokueh-blocked-lyrics",
      JSON.stringify([...new Set([...(bundle.blockedLyrics || []), ...savedBlocked])])
    );

    const savedOverrides = JSON.parse(localStorage.getItem("karaokueh-song-overrides") || "{}");
    const mergedOverrides = { ...(bundle.songOverrides || {}) };
    Object.entries(savedOverrides).forEach(([songId, overrides]) => {
      mergedOverrides[songId] = { ...(mergedOverrides[songId] || {}), ...overrides };
    });
    localStorage.setItem("karaokueh-song-overrides", JSON.stringify(mergedOverrides));
    localStorage.setItem(seedVersionKey, seedVersion);
  } catch {
    // Preserve the user's current local data if storage or the seed is unavailable.
  }
}

await seedFromBundle();
renderCollections();
