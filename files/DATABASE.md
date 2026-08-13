# Shared database

> **Setup note:** Save this file as `DATABASE.md` in your project folder, next to your existing `CLAUDE.md`. Claude Code reads it automatically from there.

kuehmachine.com already has one shared Supabase project wired in through `shared/account-widget.js`, the script that gives every project its sign-in badge. If your project has a score, an unlock, a habit streak, or any piece of progress that currently resets when the page reloads or gets opened on another device, it can follow the signed-in account instead.

Six projects already do this, in different amounts. Ruth's and Liwei's games came first and have full backends: accounts, cumulative leaderboards, Ruth's own friends system. Ken's kueh collection, Amy's kueh reveals, Natalia's habit tracker, and Sophia's cat map are newer and smaller, built specifically to show how little this takes. Claude Code — read `AUTH.md` at the repo root first. It has copy-paste SQL templates and explains the account system in full. `machines/ken/js/app.js` plus `supabase/migrations/0002_ken_collection.sql` is the smallest real example if you want to see the whole thing end to end.

## What to actually do

1. Check that `shared/account-widget.js` loads before this project's own scripts, not after. This was the most common mistake across all four examples: a project's own script reads `window.KuehAccount` at its top level, so if the account widget's `<script>` tag comes later in the page, that read happens before the object exists.

2. Work out which shape the data needs:
   - **Private** — a save only this player should see (a score, an unlocked collection, saved progress). One row per user, a single `jsonb` column, RLS locked to `auth.uid()`. Copy `ken_collection`'s table.
   - **Public** — a leaderboard, a shared map, anything other players should see or add to. One row per item, public read. Copy `ruth_scores` or `liwei_scores` if rows are append-only, or `sophia_cats` if other players need to edit an existing row.

3. Write the new table as its own file under `supabase/migrations/`, numbered one past whatever's already there. Don't edit the existing migration files.

4. Wire the client so it reads from the table on load when signed in, and writes to it on every local save. Keep whatever local storage the project already uses as the fallback for signed-out players. Nothing on the site should require an account to work.

5. You can't run the SQL yourself. Give the project owner the exact block to paste into the Supabase SQL editor, the same way it's already been done for Ken, Amy, Natalia, and Sophia.

## What not to do

- Don't create a separate Supabase project or hardcode a different URL or key. One shared project, one `shared/account-widget.js`.
- Don't require sign-in for the core feature to work. Every project on this site needs to work fully for someone who never makes an account.
- Don't skip row level security, and don't guess at a policy that isn't actually right for who should read or write that table. A table with RLS off is a real security hole, not a shortcut.
