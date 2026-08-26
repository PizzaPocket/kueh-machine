// Derives the collection page from completed chapters / unlocked cards, and
// provides the reusable .character-card component (frame + name + portrait
// + story + tags) used both there and in the chapter's unlock-reveal
// sequence.
//
// No Pokémon-style frame, symbols, terminology, or rarity system — this is
// an original cozy collection display.

window.KG = window.KG || {};

(function () {
  // Only one or two chapters exist so far, but the album is being designed
  // for a full set — pad the grid with generic locked placeholders up to
  // this count until more characters ship.
  const TOTAL_CARD_SLOTS = 6;

  function getAllCards() {
    return Object.keys(window.KG.chapters).map((chapterId) => {
      const chapter = window.KG.chapters[chapterId];
      return { chapterId, ...chapter.card };
    });
  }

  function isUnlocked(save, cardId) {
    return save.unlockedCards.indexOf(cardId) !== -1;
  }

  // Renders the front of a collectible card: decorative frame as a CSS
  // background, everything else (name, portrait, story, tags) as real HTML
  // positioned above it per the percentage placement map.
  function renderCharacterCard(card, options) {
    const opts = options || {};
    const extraClass = opts.extraClass ? " " + opts.extraClass : "";
    const tagName = opts.interactive ? "button" : "article";
    const interactionAttrs = opts.interactive
      ? ` type="button" data-action="preview-card" data-card-id="${card.id}"`
      : ` role="group"`;
    const tagsHtml = card.tags
      .map((tag) => `<li class="character-card-tag">${tag}</li>`)
      .join("");

    const style = `background-image:url('${card.frame}')`;

    return `
      <${tagName} class="character-card${extraClass}" style="${style}"${interactionAttrs} aria-label="${opts.interactive ? `Enlarge ${card.name} card` : `${card.name} collectible card`}">
        <h3 class="character-card-name">${card.name}</h3>
        <div class="character-card-portrait-area">
          <img src="${card.portrait}" alt="${card.portraitAlt || ""}" class="character-card-portrait">
        </div>
        <div class="character-card-story"><p class="character-card-story-inner">${card.story}</p></div>
        <ul class="character-card-tags">${tagsHtml}</ul>
      </${tagName}>`;
  }

  function renderCardPreview(cardId) {
    const card = getAllCards().find((item) => item.id === cardId);
    if (!card) return "";
    return `
      <div class="card-preview-overlay" role="dialog" aria-modal="true" aria-label="${card.name} enlarged card">
        <button type="button" class="card-preview-dim" data-action="close-card-preview" aria-label="Close enlarged card"></button>
        <div class="card-preview-panel">
          <button type="button" class="card-preview-close" data-action="close-card-preview" aria-label="Close enlarged card">×</button>
          ${renderCharacterCard(card, { extraClass: "card-preview-card" })}
        </div>
      </div>`;
  }

  // Shows the actual character cards directly on this one page — no
  // separate detail screen to drill into. Locked slots reuse the same card
  // frame/shape as a real card (rather than a plain box) so the grid reads
  // as one consistent set, with a "To be unlocked" tag above to distinguish
  // it from an actual customer's card. Text placeholders are "???" rather
  // than a description we don't have yet.
  function lockedPlaceholder() {
    const placeholderTags = ["???", "???", "???"]
      .map((tag) => `<li class="character-card-tag">${tag}</li>`)
      .join("");

    return `
      <div class="card-slot">
        <span class="card-slot-badge">To be unlocked</span>
        <article class="character-card card-locked" style="background-image:url('assets/cards/character-card-frame-ondeh-v1.jpg')" role="group" aria-label="Card slot, not yet unlocked">
          <h3 class="character-card-name">???</h3>
          <div class="character-card-portrait-area">
            <span class="card-locked-question" aria-hidden="true">?</span>
          </div>
          <div class="character-card-story"><p class="character-card-story-inner">???</p></div>
          <ul class="character-card-tags">${placeholderTags}</ul>
        </article>
      </div>`;
  }

  function renderGrid(save, previewCardId) {
    const cards = getAllCards();
    const tiles = cards
      .map((card) => {
        // Every card — including Ondeh-Ondeh — stays a locked placeholder
        // until the player has completed that kueh's full story and
        // minigame. No exceptions for whichever chapter happens to be
        // first.
        if (!isUnlocked(save, card.id)) return lockedPlaceholder();
        return `<div class="card-slot">${renderCharacterCard(card, { interactive: true })}</div>`;
      })
      .join("");
    const emptySlots = Math.max(0, TOTAL_CARD_SLOTS - cards.length);
    const emptyTiles = new Array(emptySlots).fill(lockedPlaceholder()).join("");

    return `
      <div class="screen screen-collection">
        <div class="screen-header">
          <button type="button" class="icon-btn" data-action="close-collection" aria-label="Close"><img src="assets/ui/beary-home-icon-v1.png" alt=""></button>
          <h2>Collection</h2>
          <span class="collection-count">${save.unlockedCards.length} / ${TOTAL_CARD_SLOTS}</span>
        </div>
        <div class="card-grid">${tiles}${emptyTiles}</div>
        ${previewCardId ? renderCardPreview(previewCardId) : ""}
      </div>`;
  }

  window.KG.collection = { getAllCards, isUnlocked, renderCharacterCard, renderGrid };
})();
