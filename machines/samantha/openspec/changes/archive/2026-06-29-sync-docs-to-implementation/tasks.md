## 1. Update Project file/MVP 1 scope.md

- [x] 1.1 Change "5 Popular Songs" → "3 Popular Songs" in the Timeline Generation section
- [x] 1.2 Update the song uniqueness rule note to reference 3 popular songs (not 5)
- [x] 1.3 Update the Spotify Integration section: rename to "Music Integration", change provider to iTunes Search API, note no auth/credentials required
- [x] 1.4 Add birth year bounds to the Supported Regions section: note valid birth years are 1988–2004 (ages 22–38)
- [x] 1.5 Update the success criteria: replace "Song previews play via Spotify without a user account" with "Song previews play via iTunes without any account or API key"

## 2. Update Project file/Technology stack.md

- [x] 2.1 Replace Spotify API entry with iTunes Search API (free, no auth, no credentials required)

## 3. Update CLAUDE.md

- [x] 3.1 In "What is and is not in MVP 1", change "5 Popular Songs + 1 Forgotten Gem per year" → "3 Popular Songs + 1 Forgotten Gem per year"
- [x] 3.2 In "Scope constraints", update the songs-per-year constraint: "Exactly 3 Popular Songs + 1 Forgotten Gem"
- [x] 3.3 Add birth year constraint to the scope constraints: "Birth year: 1988–2004 inclusive. Form shows error outside this range."
- [x] 3.4 In "What is and is not in MVP 1", update the Spotify preview note: iTunes Search API is used (no credentials, no user auth required)
- [x] 3.5 Add a note about `scripts/enrich-spotify.ts`: one-time enrichment script that populates `previewUrl` and `albumArtUrl` using iTunes Search API; run with `npx tsx scripts/enrich-spotify.ts`
