// Renders one dialogue line at a time as a bottom-pinned textbox: speaker
// name, text, and a Continue control. The caller (chapterRunner) owns the
// line index and the on-screen character's expression.

window.KG = window.KG || {};

(function () {
  function speakerName(character, line) {
    return line.speaker === "beary" ? "Beary" : character.displayName;
  }

  function renderLine(character, line, options) {
    const opts = options || {};
    const name = speakerName(character, line);
    const continueLabel = opts.continueLabel || "Next";
    const speakerClass = line.speaker === "beary" ? "dialogue-bar-beary" : "dialogue-bar-kueh";

    return `
      <div class="dialogue-group">
        <div class="dialogue-bar ${speakerClass}" role="group" aria-label="${name} says">
          <p class="dialogue-speaker">${name}</p>
          <p class="dialogue-text">${line.text}</p>
        </div>
        <button type="button" class="primary-btn dialogue-cta" data-action="dialogue-advance">${continueLabel}</button>
      </div>`;
  }

  window.KG.dialogue = { renderLine };
})();
