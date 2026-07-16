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

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function usage() {
  console.error('Usage: node scripts/add-contributor.mjs <slug> "<Full Name>" "<tagline>"');
  console.error('Example: node scripts/add-contributor.mjs maya "Maya Studio" "the one that\'s a generative poster maker"');
  process.exit(1);
}

function initialsFor(fullName) {
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function addToCheckIn(slug, fullName, tagline) {
  const src = readFileSync(CHECK_IN_PATH, 'utf8');

  const blockRegex =
    /\/\/ \w+ real submissions? so far; the rest are unfilled placeholder rows\n\/\/ \(clearly generic name\/description, not fabricated people\) reserving\n\/\/ space for the other \w+ team members?' entries\.\nconst CONTRIBUTORS = \[\n((?:  \{ initials: '[^']*', name: '[^']*', desc: "[^"]*" \},\n)*)  \.\.\.Array\.from\(\{ length: (\d+) \}, \(_, i\) => \(\{\n    initials: `C\$\{i \+ (\d+)\}`,\n    name: `Contributor \$\{i \+ \d+\}`,\n    desc: "\(the one that's a ___\)",\n  \}\)\),\n\];/;

  const match = src.match(blockRegex);
  if (!match) {
    throw new Error(
      `Couldn't find the expected CONTRIBUTORS block shape in ${path.relative(ROOT, CHECK_IN_PATH)}. ` +
        'It may have been hand-edited since this script was written — add the entry manually.'
    );
  }

  const [full, existingLines, lengthStr, offsetStr] = match;
  const oldLength = parseInt(lengthStr, 10);
  const oldOffset = parseInt(offsetStr, 10);

  if (existingLines.includes(`name: '${fullName}'`)) {
    throw new Error(`${fullName} is already in the CONTRIBUTORS list.`);
  }
  if (oldLength <= 0) {
    throw new Error('No placeholder slots left (roster is full) — add a new slot in check-in.js manually.');
  }

  const newLength = oldLength - 1;
  const newOffset = oldOffset + 1;
  const realCount = existingLines.split('\n').filter(Boolean).length + 1;

  const newLine = `  { initials: '${initialsFor(fullName)}', name: '${fullName}', desc: "(${tagline})" },\n`;

  const commentLine1 = `// ${cap(WORDS[realCount])} real submission${realCount === 1 ? '' : 's'} so far; the rest are unfilled placeholder rows`;
  const commentLine3 =
    newLength === 0
      ? '// space for no one else — every slot is filled.'
      : `// space for the other ${WORDS[newLength]} team member${newLength === 1 ? '' : 's'}' entries.`;

  const newBlock =
    `${commentLine1}\n` +
    `// (clearly generic name/description, not fabricated people) reserving\n` +
    `${commentLine3}\n` +
    `const CONTRIBUTORS = [\n` +
    `${existingLines}${newLine}` +
    `  ...Array.from({ length: ${newLength} }, (_, i) => ({\n` +
    `    initials: \`C\${i + ${newOffset}}\`,\n` +
    `    name: \`Contributor \${i + ${newOffset}}\`,\n` +
    `    desc: "(the one that's a ___)",\n` +
    `  })),\n` +
    `];`;

  writeFileSync(CHECK_IN_PATH, src.replace(full, newBlock));
}

function addToVercelRewrites(slug) {
  const src = readFileSync(VERCEL_JSON_PATH, 'utf8');

  if (src.includes(`"source": "/${slug}"`)) {
    throw new Error(`/${slug} is already in vercel.json's rewrites.`);
  }

  // Edited as text, not JSON.parse + stringify, to preserve the existing
  // one-rewrite-per-line formatting instead of expanding every object.
  const lastEntryRegex = /(    \{ "source": "[^"]*", "destination": "[^"]*" \})\n(  \]\n\}\n?)$/;
  const match = src.match(lastEntryRegex);
  if (!match) {
    throw new Error(
      `Couldn't find the expected rewrites array shape in ${path.relative(ROOT, VERCEL_JSON_PATH)}. ` +
        'It may have been hand-edited since this script was written — add the rewrite manually.'
    );
  }

  const [full, lastEntry, tail] = match;
  const newEntries =
    `    { "source": "/${slug}", "destination": "/machines/${slug}" },\n` +
    `    { "source": "/${slug}/:path*", "destination": "/machines/${slug}/:path*" }\n`;

  writeFileSync(VERCEL_JSON_PATH, src.replace(full, `${lastEntry},\n${newEntries}${tail}`));
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
