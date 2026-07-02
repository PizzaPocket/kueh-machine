// Organism: progressive enhancement only. The nav links themselves are
// static HTML in index.html and jump via native #anchor + CSS
// scroll-behavior: smooth — this just adds active-link highlighting as you
// scroll, using the same IntersectionObserver approach the page's existing
// reveal animation uses, but persistent rather than one-shot.

import { applyConicChrome } from '../tokens/chrome-metal.js';

export function init() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // JS can't set backgroundImage directly on the ::after pseudo-element
  // that actually paints the divider, so this writes to a custom property
  // on .site-nav instead, which ::after reads via var() (see site-nav.css)
  // — custom properties inherit down to pseudo-elements even though
  // direct style access doesn't reach them.
  //
  // center: 100px above the divider itself (which sits at the very top of
  // the page) rather than the divider's own tiny center — the visible
  // strip is then a small arc of a much larger circle, which reads as a
  // gentler curve of light across the line instead of a tight sweep
  // through a center that's only 2px away vertically.
  applyConicChrome(nav, { targetProperty: '--nav-divider-bg', center: '50% -100px' });

  if (!('IntersectionObserver' in window)) return;

  const links = Array.from(nav.querySelectorAll('a[data-nav-target]'));
  const linkForId = new Map(links.map((link) => [link.dataset.navTarget, link]));
  const sections = links
    .map((link) => document.getElementById(link.dataset.navTarget))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = linkForId.get(entry.target.id);
        if (!link) return;
        links.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}
