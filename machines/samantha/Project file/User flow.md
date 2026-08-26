# User Flow

## Overview

Anonymous, single-session experience. No login. No saved data.

The user walks in, explores, and leaves. Nothing persists.

---

## Flow

### 1. User arrives
Lands on the homepage.

---

### 2. Landing screen
Hero message and a single CTA.

**Action:** Tap "Take me back"

---

### 3. Input form
Three fields:
- Birth year
- Country (Singapore or Malaysia only)
- Language (English, Mandarin, or Cantonese)

**Action:** Submit form

**Decision: Input valid?**
- No → return to input form with error state
- Yes → proceed

---

### 4. Query database
System calculates formative years (birth year + 12 to birth year + 24).

Fetches:
- Songs and forgotten gems per year filtered by country (SG or MY) and language (English / Mandarin / Cantonese)
- Memory triggers filtered by country and year range

---

### 5. Timeline screen
Era cards displayed for ages 12–24, one card per year (13 cards total).

Each card shows:
- Year and age
- Life stage label
- 2–3 song titles
- 2–3 memory triggers

Cards reveal on scroll via Framer Motion.

**Navigation options:**
- Tap any era card → Era detail screen
- Tap back → Input form

---

### 6. Era detail screen
Full nostalgia view for one year.

Sections:
- Memory triggers (text chips, grouped by category)
- Popular songs
- Forgotten gems (highlighted section)

Each song shows:
- Spotify album art
- Title and artist
- Play button for 30s preview

**Navigation options:**
- Tap a song → Spotify preview plays inline
- Tap back → Timeline screen

---

### 7. Spotify preview plays
30-second preview plays inline.
No Spotify login required.

---

### 8. Continue exploring?
- Yes → back to timeline screen
- Done → user closes tab

---

### 9. Session ends
User closes the tab.

No data is saved.
No account created.
No trace left.

---

## Decision Points

| Decision | Yes path | No path |
|---|---|---|
| Input valid? | Query DB → Timeline | Back to input form |
| Continue exploring? | Back to timeline | Close tab → session ends |

---

## Back Navigation

| From | Back goes to |
|---|---|
| Timeline | Input form |
| Era detail | Timeline |

---

## What never happens

- Login prompt
- "Save this song" button
- Email capture
- Push notification opt-in
- Account creation
- Data persistence of any kind
