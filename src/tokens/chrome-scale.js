// Sets a per-element chrome tile size from the element's own perimeter
// (2 * (width + height)), not a percentage of width/height treated
// independently — percentages distort into a non-square tile on anything
// that isn't roughly square, and needed a different hand-picked value per
// component to compensate. Perimeter is the quantity that actually matters
// for "how many times does the pattern repeat as your eye travels around
// this shape," which is what the density-tuning was really trying to
// control the whole time.
//
// `repeats` is the number of times --chrome-edge's one full cycle repeats
// around the element's total edge length — a small, intuitive integer
// (or fraction, for "less than one cycle visible") instead of a
// percentage nobody can reason about directly.
//
// Sets both --chrome-tile-px (the sharp primary sweep) and
// --chrome-tile-noise-px (the faint secondary layer, deliberately sized
// slightly smaller so the two patterns drift out of phase rather than
// tiling in sync — see --chrome-edge-noise in tokens.css). Re-measures on
// resize via ResizeObserver, so it stays correct across breakpoints with
// no separate mobile tuning pass.

// `heightOverride`: for elements whose chrome is painted on a pseudo-
// element shaped differently than the measured element itself (the
// site-nav divider is a 2px-tall ::after, but the only thing JS can
// measure/set custom properties on is its .site-nav parent, which is much
// taller) — pass the pseudo-element's real height instead of trusting the
// parent's own rect.
export function applyChromeScale(el, repeats, heightOverride) {
  if (!el) return;

  const update = () => {
    const rect = el.getBoundingClientRect();
    const height = heightOverride ?? rect.height;
    const perimeter = 2 * (rect.width + height);
    if (perimeter <= 0) return;
    const tile = perimeter / repeats;
    el.style.setProperty('--chrome-tile-px', `${tile}px`);
    el.style.setProperty('--chrome-tile-noise-px', `${tile * 0.8}px`);
  };

  update();
  const observer = new ResizeObserver(update);
  observer.observe(el);
}
