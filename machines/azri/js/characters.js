// The playable roster. Six chefs, each paired with a distinct real kueh
// (Ang Ku Kueh and Ondeh-Ondeh are already spoken for as the monsters),
// all priced the same so unlocking any one of them is an equal amount of
// grinding — first-pass balance, tune CHARACTER_PRICE/coinChance
// (js/levels.js) together after real playtesting.
export const CHARACTER_PRICE = 150;

export const CHARACTERS = [
  { id: 'leonard', name: 'Dr Leonard Rizz', kueh: 'The Machine itself', texture: 'player', price: 0 },
  { id: 'kai', name: 'Chef Kai', kueh: 'Kueh Lapis', texture: 'char_kai', price: CHARACTER_PRICE },
  { id: 'mj', name: 'Chef MJ', kueh: 'Kueh Dadar', texture: 'char_mj', price: CHARACTER_PRICE },
  { id: 'liwei', name: 'Chef Li Wei', kueh: 'Kueh Salat', texture: 'char_liwei', price: CHARACTER_PRICE },
  { id: 'sam', name: 'Chef Sam', kueh: 'Kueh Bingka', texture: 'char_sam', price: CHARACTER_PRICE },
  { id: 'viki', name: 'Chef Viki', kueh: 'Pulut Hitam', texture: 'char_viki', price: CHARACTER_PRICE },
  { id: 'ken', name: 'Chef Ken', kueh: 'Kueh Ambon', texture: 'char_ken', price: CHARACTER_PRICE },
];

// Not in CHARACTERS — never ownable/selectable, purely a teaser card in
// the shop UI (see CharacterSelectScene.js).
export const MYSTERY_CHARACTER = { id: 'mystery', name: '???', texture: 'char_mystery', comingSoon: true };

export function getCharacterConfig(id) {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
