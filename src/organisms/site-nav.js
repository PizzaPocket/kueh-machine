// Organism: progressive enhancement only. The nav links themselves are
// static HTML in index.html and jump via native #anchor + CSS
// scroll-behavior: smooth — this just adds active-link highlighting as you
// scroll, using the same IntersectionObserver approach the page's existing
// reveal animation uses, but persistent rather than one-shot.

import { applyConicChrome } from '../tokens/chrome-metal.js';

export function init() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // The nav is sticky, so a plain #anchor jump lands sections' content
  // partially underneath it. --site-nav-height feeds each linked section's
  // scroll-margin-top (site-nav.css) so native anchor scrolling (and
  // smooth-scroll) stops far enough down to clear the nav — measured
  // rather than hardcoded since the nav's own height already differs
  // between the desktop and the 640px-breakpoint mobile layout.
  const setNavHeight = () => {
    document.documentElement.style.setProperty('--site-nav-height', `${nav.offsetHeight}px`);
  };
  setNavHeight();
  window.addEventListener('resize', setNavHeight, { passive: true });

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

  // The nav links' own .text-sheen accent is registered in the blanket
  // sweep in chrome-accents.js, not here — this organism only owns the
  // divider chrome and the active-link highlighting below.
  const links = Array.from(nav.querySelectorAll('a[data-nav-target]'));

  if (!('IntersectionObserver' in window)) return;

  const linkForId = new Map(links.map((link) => [link.dataset.navTarget, link]));
  const sections = links
    .map((link) => document.getElementById(link.dataset.navTarget))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = linkForId.get(entry.target.id);
        if (!link) return;

        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
          return;
        }

        // Only the hero/kueh-of-day area above #brief has no nav link of
        // its own, so scrolling back up past #brief (the first observed
        // section) used to leave "Brief" stuck active forever — nothing
        // else was ever going to un-set it. boundingClientRect.top > 0
        // means this section exited the observed band by moving *down*
        // (i.e. we scrolled up above it), as opposed to scrolling on past
        // it into the next section, where the next section's own
        // intersecting entry claims "active" instead.
        if (entry.boundingClientRect.top > 0 && link.classList.contains('active')) {
          link.classList.remove('active');
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}
