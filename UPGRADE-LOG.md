# Angular upgrade log — 14 → 22

> **Running log.** One section per major. Every command run, every change
> required, every error fixed, and — importantly — **every optional migration
> declined**, so the deliberate ones can be revisited later rather than
> rediscovered.
>
> Branch: `feat/angular-22`, based on `60ecc44` on `main`.
> Audit and bug status: [MODERNISATION.md](./MODERNISATION.md).

## Ground rules

1. **One major per commit.** Library source stays untouched during the climb; the
   2.0.0 API rewrite is a separate change on top.
2. **No `--force`.** If a step will not resolve, find the organic fix — bump the
   blocking package, align a peer, stage it as its own step. `--force` is the
   last resort and gets its own log entry explaining why nothing else worked.
3. **Decline every optional migration** during the climb, and record it in
   §Optional migrations. Taking standalone/application-builder moves later,
   deliberately, beats having them half-applied across nine majors.
4. **Intermediate work is expected.** Over nine majors some things get deprecated
   and then removed; occasionally a fix has to land *between* two versions before
   the next one will go. Those get their own numbered entries.

---

## Baseline — Angular 14.3.0

Captured before any change.

| | |
|---|---|
| `@angular/core` | 14.3.0 |
| `@angular/cli` | 14.2.13 |
| `@angular-devkit/build-angular` | ^14.2.13 |
| `ng-packagr` | ^14.2.0 |
| TypeScript | ~4.7.2 |
| zone.js | ~0.11.4 |
| rxjs | ~7.5.0 |
| Karma / Jasmine | karma ~6.4.0, jasmine-core ~4.3.0 |
| Node (local) | v22.12.0 |
| `.node-version` | `v20` |

**Verified green at baseline:** `npm run build-lib` ✅ · `npm run check-version` ✅

**Known-stale going in:** `.node-version` says `v20` while the shell runs 22.12.0.
Left alone deliberately — Angular 14 does not support Node 24, and Angular 22 will
need `^22.22.3 || ^24.15.0 || >=26`, so the bump belongs to whichever step first
requires it (see §Node).

---

## Node

Angular's `engines` per major, checked as we go, so the bump happens exactly when
it is forced and not before.

| Angular | `engines.node` | Local 22.12.0 |
|---|---|---|
| 15 | `^14.20.0 \|\| ^16.13.0 \|\| >=18.10.0` | ✅ satisfies `engines`, but see note |
| 16 | `^16.14.0 \|\| >=18.10.0` | ✅ satisfies |
| 22 | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | ❌ needs bump |

`fnm` already has `v22.23.2` and `v24.18.0` installed, so it is a one-line
`.node-version` change when the time comes.

> ⚠️ **`engines` is not the whole story.** Angular 15 declares `>=18.10.0`, which
> 22.12.0 satisfies, but `ng version` still prints
> `Node: 22.12.0 (Unsupported)` — the CLI keeps its own list of *supported*
> majors and 22 is newer than anything Angular 15 knew about. It is a **warning
> only**: build, library build and tests all pass. Noted so a later failure is
> not misattributed to it.

---

## Optional migrations — declined during the climb, revisit later

Recorded as they are offered. Nothing here has been applied.

| Angular | Migration | How to run it later | Why deferred |
|---|---|---|---|
| 15 | `standalone-migration` (`@angular/core:standalone`) | `ng generate @angular/core:standalone` | Converts the app/library to standalone components. The 2.0.0 rewrite replaces the public API with `provideBloomsight()` and deletes the only component (CLI scaffolding), so running this now would convert code that is about to be removed. Do it as part of 2.0.0, not here. |

---

## 14 → 15 — ✅ done

**Result: clean. No `--force`, no code changes, no TypeScript errors.**

### Commands

```bash
npx ng update @angular/cli@15 @angular/core@15
```

One command. It resolved without `--force`, which I had expected to fight over
`zone.js`, `rxjs`, `typescript` and `ng-packagr`.

**First attempt failed** — and not on dependencies:

```
Error: Repository is not clean. Please commit or stash any changes before updating.
```

`ng update` refuses to run against a dirty tree, and this log file was untracked.
Committed the log first (`5adfea3`) rather than stashing, since it belongs on the
branch anyway. Worth remembering for every remaining step: **commit before each
`ng update`.**

### What it changed

| Package | 14 | 15 |
|---|---|---|
| `@angular/*` | 14.2/14.3 | 15.2.10 |
| `@angular/cli` | 14.2.13 | 15.2.11 |
| `@angular-devkit/build-angular` | ^14.2.13 | ^15.2.11 |
| **`ng-packagr`** | ^14.2.0 | **^15.2.2** |
| **`typescript`** | ~4.7.2 | **~4.9.5** |

Two of those were on my task list as *manual* steps and turned out not to be:
`ng update` bumped **`ng-packagr`** and **TypeScript** itself. TypeScript went
straight to 4.9.5 rather than the 4.8.2 minimum Angular 15 requires.

`zone.js ~0.11.4` and `rxjs ~7.5.0` were already inside Angular 15's peer ranges,
so neither moved.

### Automated migrations that ran

| Migration | Effect |
|---|---|
| Remove default Browserslist config | `DELETE .browserslistrc` — it matched the CLI default |
| Remove `require` calls in the Karma main file | `UPDATE src/test.ts`, `UPDATE projects/bloomscorp/ngx-bloomsight/src/test.ts` — the `require.context` block is handled by the builder now |
| Set TS `target` / `useDefineForClassFields` | `tsconfig.json`: `target` `es2020` → `ES2022`, added `useDefineForClassFields: false` |
| Remove `renderModule` from platform-server | no changes |
| Remove unsupported `angular.json` options | no changes |
| Remove `relativeLinkResolution` | no changes — not used |
| `RouterLinkWithHref` → `RouterLink` | no changes — not used |

