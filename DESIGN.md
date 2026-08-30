---
name: Kueh Machine
description: A warm, image-led web showcase held together by quiet editorial structure and playful material details.
colors:
  primary-strong: "#B72E68"
  primary: "#E8629A"
  primary-soft: "#F8BFD9"
  accent: "#F7D774"
  surface: "#FFF8F0"
  surface-tint: "#F0E8DA"
  surface-border: "#D6C8B4"
  highlight: "#8FCB5E"
  highlight-soft: "#DCF0BE"
  text-on-surface: "#5C1638"
  text-on-surface-muted: "#8C4569"
  text-on-primary: "#FBE0EC"
typography:
  display:
    fontFamily: "Syne, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.625rem, 3.5vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Syne, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  interactive: "8px"
  card: "12px"
  pill: "9999px"
spacing:
  compact: "8px"
  control: "16px"
  section-small: "72px"
  section-large: "128px"
components:
  button-cta:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.text-on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.interactive}"
    padding: "11px 28px"
  button-cta-hover:
    backgroundColor: "{colors.text-on-surface}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.interactive}"
    padding: "11px 28px"
  account-badge:
    backgroundColor: "transparent"
    textColor: "{colors.primary-strong}"
    typography: "{typography.label}"
---

# Design System: Kueh Machine

## Overview

**Creative North Star: "The Quiet Kueh Counter"**

Kueh Machine's shared web world feels like a small contemporary counter displaying many independently made things: warm, welcoming, tactile, and orderly enough for each project to remain the attraction. The root landing page is a restrained continuation of the established identity, not a new campaign aesthetic. It opens with one uninterrupted image field and bare overlaid chrome, then moves into generous breathing room and plain editorial structure. Brighter color, procedural batik, and superellipse controls appear as precise points of recognition rather than ornament applied everywhere.

This document governs the root landing page and shared Kueh Machine web chrome. It does not govern the interiors of contributor projects; their independent visual and interaction identities are a product commitment. Shared account affordances may carry this language across routes, but must remain compact and subordinate to the project they accompany.

**Key Characteristics:**

- Warm cream surfaces with plum text and a sparingly deployed pink-and-gold palette.
- Syne for identity and headings; system sans serif for reading and compact controls.
- Image-led compositions supported by quiet rules, ample space, and editorial copy.
- Procedural batik as a low-opacity edge accent, never a full-page wallpaper.
- Compact solid superellipse controls; liquid chrome remains an available established atom, not the landing page's default treatment.
- Contributor work remains visually independent inside shared routing and account chrome.

## Colors

The palette combines food-warm neutrals with saturated confectionery hues; semantic token names remain the source of truth so shared chrome can safely inherit future palette changes.

### Primary

- **Deep Roselle** (`primary-strong`): Wordmarks, contributor links, primary CTA fills, and the most decisive shared-brand marks.
- **Kueh Pink** (`primary`): Hover shifts and supporting branded color where Deep Roselle would be too forceful.
- **Soft Rose Layer** (`primary-soft`): Large low-intensity fields such as the hero-art placeholder.

### Secondary

- **Golden Kueh** (`accent`): One emphatic section field, chrome glints, and carefully bounded highlights.

### Tertiary

- **Pandan Leaf** (`highlight`): Keyboard focus and small moments of contrast.
- **Pandan Wash** (`highlight-soft`): A quiet supporting tint when a full highlight would dominate.

### Neutral

- **Rice Paper** (`surface`): Default page and component surface.
- **Toasted Paper** (`surface-tint`): Subtle surface response and separation without a new hue.
- **Tray Edge** (`surface-border`): Hairline separation in shared chrome where a boundary is genuinely needed.
- **Dark Pulut** (`text-on-surface`): Primary text and the strongest hover inversion.
- **Muted Roselle** (`text-on-surface-muted`): Secondary acknowledgements and archival links.
- **Rose Milk** (`text-on-primary`): Contrast-safe text on Deep Roselle.

### Named Rules

**The One Sweet Field Rule.** Use a saturated accent as one bounded sectional event, not as a repeating background treatment throughout a page.

**The Semantic Palette Rule.** Shared chrome consumes semantic color tokens. Do not hardcode a visually similar pink or cream inside a reusable component.

## Typography

**Display Font:** Syne (with system sans-serif fallback)  
**Body Font:** System sans serif (`-apple-system`, BlinkMacSystemFont, Segoe UI, sans-serif)

**Character:** Syne supplies compact, slightly eccentric confidence without turning the site into a novelty object. The system sans serif keeps contextual writing straightforward and humane, especially in longer editorial passages.

### Hierarchy

- **Display** (700, fluid 1.625–2.25rem, 1.15): Root-page section headings; compact and editorial rather than billboard-scaled.
- **Title** (700, fluid 1.5–2.25rem, 1.15): Secondary headings such as acknowledgements.
- **Body** (400, fluid 1.05–1.25rem, 1.65): Editorial copy, kept in a narrow column for comfortable reading.
- **Label** (700, 0.8125rem, 0.08em): System-sans treatment for small shared controls; uppercase only when the control is deliberately emphatic.
- **Wordmark** (800/600, 1rem, 1): A small solid-color identity mark with “Kueh” bold and “Machine” lighter, not a hero headline.

### Named Rules

**The Small Wordmark Rule.** The Kueh Machine name anchors shared chrome at utility scale. Do not enlarge it to compete with the page's featured work.

**The Two-Voice Rule.** Use Syne for identity and headings; use the system sans serif for paragraphs, supporting names, contributor links, and compact controls.

## Layout

