// Organism: progressive enhancement only. The nav links themselves are
// static HTML in index.html and jump via native #anchor + CSS
// scroll-behavior: smooth — this just adds active-link highlighting as you
// scroll, using the same IntersectionObserver approach the page's existing
// reveal animation uses, but persistent rather than one-shot.

export function init() {
  const nav = document.querySelector('.site-nav');
  if (!nav || !('IntersectionObserver' in window)) return;

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
