#!/usr/bin/env node
// Onboards a new kueh machine contributor: creates their machines/<slug>
// folder, wires their URL into vercel.json's rewrites, and adds them to
// the CONTRIBUTORS list in src/organisms/check-in.js.
//
// Usage:
//   node scripts/add-contributor.mjs <slug> "<Full Name>" "<tagline>"
//
// Example:
//   node scripts/add-contributor.mjs maya "Maya Studio" "the one that's a generative poster maker"
//
// <slug> becomes the folder name and the URL (kuehmachine.com/<slug>).
// <tagline> is wrapped in parens automatically, matching the existing
// "(the one that's a ___)" style.
//
// No dependencies — plain Node, matching the rest of this repo.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_IN_PATH = path.join(ROOT, 'src/organisms/check-in.js');
const VERCEL_JSON_PATH = path.join(ROOT, 'vercel.json');
const MACHINES_DIR = path.join(ROOT, 'machines');

function usage() {
  console.error('Usage: node scripts/add-contributor.mjs <slug> "<Full Name>" "<tagline>"');
  console.error('Example: node scripts/add-contributor.mjs maya "Maya Studio" "the one that\'s a generative poster maker"');
  process.exit(1);
}

function initialsFor(fullName) {
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return (words[0][0] + words[0][words[0].length - 1]).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// CONTRIBUTORS is a flat, alphabetical-by-first-name roster (everyone's
// real first name is already known — see check-in.js) — not a generated
// placeholder block. Onboarding someone therefore means finding their
// existing row by first-name match and filling in its real name/tagline,
// falling back to appending a brand-new row for anyone not already listed.
function addToCheckIn(slug, fullName, tagline) {
  const src = readFileSync(CHECK_IN_PATH, 'utf8');

  const blockRegex = /const CONTRIBUTORS = \[\n((?:  \{ initials: '[^']*', name: '[^']*', desc: "[^"]*" \},\n)+)\];/;
  const blockMatch = src.match(blockRegex);
  if (!blockMatch) {
    throw new Error(
      `Couldn't find the expected CONTRIBUTORS array shape in ${path.relative(ROOT, CHECK_IN_PATH)}. ` +
        'It may have been hand-edited since this script was written — add the entry manually.'
    );
  }
  const [full, body] = blockMatch;

  const entryRegex = /  \{ initials: '([^']*)', name: '([^']*)', desc: "([^"]*)" \},\n/g;
  const entries = [...body.matchAll(entryRegex)];

  const firstName = fullName.trim().split(/\s+/)[0].toLowerCase();
  const existing = entries.find((e) => e[2].split(/\s+/)[0].toLowerCase() === firstName);

  if (existing && existing[2] === fullName && existing[3] !== "(the one that's a ___)") {
    throw new Error(`${fullName} is already in the CONTRIBUTORS list with a submitted tagline.`);
  }

  const newLine = `  { initials: '${initialsFor(fullName)}', name: '${fullName}', desc: "(${tagline})" },\n`;
  const newBody = existing ? body.replace(existing[0], newLine) : body + newLine;

  writeFileSync(CHECK_IN_PATH, src.replace(full, `const CONTRIBUTORS = [\n${newBody}];`));
}

// Three entries per contributor, not two — a bare "/slug" -> "/machines/
// slug" rewrite (the original shape) serves the page fine but leaves the
// browser's address bar at "/slug" with no trailing slash, which breaks
// every one of that page's own "./"-relative asset links (they resolve
// against "slug" as if it were a filename, one directory too high — the
// exact bug that broke Amy/Jesslyn/Ruth's pages). Fixed by redirecting the
// bare slug to add the trailing slash FIRST, then rewriting the now-
// slash-terminated path to the real index.html explicitly (a bare
// trailing-slash rewrite destination doesn't reliably resolve to a
// directory's index.html on Vercel).
function addToVercelRewrites(slug) {
  const src = readFileSync(VERCEL_JSON_PATH, 'utf8');

  if (src.includes(`"source": "/${slug}"`) || src.includes(`"source": "/${slug}/"`)) {
    throw new Error(`/${slug} is already in vercel.json's redirects/rewrites.`);
  }

  // Edited as text, not JSON.parse + stringify, to preserve the existing
  // one-entry-per-line formatting instead of expanding every object.
  const lastRedirectRegex = /(    \{ "source": "[^"]*", "destination": "[^"]*", "permanent": false \})\n(  \],\n  "rewrites": \[\n)/;
  const redirectMatch = src.match(lastRedirectRegex);
  const lastRewriteRegex = /(    \{ "source": "[^"]*", "destination": "[^"]*" \})\n(  \]\n\}\n?)$/;
  const rewriteMatch = src.match(lastRewriteRegex);
  if (!redirectMatch || !rewriteMatch) {
    throw new Error(
      `Couldn't find the expected redirects/rewrites array shape in ${path.relative(ROOT, VERCEL_JSON_PATH)}. ` +
        'It may have been hand-edited since this script was written — add the entries manually.'
    );
  }

  const [redirectFull, lastRedirect, redirectTail] = redirectMatch;
  const newRedirect = `    { "source": "/${slug}", "destination": "/${slug}/", "permanent": false }\n`;
  const withRedirect = src.replace(redirectFull, `${lastRedirect},\n${newRedirect}${redirectTail}`);

  const [rewriteFull, lastRewrite, rewriteTail] = rewriteMatch;
  const newRewrites =
    `    { "source": "/${slug}/", "destination": "/machines/${slug}/index.html" },\n` +
    `    { "source": "/${slug}/:path*", "destination": "/machines/${slug}/:path*" }\n`;

  writeFileSync(VERCEL_JSON_PATH, withRedirect.replace(rewriteFull, `${lastRewrite},\n${newRewrites}${rewriteTail}`));
}

function main() {
  const [slug, fullName, tagline] = process.argv.slice(2);
  if (!slug || !fullName || !tagline) usage();
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
    console.error(`"${slug}" isn't a valid slug — lowercase letters, digits, hyphens only, starting with a letter.`);
    process.exit(1);
  }

  addToCheckIn(slug, fullName, tagline);
  addToVercelRewrites(slug);

  const folder = path.join(MACHINES_DIR, slug);
  const folderExisted = existsSync(folder);
  mkdirSync(folder, { recursive: true });

  console.log(`Added ${fullName} (${slug}):`);
  console.log(`  - CONTRIBUTORS entry in src/organisms/check-in.js`);
  console.log(`  - rewrites for /${slug} in vercel.json`);
  console.log(`  - machines/${slug}/${folderExisted ? ' (already existed)' : ' (created)'}`);
  console.log(`Next: drop their project files into machines/${slug}/`);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
