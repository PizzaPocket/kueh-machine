# Spec: Scope Constraints

## Purpose

Defines the hard constraints on what the system accepts as valid input — specifically which countries, languages, and age ranges are supported. These constraints are enforced at the UI level (no option exists for unsupported values) and at the server level.

---

## Requirements

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

---

### Requirement: Age range for timeline
The system SHALL generate a timeline covering ages 12–24 (inclusive), corresponding to calendar years `birthYear + 12` through `birthYear + 24` (13 years total).

#### Scenario: Timeline covers exactly 13 years
- **WHEN** a user submits their birth year
- **THEN** the timeline SHALL contain exactly 13 year entries, from `birthYear + 12` to `birthYear + 24`

#### Scenario: No years outside 12–24 age range appear
- **WHEN** the timeline is rendered
- **THEN** no year card for age 10, 11, or 25 SHALL appear

---

### Requirement: Supported countries
The system SHALL restrict country selection to Singapore (SG) and Malaysia (MY) only. No other country SHALL be selectable in the onboarding form.

#### Scenario: Only SG and MY appear in country dropdown
- **WHEN** a user opens the country selector on the onboarding form
- **THEN** exactly two options SHALL be shown: Singapore and Malaysia

#### Scenario: Unsupported country cannot be submitted
- **WHEN** a user attempts to submit with any country other than SG or MY
- **THEN** the system SHALL not allow the selection (the option does not exist in the UI)

---

### Requirement: Supported languages
The system SHALL restrict language selection to English (`en`), Mandarin (`zh`), and Cantonese (`yue`) only. No other language SHALL be selectable in the onboarding form.

#### Scenario: Only three languages appear in language dropdown
- **WHEN** a user opens the language selector on the onboarding form
- **THEN** exactly three options SHALL be shown: English, Mandarin, and Cantonese

#### Scenario: Unsupported language cannot be submitted
- **WHEN** a user attempts to select a language outside en/zh/yue
- **THEN** the system SHALL not allow the selection (the option does not exist in the UI)
