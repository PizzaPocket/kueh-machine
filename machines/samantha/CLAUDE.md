# CLAUDE.md — Rewind

This file tells Claude Code everything it needs to know about this project.
Read this fully before making any changes.

---

## What this project is

**Rewind** is a music nostalgia and memory discovery platform.

Users enter their birth year, country, and language. The app generates a personalised timeline of songs and cultural memory triggers from their formative years (ages 12–24), with a focus on **Forgotten Gems** — songs that were huge at the time but are rarely heard today.

The experience is designed like a museum: anonymous, single-session, no login, no data saved, no trace left.

---

## Project location

```
/Users/samanthatan/Desktop/vibe idea/remember.fm/
```

Project documentation lives in:
```
/Users/samanthatan/Desktop/vibe idea/remember.fm/Project file/
```

Always read the relevant project docs before making changes (see "Key documents" below).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript — always. Never plain JavaScript. |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Animation | Framer Motion |
| Server logic | Next.js Server Actions |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Music integration | iTunes Search API (free, no credentials required) |
| Hosting | Vercel |
| Error tracking | Sentry |

---

## Package manager

Use **npm** for all installs and scripts. This is Samantha's first time coding — keep commands simple and always explain what they do before running them.

---

## Environment variables

The following environment variables are needed. They live in `.env.local` at the project root (never commit this file).

```
# Supabase
DATABASE_URL=
DIRECT_URL=
```

If any of these are missing, stop and tell Samantha which ones are needed and where to get them before proceeding.

> **No music API credentials needed.** iTunes Search API is free and requires no key. The enrichment script (`scripts/enrich-itunes.ts`) uses only `DIRECT_URL` to write to the database.

---

## Database

Four tables. See `Project file/Data model.md` for full schema and field definitions.

| Table | Purpose |
|---|---|
| `Country` | Supported countries and languages |
| `Song` | Music catalogue with cached Spotify fields |
| `SongRegion` | Song-to-country mapping with regional scores |
| `MemoryTrigger` | Text-based cultural references by year and region |

Key rules:
- `forgottenGemScore` is **pre-computed at seed time**, not at query time
- `previewUrl` and `albumArtUrl` are **cached from iTunes at enrichment time** via `scripts/enrich-itunes.ts` — run once with `npx tsx scripts/enrich-itunes.ts`
- No user tables. No session tables. Nothing persists from the user side.

Forgotten Gem Score formula:
```
(historicalPopularity × ageRelevance × regionalRelevance × memoryTriggerScore) ÷ currentPopularity
```

---

## What is and is not in MVP 1

### In scope
- Birth year + country (SG or MY only) + language (English, Mandarin, or Cantonese) input
- Timeline for ages 12–24 (13 era cards total)
- **3 Popular Songs + 1 Forgotten Gem per year** — a song can only appear in one slot, never both
- Timeline grouped by device era (Walkman, Discman, iPod, etc.) — dynamic per birth year
- Text-based memory triggers (no images)
- iTunes album art + 30s preview (no account or API key required)
- Framer Motion timeline animations

### Explicitly out of scope — do not build or suggest these
- User login or authentication *within this app's own product/data model* —
  the site-wide account badge in `layout.tsx` (`/shared/account-widget.js`)
  is a deliberate exception, added by Leonard for cross-site consistency
  across every kuehmachine.com machine, not a feature of Rewind itself.
  Don't treat its presence as license to build login-gated features here,
  and don't remove it thinking it violates this rule — it does its own
  thing (a floating account icon) and never touches this app's timeline/
  song data. Nothing below it saves songs, memories, or sessions.
- Supabase Auth (as above, this app's own logic still never checks who's signed in)
- Saving songs or memories
- Playlist generation
- AI-generated narratives
- Visual/image memory triggers
- PostHog or any analytics
- Search
- Machine learning or vector search

---

## Screens

Four screens only. See `Project file/User flow.md` for the full flow.

1. **Landing** — hero message + single CTA ("Take me back")
2. **Input form** — birth year, country, language
3. **Timeline** — era cards for ages 12–24, grouped by device era (Walkman / Discman / iPod etc.), scroll to explore
4. **Era detail** — memory triggers + popular songs + forgotten gems + Spotify previews

---

## Scope constraints — always enforce these

- **Countries:** Singapore (SG) and Malaysia (MY) only. Reject any other country.
- **Languages:** English, Mandarin (ZH), and Cantonese (YUE) only. These refer to the language of the track, not the user's nationality.
- **Age range:** 12–24 only (13 years). The formative years formula is `birth_year + 12` to `birth_year + 24`.
- **Birth year:** 1988–2004 inclusive. Form shows inline error outside this range: *"We cover birth years 1988 to 2004 (ages 22–38 today)."*
- **Songs per year:** Exactly 3 Popular Songs + 1 Forgotten Gem. A song cannot appear in both slots — if it qualifies for the Forgotten Gem, exclude it from the Popular Songs list for that year.
- **Device era grouping:** Timeline years are grouped under device era headers (Walkman, Discman, iPod, iPhone, Streaming, AirPods). Groups are dynamic — they depend on which calendar years the user's ages 12–24 fall in. See `Project file/Device era dataset.md` for the full mapping, TypeScript constants, and `groupYearsByEra()` helper function.

---

## Rules — always follow these

1. **Read project docs first.** Before making any changes, read the relevant file in `Project file/`. Key documents: `MVP 1 scope.md`, `Data model.md`, `User flow.md`, `Product vision.md`, `Device era dataset.md`.

2. **Always write TypeScript.** Never use plain JavaScript. All files should be `.ts` or `.tsx`.

3. **Never touch the design system without asking.** If a change affects Tailwind config, shadcn/ui components, or global styles, ask Samantha before proceeding.

4. **Keep Samantha informed.** This is her first coding project. Always explain what you're doing and why in plain English before running commands or writing code.

5. **Never hardcode credentials.** All secrets go in `.env.local`. Never commit `.env.local`.

6. **Music is read-only.** iTunes Search API is used for album art and preview URLs — no user account, no credentials, no writing. Run `npx tsx scripts/enrich-itunes.ts` once to populate the database; the app reads cached values at runtime.

7. **No auth, ever, in MVP 1.** If something seems to require a user session or login, stop and flag it — it's probably out of scope.

8. **Pre-compute, don't calculate at runtime.** Forgotten Gem Scores, album art URLs, and preview URLs are computed/cached at seed/enrichment time. The app just reads from the database.

---

## Recommended build order

Start here if the project is empty:

1. Scaffold Next.js app with TypeScript and Tailwind
2. Install and configure Prisma
3. Connect to Supabase
4. Define the Prisma schema (four tables from the data model)
5. Write the seed script — start with Malaysia, birth year 1993
6. Cache Spotify preview URLs and album art at seed time
7. Build the timeline Server Action (birth year + country → grouped-by-year response)
8. Build the four screens in order: Landing → Input form → Timeline → Era detail
9. Add Framer Motion scroll reveal to the timeline
10. Deploy to Vercel

---

## Key documents

| Document | Location |
|---|---|
| Product vision | `Project file/Product vision.md` |
| MVP 1 scope | `Project file/MVP 1 scope.md` |
| Data model | `Project file/Data model.md` |
| User flow | `Project file/User flow.md` |
| Technology stack | `Project file/Technology stack.md` |
| Device era dataset | `Project file/Device era dataset.md` |
