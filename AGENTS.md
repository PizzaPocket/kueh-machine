# AGENTS.md

This file will be replaced with the real version before launch.

## Don't self-verify visual changes by default

Don't launch a dev server / screenshot tool to visually check CSS or layout
changes unless explicitly asked. The user is working locally and can look at
the result themselves in seconds — spending time/tokens taking screenshots
to confirm something the user can just glance at is wasted effort. Make the
change, explain what you changed and why, and let the user look. Only
screenshot proactively when there's no other way to verify correctness (e.g.
no user available, or the task explicitly requires proof like a PR
description).

## Running a dev server

This is a plain static site: no `package.json`, no bundler/build config
(Vite, webpack, etc.) anywhere in the repo or its git history. `index.html`
loads CSS via `<link>` and JS via `<script type="module">`, both with
relative paths — there's nothing to compile.

It does need to be served over `http://`, not opened directly as a
`file://` URL, because `type="module"` scripts are blocked by CORS when
loaded from the filesystem. To run it locally:

```
python3 -m http.server 8080
```

then open `http://localhost:8080/`.

## Linking to a contributor machine

Always link to a machine as `/<slug>/` (e.g. `/ruth/`, `/kaixin/`), never
`/machines/<slug>/`. `vercel.json`'s `rewrites` are the actual routing
authority — `/<slug>/` is what it rewrites to that machine's real deployed
output, whatever that turns out to be. `/machines/<slug>/` is just the raw
filesystem path, and only happens to also serve the right thing for a flat,
buildless project (most of them). Any project with a build step — Kaixin's
Vite build, Samantha's Next.js static export — puts its real output in a
nested subfolder (`dist/`, `out/`) that only the `/<slug>/` rewrite points
at; the plain `/machines/<slug>/` path instead serves that folder's raw,
unbuilt source `index.html` (or, before this was caught, 404s outright —
see `machines/samantha/index.html` and `machines/kaixin/index.html`, both a
small client-side redirect to their real `/<slug>/` route as a defensive
fallback for anyone who links to or bookmarks the raw path anyway).

This same rule applies inside `godot/hub/`'s NPC links
(`hub_main.gd`'s `_contributors()`) and `src/organisms/check-in.js`'s
`CONTRIBUTORS` roster — both already follow it. It also applies to the Hub
itself, not just the contributor machines it links out to: `vercel.json`
has a `/hub/` alias the same as every other machine, and `index.html`'s own
ENTER button links there, not to `/machines/hub/`.
