## Why

The current build targets ages 12–24 as formative years but has no enforced birth year bounds, leaving 1998–1999 with zero song data (broken experience for 38–40 year olds) and 2020–2026 completely empty (broken for anyone born after 1996). The song count per year (5 popular + 1 forgotten gem) is also higher than needed and creates extra Spotify API work. Reducing to 3 + 1 and enforcing birth year bounds cleans up scope before Spotify enrichment begins.

## What Changes

- **Birth year input is bounded** to 1988–2004 on the onboarding form, with a clear user-facing message if out of range. This sidesteps the 1998–1999 data gap entirely (1988 + 12 = 2000, so all timelines start at year 2000 or later).
- **Popular songs per year reduced from 5 to 3.** The timeline and era detail pages show 3 popular songs + 1 forgotten gem per year instead of 5 + 1.
- **Seed data extended to cover 2018–2026** for both English and Mandarin (4 songs minimum per year: 3 popular candidates + at least 1 forgotten gem), so users born up to 2004 (age 22 in 2026) get a complete timeline.
- All code constants, UI copy, and spec references to "5 songs" are updated.

## Capabilities

### New Capabilities
- `timeline-song-counts`: Defines the exact slot counts per year — 3 popular songs and 1 forgotten gem — and the rule that a song cannot appear in both slots.

### Modified Capabilities
- `scope-constraints`: Birth year input now has enforced bounds: minimum 1988, maximum 2004. Out-of-range input shows a validation message.
- `mandarin-song-catalogue`: Coverage extended from 2000–2017 to 2000–2026 (English and Mandarin). Minimum 4 songs per year per language required (to fill 3 popular + 1 forgotten gem slots).

## Impact

- `src/lib/timeline.ts` — `slice(0, 5)` → `slice(0, 3)`
- `src/app/onboarding/page.tsx` — add min/max birth year validation (1988–2004)
- `src/app/era/[year]/page.tsx` — UI renders 3 popular song cards instead of 5
- `prisma/seed.ts` — add English and Mandarin songs for 2018–2026 (at least 4 per year each)
- `openspec/specs/` — update scope-constraints and mandarin-song-catalogue specs
