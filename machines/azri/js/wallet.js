// Coin balance + character ownership, following the exact same
// local-is-authoritative pattern as progress.js's high score. Coins are a
// spendable balance rather than a monotonic high score though, so remote
// data is only ever adopted once — as a one-time restore for a brand-new
// local install with a signed-in account already holding progress —
// rather than continuously merged, which would risk double-spend-style
// weirdness if two devices' local balances ever disagreed.

import { fetchRemoteData, pushRemoteData } from './progress.js';

const COINS_KEY = 'kueh-hdb-panic-coins';
const OWNED_KEY = 'kueh-hdb-panic-owned-characters';
const SELECTED_KEY = 'kueh-hdb-panic-selected-character';
const DEFAULT_OWNED = ['leonard'];
const DEFAULT_SELECTED = 'leonard';

function peekCoins() {
  const v = parseInt(localStorage.getItem(COINS_KEY) || '0', 10);
  return Number.isFinite(v) ? v : 0;
}

function saveCoins(n) {
  try {
    localStorage.setItem(COINS_KEY, String(n));
  } catch (_) {
    // Storage disabled/full — coins won't persist across reloads.
  }
}

function peekOwned() {
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    if (!raw) return [...DEFAULT_OWNED];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.includes('leonard') ? parsed : [...DEFAULT_OWNED];
  } catch (_) {
    return [...DEFAULT_OWNED];
  }
}

function saveOwned(list) {
  try {
    localStorage.setItem(OWNED_KEY, JSON.stringify(list));
  } catch (_) {
    // Storage disabled/full — unlocks won't persist across reloads.
  }
}

function peekSelected() {
  return localStorage.getItem(SELECTED_KEY) || DEFAULT_SELECTED;
}

function saveSelected(id) {
  try {
    localStorage.setItem(SELECTED_KEY, id);
  } catch (_) {
    // Storage disabled/full — selection won't persist across reloads.
  }
}

export function getLocalCoinsSync() {
  return peekCoins();
}

export function getOwnedCharactersSync() {
  return peekOwned();
}

export function getSelectedCharacterSync() {
  return peekSelected();
}

export function addCoins(amount) {
  const total = peekCoins() + amount;
  saveCoins(total);
  pushRemoteData({ coins: total });
  return total;
}

export function setSelectedCharacter(id) {
  saveSelected(id);
  pushRemoteData({ selected_character: id });
}

// Returns true if the unlock succeeded (enough coins), false otherwise —
// callers should give "not enough coins" feedback on a false return
// rather than this throwing or silently doing nothing.
export function tryUnlockCharacter(id, price) {
  const coins = peekCoins();
  if (coins < price) return false;

  const remaining = coins - price;
  saveCoins(remaining);

  const owned = peekOwned();
  if (!owned.includes(id)) owned.push(id);
  saveOwned(owned);
  saveSelected(id);

  pushRemoteData({ coins: remaining, unlocked_characters: owned, selected_character: id });
  return true;
}

// Called once (from PreloadScene) — if this browser has never recorded
// any wallet state at all (a fresh install/new device) and the player is
// signed in with existing remote progress, adopt it as the local
// starting point. A no-op for any player who already has local wallet
// state, so it never overwrites an in-progress local balance.
export async function restoreWalletFromRemoteIfFirstLoad() {
  // The presence of a saved coin balance is itself the "already has
  // local wallet state" signal — no separate flag needed, and this stays
  // correctly idempotent (safe to call on every load) since it only ever
  // reads, never writes, once that key exists.
  if (localStorage.getItem(COINS_KEY) != null) return;

  const remote = await fetchRemoteData();
  if (!remote) return;
  if (typeof remote.coins === 'number') saveCoins(remote.coins);
  if (Array.isArray(remote.unlocked_characters)) {
    const merged = Array.from(new Set([...DEFAULT_OWNED, ...remote.unlocked_characters]));
    saveOwned(merged);
  }
  if (typeof remote.selected_character === 'string') saveSelected(remote.selected_character);
}
