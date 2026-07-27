# Kueh
**by Ken — a dream-builder**

## Concept

Kueh is a wealth product discovery and portfolio-building tool. Every investment
product — a bond fund, a structured note, an equity fund, a private markets
allocation — is represented as a kueh. Each kueh's real, physical traits (its
layers, its texture, how long it takes to make, how it's eaten) are chosen to
map onto the product's actual attributes: risk, time horizon, liquidity, and
complexity. A portfolio is a "kueh box" — a curated combination of kuehs
assembled to fit a client's goals and risk appetite.

The metaphor is meant to carry real information, not just decorate the
surface. A client answers a short, honest questionnaire on risk comfort, time
horizon, and goals; that unlocks the kuehs suited to them (mirroring how real
wealth desks gate more complex or illiquid products behind a suitability
check); they build a box; and the box's aggregate risk spread, horizon mix,
and rough return range are computed live from the underlying data and
visualised as the assembled spread.

The app runs as a funnel: a marketing landing page sells the concept and ends
every section in a call to action, a lightweight sign-up captures who's
asking, a dedicated questionnaire page profiles them, and only then do they
land in the gallery and box-builder.

Built for kuehmachine.com — the connection is about as direct as it gets:
this literally *is* a kueh, engineered.

## Look and feel

Private-bank minimal. Restrained, editorial, generous whitespace. Kueh
imagery is rendered abstractly as color-blocked cross-sections rather than
illustrated — the palette borrows real kueh colors (pandan green, gula
melaka brown, glutinous cream) but stays muted and controlled, with a brass
accent standing in for the "premium wealth desk" register. Fraunces (serif)
for headlines, Inter (sans) for body and UI.

## Features

- [x] A one-page marketing landing: hero, "how it works," a try-it sandbox,
      a kueh-by-kueh comparison graphic, and a risk/return performance chart
      — each section ending in a call to action
- [x] A drag-and-drop (or tap-to-add, for touch) sandbox on the landing page
      — build a taste of a box with all six kuehs, no sign-up required, with
      a live mini profile computed the same way the real box is
- [x] A sign-up modal (name + email) gating entry into the questionnaire
- [x] A dedicated questionnaire page — three questions on risk comfort, time
      horizon, and goals, computing a client risk profile
- [x] Six kueh product archetypes, each with a real financial data model
      (risk, liquidity, complexity, horizon, return range)
- [x] Tiered unlock system — simpler kuehs are always visible; more complex
      or illiquid ones unlock progressively, with the most complex requiring
      an explicit acknowledgment
- [x] A browsable gallery with locked/unlocked states and a detail view per
      kueh (plain-language explanation + who it suits)
- [x] A kueh box builder — add kuehs, adjust their relative allocation
- [x] A live portfolio profile — weighted risk spread, horizon mix, and
      return range, computed from whatever's in the box
- [x] Data visualisation built to the house dataviz standard: a validated,
      colorblind-safe categorical palette shared by the comparison graphic
      and the risk/return chart, with direct labels, a legend, and hover
      tooltips
- [x] Responsive layout with a mobile fallback (box panel stacks below the
      gallery instead of sitting in a sticky sidebar; comparison table
      scrolls horizontally on small screens)

## Running it

No build step, no install. Open `index.html` in a browser.

## Files

```
index.html          page structure
css/style.css        all styling
js/data.js           the six kueh archetypes and their underlying data
js/app.js            questionnaire logic, unlock gating, box + profile math
```
