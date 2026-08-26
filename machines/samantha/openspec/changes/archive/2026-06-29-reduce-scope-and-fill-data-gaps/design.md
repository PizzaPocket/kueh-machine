## Context

The app currently has no enforced birth year bounds, and the seed data only covers 2000–2019 (with 2018–2019 having just 1 song each). The timeline query slices the top 5 popular songs per year. Before Spotify API enrichment runs, the data model and query logic need to be stable so we don't enrich songs that will be removed or slots that don't exist.

## Goals / Non-Goals

**Goals:**
- Enforce birth year 1988–2004 at the form level to eliminate broken empty-year experiences
- Reduce timeline slots to 3 popular + 1 forgotten gem per year, simplifying the UI and cutting future Spotify API calls by ~40%
- Fill the seed data gap for 2018–2026 (English + Mandarin, min 4 songs per year) so all users aged 22–38 get a complete timeline

**Non-Goals:**
- Spotify API enrichment (that is the next change)
- Adding songs for years before 2000 (1998–1999 are deliberately excluded via birth year bounds)
- Cantonese song catalogue
- Any country other than MY and SG

## Decisions

### Decision: Block out-of-range birth years at form validation, not server

**Choice:** Validate min/max birth year on the onboarding form (client side) and show an inline error message. Do not add server-side validation.

**Rationale:** The form already controls country and language with constrained dropdowns — birth year should be the same pattern. Adding server validation would require a round-trip and an error state in the Server Action that doesn't exist yet. Since there's no malicious actor concern (no auth, no persisted data), client-only validation is sufficient.

**Alternative considered:** Server Action validation. Rejected — over-engineered for this use case.

---

### Decision: Change `slice(0, 5)` to `slice(0, 3)` in `getTimeline()`, no new config constant

**Choice:** Hardcode 3 directly in the slice call in `timeline.ts`.

**Rationale:** This is a product constant that's unlikely to change per-query or per-country. A named constant adds indirection with no real benefit at this scale. The spec (`timeline-song-counts`) documents the number; the code is the single implementation of it.

**Alternative considered:** `POPULAR_SONGS_PER_YEAR = 3` constant. Rejected — premature abstraction.

---

### Decision: Seed data additions are manual (hand-curated song lists)

**Choice:** Add songs for 2018–2026 directly in `seed.ts` as hardcoded objects, same as the existing catalogue.

**Rationale:** Spotify search at seed time would require real API credentials during development and introduce network dependency into seeding. The Spotify enrichment step (next change) will replace placeholder IDs anyway. Manual curation also gives control over quality — we know these songs are genuine hits for MY/SG audiences.

**Alternative considered:** Script that queries Spotify Search API during seed. Rejected — creates a circular dependency with the enrichment step.

## Risks / Trade-offs

- **Risk: Seed data quality for 2020–2026** — Recent years are harder to curate for "forgotten gems" since nostalgia hasn't fully set in yet. → Mitigation: For 2020–2026, use `isForgottenGem: false` for most songs and pick one per year with a moderately high `forgottenGemScore` (50+) as a "hidden gem" rather than a true forgotten classic.
- **Risk: Form validation UX** — If a user types 1985 and sees an error, they may be confused why the app doesn't cover their era. → Mitigation: Error message is specific: "We cover birth years 1988 to 2004 (ages 22–38 today)."
- **Risk: 3 popular songs feels sparse** — Some years had many big hits. → Accept: The product is about discovery and memory, not comprehensiveness. 3 + 1 is still 4 songs per year across 13 years.

## Migration Plan

1. Update `timeline.ts` and `onboarding/page.tsx` first — no DB migration needed
2. Run `npm run db:seed` after adding songs to `seed.ts` — upsert-safe, existing records are untouched
3. No rollback needed — all changes are additive or behaviorally contained to the form
