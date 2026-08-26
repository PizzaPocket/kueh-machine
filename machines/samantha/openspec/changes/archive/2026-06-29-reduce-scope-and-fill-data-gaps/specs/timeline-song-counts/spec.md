## ADDED Requirements

### Requirement: Timeline shows exactly 3 popular songs and 1 forgotten gem per year
Each year card in the timeline SHALL display exactly 3 popular songs and 1 forgotten gem. A song that qualifies for the forgotten gem slot SHALL NOT also appear in the popular songs list for that year.

#### Scenario: Popular songs list has exactly 3 entries
- **WHEN** `getTimeline()` returns data for any year
- **THEN** the `popularSongs` array for that year SHALL contain exactly 3 items

#### Scenario: Forgotten gem is distinct from popular songs
- **WHEN** `getTimeline()` returns data for any year
- **THEN** the song in the `forgottenGems` slot SHALL NOT share a `songId` with any song in `popularSongs` for that same year

#### Scenario: Era detail page renders 3 popular song cards
- **WHEN** the era detail page renders for any year
- **THEN** exactly 3 popular song cards are displayed
- **THEN** no 4th or 5th popular song card appears
