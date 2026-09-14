// Score/wallet persistence through the shared kuehmachine.com account
// system (see DATABASE.md / window.KuehAccount from account-widget.js).
// Every call here is best-effort: a signed-out player, a missing table
// (before Leonard runs database.sql), or a network hiccup should never
// block or break gameplay — localStorage is always the source of truth
// that the game itself reads from; Supabase is a sync layer on top.

// Named/keyed for time (ms), not the old rows-crossed score — a clean
// break rather than reusing the old key, so a leftover integer from
// before this rename can never get misread as a millisecond time.
const LOCAL_KEY = 'kueh-hdb-panic-best-time-ms';
const TABLE = 'kueh_hdb_panic_progress';

function peekLocalBestTime() {
  const v = parseInt(localStorage.getItem(LOCAL_KEY) || '0', 10);
  return Number.isFinite(v) ? v : 0;
}

function saveLocalBestTime(timeMs) {
  try {
    localStorage.setItem(LOCAL_KEY, String(timeMs));
  } catch (_) {
    // Storage disabled/full — local best just won't persist across reloads.
  }
}

// Generic read of the whole per-user data blob — exported so other
// modules (js/wallet.js) can share the same remote round-trip instead of
// each rolling their own client/table lookup.
export async function fetchRemoteData() {
  try {
    if (!window.KuehAccount) return null;
    await window.KuehAccount.ready;
    const user = window.KuehAccount.getUser();
    if (!user) return null;
    const client = window.KuehAccount.getClient();
    if (!client) return null;

    const { data, error } = await client
      .from(TABLE)
      .select('data')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[progress] remote fetch failed:', error.message);
      return null;
    }
    return data?.data ?? null;
  } catch (err) {
    console.warn('[progress] remote fetch failed:', err);
    return null;
  }
}

// Generic write that MERGES `partial` into whatever's already in the
// remote blob rather than replacing it outright — the `data` column
// holds every field this project persists (high_score, coins,
// unlocked_characters, selected_character, ...) in one row per user, so
// a naive overwrite here would silently erase whichever of those fields
// the caller didn't happen to pass.
export async function pushRemoteData(partial) {
  try {
    if (!window.KuehAccount) return;
    await window.KuehAccount.ready;
    const user = window.KuehAccount.getUser();
    if (!user) return;
    const client = window.KuehAccount.getClient();
    if (!client) return;

    const existing = (await fetchRemoteData()) || {};
    const merged = { ...existing, ...partial };

    const { error } = await client.from(TABLE).upsert({
      user_id: user.id,
      data: merged,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[progress] remote save failed, kept locally only:', error.message);
  } catch (err) {
    console.warn('[progress] remote save failed, kept locally only:', err);
  }
}

export function isSignedIn() {
  return !!(window.KuehAccount && window.KuehAccount.getUser());
}

export function getLocalBestTimeSync() {
  return peekLocalBestTime();
}

export async function getBestTime() {
  const local = peekLocalBestTime();
  const remote = await fetchRemoteData();
  const remoteBest = remote?.best_time_ms ?? null;
  // 0 means "no time recorded yet" locally — a real remote best always wins
  // in that case regardless of its value.
  if (remoteBest != null && (local === 0 || remoteBest < local)) {
    saveLocalBestTime(remoteBest);
    return remoteBest;
  }
  return local;
}

// Lower is better here — a faster finish beats the current best, not a
// bigger number. Returns whether this run actually improved it, so
// callers (the win screen, the leaderboard-submit flow) can branch on
// "is this genuinely a new personal best" without re-deriving it.
export async function reportTime(timeMs) {
  const current = peekLocalBestTime();
  if (current === 0 || timeMs < current) {
    saveLocalBestTime(timeMs);
    pushRemoteData({ best_time_ms: timeMs, last_played: new Date().toISOString() });
    return { isNewBest: true, best: timeMs };
  }
  return { isNewBest: false, best: current };
}
