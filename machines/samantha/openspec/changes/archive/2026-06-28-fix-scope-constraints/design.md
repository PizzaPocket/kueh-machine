## Context

Three values in the running code are misaligned with the MVP 1 spec:
1. `timeline.ts` uses `birthYear + 10` / `birthYear + 25` — should be `+12` / `+24`
2. `onboarding/page.tsx` `COUNTRIES` array includes PH, US, GB, AU — should be SG/MY only
3. `onboarding/page.tsx` `LANGUAGES` array includes ms, ta, fil, combo codes — should be en/zh/yue only

All three fixes are isolated constant/data changes with no logic refactoring.

## Goals / Non-Goals

**Goals:**
- Make age range, country list, and language list match CLAUDE.md spec exactly
- Ensure users can never select an unsupported country or language from the UI

**Non-Goals:**
- Adding server-side validation or error messages for invalid inputs
- Changing any UI layout, styling, or flow
- Modifying the database, Prisma schema, or seed data

## Decisions

**Fix in the source constants, not via runtime validation.**
These are fixed product decisions, not user-submitted data that needs sanitising. The simplest correct fix is to remove the out-of-scope values from the dropdown arrays and correct the numeric constants. Adding a separate validation layer would be premature complexity.

**Use `yue` as the Cantonese language code.**
The CLAUDE.md spec names "Cantonese (YUE)". `yue` is the ISO 639-3 code for Cantonese and is consistent with what the seed data uses. No translation needed.

## Risks / Trade-offs

[Existing URLs with unsupported country/language params] → Any bookmarked or shared URLs that include `country=US` or `language=ms` will still reach the timeline and produce empty results. Mitigation: out of scope for MVP 1 — the form is the only entry point in the current UX.

[Empty timeline for yue] → Cantonese songs must exist in the seed data for `yue` to return results. If they don't, users picking Cantonese will see an empty timeline. This is a data gap, not a code bug — flag separately if needed.
