#!/usr/bin/env node
/**
 * The facade rule, enforced: nothing in the demo app may import
 * `@bloomscorp/bloomsight.js`. An Angular app talks to `@bloomscorp/ngx-bloomsight`
 * only; if it ever needs the core directly, the wrapper's public API is missing
 * something, and that is the bug to fix (MODERNISATION.md §2).
 *
 * The demo is the reference consumer, so this checks every TypeScript file
 * under `src/`, tests included — integration tests are consumers too.
 *
 * Comments are stripped first, so explaining the rule in a comment, as this
 * repo does in several places, is not mistaken for breaking it.
 */
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const CORE = '@bloomscorp/bloomsight.js';

// `from '…'`, `import '…'`, `import('…')`, `require('…')` — with any subpath.
const quoted = `['"\`]${CORE.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?:/[^'"\`]*)?['"\`]`;
const IMPORT = new RegExp(`(?:\\bfrom\\s*|\\bimport\\s*\\(?\\s*|\\brequire\\s*\\(\\s*)${quoted}`);

function* files(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) yield* files(path);
		else if (name.endsWith('.ts')) yield path;
	}
}

function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

const offenders = [];
let checked = 0;
for (const file of files(SRC)) {
	checked++;
	stripComments(readFileSync(file, 'utf8')).split('\n').forEach((line, i) => {
		if (IMPORT.test(line)) offenders.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
	});
}

if (offenders.length) {
	console.error(`verify-facade: the demo app imports ${CORE} directly. Use @bloomscorp/ngx-bloomsight instead,`);
	console.error('and if what you need is not exported there, export it from the wrapper.\n');
	for (const offender of offenders) console.error('  ' + offender);
	process.exit(1);
}
console.log(`verify-facade: ${checked} files under src/, none imports ${CORE}`);
