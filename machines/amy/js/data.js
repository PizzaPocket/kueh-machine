// Kueh dataset — 7 kueh, each with its own illustrated PNG (see assets/image-kueh-*.png).
// Drives both the reveal card copy and the image shown in app.js.
const KUEH_DATA = [
  {
    id: "ang-ku-kueh",
    name: "Ang Ku Kueh",
    nameZh: "红龟粿",
    nameJa: "アンクークエ",
    description:
      "A soft, tortoise-shell-shaped glutinous rice cake, dyed red and filled with sweet mung bean or peanut.",
    taste: "Soft and slightly sticky, with a mild, earthy sweetness.",
    history:
      "The tortoise shape symbolises longevity in Chinese tradition, making it a fixture at birthdays and prayer offerings.",
    image: "./assets/image-kueh-angkukueh.png",
    plushieImage: "./assets/image-plushie-angkukueh.png"
  },
  {
    id: "kueh-tutu",
    name: "Kueh Tutu",
    nameZh: "嘟嘟糕",
    nameJa: "クエ・トゥトゥ",
    description:
      "Delicate steamed rice flour cakes pressed into small moulds, filled with ground peanut or grated coconut and palm sugar.",
    taste: "Light and slightly grainy, with a warm, nutty sweetness at the centre.",
    history:
      "Named for the whistling “tutu” sound its bamboo steamer once made — hawkers sold it fresh off the cart, sound and all.",
    image: "./assets/image-kueh-kuehtutu.png",
    plushieImage: "./assets/image-plushie-kuehtutu.png"
  },
  {
    id: "ondeh-ondeh",
    name: "Ondeh-Ondeh",
    nameZh: "椰丝球",
    nameJa: "オンデオンデ",
    description:
      "Bite-sized glutinous rice balls rolled in fresh grated coconut, hiding a molten gula melaka centre.",
    taste: "Chewy and coconutty, with a warm burst of palm-sugar sweetness.",
    history:
      "Said to “jump” in the pot when they're ready to eat — the Malay name literally means ‘round and rolling’.",
    image: "./assets/image-kueh-ondehondeh.png",
    plushieImage: "./assets/image-plushie-ondehondeh.png"
  },
  {
    id: "chwee-kueh",
    name: "Chwee Kueh",
    nameZh: "水粿",
    nameJa: "チュイクエ",
    description:
      "Small steamed rice cakes shaped like shallow white bowls, crowned with stir-fried preserved radish.",
    taste: "Delicately savoury and rice-soft, cut through by the salty crunch of chai poh on top.",
    history:
      "‘Chwee’ means ‘water’ in Teochew, a nod to the wet rice batter steamed fresh each morning at hawker stalls.",
    image: "./assets/image-kueh-chweekueh.png",
    plushieImage: "./assets/image-plushie-chweekueh.png"
  },
  {
    id: "putu-piring",
    name: "Putu Piring",
    nameZh: "椰糖米糕",
    nameJa: "プトゥ・ピリン",
    description:
      "Steamed rice flour discs filled with melted gula melaka, served on a square of pandan leaf with fresh coconut.",
    taste: "Soft and fluffy, giving way to a molten pocket of caramel-like palm sugar.",
    history:
      "‘Piring’ means ‘saucer’ — each one is steamed to order in a small round mould over a cloth-topped pot.",
    image: "./assets/image-kueh-putupiring.png",
    plushieImage: "./assets/image-plushie-putupiring.png"
  },
  {
    id: "kueh-kosui",
    name: "Kueh Kosui",
    nameZh: "黑糖粿",
    nameJa: "クエ・コスイ",
    description:
      "A translucent, jelly-like disc of rice flour and gula melaka, unmoulded onto a bed of grated coconut.",
    taste: "Soft and bouncy, with a deep caramel sweetness balanced by the coconut's savoury bite.",
    history:
      "Traditionally set in small individual moulds, giving each disc its signature scalloped edge.",
    image: "./assets/image-kueh-kuehkosui.png",
    plushieImage: "./assets/image-plushie-kuehkosui.png"
  },
  {
    id: "kueh-bahulu",
    name: "Kueh Bahulu",
    nameZh: "娘惹蛋糕",
    nameJa: "クエ・バフル",
    description:
      "A humble sponge cake of egg, sugar and flour, baked golden in small fish- or flower-shaped moulds.",
    taste: "Light, airy and faintly eggy, with a delicate crisp edge where it meets the mould.",
    history:
      "Once baked over charcoal one mould at a time, it's a festive staple served during Hari Raya visits.",
    image: "./assets/image-kueh-kuehbahulu.png",
    plushieImage: "./assets/image-plushie-kuehbahulu.png"
  }
];
