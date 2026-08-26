/* Kueh Lupis — stage 6 fun fact copy (DRAFT, NOT FINAL)
   Reused/adapted from the lupis entry in the Kueh Fortune Machine
   project (facts only — Natalia dropped the wisdom/fortune line for
   this app, just wants a fun fact on completion). */

const LUPIS_FACTS = [
  "Lupis is glutinous rice packed tightly into a banana-leaf triangle and boiled for hours, which is what compresses it into that dense, chewy texture.",
  "It's traditionally sliced and served with grated coconut and a drizzle of gula melaka syrup, not eaten plain."
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
