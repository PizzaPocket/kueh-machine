## MODIFIED Requirements

### Requirement: Song catalogue covers 2000–2026 for English and Mandarin
The database SHALL contain both English (`en`) and Mandarin (`zh`) songs with `peakYearRegional` values covering every year from 2000 to 2026, for both `MY` and `SG`. Each year SHALL have a minimum of 4 songs per language (enough to fill 3 popular slots + 1 forgotten gem slot without overlap).

#### Scenario: Each year 2000–2026 has enough English songs
- **WHEN** `getTimeline()` is called with `language: "en"` and a birth year whose formative range includes any year from 2000 to 2026
- **THEN** that year returns at least 3 popular songs and 1 distinct forgotten gem

#### Scenario: Each year 2000–2026 has enough Mandarin songs
- **WHEN** `getTimeline()` is called with `language: "zh"` and a birth year whose formative range includes any year from 2000 to 2026
- **THEN** that year returns at least 3 popular songs and 1 distinct forgotten gem

#### Scenario: Forgotten gem slot is fillable for 2018–2026
- **WHEN** `getTimeline()` is called with any supported language for years 2018–2026
- **THEN** each year produces a forgotten gem that is not among the 3 popular songs
