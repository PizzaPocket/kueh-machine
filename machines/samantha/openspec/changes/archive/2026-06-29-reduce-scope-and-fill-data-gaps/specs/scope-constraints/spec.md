## MODIFIED Requirements

### Requirement: Birth year input is bounded to supported range
The system SHALL restrict birth year input to the range 1988–2004 (inclusive). Any value outside this range SHALL be rejected with an inline validation message. The message SHALL read: "We cover birth years 1988 to 2004 (ages 22–38 today)."

#### Scenario: Valid birth year is accepted
- **WHEN** a user enters a birth year between 1988 and 2004 inclusive
- **THEN** the form proceeds to submission without a validation error

#### Scenario: Birth year too early is rejected
- **WHEN** a user enters a birth year of 1987 or earlier
- **THEN** the form SHALL display: "We cover birth years 1988 to 2004 (ages 22–38 today)"
- **THEN** the form SHALL not submit

#### Scenario: Birth year too late is rejected
- **WHEN** a user enters a birth year of 2005 or later
- **THEN** the form SHALL display: "We cover birth years 1988 to 2004 (ages 22–38 today)"
- **THEN** the form SHALL not submit
