# Shared accounts

One login works across the whole site: kuehmachine.com's landing page and
every machine under `/​<slug>/`. Sign in once anywhere and you're signed in
everywhere else too (all machines share one origin, so the session just
follows you). It's backed by one shared Supabase project — email/password
and "Continue with Google" both work out of the box.

## Quick start

Add one script tag to your page, anywhere before your own game code runs:

```html
<script src="/shared/account-widget.js"></script>
```

That's it. No build step, no `type="module"` needed — it works whether your
own page uses classic scripts or ES modules. It drops a small circular
account badge onto your page (top-right corner by default) with zero other
markup required.

## What you get for free

- The icon is Lucide's `circle-user-round` when signed out. Signed in, it's
  the account's avatar — a real illustration pulled from a contributor's own
  project (see "Avatars", below), not initials or a generated blob. Click it
  to open a small panel: email/password sign up and log in, "Continue with
  Google", and (when signed in) the avatar, name/email, and sign out.
- Position and color both adapt to your page instead of pasting Kueh
  Machine's default pink on top of your own art direction. Both are
  optional — omit everything and you get the original floating pink badge,
  top-right.

### Position — `data-mode`

- `fixed` (default): floating, viewport corner. `data-anchor` picks the
  corner (`top-right` default, or `top-left`/`bottom-right`/`bottom-left`).
- `absolute`: floating, but positioned within `data-mount-into` instead of
  the raw viewport — for mirroring an existing fixed button of your own
  rather than the literal screen corner (see Ruth's game: her badge mirrors
  her existing `#audioBtn` by mounting into `#wrapper` at `top-left` while
  `#audioBtn` sits at `top-right`).
- `docked`: **if your page already has a header/nav bar, use this instead of
  floating.** No filled-circle chrome, just the icon, anchored to that bar's
  own left/right edge and *vertically centered* within it — not flowed in as
  another item in whatever row your nav links are already centered/aligned
  in, so their own layout doesn't have to reflow around it. That's what
  `index.html` does: docked into `.site-nav` itself (the whole bar, not the
  inner centered-links row), anchored right, independent of `.site-nav-inner`'s
  own centering.

```html
<!-- default: floating, viewport corner, top-right -->
<script src="/shared/account-widget.js"></script>

<!-- floating, but mirroring your own fixed element instead of the viewport -->
<script src="/shared/account-widget.js"
        data-mount-into="#wrapper" data-mode="absolute" data-anchor="top-left"></script>

<!-- docked into an existing header/nav bar, right edge, vertically centered -->
<script src="/shared/account-widget.js"
        data-mode="docked" data-mount-into=".your-header-bar"></script>
```

`data-size` overrides the badge diameter in px (default 52 floating/
absolute, 40 docked) — never goes below 40 regardless, see
`shared/account-widget.js`'s `MIN_BADGE_SIZE`. `data-inset` (docked only)
overrides the px gap from your header's edge (default 20).

### Color — `data-accent-color`, `data-icon-color[-muted]`, `data-badge-background`/`-border`

`data-accent-color` re-themes the panel's buttons/focus rings (and, in
`fixed`/`absolute` mode, the badge's own fill) to match your game instead of
Kueh Machine's default pink — give it one hex color and a readable
button-text/icon color is derived automatically.

