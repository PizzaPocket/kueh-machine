// kueh-machine shared account widget.
//
// Drop this into any page with a single classic script tag — no build step,
// no `type="module"` required, works alongside pages that already load
// classic scripts (e.g. Liwei's game) or ES modules (e.g. the root site):
//
//   <script src="/shared/account-widget.js"></script>
//
// It self-mounts a persistent "account" icon into the page and a dropdown/
// modal panel (email/password sign up + login, "Continue with Google", sign
// out) behind it. The icon is always the same shape (Lucide circle-user-
// round) so it reads as one consistent entry point site-wide, but its
// *position* and *color* adapt per host page — every other machine has its
// own bespoke visual world, and a badge that always looks like fixed Kueh
// Machine pink regardless of context reads as pasted-on rather than part of
// the page. Two independent adaptation axes, both optional, both declared
// via data-attributes on the script tag itself:
//
//   Position — data-mode:
//     'fixed'    (default) floating, viewport-corner, filled circular badge.
//     'absolute' floating within data-mount-into, filled circular badge —
//                for mirroring an existing fixed UI element on the page
//                (see Ruth's #audioBtn, which the badge also matches in
//                *color* — badgeBackground/badgeBorder below) rather than
//                the raw viewport corner.
//     'docked'   sits *inside* an existing header/nav bar (data-mount-into)
//                — no fill/shadow chrome, just the icon — anchored to that
//                bar's own left/right edge and vertically centered within
//                it, independent of whatever else is already in that bar
//                (e.g. a centered nav-links row keeps its own centering;
//                the icon doesn't become one more item pulling it off
//                center — see root index.html's .site-nav).
//   data-anchor: 'top-right' (default) | 'top-left' | 'bottom-right' | 'bottom-left'
//     (docked mode only reads the left/right half of this, since it's
//     always vertically centered rather than pinned to a top/bottom corner)
//   data-size: badge diameter in px (default 52 floating/absolute, 40
//     docked). Never goes below 40 regardless of what's requested — small
//     enough for a tight header row, never so small it stops reading as a
//     real tap target.
//   data-inset: docked mode only — px from mountInto's own edge (default 20)
//
//   Color — data-accent-color: any hex color, used for the panel's buttons/
//     focus rings and (in fixed/absolute mode) the badge's own fill; a
//     readable icon/button-text color is derived automatically (simple
//     perceived-brightness check) unless data-icon-color overrides it.
//     data-icon-color: the icon's own color in 'docked' mode, where there's
//     no fill to contrast against — needed when accentColor (used for panel
//     buttons) wouldn't itself read clearly against the header's own
//     background (see root index.html: dark pink accent for the panel, but
//     light on-primary for the icon sitting on that same dark pink nav bar).
//     data-icon-color-muted: docked mode's *default* (non-hover) icon
//     color, if a header's own text-buttons sit at a dimmer shade until
//     hovered/focused and you want the icon to match that exactly (root's
//     nav links do; see root index.html) — falls back to data-icon-color
//     (no dimming) if omitted.
//     data-badge-background / data-badge-border: raw CSS values overriding
//     the floating/absolute badge's own fill/border outright, for matching
//     an *existing* button's exact look (gradient, translucency, etc.)
//     rather than a flat accent color — see Ruth's #audioBtn.
//   Omit all of the above and everything defaults to the original fixed
//   Kueh Machine pink look.
//
// Public API — window.KuehAccount:
//   init(options)   { anchor, mountInto, mode: 'fixed'|'absolute'|'docked',
//                      size, inset, accentColor, iconColor, iconColorMuted,
//                      badgeBackground, badgeBorder }
//   ready                         Promise that resolves once the Supabase client exists
//   getClient()                   the one shared supabase-js client (or null before `ready` resolves)
//   getUser() / getSession()      sync reads of the last-known auth state
//   getProfile()                  { display_name, avatar_illustration, avatar_color } or null
//   getAvatarInfo()                { src, color } resolved for rendering, or null — see AUTH.md
//   resolveAvatar(profile)          same resolution for any { avatar_illustration, avatar_color } row —
//                                   e.g. another player's, for a leaderboard/friends list
//   updateProfile(partial)         write display_name and/or avatar fields — same identity everywhere
//   onAuthStateChange(fn)         fn(event, session) — returns an unsubscribe function
//   onProfileChange(fn)           fn(profile) — fires on sign-in AND on any updateProfile() call,
//                                  from this page or elsewhere — returns an unsubscribe function
//   signUp({ email, password, displayName })
//   signInWithPassword({ email, password })
//   signInWithGoogle()
//   signOut()
//   openPanel() / closePanel()
//
// Credentials for the shared Supabase project are hardcoded below rather
// than passed in by host pages, so "one script tag, zero config" is
// actually true for every contributor — see AUTH.md.
(function () {
  'use strict';
  if (window.KuehAccount) return;

  // The publishable key is meant to be public — it's safe as long as every
  // table has RLS enabled, same assumption Ruth's and Liwei's games already
  // make (see AUTH.md → "Setting up the shared project").
  var SUPABASE_URL = 'https://iclkouxwdurmrgyypgsb.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_WZjsw5IT1G1EZvfUSsbOUw_c-WTlGJI';
  var SUPABASE_JS_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

  var scriptEl = document.currentScript;
  var currentOpts = {
    anchor: (scriptEl && scriptEl.dataset.anchor) || 'top-right',
    mountInto: (scriptEl && scriptEl.dataset.mountInto) || null,
    mode: (scriptEl && scriptEl.dataset.mode) || 'fixed',
    size: (scriptEl && scriptEl.dataset.size) ? parseInt(scriptEl.dataset.size, 10) : null,
    inset: (scriptEl && scriptEl.dataset.inset) ? parseInt(scriptEl.dataset.inset, 10) : null,
    accentColor: (scriptEl && scriptEl.dataset.accentColor) || null,
    iconColor: (scriptEl && scriptEl.dataset.iconColor) || null,
    // Docked mode's default (non-hover) icon color, if it should be dimmer
    // than the hover/active iconColor — matches a header's own text-button
    // convention where links sit at a muted shade until hovered/active.
    iconColorMuted: (scriptEl && scriptEl.dataset.iconColorMuted) || null,
    // Raw CSS `background`/`border` values (e.g. a gradient) for the
    // floating/absolute badge's fill, when a flat accentColor isn't a close
    // enough match to an existing button on the page — see Ruth's
    // #audioBtn, which this badge is styled to match exactly.
    badgeBackground: (scriptEl && scriptEl.dataset.badgeBackground) || null,
    badgeBorder: (scriptEl && scriptEl.dataset.badgeBorder) || null,
  };

  // Never shrinks below this regardless of data-size or mode default —
  // small enough to sit unobtrusively in a tight header row, never so small
  // the icon reads as a stray mark instead of a recognizable tap target.
  var MIN_BADGE_SIZE = 40;

  var client = null;
  var readyResolve;
  var ready = new Promise(function (resolve) { readyResolve = resolve; });
  var currentSession = null;
  var authListeners = [];
  var profileListeners = [];

  function loadSupabaseJs(cb) {
    if (window.supabase && window.supabase.createClient) { cb(); return; }
    var s = document.createElement('script');
    s.src = SUPABASE_JS_CDN;
    s.onload = cb;
    s.onerror = function () {
      console.error('[KuehAccount] failed to load supabase-js from CDN — sign in will not work.');
    };
    document.head.appendChild(s);
  }

  // Loads the same Syne font the root site uses (index.html's own <link>,
  // same href) into the page's <head> — not the shadow root, since @font-
  // face/font loading isn't shadow-scoped, a family loaded anywhere in the
  // document is available for text anywhere in it, including inside a
  // shadow tree. Skipped on the root page itself, which already loads it;
  // needed on every other machine (Ruth's/Liwei's/etc. pages don't), since
  // the badge is meant to read as fixed Kueh Machine branding everywhere,
  // not blend into whatever fonts that particular game happens to load.
  function loadSyneFont() {
    if (document.querySelector('link[href*="family=Syne"]')) return;
    var preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    var preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap';
    document.head.appendChild(preconnect1);
    document.head.appendChild(preconnect2);
    document.head.appendChild(stylesheet);
  }
  loadSyneFont();

  // Same icon library the root site uses (src/organisms/icons.js — Lucide,
  // imported by name from esm.sh, no bundler needed). createElement() gives
  // a real SVG element directly rather than Lucide's DOM-scanning
  // createIcons()/data-lucide flow, which only looks at the light DOM and
  // would never see into this widget's shadow tree. Falls back to a hand-
  // drawn placeholder (FALLBACK_PERSON_SVG, below) if the CDN import fails
  // or hasn't resolved yet — the badge can render before this settles.
  // House rule: every icon in this widget is a real Lucide icon (loaded
  // here by name), never a hand-drawn approximation or a Unicode/text
  // glyph standing in for one (a stray "← Back" using the arrow character
  // slipped through once — don't repeat that). If Lucide doesn't have a
  // fitting icon, that's a sign to reconsider the UI, not a license to fake
  // one. Each FALLBACK_*_SVG below exists only to cover the brief gap
  // before this import resolves (or if it fails) and is hand-copied to be
  // pixel-identical to the real Lucide artwork it stands in for — never a
  // redrawn approximation either.
  var ICON_USER_SVG = null;
  var ICON_CLOSE_SVG = null;
  var ICON_EDIT_SVG = null;
  var ICON_BACK_SVG = null;
  import('https://esm.sh/lucide@latest').then(function (mod) {
    var userEl = mod.createElement(mod.CircleUserRound);
    userEl.setAttribute('width', '24');
    userEl.setAttribute('height', '24');
    ICON_USER_SVG = userEl.outerHTML;
    var xEl = mod.createElement(mod.X);
    xEl.setAttribute('width', '16');
    xEl.setAttribute('height', '16');
    ICON_CLOSE_SVG = xEl.outerHTML;
    var pencilEl = mod.createElement(mod.Pencil);
    pencilEl.setAttribute('width', '9');
    pencilEl.setAttribute('height', '9');
    ICON_EDIT_SVG = pencilEl.outerHTML;
    var backEl = mod.createElement(mod.ArrowLeft);
    backEl.setAttribute('width', '14');
    backEl.setAttribute('height', '14');
    ICON_BACK_SVG = backEl.outerHTML;
    renderBadge(); // cascades into renderPanel() itself once badgeBtn exists
  }).catch(function (e) {
    console.warn('[KuehAccount] failed to load Lucide icon, using fallback:', e);
  });

  loadSupabaseJs(function () {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    client.auth.onAuthStateChange(function (event, session) {
      currentSession = session;
      renderBadge();
      fetchProfile();
      authListeners.forEach(function (fn) {
        try { fn(event, session); } catch (e) { console.error('[KuehAccount] listener error:', e); }
      });
    });
    // `ready` resolves only once the initial session is known, so callers that
    // `await KuehAccount.ready` can immediately trust getUser()/getSession()
    // for the "was already signed in" check, then use onAuthStateChange for
    // anything that happens afterwards (including sign-ins from elsewhere,
    // e.g. via the badge, on pages that don't otherwise touch auth).
    client.auth.getSession().then(function (res) {
      currentSession = res.data.session;
      renderBadge();
      fetchProfile();
      readyResolve(client);
    });
  });

  // ── Per-page theme adaptation ────────────────────────────────────────
  // Turns a single data-accent-color into a small palette (a lighter hover
  // shade + a readable on-accent text/icon color), so a host page only
  // ever has to specify one color, not three, to re-theme the widget.
  var DEFAULT_ACCENT = { strong: '#B72E68', light: '#E8629A', onAccent: '#FBE0EC' };

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    }).join('');
  }

  // Lightens toward white — used for the badge/button hover shade, the same
  // relationship --color-primary already has to --color-primary-strong in
  // styles/tokens.css (a lighter tint of the same hue, not a different hue).
  function mixWithWhite(hex, amount) {
    var c = hexToRgb(hex);
    return rgbToHex(
      c.r + (255 - c.r) * amount,
      c.g + (255 - c.g) * amount,
      c.b + (255 - c.b) * amount
    );
  }

  // Simple perceived-brightness check (ITU-R BT.601), not full WCAG contrast
  // math — this only has to pick "light text" vs "dark text," a coarse call
  // that doesn't need gamma-correct luminance to get right.
  function perceivedBrightness(hex) {
    var c = hexToRgb(hex);
    return (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
  }

  // Darkens toward black — mixWithWhite's counterpart, for the docked
  // badge's own "raised chip" background (below): a light header gets a
  // touch darker, a dark header gets a touch lighter, the same convention
  // most tonal-surface design systems use for a control that's meant to sit
  // *on* a surface rather than introduce a competing color.
  function mixWithBlack(hex, amount) {
    var c = hexToRgb(hex);
    return rgbToHex(c.r * (1 - amount), c.g * (1 - amount), c.b * (1 - amount));
  }

  function parseRgbaString(str) {
    var m = str && str.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/);
    if (!m) return null;
    return { r: parseFloat(m[1]), g: parseFloat(m[2]), b: parseFloat(m[3]), a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  }

  // Walks up from `el` looking for the first mostly-opaque background — the
  // "effective" background a docked badge is actually sitting on, since the
  // element it's mounted into (data-mount-into) commonly has no background
  // of its own (natalia's/amy's headers don't; the color comes from body or
  // an ancestor section instead) and getComputedStyle().backgroundColor on
  // that one element alone would just read transparent.
  function getEffectiveBackgroundColor(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      var rgba = parseRgbaString(window.getComputedStyle(node).backgroundColor);
      if (rgba && rgba.a > 0.5) return rgba;
      node = node.parentElement;
    }
    return null;
  }

  // The docked badge's default "raised chip" fill — a solid color close
  // enough to whatever's actually behind it (walked up via
  // getEffectiveBackgroundColor) to read as part of that surface, not a
  // foreign accent pasted on top. Returns null (caller falls back to
  // transparent) if no opaque background could be found at all.
  function deriveDockedChipBackground(mountEl) {
    var rgba = getEffectiveBackgroundColor(mountEl);
    if (!rgba) return null;
    var hex = rgbToHex(rgba.r, rgba.g, rgba.b);
    return perceivedBrightness(hex) > 150 ? mixWithBlack(hex, 0.08) : mixWithWhite(hex, 0.16);
  }

  // No accentColor at all → the original hand-tuned Kueh Machine palette,
  // unchanged — tokens.css's actual primary/primary-strong pair comes from
  // a hue-preserving OKLCH ramp (src/tokens/colors.js), not a linear mix
  // toward white, so deriving it here instead would visibly drift from
  // what's already shipped. Derivation only kicks in once a page opts in
  // with its own accent.
  function resolveAccentPalette(accentColor, iconColorOverride) {
    if (!accentColor) return DEFAULT_ACCENT;
    return {
      strong: accentColor,
      light: mixWithWhite(accentColor, 0.28),
      onAccent: iconColorOverride || (perceivedBrightness(accentColor) > 150 ? '#3A2010' : '#FFF8F0'),
    };
  }

  // ── DOM / Shadow DOM setup ─────────────────────────────────────────────
  var host = null;      // the badge's own element, mounted per data-mode
  var shadow = null;     // its shadow root
  var panelHost = null;  // separate, always document.body-level — see mount()
  var panelShadow = null;
  var badgeBtn = null;
  var defaultBadgeBackground = ''; // set once in mount() — see its own comment
  var defaultBadgeBorder = ''; // set once in mount() — see its own comment
  var panelEl = null;
  var backdropEl = null; // mobile only (CSS-gated) — dimmed scrim behind the modal
  var panelOpen = false;
  var authMode = 'signup'; // 'login' | 'signup'
  var accountView = 'main'; // 'main' | 'avatar' — which signed-in sub-view is showing
  // { display_name, avatar_illustration, avatar_color } for the signed-in
  // user, fetched fresh after each SIGNED_IN (fetchProfile()) — null while
  // signed out or still loading, in which case rendering falls back to the
  // generic icon rather than waiting.
  var currentProfile = null;

  // Local mirror of the site's real design tokens — styles/tokens.css
  // (DEFAULT_THEME, src/tokens/colors.js) for color, index.html's own
  // inline :root block for radius/font/tracking. Duplicated by value, not
  // inherited, for two reasons: :host { all: initial } (below) deliberately
  // blocks inheritance from the host page, and this widget also runs on
  // machines/* pages that never load tokens.css or Syne at all. --ka-*
  // prefixed throughout so nothing here can collide with or shadow a host
  // page's own same-named custom properties. Deliberately the *static*
  // DEFAULT_THEME values, not whatever the root page's kueh-of-day.js has
  // live-rotated the palette to today — the account badge is meant to read
  // as one fixed Kueh Machine brand mark everywhere, not flicker with the
  // day's featured kueh. Keep in sync by hand if tokens.css's palette or
  // index.html's radius/font tokens ever change.
  var CSS = ''
    + ':host {'
    + '  all: initial;'
    + '  --ka-color-primary-strong: #B72E68;'
    + '  --ka-color-primary: #E8629A;'
    + '  --ka-color-primary-soft: #F8BFD9;'
    + '  --ka-color-accent: #F7D774;'
    + '  --ka-color-surface: #FFF8F0;'
    + '  --ka-color-surface-tint: #F0E8DA;'
    + '  --ka-color-surface-border: #D6C8B4;'
    + '  --ka-color-text-on-surface: #5C1638;'
    + '  --ka-color-text-on-surface-muted: #8C4569;'
    + '  --ka-color-text-on-primary: #FBE0EC;'
    + '  --ka-color-danger: #C43A2E;'
    + '  --ka-radius-card: 12px;'
    + '  --ka-radius-interactive: 8px;'
    + '  --ka-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;'
    + '  --ka-font-display: "Syne", var(--ka-font-sans);'
    + '  --ka-tracking-heading: -0.025em;'
    // Set per-mount from data-size/data-accent-color/data-icon-color (mount(),
    // below) via host.style.setProperty — these are just the un-configured
    // fallback values, same numbers/colors the widget always used before
    // per-page theming existed.
    + '  --ka-badge-size: 52px;'
    + '  --ka-icon-color: var(--ka-color-primary-strong);'
    + '  --ka-icon-color-muted: var(--ka-icon-color);'
    + '}'
    + '* { box-sizing: border-box; font-family: var(--ka-font-sans); }'
    + '.badge {'
    + '  position: absolute; top: 0; left: 0; cursor: pointer;'
    + '  width: var(--ka-badge-size); height: var(--ka-badge-size); border-radius: 50%;'
    + '  background: var(--ka-color-primary-strong); border: none;'
    + '  display: flex; align-items: center; justify-content: center;'
    + '  color: var(--ka-color-text-on-primary); font-family: var(--ka-font-display);'
    + '  font-size: calc(var(--ka-badge-size) * 0.29); font-weight: 700; letter-spacing: var(--ka-tracking-heading);'
    + '  box-shadow: 0 4px 14px rgba(92,22,56,0.32), 0 1px 4px rgba(92,22,56,0.2);'
    + '  transition: transform 0.12s ease, background 0.15s ease;'
    + '}'
    + '.badge:hover { transform: scale(1.05); }'
    + '.badge:active { transform: scale(0.94); }'
    + '.badge:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    + '.badge svg { width: calc(var(--ka-badge-size) * 0.46); height: calc(var(--ka-badge-size) * 0.46); }'
    // Floating/absolute badges are a filled circle, same as a signed-in
    // avatar's colored swatch — bumped up from the docked default (0.46)
    // so the signed-out glyph doesn't read as noticeably smaller than a
    // signed-in avatar. NOT matched 1:1 to .avatar-img's 76% though — that
    // number is right for a full-bleed illustration/photo, which already
    // has its own visual padding baked into the art, but is too large for
    // a stroke-based glyph icon (tried 76% directly; it read as oversized,
    // "bursting out of" the circle — a plain icon needs more surrounding
    // margin than an avatar to look like a normal system icon, e.g. a
    // typical iOS/Android default-avatar person-glyph sits around 55-60%
    // of its circle). Docked badges are bare icon-in-a-header-bar with no
    // circle behind them (deliberately smaller, matching a text nav link's
    // own icon scale), so this only overrides the non-docked case.
    + '.badge:not(.docked) svg { width: 56%; height: 56%; }'
    // Docked: sits inside an existing header/nav bar (see root index.html's
    // .site-nav) rather than floating as its own filled action-button — no
    // fill/shadow chrome of its own, just the icon, at a muted shade until
    // hovered/focused (matching a typical header text-button's own
    // default→hover treatment).
    //
    // color reads var(--color-text-on-primary[-muted]) FIRST, ahead of this
    // widget's own --ka-icon-color[-muted] — root's own tokens (styles/
    // tokens.css), not a copy of them. Custom properties inherit through
    // the Shadow DOM boundary (:host{all:initial} doesn't block this — the
    // `all` shorthand explicitly excludes custom properties from its
    // reset), so on root this tracks kueh-of-day.js's live daily palette
    // automatically, the same color the nav *links* are actually rendered
    // in right now — not a frozen snapshot of one specific day's colors,
    // which is what data-icon-color/-muted alone would be (confirmed the
    // mismatch directly: DEFAULT_ACCENT's muted is #EDB7CE, but
    // getComputedStyle(document.documentElement) read #ffccaa today).
    // Every other page simply doesn't define --color-text-on-primary at
    // all, so the var() falls straight through to --ka-icon-color[-muted]
    // (data-icon-color/-muted, or DEFAULT_ACCENT) exactly as before —
    // this is additive, not a behavior change for anyone but root.
    // background: a solid "raised chip" — computed per-page in mount() via
    // deriveDockedChipBackground() (reads the header's own effective
    // background color and nudges it slightly darker/lighter) and applied
    // as an inline style, which wins over this fallback. This transparent
    // value only actually shows up if that lookup found nothing to derive
    // from at all.
    + '.badge.docked {'
    + '  background: transparent; box-shadow: none;'
    + '  color: var(--color-text-on-primary-muted, var(--ka-icon-color-muted));'
    + '}'
    // No transform on hover/focus here — explicitly reset to none, not just
    // omitted: .badge:hover above (line 321) still matches this element too
    // (it has both classes) and would otherwise leave its scale(1.05) in
    // effect. Even with the new solid chip background, scaling up a small
    // header-docked control looks like a mistake next to plain text nav
    // links that don't do the same — a color shift alone is enough of a cue.
    + '.badge.docked:hover, .badge.docked:focus-visible { transform: none; color: var(--color-text-on-primary, var(--ka-icon-color)); }'
    // Base (desktop-default) rules first, media-query overrides after —
    // CSS cascade order matters here: an override declared *before* a
    // same-specificity base rule loses to it regardless of whether the
    // override's media query actually matches, since source order is only
    // the tiebreaker and the base rule comes later. (Caught this the hard
    // way: .panel-close was permanently display:none because its mobile
    // override used to be declared above the unconditional base rule.)
    // position:fixed (not :absolute) — .panel/.backdrop live in their own
    // body-level portal host now (panelHost, mount()), not inside `host`
    // (the badge's own, possibly-docked-into-a-header element), specifically
    // so the popover can never get trapped inside some host page's own
    // z-indexed stacking context (a header with z-index:50 caps everything
    // painted inside it to that stacking order, however high a z-index a
    // descendant itself declares — confirmed on root: the water-clock drop-
    // chute animation, an unrelated sibling with its own stacking context,
    // was painting over the panel because the panel's old host lived inside
    // .site-nav's stacking context instead of body's).
    + '.panel {'
    + '  position: fixed; width: 260px; padding: 20px;'
    + '  background: var(--ka-color-surface); border: 1px solid var(--ka-color-surface-border);'
    + '  border-radius: var(--ka-radius-card); box-shadow: 0 12px 32px rgba(92,22,56,0.18), 0 2px 8px rgba(92,22,56,0.12);'
    + '  color: var(--ka-color-text-on-surface); font-size: 13px; display: none;'
    + '}'
    + '.panel.open { display: block; }'
    + '.backdrop {'
    + '  position: fixed; inset: 0; display: none;'
    + '  background: rgba(92,22,56,0.45); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);'
    + '}'
    + '.panel-close {'
    + '  display: none; position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;'
    + '  border-radius: 50%; border: none; background: var(--ka-color-surface-tint); color: var(--ka-color-text-on-surface);'
    + '  align-items: center; justify-content: center; cursor: pointer; padding: 0;'
    + '}'
    + '.panel-close:hover { background: var(--ka-color-surface-border); }'
    + '.panel-close:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    + '.panel-close svg { width: 16px; height: 16px; }'
    // Desktop: a small popover anchored to wherever the badge actually is
    // on screen right now — --ka-panel-x/y are computed from the badge's
    // real getBoundingClientRect() each time the panel opens (updatePanelPosition(),
    // below), not a fixed offset, since the badge's on-screen position
    // varies per host page (floating corner vs. docked in a header) and,
    // for a docked badge, even within a single page depending on viewport
    // width/content reflow.
    + '@media (min-width: 641px) {'
    + '  .panel[data-anchor="top-right"], .panel[data-anchor="bottom-right"] { right: var(--ka-panel-x, 10px); }'
    + '  .panel[data-anchor="top-left"], .panel[data-anchor="bottom-left"] { left: var(--ka-panel-x, 10px); }'
    + '  .panel[data-anchor="top-right"], .panel[data-anchor="top-left"] { top: var(--ka-panel-y, 70px); }'
    + '  .panel[data-anchor="bottom-right"], .panel[data-anchor="bottom-left"] { bottom: var(--ka-panel-y, 70px); }'
    + '}'
    // Mobile: matches the site's existing onboarding-modal convention
    // (machines/ruth/index.html's #nameInputOverlay — dimmed/blurred
    // backdrop behind a centered card) and its 640px breakpoint, rather
    // than a small popover that would either crowd the corner or run off
    // the edge of a narrow viewport.
    + '@media (max-width: 640px) {'
    + '  .panel {'
    + '    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);'
    + '    width: calc(100vw - 48px); max-width: 340px; max-height: calc(100vh - 48px); overflow-y: auto;'
    + '  }'
    + '  .backdrop.open { display: block; }'
    + '  .panel-close { display: flex; }'
    + '}'
    + '.panel h3 {'
    + '  margin: 0 0 12px; font-family: var(--ka-font-display); font-size: 16px; font-weight: 700;'
    + '  letter-spacing: var(--ka-tracking-heading); color: var(--ka-color-text-on-surface);'
    + '}'
    + '.panel label { display: block; margin: 10px 0 4px; color: var(--ka-color-text-on-surface-muted); }'
    + '.panel input {'
    + '  width: 100%; padding: 8px 10px; border-radius: var(--ka-radius-interactive);'
    + '  border: 1px solid var(--ka-color-surface-border); background: #fff;'
    + '  color: var(--ka-color-text-on-surface); font-size: 13px;'
    + '}'
    + '.panel input:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 1px; }'
    + '.btn {'
    + '  width: 100%; margin-top: 12px; padding: 9px 10px; border: none; border-radius: var(--ka-radius-interactive);'
    + '  background: var(--ka-color-primary-strong); color: var(--ka-color-text-on-primary);'
    + '  font-family: var(--ka-font-sans); font-weight: 700; font-size: 13px; cursor: pointer;'
    + '  transition: background 0.15s ease;'
    + '}'
    + '.btn:hover { background: var(--ka-color-primary); }'
    + '.btn:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    + '.btn:disabled { opacity: 0.6; cursor: default; }'
    + '.btn-google {'
    // Google's own required brand mark/colors — not a Kueh Machine token,
    // left alone deliberately (see AUTH.md).
    + '  background: #fff; color: #3C3C3C; border: 1px solid var(--ka-color-surface-border);'
    + '  display: flex; align-items: center; justify-content: center; gap: 8px;'
    + '}'
    + '.btn-google:hover { background: var(--ka-color-surface-tint); }'
    + '.btn-ghost {'
    + '  background: transparent; border: 1px solid var(--ka-color-surface-border); color: var(--ka-color-text-on-surface);'
    + '}'
    + '.btn-ghost:hover { background: var(--ka-color-surface-tint); }'
    + '.switch-mode {'
    + '  margin-top: 12px; text-align: center; color: var(--ka-color-text-on-surface-muted);'
    + '  cursor: pointer; text-decoration: underline;'
    + '}'
    + '.switch-mode:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    + '.error { margin-top: 8px; color: var(--ka-color-danger); font-size: 12px; min-height: 14px; font-weight: 600; }'
    + '.account-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }'
    // A <button>, not a <div> — clicking it opens the avatar editor (see
    // renderAccountPanel()), so it needs to be a real, natively focusable/
    // keyboard-operable control, not another makeButtonLike() retrofit.
    + '.account-avatar {'
    + '  position: relative; width: 36px; height: 36px; border-radius: 50%; background: var(--ka-color-primary-soft);'
    + '  display: flex; align-items: center; justify-content: center; flex-shrink: 0;'
    + '  font-family: var(--ka-font-display); font-weight: 700; color: var(--ka-color-primary-strong);'
    + '  border: none; padding: 0; cursor: pointer; transition: transform 0.12s ease;'
    + '}'
    + '.account-avatar:hover, .account-avatar:focus-visible { transform: scale(1.08); }'
    + '.account-avatar:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    // Pinned to the avatar button's own corner (not a sibling in the row) so
    // it reads as "this picture is editable" rather than a separate control
    // — purely a visual cue, avatarBtn itself already owns the click/keyboard
    // handling, so this stays out of the tab order and pointer events.
    + '.account-avatar-edit {'
    + '  position: absolute; right: -2px; bottom: -2px; width: 16px; height: 16px; border-radius: 50%;'
    + '  background: var(--ka-color-surface); border: 1.5px solid var(--ka-color-surface-border);'
    + '  display: flex; align-items: center; justify-content: center; color: var(--ka-color-text-on-surface-muted);'
    + '  pointer-events: none;'
    + '}'
    + '.account-avatar-edit svg { width: 9px; height: 9px; }'
    + '.account-info { min-width: 0; flex: 1; }'
    // Same idea as .avatar-editor-back — a real button with a real Lucide
    // icon next to the text, not a separate pencil-only control. Text
    // left-aligned/truncating so a long name doesn't push the icon out of
    // the panel; icon never shrinks.
    + '.account-name-btn {'
    + '  display: flex; align-items: center; gap: 5px; max-width: 100%;'
    + '  background: none; border: none; padding: 0; cursor: pointer;'
    + '  font-family: var(--ka-font-sans); font-weight: 700; font-size: 14px; color: var(--ka-color-text-on-surface);'
    + '}'
    + '.account-name-btn span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }'
    + '.account-name-btn svg { flex-shrink: 0; width: 11px; height: 11px; color: var(--ka-color-text-on-surface-muted); }'
    + '.account-name-btn:hover svg, .account-name-btn:focus-visible svg { color: var(--ka-color-text-on-surface); }'
    + '.account-name-btn:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    // Inherits .panel input's own look (same field style as the signup/
    // login form above) — no !important overrides, just spacing.
    + '.account-name-input { margin-bottom: 4px; font-weight: 700; }'
    + '.account-email { color: var(--ka-color-text-on-surface-muted); word-break: break-all; }'
    // .avatar-img sits inside either .badge or .account-avatar — sized
    // relative (76%, not full-bleed) so the illustration reads as a sticker
    // centered on its own color swatch rather than a hard-cropped photo;
    // these illustrations were drawn/exported as self-contained objects on
    // transparent or white ground, not edge-to-edge compositions, so
    // object-fit:cover would just crop into empty margin, not the art.
    + '.avatar-img { width: 76%; height: 76%; object-fit: contain; }'
    // Re-enables the hover grow specifically for a docked badge that's
    // currently showing a real avatar (a filled, colored circle now, not
    // the bare transparent icon .badge.docked:hover intentionally excludes
    // it from) — declared after .badge.docked:hover so it wins at equal
    // specificity when both classes are present.
    + '.badge.has-avatar:hover, .badge.has-avatar:focus-visible { transform: scale(1.05); }'
    + '.avatar-editor-back {'
    + '  background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 10px;'
    + '  color: var(--ka-color-text-on-surface-muted); font-family: var(--ka-font-sans); font-weight: 700; font-size: 13px;'
    + '  display: inline-flex; align-items: center; gap: 4px;'
    + '}'
    + '.avatar-editor-back:hover { color: var(--ka-color-text-on-surface); }'
    + '.avatar-editor-back svg { width: 14px; height: 14px; }'
    + '.avatar-preview {'
    + '  width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 14px;'
    + '  display: flex; align-items: center; justify-content: center;'
    + '  box-shadow: 0 4px 14px rgba(92,22,56,0.24);'
    + '}'
    + '.avatar-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }'
    + '.avatar-tile {'
    + '  width: 100%; aspect-ratio: 1; border-radius: 50%; border: 2px solid var(--ka-color-surface-border);'
    + '  background: var(--ka-color-surface-tint); cursor: pointer; padding: 5px;'
    + '  display: flex; align-items: center; justify-content: center;'
    + '  transition: transform 0.12s ease, border-color 0.12s ease;'
    + '}'
    + '.avatar-tile:hover, .avatar-tile:focus-visible { transform: scale(1.1); }'
    + '.avatar-tile.active { border-color: var(--ka-color-primary-strong); border-width: 2.5px; transform: scale(1.1); }'
    + '.avatar-tile:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    + '.avatar-tile img { width: 100%; height: 100%; object-fit: contain; }'
    + '.avatar-swatch-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }'
    + '.avatar-swatch {'
    + '  width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; padding: 0; cursor: pointer;'
    + '  transition: transform 0.12s ease, border-color 0.12s ease;'
    + '}'
    + '.avatar-swatch:hover, .avatar-swatch:focus-visible { transform: scale(1.15); }'
    + '.avatar-swatch.active { border-color: var(--ka-color-text-on-surface); transform: scale(1.15); }'
    + '.avatar-swatch:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }';

  // Matches Lucide's circle-user-round artwork exactly (fetched from
  // lucide-static so this fallback is pixel-identical to the real icon,
  // not a hand-guessed approximation) — it's only ever visible for the
  // brief gap before the CDN import above resolves, or if it fails.
  var FALLBACK_PERSON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M17.925 20.056a6 6 0 0 0-11.851.001"/><circle cx="12" cy="11" r="4"/><circle cx="12" cy="12" r="10"/></svg>';

  var FALLBACK_CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M18 6 6 18M6 6l12 12"/></svg>';

  // Matches Lucide's pencil artwork — the small "you can edit this" badge
  // pinned to the account panel's avatar button (renderAccountPanel()), not
  // shown on the header badge itself (too busy repeated on every page).
  var FALLBACK_EDIT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';

  // Matches Lucide's arrow-left artwork — the avatar editor's "Back" button
  // (renderAvatarEditor()); this replaced a literal "←" Unicode character
  // that had slipped in before this became a house rule (see the icon-
  // loading comment above).
  var FALLBACK_BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>';

  var GOOGLE_SVG = '<svg width="16" height="16" viewBox="0 0 18 18">'
    + '<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"/>'
    + '<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.36 0-4.35-1.6-5.06-3.74H.98v2.33A9 9 0 0 0 9 18z"/>'
    + '<path fill="#FBBC05" d="M3.94 10.68A5.4 5.4 0 0 1 3.66 9c0-.58.1-1.15.28-1.68V4.99H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.01l2.96-2.33z"/>'
    + '<path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.99l2.96 2.33C4.65 5.18 6.64 3.58 9 3.58z"/>'
    + '</svg>';

  // Avatars are real illustrations pulled from contributors' own projects,
  // not a generated/abstract avatar — signing up should feel like getting
  // handed a small piece of the actual machine, not a gradient blob. `src`
  // for the Amy and bird ones points at their live site path directly (no
  // copy — those SVGs are already tiny, and referencing the original avoids
  // a second copy silently going stale). Ken's two are frozen snapshots of
  // his procedural generator (it's seeded with Math.random() per render;
  // an avatar needs one fixed result, not a different kueh on every render)
  // saved as static SVGs under shared/avatars/. Viki's and Amanda's photo
  // ones are downsized/recompressed webp copies — their originals are
  // full-resolution exports (1536×1024+, multi-MB), nowhere near
  // appropriate for a 40px circle. Liwei's snake-head and kopi are hand-
  // ported from her game's own canvas drawing code (main.js's per-frame
  // draw()/drawCoffee() — she draws these live every frame with 2D canvas
  // calls, there's no static asset file to copy) into static SVGs that
  // reproduce the same shapes/colors/math, since an avatar needs one fixed
  // image, not a canvas render loop. ken-kueh-dadar is a third frozen
  // snapshot of Ken's generator, deliberately kept to his "common" rarity
  // tier (data.js's RARITIES) like kueh-bahulu — kueh-talam is his one
  // intentional ultraRare exception, not the norm for this set. amy-kueh-
  // dadar and amy-kueh-lapis were dropped: the former would've duplicated
  // ken-kueh-dadar's real-world name, the latter already duplicated viki-
  // kueh-lapis. IDs here must stay in sync with 0001_init.sql's
  // random_avatar_illustration() by hand (see its own comment).
  var AVATAR_ILLUSTRATIONS = [
    { id: 'amy-ang-ku-kueh', src: '/machines/amy/backdoor/ang-ku-kueh.svg', label: 'Ang Ku Kueh (Amy)' },
    { id: 'amy-kueh-salat', src: '/machines/amy/backdoor/kueh-salat.svg', label: 'Kueh Salat (Amy)' },
    { id: 'amy-onde-onde', src: '/machines/amy/backdoor/onde-onde.svg', label: 'Onde Onde (Amy)' },
    { id: 'amy-bird', src: '/images/checkin/bird-amy.svg', label: 'Bird (Amy)' },
    { id: 'ken-kueh-bahulu', src: '/shared/avatars/ken-kueh-bahulu.svg', label: 'Kueh Bahulu (Ken)' },
    { id: 'ken-kueh-dadar', src: '/shared/avatars/ken-kueh-dadar.svg', label: 'Kueh Dadar (Ken)' },
    { id: 'ken-kueh-talam', src: '/shared/avatars/ken-kueh-talam.svg', label: 'Kueh Talam (Ken)' },
    { id: 'viki-tutukueh', src: '/shared/avatars/viki-tutukueh.webp', label: 'Kueh Tutu (Viki)' },
    { id: 'viki-kueh-lapis', src: '/shared/avatars/viki-kueh-lapis.webp', label: 'Kueh Lapis (Viki)' },
    { id: 'amanda-kueh-bunga', src: '/shared/avatars/amanda-kueh-bunga.webp', label: 'Bunga Kueh (Amanda)' },
    { id: 'amanda-kueh-build', src: '/shared/avatars/amanda-kueh-build.webp', label: 'Build-a-Kueh (Amanda)' },
    { id: 'amanda-kueh-story', src: '/shared/avatars/amanda-kueh-story.webp', label: 'Story Time Kueh (Amanda)' },
    { id: 'amanda-kueh-photobook', src: '/shared/avatars/amanda-kueh-photobook.webp', label: 'Photo Book Kueh (Amanda)' },
    { id: 'liwei-snake-head', src: '/shared/avatars/liwei-snake-head.svg', label: 'Snake (Liwei)' },
    { id: 'liwei-kopi', src: '/shared/avatars/liwei-kopi.svg', label: 'Kopi (Liwei)' },
  ];

  // The background swatch behind whichever illustration is picked — pulled
  // from colors that already appear across the illustrations above, so
  // every color/illustration pairing reads as belonging together rather
  // than clashing. Same circular-swatch interaction Viki's and Amanda's own
  // customizers already use (ondeh.js's .color-chip-grid, script.js's
  // .color-swatch) — active = a visible ring + a slight scale-up.
  var AVATAR_COLORS = ['#F2B8C6', '#8FBF7F', '#F0B429', '#D97B66', '#B8D8B8', '#FBF6EC', '#C4933F', '#5B3A29'];

  function anchorStyle(anchor) {
    switch (anchor) {
      case 'top-left': return { top: '15px', left: '10px' };
      case 'bottom-right': return { bottom: '15px', right: '10px' };
      case 'bottom-left': return { bottom: '15px', left: '10px' };
      default: return { top: '15px', right: '10px' };
    }
  }

  function applyPos(el, opts) {
    var pos = anchorStyle(opts.anchor);
    el.style.position = opts.mode === 'absolute' ? 'absolute' : 'fixed';
    ['top', 'right', 'bottom', 'left'].forEach(function (k) { el.style[k] = pos[k] || 'auto'; });
  }

  function findIllustration(id) {
    for (var i = 0; i < AVATAR_ILLUSTRATIONS.length; i++) {
      if (AVATAR_ILLUSTRATIONS[i].id === id) return AVATAR_ILLUSTRATIONS[i];
    }
    return null;
  }

  // Shared between the badge and the account panel's avatar button — an
  // <img> of the chosen illustration once currentProfile has loaded and has
  // one set, the same generic person icon signed-out users see otherwise
  // (covers signed-in-but-profile-still-loading and the pre-avatars-existing
  // case of an account with no row) — never initials, so there's no jarring
  // flash from letters to a picture once the profile fetch resolves.
  function avatarInnerHtml() {
    var ill = currentProfile && findIllustration(currentProfile.avatar_illustration);
    if (ill) return '<img class="avatar-img" src="' + ill.src + '" alt="" />';
    return ICON_USER_SVG || FALLBACK_PERSON_SVG;
  }

  // Re-fetches after every auth-state change (see loadSupabaseJs, above) —
  // not cached across sign-outs/sign-ins, since it's a different person's
  // row each time. Signed out clears it synchronously (no network round
  // trip needed to know there's no profile to show).
  function fetchProfile() {
    if (!currentSession) { currentProfile = null; accountView = 'main'; renderBadge(); notifyProfileListeners(); return; }
    ready.then(function (c) {
      return c.from('profiles').select('display_name,avatar_illustration,avatar_color')
        .eq('id', currentSession.user.id).maybeSingle();
    }).then(function (res) {
      currentProfile = (res && res.data) || null;
      renderBadge();
      notifyProfileListeners();
    }).catch(function (e) { console.warn('[KuehAccount] profile fetch failed:', e); });
  }

  function notifyProfileListeners() {
    profileListeners.forEach(function (fn) {
      try { fn(currentProfile); } catch (e) { console.error('[KuehAccount] profile listener error:', e); }
    });
  }

  // Applies a display_name/avatar_illustration/avatar_color change
  // immediately (both to local state — instant repaint — and to the
  // profiles row), matching Viki's/Amanda's own customizer UIs: every click
  // updates the result right away, no separate "Save" step. Shared by the
  // avatar editor (avatar_illustration/avatar_color) and any host page that
  // wants its own player-name field to double as the account's real name
  // (see AUTH.md's "One identity, everywhere" — display_name is the same
  // field the badge/panel show, not a separate per-game nickname) — that's
  // why this is generic on `partial` rather than avatar-specific, and why
  // it's exposed as KuehAccount.updateProfile.
  function updateProfile(partial) {
    currentProfile = Object.assign({}, currentProfile, partial);
    renderBadge();
    notifyProfileListeners();
    if (!currentSession) return;
    ready.then(function (c) {
      return c.from('profiles').update(partial).eq('id', currentSession.user.id);
    }).catch(function (e) { console.warn('[KuehAccount] profile save failed:', e); });
  }

  // Resolves any { avatar_illustration, avatar_color }-shaped row (not just
  // the signed-in user's own) into something a host page can actually
  // render (its own image src + background color) without needing to know
  // AVATAR_ILLUSTRATIONS exists — that array is this file's own
  // implementation detail, not part of the public contract. null if there's
  // no illustration set. Public as KuehAccount.resolveAvatar — for a
  // leaderboard/friends list showing *other* players' avatars, not just
  // your own (profiles is publicly readable, see AUTH.md and
  // supabase/migrations/0001_init.sql's profiles_select_public).
  function resolveAvatar(profile) {
    var ill = profile && findIllustration(profile.avatar_illustration);
    if (!ill) return null;
    return { src: ill.src, color: profile.avatar_color || null };
  }

  // The signed-in user's own avatar — null if signed out, still loading, or
  // no avatar assigned yet.
  function getAvatarInfo() {
    return resolveAvatar(currentProfile);
  }

  function renderBadge() {
    if (!badgeBtn) return;
    var showingAvatar = !!(currentSession && currentProfile && findIllustration(currentProfile.avatar_illustration));
    badgeBtn.classList.toggle('has-avatar', showingAvatar);
    // defaultBadgeBackground (set once in mount() — data-badge-background,
    // or docked mode's auto-derived header-matching chip) is what a
    // signed-out or avatar-less badge should show; an avatar's own color
    // overrides it while showing one, and needs to be put back afterwards
    // rather than just cleared, or a docked badge would revert to the CSS
    // default transparent instead of its computed chip. Same for border —
    // a page-matched data-badge-border is signed-out chrome (see mount()'s
    // comment), so it steps aside for a real avatar too, not just the fill.
    badgeBtn.style.background = showingAvatar ? currentProfile.avatar_color : defaultBadgeBackground;
    badgeBtn.style.border = showingAvatar ? 'none' : defaultBadgeBorder;
    badgeBtn.innerHTML = currentSession ? avatarInnerHtml() : (ICON_USER_SVG || FALLBACK_PERSON_SVG);
    renderPanel();
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // Makes a non-native clickable element (a <div>, since the badge holds
  // an SVG/initials rather than plain text a <button> would center less
  // predictably) behave like a real button: click AND keyboard (focusable,
  // Enter/Space activate it) both wired from the one call, so callers can't
  // add the click half and forget the keyboard half or vice versa.
  function makeButtonLike(node, onActivate) {
    node.setAttribute('tabindex', '0');
    if (!node.hasAttribute('role')) node.setAttribute('role', 'button');
    node.addEventListener('click', onActivate);
    node.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onActivate(ev); }
    });
  }

  function renderPanel() {
    if (!panelEl) return;
    panelEl.innerHTML = '';
    // Only visible at mobile widths (.panel-close, CSS) — the popover on
    // desktop already closes via the outside-click handler, but a modal
    // over the whole screen needs an explicit, discoverable way out.
    var closeBtn = el('button', 'panel-close', ICON_CLOSE_SVG || FALLBACK_CLOSE_SVG);
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', function () { togglePanel(false); });
    panelEl.appendChild(closeBtn);
    if (currentSession) {
      if (accountView === 'avatar') renderAvatarEditor();
      else renderAccountPanel();
    } else {
      renderAuthPanel();
    }
  }

  function renderAccountPanel() {
    var user = currentSession.user;
    var row = el('div', 'account-row');
    var avatarBtn = el('button', 'account-avatar', avatarInnerHtml());
    if (currentProfile && currentProfile.avatar_color) avatarBtn.style.background = currentProfile.avatar_color;
    avatarBtn.setAttribute('aria-label', 'Edit avatar');
    avatarBtn.appendChild(el('span', 'account-avatar-edit', ICON_EDIT_SVG || FALLBACK_EDIT_SVG));
    avatarBtn.addEventListener('click', function () { accountView = 'avatar'; renderPanel(); });
    row.appendChild(avatarBtn);

    var col = el('div', 'account-info');
    // profiles.display_name is the one updateProfile()/every game's name-
    // edit UI actually writes to (see AUTH.md's "One identity, everywhere")
    // — reading user_metadata.display_name here instead would show the
    // name frozen at signup, ignoring every rename since.
    var currentName = (currentProfile && currentProfile.display_name)
      || (user.user_metadata && user.user_metadata.display_name)
      || (user.email ? user.email.split('@')[0] : 'Signed in');
    renderNameDisplay(col, currentName);
    row.appendChild(col);
    panelEl.appendChild(row);

    var signOutBtn = el('button', 'btn btn-ghost', 'Sign out');
    signOutBtn.style.marginTop = '14px';
    signOutBtn.addEventListener('click', function () {
      signOut().catch(function (e) { console.error('[KuehAccount] sign out failed:', e); });
    });
    panelEl.appendChild(signOutBtn);
  }

  // Display mode: the name as a real <button> (Enter/Space work, not just
  // click — see makeButtonLike's own comment on why this matters) with a
  // real Lucide pencil next to it, matching .avatar-editor-back's "icon +
  // text" convention rather than a bare pencil-only affordance.
  function renderNameDisplay(col, name) {
    col.innerHTML = '';
    var nameBtn = el('button', 'account-name-btn',
      '<span>' + escapeHtml(name) + '</span>' + (ICON_EDIT_SVG || FALLBACK_EDIT_SVG));
    nameBtn.setAttribute('aria-label', 'Edit name');
    nameBtn.addEventListener('click', function () { startNameEdit(col, name); });
    col.appendChild(nameBtn);
    col.appendChild(el('div', 'account-email', escapeHtml(currentSession.user.email || '')));
  }

  // Edit mode: applies immediately on Enter/blur, same "no separate Save
  // step" convention as the avatar editor's tiles/swatches — updateProfile()
  // pushes it to the same profiles.display_name every game reads, so
  // renaming yourself here renames you everywhere (see AUTH.md).
  function startNameEdit(col, currentName) {
    col.innerHTML = '';
    var input = el('input', 'account-name-input');
    input.type = 'text';
    input.maxLength = 40;
    input.value = currentName;
    col.appendChild(input);
    col.appendChild(el('div', 'account-email', escapeHtml(currentSession.user.email || '')));
    input.focus();
    input.select();
    var committed = false;
    function commit() {
      if (committed) return;
      committed = true;
      var val = input.value.trim();
      if (val && val !== currentName) updateProfile({ display_name: val });
      else renderPanel();
    }
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); committed = true; renderPanel(); }
    });
    input.addEventListener('blur', commit);
  }

  // Same panel, same level as Sign out — not a separate modal-on-a-modal —
  // reached by clicking the avatar itself in renderAccountPanel(). Every
  // tile/swatch click applies immediately (updateProfile()) and re-renders
  // this same view so the preview/active states stay in sync; "Back"
  // returns to the normal account view, there's no separate save step.
  function renderAvatarEditor() {
    var backBtn = el('button', 'avatar-editor-back', (ICON_BACK_SVG || FALLBACK_BACK_SVG) + 'Back');
    backBtn.addEventListener('click', function () { accountView = 'main'; renderPanel(); });
    panelEl.appendChild(backBtn);

    panelEl.appendChild(el('h3', '', 'Choose your kueh'));

    var activeIll = findIllustration(currentProfile && currentProfile.avatar_illustration) || AVATAR_ILLUSTRATIONS[0];
    var activeColor = (currentProfile && currentProfile.avatar_color) || AVATAR_COLORS[0];

    var preview = el('div', 'avatar-preview', '<img class="avatar-img" src="' + activeIll.src + '" alt="" />');
    preview.style.background = activeColor;
    panelEl.appendChild(preview);

    var grid = el('div', 'avatar-grid');
    AVATAR_ILLUSTRATIONS.forEach(function (ill) {
      var tile = el('button', 'avatar-tile' + (ill.id === activeIll.id ? ' active' : ''),
        '<img src="' + ill.src + '" alt="' + escapeHtml(ill.label) + '" />');
      tile.setAttribute('aria-label', ill.label);
      tile.setAttribute('aria-pressed', ill.id === activeIll.id ? 'true' : 'false');
      tile.addEventListener('click', function () { updateProfile({ avatar_illustration: ill.id }); });
      grid.appendChild(tile);
    });
    panelEl.appendChild(grid);

    panelEl.appendChild(el('label', '', 'Background'));
    var swatchRow = el('div', 'avatar-swatch-row');
    AVATAR_COLORS.forEach(function (color) {
      var swatch = el('button', 'avatar-swatch' + (color === activeColor ? ' active' : ''));
      swatch.style.background = color;
      swatch.setAttribute('aria-label', color);
      swatch.setAttribute('aria-pressed', color === activeColor ? 'true' : 'false');
      swatch.addEventListener('click', function () { updateProfile({ avatar_color: color }); });
      swatchRow.appendChild(swatch);
    });
    panelEl.appendChild(swatchRow);
  }

  function renderAuthPanel() {
    panelEl.appendChild(el('h3', '', authMode === 'signup' ? 'Create an account' : 'Sign in'));

    var googleBtn = el('button', 'btn btn-google', GOOGLE_SVG + '<span>Continue with Google</span>');
    googleBtn.addEventListener('click', function () {
      signInWithGoogle().catch(function (e) { showError(e.message || 'Google sign-in failed.'); });
    });
    panelEl.appendChild(googleBtn);

    var divider = el('div', '', '');
    divider.style.cssText = 'text-align:center;margin:12px 0;opacity:0.5;font-size:11px;';
    divider.textContent = 'or';
    panelEl.appendChild(divider);

    if (authMode === 'signup') {
      panelEl.appendChild(el('label', '', 'Display name'));
      var nameInput = el('input', '');
      nameInput.type = 'text';
      panelEl.appendChild(nameInput);
    }

    panelEl.appendChild(el('label', '', 'Email'));
    var emailInput = el('input', '');
    emailInput.type = 'email';
    panelEl.appendChild(emailInput);

    panelEl.appendChild(el('label', '', 'Password'));
    var pwInput = el('input', '');
    pwInput.type = 'password';
    panelEl.appendChild(pwInput);

    var errEl = el('div', 'error', '');
    panelEl.appendChild(errEl);

    var submitLabel = authMode === 'signup' ? 'Sign up' : 'Log in';
    var submitBtn = el('button', 'btn', submitLabel);
    submitBtn.addEventListener('click', function () {
      var email = emailInput.value.trim();
      var password = pwInput.value;
      if (!email || !password) { errEl.textContent = 'Enter your email and password.'; return; }
      submitBtn.disabled = true;
      submitBtn.textContent = authMode === 'signup' ? 'Signing up…' : 'Logging in…';
      var task = authMode === 'signup'
        ? signUp({ email: email, password: password, displayName: panelEl.querySelector('input[type=text]') ? panelEl.querySelector('input[type=text]').value.trim() : '' })
        : signInWithPassword({ email: email, password: password });
      task
        .then(function () { errEl.textContent = ''; })
        .catch(function (e) { errEl.textContent = e.message || 'Something went wrong.'; })
        .finally(function () { submitBtn.disabled = false; submitBtn.textContent = submitLabel; });
    });
    panelEl.appendChild(submitBtn);

    var switchEl = el('div', 'switch-mode', authMode === 'signup' ? 'Already have an account? Log in' : "Don't have an account? Sign up");
    makeButtonLike(switchEl, function () {
      authMode = authMode === 'signup' ? 'login' : 'signup';
      renderPanel();
    });
    panelEl.appendChild(switchEl);

    function showError(msg) { errEl.textContent = msg; }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Guards a specific race: opening the panel from a click that itself
  // originates outside the shadow host — e.g. a host page's own "Sign in"
  // link calling KuehAccount.openPanel() (machines/ruth/index.html) — has
  // that same click event go on to bubble to the document-level outside-
  // click listener below, within the same synchronous dispatch, which
  // would otherwise see "a click outside the host while the panel is open"
  // and immediately close what just opened. setTimeout(...,0) doesn't run
  // until after the whole synchronous dispatch (including that bubble-
  // phase listener) finishes, so the flag is still true when it matters.
  var suppressNextOutsideClose = false;

  // Desktop only — mobile's centered-modal position comes entirely from the
  // CSS media query (position:fixed; top:50%; left:50%; transform:...),
  // untouched here. Reads the badge's real on-screen position fresh each
  // time (not a fixed offset) since it varies by host page — floating
  // corner vs. docked in a header — and can shift with page reflow even on
  // one page. Sets *custom properties* the stylesheet's data-anchor rules
  // reference via var(), not top/left/right/bottom directly: those are
  // still declared in the stylesheet (mount()'s CSS), so the mobile media
  // query's own position rules keep cleanly overriding them by viewport
  // width alone — setting the coordinates as literal inline styles instead
  // would out-specificity the media query in both directions and need the
  // same clear-on-resize dance either way.
  function updatePanelPosition() {
    if (window.matchMedia('(max-width: 640px)').matches) return;
    var rect = badgeBtn.getBoundingClientRect();
    var isRight = currentOpts.anchor.indexOf('right') !== -1;
    var isBottom = currentOpts.anchor.indexOf('bottom') !== -1;
    var x = isRight ? (window.innerWidth - rect.right) : rect.left;
    var y = isBottom ? (window.innerHeight - rect.top + 8) : (rect.bottom + 8);
    panelEl.style.setProperty('--ka-panel-x', x + 'px');
    panelEl.style.setProperty('--ka-panel-y', y + 'px');
  }

  function togglePanel(force) {
    panelOpen = typeof force === 'boolean' ? force : !panelOpen;
    if (panelOpen) updatePanelPosition();
    panelEl.classList.toggle('open', panelOpen);
    backdropEl.classList.toggle('open', panelOpen);
    if (panelOpen) {
      suppressNextOutsideClose = true;
      setTimeout(function () { suppressNextOutsideClose = false; }, 0);
    }
  }

  // Keeps the popover pinned to the badge (not stranded where it was) if the
  // page reflows while it's open — e.g. a docked badge shifting position on
  // resize, or crossing the mobile breakpoint entirely.
  window.addEventListener('resize', function () {
    if (panelOpen) updatePanelPosition();
  });

  // Applies the resolved size/color custom properties to any host element —
  // called for both `host` (the badge) and `panelHost` (the portal), so
  // either shadow tree's copy of CSS resolves the same values regardless of
  // which one a given rule happens to live in.
  function applyThemeVars(target, size, palette, iconColor, iconColorMuted) {
    target.style.setProperty('--ka-badge-size', size + 'px');
    target.style.setProperty('--ka-color-primary-strong', palette.strong);
    target.style.setProperty('--ka-color-primary', palette.light);
    target.style.setProperty('--ka-color-text-on-primary', palette.onAccent);
    // Left unset when not given — .badge.docked's `color: var(--ka-icon-
    // color-muted)` then falls through to :host's own default chain
    // (--ka-icon-color-muted → --ka-icon-color → --ka-color-primary-strong;
    // custom properties resolve at use time, so that still picks up the
    // accent override above) rather than needing this to duplicate it.
    if (iconColor) target.style.setProperty('--ka-icon-color', iconColor);
    if (iconColorMuted) target.style.setProperty('--ka-icon-color-muted', iconColorMuted);
  }

  function mount(opts) {
    currentOpts = Object.assign({}, currentOpts, opts || {});

    if (host && host.parentNode) host.parentNode.removeChild(host);
    if (panelHost && panelHost.parentNode) panelHost.parentNode.removeChild(panelHost);

    var parent = currentOpts.mountInto ? document.querySelector(currentOpts.mountInto) : document.body;
    if (!parent) {
      console.error('[KuehAccount] mountInto selector "' + currentOpts.mountInto + '" not found; falling back to document.body.');
      parent = document.body;
    }

    var docked = currentOpts.mode === 'docked';
    // Never below MIN_BADGE_SIZE — see its own definition for why.
    var size = Math.max(currentOpts.size || (docked ? MIN_BADGE_SIZE : 52), MIN_BADGE_SIZE);
    var palette = resolveAccentPalette(currentOpts.accentColor, currentOpts.iconColor);

    // ── Badge: mounted per data-mode, wherever the host page wants it ────
    host = document.createElement('div');
    if (docked) {
      // Anchored to mountInto's left/right edge, vertically centered — an
      // existing header/nav bar's own layout (its centered/left-aligned nav
      // links, say) shouldn't have to reflow around a new flex item; the
      // icon sits independently at the bar's own edge instead, the same
      // "brand left, account far right" split most sites already use.
      // position:absolute needs a positioned ancestor to anchor within —
      // most header bars already are (position:sticky, e.g. root's
      // .site-nav), but force it with position:relative on mountInto itself
      // if it isn't, same as any other "just-in-time" popover-positioning
      // library would.
      if (window.getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      host.style.position = 'absolute';
      host.style[currentOpts.anchor.indexOf('left') !== -1 ? 'left' : 'right'] =
        (currentOpts.inset != null ? currentOpts.inset : 20) + 'px';
      host.style.top = '50%';
      host.style.transform = 'translateY(-50%)';
    } else {
      host.style.position = currentOpts.mode === 'absolute' ? 'absolute' : 'fixed';
      applyPos(host, currentOpts);
    }
    host.style.zIndex = '2147483000';
    // Explicit size, not left to shrink-to-fit: host's only child (.badge)
    // is position:absolute (top:0;left:0, filling host exactly), so it
    // doesn't contribute to an auto-width box's sizing at all — left unset,
    // host collapses to 0×0 and the badge (falling back to static-position
    // with no explicit offsets) renders straddling wherever it lands
    // instead of sitting inside it.
    host.style.width = size + 'px';
    host.style.height = size + 'px';
    applyThemeVars(host, size, palette, currentOpts.iconColor, currentOpts.iconColorMuted);
    parent.appendChild(host);

    shadow = host.attachShadow({ mode: 'open' });
    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    shadow.appendChild(styleEl);

    badgeBtn = el('div', 'badge' + (docked ? ' docked' : ''), ICON_USER_SVG || FALLBACK_PERSON_SVG);
    badgeBtn.setAttribute('aria-label', 'Account');
    if (currentOpts.badgeBackground) {
      badgeBtn.style.background = currentOpts.badgeBackground;
    } else if (docked) {
      // Auto-derived "raised chip" (see deriveDockedChipBackground) —
      // data-badge-background always wins if a page wants to hand-pick
      // something specific instead (see Ruth's exact-gradient-match case).
      var chipBg = deriveDockedChipBackground(parent);
      if (chipBg) badgeBtn.style.background = chipBg;
    }
    // Remembered so renderBadge() can restore it once a signed-in avatar's
    // own color (which overrides this while showing) goes away again —
    // clearing to '' instead would fall through to the CSS default
    // (transparent for docked) and lose this per-page computed/configured
    // value for good, not just while there's no avatar to show.
    defaultBadgeBackground = badgeBtn.style.background || '';
    if (currentOpts.badgeBorder) badgeBtn.style.border = currentOpts.badgeBorder;
    // Same restore-on-sign-out story as defaultBadgeBackground above — a
    // page-matching border (e.g. Ruth's gold ring, styled to pair with her
    // signed-out audioBtn look) is signed-out chrome, not part of the
    // avatar; renderBadge() clears it while a real avatar is showing so the
    // avatar's own color/illustration reads as the whole badge, then
    // restores this exact value once there's nothing to show instead.
    defaultBadgeBorder = badgeBtn.style.border || '';
    // stopPropagation here (not just inside makeButtonLike's shared handler)
    // so the document-level "click outside closes the panel" listener never
    // sees this click at all — without it, opening the panel and closing it
    // would race on the same click.
    makeButtonLike(badgeBtn, function (ev) {
      ev.stopPropagation();
      togglePanel();
    });
    shadow.appendChild(badgeBtn);

    // ── Panel + backdrop: always a SEPARATE portal appended straight to
    // document.body, never inside `host` — a docked badge's host page
    // element (a header/nav bar) commonly has its own z-index and thus its
    // own stacking context, which would otherwise cap the popover's paint
    // order beneath *unrelated* page content with a higher one (confirmed
    // on root: the water-clock drop-chute animation, a body-level sibling
    // with its own stacking context, painted over the panel when it lived
    // inside .site-nav). A plain body-level portal with a very high z-index
    // has no such ceiling. position:fixed doesn't care about this element's
    // own DOM nesting either way, so this changes nothing about how the
    // panel positions itself, only where it sits in the paint order. ─────
    panelHost = document.createElement('div');
    panelHost.style.cssText = 'position:fixed; top:0; left:0; width:0; height:0; z-index:2147483000;';
    applyThemeVars(panelHost, size, palette, currentOpts.iconColor, currentOpts.iconColorMuted);
    document.body.appendChild(panelHost);

    panelShadow = panelHost.attachShadow({ mode: 'open' });
    var panelStyleEl = document.createElement('style');
    panelStyleEl.textContent = CSS;
    panelShadow.appendChild(panelStyleEl);

    // Only ever visible at mobile widths (.backdrop, CSS) — on desktop the
    // popover closes via the document-level outside-click handler instead.
    backdropEl = el('div', 'backdrop');
    backdropEl.addEventListener('click', function () { togglePanel(false); });
    panelShadow.appendChild(backdropEl);

    panelEl = el('div', 'panel');
    // Anchor communicated via a data attribute, not inline top/right/left/
    // bottom styles, so the mobile media query (CSS, above) can cleanly
    // override desktop's anchored-popover position with a centered-modal
    // one at equal specificity — inline styles would otherwise always win
    // over a stylesheet rule regardless of media query. The actual desktop
    // coordinates (--ka-panel-x/y, computed from the badge's real on-screen
    // position) are set later, in updatePanelPosition() — not here, since
    // the badge hasn't necessarily settled into its final layout position
    // yet at mount time (e.g. docked mode, font loading reflow).
    panelEl.dataset.anchor = currentOpts.anchor;
    // Stops keydown from leaking out to the host page while the panel's
    // open — both correct modal behavior on its own, and a real fix for a
    // cross-page bug: Shadow DOM retargets event.target to the shadow HOST
    // for listeners outside the shadow tree, so a host page's own
    // `if (e.target.tagName === 'INPUT') return` guard (e.g. Liwei's
    // WASD handler, main.js) never sees "INPUT" for a keystroke typed into
    // this panel's fields — it falls through and treats "w"/"a"/"s"/"d" as
    // game input, both moving the snake and preventDefault()-ing the
    // character before it reaches the field. Any other contributor's page
    // with a similar raw document-level key handler would hit the same
    // bug, so this is fixed here once rather than patched per host page.
    panelEl.addEventListener('keydown', function (ev) { ev.stopPropagation(); });
    panelShadow.appendChild(panelEl);

    renderBadge();
  }

  // Registered once, not per mount() — `host`/`panelHost` are read live via
  // closure, so this keeps working across remounts. Uses composedPath()
  // rather than .contains(): a plain contains() check doesn't see through
  // the Shadow DOM boundary, so it would (incorrectly) treat every click
  // inside the panel — typing an email, hitting submit — as an "outside"
  // click and close the panel before the click could register. Checks both
  // hosts since the badge (host) and the panel/backdrop (panelHost) are two
  // separate elements now (see mount()'s portal comment).
  document.addEventListener('click', function (ev) {
    if (suppressNextOutsideClose) { suppressNextOutsideClose = false; return; }
    if (!panelOpen || !host || !panelHost) return;
    var path = ev.composedPath();
    if (!path.includes(host) && !path.includes(panelHost)) togglePanel(false);
  });

  // ── Public API ───────────────────────────────────────────────────────
  function signUp(fields) {
    return ready.then(function (c) {
      return c.auth.signUp({
        email: fields.email,
        password: fields.password,
        options: fields.displayName ? { data: { display_name: fields.displayName } } : undefined,
      });
    }).then(unwrap);
  }

  function signInWithPassword(fields) {
    return ready.then(function (c) {
      return c.auth.signInWithPassword({ email: fields.email, password: fields.password });
    }).then(unwrap);
  }

  function signInWithGoogle() {
    return ready.then(function (c) {
      return c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
    }).then(unwrap);
  }

  function signOut() {
    return ready.then(function (c) { return c.auth.signOut(); }).then(unwrap);
  }

  function unwrap(res) {
    if (res && res.error) throw res.error;
    return res && res.data;
  }

  window.KuehAccount = {
    init: mount,
    ready: ready,
    getClient: function () { return client; },
    getUser: function () { return currentSession ? currentSession.user : null; },
    getSession: function () { return currentSession; },
    // { display_name, avatar_illustration, avatar_color } for the signed-in
    // user, or null (signed out / still loading / no row). Most callers
    // want getAvatarInfo() instead for the avatar specifically — this is
    // for display_name, or for reading avatar_illustration's raw id.
    getProfile: function () { return currentProfile; },
    // Resolved { src, color } for the current avatar, or null — see its
    // own comment above (getAvatarInfo, near updateProfile).
    getAvatarInfo: getAvatarInfo,
    // Same resolution, for any { avatar_illustration, avatar_color } row —
    // e.g. another player's, fetched from the (publicly readable) profiles
    // table for a leaderboard/friends list. See its own comment above.
    resolveAvatar: resolveAvatar,
    // Same field the badge/account panel show — see AUTH.md's "One
    // identity, everywhere". Pass { display_name } to rename the account
    // itself (not a per-game nickname), or { avatar_illustration,
    // avatar_color } (what the avatar editor itself calls this with).
    updateProfile: updateProfile,
    onAuthStateChange: function (fn) {
      authListeners.push(fn);
      return function () {
        var idx = authListeners.indexOf(fn);
        if (idx !== -1) authListeners.splice(idx, 1);
      };
    },
    // Fires whenever display_name/avatar_illustration/avatar_color change —
    // after sign-in's initial fetch resolves, and after every updateProfile()
    // call (including ones from elsewhere, e.g. someone editing their avatar
    // via the badge while your own page is open). onAuthStateChange alone
    // won't catch that second case since no sign-in/out happened.
    onProfileChange: function (fn) {
      profileListeners.push(fn);
      return function () {
        var idx = profileListeners.indexOf(fn);
        if (idx !== -1) profileListeners.splice(idx, 1);
      };
    },
    signUp: signUp,
    signInWithPassword: signInWithPassword,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    // Lets a host page open the panel from its own UI — e.g. a "Sign in"
    // link inside a game's own onboarding flow (see machines/ruth/index.html)
    // — instead of requiring a click directly on the badge itself.
    openPanel: function () { togglePanel(true); },
    closePanel: function () { togglePanel(false); },
  };

  function autoMount() { mount(currentOpts); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
})();
