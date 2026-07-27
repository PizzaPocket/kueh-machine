/* ------------------------------------------------------------------
   KUEH DATA MODEL

   Every kueh below is a product archetype. The numbers are what
   drive the whole app — the visuals are a readout of this data,
   not decoration on top of it.

   Scales used throughout (all 1–5 unless noted):
     risk        1 = capital preservation, 5 = high risk of loss
     liquidity   1 = long lock-up / hard to exit, 5 = exit any time
     complexity  1 = easy to explain in one sentence, 5 = needs a specialist
     horizon     in years, expressed as [min, max]
     returnRange annual %, expressed as [min, max]

   unlockTier gates visibility in the gallery:
     0 = always visible
     2 = needs "balanced" risk comfort or higher
     3 = needs "growth" risk comfort + longer horizon
     4 = needs the top risk tier AND an explicit complexity
         acknowledgment (mirrors real suitability gating on
         structured / illiquid products)
------------------------------------------------------------------- */

const KUEHS = [
  {
    id: "bahulu",
    kuehName: "Kueh Bahulu",
    label: "Steady Income",
    technicalTerm: "Short-duration bond fund",
    unlockTier: 0,
    risk: 1,
    liquidity: 5,
    complexity: 1,
    horizon: [1, 2],
    returnRange: [2.5, 4],
    palette: ["#E9DCB8", "#D8C48F"],
    chartColor: "#C99A2E",
    blurb: "A light, honest sponge cake — eaten fresh, doesn't keep. Steady Income is the same: short-term bonds that mature quickly, cost you almost nothing to understand, and let you get your money back out whenever you need to.",
    suits: "Clients who want their cash working harder than it would sitting still, without tying it up or taking on real risk.",
    layers: [
      { name: "Short-term bonds", share: 1, color: "#DCC791" }
    ]
  },
  {
    id: "salat",
    kuehName: "Kueh Salat",
    label: "Protected Growth",
    technicalTerm: "Capital-protected structured note",
    unlockTier: 0,
    risk: 2,
    liquidity: 2,
    complexity: 3,
    horizon: [3, 5],
    returnRange: [3, 7],
    palette: ["#E4DAB0", "#5C7A54"],
    chartColor: "#2F9459",
    blurb: "Two honest layers: a firm sticky-rice base, and a pandan custard top. Your original investment sits protected in the base layer at maturity, while the top layer gives you a share of market upside — capped, but real.",
    suits: "Clients who want to take a real step toward growth, but aren't ready to put their principal at risk to do it.",
    layers: [
      { name: "Protected base", share: 0.55, color: "#E4DAB0" },
      { name: "Growth layer", share: 0.45, color: "#5C7A54" }
    ]
  },
  {
    id: "dadar",
    kuehName: "Kueh Dadar",
    label: "Balanced Mix",
    technicalTerm: "Multi-asset balanced fund",
    unlockTier: 2,
    risk: 3,
    liquidity: 4,
    complexity: 2,
    horizon: [3, 7],
    returnRange: [4, 8],
    palette: ["#4F7A52", "#EDE6D6"],
    chartColor: "#12968C",
    blurb: "A pandan crepe rolled around a coconut filling — two components, deliberately combined in one bite. Balanced Mix blends stocks and bonds in a single fund, so no single market swing defines your outcome.",
    suits: "Clients who want one straightforward vehicle that spreads risk across asset classes, without having to manage the mix themselves.",
    layers: [
      { name: "Bonds", share: 0.5, color: "#EDE6D6" },
      { name: "Equities", share: 0.5, color: "#4F7A52" }
    ]
  },
  {
    id: "angku",
    kuehName: "Ang Ku Kueh",
    label: "Long-Term Growth",
    technicalTerm: "Growth equity fund",
    unlockTier: 3,
    risk: 4,
    liquidity: 5,
    complexity: 2,
    horizon: [7, 10],
    returnRange: [5, 12],
    palette: ["#A8324A", "#7A2338"],
    chartColor: "#B23A52",
    blurb: "Shaped like a tortoise for longevity, colored red for prosperity — Ang Ku Kueh is a straight bet on growth, held with patience. Long-Term Growth is a plain equity fund: it can move a lot year to year, but it's traded daily, so you're never locked in.",
    suits: "Clients with a long runway who are comfortable riding out volatility in exchange for the market's long-run returns.",
    layers: [
      { name: "Global equities", share: 1, color: "#A8324A" }
    ]
  },
  {
    id: "ondeh",
    kuehName: "Ondeh-Ondeh",
    label: "Bonus Income",
    technicalTerm: "Yield-enhancement autocallable note",
    unlockTier: 4,
    risk: 4,
    liquidity: 1,
    complexity: 5,
    horizon: [1, 3],
    returnRange: [6, 10],
    palette: ["#4A6741", "#D9A441"],
    chartColor: "#C2632A",
    blurb: "A glutinous rice ball hiding liquid gula melaka — it only delivers if you bite it exactly right. Bonus Income pays an enhanced coupon if the market behaves within a set range, but the payout — and your principal — depends entirely on hitting those conditions.",
    suits: "Clients who understand and accept conditional payoffs, in exchange for income well above what a plain bond would pay.",
    layers: [
      { name: "Note principal", share: 0.7, color: "#4A6741" },
      { name: "Conditional coupon", share: 0.3, color: "#D9A441" }
    ]
  },
  {
    id: "bakchang",
    kuehName: "Bak Chang",
    label: "Private Reserve",
    technicalTerm: "Private markets / alternatives allocation",
    unlockTier: 4,
    risk: 5,
    liquidity: 1,
    complexity: 4,
    horizon: [7, 10],
    returnRange: [8, 15],
    palette: ["#3B4A2E", "#8A6B3D"],
    chartColor: "#8C4F86",
    blurb: "Wrapped in leaves and steamed for hours, opened only when it's ready — Bak Chang can't be rushed. Private Reserve puts capital into private markets: sealed away for years, with no daily price and no early exit, in exchange for a higher target return.",
    suits: "Clients who can afford to lock capital away for the long run and want exposure the public markets don't offer.",
    layers: [
      { name: "Private markets", share: 1, color: "#3B4A2E" }
    ]
  }
];

/* Risk-tier labels used across the questionnaire and gallery gating */
const RISK_TIERS = {
  1: "Conservative",
  2: "Balanced",
  3: "Growth",
  4: "Aggressive"
};
