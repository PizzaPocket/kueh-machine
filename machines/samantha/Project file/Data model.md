# Data Model

## Overview

The data model is intentionally minimal for MVP 1.

There are no user accounts, no saved sessions, and no persistent user data.

All data is static and pre-seeded. The database is a curated content store — not a transactional system.

---

## Entities

### 1. Country

A lookup table for supported countries and regions.

MVP 1 supports Singapore (SG) and Malaysia (MY) only.

```prisma
model Country {
  id          String   @id @default(cuid())
  code        String   @unique  // "MY" or "SG"
  name        String            // "Malaysia" or "Singapore"
  region      String            // "Southeast Asia"
  languages   String[]          // ["en", "zh"] for SG; ["en", "zh", "yue"] for MY

  songs         SongRegion[]
  memoryTriggers MemoryTrigger[]
}
```

---

### 2. Song

The core music catalogue.

Stores song metadata, Spotify integration fields, and the pre-computed Forgotten Gem Score.

```prisma
model Song {
  id                  String   @id @default(cuid())
  title               String
  artist              String
  album               String?
  releaseYear         Int               // Year the song was released
  peakYear            Int               // Year the song peaked in popularity
  language            SongLanguage      // EN, ZH (Mandarin), YUE (Cantonese)
  spotifyId           String   @unique  // Used to fetch preview URL and album art
  previewUrl          String?           // Spotify 30-second preview URL (cached)
  albumArtUrl         String?           // Spotify album artwork URL (cached)
  isForgivenGem       Boolean  @default(false)  // Manually flagged curated gems
  forgottenGemScore   Float    @default(0)      // Pre-computed score

  regions  SongRegion[]
}

enum SongLanguage {
  EN   // English
  ZH   // Mandarin
  YUE  // Cantonese
}
```

**Notes:**

- `forgottenGemScore` is pre-computed at seed time, not calculated at query time
- `previewUrl` and `albumArtUrl` are cached from Spotify to reduce API calls
- `isForgivenGem` allows manual editorial curation on top of the score

---

### 3. SongRegion

Maps songs to regions with regional popularity data.

The same song can have very different relevance across regions.

```prisma
model SongRegion {
  id                  String  @id @default(cuid())
  songId              String
  countryCode         String
  peakYearRegional    Int             // Year this song peaked in this specific region
  historicalPopularity Float          // 0–100 score, sourced from regional charts
  currentPopularity   Float           // 0–100 score, how much it's streamed today
  ageRelevance        Float           // 0–100, highest for ages 10–25 during peak year
  memoryTriggerScore  Float           // 0–100, association with cultural moments
  forgottenGemScore   Float           // Computed: (historicalPopularity × ageRelevance × memoryTriggerScore) ÷ currentPopularity

  song     Song    @relation(fields: [songId], references: [id])
  country  Country @relation(fields: [countryCode], references: [code])

  @@unique([songId, countryCode])
}
```

**Forgotten Gem Score formula:**

```
forgottenGemScore =
  (historicalPopularity × ageRelevance × regionalRelevance × memoryTriggerScore)
  ÷ currentPopularity
```

Higher score = stronger nostalgia candidate.

---

### 4. MemoryTrigger

Text-based cultural references mapped to a year range and region.

No images. Text only.

```prisma
model MemoryTrigger {
  id           String   @id @default(cuid())
  name         String            // e.g. "MSN Messenger"
  category     TriggerCategory
  yearStart    Int               // First year this trigger is relevant
  yearEnd      Int               // Last year this trigger is relevant
  countryCode  String?           // null = global trigger
  description  String?           // Optional short description

  country  Country? @relation(fields: [countryCode], references: [code])
}

enum TriggerCategory {
  TECHNOLOGY
  INTERNET_CULTURE
  GAMING
  ENTERTAINMENT
  FASHION
  OTHER
}
```

**Examples:**

