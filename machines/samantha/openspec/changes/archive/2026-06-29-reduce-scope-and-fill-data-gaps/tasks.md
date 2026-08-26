## 1. Reduce popular songs per year from 5 to 3

- [x] 1.1 In `src/lib/timeline.ts`, change `byPopularity.slice(0, 5)` to `slice(0, 3)`
- [x] 1.2 In `src/app/era/[year]/page.tsx`, verify the popular songs section renders the list dynamically (no hardcoded "5" count in UI)
- [x] 1.3 In `src/app/soundtrack/page.tsx`, check for any hardcoded "5 songs" references and update

## 2. Enforce birth year bounds on the onboarding form

- [x] 2.1 In `src/app/onboarding/page.tsx`, add validation: if birth year < 1988 or > 2004, show inline error "We cover birth years 1988 to 2004 (ages 22–38 today)" and block form submission
- [x] 2.2 Ensure the error message clears when the user corrects the birth year to a valid value

## 3. Add English songs for 2018–2026 in seed

- [x] 3.1 Add at least 4 English songs per year for 2018–2026 in `prisma/seed.ts` (3 popular candidates + 1 with higher forgottenGemScore), with placeholder spotifyIds
- [x] 3.2 Add corresponding `SongRegion` entries for both `MY` and `SG` for each new English song

## 4. Add Mandarin songs for 2018–2026 in seed

- [x] 4.1 Add at least 4 Mandarin (`language: "zh"`) songs per year for 2018–2026 in `prisma/seed.ts`, sourced from popular MY/SG Mandarin artists of that era (e.g. 周杰伦, 邓紫棋, 林俊傑, 五月天, 魏如萱), with placeholder spotifyIds
- [x] 4.2 Add corresponding `SongRegion` entries for both `MY` and `SG` for each new Mandarin song

## 5. Re-seed the database

- [x] 5.1 Run `npm run db:seed` and confirm it completes without errors
- [x] 5.2 Spot-check: query the DB for year 2022 English and Mandarin songs to confirm at least 4 per language exist
