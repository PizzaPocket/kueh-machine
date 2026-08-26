## Why

All songs in the database currently have placeholder `spotifyId` values (e.g. `en_07_01`) and no `previewUrl` or `albumArtUrl`. Without real Spotify data, the timeline can't play audio previews or show album art — the two features that make the nostalgia experience actually feel alive.

## What Changes

- A one-time enrichment script (`scripts/enrich-spotify.ts`) that loops over every song in the database, searches the Spotify API by title + artist, and writes back the real `spotifyId`, `previewUrl`, and `albumArtUrl`
- The script uses the **Client Credentials** OAuth flow — no user login required, no user data touched
- Results are cached in the database at seed time (read-only at runtime, as per existing design)
- Songs with no Spotify match are flagged but left unchanged; they won't break the UI (preview button simply stays hidden)
- No changes to the Prisma schema — `spotifyId`, `previewUrl`, and `albumArtUrl` already exist on the `Song` table

## Capabilities

### New Capabilities
- `spotify-enrichment-script`: A standalone script that authenticates with Spotify via Client Credentials, searches for each song, and updates the database with real `spotifyId`, `previewUrl`, and `albumArtUrl`

### Modified Capabilities
<!-- No existing requirement-level specs change — this is purely a data enrichment operation -->

## Impact

- **New file**: `scripts/enrich-spotify.ts`
- **Environment variables**: `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` must be set in `.env.local` (already documented)
- **Spotify API**: Search endpoint (`GET /v1/search`) + Client Credentials token endpoint — read-only, no user OAuth
- **Database**: `Song.spotifyId`, `Song.previewUrl`, `Song.albumArtUrl` updated for all matched songs
- **Rate limiting**: Spotify free tier allows ~100 requests/second; script will add a small delay between batches to stay safe
- **No runtime impact**: App reads cached values; enrichment script runs once, offline