| name | category | yearStart | yearEnd | countryCode |
|---|---|---|---|---|
| MSN Messenger | INTERNET_CULTURE | 2000 | 2010 | null (global) |
| Friendster | INTERNET_CULTURE | 2003 | 2009 | MY |
| MapleStory | GAMING | 2003 | 2010 | MY |
| Sony Ericsson Walkman | TECHNOLOGY | 2005 | 2009 | null (global) |
| Windows XP | TECHNOLOGY | 2001 | 2008 | null (global) |
| Nokia 3310 | TECHNOLOGY | 2000 | 2005 | null (global) |
| Ragnarok Online | GAMING | 2002 | 2008 | MY |

---

## Relationships

```
Country
  ├── SongRegion (one Country → many SongRegions)
  └── MemoryTrigger (one Country → many MemoryTriggers)

Song
  └── SongRegion (one Song → many SongRegions, one per country)

SongRegion
  ├── belongs to Song
  └── belongs to Country
```

---

## Timeline Query Logic

When a user submits their details, the system:

1. Calculates the user's formative years: `birth_year + 12` to `birth_year + 24`
2. Queries `SongRegion` filtered by:
   - `countryCode = user's country` (SG or MY only)
   - `peakYearRegional` within the formative years range
   - `song.language` matches user's selected language (EN, ZH, or YUE)
3. For each year, splits results into:
   - **Popular Songs** — top 5 ordered by `historicalPopularity DESC`
   - **Forgotten Gem** — top 1 ordered by `forgottenGemScore DESC`, **excluding any song already selected as a Popular Song**
4. Queries `MemoryTrigger` where:
   - `countryCode = user's country` OR `countryCode IS NULL` (global)
   - `yearStart` to `yearEnd` overlaps the formative years range
5. Groups everything by year and returns the timeline

---

## Example Query Output

**Input:** birth_year = 1993, country = MY

**Formative years:** 2003 – 2018

**Sample output for year 2007 (age 14):**

```json
{
  "year": 2007,
  "age": 14,
  "lifeStage": "Teenage Years",
  "popularSongs": [
    { "title": "Umbrella", "artist": "Rihanna", "albumArtUrl": "...", "previewUrl": "...", "spotifyId": "..." },
    { "title": "Irreplaceable", "artist": "Beyoncé", "albumArtUrl": "...", "previewUrl": "...", "spotifyId": "..." },
    { "title": "Beautiful Girls", "artist": "Sean Kingston", "albumArtUrl": "...", "previewUrl": "...", "spotifyId": "..." },
    { "title": "Glamorous", "artist": "Fergie", "albumArtUrl": "...", "previewUrl": "...", "spotifyId": "..." },
    { "title": "Buy U a Drank", "artist": "T-Pain", "albumArtUrl": "...", "previewUrl": "...", "spotifyId": "..." }
  ],
  "forgottenGem": {
    "title": "Bad Day",
    "artist": "Daniel Powter",
    "albumArtUrl": "...",
    "previewUrl": "...",
    "spotifyId": "...",
    "forgottenGemScore": 87.4
  },
  "memoryTriggers": [
    { "name": "MSN Messenger", "category": "INTERNET_CULTURE" },
    { "name": "Friendster", "category": "INTERNET_CULTURE" },
    { "name": "MapleStory", "category": "GAMING" },
    { "name": "Sony Ericsson Walkman", "category": "TECHNOLOGY" }
  ]
}
```

---

## Life Stage Mapping

| Age Range | Life Stage |
|---|---|
| 10 – 12 | Childhood |
| 13 – 18 | Teenage Years |
| 19 – 25 | Young Adult Years |

---

## Seeding Strategy

All data is pre-seeded. No user-generated content in MVP 1.

Seed priority order:

1. Countries (start with MY, SG, PH, US, GB, AU)
2. Songs (source from Billboard archives + Spotify chart data)
3. SongRegion (map each song to relevant countries with scores)
4. MemoryTriggers (curate manually, global first then regional)

---

## Future Extensions

These are not in MVP 1 but the schema is designed to support them:

- **User accounts** — add a `User` model, link to saved songs and timelines
- **Emotional reactions** — add a `Reaction` model (I Remember This / Forgot About This)
- **Vector embeddings** — add embedding fields to `Song` and `MemoryTrigger` for similarity search
- **More regions** — extend `Country` seeds and `SongRegion` mappings
- **Memory Graph** — link `MemoryTrigger` directly to `Song` via a join table
