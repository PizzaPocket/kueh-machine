// Organism: the site's Lucide (https://lucide.dev) integration. Icons are
// imported from esm.sh by name, not the whole icon set, so only the ones
// actually used on the page get fetched — add new named imports here as
// more spots on the site start using an icon, then reference them via
// data-lucide="kebab-case-name" wherever needed. createIcons() (Lucide's
// own vanilla-JS entry point, see https://lucide.dev/guide/packages/lucide)
// scans the DOM once for that attribute and replaces each placeholder
// element with the real inline <svg>, carrying over its class/other
// attributes — so a placeholder's own class (e.g. .leveling-resource-icon,
// index.html) still applies to the rendered icon afterward.
//
// No local vendoring/bundler needed: browsers resolve arbitrary absolute
// URLs in ES module imports natively, same "static site, no build step"
// constraint every other organism already lives under.

import { createIcons, Layers, Shield, Shapes, Grid3x3, NotebookPen, BookOpenText } from 'https://esm.sh/lucide@latest';

const ICONS = { Layers, Shield, Shapes, Grid3x3, NotebookPen, BookOpenText };

export function init() {
  createIcons({ icons: ICONS });
}
