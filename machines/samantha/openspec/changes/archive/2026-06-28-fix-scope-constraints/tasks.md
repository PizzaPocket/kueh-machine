## 1. Fix age range in timeline logic

- [x] 1.1 In `src/lib/timeline.ts`, change `const startYear = birthYear + 10` to `birthYear + 12`
- [x] 1.2 In `src/lib/timeline.ts`, change `const endYear = birthYear + 25` to `birthYear + 24`

## 2. Restrict country dropdown to SG and MY

- [x] 2.1 In `src/app/onboarding/page.tsx`, replace the `COUNTRIES` array so it contains only `{ code: "MY", name: "Malaysia" }` and `{ code: "SG", name: "Singapore" }`

## 3. Restrict language dropdown to EN, ZH, YUE

- [x] 3.1 In `src/app/onboarding/page.tsx`, replace the `LANGUAGES` array so it contains only English (`en`), Mandarin (`zh`), and Cantonese (`yue`)

## 4. Verify

- [x] 4.1 Run the dev server and open the onboarding form — confirm only Malaysia and Singapore appear in the country dropdown
- [x] 4.2 Confirm only English, Mandarin, and Cantonese appear in the language dropdown
- [x] 4.3 Submit the form with birth year 1993, country MY, language en and verify the timeline shows exactly 13 year cards (2005–2017)
