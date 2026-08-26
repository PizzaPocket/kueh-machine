## ADDED Requirements

### Requirement: Timeline is filtered by the user's selected language
`getTimeline()` SHALL accept a `language` parameter and return only songs whose `Song.language` matches that value. Songs in other languages SHALL NOT appear in the results regardless of their regional popularity scores.

#### Scenario: English user sees only English songs
- **WHEN** `getTimeline()` is called with `language: "en"`
- **THEN** all returned `popularSongs` and `forgottenGems` have `song.language === "en"`
- **THEN** no Mandarin songs appear in the results

#### Scenario: Mandarin user sees only Mandarin songs
- **WHEN** `getTimeline()` is called with `language: "zh"`
- **THEN** all returned `popularSongs` and `forgottenGems` have `song.language === "zh"`
- **THEN** no English songs appear in the results

#### Scenario: Language parameter flows from URL to query
- **WHEN** a user reaches `/soundtrack?birthYear=1993&country=MY&language=zh`
- **THEN** the page calls `getTimeline(1993, "MY", "zh")`
- **THEN** the timeline contains only Mandarin songs

### Requirement: Onboarding form offers English and Mandarin only
The language selection on the onboarding form SHALL present exactly two options: English (`en`) and Mandarin (`zh`). The Cantonese (`yue`) option SHALL NOT appear in MVP 1.

#### Scenario: Language options on onboarding form
- **WHEN** the user views the onboarding/input form
- **THEN** they see two language choices: "English" and "Mandarin (华语)"
- **THEN** there is no Cantonese option visible

#### Scenario: Selected language is passed to the timeline
- **WHEN** a user selects "Mandarin" and submits the form
- **THEN** the URL navigated to includes `language=zh`
