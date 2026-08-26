## 1. Set up the script file and dependencies

- [x] 1.1 Create `scripts/enrich-spotify.ts` with a main function stub and load `.env.local` via `dotenv`
- [x] 1.2 Confirm `dotenv` is already installed (check `package.json`); install if missing with `npm install dotenv`

## 2. Spotify authentication

- [x] 2.1 In `scripts/enrich-spotify.ts`, implement `getSpotifyToken()`: POST to `https://accounts.spotify.com/api/token` with `grant_type=client_credentials` and Basic auth from `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`
- [x] 2.2 Add a startup check: if either env var is missing, print a clear error message and call `process.exit(1)`

## 3. Song search and database update

- [x] 3.1 Implement `searchSpotify(token, title, artist)`: call `GET https://api.spotify.com/v1/search?q=track:"<title>" artist:"<artist>"&type=track&limit=1`, return the top result's `id`, `preview_url`, and `album.images[0].url` (or `null` if not found)
- [x] 3.2 Implement a fallback: if the field-filter query returns no results, retry with a plain query `"<title> <artist>"` and return the top result (or `null`)
- [x] 3.3 In the main loop, fetch all songs from the database using Prisma (`prisma.song.findMany()`)
- [x] 3.4 For each song, call `searchSpotify()`, then update the database row with `prisma.song.update()` setting `spotifyId`, `previewUrl`, and `albumArtUrl`
- [x] 3.5 If no match is found, log the unmatched song's title and artist; do NOT update the row

## 4. Rate limiting and summary

- [x] 4.1 Add a `sleep(200)` helper and call it after each Spotify search to stay within rate limits
- [x] 4.2 Track matched and unmatched counts; at the end, print a summary: total songs, matched, unmatched, and a list of unmatched titles

## 5. Run the script and verify

- [x] 5.1 Ensure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set in `.env.local`
- [x] 5.2 Run `npx tsx scripts/enrich-spotify.ts` and confirm it completes without errors
- [x] 5.3 Spot-check: query the database for 2–3 songs and confirm `previewUrl` and `albumArtUrl` are now real Spotify URLs (not placeholders)
- [x] 5.4 Start the dev server and confirm album art appears on the timeline and a play button works on the era detail page
