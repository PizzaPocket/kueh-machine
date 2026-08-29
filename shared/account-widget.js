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
// Machine green regardless of context reads as pasted-on rather than part of
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
//     background (see root index.html: dark green accent for the panel, but
//     light on-primary for the icon sitting on that same dark green nav bar).
//     data-icon-color-muted: docked mode's *default* (non-hover) icon
//     color, if a header's own text-buttons sit at a dimmer shade until
//     hovered/focused and you want the icon to match that exactly (root's
//     nav links do; see root index.html) — falls back to data-icon-color
//     (no dimming) if omitted.
//     data-badge-background / data-badge-border / data-badge-shadow: raw CSS
//     values overriding the floating/absolute badge's own fill, border, and
//     shadow outright, for matching
//     an *existing* button's exact look (gradient, translucency, etc.)
//     rather than a flat accent color — see Ruth's #audioBtn.
//   Omit all of the above and everything defaults to the fixed Kueh
//   Machine pandan-green look.
//
// Public API — window.KuehAccount:
//   init(options)   { anchor, mountInto, mode: 'fixed'|'absolute'|'docked',
//                      size, inset, accentColor, iconColor, iconColorMuted,
//                      badgeBackground, badgeBorder, badgeShadow }
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
//   updateEmail(newEmail)          sends a confirmation email (both old and new address — this
//                                   project's "Secure email change" setting); doesn't switch instantly
//   updatePassword(newPassword)
//   deleteAccount()                 permanent — calls the delete-account Edge Function, then signs out
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
    badgeShadow: (scriptEl && scriptEl.dataset.badgeShadow) || null,
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
  // Host features may add one first-level account action without forking the
  // shared panel. Character editing uses this to stay a true account action.
  var accountActions = [];
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
  var ICON_FORWARD_SVG = null;
  import('https://esm.sh/lucide@latest').then(function (mod) {
    var userEl = mod.createElement(mod.CircleUserRound);
    userEl.setAttribute('width', '24');
    userEl.setAttribute('height', '24');
    ICON_USER_SVG = userEl.outerHTML;
    var xEl = mod.createElement(mod.X);
    xEl.setAttribute('width', '20');
    xEl.setAttribute('height', '20');
    ICON_CLOSE_SVG = xEl.outerHTML;
    var pencilEl = mod.createElement(mod.Pencil);
    pencilEl.setAttribute('width', '9');
    pencilEl.setAttribute('height', '9');
    ICON_EDIT_SVG = pencilEl.outerHTML;
    // ChevronLeft, not ArrowLeft — house convention is chevrons for "back"
    // (a plain directional indicator inside a still-in-place control), not
    // an arrow-with-tail (which reads more like "move/send this way").
    var backEl = mod.createElement(mod.ChevronLeft);
    backEl.setAttribute('width', '20');
    backEl.setAttribute('height', '20');
    ICON_BACK_SVG = backEl.outerHTML;
    // ChevronRight — the same "back" convention, mirrored, for a row that
    // drills forward into a sub-view (the Manage Account row).
    var forwardEl = mod.createElement(mod.ChevronRight);
    forwardEl.setAttribute('width', '20');
    forwardEl.setAttribute('height', '20');
    ICON_FORWARD_SVG = forwardEl.outerHTML;
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
  var DEFAULT_ACCENT = { strong: '#037031', light: '#4da664', onAccent: '#d1ead5' };

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

  // ── Superellipse shapes ("retro-rectangle") ─────────────────────────────
  // Ported by value from src/tokens/superellipse.js + src/atoms/retro-
  // shape.js — root's own shape engine behind .btn/.tab/.file-card and
  // every other small control (see index.html's own comment on them), so
  // the panel's inputs/buttons pick up the site's actual corner character
  // instead of a plain border-radius standing in for it. Can't import
  // those modules directly (this file is a classic script, no build step —
  // see its own top-of-file comment), so this is the same "duplicate the
  // essential math locally" move the color helpers above already make.
  // Only the "clip-only, element already paints its own background" mode
  // is needed here (createRetroShape()'s no-fill branch) — every button/
  // input this applies to already has a real background of its own.
  function superellipsePointAt(t, a, b, n) {
    var cos = Math.cos(t), sin = Math.sin(t);
    return [
      a * Math.sign(cos) * Math.pow(Math.abs(cos), 2 / n),
      b * Math.sign(sin) * Math.pow(Math.abs(sin), 2 / n),
    ];
  }
  function buildSuperellipsePath(width, height, n, originX, originY) {
    var a = width / 2, b = height / 2, samples = 96, d = '';
    for (var i = 0; i < samples; i++) {
      var t = (i / samples) * Math.PI * 2;
      var p = superellipsePointAt(t, a, b, n);
      var px = Math.round((p[0] + originX) * 100) / 100;
      var py = Math.round((p[1] + originY) * 100) / 100;
      d += i === 0 ? ('M ' + px + ',' + py) : (' L ' + px + ',' + py);
    }
    return d + ' Z';
  }
  // Same n as root's own SMALL_RETRO_SHAPE_OPTS (src/atoms/retro-shape.js)
  // — the reference "small button" corner reused across .tab/small .btn
  // site-wide, so this panel's controls read as the same family instead of
  // a close-but-different approximation.
  var SMALL_RETRO_SHAPE_N = 6;
  // Raw SVG stroke-width applyRetroShapeClip's own stroke overlay defaults
  // to — deliberately NOT the same number as --ka-stroke-width (the plain
  // CSS border standard, 1px, set on :host below). The two produce the
  // SAME true visual width for a real, confirmed geometric reason, not a
  // coincidence and not "1px SVG looks fainter so bump it a bit": the
  // stroke overlay's <path> is drawn with the exact same `d` as el's own
  // clip-path, and an SVG stroke paints centered on its path — half the
  // width inside, half outside. el's clip-path then cuts away everything
  // outside that same path, including the outer half of its own stroke
  // overlay (clip-path clips an element's whole painted subtree, not just
  // its own fill — overflow:visible on the stroke <svg> doesn't exempt it,
  // confirmed directly: at matching nominal widths, every button's traced
  // edge rendered at roughly half the thickness of a plain CSS border
  // right next to it). A raw stroke-width of 2 here means exactly 1px
  // survives the clip, matching --ka-stroke-width's 1px CSS borders
  // exactly. Setting both to the same literal number (what this file did
  // at one point) silently doubles the CSS side's true width relative to
  // the button side's — the earlier "buttons read thinner than dividers"
  // bug, exactly.
  var STROKE_WIDTH = 2;
  // Ported by value from src/tokens/superellipse.js's own
  // superellipseValue/solveClearingExponent — for a big surface like the
  // panel, a single fixed n either looks flat (root's own default n:10, an
  // ~10px corner pull-in on a 300px-wide box — confirmed directly, that's
  // what "still reads as a rounded rectangle" was) or, picked more
  // aggressively by hand, clips real content (n:4 pulled the top-left
  // corner in far enough to cut into the "Create an account" heading —
  // also confirmed directly). Root's own system doesn't hand-pick a
  // constant for shapes like this either — it solves for the roundest n
  // that still clears a given padded margin, per the box's *actual*
  // current width/height, and lets ResizeObserver re-solve it on every
  // resize (switching between the panel's own auth form/account view/
  // avatar editor, each a different height). unlike root's own default
  // (minN: 10 — deliberately never rounder than that, see that module's
  // own comment), this panel wants the roundest safe shape it can get, so
  // applyRetroShapeClip's opts.gutter mode (below) is called with minN: 2.
  function superellipseValue(x, y, a, b, n) {
    return Math.pow(Math.abs(x / a), n) + Math.pow(Math.abs(y / b), n);
  }
  function solveClearingExponent(width, height, marginX, marginY, minN, maxN) {
    var a = width / 2, b = height / 2;
    var px = a - Math.min(marginX, a * 0.9);
    var py = b - Math.min(marginY, b * 0.9);
    if (superellipseValue(px, py, a, b, maxN) > 1) return maxN;
    if (superellipseValue(px, py, a, b, minN) <= 1) return minN;
    var lo = minN, hi = maxN;
    for (var i = 0; i < 30; i++) {
      var mid = (lo + hi) / 2;
      if (superellipseValue(px, py, a, b, mid) <= 1) hi = mid; else lo = mid;
    }
    return hi;
  }
  // Real SVG <clipPath> + url(#id), not the shorter `clip-path: path(...)`
  // inline form — matches root's own createRetroShape wiring exactly,
  // which exists for a reason (raw CSS path() clip-paths have had spotty
  // cross-browser support historically; an SVG clipPath referenced by url()
  // doesn't hit that). id-based url() refs resolve fine inside a shadow
  // root as long as both ends live in the same one, which they always do
  // here. Re-measures on resize (ResizeObserver, or a window resize
  // fallback) since the panel itself moves between a fixed desktop popover
  // width and a fluid mobile modal width — see .panel's own media queries.
  var retroShapeUid = 0;
  // opts.stroke: draws the border as a *second*, visible, unclipped SVG
  // overlay tracing the exact same path as the clip — not a plain CSS
  // `border` on el itself. A CSS border follows el's rectangular border-box
  // and gets cut off wherever that rectangle doesn't line up with the
  // curved clip silhouette (confirmed directly: .btn-google's border was
  // visibly clipped square-ish at the corners instead of following the
  // swell). Only pass this for elements that need a visible edge — most
  // callers here paint a flat, borderless fill and don't.
  function applyRetroShapeClip(el, n, opts) {
    opts = opts || {};
    var id = 'ka-retro-shape-' + (retroShapeUid++);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = '<defs><clipPath id="' + id + '" clipPathUnits="userSpaceOnUse"><path d=""/></clipPath></defs>';
    el.appendChild(svg);
    el.style.clipPath = 'url(#' + id + ')';
    var pathEl = svg.querySelector('path');

    var strokeSvg = null, strokePathEl = null;
    if (opts.stroke) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      strokeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      strokeSvg.setAttribute('aria-hidden', 'true');
      strokeSvg.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible;';
      strokeSvg.innerHTML = '<path fill="none" d=""/>';
      el.appendChild(strokeSvg);
      strokePathEl = strokeSvg.querySelector('path');
      // Inline style, not the stroke="" attribute — style values run
      // through normal custom-property resolution, so opts.stroke can be a
      // var(--ka-color-*) reference the same as any other color here.
      strokePathEl.style.stroke = opts.stroke;
      strokePathEl.style.strokeWidth = (opts.strokeWidth || STROKE_WIDTH) + 'px';
    }

    function update() {
      var w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      // opts.gutter: solve for the roundest n that still clears this much
      // padding on every resize, instead of a fixed exponent — see this
      // function's own comment above. Only the panel opts into this; every
      // other caller here (buttons/inputs) keeps the plain n/SMALL_RETRO_
      // SHAPE_N fallback, unaffected.
      var resolvedN = opts.gutter != null
        ? solveClearingExponent(w, h, opts.gutter, opts.gutter, opts.minN || 2, opts.maxN || 40)
        : (n || SMALL_RETRO_SHAPE_N);
      var d = buildSuperellipsePath(w, h, resolvedN, w / 2, h / 2);
      pathEl.setAttribute('d', d);
      if (strokePathEl) {
        strokeSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        strokePathEl.setAttribute('d', d);
      }
    }
    update();
    if (window.ResizeObserver) {
      new ResizeObserver(update).observe(el);
    } else {
      window.addEventListener('resize', update);
    }
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
  // A plain wrapper inside panelEl that owns all of the panel's *rendered
  // content* — every renderPanel()/renderAccountPanel()/renderAuthPanel()/
  // etc. call clears and rebuilds *this*, not panelEl directly. This is
  // load-bearing, not cosmetic: panelEl's own clip-path superellipse (see
  // mount()'s applyRetroShapeClip(panelEl, ...) call) works by appending a
  // <clipPath> defs <svg> as a *child of panelEl itself* — so a naive
  // `panelEl.innerHTML = ''` on every re-render was deleting that defs
  // <svg> along with the old content, the instant the very first
  // renderPanel() ran after mount(). The clip-path: url(#id) on panelEl
  // was left pointing at an id that no longer existed anywhere in the
  // document — an invalid reference, which renders as *no clipping at
  // all* — so the panel always looked like a plain rounded rectangle
  // (border-radius from .panel's own CSS) regardless of what n was passed
  // to applyRetroShapeClip; confirmed directly by inspecting the live DOM,
  // where the clip <svg> template's own querySelector came back empty
  // after the panel had rendered once. panelBodyEl is created once and
  // never cleared itself, so panelEl's clip/stroke <svg> siblings (which
  // sit next to it, not inside it) survive every re-render undisturbed.
  var panelBodyEl = null;
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
    // Ondeh-Ondeh's pandan-green palette (generatePalette({h:150,c:0.13}, ...),
    // src/tokens/colors.js) — the widget's fixed, non-rotating brand mark,
    // swapped from kueh-lapis's original magenta (DEFAULT_THEME) after the
    // magenta read as "super strong." Deliberately NOT touching
    // DEFAULT_THEME/kueh-lapis's own mapping in colors.js — that palette
    // still needs to stay accurate for kueh-lapis's own day in the real
    // rotation (kueh-of-day.js), a separate concern from this widget's own
    // permanently-fixed identity.
    + '  --ka-color-primary-strong: #037031;'
    + '  --ka-color-primary: #4da664;'
    + '  --ka-color-primary-soft: #83dc97;'
    + '  --ka-color-accent: #ffb490;'
    + '  --ka-color-surface: #fff7f3;'
    + '  --ka-color-surface-tint: #f6e5de;'
    + '  --ka-color-surface-border: #ddc4bb;'
    + '  --ka-color-text-on-surface: #004113;'
    + '  --ka-color-text-on-surface-muted: #2c6d3e;'
    + '  --ka-color-text-on-primary: #d1ead5;'
    + '  --ka-color-danger: #C43A2E;'
    + '  --ka-radius-card: 12px;'
    + '  --ka-radius-interactive: 8px;'
    + '  --ka-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;'
    + '  --ka-font-display: "Syne", var(--ka-font-sans);'
    + '  --ka-tracking-heading: -0.025em;'
    // Mirrors root's --type-label-size/--type-label-weight/--tracking-label
    // (index.html's own :root block) by value — 13px/700/0.08em, the exact
    // same numbers .site-nav a and .tab (styles/organisms/site-nav.css,
    // styles/atoms.css) read from those real tokens. Every .btn and
    // .field-edit-btn in this panel uses --ka-fs-body (13px, already equal
    // to 0.8125rem) and --ka-fw-bold (700) alongside this for font-size/
    // weight, so all four surfaces — header nav, kotd tabs, panel buttons,
    // row-edit links — provably share one typographic decision. This can't
    // reference index.html's tokens directly (classic script, no build
    // step, runs standalone on pages that never load index.html's inline
    // styles) — keep in sync by hand if those ever change.
    + '  --ka-tracking-label: 0.08em;'
    // Type scale — three sizes, three weights, each with one job, so every
    // piece of text in the panel picks a role instead of picking a number.
    // Weight is the load-bearing fix here: root's own body/identity text
    // (e.g. .fc-name, index.html) sits at 600, reserving 700 for *actions*
    // (root's own .btn, styles/atoms.css) — this panel used to default to
    // 700 almost everywhere (headings, buttons, and passive text like the
    // account name alike), which is what read as "too bold" against the
    // rest of the site. --ka-fw-bold now only ever lands on real actions
    // (buttons) and the Syne heading, matching that split.
    + '  --ka-fs-label: 11px;'
    + '  --ka-fs-body: 13px;'
    + '  --ka-fs-value: 14px;'
    + '  --ka-fs-heading: 16px;'
    // 16px, not --ka-fs-body's 13px — any input font-size below 16px makes
    // iOS Safari auto-zoom the whole page on focus, since it assumes
    // anything smaller is too small for the user to have intended to tap.
    + '  --ka-fs-input: 16px;'
    + '  --ka-fw-regular: 400;'
    + '  --ka-fw-medium: 600;'
    + '  --ka-fw-bold: 700;'
    // Standard size for a plain inline system icon (a back/forward chevron,
    // the mobile close X) — was landing at whatever size felt right per
    // call site (14px on the back button, 16px on close), which is what
    // read as "slightly too small" on the back chevron specifically. One
    // token, one size everywhere that calls for a normal icon. Bumped again
    // from an initial 16px to 20px — even unified, 16px still read as
    // slightly too small next to the panel's other text. The avatar-edit
    // pencil badge (--account-avatar-edit) stays smaller than this on
    // purpose — it is a tiny corner badge overlay on the avatar, not a
    // standalone icon, a deliberate exception rather than an oversight.
    + '  --ka-icon-size: 20px;'
    // The true visual hairline standard for a plain CSS border (dividers,
    // input outline) — 1px, NOT STROKE_WIDTH (2, above). Deliberately two
    // different numbers for the same visual result: see STROKE_WIDTH's own
    // comment for why a superellipse button's traced stroke needs double
    // the raw width to render at this same 1px once its own clip-path
    // cuts the outer half away.
    + '  --ka-stroke-width: 1px;'
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
    + '  box-shadow: 0 4px 14px rgba(0,65,19,0.32), 0 1px 4px rgba(0,65,19,0.2);'
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
    // 300px, not the old 260px — needed the extra room once inputs moved
    // to a 16px floor (see --ka-fs-input's own comment); 260px read as
    // cramped once labels/values/inputs stopped fighting for space at 13px.
    + '  position: fixed; width: 300px; padding: 20px;'
    + '  background: var(--ka-color-surface);'
    // No border here — same reasoning as .btn-google/.btn-ghost: a plain
    // CSS border follows this element's rectangular box, not its clipped
    // superellipse silhouette, so it gets cut off at the corners instead of
    // following the curve. mount()'s applyRetroShapeClip(panelEl, ...) call
    // draws the real edge via opts.stroke instead. filter: drop-shadow, not
    // box-shadow, for the same reason — box-shadow paints outside the
    // clipped shape, so it'd still show the old rectangular silhouette as a
    // shadow even once the fill itself reads as a superellipse; drop-shadow
    // follows the element's actual (clipped) alpha shape, same reasoning
    // root's own .btn-rim (styles/atoms.css) uses it over box-shadow.
    + '  border-radius: var(--ka-radius-card);'
    + '  filter: drop-shadow(0 12px 24px rgba(0,65,19,0.18)) drop-shadow(0 2px 6px rgba(0,65,19,0.12));'
    + '  color: var(--ka-color-text-on-surface); font-size: var(--ka-fs-body); display: none;'
    + '}'
    + '.panel.open { display: block; }'
    + '.backdrop {'
    + '  position: fixed; inset: 0; display: none;'
    // Plain black, not a brand-tinted scrim — a modal backdrop is neutral
    // dimming, not a colored surface; tinting it toward the brand color
    // read as a stray colored haze behind the panel rather than a shadow.
    + '  background: rgba(0,0,0,0.45); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);'
    + '}'
    + '.panel-close {'
    + '  display: none; position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;'
    + '  border-radius: 50%; border: none; background: var(--ka-color-surface-tint); color: var(--ka-color-text-on-surface);'
    + '  align-items: center; justify-content: center; cursor: pointer; padding: 0;'
    + '}'
    + '.panel-close:hover { background: var(--ka-color-surface-border); }'
    + '.panel-close:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    + '.panel-close svg { width: var(--ka-icon-size); height: var(--ka-icon-size); }'
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
    + '  margin: 0 0 12px; font-family: var(--ka-font-display); font-size: var(--ka-fs-heading); font-weight: var(--ka-fw-bold);'
    + '  letter-spacing: var(--ka-tracking-heading); color: var(--ka-color-text-on-surface);'
    + '}'
    // Small-caps field-label treatment — same family as root's own small
    // uppercase/letter-spaced labels (e.g. index.html's .eyebrow), scaled
    // down for a form field rather than a hero-sized kicker: 0.06em reads
    // as the same idea at 11px that 0.25em reads as at hero scale, not a
    // literal copy of a spacing number tuned for much bigger text.
    + '.panel label {'
    + '  display: block; margin: 10px 0 4px; color: var(--ka-color-text-on-surface-muted);'
    + '  font-size: var(--ka-fs-label); font-weight: var(--ka-fw-medium); letter-spacing: 0.06em; text-transform: uppercase;'
    + '}'
    + '.panel input {'
    // Sharp corners, deliberately — not every control gets the superellipse
    // clip; inputs stay flat-cornered on purpose, so the shape itself
    // becomes a signal ("this is a button") rather than blanket
    // decoration. Also sidesteps a real clipping artifact a curved input
    // had: a text caret/selection highlight is a plain rectangle, and
    // clipping it to a swelled-corner path made it look cut off near the
    // edges whenever the caret sat close to one.
    + '  width: 100%; padding: 11px 14px; border-radius: 0;'
    + '  border: var(--ka-stroke-width) solid var(--ka-color-surface-border); background: #fff;'
    + '  color: var(--ka-color-text-on-surface); font-size: var(--ka-fs-input); font-weight: var(--ka-fw-regular);'
    + '}'
    + '.panel input:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 1px; }'
    + '.btn {'
    + '  width: 100%; margin-top: 12px; padding: 11px 10px; border: none; border-radius: var(--ka-radius-interactive);'
    + '  background: var(--ka-color-primary-strong); color: var(--ka-color-text-on-primary);'
    // Bold + uppercase + tracked — matches root's .site-nav a exactly
    // (styles/organisms/site-nav.css), not .tab's own 600/sentence-case
    // (which .tab itself has since been brought up to this same header-nav
    // treatment too, styles/atoms.css). Every button in this panel now
    // reads as the same family as the site's own header links.
    + '  font-family: var(--ka-font-sans); font-weight: var(--ka-fw-bold); font-size: var(--ka-fs-body);'
    + '  text-transform: uppercase; letter-spacing: var(--ka-tracking-label); cursor: pointer;'
    + '  transition: background 0.15s ease;'
    + '}'
    + '.btn:hover { background: var(--ka-color-primary); }'
    + '.btn:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    + '.btn:disabled { opacity: 0.6; cursor: default; }'
    + '.btn-google {'
    // Google's own required brand mark/colors — not a Kueh Machine token,
    // left alone deliberately (see AUTH.md). No border here — a real CSS
    // border follows this element's rectangular box and gets clipped by
    // the curved superellipse mask wherever the two don't line up; the
    // visible edge instead comes from applyRetroShapeClip's opts.stroke
    // overlay (its call site), which traces the actual clipped path.
    // Text case/weight is the same brand exception — Google's own sign-in
    // button spec is sentence case at a medium weight, not the site's
    // bold/uppercase button convention, so this one button deliberately
    // opts back out of .btn's text-transform/letter-spacing/font-weight.
    + '  background: #fff; color: #3C3C3C;'
    + '  display: flex; align-items: center; justify-content: center; gap: 8px;'
    + '  text-transform: none; letter-spacing: normal; font-weight: var(--ka-fw-medium);'
    + '}'
    + '.btn-google:hover { background: var(--ka-color-surface-tint); }'
    + '.btn-ghost {'
    // No border here either — same reasoning as .btn-google above; its
    // edge comes from applyRetroShapeClip's opts.stroke overlay instead.
    + '  background: transparent; color: var(--ka-color-text-on-surface);'
    + '}'
    + '.btn-ghost:hover { background: var(--ka-color-surface-tint); }'
    + '.switch-mode {'
    // 20px, not the same 12px every other stacked element in this panel
    // uses — this one sits directly under a full-width tap-target button
    // (Sign up/Log in), and 12px read as close enough to fat-finger the
    // wrong one. Extra breathing room specifically because both are real
    // tap targets stacked vertically, not just visual rhythm.
    + '  margin-top: 20px; text-align: center; color: var(--ka-color-text-on-surface-muted);'
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
    + '.account-email {'
    + '  min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
    + '  color: var(--ka-color-text-on-surface-muted); font-size: var(--ka-fs-body);'
    + '}'
    // ── Reusable field row: LABEL / value + Edit ────────────────────────
    // One display+edit pattern for any single-line account field — display
    // name today, the shape an email field would reuse later (see AUTH.md's
    // account-management note) rather than each field growing its own
    // bespoke markup. .field-label reuses .panel label's own rule (same
    // element, not a separate class) so the "field label" and "form label"
    // read as one visual family, not two similar-but-different treatments.
    // ── Row list: shared vertical rhythm + divider for any account row ──
    // .field (a label/value/edit row) and .row-link (a plain forward-drill
    // row, e.g. Manage Account) both carry .acct-row and share this same
    // spacing/divider treatment when placed inside a .row-list wrapper —
    // one mechanism for "list of rows" regardless of what's inside each
    // one. :last-child, not a per-row flag threaded through from JS — the
    // one that happens to render last in the DOM is the one that loses its
    // divider, so reordering or adding a row never needs a second edit
    // anywhere else.
    + '.row-list { margin-top: 14px; }'
    + '.row-list > .acct-row {'
    + '  padding: 14px 0; border-bottom: var(--ka-stroke-width) solid var(--ka-color-surface-border);'
    + '}'
    + '.row-list > .acct-row:first-child { padding-top: 0; }'
    + '.row-list > .acct-row:last-child { border-bottom: none; padding-bottom: 0; }'
    + '.field { margin: 0; }'
    + '.field-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }'
    + '.field-value {'
    + '  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
    + '  font-size: var(--ka-fs-value); font-weight: var(--ka-fw-medium); color: var(--ka-color-text-on-surface);'
    + '}'
    // A text button, not a filled one — deliberately lighter-weight than
    // .btn/.btn-ghost (no background/shape of its own to clip), the same
    // "plain colored text, not a box" register as .switch-mode below. Same
    // bold/uppercase/tracked treatment as .btn and .site-nav a though, not
    // a separate convention — an underline used to be what marked this as
    // interactive; that job now belongs to the shared button typography
    // instead, so the underline comes off.
    + '.field-edit-btn {'
    + '  flex-shrink: 0; background: none; border: none; padding: 0; cursor: pointer;'
    + '  font-family: var(--ka-font-sans); font-weight: var(--ka-fw-bold); font-size: var(--ka-fs-body);'
    + '  text-transform: uppercase; letter-spacing: var(--ka-tracking-label);'
    + '  color: var(--ka-color-primary-strong);'
    + '}'
    + '.field-edit-btn:hover { color: var(--ka-color-primary); }'
    + '.field-edit-btn:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    // A whole-row forward-drill link (Manage Account) — label left, chevron
    // right, no separate "label" line above it the way .field has, since
    // there's no value to show, just a destination. Plain text weight, not
    // the bold/uppercase button treatment — this isn't an action, it's
    // navigation, the same distinction .switch-mode already draws.
    + '.row-link {'
    + '  display: flex; align-items: center; justify-content: space-between; gap: 10px; cursor: pointer;'
    + '  font-size: var(--ka-fs-value); font-weight: var(--ka-fw-medium); color: var(--ka-color-text-on-surface);'
    + '}'
    + '.row-link:hover { color: var(--ka-color-primary-strong); }'
    + '.row-link:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    + '.row-link svg { width: var(--ka-icon-size); height: var(--ka-icon-size); color: var(--ka-color-text-on-surface-muted); flex-shrink: 0; }'
    // "Kueh Machine Home" — a real <a href>, not a fake button; this leaves
    // the panel entirely (unlike Manage Account, which drills into a sub-
    // view), so it earns real link semantics (cmd/middle-click, "open in
    // new tab"). Icon-left, text-right rather than .row-link's text/chevron
    // pair — there's no destination-within-the-panel to point at, just a
    // small mark identifying where this leads. Left-aligned, no
    // justify-content: space-between, since there's nothing to push right.
    + '.row-home {'
    + '  display: flex; align-items: center; gap: 10px; text-decoration: none;'
    + '  font-size: var(--ka-fs-value); font-weight: var(--ka-fw-medium); color: var(--ka-color-text-on-surface);'
    + '}'
    + '.row-home:hover { color: var(--ka-color-primary-strong); }'
    + '.row-home:hover .row-home-icon { transform: scale(1.08); }'
    + '.row-home:focus-visible { outline: 2px solid var(--ka-color-accent); outline-offset: 2px; }'
    // 36px circle — same diameter AND same background as .account-avatar
    // (the user's own avatar at the top of this panel, var(--ka-color-
    // primary-soft), no border) — one consistent "circular identity mark"
    // treatment for both, not two different circle conventions competing
    // in the same panel. Padded rather than full-bleed, matching how every
    // avatar illustration/swatch in this file already sits inset within
    // its own circle instead of touching the edge.
    + '.row-home-icon {'
    + '  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; padding: 7px; box-sizing: border-box;'
    // #C7EFD0 — --ka-color-primary-soft (#83dc97) mixed 55% toward white,
    // precomputed rather than a runtime color-mix() (this file's own
    // established convention, see .btn-danger:hover's own comment) — a
    // paler pandan tint than the avatar's own primary-soft swatch, since
    // this icon is a static site mark, not an identity color the way the
    // avatar's background is.
    + '  background: #C7EFD0;'
    + '  display: flex; align-items: center; justify-content: center; overflow: hidden;'
    + '  transition: transform 0.12s ease;'
    + '}'
    + '.row-home-icon svg { width: 100%; height: 100%; }'
    // Inherits .panel input's own look (same field style as the signup/
    // login form) — no overrides beyond spacing.
    + '.field-input { margin-top: 4px; }'
    // Feedback for an edit that can't just re-render as "saved" the instant
    // it's submitted — email change needs a confirm-by-email round trip,
    // so this is what tells the user that's what's happening instead of
    // the field silently doing nothing.
    + '.field-status { margin-top: 6px; font-size: var(--ka-fs-label); color: var(--ka-color-text-on-surface-muted); }'
    + '.field-status-error { color: var(--ka-color-danger); font-weight: var(--ka-fw-medium); }'
    + '.field-help { margin-top: 4px; font-size: var(--ka-fs-label); color: var(--ka-color-text-on-surface-muted); }'
    + '.field-help-danger { color: var(--ka-color-danger); }'
    // Same shape/weight/size as .btn — only the color changes, so a
    // destructive action still reads as "a button in this same family,"
    // not a visually unrelated warning box.
    + '.btn-danger { background: var(--ka-color-danger); color: #fff; }'
    // #A73127 — --ka-color-danger (#C43A2E) mixed 15% toward black,
    // precomputed rather than a runtime CSS color-mix() — every other
    // derived color in this file (mixWithWhite/mixWithBlack, above) is
    // computed the same "in JS/ahead of time" way, not with color-mix().
    + '.btn-danger:hover { background: #A73127; }'
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
    + '  color: var(--ka-color-text-on-surface-muted); font-family: var(--ka-font-sans); font-weight: var(--ka-fw-medium); font-size: var(--ka-fs-body);'
    + '  display: inline-flex; align-items: center; gap: 4px;'
    + '}'
    + '.avatar-editor-back:hover { color: var(--ka-color-text-on-surface); }'
    + '.avatar-editor-back svg { width: var(--ka-icon-size); height: var(--ka-icon-size); }'
    + '.avatar-preview {'
    + '  width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 14px;'
    + '  display: flex; align-items: center; justify-content: center;'
    + '  box-shadow: 0 4px 14px rgba(0,65,19,0.24);'
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
    // border defaults to --ka-color-surface-border, not transparent — one
    // of AVATAR_COLORS (#FBF6EC, a near-cream white) was reading as
    // invisible against this panel's own cream background with no border
    // to mark its own edge. .active still overrides to a darker, more
    // deliberate border to read as "selected," not just "has a rim."
    + '.avatar-swatch {'
    + '  width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--ka-color-surface-border); padding: 0; cursor: pointer;'
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

  // Matches Lucide's chevron-left artwork — the avatar editor's "Back"
  // button (renderAvatarEditor()) and the Manage Account view's own back
  // button; this replaced a literal "←" Unicode character that had
  // slipped in before this became a house rule (see the icon-loading
  // comment above), then an arrow-left (house convention is chevrons for
  // "back" specifically — a plain directional indicator inside a still-
  // in-place control, not an arrow-with-tail, which reads more like
  // "move/send this way").
  var FALLBACK_BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="m15 18-6-6 6-6"/></svg>';

  // Matches Lucide's chevron-right artwork — FALLBACK_BACK_SVG's mirror,
  // for the Manage Account row's forward-drill affordance.
  var FALLBACK_FORWARD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="m9 18 6-6-6-6"/></svg>';

  var GOOGLE_SVG = '<svg width="16" height="16" viewBox="0 0 18 18">'
    + '<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"/>'
    + '<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.36 0-4.35-1.6-5.06-3.74H.98v2.33A9 9 0 0 0 9 18z"/>'
    + '<path fill="#FBBC05" d="M3.94 10.68A5.4 5.4 0 0 1 3.66 9c0-.58.1-1.15.28-1.68V4.99H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.01l2.96-2.33z"/>'
    + '<path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.99l2.96 2.33C4.65 5.18 6.64 3.58 9 3.58z"/>'
    + '</svg>';

  // Copied by value from root's own favicon.svg — the "Kueh Machine Home"
  // row's icon (renderAccountPanel()/renderAuthPanel()) is meant to read as
  // the same mark as the browser tab, not a fresh symbol invented for this
  // one row. Self-contained/inlined rather than <img src="/favicon.svg">
  // so it doesn't cost a network request and can't break if that file ever
  // moves. Keep in sync by hand if favicon.svg's own markup changes.
  var HOME_ICON_SVG = '<svg viewBox="0 0 32 32">'
    + '<defs><clipPath id="ka-home-icon-clip"><rect x="2" y="4" width="28" height="24" rx="5"/></clipPath></defs>'
    + '<g clip-path="url(#ka-home-icon-clip)">'
    + '<rect x="0" y="4" width="32" height="5" fill="#F4978E"/>'
    + '<rect x="0" y="9" width="32" height="1" fill="#FFF8F0"/>'
    + '<rect x="0" y="10" width="32" height="5" fill="#F9C74F"/>'
    + '<rect x="0" y="15" width="32" height="1" fill="#FFF8F0"/>'
    + '<rect x="0" y="16" width="32" height="5" fill="#95D5B2"/>'
    + '<rect x="0" y="21" width="32" height="1" fill="#FFF8F0"/>'
    + '<rect x="0" y="22" width="32" height="6" fill="#2D6A4F"/>'
    + '</g>'
    + '</svg>';

  // A simple generic "portal" glyph (deep-purple field, glowing circle) --
  // there's no dedicated Kueh-verse brand mark yet to copy the way
  // HOME_ICON_SVG copies the site favicon, so this is deliberately plain
  // rather than a half-guessed imitation of one.
  var HUB_ICON_SVG = '<svg viewBox="0 0 32 32">'
    + '<defs><clipPath id="ka-hub-icon-clip"><rect x="2" y="4" width="28" height="24" rx="5"/></clipPath></defs>'
    + '<g clip-path="url(#ka-hub-icon-clip)">'
    + '<rect x="0" y="4" width="32" height="24" fill="#3B2A54"/>'
    + '<circle cx="16" cy="16" r="9" fill="#7C5CFF"/>'
    + '<circle cx="16" cy="16" r="4" fill="#FBF6EC"/>'
    + '</g>'
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
  // Hue order: red/brown through yellow and green to pink, followed by the
  // light neutral. The character editor reuses the matching clothing hues.
  var AVATAR_COLORS = ['#D97B66', '#5B3A29', '#C4933F', '#F0B429', '#8FBF7F', '#B8D8B8', '#F2B8C6', '#FBF6EC'];

  // Desktop inset for a true floating (mode:'fixed') badge's horizontal
  // edge — matches root's own docked-header inset exactly (data-inset="32"
  // on its own script tag), per direct feedback that the previous flat
  // 10px read as too tight next to that more generous header spacing.
  // Same 480px mobile cap docked mode already uses for the same reason
  // (applyDockedInset, below) — a corner badge doesn't have a wide
  // desktop header's room to spare on a narrow phone screen.
  var FIXED_BADGE_DESKTOP_INSET = 32;
  var FIXED_BADGE_MOBILE_INSET = 10;

  function anchorStyle(anchor, horizontalInset) {
    var h = horizontalInset + 'px';
    switch (anchor) {
      case 'top-left': return { top: '15px', left: h };
      case 'bottom-right': return { bottom: '15px', right: h };
      case 'bottom-left': return { bottom: '15px', left: h };
      default: return { top: '15px', right: h };
    }
  }

  function applyPos(el, opts) {
    // Only mode:'fixed' scales with the real viewport — mode:'absolute'
    // (e.g. Ruth's badge, mirrored to her own #audioBtn inside a fixed-
    // width #wrapper that isn't the real viewport) keeps the original flat
    // inset regardless of window.innerWidth, which has nothing to do with
    // its actual on-screen container.
    var horizontalInset = opts.mode === 'fixed'
      ? (window.innerWidth < 480 ? FIXED_BADGE_MOBILE_INSET : FIXED_BADGE_DESKTOP_INSET)
      : FIXED_BADGE_MOBILE_INSET;
    var pos = anchorStyle(opts.anchor, horizontalInset);
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
    if (!panelEl || !panelBodyEl) return;
    panelBodyEl.innerHTML = '';
    // Only visible at mobile widths (.panel-close, CSS) — the popover on
    // desktop already closes via the outside-click handler, but a modal
    // over the whole screen needs an explicit, discoverable way out.
    var closeBtn = el('button', 'panel-close', ICON_CLOSE_SVG || FALLBACK_CLOSE_SVG);
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', function () { togglePanel(false); });
    panelBodyEl.appendChild(closeBtn);
    if (currentSession) {
      if (accountView === 'avatar') renderAvatarEditor();
      else if (accountView === 'manage') renderManageAccount();
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
    row.appendChild(el('div', 'account-email', escapeHtml(user.email || '')));
    panelBodyEl.appendChild(row);

    // profiles.display_name is the one updateProfile()/every game's name-
    // edit UI actually writes to (see AUTH.md's "One identity, everywhere")
    // — reading user_metadata.display_name here instead would show the
    // name frozen at signup, ignoring every rename since.
    var currentName = (currentProfile && currentProfile.display_name)
      || (user.user_metadata && user.user_metadata.display_name)
      || (user.email ? user.email.split('@')[0] : 'Signed in');

    var rowList = el('div', 'row-list');
    panelBodyEl.appendChild(rowList);

    var nameField = el('div', 'field acct-row');
    rowList.appendChild(nameField);
    renderFieldRow(nameField, {
      label: 'Display name',
      value: currentName,
      maxLength: 40,
      onSave: function (val) { updateProfile({ display_name: val }); },
    });

    accountActions.forEach(function (action) {
      var actionRow = el('div', 'row-link acct-row', '<span>' + escapeHtml(action.label) + '</span>' + (ICON_FORWARD_SVG || FALLBACK_FORWARD_SVG));
      makeButtonLike(actionRow, function () {
        togglePanel(false);
        action.onActivate();
      });
      rowList.appendChild(actionRow);
    });

    // Security-sensitive stuff (email, password, delete) doesn't belong on
    // this first-level popover — same convention most account menus use
    // (Google's own: quick actions up front, a "Manage account" row out
    // to the sensitive stuff). accountView='manage' is the same pattern
    // 'avatar' already is, not a new mechanism. Its own row-list row (no
    // label, chevron pointing at the destination) rather than the old
    // .switch-mode text link — it's navigation to a whole sub-view, not a
    // toggle or a one-line action, so it earns the same row treatment as
    // the fields above it, divider included.
    var manageRow = el('div', 'row-link acct-row', '<span>Manage account</span>' + (ICON_FORWARD_SVG || FALLBACK_FORWARD_SVG));
    makeButtonLike(manageRow, function () { accountView = 'manage'; renderPanel(); });
    rowList.appendChild(manageRow);

    var homeRow = el('a', 'row-home acct-row', '<span class="row-home-icon">' + HOME_ICON_SVG + '</span><span>Kueh Machine Home</span>');
    homeRow.href = '/';
    rowList.appendChild(homeRow);

    var hubRow = el('a', 'row-home acct-row', '<span class="row-home-icon">' + HUB_ICON_SVG + '</span><span>Kueh-Verse</span>');
    hubRow.href = '/hub/';
    rowList.appendChild(hubRow);

    var signOutBtn = el('button', 'btn btn-ghost', 'Sign out');
    signOutBtn.style.marginTop = '18px';
    signOutBtn.addEventListener('click', function () {
      signOut().catch(function (e) { console.error('[KuehAccount] sign out failed:', e); });
    });
    panelBodyEl.appendChild(signOutBtn);
    applyRetroShapeClip(signOutBtn, null, { stroke: 'var(--ka-color-surface-border)' });
  }

  // ── Reusable field row: LABEL / value + Edit ──────────────────────────
  // Display mode: a small-caps label (.panel label) over a value + "Edit"
  // text button row. Not built display-name-specific — `opts` is generic
  // enough that an email field could reuse this same pair of functions
  // later (see AUTH.md's account-management note) rather than growing its
  // own bespoke markup.
  function renderFieldRow(container, opts) {
    container.innerHTML = '';
    container.appendChild(el('label', '', escapeHtml(opts.label)));
    var row = el('div', 'field-row');
    row.appendChild(el('div', 'field-value', escapeHtml(opts.value)));
    var editBtn = el('button', 'field-edit-btn', 'Edit');
    editBtn.setAttribute('aria-label', 'Edit ' + opts.label.toLowerCase());
    editBtn.addEventListener('click', function () { renderFieldEditRow(container, opts); });
    row.appendChild(editBtn);
    container.appendChild(row);
  }

  // Edit mode: applies on Enter/blur, same "no separate Save step"
  // convention as the avatar editor's tiles/swatches — opts.onSave is what
  // actually persists the change. Two shapes of onSave, both supported:
  // - Fire-and-forget, returns nothing (display name's updateProfile() —
  //   its own side effect re-renders the whole panel synchronously, so
  //   there's nothing left for this function to do afterward).
  // - Returns a promise (email's updateEmail() — a real network round trip
  //   that can fail, and that doesn't take effect immediately even on
  //   success, since Supabase requires confirming it by email first).
  //   Resolving with a truthy string shows it as a status message and
  //   *stays* in edit mode (email: "confirmation sent", not yet true —
  //   switching to display mode would show an address that isn't active
  //   yet); resolving with nothing switches to display mode showing the
  //   new value, the same outcome the fire-and-forget path gets for free.
  function renderFieldEditRow(container, opts) {
    container.innerHTML = '';
    container.appendChild(el('label', '', escapeHtml(opts.label)));
    var input = el('input', 'field-input');
    input.type = opts.inputType || 'text';
    // Only the one case needs this so far (email) — a real autocomplete
    // hint instead of leaving the browser to guess from the field's own
    // label text, same reasoning renderPasswordEditRow's own
    // autocomplete="new-password" already applies.
    if (opts.inputType === 'email') input.autocomplete = 'email';
    if (opts.maxLength) input.maxLength = opts.maxLength;
    input.value = opts.value;
    container.appendChild(input);
    var statusEl = el('div', 'field-status', '');
    container.appendChild(statusEl);
    input.focus();
    input.select();
    var committed = false;
    var lastSubmitted = null; // guards a duplicate send if blur fires again after a status message (e.g. the user reads it, then clicks away)
    function commit() {
      if (committed) return;
      var val = input.value.trim();
      if (!val || val === opts.value || val === lastSubmitted) { committed = true; renderFieldRow(container, opts); return; }
      // Fail fast on an obviously malformed email rather than round-
      // tripping to the server to find out — input.type="email" alone only
      // styles the field, it doesn't stop a blur/Enter handler from firing
      // with invalid content, so checkValidity() has to be called
      // explicitly. Left in edit mode (not committed) so the user can
      // just keep typing rather than losing their place.
      if (opts.inputType === 'email' && !input.checkValidity()) {
        statusEl.className = 'field-status field-status-error';
        statusEl.textContent = 'Enter a valid email address.';
        // blur already moved focus away by the time this runs (this is
        // itself the blur handler) — pull it back so the user can correct
        // the address immediately instead of having to click back in.
        input.focus();
        return;
      }
      committed = true;
      input.disabled = true;
      var result = opts.onSave(val);
      if (result && result.then) {
        result.then(function (message) {
          if (message) {
            lastSubmitted = val;
            statusEl.textContent = message;
            input.disabled = false;
            committed = false;
          } else {
            renderFieldRow(container, Object.assign({}, opts, { value: val }));
          }
        }).catch(function (e) {
          committed = false;
          input.disabled = false;
          statusEl.className = 'field-status field-status-error';
          statusEl.textContent = e.message || 'Something went wrong.';
        });
      }
    }
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); committed = true; renderFieldRow(container, opts); }
    });
    input.addEventListener('blur', commit);
  }

  // ── Manage account: email, password, delete ───────────────────────────
  // Second-level view (accountView='manage', same mechanism as 'avatar')
  // for the account actions that don't belong on the first-level popover —
  // security-sensitive or destructive, not something to reach on every
  // open the way Sign Out is. Same convention most account menus use
  // (Google's own: quick stuff up front, "Manage account" out to the rest).
  function renderManageAccount() {
    var backBtn = el('button', 'avatar-editor-back', (ICON_BACK_SVG || FALLBACK_BACK_SVG) + 'Back');
    backBtn.addEventListener('click', function () { accountView = 'main'; renderPanel(); });
    panelBodyEl.appendChild(backBtn);

    panelBodyEl.appendChild(el('h3', '', 'Manage account'));

    var user = currentSession.user;

    var rowList = el('div', 'row-list');
    panelBodyEl.appendChild(rowList);

    var emailField = el('div', 'field acct-row');
    rowList.appendChild(emailField);
    renderFieldRow(emailField, {
      label: 'Email',
      value: user.email || '',
      inputType: 'email',
      onSave: function (val) {
        // Always resolves with a message, never switches to display mode
        // on its own — the address shown here shouldn't change to the new
        // one until it's actually confirmed (this project's "Secure email
        // change" setting requires confirming from both the old and new
        // inbox), or the panel would be lying about which email is live.
        return updateEmail(val).then(function () {
          return 'Check both your old and new inbox to confirm the change.';
        });
      },
    });

    var passwordField = el('div', 'field acct-row');
    rowList.appendChild(passwordField);
    renderPasswordRow(passwordField);

    var dangerField = el('div', 'field acct-row');
    rowList.appendChild(dangerField);
    renderDeleteAccountRow(dangerField);
  }

  // Password has no real "current value" to show (never known/exposed
  // client-side) or to compare a new one against — deliberately its own
  // small pair of functions rather than forced through renderFieldRow's
  // "value" shape, which assumes both of those exist.
  function renderPasswordRow(container) {
    container.innerHTML = '';
    container.appendChild(el('label', '', 'Password'));
    var row = el('div', 'field-row');
    row.appendChild(el('div', 'field-value', '••••••••'));
    var editBtn = el('button', 'field-edit-btn', 'Edit');
    editBtn.setAttribute('aria-label', 'Change password');
    editBtn.addEventListener('click', function () { renderPasswordEditRow(container); });
    row.appendChild(editBtn);
    container.appendChild(row);
  }

  // Deliberately NOT renderFieldEditRow's own blur-to-commit pattern —
  // right for Display Name (low-stakes, instantly correctable, no
  // confirmation round trip needed), wrong for a password: there's no
  // "current value" to catch a typo against, and a stray blur (a misclick,
  // a tab key) would silently commit whatever partial text was sitting in
  // the field with no way back. Email gets its own safety net for free
  // (Supabase's confirm-by-email round trip); password needed one built by
  // hand — a second "confirm" field to catch typos, and an explicit
  // Save/Cancel pair instead of auto-commit, the same weight
  // renderDeleteAccountConfirm already gives its own irreversible action
  // (stacked full-width .btn/.btn-ghost, a <span>-wrapped label so the
  // Saving… swap doesn't wipe out applyRetroShapeClip's own appended
  // clip-def SVG the way a plain .textContent assignment would).
  function renderPasswordEditRow(container) {
    container.innerHTML = '';
    container.appendChild(el('label', '', 'New password'));
    var input = el('input', 'field-input');
    input.type = 'password';
    input.placeholder = 'New password';
    input.autocomplete = 'new-password';
    container.appendChild(input);

    var confirmInput = el('input', 'field-input');
    confirmInput.type = 'password';
    confirmInput.placeholder = 'Confirm new password';
    confirmInput.autocomplete = 'new-password';
    confirmInput.style.marginTop = '8px';
    container.appendChild(confirmInput);

    var statusEl = el('div', 'field-status', '');
    container.appendChild(statusEl);

    var saveBtn = el('button', 'btn', '<span>Save</span>');
    var saveLabelEl = saveBtn.querySelector('span');
    var cancelBtn = el('button', 'btn btn-ghost', 'Cancel');
    container.appendChild(saveBtn);
    container.appendChild(cancelBtn);
    applyRetroShapeClip(saveBtn);
    applyRetroShapeClip(cancelBtn, null, { stroke: 'var(--ka-color-surface-border)' });

    input.focus();
    var committed = false;

    // Only surfaces a mismatch once the confirm field has caught up in
    // length to the first one — comparing on every keystroke would flag a
    // "mismatch" on every character typed into confirmInput before it's
    // even as long as the password it's checking against, which reads as
    // the form nagging at you mid-type rather than actually helping.
    function validate() {
      if (confirmInput.value.length >= input.value.length && confirmInput.value !== input.value) {
        statusEl.className = 'field-status field-status-error';
        statusEl.textContent = "Passwords don't match.";
      } else {
        statusEl.className = 'field-status';
        statusEl.textContent = '';
      }
    }
    input.addEventListener('input', validate);
    confirmInput.addEventListener('input', validate);

    function cancel() {
      if (committed) return;
      committed = true;
      renderPasswordRow(container);
    }
    cancelBtn.addEventListener('click', cancel);

    function save() {
      if (committed) return;
      var val = input.value;
      if (!val) {
        statusEl.className = 'field-status field-status-error';
        statusEl.textContent = 'Enter a new password.';
        input.focus();
        return;
      }
      if (val !== confirmInput.value) {
        statusEl.className = 'field-status field-status-error';
        statusEl.textContent = "Passwords don't match.";
        confirmInput.focus();
        return;
      }
      committed = true;
      input.disabled = true;
      confirmInput.disabled = true;
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      saveLabelEl.textContent = 'Saving…';
      updatePassword(val).then(function () {
        renderPasswordRow(container);
      }).catch(function (e) {
        committed = false;
        input.disabled = false;
        confirmInput.disabled = false;
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        saveLabelEl.textContent = 'Save';
        statusEl.className = 'field-status field-status-error';
        statusEl.textContent = e.message || 'Something went wrong.';
      });
    }
    saveBtn.addEventListener('click', save);

    [input, confirmInput].forEach(function (inp) {
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); save(); }
        else if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
      });
    });
  }

  // Two-stage confirm — a plain "Delete account" click can't fire the
  // actual deletion, it only reveals a second, explicit "Yes, delete my
  // account" button alongside a real warning. Irreversible (see
  // deleteAccount()'s own comment on what cascades/what survives), so this
  // deliberately isn't a one-click action the way everything else in this
  // panel is.
  function renderDeleteAccountRow(container) {
    container.innerHTML = '';
    container.appendChild(el('label', '', 'Delete account'));
    container.appendChild(el('div', 'field-help', "Permanently deletes your account. This can't be undone."));
    var btn = el('button', 'btn btn-danger', 'Delete account');
    btn.addEventListener('click', function () { renderDeleteAccountConfirm(container); });
    container.appendChild(btn);
    applyRetroShapeClip(btn);
  }

  function renderDeleteAccountConfirm(container) {
    container.innerHTML = '';
    container.appendChild(el('label', '', 'Delete account'));
    container.appendChild(el('div', 'field-help field-help-danger',
      "This permanently deletes your account, avatar, and saved progress. Your past leaderboard scores stay up, no longer tied to you. This can't be undone."));
    var statusEl = el('div', 'field-status', '');

    var confirmBtn = el('button', 'btn btn-danger', '<span>Yes, delete my account</span>');
    var confirmLabelEl = confirmBtn.querySelector('span');
    var cancelBtn = el('button', 'btn btn-ghost', 'Cancel');
    cancelBtn.addEventListener('click', function () { renderDeleteAccountRow(container); });
    confirmBtn.addEventListener('click', function () {
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      confirmLabelEl.textContent = 'Deleting…';
      deleteAccount().catch(function (e) {
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        confirmLabelEl.textContent = 'Yes, delete my account';
        statusEl.className = 'field-status field-status-error';
        statusEl.textContent = e.message || 'Something went wrong.';
      });
    });

    container.appendChild(confirmBtn);
    container.appendChild(cancelBtn);
    container.appendChild(statusEl);
    applyRetroShapeClip(confirmBtn);
    applyRetroShapeClip(cancelBtn, null, { stroke: 'var(--ka-color-surface-border)' });
  }

  // Same panel, same level as Sign out — not a separate modal-on-a-modal —
  // reached by clicking the avatar itself in renderAccountPanel(). Every
  // tile/swatch click applies immediately (updateProfile()) and re-renders
  // this same view so the preview/active states stay in sync; "Back"
  // returns to the normal account view, there's no separate save step.
  function renderAvatarEditor() {
    var backBtn = el('button', 'avatar-editor-back', (ICON_BACK_SVG || FALLBACK_BACK_SVG) + 'Back');
    backBtn.addEventListener('click', function () { accountView = 'main'; renderPanel(); });
    panelBodyEl.appendChild(backBtn);

    panelBodyEl.appendChild(el('h3', '', 'Choose your avatar'));

    var activeIll = findIllustration(currentProfile && currentProfile.avatar_illustration) || AVATAR_ILLUSTRATIONS[0];
    // Preserve the editor's established pink default even though the swatches
    // themselves now follow hue order.
    var activeColor = (currentProfile && currentProfile.avatar_color) || '#F2B8C6';

    var preview = el('div', 'avatar-preview', '<img class="avatar-img" src="' + activeIll.src + '" alt="" />');
    preview.style.background = activeColor;
    panelBodyEl.appendChild(preview);

    var grid = el('div', 'avatar-grid');
    AVATAR_ILLUSTRATIONS.forEach(function (ill) {
      var tile = el('button', 'avatar-tile' + (ill.id === activeIll.id ? ' active' : ''),
        '<img src="' + ill.src + '" alt="' + escapeHtml(ill.label) + '" />');
      tile.setAttribute('aria-label', ill.label);
      tile.setAttribute('aria-pressed', ill.id === activeIll.id ? 'true' : 'false');
      tile.addEventListener('click', function () { updateProfile({ avatar_illustration: ill.id }); });
      grid.appendChild(tile);
    });
    panelBodyEl.appendChild(grid);

    panelBodyEl.appendChild(el('label', '', 'Background'));
    var swatchRow = el('div', 'avatar-swatch-row');
    AVATAR_COLORS.forEach(function (color) {
      var swatch = el('button', 'avatar-swatch' + (color === activeColor ? ' active' : ''));
      swatch.style.background = color;
      swatch.setAttribute('aria-label', color);
      swatch.setAttribute('aria-pressed', color === activeColor ? 'true' : 'false');
      swatch.addEventListener('click', function () { updateProfile({ avatar_color: color }); });
      swatchRow.appendChild(swatch);
    });
    panelBodyEl.appendChild(swatchRow);
  }

  function renderAuthPanel() {
    panelBodyEl.appendChild(el('h3', '', authMode === 'signup' ? 'Create an account' : 'Sign in'));

    var googleBtn = el('button', 'btn btn-google', GOOGLE_SVG + '<span>Continue with Google</span>');
    googleBtn.addEventListener('click', function () {
      signInWithGoogle().catch(function (e) { showError(e.message || 'Google sign-in failed.'); });
    });
    panelBodyEl.appendChild(googleBtn);
    applyRetroShapeClip(googleBtn, null, { stroke: 'var(--ka-color-surface-border)' });

    var divider = el('div', '', '');
    // font-weight: medium (600), not the inherited 400 default — at 11px
    // and opacity:0.5 (a deliberately de-emphasized divider), regular
    // weight read as too thin to stay legible, not just quiet.
    divider.style.cssText = 'text-align:center;margin:12px 0;opacity:0.5;font-size:var(--ka-fs-label);font-weight:var(--ka-fw-medium);';
    divider.textContent = 'or';
    panelBodyEl.appendChild(divider);

    if (authMode === 'signup') {
      panelBodyEl.appendChild(el('label', '', 'Display name'));
      var nameInput = el('input', '');
      nameInput.type = 'text';
      panelBodyEl.appendChild(nameInput);
    }

    panelBodyEl.appendChild(el('label', '', 'Email'));
    var emailInput = el('input', '');
    emailInput.type = 'email';
    panelBodyEl.appendChild(emailInput);

    panelBodyEl.appendChild(el('label', '', 'Password'));
    var pwInput = el('input', '');
    pwInput.type = 'password';
    panelBodyEl.appendChild(pwInput);

    var errEl = el('div', 'error', '');
    panelBodyEl.appendChild(errEl);

    var submitLabel = authMode === 'signup' ? 'Sign up' : 'Log in';
    // Label text lives in its own <span> — applyRetroShapeClip's appended
    // clip-def <svg> is a sibling of it, so swapping the label during the
    // loading state (below) can safely target just the span's textContent
    // without wiping that sibling out from under the button's own
    // clip-path: url(#id) reference the way a plain submitBtn.textContent
    // assignment would.
    var submitBtn = el('button', 'btn', '<span>' + escapeHtml(submitLabel) + '</span>');
    var submitLabelEl = submitBtn.querySelector('span');
    submitBtn.addEventListener('click', function () {
      var email = emailInput.value.trim();
      var password = pwInput.value;
      if (!email || !password) { errEl.textContent = 'Enter your email and password.'; return; }
      submitBtn.disabled = true;
      submitLabelEl.textContent = authMode === 'signup' ? 'Signing up…' : 'Logging in…';
      var task = authMode === 'signup'
        ? signUp({ email: email, password: password, displayName: panelBodyEl.querySelector('input[type=text]') ? panelBodyEl.querySelector('input[type=text]').value.trim() : '' })
        : signInWithPassword({ email: email, password: password });
      task
        .then(function () { errEl.textContent = ''; })
        .catch(function (e) { errEl.textContent = e.message || 'Something went wrong.'; })
        .finally(function () { submitBtn.disabled = false; submitLabelEl.textContent = submitLabel; });
    });
    panelBodyEl.appendChild(submitBtn);
    applyRetroShapeClip(submitBtn);

    var switchEl = el('div', 'switch-mode', authMode === 'signup' ? 'Already have an account? Log in' : "Don't have an account? Sign up");
    makeButtonLike(switchEl, function () {
      authMode = authMode === 'signup' ? 'login' : 'signup';
      renderPanel();
    });
    panelBodyEl.appendChild(switchEl);

    // Same row, same icon, as the signed-in panel's own "Kueh Machine Home"
    // (renderAccountPanel()) — a plain top border + margin here since this
    // view doesn't have a .row-list of its own to hang a divider off of.
    var homeRow = el('a', 'row-home', '<span class="row-home-icon">' + HOME_ICON_SVG + '</span><span>Kueh Machine Home</span>');
    homeRow.href = '/';
    homeRow.style.cssText = 'margin-top:16px; padding-top:16px; border-top:var(--ka-stroke-width) solid var(--ka-color-surface-border);';
    panelBodyEl.appendChild(homeRow);

    var hubRow = el('a', 'row-home', '<span class="row-home-icon">' + HUB_ICON_SVG + '</span><span>Kueh-Verse</span>');
    hubRow.href = '/hub/';
    panelBodyEl.appendChild(hubRow);

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
    } else if (accountView !== 'main') {
      // Reset on close, not on open — closing from Manage Account or the
      // avatar editor shouldn't leave the next open landing back on that
      // same sub-view; every fresh open starts at the top level. Re-renders
      // immediately (not lazily on next open) so there's no stale sub-view
      // content sitting in the DOM to flash before the reset catches up.
      accountView = 'main';
      renderPanel();
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
      var insetSide = currentOpts.anchor.indexOf('left') !== -1 ? 'left' : 'right';
      var configuredInset = currentOpts.inset != null ? currentOpts.inset : 20;
      // A host page's own data-inset is tuned for its desktop header bar —
      // root's own is 32px, sized against nav links with room to spare at
      // that width. The same 32px on a narrow phone screen leaves the
      // links nowhere to go, so the badge visibly overlaps the last one
      // (confirmed directly: "BRIEF" sitting under the badge at 390px).
      // Capping the effective inset well below that on narrow viewports
      // gives the links their room back without needing a per-page mobile
      // override — every docked host benefits, not just root.
      function applyDockedInset() {
        var inset = window.innerWidth < 480 ? Math.min(configuredInset, 10) : configuredInset;
        host.style[insetSide] = inset + 'px';
      }
      applyDockedInset();
      window.addEventListener('resize', applyDockedInset);
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
    if (currentOpts.badgeShadow) badgeBtn.style.boxShadow = currentOpts.badgeShadow;
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
    // Created before applyRetroShapeClip below, and before anything can
    // possibly trigger a renderPanel() call — see panelBodyEl's own comment
    // for why this has to exist, and exist first.
    panelBodyEl = el('div', 'panel-body');
    panelEl.appendChild(panelBodyEl);
    // gutter: 20 — matches .panel's own CSS padding exactly. minN: 15 —
    // flatter (more subtle) than root's own STEP_CARD_SHAPE_OPTS (n:8, src/
    // organisms/chrome-accents.js) and its plain "window" default (n:10);
    // 8, 11, and 13 all still read as too round on this panel once actually
    // visible, landed here by direct visual confirmation rather than a
    // formula. Still only a floor, not a fixed value: solveClearingExponent
    // pushes n higher, automatically, on whichever view's real content
    // would otherwise clip against it, recalculated on every resize as the
    // panel swaps between its own auth form/account view/manage view/
    // avatar editor, each a different height. See solveClearingExponent's
    // own comment above for the full story on why this isn't just a
    // hardcoded number.
    applyRetroShapeClip(panelEl, null, { gutter: 20, minN: 15, stroke: 'var(--ka-color-surface-border)' });

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
    // origin + pathname + search — deliberately NOT window.location.href,
    // which can carry a #hash. Confirmed directly as the actual cause of
    // "Google login resets the page and does nothing": supabase-js's own
    // post-login cleanup (clearing window.location.hash after a successful
    // implicit-grant sign-in) leaves the URL ending in a bare trailing "#"
    // — a well-known quirk of location.hash = '' not removing the "#"
    // character itself, not a bug in that library. If redirectTo carries
    // that leftover "#" into the *next* OAuth attempt from the same tab,
    // Supabase's server appends its own "#access_token=..." on top of it,
    // landing back as "…/##access_token=…" — a double-hash the SDK's own
    // parser can't recognize as a login callback (the stray leading "#"
    // gets folded into the first param's key, so e.access_token comes back
    // undefined and the whole detection branch is silently skipped: no
    // session, no error, no console warning, and the broken hash is never
    // cleared either — so it just compounds further on every next attempt,
    // exactly matching the growing stack of "#access_token=…" blocks seen
    // live. Stripping any existing hash/search before it's ever handed to
    // Supabase means a stale fragment from a page anchor link or an
    // earlier sign-in can never poison a later one.
    var cleanUrl = window.location.origin + window.location.pathname;
    return ready.then(function (c) {
      return c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: cleanUrl } });
    }).then(unwrap);
  }

  function signOut() {
    return ready.then(function (c) { return c.auth.signOut(); }).then(unwrap);
  }

  // Supabase sends a confirmation email to the new address (and, with this
  // project's "Secure email change" setting on, the old one too) rather
  // than switching immediately — the caller is responsible for telling the
  // user to go check their inbox; this just kicks the flow off.
  function updateEmail(newEmail) {
    return ready.then(function (c) { return c.auth.updateUser({ email: newEmail }); }).then(unwrap);
  }

  function updatePassword(newPassword) {
    return ready.then(function (c) { return c.auth.updateUser({ password: newPassword }); }).then(unwrap);
  }

  // Permanently deletes the signed-in user's own account. Can't be done
  // with just the anon/publishable key this file otherwise uses —
  // auth.admin.deleteUser() needs the service-role key, which never
  // belongs in client code — so this calls a server-side Edge Function
  // (supabase/functions/delete-account) instead. That function verifies
  // the caller's own JWT before deleting anything; nothing here trusts a
  // client-supplied id. profiles/ruth_profiles rows cascade-delete
  // automatically (their own FK to auth.users, see 0001_init.sql);
  // ruth_scores/liwei_scores rows survive with user_id set to null,
  // keeping leaderboard history intact but anonymized rather than erasing
  // it. Signs the (now-deleted) session out locally on success, same as a
  // normal signOut() — the server-side session is already invalid at that
  // point, this just clears local state to match.
  function deleteAccount() {
    return ready.then(function (c) {
      return c.functions.invoke('delete-account');
    }).then(function (res) {
      if (res && res.error) throw res.error;
      return signOut();
    });
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
    registerAccountAction: function (id, label, onActivate) {
      accountActions = accountActions.filter(function (action) { return action.id !== id; });
      accountActions.push({ id: id, label: label, onActivate: onActivate });
      if (currentSession && panelEl && panelEl.classList.contains('open')) renderPanel();
      return function () {
        accountActions = accountActions.filter(function (action) { return action.id !== id; });
      };
    },
    signUp: signUp,
    signInWithPassword: signInWithPassword,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    updateEmail: updateEmail,
    updatePassword: updatePassword,
    deleteAccount: deleteAccount,
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
