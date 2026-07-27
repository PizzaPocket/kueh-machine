/* Care Island — meadow scene rendering
   Meadow is the only scene now. Each stage is its own hand-drawn image
   (see /assets/1.jpg..7.jpg) rather than one image revealed by a mask:
   at 0% nothing shows, then the percent climbs through the numbered
   sequence. Add more images to MEADOW_STAGES and the reveal gets
   smoother automatically — no other code changes needed. */

const MEADOW_STAGES = [
  "./assets/1.jpg",
  "./assets/2.jpg",
  "./assets/3.jpg",
  "./assets/4.jpg",
  "./assets/5.jpg",
  "./assets/6.jpg",
  "./assets/7.jpg"
];

function stageIndexForPercent(pct, stageCount) {
  if (pct <= 0) return -1; // -1 = nothing shown yet
  return Math.min(stageCount - 1, Math.ceil((pct / 100) * stageCount) - 1);
}

function renderMeadowScene(pct) {
  const targetIdx = stageIndexForPercent(pct, MEADOW_STAGES.length);
  // Walk back to the nearest stage that has art, in case a later one is still pending (null placeholder).
  let src = null;
  for (let i = targetIdx; i >= 0; i--) {
    if (MEADOW_STAGES[i]) { src = MEADOW_STAGES[i]; break; }
  }
  return src ? `<img class="scene-bg scene-bg-stage" src="${src}" alt="">` : "";
}
