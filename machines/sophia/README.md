# Cat Scan

By Sophia Himawan — kuehmachine.com

## Concept

Cat Scan is a shared neighborhood map where anyone can drop a pin for a stray cat they've spotted, give it a profile, and add their own name for it — so one cat can be "Uncle Roti" to one neighbor and "The Mayor" to another, both credited. There's no single correct name. Signed-in visitors contribute to the shared map; signed-out visitors can still use the full feature locally in their browser. Whoever spots a cat first gets permanent "first sighting" credit, like naming a star. Cat Scan is a community memory-keeping system built by many hands.

## Look and feel

Pixel game world, Neko Atsume energy. The underlying map is a real, plain street map (Leaflet + OpenStreetMap) — no filters, no restyling, left exactly as-is. Everything layered on top of it is where the personality lives: pixel-bordered dialog boxes, a chunky pixel font for headings, a cozy warm palette (cream, terracotta, sage, brown), and paw-print pins.

## Feature checklist

**MVP (built first)**
- [x] Interactive map, click anywhere to drop a pin
- [x] Cat profile: photo, vibe check tag, location
- [x] Shared naming — anyone can add another name, credited to them
- [x] First Sighting credit — permanent "discovered by" record
- [x] Sightings/comments feed per cat
- [x] Data persists in the browser (local storage)
- [x] Signed-in contributions sync through the shared Supabase project
- [x] New shared photos use Supabase Storage

**Backlog (add later if there's time)**
- [ ] Farewell Page — memorial view for a cat that's passed or disappeared
- [ ] Feeding Relay — lightweight "someone fed him this morning" indicator
- [ ] Cat of the Month — community vote, just for fun
