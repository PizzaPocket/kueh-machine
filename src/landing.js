import { attachRetroShapeClip, SMALL_RETRO_SHAPE_OPTS } from './atoms/retro-shape.js';
import { init as initBatikAccents } from './organisms/batik-accents.js';

const enterLink = document.querySelector('.hero-enter-link');
const briefLink = document.querySelector('.about-brief-link');

if (enterLink) attachRetroShapeClip(enterLink, SMALL_RETRO_SHAPE_OPTS);
if (briefLink) attachRetroShapeClip(briefLink, SMALL_RETRO_SHAPE_OPTS);

initBatikAccents();

const footerYear = document.getElementById('footer-year');
if (footerYear) footerYear.textContent = new Date().getFullYear();
