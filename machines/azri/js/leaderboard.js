// The public fastest-time leaderboard — a separate concern from
// progress.js's private per-player best (see database.sql: two tables,
// two RLS shapes). Same best-effort philosophy as the rest of this
// project's remote calls: a signed-out player, a missing table (before
// Leonard runs database.sql), or a network hiccup never throws and never
// blocks gameplay, it just leaves the board empty/unsubmitted.

const TABLE = 'kueh_hdb_panic_leaderboard';
const NICKNAME_KEY = 'kueh-hdb-panic-nickname';

export function getSavedNicknameSync() {
  try {
    return localStorage.getItem(NICKNAME_KEY) || null;
  } catch (_) {
    return null;
  }
}

export function saveNicknameSync(name) {
  try {
    localStorage.setItem(NICKNAME_KEY, name);
  } catch (_) {
    // Storage disabled/full — the prompt will just ask again next time.
  }
}

// Public read — no sign-in required to see the board, only to appear on it.
export async function fetchLeaderboard(limit = 10) {
  try {
    if (!window.KuehAccount) return [];
    await window.KuehAccount.ready;
    const client = window.KuehAccount.getClient();
    if (!client) return [];

    const { data, error } = await client
      .from(TABLE)
      .select('display_name, best_time_ms')
      .order('best_time_ms', { ascending: true })
      .limit(limit);

    if (error) {
      console.warn('[leaderboard] fetch failed:', error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn('[leaderboard] fetch failed:', err);
    return [];
  }
}

// Read-before-write, same reasoning as progress.js's pushRemoteData: a
// blind upsert here could let a slower run overwrite an already-recorded
// faster one. Returns whether it actually wrote.
export async function submitLeaderboardTimeIfBest(displayName, timeMs) {
  try {
    if (!window.KuehAccount) return false;
    await window.KuehAccount.ready;
    const user = window.KuehAccount.getUser();
    if (!user) return false;
    const client = window.KuehAccount.getClient();
    if (!client) return false;

    const { data: existing, error: fetchError } = await client
      .from(TABLE)
      .select('best_time_ms')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.warn('[leaderboard] existing-entry fetch failed:', fetchError.message);
      return false;
    }
    if (existing && existing.best_time_ms <= timeMs) return false;

    const { error } = await client.from(TABLE).upsert({
      user_id: user.id,
      display_name: displayName,
      best_time_ms: timeMs,
      achieved_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('[leaderboard] submit failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[leaderboard] submit failed:', err);
    return false;
  }
}
