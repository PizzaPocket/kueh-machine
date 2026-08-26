# Device Era Dataset

## Overview

Timeline groupings are dynamically assigned based on the user's birth year.

The system maps each calendar year (ages 12–24) to the dominant music listening device of that period. Groups are determined by which device eras the user's formative years overlap with — so every user sees a personalised set of era headers.

---

## Device Eras

| Era ID | Label | Calendar Years | Device | Tagline |
|---|---|---|---|---|
| `vinyl` | The Vinyl Era | Before 1990 | Record player / Radio | *Before music was portable* |
| `walkman` | The Walkman Era | 1990–1996 | Sony Walkman (cassette) | *Rewind, flip, repeat* |
| `discman` | The Discman Era | 1997–2000 | Discman / CD Player | *Handle with care* |
| `ipod` | The iPod Era | 2001–2006 | iPod / MP3 Player | *1,000 songs in your pocket* |
| `iphone` | The iPhone Era | 2007–2011 | iPhone / Early streaming | *Everything changed* |
| `streaming` | The Streaming Era | 2012–2017 | Spotify / Earphones | *All the music, all the time* |
| `airpods` | The AirPods Era | 2018–present | AirPods / Wireless buds | *No wires, no limits* |

---

## Image Assets

Each era has a header image for the grouping UI. Images should be illustrative and evocative — device-focused, warm and nostalgic in tone.

| Era ID | Image filename | Description |
|---|---|---|
| `vinyl` | `era-vinyl.jpg` | Vinyl record on a turntable, warm amber lighting |
| `walkman` | `era-walkman.jpg` | Sony Walkman with orange foam headphones and a cassette tape |
| `discman` | `era-discman.jpg` | Silver Discman with CD visible through the lid, skip protection button visible |
| `ipod` | `era-ipod.jpg` | Classic white iPod with click wheel, white earbuds coiled beside it |
| `iphone` | `era-iphone.jpg` | Early iPhone (black, flat back) with earbuds plugged in |
| `streaming` | `era-streaming.jpg` | Smartphone with Spotify open, white earphones, clean desk |
| `airpods` | `era-airpods.jpg` | AirPods in open case on a minimal surface, soft light |

> **Image path:** `/public/images/device-eras/[filename]`
> **Recommended dimensions:** 1200 × 400px (wide banner crop)
> **Format:** JPG or WebP

---

## Grouping Logic

### How it works

1. User enters birth year
2. System calculates formative calendar years: `birth_year + 12` to `birth_year + 24`
3. System checks which device eras those calendar years overlap with
4. Years are grouped under matching era headers
5. Each group renders its era image as the section header

### Assignment rule

Each calendar year is assigned to exactly one era based on the ranges above.
If a year falls on a boundary, assign to the newer era.

### Example — Born 1988

Formative years: **2000–2012**

| Group | Era | Years covered |
|---|---|---|
| 1 | Discman Era | 2000 |
| 2 | iPod Era | 2001–2006 |
| 3 | iPhone Era | 2007–2011 |
| 4 | Streaming Era | 2012 |

### Example — Born 1995

Formative years: **2007–2019**

| Group | Era | Years covered |
|---|---|---|
| 1 | iPhone Era | 2007–2011 |
| 2 | Streaming Era | 2012–2017 |
| 3 | AirPods Era | 2018–2019 |

### Example — Born 2000

Formative years: **2012–2024**

| Group | Era | Years covered |
|---|---|---|
| 1 | Streaming Era | 2012–2017 |
| 2 | AirPods Era | 2018–2024 |

---

## TypeScript Reference

```typescript
export type EraId =
  | 'vinyl'
  | 'walkman'
  | 'discman'
  | 'ipod'
  | 'iphone'
  | 'streaming'
  | 'airpods'

export interface DeviceEra {
  id: EraId
  label: string
  tagline: string
  startYear: number
  endYear: number       // use 9999 for open-ended (airpods era)
  imagePath: string
  imageAlt: string
}

export const DEVICE_ERAS: DeviceEra[] = [
  {
    id: 'vinyl',
    label: 'The Vinyl Era',
    tagline: 'Before music was portable',
    startYear: 0,
    endYear: 1989,
    imagePath: '/images/device-eras/era-vinyl.jpg',
    imageAlt: 'Vinyl record on a turntable',
  },
  {
    id: 'walkman',
    label: 'The Walkman Era',
    tagline: 'Rewind, flip, repeat',
    startYear: 1990,
    endYear: 1996,
    imagePath: '/images/device-eras/era-walkman.jpg',
    imageAlt: 'Sony Walkman with cassette tape and orange foam headphones',
  },
  {
    id: 'discman',
    label: 'The Discman Era',
    tagline: 'Handle with care',
    startYear: 1997,
    endYear: 2000,
    imagePath: '/images/device-eras/era-discman.jpg',
    imageAlt: 'Silver Discman with a CD visible through the lid',
  },
  {
    id: 'ipod',
    label: 'The iPod Era',
    tagline: '1,000 songs in your pocket',
    startYear: 2001,
    endYear: 2006,
    imagePath: '/images/device-eras/era-ipod.jpg',
    imageAlt: 'Classic white iPod with click wheel and white earbuds',
  },
  {
    id: 'iphone',
    label: 'The iPhone Era',
    tagline: 'Everything changed',
    startYear: 2007,
    endYear: 2011,
    imagePath: '/images/device-eras/era-iphone.jpg',
    imageAlt: 'Early iPhone with earbuds plugged in',
  },
  {
    id: 'streaming',
    label: 'The Streaming Era',
    tagline: 'All the music, all the time',
    startYear: 2012,
    endYear: 2017,
    imagePath: '/images/device-eras/era-streaming.jpg',
    imageAlt: 'Smartphone with Spotify open and white earphones',
  },
  {
    id: 'airpods',
    label: 'The AirPods Era',
    tagline: 'No wires, no limits',
    startYear: 2018,
    endYear: 9999,
    imagePath: '/images/device-eras/era-airpods.jpg',
    imageAlt: 'AirPods in open case on a minimal surface',
  },
]

/**
 * Returns the device era for a given calendar year
 */
export function getEraForYear(year: number): DeviceEra {
  return DEVICE_ERAS.find(
    (era) => year >= era.startYear && year <= era.endYear
  )!
}

/**
 * Groups an array of formative years into device era buckets
 * Input: birth year
 * Output: ordered array of { era, years[] }
 */
export function groupYearsByEra(birthYear: number): { era: DeviceEra; years: number[] }[] {
  const formativeYears = Array.from({ length: 13 }, (_, i) => birthYear + 12 + i)

  const grouped = new Map<EraId, number[]>()

  for (const year of formativeYears) {
    const era = getEraForYear(year)
    if (!grouped.has(era.id)) grouped.set(era.id, [])
    grouped.get(era.id)!.push(year)
  }

  return Array.from(grouped.entries()).map(([eraId, years]) => ({
    era: DEVICE_ERAS.find((e) => e.id === eraId)!,
    years,
  }))
}
```

---

## Seeding Notes

- Images are static assets — place in `/public/images/device-eras/`
- No database table needed for device eras — the mapping is handled entirely in code via the `DEVICE_ERAS` constant
- Era grouping is computed client-side at render time, not stored in the DB

---

## Future Extensions

- Add sub-regional device nuances (e.g. MiniDisc was bigger in SG/MY than in the West)
- Add era-specific colour palette / visual theme per group header
- Add a short era description paragraph for context
