// Cards/Chapters hotspot markup for the homepage's painted café-menu
// artwork — real buttons over the illustrated objects, per
// docs/CAFE-MENU-HOTSPOTS.md, never an invisible clickable region.
// Homepage-only for now; the customer scene keeps its plain counter.

window.KG = window.KG || {};

(function () {
  const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L22 9.2l-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.4-.6z" fill="#F6C445" stroke="#3D2B1F" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function star(cls) {
    return `<span class="menu-hotspot-star ${cls}" aria-hidden="true">${STAR_SVG}</span>`;
  }

  // Returns its own copy of the "cover" coordinate box (same sizing rules
  // as .cafe-stage) so the buttons line up with the painted objects at any
  // viewport size — but as a sibling of the real .cafe-stage, with a
  // higher z-index, so the hotspots sit above the dialogue UI without
  // having to raise the background/character/counter layers with them.
  function renderHotspots() {
    return `
      <div class="cafe-stage cafe-hotspot-layer" aria-hidden="false">
        <button type="button" class="menu-hotspot menu-hotspot-cards" data-action="open-collection" aria-label="Open kueh cards">
          <span class="menu-hotspot-outline" aria-hidden="true"></span>
          ${star("star-a")}${star("star-b")}${star("star-c")}
          <span class="menu-hotspot-badge">Cards</span>
        </button>
        <button type="button" class="menu-hotspot menu-hotspot-chapters menu-hotspot-chapters-home" data-action="open-chapters" aria-label="Open chapters">
          <span class="menu-hotspot-outline" aria-hidden="true"></span>
          ${star("star-a")}${star("star-b")}
          <span class="menu-hotspot-badge">Chapters</span>
        </button>
      </div>`;
  }

  // Compact always-visible fallback for narrow screens, where the painted
  // objects may be cropped or too small to reliably tap.
  function renderMobileNav() {
    return `
      <div class="cafe-mobile-nav">
        <button type="button" class="cafe-mobile-nav-btn" data-action="open-collection" aria-label="Open kueh cards">
          <img class="cafe-mobile-nav-icon" src="assets/ui/cards-menu-icon-v1.png" alt="">
          <span>Cards</span>
        </button>
        <button type="button" class="cafe-mobile-nav-btn" data-action="open-chapters" aria-label="Open chapters">
          <img class="cafe-mobile-nav-icon" src="assets/ui/chapters-menu-icon-v1.png" alt="">
          <span>Chapters</span>
        </button>
      </div>`;
  }

  window.KG.cafeMenu = { renderHotspots, renderMobileNav };
})();
