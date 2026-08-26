## Why

The project documentation (`Project file/`, `CLAUDE.md`) was written before implementation and now contains outdated details — wrong song counts (5 popular songs), wrong music provider (Spotify instead of iTunes), and missing features (audio playback in the era page). Keeping docs in sync ensures future sessions start from accurate context.

## What Changes

- **`Project file/MVP 1 scope.md`** — Update "5 Popular Songs" → "3 Popular Songs", update Spotify integration section to reflect iTunes Search API, add birth year bounds (1988–2004), and note that audio previews are now live
- **`Project file/Technology stack.md`** — Replace Spotify API with iTunes Search API (no auth required)
- **`CLAUDE.md`** — Update scope constraints section (3 popular + 1 gem, birth year 1988–2004), update Spotify reference to iTunes, add note about the enrichment script at `scripts/enrich-spotify.ts`
- **No spec-level requirement changes** — the OpenSpec specs are already up to date (synced when each change was archived)

## Capabilities

### New Capabilities
<!-- None — this is a docs-only update -->

### Modified Capabilities
<!-- No spec-level behavior changes — specs already reflect current implementation -->

## Impact

- **Files changed:** `Project file/MVP 1 scope.md`, `Project file/Technology stack.md`, `CLAUDE.md`
- **No code changes** — documentation only
- **No database or schema changes**
- **No dependency changes**
