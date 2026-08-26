## Why

Users who select "Chinese" (Mandarin) as their language preference currently see Western English-language songs — the language filter is wired through the UI but never applied to the song query, and the database contains no Mandarin songs at all. This makes the language selector misleading and the product incomplete for a core audience in Singapore and Malaysia.

Additionally, the seed dataset ends at 2015, so any user born after 1991 will see empty year cards for the later years of their timeline (e.g. a 1993 birth year produces a timeline through 2017, with 2016 and 2017 blank).

## What Changes

- Add a `language` field (`"en"` | `"zh"`) to the `Song` database table
- Extend `getTimeline()` to accept and filter by language
- Seed a Mandarin song catalogue covering 2000–2017 (5 popular + 1 forgotten gem per year, ~90 songs) for MY and SG
- Extend the English catalogue with songs for 2016 and 2017
- Remove the Cantonese (`yue`) option from the onboarding form — English and Mandarin only for MVP 1

## Capabilities

### New Capabilities

- `mandarin-song-catalogue`: A curated set of Mandarin-language songs for SG/MY covering 2000–2017, seeded into the database with `language: "zh"` and full SongRegion entries

### Modified Capabilities

- `language-filter`: The language value selected in onboarding is passed through to `getTimeline()` and applied as a database filter on `Song.language`; songs are only returned if their language matches the user's selection

## Impact

- **Database**: Schema migration to add `language: String` (default `"en"`) to `Song` table
- **Seed script**: `prisma/seed.ts` — add `language` to all existing English songs + add ~90 Mandarin songs with SongRegion entries
- **Timeline logic**: `src/lib/timeline.ts` — `getTimeline()` signature and Prisma query updated
- **Soundtrack page**: `src/app/soundtrack/page.tsx` — pass `language` param to `getTimeline()`
- **Onboarding form**: `src/app/onboarding/page.tsx` — remove Cantonese option, keep English + Mandarin only
- **Prisma schema**: `prisma/schema.prisma` — new `language` field on `Song`
