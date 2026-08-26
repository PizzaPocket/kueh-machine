## ADDED Requirements

### Requirement: Script authenticates with Spotify using Client Credentials
The script SHALL obtain a Spotify access token by posting to the Spotify token endpoint using `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from environment variables. The script SHALL NOT require any user-facing OAuth flow.

#### Scenario: Token is obtained before any search
- **WHEN** the script starts
- **THEN** it SHALL call `POST https://accounts.spotify.com/api/token` with `grant_type=client_credentials`
- **THEN** it SHALL use the returned `access_token` for all subsequent Spotify API calls

#### Scenario: Missing credentials halt the script
- **WHEN** `SPOTIFY_CLIENT_ID` or `SPOTIFY_CLIENT_SECRET` is not set in the environment
- **THEN** the script SHALL exit immediately with a clear error message naming the missing variable

### Requirement: Script searches Spotify for each song and writes results back
For every `Song` row in the database, the script SHALL search Spotify using the song's `title` and `artist`, then update `spotifyId`, `previewUrl`, and `albumArtUrl` with the best match found.

#### Scenario: Matched song is updated
- **WHEN** a Spotify search returns at least one result matching the song's title and artist
- **THEN** the script SHALL update `Song.spotifyId`, `Song.previewUrl`, and `Song.albumArtUrl` with values from the top result
- **THEN** `previewUrl` and `albumArtUrl` SHALL be set to `null` if Spotify does not provide them for that track

#### Scenario: Unmatched song is skipped and logged
- **WHEN** a Spotify search returns no results for a song
- **THEN** the script SHALL leave that song's database row unchanged
- **THEN** the script SHALL log the unmatched song's `title` and `artist` to the console

#### Scenario: Summary is printed at the end
- **WHEN** all songs have been processed
- **THEN** the script SHALL print a summary showing total songs, matched count, and unmatched count

### Requirement: Script is idempotent and rate-limited
Running the script multiple times SHALL produce the same database state. The script SHALL not exceed Spotify's rate limits.

#### Scenario: Re-running the script produces the same result
- **WHEN** the script is run a second time on a database already enriched
- **THEN** the same `spotifyId`, `previewUrl`, and `albumArtUrl` values are written (overwriting with identical data)
- **THEN** no error is thrown and no song is left with corrupted data

#### Scenario: Delay between requests prevents rate limiting
- **WHEN** the script processes each song
- **THEN** it SHALL wait at least 200ms between consecutive Spotify API calls
