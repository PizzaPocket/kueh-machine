## Why

The CLAUDE.md spec was updated to tighten scope (countries SG/MY only, languages EN/ZH/YUE only, age range 12–24), but the running code still reflects the old, broader values. This creates a mismatch between product intent and what users actually see — people can select unsupported countries and languages that produce empty timelines, and the age range fetches 3 extra years of data outside the formative window.

## What Changes

- **Age range corrected**: Timeline query now uses `birthYear + 12` to `birthYear + 24` (13 years) instead of `birthYear + 10` to `birthYear + 25`
- **Country dropdown restricted**: Onboarding form shows only Singapore (SG) and Malaysia (MY) — all other countries removed
- **Language dropdown corrected**: Onboarding form shows only English (`en`), Mandarin (`zh`), and Cantonese (`yue`) — Malay, Tamil, Filipino, and combo codes removed

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `scope-constraints`: Country list, language list, and age range are tightened to match MVP 1 spec

## Impact

- `src/lib/timeline.ts`: change `startYear` and `endYear` constants
- `src/app/onboarding/page.tsx`: replace `COUNTRIES` and `LANGUAGES` arrays
- No database changes, no API changes, no schema changes
- No UI layout changes — same form, different dropdown options