### Errors fixed

**None.** TypeScript 4.7 → 4.9 produced no errors, despite `strict`,
`noPropertyAccessFromIndexSignature`, `noImplicitReturns` and `strictTemplates`
all being on. The library is small and already strictly typed.

### Verification

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ `Built @bloomscorp/ngx-bloomsight` |
| `npm run build` (demo app) | ✅ 248.58 kB initial |
| `ng test --watch=false --browsers=ChromeHeadless` | ✅ 3/3 and 2/2 — both projects |
| `npm run check-version` | ✅ in sync at 1.6.0 |
| Library `peerDependencies` | ✅ the B2 ranges survived untouched |

The last one mattered: `ng update` rewrites `package.json` dependency ranges, and
it could have clobbered the widened peer ranges from the B2 fix. It did not —
it only touches the workspace `package.json`, not the library's.

### Decision: `.browserslistrc` stays deleted

Asked and settled 2026-10-12. The deleted file was byte-identical to the stock
`ng new` output, which is exactly the migration's criterion, and from Angular 15
the CLI carries that same list internally — so it was duplication, not
configuration.

It also has **no effect on what this package publishes**. Browserslist governs JS
downlevelling and CSS autoprefixing; the library ships zero stylesheets, and with
`compilationMode: "partial"` the downlevelling is done by the *consuming app's*
build using the *consuming app's* browserslist. A library's own browserslist
never reaches a consumer.

The trade-off accepted: the **demo app's** build targets now track Angular's
default rather than a pinned list, so they will shift when Angular changes its
supported-browser policy — which happens at 16. Fine for a demo app that
exercises nothing. Restore with
`git checkout 60ecc44 -- .browserslistrc` if explicit control is ever wanted.

### Notes for later steps

- Commit before every `ng update`; the clean-tree check is not negotiable.
- Angular 15's CLI reports Node 22.12.0 as unsupported (warning only, see §Node).
- The demo app still imports the library by **source path**, not package name, so
  none of these builds exercised the published artifact. That is T2 in
  MODERNISATION.md and still open.

---

## 15 → 16 — ✅ done

**Result: clean. No `--force`, no code changes, no TypeScript errors.**

### Commands

```bash
npx ng update @angular/cli@16 @angular/core@16
```

The locally installed CLI was 15, so it bootstrapped a temporary 16.2.16 to run
the update — normal, and worth knowing so the message is not mistaken for a
problem.

### What it changed

| Package | 15 | 16 |
|---|---|---|
| `@angular/*` | 15.2.10 | 16.2.12 |
| `@angular/cli`, `build-angular` | 15.2.11 | 16.2.16 |
| `ng-packagr` | ^15.2.2 | ^16.2.3 |
| **`zone.js`** | 0.11.8 | **0.13.3** |
| `typescript` | ~4.9.5 | **unchanged** |

`zone.js` was the forced move — Angular 16 peers on `~0.13.0` and 0.11.8 was out
of range. `ng update` handled it without being asked.

TypeScript stayed at ~4.9.5, which satisfies Angular 16's `>=4.9.3 <5.2`.
**Angular 17 requires >=5.2, so the TypeScript jump lands on the next step**, not
this one.

### Automated migrations that ran

All five found nothing to change: `defaultProject` removal,
`defaultCollection` → `schematicCollections`, the server-builder
`buildOptimizer` tweak, the 15.2-deprecated guard/resolver interfaces
(`CanActivate`, `Resolve` — none used), and `@Component.moduleId`.

### Errors fixed

**None.**

### Packaging change worth knowing: the dist layout

ng-packagr 16 changed what it emits:

| 15 | 16 |
|---|---|
| `esm2020/`, `fesm2015/`, `fesm2020/` | `esm2022/`, `fesm2022/` |

So the ES2015 and ES2020 bundles are gone and the package ships ES2022 only.

I initially read this as breaking the widened `>=14.2.0 <23.0.0` peer range from
the B2 fix — a library built on Angular 16 surely cannot be consumed by an
Angular 14 app. **That was wrong.** The partial declarations carry the floor
explicitly, and the built output says:

```
minVersion: "12.0.0"   (×14)
minVersion: "14.0.0"   (×2)
version:    "16.2.12"  (×16)
```

`minVersion` is the oldest Angular whose linker can process these declarations,
and it is still 14. `version` is merely what produced them. So the declared peer
range remains defensible.

**Track `minVersion` at every remaining step** — it is the authoritative
compatibility floor, and it rises when the library starts using newer framework
features. It is what the final `2.0.0` peer range should be derived from rather
than guessed at.

One loose end: with `fesm2015`/`fesm2020` gone, an old consumer toolchain now
resolves `module` → `fesm2022` and has to parse ES2022. `minVersion` says the
*linker* is fine; whether an Angular 14-era webpack build digests ES2022 syntax
is a separate question, untested. It only matters if we ever genuinely support a
14-era consumer — settle it when the `2.0.0` peer range is finalised, by
installing the built tarball into a real old app rather than reasoning about it.

### Verification

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ `Built @bloomscorp/ngx-bloomsight` |
| `npm run build` (demo app) | ✅ 255.03 kB initial (was 248.58 kB) |
| `ng test --watch=false --browsers=ChromeHeadless` | ✅ 3/3 and 2/2 |
| `npm run check-version` | ✅ in sync at 1.6.0 |
| Library `peerDependencies` | ✅ unchanged |

---

## 16 → 17

_Next._ Expect the TypeScript jump (16 allows `<5.2`, 17 requires `>=5.2`), and
this is the version where the `browserTarget` → `buildTarget` rename and the
optional application-builder migration arrive.
