# CLAUDE.md

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