`data-icon-color` is for `docked` mode, where the icon has no fill to
contrast against — use it when your accent color alone wouldn't read
clearly sitting directly on your header bar's own background. Add
`data-icon-color-muted` too if your header's own text-buttons sit at a
dimmer shade until hovered (root's nav links do) and you want the icon to
match that exactly, not just a single static color.

`data-badge-background`/`data-badge-border` are for `fixed`/`absolute` mode
when a flat accent color isn't a close enough match to an *existing* button
on your page — raw CSS values (e.g. a gradient) that override the badge's
fill/border outright. See Ruth's game: her badge matches `#audioBtn`'s exact
gradient and border so the two read as the same button family.

```html
<script src="/shared/account-widget.js" data-accent-color="#C4933F"></script>

<!-- docked, matching a header's own default→hover text-button treatment -->
<script src="/shared/account-widget.js"
        data-mode="docked" data-mount-into=".site-nav" data-inset="32"
        data-accent-color="#B72E68"
        data-icon-color="#FBE0EC" data-icon-color-muted="#EDB7CE"></script>

<!-- floating, matching an existing button's exact gradient -->
<script src="/shared/account-widget.js"
        data-mount-into="#wrapper" data-mode="absolute" data-anchor="top-right"
        data-accent-color="#B86A1A"
        data-badge-background="linear-gradient(145deg, rgba(120,65,12,0.82), rgba(80,38,6,0.82))"
        data-badge-border="2px solid rgba(230,185,80,0.60)"></script>
```

## Reading auth state from your game

Everything hangs off the global `window.KuehAccount`:

```js
await KuehAccount.ready;               // resolves once the client + session are known
const user = KuehAccount.getUser();    // null if signed out
KuehAccount.onAuthStateChange((event, session) => {
  // event: 'SIGNED_IN' | 'SIGNED_OUT' | ...
  // fires when someone signs in/out from the badge too, not just your own code
});

const client = KuehAccount.getClient(); // the shared supabase-js client — use for your own queries
```

You generally don't need to call `signUp`/`signInWithPassword`/`signOut`
yourself — the badge's panel already does that. `KuehAccount.openPanel()` /
`closePanel()` open and close it programmatically, for a "Sign in" link
inside your own UI instead of requiring a click directly on the badge (see
`machines/ruth/index.html`'s naming card, and its `onAuthStateChange`
handler for what "finish onboarding once someone signs in, from wherever
they triggered it" looks like).

Anonymous play still works everywhere — accounts are opt-in per game. Don't
gate anything on being signed in unless the point of your game is the
account.

## One identity, everywhere

Signing in isn't just "now your score follows you to another device" — the
account's `display_name` and avatar are the player's identity anywhere your
game shows a name or a little picture next to it, not a separate per-game
nickname that happens to coexist with an account. Concretely:

```js
const profile = KuehAccount.getProfile();      // { display_name, avatar_illustration, avatar_color } or null
const avatar = KuehAccount.getAvatarInfo();     // { src, color } resolved for rendering, or null
KuehAccount.updateProfile({ display_name });    // renames the account itself, not a local-only field
KuehAccount.onProfileChange(profile => { ... }); // fires on sign-in AND whenever the profile changes
                                                  // anywhere — this page, the badge, another tab
```

`onAuthStateChange` alone isn't enough for this — it only fires on sign-in/
sign-out, not when someone edits their name or avatar mid-session (from the
badge, or from a *different* game's own name-edit UI, since it's the same
account everywhere). Subscribe to `onProfileChange` too if your game shows
a name or avatar anywhere, and re-render from it.

**When signed in**, adopt `profile.display_name` as the shown name (falling
back to the email's local part if no display name is set yet) instead of a
generic guest nickname, and show `getAvatarInfo()`'s illustration/color
wherever your game would otherwise show a generic player icon. If your game
lets players rename themselves, that edit should call `updateProfile({
display_name })` while signed in — so renaming yourself in one game renames
you everywhere, the same way the avatar editor already works. **When signed
out**, everything works exactly as if none of this existed: a local guest
name/id, no avatar, nothing gated on being signed in.

Canvas-based UI (drawing a name/avatar every frame rather than DOM) needs
one extra step: `getAvatarInfo()`'s image has to be preloaded into a cached
`Image()` object (via `onProfileChange`/`ready`), since draws must stay
synchronous — see `machines/ruth/index.html`'s `syncAccountAvatar()` and
`drawProfilePage()`'s avatar block for the pattern (falls back to its
original placeholder art whenever there's no avatar to show, exactly like
the header badge's own signed-out fallback). `machines/liwei/main.js`'s
`syncIdentityFromAccount()` is the plainer DOM-based version of the same
idea, for anything that isn't drawing to a canvas.

This intentionally stops at *your own* identity — it doesn't retrofit every
row of an existing leaderboard/friends list with other players' avatars
(that needs joining your own score table against `profiles` per row, a
separate, bigger piece of work if you want it).

## Avatars

Not a generated/abstract avatar — a curated set of real illustrations
pulled from five contributors' own projects (`AVATAR_ILLUSTRATIONS` in
`shared/account-widget.js`): four of Amy's flat icons (three kueh + her
check-in window's bird), three frozen snapshots of Ken's procedural kueh
generator (kept to his "common" rarity tier, except kueh-talam), two from
Viki's project, four from Amanda's "Beary's Kueh Shop" (the tray picker's
kueh images), and two hand-ported from Liwei's snake game — her snake's
head and the "kopi" power-up, both normally drawn live via 2D canvas calls
every frame rather than existing as static files, so they're re-authored as
static SVGs that reproduce the same shapes/colors. Photo-sourced ones are
downsized/recompressed into `shared/avatars/` — their originals are full-
resolution exports, nowhere near appropriate for a 40px circle. Paired with
a background color from a small curated palette (`AVATAR_COLORS`) chosen to
already appear across those illustrations, so every pairing reads as
belonging together.

Every new signup gets a random illustration + color assigned automatically
(`random_avatar_illustration()`/`random_avatar_color()`, run from the same
trigger that creates the `profiles` row — see `0001_init.sql`) — not gated
at signup, since that would mean a multi-step signup wizard everywhere this
badge is used. Changing it afterward is the avatar itself: click it in the
signed-in panel to open the same panel's editor view (an illustration grid
+ a swatch row, live preview, a chevron "Back" — same level as Sign out,
not a separate modal). Every click applies immediately, no separate save
step, matching how Viki's and Amanda's own customizer UIs already work.

Want to contribute more illustration options? Keep them small (these are
40–52px circles) and simple enough to read at that size — add the file
under `shared/avatars/` (or reference your project's own asset directly if
it's already small), add an entry to `AVATAR_ILLUSTRATIONS`, and add the
same id to `0001_init.sql`'s `random_avatar_illustration()` array.

## Managing the account itself

Renaming and avatar-editing live on the panel's main view, but email,
password, and deleting the account don't — they're one level deeper,
behind a "Manage account" link under Sign Out (`accountView='manage'`,
same mechanism 'avatar' already is). That split is deliberate, not an
oversight: those are either security-sensitive or irreversible, not
something to surface on every single open the way Sign Out is — the same
convention most account menus use (Google's own account popover: quick
actions up front, a "Manage account" link out to the rest).

```js
KuehAccount.updateEmail(newEmail)     // sends a confirmation email to both the old and new address
                                       // (this project's "Secure email change" setting) — doesn't
                                       // switch instantly, the UI reflects that rather than lying about it
KuehAccount.updatePassword(newPassword)
KuehAccount.deleteAccount()           // permanent — see below
```

`deleteAccount()` is the one piece of this system that can't live in
`shared/account-widget.js` alone: `auth.admin.deleteUser()` needs the
service-role key, which must never reach client code, so it calls a
server-side Edge Function (`supabase/functions/delete-account`) instead.
**That function needs deploying once, the same "paste into the dashboard"
way as the SQL migrations** — Supabase dashboard → Edge Functions → New
Function → name it exactly `delete-account` → paste the file's contents in
→ Deploy. No CLI needed; the service-role key itself is never pasted
anywhere, the Edge Functions runtime injects it as an env var
automatically. Until that function is deployed, the "Yes, delete my
account" button will show an error instead of silently doing nothing —
it's called immediately, not stubbed out waiting for you to notice this.

Deleting cascades through the schema already in `0001_init.sql`:
`profiles`/`ruth_profiles` (both `on delete cascade` against `auth.users`)
disappear with the account; `ruth_scores`/`liwei_scores` rows survive with
`user_id` set to `null` (`on delete set null`) — past leaderboard entries
stay up, just no longer tied to the deleted account.

## Getting your own RLS-protected table

Every table lives in the one shared Supabase project. Name yours
`<your-slug>_<thing>`, e.g. `amy_scores`, `amy_progress`.

Copy-paste template (public leaderboard, write-your-own-row-only, same
pattern `ruth_scores`/`liwei_scores` already use):

```sql
create table public.yourslug_scores (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  score int not null check (score >= 0),
  created_at timestamptz not null default now()
);
alter table public.yourslug_scores enable row level security;
create policy "yourslug_scores_read_all" on public.yourslug_scores for select using (true);
create policy "yourslug_scores_insert_own_or_guest" on public.yourslug_scores
  for insert with check (user_id is null or user_id = auth.uid());
```

For a private per-player save (not a public leaderboard), use `ruth_profiles`
in `supabase/migrations/0001_init.sql` as the template instead — a single
JSON blob keyed by `user_id`, readable/writable only by its owner.

Contributors don't get Supabase dashboard access. To get your table added,
either PR a `.sql` file under `supabase/migrations/`, or ask Leonard to run
it for you.

## Positioning conventions

Have a header/nav bar already? Use `data-mode="docked"` and mount into it —
don't float a badge on top of it. No header bar? Default `fixed`/`top-right`
is fine. Already have your own fixed button in that corner? Don't stack
them — pick the opposite corner instead (same size, same offset), the way
`machines/ruth/index.html` does: her existing `#audioBtn` is `top-left`, the
account badge mirrors it at `top-right` (matching its exact gradient/border
too, via `data-badge-background`/`data-badge-border`, so they read as one
matched pair of buttons rather than two different visual languages sharing
a row).

## What not to do

- Don't hardcode a different Supabase project URL/key in your game — use
  `KuehAccount.getClient()`.
- Don't reimplement your own signup/login. One account system for the whole
  site is the point.
- Don't fork or copy `shared/account-widget.js` into your own folder — it's
  meant to be loaded once, shared, and updated in one place.

## FAQ

**Do I have to add this?** No — it's opt-in. Plenty of machines have no
accounts at all and that's fine.

**What if `data-accent-color`/`data-icon-color`/`data-mode="docked"` still
isn't enough — I want a fully custom login form in my own markup?** Call
`KuehAccount.signUp()` / `signInWithPassword()` / `signInWithGoogle()` /
`signOut()` directly from your own form instead — the badge is optional, the
account system underneath it isn't.

**Does anonymous progress carry over when someone signs in later?** Not
automatically — that's on you to handle per-game if it matters (e.g. offer
to "claim" existing local progress into the new account).

---

## Setting up the shared project (for whoever's running this)

Not something contributors need — noted here so it's not tribal knowledge:

1. Create a new Supabase project. Note the project URL + anon public key.
2. Auth → Providers: Email is on by default. Enable Google — requires an
   OAuth 2.0 Web Client ID from Google Cloud Console, with authorized
   redirect URI `https://<project-ref>.supabase.co/auth/v1/callback` and
   authorized JS origins for the production domain + `http://localhost:8080`.
   Paste the Client ID/Secret into Supabase's Google provider settings.
3. Auth → URL Configuration: set Site URL to the production domain, and add
   every page that mounts the badge to the Redirect URLs allow-list (`/`,
   `/ruth/`, `/liwei/`, `+ http://localhost:8080` equivalents) — Google
   OAuth is rejected otherwise.
4. Run `supabase/migrations/0001_init.sql` in the SQL editor.
5. Decide whether to require email confirmation on sign-up (Auth →
   Settings) — off gives a smoother instant sign-up for a casual game, on
   is the safer default; `machines/ruth/index.html`'s sign-up flow handles
   either way, but its UX is smoother with confirmation off.
6. Put the project URL + anon key into `shared/account-widget.js`
   (`SUPABASE_URL` / `SUPABASE_ANON_KEY` near the top — currently
   placeholders).
