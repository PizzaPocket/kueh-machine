## Context

The `Song` table has `spotifyId`, `previewUrl`, and `albumArtUrl` columns that the seed script currently populates with placeholder strings (e.g. `en_07_01`, empty strings). The timeline and era detail pages already render album art and a play button — they just have nothing real to show yet.

Spotify's API provides a search endpoint that accepts a free-text query and returns track metadata including a `preview_url` (30-second MP3) and album art. Using the **Client Credentials** flow (app-level token, no user identity required) is the right fit here: it's simple, requires only `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`, and is appropriate for read-only catalogue lookups.

The enrichment is a one-time operation. Once run, the app reads cached values from the database with zero Spotify API calls at runtime.

## Goals / Non-Goals

**Goals:**
- Authenticate with Spotify using Client Credentials (no user OAuth)
- For each song in the database, search Spotify by `title + artist`
- Write back the real `spotifyId`, `previewUrl`, and `albumArtUrl` to the `Song` row
- Log songs that couldn't be matched so they can be reviewed or manually fixed
- The script is idempotent: running it twice produces the same result (no duplicates, no data loss)

**Non-Goals:**
- No user-facing Spotify integration (no playlists, no user login)
- No runtime Spotify API calls from the web app
- No re-seeding or schema changes

## Decisions

### Decision 1: Script lives at `scripts/enrich-spotify.ts`, run manually with `npx tsx`

**Chosen:** Standalone TypeScript script, not a Prisma seed hook or API route.

**Why:** This is a one-time data migration, not part of normal app startup. Keeping it separate means it can be re-run at will without affecting seeding, and it won't add Spotify SDK dependencies to the main app bundle.

**Alternative considered:** Running enrichment inside `prisma/seed.ts`. Rejected because seed should be fast and repeatable; Spotify API calls would make it slow and dependent on network availability.

### Decision 2: Spotify Client Credentials flow (no user OAuth)

**Chosen:** `POST https://accounts.spotify.com/api/token` with `grant_type=client_credentials`.

**Why:** We only need public catalogue data (track metadata, preview URLs, album art). User OAuth would add unnecessary complexity and require a redirect URI. Client Credentials gives a token valid for 1 hour — enough for a single enrichment run over ~310 songs.

**Alternative considered:** Using an unofficial Spotify web scraper. Rejected — fragile, against ToS.

### Decision 3: Search query format `track:"<title>" artist:"<artist>"`

**Chosen:** Spotify's field filters for precise matching.

**Why:** Plain text search returns too many false positives for common song titles. Field filters narrow results to the right track.

**Fallback:** If field-filter search returns no results, retry with a plain query `"<title> <artist>"`. If still no match, log as unmatched and skip.

### Decision 4: Rate limiting — 200ms delay between requests

**Chosen:** `await sleep(200)` between each Spotify search call.

**Why:** Spotify's public API allows ~50 requests per second on Client Credentials. 200ms (5 req/s) stays well within limits and avoids 429 errors on a ~310-song run (takes ~1 minute total).

### Decision 5: Idempotent updates — overwrite every time

**Chosen:** Always write back the Spotify data, even if a `previewUrl` already exists.

**Why:** Simplicity. Running the script twice is safe — the second run overwrites with the same data. This also makes it easy to re-enrich after adding new seed songs.

## Risks / Trade-offs

- **[Risk] Some songs won't match** — Mandarin titles searched against Spotify's catalogue may return wrong results or no results, especially for older or less-mainstream tracks. → Mitigation: Log all unmatched songs to console with a clear summary at the end. Manual review + hardcoded `spotifyId` override is the fallback.
- **[Risk] `preview_url` is null for some tracks** — Spotify only provides 30-second previews for some markets. `previewUrl` can legitimately be null even for matched tracks. → Mitigation: Store `null` and hide the play button in the UI when `previewUrl` is null (already handled by the existing conditional render).
- **[Risk] Token expiry during a long run** — Client Credentials tokens expire after 1 hour. A run over 310 songs at 200ms each takes ~1 minute, well within that window. → Mitigation: Not a practical risk at current data size. If the catalogue grows significantly, add token refresh logic.
- **[Risk] Spotify API deprecates `preview_url`** — Spotify has been restricting preview URLs in some regions. → Mitigation: This is a known risk for the product; for MVP it's acceptable. If previews stop working, the play button hides gracefully.

## Migration Plan

1. Ensure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set in `.env.local`
2. Run `npx tsx scripts/enrich-spotify.ts`
3. Review the console output — check the "Unmatched songs" summary
4. Manually fix any important unmatched songs by looking up their Spotify ID and running a targeted update
5. Restart dev server and verify album art + play buttons appear on the timeline

**Rollback:** The script only updates existing rows. To roll back, re-run `npx prisma db seed` to restore placeholder values (seed script sets `spotifyId` to placeholder strings and clears `previewUrl`/`albumArtUrl`).

## Open Questions

- Should the script also update songs added after initial enrichment (i.e. new seed songs)? → Handled by idempotency: just re-run the script.
- What's the acceptable match rate before we consider the enrichment "good enough"? → 80%+ matched is a reasonable bar for MVP; Mandarin songs may be lower.
