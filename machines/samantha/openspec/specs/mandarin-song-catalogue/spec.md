# Spec: Mandarin Song Catalogue

## Purpose

Defines the data requirements for Mandarin-language songs in the database. Covers the `language` field on `Song` records, and the song catalogue for MY and SG spanning 2000–2026 for both English and Mandarin.

---

## Requirements

### Requirement: Song records have a language field
Every `Song` record SHALL have a `language` field storing an ISO 639-1 code (`"en"` for English, `"zh"` for Mandarin). Existing songs default to `"en"`. This field is required and non-nullable.

#### Scenario: Existing English songs have language set
- **WHEN** the seed script runs
- **THEN** all pre-existing English songs have `language: "en"` in the database

#### Scenario: New Mandarin songs have language set
- **WHEN** the seed script runs
- **THEN** all Mandarin songs have `language: "zh"` in the database

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
