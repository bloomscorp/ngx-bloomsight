#!/usr/bin/env node
/**
 * Copy the workspace version into the library's own package.json.
 *
 * `release-it` bumps the **root** package.json. What npm actually publishes is
 * `projects/bloomscorp/ngx-bloomsight/package.json`, because that is the file
 * `ng-packagr` copies into `dist/`. Nothing kept the two in sync, so
 * `npm run release` could tag `v1.7.0` while the tarball still said `1.6.0` —
 * the `1cf18b9 build: update version` commit in the history is someone doing
 * this by hand.
 *
 * Wired into `.release-it.json` as an `after:bump` hook, so it runs after the
 * version is written and before `build-lib` copies it into `dist/`.
 *
 * Also usable as a check: `--check` exits non-zero when the two disagree, which
 * is what CI should assert.
 *
 * See MODERNISATION.md (B5).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'package.json');
const LIB = path.join(__dirname, '..', 'projects', 'bloomscorp', 'ngx-bloomsight', 'package.json');

const CHECK = process.argv.includes('--check');

function read(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`sync-library-version: cannot read ${file} — ${err.message}`);
    process.exit(1);
  }
}

const root = read(ROOT);
const lib = read(LIB);

if (!root.version) {
  console.error('sync-library-version: the workspace package.json has no version');
  process.exit(1);
}

if (root.version === lib.version) {
  console.log(`sync-library-version: already in sync at ${root.version}`);
  process.exit(0);
}

if (CHECK) {
  console.error(
    `sync-library-version: out of sync — workspace is ${root.version}, `
    + `library is ${lib.version}. The library's version is the one that gets `
    + `published. Run "npm run sync-version".`
  );
  process.exit(1);
}

const was = lib.version;
lib.version = root.version;

// Preserve the file's existing indentation rather than reformatting it, so the
// diff is one line.
const raw = fs.readFileSync(LIB, 'utf8');
const indent = /\n(\s+)"/.exec(raw);
fs.writeFileSync(LIB, JSON.stringify(lib, null, indent ? indent[1] : 2) + '\n');

console.log(`sync-library-version: ${was} → ${lib.version}`);
