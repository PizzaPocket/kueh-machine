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
