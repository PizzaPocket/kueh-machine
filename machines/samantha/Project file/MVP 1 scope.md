# MVP 1 Scope

## Product

**Rewind**
*Rediscover the songs, trends and moments that shaped your generation.*

---

## Experience Philosophy

Think of Rewind as a museum.

The user walks in, explores, feels something, and leaves.

No account. No saving. No trace.

The experience is a single session — anonymous, frictionless, and emotionally immediate.

---

## User Flow

1. User lands on the homepage
2. User enters:
   - Birth year
   - Country or region
   - Preferred language(s)
3. System generates a personalized nostalgia timeline
4. User explores their timeline era by era
5. User listens to song previews via Spotify
6. User leaves — no data is saved

---

## What's Included

### Timeline Generation

- Covers ages 12–24 (13 era cards total)
- Organised by life stage and year
- Each year contains:
  - **3 Popular Songs** from that period
  - **1 Forgotten Gem** (a song that was culturally relevant but is rarely heard today)
  - Text-based memory triggers (e.g. MSN Messenger, MapleStory, Nokia phones)

> **Song uniqueness rule:** A song can only appear in one slot per year — either as a Popular Song or as the Forgotten Gem, never both. The Forgotten Gem must be a distinct song from the 3 Popular Songs shown.

---

### Forgotten Gems

The signature feature.

Songs that:

- Were highly popular during a specific period
- Were culturally relevant to the user's region and age group
- Have largely disappeared from current listening habits

Forgotten Gem Score formula:

```
Forgotten Gem Score =
  Historical Popularity
  × Age Relevance
  × Regional Relevance
  × Memory Trigger Score
  ÷ Current Popularity
```

Higher score = stronger nostalgia candidate.

---

### Memory Triggers

Text-only. No images.

Contextual references that help users reconnect with a specific period.

Categories:

- Technology (e.g. Sony Ericsson Walkman, Windows XP, iPod Nano)
- Internet culture (e.g. MSN Messenger, Friendster, MySpace)
- Gaming (e.g. MapleStory, Ragnarok Online, Counter-Strike)
- Entertainment (e.g. popular TV shows and movies of the era)

Mapped by year and region.

---

### Music Integration

iTunes Search API (Apple). Free, no credentials or API key required.

Used for:

- Album artwork (cached at enrichment time)
- 30-second song previews (cached at enrichment time)

No user account required. No playlist creation. Metadata is cached in the database via `scripts/enrich-spotify.ts` — zero API calls at runtime.

---

### Animations

Framer Motion used for:

- Timeline transitions
- Memory card reveals
- Era navigation interactions

---

## What's Not Included

The following are explicitly out of scope for MVP 1:

| Feature | Status |
|---|---|
| User login / authentication | Out |
| Account creation | Out |
| Saving memories or songs | Out |
| Playlist generation | Out |
| AI-generated narratives | Out |
| Visual memory trigger images | Out |
| PostHog analytics | Out |
| Search | Out |
| Recommendations engine (ML) | Out |
| Vector search | Out |

---

## Technology Stack

### Frontend

| Layer | Choice |
|---|---|
| Framework | Next.js 15 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Animation | Framer Motion |

---

### Backend

| Layer | Choice |
|---|---|
| Server logic | Next.js Server Actions |
| Architecture | Single codebase (no separate backend) |

---

### Database

| Layer | Choice |
|---|---|
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Storage | None required |

---

### Integrations

| Service | Purpose |
|---|---|
| Spotify API | Song metadata, album art, previews (read-only) |

---

### Supported Regions

MVP 1 is scoped to two countries only:

| Country | Supported Languages |
|---|---|
| Singapore (SG) | English, Mandarin |
| Malaysia (MY) | English, Mandarin, Cantonese |

> **Language scope:** Songs are filtered by language of the track — English-language tracks and Mandarin/Cantonese tracks only. No other languages in MVP 1.

> **Birth year bounds:** Valid birth years are **1988–2004** (ages 22–38 as of 2026). Values outside this range are rejected with an inline error: *"We cover birth years 1988 to 2004 (ages 22–38 today)."* This ensures all formative years (ages 12–24) fall within the seeded data range of 2000–2026.

---

### Infrastructure

| Layer | Choice |
|---|---|
| Hosting | Vercel |
| Error tracking | Sentry |
| Auth | None |
| Analytics | None |

---

## Infrastructure Diagram

```
User
↓
Next.js Application (Vercel)
↓
Server Actions
↓
Supabase PostgreSQL
↓
Spotify API (read-only)
↓
Nostalgia Timeline
  → Popular Songs
  → Forgotten Gems
  → Memory Triggers (text)
```

---

## Data Sources

### Music Data

- Billboard archives
- Spotify charts
- Regional music charts (Singapore and Malaysia)
- Public music datasets

Scoped to: English-language and Mandarin/Cantonese tracks only.

### Cultural Memory Data

Curated dataset containing:

- Technology trends
- Popular websites and platforms
- Games
- TV shows and movies
- Internet culture

Mapped by year and region.

Example:

```
2007 / Malaysia

Memory Triggers:
- Friendster
- MSN Messenger
- MapleStory
- Sony Ericsson Walkman
```

---

## Success Criteria

MVP 1 is successful if:

- A user can enter their birth year, country and language and receive a timeline in under 3 seconds
- Forgotten Gems feel genuinely surprising and emotionally resonant
- Memory triggers create an "I completely forgot about this" reaction
- The experience works end-to-end with no login required
- Song previews play via iTunes without any account or API key

---

## Out of Scope but Planned

These features are confirmed for future versions, not MVP 1:

- User accounts and saved memories
- AI-generated era narratives
- Playlist export
- Visual memory triggers (images)
- Apple Music / KKBOX integration
- Vector search and ML recommendations
- Memory Graph (life stage → cultural moment → song → emotion)
