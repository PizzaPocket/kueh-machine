## ADDED Requirements

### Requirement: Song records have a language field
Every `Song` record SHALL have a `language` field storing an ISO 639-1 code (`"en"` for English, `"zh"` for Mandarin). Existing songs default to `"en"`. This field is required and non-nullable.

#### Scenario: Existing English songs have language set
- **WHEN** the seed script runs
- **THEN** all pre-existing English songs have `language: "en"` in the database

#### Scenario: New Mandarin songs have language set
- **WHEN** the seed script runs
- **THEN** all Mandarin songs have `language: "zh"` in the database

### Requirement: Mandarin song catalogue covers 2000–2017 for MY and SG
The database SHALL contain a curated set of Mandarin-language songs with `language: "zh"`, each having a `SongRegion` entry for both `MY` and `SG`, with `peakYearRegional` values spanning 2000–2017. The catalogue SHALL include well-known artists popular in Singapore and Malaysia such as 周杰伦 (Jay Chou), 五月天, 林俊傑, 蔡依林, S.H.E, 王力宏, 梁静茹, 孙燕姿, and 邓紫棋.

#### Scenario: Each year in 2000–2017 has Mandarin songs available
- **WHEN** `getTimeline()` is called with `language: "zh"` and a birth year that produces a formative range covering any year from 2000 to 2017
- **THEN** at least one Mandarin song is returned for that year

#### Scenario: Forgotten gem slot is fillable for Mandarin users
- **WHEN** `getTimeline()` is called with `language: "zh"`
- **THEN** each year with 6 or more Mandarin songs produces a distinct forgotten gem (not one of the 5 popular songs)

### Requirement: English catalogue covers 2016 and 2017
The database SHALL contain English-language songs with `peakYearRegional` of 2016 and 2017 mapped to `MY` and `SG`, providing at least 6 songs per year so the popular + forgotten gem slots can be filled.

#### Scenario: 2016 and 2017 are not empty for English users
- **WHEN** `getTimeline()` is called with `language: "en"` and a birth year that includes 2016 or 2017 in the formative range
- **THEN** both years return populated song lists (minimum 1 popular song and 1 forgotten gem each)
