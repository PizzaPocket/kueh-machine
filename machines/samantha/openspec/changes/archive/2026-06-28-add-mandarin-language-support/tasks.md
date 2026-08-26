## 1. Schema & Migration

- [x] 1.1 Add `language String @default("en")` field to the `Song` model in `prisma/schema.prisma`
- [x] 1.2 Run `npx prisma migrate dev --name add-song-language` to create the migration

## 2. Seed — English Updates

- [x] 2.1 Add `language: "en"` to all existing English song entries in `prisma/seed.ts`
- [x] 2.2 Add 6+ English songs for 2016 to the songs array in `prisma/seed.ts` (e.g. One Dance, Closer, Don't Let Me Down, Work, Love Yourself, Sorry)
- [x] 2.3 Add 6+ English songs for 2017 to the songs array in `prisma/seed.ts` (e.g. Shape of You, Despacito, Something Just Like This, Humble, That's What I Like, Issues)
- [x] 2.4 Add corresponding `SongRegion` entries for MY and SG for the 2016 and 2017 English songs

## 3. Seed — Mandarin Catalogue

- [x] 3.1 Add 2000–2003 Mandarin songs to `prisma/seed.ts` with `language: "zh"` and Spotify IDs using `zh_` prefix (e.g. 周杰伦 — 爱在西元前, 五月天 — 志明与春娇, S.H.E — Super Star, 蔡依林 — 我呢)
- [x] 3.2 Add 2004–2007 Mandarin songs (e.g. 周杰伦 — 七里香/夜曲, 林俊傑 — 江南/曹操, 梁静茹 — 勇气, 王力宏 — 心中的日月, S.H.E — 恋人未满)
- [x] 3.3 Add 2008–2011 Mandarin songs (e.g. 周杰伦 — 稻香, 五月天 — 你不是真正的快乐, 林俊傑 — 小酒窝, 孙燕姿 — 你存在的意义, 张韶涵 — 欧若拉)
- [x] 3.4 Add 2012–2015 Mandarin songs (e.g. 邓紫棋 — 泡沫/光年之外, 周杰伦 — 告白气球, 五月天 — 倔强/温柔, 韦礼安 — 你啊你啊, 魏如昀 — 如果雨之后)
- [x] 3.5 Add 2016–2017 Mandarin songs (e.g. 邓紫棋 — 光年之外, 周杰伦 — 说好不哭, 五月天 — 好好 (超好), 林俊傑 — 关键词, 蔡依林 — 玫瑰少年)
- [x] 3.6 Add `SongRegion` entries for MY and SG for all Mandarin songs (with appropriate `peakYearRegional`, `historicalPopularity`, `currentPopularity`, `ageRelevance`, `memoryTriggerScore`)
- [x] 3.7 Run `npx prisma db seed` and verify no errors

## 4. Timeline Logic

- [x] 4.1 Update `getTimeline()` in `src/lib/timeline.ts` to accept a third parameter `language: string`
- [x] 4.2 Add `song: { language }` filter to the `SongRegion.findMany` Prisma query inside `getTimeline()`

## 5. Page Wiring

- [x] 5.1 Update `src/app/soundtrack/page.tsx` to pass `language` to `getTimeline(birthYear, country, language)`
- [x] 5.2 Remove the Cantonese option from the language selector in `src/app/onboarding/page.tsx`, keeping only English and Mandarin (华语)

## 6. Verification

- [x] 6.1 Run the app locally and test birth year 1993, country MY, language English — verify 2016 and 2017 now show songs
- [x] 6.2 Test birth year 1993, country MY, language Mandarin — verify only Mandarin songs appear across all years
- [x] 6.3 Confirm the onboarding form no longer shows a Cantonese option