The root landing page begins with a true full-bleed image stage, then moves into a centered editorial column and a wider directory. The hero spans the viewport edge to edge and stands exactly 100svh from the page top: no frame, gutters, maximum width, or corner clipping. Content below uses a 1120px maximum width, a 760px primary reading column, and horizontal gutters fluid from 20px to 48px. Major sections breathe on a 72–128px vertical range; internal relationships use smaller 16–32px intervals.

The header is a transparent, absolutely positioned overlay: one 72px row on larger screens and 64px on small screens, sitting inside the hero rather than consuming page height. The hero docks its compact CTA at the bottom center. At 700px and below, edge ornament disappears, horizontal content padding settles at 20px, and two-column directory rows remain intact with a slightly wider project-title column. Responsive changes simplify decoration before they collapse information.

**The Image Leads Rule.** The first viewport gives visual priority to the artwork. Supporting title text may remain accessible but visually hidden when the image and CTA carry the entry experience.

**The Quiet Directory Rule.** Contributor discovery is a dividerless two-column list on pure white, not a card grid. Names align left; regular-weight project links align right.

## Elevation & Depth

The root landing page is flat throughout. Full-bleed imagery, direct color-field changes, white space, and type establish hierarchy without shadows or raised framing. The overlaid header stays visually bare, and the solid Enter control relies on contrast and shape rather than chrome or elevation. Focus is conveyed with a high-contrast outline rather than glow.

### Named Rules

**The Flat Landing Rule.** Do not add shadows, chrome rims, translucent panels, or framed containers to the root landing page's hero, header, directory, or editorial sections.

## Shapes

The shared form language pairs square, frameless editorial structure with compact superellipse-like controls. Interactive controls use the established 8px radius; cards and framed media elsewhere in shared chrome may use 12px; pills are reserved for states whose behavior truly calls for them. The full-bleed hero is a rectangular viewport plane with no clipped corners. The root Enter control matches the solid account-dialog control language rather than the liquid-chrome atom.

**The Solid Superellipse Rule.** Root landing actions use the compact 8px solid control shared with account dialogs. Preserve liquid chrome as an existing atom for contexts that already call for it, but do not add it to the landing hero.

## Components

### Shared Header

- **Character:** One bare overlay containing a split-weight solid-color wordmark and a docked account icon.
- **Structure:** 72px tall on larger screens and 64px on small screens; absolutely positioned over the hero with no background, border, panel, or blur.
- **Typography:** “Kueh” is Syne 800 and “Machine” is Syne 600, both at 1rem.
- **Behavior:** The wordmark returns to `/`. The account badge remains the consistent identity entry point and must not form a second navigation row.

### Hero Artwork Stage

- **Character:** A dominant image or authored visual with minimal interface competing for attention.
- **Shape:** Full bleed, edge to edge, exactly 100svh from the page top, with no frame, gutter, maximum width, or clipped corners.
- **Fallback:** Until final artwork exists, use a Soft Rose Layer field with a small Syne status label; do not fabricate decorative imagery.
- **CTA relationship:** The Enter control is bottom-centered and links to `/hub/`.

### Enter Control

- **Shape:** Compact solid superellipse-like control with an 8px radius and a minimum width of 124px; no rim or shadow.
- **Primary:** Deep Roselle fill, Rose Milk text, system-sans uppercase label, and 11px by 28px internal padding.
- **Hover / Focus:** Invert to Dark Pulut on Rice Paper; use a visible solid outline for keyboard focus. Motion is limited to a quick 150ms surface-color transition.

### Accent Editorial Section

- **Character:** One Golden Kueh field containing a centered 760px reading column and two concise paragraphs.
- **Ornament:** Procedural batik may occupy the outer margins at approximately 20% opacity. Paired mounts share one motif family so the section reads as a single composition.
- **Responsive:** Remove batik below 700px rather than compressing it into the reading column.

### Contributor Directory

- **Character:** Calm, factual, and highly scannable.
- **Structure:** A pure-white, dividerless two-column list; contributor name on the left and canonical `/<slug>/` project route on the right.
- **State:** Project links use the body font at regular weight in Deep Roselle and shift to Dark Pulut on hover; keyboard focus uses the shared Pandan Leaf outline.

### Acknowledgements and Archive Link

- **Character:** Deliberately quieter than the contributor directory.
- **Structure:** Special Thanks follows a generous gap without a divider. The archive link is small, muted, underlined, and points to `/brief/`.

## Do's and Don'ts

### Do:

- **Do** preserve the semantic palette, Syne typography, procedural batik generator, solid account-dialog control, liquid-chrome atom, clipped-shape atom, and shared account icon as reusable parts of the broader system.
- **Do** let imagery and contributor projects carry the expressive load while shared chrome stays compact and recognizable.
- **Do** link machines with canonical root routes such as `/ruth/` and the shared world with `/hub/`.
- **Do** keep focus visible, retain semantic headings and link destinations, and respect reduced-motion preferences.
- **Do** treat the root landing page and shared account/navigation chrome as this document's boundary.

### Don't:

- **Don't** apply the root landing page's restraint, layout, or accent-section composition to contributor projects; their independent identities are intentional.
- **Don't** turn batik into wallpaper, repeat saturated accent fields, or add ornamental chrome to ordinary editorial content.
- **Don't** add dividers, cards, badges, portraits, or marketing summaries to the contributor directory.
- **Don't** turn the Kueh Machine wordmark into an oversized hero title or split the account badge into a separate header.
- **Don't** link to raw `/machines/<slug>/` paths; build outputs and routing authority live at `/<slug>/`.
