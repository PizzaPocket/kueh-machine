## Context

Currently the `Song` table has no `language` field. The `getTimeline()` function filters songs by `countryCode` and `peakYearRegional` only — the `language` query parameter captured in the URL is silently discarded before the database query. The seed data covers 2000–2015 in English only, leaving 2016–2017 empty and making the Mandarin option non-functional.

## Goals / Non-Goals

**Goals:**
- Add `language` as a first-class field on `Song`
- Make `getTimeline()` return only songs matching the user's language choice
- Seed a curated Mandarin catalogue (2000–2017, SG + MY)
- Fill in English songs for 2016–2017
- Remove Cantonese from the onboarding form

**Non-Goals:**
- Real Spotify IDs for Mandarin songs (placeholder IDs, same as English — wired up later)
- Malay-language songs (out of MVP 1 scope)
- Mixed-language results (strict filter, not weighted blending)
- Per-year guaranteed minimum count for Mandarin (best-effort curation)

## Decisions

### D1: `language` field lives on `Song`, not `SongRegion`

A song's language is an intrinsic property of the recording, not of its regional popularity. Storing it on `Song` means we filter once at the join and don't need a language column in the many-to-many `SongRegion` table.

**Alternative considered**: language on `SongRegion` — rejected because the same song cannot be in two languages depending on region.

### D2: `language` values are `"en"` and `"zh"` (ISO 639-1)

Consistent with what `Country.languages` already stores in the DB (`["en", "ms", "zh"]`). No new enum needed — plain strings. Cantonese (`"yue"`) is excluded from MVP 1 but the schema allows it in future without migration.

### D3: Existing English songs get `language: "en"` via seed upsert

The migration adds the column with a default of `"en"` so existing rows are safe. The seed script is updated to explicitly set `language: "en"` on all 98 existing songs, keeping the seed as the single source of truth.

### D4: Mandarin catalogue uses placeholder Spotify IDs (`zh_001`, `zh_002`, …)

Same pattern as the English catalogue. Album art and previews will be wired up in a future Spotify integration pass. Using a distinct prefix (`zh_`) prevents ID collisions with English placeholders.

### D5: `getTimeline()` passes `language` as a Prisma `where` filter on the nested `song` relation

```
SongRegion.findMany({
  where: {
    countryCode,
    peakYearRegional: { gte: startYear, lte: endYear },
    song: { language }           // ← added
  }
})
```

This is the minimal, correct change — no new query paths, no breaking changes to the return shape.

## Risks / Trade-offs

- **Mandarin catalogue quality** → placeholder data, not real chart research. Tracks chosen are well-known in SG/MY but exact peak years are approximate. Acceptable for now; will be refined before launch.
- **Empty years if Mandarin catalogue has gaps** → some years may have fewer than 6 songs. The timeline will show what's available rather than crashing. Handled gracefully by existing `slice(0, 5)` logic.
- **Migration on live DB** → adding a nullable-then-defaulted column is safe in Postgres. No table lock for a column with a server-side default.

## Migration Plan

1. Update `schema.prisma` — add `language String @default("en")` to `Song`
2. Run `npx prisma migrate dev --name add-song-language`
3. Run `npx prisma db seed` — upsert all songs with explicit language values
4. Deploy code changes (timeline filter + onboarding form update)

Rollback: remove the `language` filter from `getTimeline()` to revert to showing all songs; the column can stay harmlessly.

## Open Questions

- None blocking implementation.
