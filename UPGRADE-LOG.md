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
   > **Amended at 19.** Angular 19 made `standalone: true` the default, so the
   > framework *requires* `standalone: false` on any `NgModule`-declared
   > component. The library's scaffolding component had to change. The rule now
   > reads: library source changes only when a major compels it, never for
   > improvement — and each such change gets called out in its step's entry.
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
| 17 | `^18.13.0 \|\| >=20.9.0` | ✅ satisfies, and no "Unsupported" warning |
| 18 | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | ✅ satisfies |
| 19 | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | ✅ satisfies |
| 20 | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | ⚠️ satisfies by **one patch** — `^22.12.0` and we run 22.12.0 exactly. **Verified at the 20 step: no warning, no failure** |
| 21 | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | ⚠️ same one-patch margin. **Verified at the 21 step: fine** |
| 22 | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | ✅ **resolved** — `.node-version` pinned to `v24.18.0` (`f648801`) |

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
| 17 | `use-application-builder` (`@angular/cli`) | `ng update @angular/cli --migrate-only --name=use-application-builder` | Swaps the webpack `browser` builder for the esbuild-based `application` builder. It rewrites `angular.json` build targets and changes how the **demo app** is bundled — it has no effect on the library, which is built by `ng-packagr`. Deferred because it is a build-system change in the middle of a nine-major climb: if a later version breaks, I want the builder to be a constant, not another variable. Revisit once the chain reaches 22, where this builder is the default anyway. |
| 17 | `control-flow-migration` (`@angular/core`) | `ng generate @angular/core:control-flow` | Rewrites `*ngIf` / `*ngFor` / `*ngSwitch` as `@if` / `@for` / `@switch`. The only templates in the repo are the CLI-scaffolded demo app and the library's placeholder component, both of which the 2.0.0 rewrite deletes. Nothing to gain; same reasoning as `standalone-migration`. |
| 18 | `use-application-builder` (`@angular/cli`) | `ng update @angular/cli --migrate-only --name=use-application-builder` | Offered again, declined again — and now known to be safe to defer indefinitely: the `browser` builder is still present in `@angular-devkit/build-angular` **19, 20, 21 and 22**, and is not even flagged deprecated at 22. See §Forward map. |
| 19 | `use-application-builder` (`@angular/cli`) | `ng update @angular/cli --migrate-only --name=use-application-builder` | Third offer, declined again. See the 18 entry — safe to defer indefinitely. |
| 19 | `provide-initializer` (`@angular/core`) | `ng update @angular/core --migrate-only --name=provide-initializer` | Replaces `APP_INITIALIZER` / `ENVIRONMENT_INITIALIZER` / `PLATFORM_INITIALIZER` with `provideAppInitializer()` and friends. **A no-op today** — the repo uses none of those tokens. It becomes relevant *during* 2.0.0, which introduces an app initializer to fix B1/B7/B8: write that code with `provideAppInitializer()` from the start rather than the old token and a migration afterwards. |
| 20 | `use-application-builder` (`@angular/cli`) | `ng update @angular/cli --migrate-only --name=use-application-builder` | Fourth offer, declined. |
| 20 | `control-flow-migration` (`@angular/core`) | `ng update @angular/core --migrate-only --name=control-flow-migration` | Promoted from a `ng generate` schematic to a real optional migration at 20. Declined for the same reason as at 17. **No longer declinable — it became an automatic migration at 21 and ran.** |
| 20 | `router-current-navigation` (`@angular/core`) | `ng update @angular/core --migrate-only --name=router-current-navigation` | Replaces `Router.getCurrentNavigation()` with the `Router.currentNavigation` signal. **A no-op here** — the library only subscribes to `NavigationEnd`. Noted so it is not mistaken for pending work. |
| 21 | `use-application-builder` (`@angular/cli`) | `ng update @angular/cli --migrate-only --name=use-application-builder` | Fifth offer, declined. Still safe — the `browser` builder is present through 22. |
| 21 | `router-current-navigation` (`@angular/core`) | `ng update @angular/core --migrate-only --name=router-current-navigation` | Offered again; still a no-op here. |
| 22 | `use-application-builder` (`@angular/cli`) | `ng update @angular/cli --migrate-only --name=use-application-builder` | Sixth and final offer, declined. Never became mandatory, exactly as predicted at 18. |

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

## 16 → 17 — ✅ done

**Result: clean. No `--force`, no code changes to the library, no TypeScript errors.**

This was the step expected to involve real work, because it carries the first
genuine TypeScript major in the chain. It did not, and the reason is worth
recording: a migration two majors earlier had already defused it.

### Pre-flight: TypeScript 5 exposure, audited before running anything

TypeScript went from 4.9 to 5.x here. Rather than run the update and read the
error wall, each TS 5.0 breaking change was checked against this workspace
first:

| TS 5 breaking change | Exposure here | Why |
|---|---|---|
| Standard (ES) decorators replace experimental ones | **None** | `experimentalDecorators: true` is set, so Angular's legacy decorator semantics still apply |
| `useDefineForClassFields` defaults to `true` for ES2022 targets | **None** | Already pinned to `false` in `tsconfig.json` |
| Deprecated flags removed (`importsNotUsedAsValues`, `preserveValueImports`, `suppressImplicitAnyIndexErrors`, …) | **None** | Grepped every `tsconfig*.json`; none present |
| Enum unification — all enums become union enums | **None** | The only enum in play is `EmailEngineTypeEnum`, imported `import type` and bridged with `as unknown as`. A double cast is indifferent to enum relationships |

The second row is the interesting one. `useDefineForClassFields: false` was
written into `tsconfig.json` by the **Angular 15** migration
("Set TS `target` / `useDefineForClassFields`"). With `target: ES2022` and TS 5
flipping that default to `true`, class fields would have been emitted as
`defineProperty` rather than assignments — which breaks Angular's
`@Input`/`@Output` initialisation. **A migration from two majors ago is what
made this one quiet.** It is a concrete argument for the incremental climb over
regenerating the workspace: the chain carries forward fixes whose necessity only
becomes visible later.

### Commands

```bash
npx ng update @angular/cli@17 @angular/core@17
```

Local CLI was 16, so it bootstrapped a temporary 17.3.17. Resolved without
`--force`.

### What it changed

| Package | 16 | 17 |
|---|---|---|
| `@angular/*` | 16.2.12 | 17.3.12 |
| `@angular/cli`, `build-angular` | 16.2.16 | 17.3.17 |
| `ng-packagr` | ^16.2.3 | ^17.3.0 |
| **`typescript`** | ~4.9.5 | **~5.4.5** |
| **`zone.js`** | 0.13.3 | **0.14.10** |
| `rxjs` | ~7.5.0 | unchanged (17 peers `^6.5.3 \|\| ^7.4.0`) |

**TypeScript landed on 5.4.5, not the 5.2 minimum.** `build-angular@17.3.17`
peers on `typescript >=5.2 <5.5`, and `ng update` takes the newest version in
range — so this single step crossed 5.0, 5.1, 5.2, 5.3 and 5.4. Worth knowing
when reading the next steps: Angular 18 requires `>=5.4`, which is **already
satisfied**, so 17 → 18 should not move TypeScript at all.

`zone.js` was the forced move again — `@angular/core@17` peers `~0.14.0`.

### Automated migrations that ran

Eight in total. Two made changes:

| Migration | Effect |
|---|---|
| Replace deprecated options in `angular.json` | **`browserTarget` → `buildTarget`**, 3 occurrences: `serve.production`, `serve.development`, `extract-i18n` |
| Escape `@` and `}` for the new control-flow syntax | `src/app/app.component.html` — two literal `@angular/...` strings inside `<pre>` became `&#64;angular/...` |

The second is not cosmetic. From Angular 17 the template parser treats `@` as
the start of a control-flow block, so an unescaped literal `@` in a template is
a syntax error. The two occurrences were in the stock demo app's "ng add"
examples.

No-ops: `@nguniversal/builders` → `@angular-devkit/build-angular`,
`@nguniversal/*` → `@angular/ssr`, `browser-sync` dev dependency,
`TransferState` import move, `CompilerOption.useJit`/`missingTranslation`
removal, and invalid two-way binding longform.

### Errors fixed

**None.** TypeScript 4.9 → 5.4 produced no errors under `strict`,
`noPropertyAccessFromIndexSignature`, `noImplicitReturns` and `strictTemplates`.

### Optional migrations

`ng update` **did not print an optional-migration notice** this time, which
could easily be misread as "there are none". There is one — it was found by
reading the installed collections directly:

```bash
node -e "const c=require('./node_modules/@schematics/angular/migrations/migration-collection.json'); \
  for(const [k,v] of Object.entries(c.schematics)) if(v.optional) console.log(k)"
```

`use-application-builder`. Plus `control-flow-migration`, which is a
`ng generate` schematic in `@angular/core/schematics/collection.json` rather
than a migration. Both are recorded in §Optional migrations and **declined**.

**Check the collections directly at every remaining step** rather than trusting
the console to advertise them.

### Compatibility floor

Unchanged by this step:

```
minVersion: "12.0.0"   (x14)
minVersion: "14.0.0"   (x2)
version:    "17.3.12"  (x16)
```

Still 14, so the `>=14.2.0 <23.0.0` peer range continues to hold. The dist
layout is also unchanged from 16 (`esm2022/` + `fesm2022/`), so the ES2022
loose end noted there is not made worse.

### Verification

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ `Built @bloomscorp/ngx-bloomsight` |
| `npm run build` (demo app) | ✅ 261.07 kB initial (was 255.03 kB) |
| `ng test --watch=false --browsers=ChromeHeadless` | ✅ 3/3 and 2/2 |
| `npm run check-version` | ✅ in sync at 1.6.0 |
| Library `peerDependencies` | ✅ untouched — `git diff` on the library `package.json` is empty |
| `minVersion` in built output | ✅ still 14.0.0 |

### Notes for later steps

- Node 22.12.0 satisfies 17's `^18.13.0 || >=20.9.0`, and CLI 17 did **not**
  print the "Unsupported" warning that 15 did. The `.node-version` bump is
  still deferred to whichever step forces it (see §Node).
- `moduleResolution: "node"` is still in `tsconfig.json`. TS 5.x accepts it but
  treats it as legacy (`node10`); it is expected to warn and eventually error in
  a later TypeScript. Since the remaining Angular majors carry TS 5.5 → 6.x,
  **this is the most likely source of a required intermediate fix.** Change to
  `bundler` or `node16` only when something actually demands it.

---

## 17 → 18 — ✅ done

**Result: the lightest step in the chain. No `--force`, no source changes, no
config changes, no TypeScript errors. Only `package.json` and the lock file
moved.**

### Pre-flight

Every requirement was checked against the registry *before* running, and every
one of 18's migrations was checked against the source. The prediction was "this
should be free", and it was.

| | 18 requires | Had | Moved? |
|---|---|---|---|
| `typescript` | `>=5.4 <5.6` | 5.4.5 | **no** — 17 overshot straight into this range |
| `zone.js` | `~0.14.10` | 0.14.10 | **no** — exact match |
| `rxjs` | `^6.5.3 \|\| ^7.4.0` | 7.5.0 | no |
| `karma` | `^6.3.0` | 6.4.3 | no |
| Node | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | 22.12.0 | no |

### Commands

```bash
npx ng update @angular/cli@18 @angular/core@18
```

Bootstrapped a temporary CLI 18.2.21. Unlike previous steps it also reported
`Cleaning node modules directory` and did a full reinstall.

### What it changed

| Package | 17 | 18 |
|---|---|---|
| `@angular/*` | 17.3.12 | 18.2.14 |
| `@angular/cli`, `build-angular` | 17.3.17 | 18.2.21 |
| `ng-packagr` | ^17.3.0 | ^18.2.1 |
| `typescript` | ~5.4.5 | unchanged |
| `zone.js` | ~0.14.10 | unchanged |

### Automated migrations that ran

All four found nothing, each for a reason verified in the source beforehand:

| Migration | Why it could not fire |
|---|---|
| `migration-http-providers` (`HttpClientModule` → `provideHttpClient()`) | Zero `HttpClient`/`HttpClientModule` references anywhere — the SDK uses fetch, not Angular's HTTP client |
| `migration-after-render-phase` | No `afterRender` calls |
| `add-bootstrap-context-to-server-main` | No `src/main.server.ts`; the workspace has no SSR |
| `invalid-two-way-bindings` | Already ran clean at 17 |

### Errors fixed

**None.**

### Optional migrations

`use-application-builder`, offered again and declined again. **This time
`ng update` did print the notice**, where at 17 it printed nothing — the console
output is version-dependent, which confirms the rule added at 17: read the
schematic collections directly rather than trusting the console to advertise.

New `ng generate` schematics appeared in `@angular/core@18` that did not exist
at 17: **`inject-migration`** (constructor injection → `inject()`) and
`route-lazy-loading-migration`. Neither is part of the climb, but
`inject-migration` is directly useful to the **2.0.0 rewrite** — the four
constructors in the library are exactly what it converts. Noted there rather
than in §Optional migrations, because it is a tool for the rewrite, not a
deferred migration.

### Compatibility floor

```
minVersion: "12.0.0"   (x14)
minVersion: "14.0.0"   (x2)
version:    "18.2.14"  (x16)
```

Still 14. Dist layout unchanged (`esm2022/` + `fesm2022/`). The
`>=14.2.0 <23.0.0` peer range continues to hold — now verified at 15, 16, 17
and 18.

### Verification

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ built in 2.3s |
| `npm run build` (demo app) | ✅ 273.80 kB initial (was 261.07 kB) |
| `ng test --watch=false --browsers=ChromeHeadless` | ✅ 3/3 and 2/2 |
| `npm run check-version` | ✅ in sync at 1.6.0 |
| Library `peerDependencies` | ✅ `git diff` empty |
| `minVersion` | ✅ still 14.0.0 |

---

## Forward map — 19 to 22, researched at the 18 step

Pulled from the published `peerDependencies`, `engines` and `builders.json` of
each major, so the rest of the climb can be planned rather than discovered.

| Step | TypeScript | zone.js | Node | ng-packagr |
|---|---|---|---|---|
| 19 | **`>=5.5 <5.9`** → moves to 5.8 | **`~0.15.0`** → moves | `>=22.0.0` ok | ^19 |
| 20 | `>=5.8 <6.0` → 5.9 | `~0.15.0` | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | ^20 |
| 21 | `>=5.9 <6.0` | `~0.15.0 \|\| ~0.16.0` | same as 20 | ^21 |
| 22 | **`>=6.0 <6.1`** → **TypeScript 6** | `~0.15.0 \|\| ~0.16.0` | **`^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0`** | ^22 |

Three conclusions that change the plan:

1. **19 is the next step with real movement** — TypeScript *and* zone.js both
   move, the first time two floors shift together.
2. **Angular 22 pulls TypeScript 6.0.** This upgrades
   `moduleResolution: "node"` from a vague watch item to a dated one: TS 6 is
   the most likely place legacy `node` resolution stops being accepted. Expect
   an intermediate fix around 20–22, as its own commit.
3. **`use-application-builder` never becomes mandatory.** `builders.json` in
   build-angular 19, 20, 21 and 22 all still expose the `browser` builder, and
   22 does not even mark it deprecated. Deferring it to 2.0.0 carries no risk of
   forced rework — a worry carried since 17, now retired.

Also worth noting: Node 22.12.0 satisfies 20 and 21 by a **single patch version**
(`^22.12.0`). It holds, but there is no headroom, so if anything odd appears at
20 check the Node version first.

---

## 18 → 19 — ✅ done

**Result: no `--force`, no TypeScript errors — but the first step that modified
source code, and the first that produced a new build warning.**

### Pre-flight

Predicted before running, and all four predictions held:

| Expectation | Outcome |
|---|---|
| `explicit-standalone-flag` will rewrite exactly two files | ✅ exactly those two |
| TypeScript 5.4.5 → ~5.8 (`>=5.5 <5.9`) | ✅ 5.8.3 |
| zone.js 0.14.10 → 0.15.x (`~0.15.0`) | ✅ 0.15.1 |
| `minVersion` might rise and invalidate the peer range | ✅ checked — it did **not** |

### Commands

```bash
npx ng update @angular/cli@19 @angular/core@19
```

### What it changed

| Package | 18 | 19 |
|---|---|---|
| `@angular/*` | 18.2.14 | 19.2.25 |
| `@angular/cli`, `build-angular` | 18.2.21 | 19.2.27 |
| `ng-packagr` | ^18.2.1 | ^19.2.2 |
| **`typescript`** | ~5.4.5 | **~5.8.3** |
| **`zone.js`** | ~0.14.10 | **~0.15.1** |

Both floors moved together for the first time since 16, and TypeScript crossed
four minors in one step (5.5, 5.6, 5.7, 5.8).

### Source changes — the first in the climb

Angular 19 flipped the `standalone` default from `false` to `true`, so any
component declared in an `NgModule` must now say so explicitly. The
`explicit-standalone-flag` migration added `standalone: false` to:

- `projects/bloomscorp/ngx-bloomsight/src/lib/ngx-bloomsight.component.ts` — the **library**
- `src/app/app.component.ts` — the demo app

Both are CLI scaffolding that the 2.0.0 rewrite deletes, so the change does not
touch either real service. The ground rule "library source stays untouched
during the climb" is now broken, but by the framework's requirement rather than
by choice, and in a file already marked for deletion.

**Cosmetic side effect, left as-is:** the schematic's TypeScript printer
reformatted both decorator object literals — 2-space to 4-space indentation, and
`styles: [\n  ]` collapsed to `styles: []`. The semantic change is one line per
file; the rest is the printer. Not hand-corrected, because fighting the printer
after every migration costs more than it saves and both files are scheduled for
deletion.

### The `minVersion` check — the one that mattered

The concern going in: `standalone: false` becomes part of the library's **partial
declarations**, which older Angular linkers must parse. If that raised the floor,
the published `>=14.2.0 <23.0.0` peer range would have become a lie.

It did not. From the built output:

```
ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.2.25",
                       type: NgxBloomsightComponent, isStandalone: false, ... })
```

`isStandalone: false` is emitted, and the compiler still declares a 14.0.0 floor
alongside it — `isStandalone` has been part of the partial-declaration schema
since Angular 14, and `false` is merely the pre-19 default made explicit. Totals
unchanged: `minVersion 12.0.0` x14, `14.0.0` x2.

### `moduleResolution: "node"` — still dormant at TypeScript 5.8

Checked deliberately rather than inferred from a zero exit code:

```bash
npx tsc -p projects/bloomscorp/ngx-bloomsight/tsconfig.lib.prod.json --noEmit
# exit 0, no output, TS 5.8.3
```

No deprecation warning at 5.8. So the forcing point, if it comes, is
**TypeScript 6.0 at Angular 22** — consistent with the forward map.

### New build warning — a tripwire worth knowing about

The demo app build now emits:

```
Warning: src/app/app.component.html-angular-inline--1.css exceeded maximum
budget. Budget 2.00 kB was not met by 1.78 kB with a total of 3.78 kB.
```

**Cause:** `src/app/app.component.html` — the stock Angular welcome page — carries
a single inline `<style>` block of 5,274 bytes. Angular 19 began extracting
inline *template* styles into their own CSS assets, which brings them under the
`anyComponentStyle` budget in `angular.json` (2 kB warning, **4 kB error**).
Nothing in the repo changed; the build's accounting did.

**Why it is being left alone:** it is a warning, it concerns the demo app only,
and the demo app is scheduled for replacement anyway (T2 in MODERNISATION.md).
**Confirmed by the owner, 2026-10-12:** leave it, and if the hard error ceiling
is hit, treat that as the trigger to pick up the demo app rebuild rather than to
patch the budget in isolation. Do not touch it before then.

**Why it is still worth logging:** at 3.78 kB it sits **0.22 kB below the hard
error ceiling**. If a later major changes extraction or minification even
slightly, this becomes a failing build rather than a warning — and the cause
would be very easy to misattribute to that major. If it trips, the fix is to
raise `anyComponentStyle` in `angular.json` or to delete the scaffolded welcome
page; neither needs to happen now.

### Errors fixed

**None.** TypeScript 5.4 → 5.8 produced no errors, and `@types/jasmine@~4.0.0`
compiled cleanly against 5.8 despite being four majors behind — a risk flagged
before the step that did not materialise.

### Verification

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ 4.5s, no warnings |
| `npm run build` (demo app) | ✅ 274.69 kB initial (was 273.80 kB) — with the CSS budget warning above |
| `ng test --watch=false --browsers=ChromeHeadless` | ✅ 3/3 and 2/2 |
| `npm run check-version` | ✅ in sync at 1.6.0 |
| Library `peerDependencies` | ✅ `git diff` empty |
| **`minVersion`** | ✅ **still 14.0.0** |
| `tsc --noEmit` on the library | ✅ exit 0, no deprecations |

---

## Standalone — adopted at the 19 step, by decision

The Angular 19 migration pinned both components to `standalone: false` to
preserve pre-19 behaviour. **Decision taken to go the other way instead:** adopt
the framework's new default now, test it, and keep it. The reasoning is that
Angular has been moving away from NgModules for several majors, so carrying
`standalone: false` forward only defers the same work into a later, larger
change — and every major in between would have to keep honouring it.

This is a **deliberate change, not a migration**, so it is recorded separately
from the 18 → 19 entry.

### What changed

| File | Change |
|---|---|
| `lib/ngx-bloomsight.component.ts` | `standalone: false` → **`standalone: true`**; decorator restored to the file's own 2-space style after the schematic's reformat |
| `lib/ngx-bloomsight.module.ts` | Component moved out of `declarations` into `imports`; `exports` unchanged. The module now declares nothing |
| `lib/ngx-bloomsight.component.spec.ts` | Rewritten — `declarations:` → `imports:` (mandatory: declaring a standalone component is an error), plus real coverage of both consumption paths |

### Why the module survives

`NgxBloomsightModule` is now a compatibility shell: it imports the standalone
component and re-exports it, so every existing consumer doing
`imports: [NgxBloomsightModule]` is unaffected. What keeps it alive is
`forRoot()` — still the only way to supply configuration and provide the two
services.

That is worth stating plainly: **the component was never the library's real
NgModule coupling.** It is CLI scaffolding that renders
*"ngx-bloomsight works!"* and that nothing injects. The actual coupling is that
initialisation and configuration hang off `NgModule.forRoot()`, which is P5 in
MODERNISATION.md and the root of B6/B7/B8. A standalone consumer can still get
there:

```ts
bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(NgxBloomsightModule.forRoot(config))]
});
```

That works, but it is the interop shim rather than the idiomatic path.
`provideBloomsight()` replaces it at 2.0.0 and is **deliberately not pulled
forward** — it is a public API addition that belongs with the rest of the
rewrite, not a side effect of a version step.

### The compatibility check

`standalone: true` is recorded in the published partial declarations, so it
could have raised the floor. It did not:

```
ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.2.25",
                       type: NgxBloomsightComponent, isStandalone: true, ... })
ɵɵngDeclareNgModule({  minVersion: "14.0.0", version: "19.2.25",
                       type: NgxBloomsightModule,
                       imports: [NgxBloomsightComponent],
                       exports: [NgxBloomsightComponent] })
```

Totals identical to before the change: `minVersion 12.0.0` x14, `14.0.0` x2. So
`>=14.2.0 <23.0.0` still holds, and `isStandalone: true` costs nothing that
`isStandalone: false` did not already cost.

> **Caveat, logged not resolved.** The 14.0.0 figure is the *linker* floor.
> Standalone components were developer preview in Angular 14 and only stable in
> 15, so a genuine Angular 14 consumer is theoretically supported here but has
> never been tested. This is the same untested loose end recorded at the 16 step
> (ES2022 output for old toolchains), and it gets settled the same way: by
> installing the built tarball into a real old app when the 2.0.0 peer range is
> finalised.

### Tests

The component spec went from 1 assertion to 4, and the library suite from **2
tests to 5**:

| Test | Proves |
|---|---|
| `should create` | unchanged |
| `should be standalone, so it can be imported without a module` | `imports: [NgxBloomsightComponent]` would throw for a declared component, so the test reaching this point is itself the proof; it also asserts `ɵcmp.standalone` so an accidental revert fails loudly |
| `should render its template` | the component actually renders, which the original stub never checked |
| `should still be reachable through the module` | a **standalone host** importing `NgxBloomsightModule` renders the component — the regression guard for every existing consumer |

All green: library 5/5, demo app 3/3.

### Deliberately out of scope

- **The demo app keeps `standalone: false`** on `AppComponent`. Converting it
  means `bootstrapApplication`, deleting `AppModule` and rewiring providers —
  which is the demo app rework (T2), explicitly deferred. The demo app has
  known problems and gets rebuilt before anything is published; the flag goes
  then.
- **`provideBloomsight()`** — see above. 2.0.0.
- **The CSS budget warning** — decision taken to leave it until it either trips
  the hard error ceiling or the demo app is rebuilt, whichever comes first.

---

## 19 → 20 — ✅ done

**Result: no `--force`, no source changes, no TypeScript errors.** The second
step in a row where no dependency floor moved — only configuration did.

### Pre-flight, and how the three predicted caveats turned out

| Caveat raised before running | Outcome |
|---|---|
| **Node margin.** 20 wants `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0`; we run 22.12.0 **exactly** — one patch of headroom | ✅ No warning, no failure. Held |
| **`update-module-resolution`** will rewrite `moduleResolution: "node"` → `"bundler"`, which honours `exports` maps and could break the five deep imports into the core | ✅ Probed *before* running with a throwaway tsconfig: `tsc --noEmit` exit 0, zero diagnostics. Landed clean |
| **`remove-default-karma-config`** may delete both `karma.conf.js` files while `angular.json` still references them via `karmaConfig`, breaking `ng test` | ✅ Did not fire — "No changes made". The two configs are 44 lines but are *not* byte-identical to stock, so they were left alone |

Probing the `bundler` change beforehand was worth the five minutes: it turned the
riskiest migration in the step into a known quantity rather than something to
debug afterwards.

> **Correction to an earlier prediction.** At 17 and 19 this log said
> `moduleResolution: "node"` would most likely be forced by **TypeScript 6 at
> Angular 22**. Wrong on both the version and the mechanism: it is handled at
> **20**, automatically, by a CLI migration. Nothing had to be fixed by hand.

### Commands

```bash
npx ng update @angular/cli@20 @angular/core@20
```

### What it changed

| Package | 19 | 20 |
|---|---|---|
| `@angular/*` | 19.2.25 | 20.3.33 |
| `@angular/cli`, `build-angular` | 19.2.27 | 20.3.39 |
| `ng-packagr` | ^19.2.2 | ^20.3.2 |
| `typescript` | ~5.8.3 | **unchanged** (20 wants `>=5.8 <6.0`) |
| `zone.js` | ~0.15.1 | **unchanged** (`~0.15.0`) |

Two config files, no source:

- **`tsconfig.json`** — `moduleResolution: "node"` → `"bundler"`.
- **`angular.json`** — a `schematics` block was added by `previous-style-guide`,
  pinning the old file-naming convention (`foo.component.ts` rather than
  Angular 20's new `foo.ts`) for future `ng generate`. Affects generation only,
  nothing already in the repo.

### Automated migrations

All four `@angular/core` migrations were no-ops — `document-core` (no `DOCUMENT`
usage), `inject-flags` (no `InjectFlags`), `test-bed-get` (no `TestBed.get`),
and the SSR bootstrap one. Of the CLI's, two SSR migrations no-op'd and
`remove-default-karma-config` made no changes.

### Packaging: ng-packagr changed the dist layout again

Second time in the climb, after 16. Comparing the built output:

| Angular 19 | Angular 20 |
|---|---|
| `esm2022/`, `fesm2022/`, `lib/`, `index.d.ts`, `public-api.d.ts` | `fesm2022/`, `index.d.ts` |

So the unflattened `esm2022/` tree is gone, and the per-file `.d.ts` tree
(`lib/` + `public-api.d.ts`) is **flattened into a single 87-line
`index.d.ts`**.

Checked that the manifest still points at files that exist, since a dangling
pointer here would only surface for a consumer:

```json
"module":   "fesm2022/bloomscorp-ngx-bloomsight.mjs",   ✅ exists
"typings":  "index.d.ts",                               ✅ exists
"exports":  { ".": { "types": "./index.d.ts",
                     "default": "./fesm2022/bloomscorp-ngx-bloomsight.mjs" },
              "./package.json": { "default": "./package.json" } }
```

Self-consistent. Note the published package now carries an **`exports` map of
its own**, which deliberately exposes only the root — so consumers cannot deep
import *into* this library. That is the right outcome, and it is also exactly
the mechanism described below in reverse.

### P1 just got more serious — and the fix is now available

The published `index.d.ts` still leaks a deep import, on **line 3**:

```ts
import { IConfig } from '@bloomscorp/bloomsight.js/dist/configuration/interface/config';
```

Why 20 changes the stakes: from Angular 20 the CLI sets consumers to
`moduleResolution: "bundler"`, which resolves imports through `exports` maps.
That line is resolved by the **consumer's** TypeScript, against *their*
installed copy of the core. It works today only because the core ships no
`exports` map (verified for both 0.7.0 and 0.8.0). The day the core adds one —
an ordinary bit of modernisation — every consumer's build breaks inside **our**
`.d.ts`, not in their own code, which is a miserable error to diagnose.

The fix is to import `IConfig` from the core's package root. It is **not free**,
and the reason is worth recording precisely:

| Core version | Root exports `IConfig`? |
|---|---|
| **0.7.0** (currently installed; the peer floor) | ❌ root exports only `init`, `resolveSimpleEvent`, `resolveDataEvent`, `pageViewObserver`, `sendEmail` |
| **0.8.0** | ✅ `export type { IConfig } from "./configuration/interface/config";` — added by the B2 work |

So fixing P1 requires raising the core peer from `>=0.7.0 <1.0.0` to
`>=0.8.0 <1.0.0`. That is a justified bump rather than a cosmetic one, and it is
consistent with the migration plan, in which every project moves to `^0.8.0`
regardless. **Not done here** — it is a peer-contract change and belongs in its
own commit, with a decision behind it, not as a side effect of a version step.

### Compatibility floor

```
minVersion: "12.0.0"   (x14)
minVersion: "14.0.0"   (x2)
version:    "20.3.33"  (x16)
```

Unchanged through 20, despite the dist-layout change. `>=14.2.0 <23.0.0` holds.

### Verification

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ |
| `npm run build` (demo app) | ✅ 278.61 kB initial (was 274.69 kB) — the known CSS budget warning only |
| `ng test --watch=false --browsers=ChromeHeadless` | ✅ 3/3 and 5/5 — karma unaffected |
| `npm run check-version` | ✅ in sync at 1.6.0 |
| Library `peerDependencies` | ✅ `git diff` empty |
| `minVersion` | ✅ still 14.0.0 |
| Published manifest pointers | ✅ `module` and `typings` both resolve to files that exist |

---

## P1 fixed — deep imports removed, before going to 21

Done between 20 and 21 **by decision**, not as part of a version step, because
Angular 20 is what raised the stakes: consumers now default to
`moduleResolution: "bundler"`, which resolves through `exports` maps, and the
leaked deep import in our published `.d.ts` is resolved by the *consumer's*
compiler.

### The reframing that changed the fix

The first proposal was narrow — swap the deep import paths for root imports.
Reviewing the demo app produced a better question: **why would a consumer of
`ngx-bloomsight` ever import `bloomsight.js` at all?**

It turned out the demo app does *not* import the core — but only because it
imports `NgxBloomsightModule` without calling `forRoot()`, so it configures
nothing and exercises nothing (that is B6). The moment it did its job properly
it would have had to import the core, because **`IConfig` was not exported from
`public-api.ts`**. A wrapper that forces consumers to reach past it for a type
it requires is the actual defect; the deep imports were the visible half.

So the fix has two halves.

### Inward — the library stops reaching into `dist/`

| Site | Before | After |
|---|---|---|
| `internal/bloomsight-init.ts` | `…/dist/configuration/interface/config` | root |
| `ngx-bloomsight.module.ts` | same | now imports `BloomsightConfig` instead |
| `service/bloomsight-event.service.ts` | same | root |
| `service/bloomsight-mail.service.ts` | same | root |
| `service/bloomsight-mail.service.ts` | `…/dist/email/enums/emailEngineTypeEnum` | **import removed entirely** |

The fifth one is the interesting one. `EmailEngineTypeEnum` is **not exported
from the core's root in any published version**, so the earlier plan was to wait
for a core release. Unnecessary — the type can be read off the function that
needs it:

```ts
type CoreEmailEngineType = Parameters<typeof mail>[0];
```

`mail` is `sendEmail`, imported from the root. This needs no new import, no core
release, and cannot drift from the real signature the way a hand-copied type
would. **A core release is no longer a prerequisite for P1.**

### Outward — consumers never need the core

New `lib/type/bloomsight-config.ts`:

```ts
export type BloomsightConfig = IConfig;
```

Exported from `public-api.ts`, and `forRoot()` now declares
`BloomsightConfig` rather than `IConfig`, so the public signature references a
name this package owns.

It is an **alias, not a redeclaration**, on purpose: the core owns the shape,
this package owns the name. The core can restructure internals without touching
our public API, and the contract can be narrowed later without a breaking
rename. This mirrors the existing precedent in
`lib/type/bloomsight-email-engine.ts`, where `BloomsightEmailEngine` is declared
locally rather than re-exported.

### The peer floor moved, and why that is justified this time

```
"@bloomscorp/bloomsight.js": ">=0.7.0 <1.0.0"  →  ">=0.8.0 <1.0.0"
```

Only **0.8.0** exports `IConfig` from its root — 0.7.0's root exports just
`init`, `resolveSimpleEvent`, `resolveDataEvent`, `pageViewObserver` and
`sendEmail`. So the floor had to move for the root import to exist at all.

Worth contrasting with an earlier attempt in this project to raise the same
floor, which was reverted for having no justification behind it. This one has a
concrete cause, and it is consistent with the migration plan, where every
project moves to `^0.8.0` regardless.

The workspace was also moved to the installed 0.8.0, so local builds typecheck
against what the peer range now declares rather than against 0.7.0.

### Verification — the published artifact, not just the source

Source greps prove nothing about what ships. The check is the generated
`index.d.ts`:

| | Before | After |
|---|---|---|
| line 3 | `import { IConfig } from '@bloomscorp/bloomsight.js/dist/configuration/interface/config';` | `import { IConfig } from '@bloomscorp/bloomsight.js';` |
| exported types | `BloomsightEmailEngine` | `BloomsightConfig`, `BloomsightEmailEngine` |

Plus a regression guard. `ngx-bloomsight.module.spec.ts` imports **only** from
`../public-api` and types its config with `BloomsightConfig`, so it fails to
compile if the public surface ever loses the type again. Its third test asserts
that `forRoot()` provides both services — pinning **B6** down as an assertion
rather than a paragraph, so the 2.0.0 rewrite has to address it deliberately.

Library tests: **5 → 8**.

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ |
| `npm run build` (demo app) | ✅ 282.89 kB |
| `ng test` | ✅ 3/3 and 8/8 |
| `npm run check-version` | ✅ 1.6.0 |
| `minVersion` | ✅ still 14.0.0 |
| Deep imports in source | ✅ zero |
| Deep imports in published `.d.ts` | ✅ zero |

### Not done

- **The demo app is unchanged.** It does not import the core, so it needed no
  fix. It still imports `NgxBloomsightModule` without `forRoot()`, which stays
  as-is per the standing decision to leave the demo app until its rebuild.
- **P6 is still open** but **no longer blocks anything**: the wrapper no longer
  imports that enum at all. It is now core hygiene — fix the type-only
  declaration in `bloomsight.js` and export it from the root at the same time.

---

## 20 → 21 — ✅ done

**Result: no `--force`, no TypeScript errors, library source untouched.** Three
files changed, all in the demo app or workspace config.

### Pre-flight

| Expectation | Outcome |
|---|---|
| TypeScript 5.8.3 → 5.9 (`>=5.9 <6.0`) | ✅ 5.9.3 |
| zone.js stays (0.15.1 satisfies `~0.15.0 \|\| ~0.16.0`) | ✅ unchanged |
| `control-flow-migration` is **automatic** at 21, so it cannot be declined | ✅ ran, demo template only |
| `update-typescript-lib` will change `lib` | ⚠️ it **removed** `lib` rather than changing it — see below |
| `bootstrap-options-migration` will be a no-op | ❌ **wrong, it fired** — see below |

**Checked the blocker risk first.** The demo app's `main.ts` uses
`platformBrowserDynamic().bootstrapModule()`, and if
`@angular/platform-browser-dynamic` had been removed at 21 or 22, converting the
demo app to `bootstrapApplication` would have become mandatory — dragging in the
demo rework that is deliberately deferred. It is **deprecated but still
published at both 21 and 22**, so no forced rework exists anywhere in this climb.

### Commands

```bash
npx ng update @angular/cli@21 @angular/core@21
```

### What it changed

| Package | 20 | 21 |
|---|---|---|
| `@angular/*` | 20.3.33 | 21.2.25 |
| `@angular/cli`, `build-angular` | 20.3.39 | 21.2.26 |
| `ng-packagr` | ^20.3.2 | ^21.2.7 |
| **`typescript`** | ~5.8.3 | **~5.9.3** |
| `zone.js` | ~0.15.1 | unchanged |

### `lib` was removed, not updated

The migration is described as *"Updates the `lib` property … to use `es2022` or
a more modern version"*, but what it did was delete the property:

```diff
-    "lib": [
-      "es2020",
-      "dom"
-    ],
```

TypeScript now derives `lib` from `target: "ES2022"`, which resolves to
`lib.es2022.full` — ES2022 plus DOM, DOM.Iterable and ScriptHost. So the
available types are the same set or broader, never narrower, and the explicit
list was restating a default. Same shape of change as the `.browserslistrc`
deletion at 15: configuration that only repeated what the target already implied.

### `bootstrap-options-migration` fired — the interesting one

Predicted as a no-op because `main.ts` passes no bootstrap options. It fired
anyway:

```diff
-platformBrowserDynamic().bootstrapModule(AppModule)
+platformBrowserDynamic().bootstrapModule(AppModule,
+  { applicationProviders: [provideZoneChangeDetection()], })
```

The migration did not *move* an option — it **added** one. That is a signal
worth recording: **Angular 21 is shifting the default away from zone-based
change detection**, so an NgModule application now has to opt into it
explicitly to keep its current behaviour.

What it means for this library: nothing immediately. `BloomsightEventService`
subscribes to router `NavigationEnd` events, which fire under zoneless change
detection just as they do under zone-based, and the SDK calls it makes do not
depend on change detection at all. But it does mean **2.0.0 should be verified
under `provideExperimentalZonelessChangeDetection()`**, not just under zones —
added to the A3/A4 thinking in MODERNISATION.md rather than treated as a climb
issue.

### Control flow migrated automatically

`control-flow-migration` was optional at 17 and 20, and declined both times. At
21 it is automatic. It rewrote `src/app/app.component.html`:

- 5 × `*ngSwitchCase` and 1 × `*ngSwitchDefault` → `@switch` / `@case` /
  `@default`
- 313 insertions, 299 deletions — large because it reindented the whole
  template, not because much changed semantically
- zero `ngSwitch` references remain

Allowed to stand rather than reverted. It only touches the demo app's
scaffolding template, it is the framework's own tooling, and the file is
scheduled for rebuild. Same reasoning as the standalone flag at 19.

### Packaging: ng-packagr changed the layout a third time

After 16 and 20. This one moves the types and adds a field:

| Angular 20 | Angular 21 |
|---|---|
| `index.d.ts` at the root | `types/bloomscorp-ngx-bloomsight.d.ts` |
| — | **`"type": "module"`** in the generated `package.json` |

Verified both manifest pointers resolve to files that exist, since a dangling
one would only surface for a consumer:

```json
"module":  "fesm2022/bloomscorp-ngx-bloomsight.mjs",        ✅
"typings": "types/bloomscorp-ngx-bloomsight.d.ts",          ✅
"type":    "module"
```

`"type": "module"` declares the package ESM-only. That is consistent with what
it actually ships — a single `.mjs` bundle and nothing CommonJS — so it is a
correction rather than a change in kind. Worth knowing because the file to grep
for the P1 facade check **moved**: it is no longer `index.d.ts`.

### The facade held

Checked in the new location, because the P1 fix is only as good as the artifact:

```ts
import { IConfig, IBloomsightError } from '@bloomscorp/bloomsight.js';
export type { BloomsightConfig, BloomsightEmailEngine, BloomsightError };
```

Root import, both aliases exported. No `dist/` path.

### Verification

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ |
| `npm run build` (demo app) | ✅ 285.40 kB (was 282.89 kB) — known CSS warning only |
| `ng test` | ✅ 3/3 and 9/9 |
| `npm run check-version` | ✅ 1.6.0 |
| Library source | ✅ untouched |
| Library `peerDependencies` | ✅ unchanged |
| `minVersion` | ✅ still 14.0.0 |
| Published manifest pointers | ✅ both resolve |
| P1 facade in published types | ✅ root import only |

---

## 21 → 22 — ✅ done, and the only step that needed hand fixes

**Result: no `--force`, but the first and only step requiring manual
intervention — two TypeScript 6 errors, and one self-inflicted breakage.**

### Node moved first, as its own commit

Angular 22 requires `^22.22.3 || ^24.15.0 || >=26.0.0`; the workspace ran
22.12.0. `.node-version` was pinned to **v24.18.0** in `f648801`, and
**Angular 21 was verified green on Node 24 before Angular was touched** —
build-lib ✅, tests 3/3 and 9/9 — so that any 22 failure could not be
confused with a Node problem. It paid off: the failures that followed were
unambiguously TypeScript's.

The global `fnm` default was deliberately left at 22.12.0. This is a repo-level
pin; other projects on the machine are unaffected.

### What it changed

| Package | 21 | 22 |
|---|---|---|
| `@angular/*` | 21.2.25 | 22.2.2 |
| `@angular/cli`, `build-angular` | 21.2.26 | 22.2.2 |
| `ng-packagr` | ^21.2.7 | ^22.2.4 |
| **`typescript`** | ~5.9.3 | **~6.0.3** |
| `zone.js` | ~0.15.1 | unchanged |
| `istanbul-lib-instrument` | — | ^6.0.3 (added by `add-istanbul-instrumenter` for Karma coverage) |

### TypeScript 6 errors, and the organic fixes

Two hard errors on the first build — the only TypeScript errors in the whole
climb:

```
error TS5101: Option 'baseUrl' is deprecated and will stop functioning in
              TypeScript 7.0. Specify compilerOption '"ignoreDeprecations": "6.0"'
              to silence this error.
error TS5101: Option 'downlevelIteration' is deprecated and will stop functioning
              in TypeScript 7.0. …
```

`ignoreDeprecations` was available and deliberately **not** used — it only
defers the same failure to TypeScript 7. Both were resolved by removing the
options:

| Option | Why removing it is correct |
|---|---|
| `downlevelIteration` | Only affects ES5/ES3 targets. At `target: ES2022` it is inert — genuinely dead configuration |
| `baseUrl: "./"` | Existed only to anchor `paths`, and since TypeScript 4.1 `paths` resolves relative to the tsconfig itself. The mapping was made relative (`./dist/...`) instead |

### The self-inflicted part — worth recording honestly

Removing `baseUrl` **broke the demo app build**:

```
public-api.ts is missing from the TypeScript compilation.
src/app/app.component.html:498:1 - error NG8001: 'router-outlet' is not a known element
```

The second error was cascading from the first. The cause: the demo app imported
the library as
`'projects/bloomscorp/ngx-bloomsight/src/public-api'` — a **non-relative**
specifier, which only resolved *because* of `baseUrl`. Without it, TypeScript
treats that as a package name and fails.

So `baseUrl` was **not** dead configuration, contrary to the assessment above.
`downlevelIteration` was; `baseUrl` had a real dependent that nothing in the
tsconfig made visible.

Fixed by making the demo app's import relative
(`../../projects/bloomscorp/ngx-bloomsight/src/public-api`), which preserves the
existing behaviour exactly. The *proper* fix is **T2** — the demo app should
import `@bloomscorp/ngx-bloomsight` and consume the built package, which is what
the `paths` mapping already points at. That was not done here because
`npm run build` does not chain `build-lib`, so it would require a build-order
change and would break a clean checkout. It belongs with the demo app rebuild.

**Lesson for the 2.0.0 work:** a non-relative import into another project's
source is invisible coupling to `baseUrl`. Worth grepping for before touching
path configuration again.

### `ChangeDetectionStrategy.Eager` — the prediction that was wrong

> **⚠️ Correction, 2026-10-15 — the conclusion below is wrong.** Code review
> found, and Angular 19.2.25's real linker confirmed, that the published bundle
> refers to `ChangeDetectionStrategy.Eager` **by name**. Linkers before Angular
> 22 have no `Eager` and fail with *"Unsupported change detection strategy"*, so
> every Angular 19–21 app would have failed to build against this package.
> `minVersion` did not catch it, because it records the declaration format, not
> the enum members the declarations use. **`minVersion` is not a compatibility
> floor.** It was treated as one for this whole log, and it was not.
>
> Fixed by removing `changeDetection` from the published component, and guarded
> by `npm run verify:compat`, which links and type-checks the packed library
> with the real compiler of every Angular major in the peer range. That is the
> evidence the peer range now rests on. See RELEASE-2.0.0.md §5a, RV1.
>
> The original analysis is kept below unedited, since it shows exactly how the
> reasoning went wrong.

`change-detection-eager` added `changeDetection: ChangeDetectionStrategy.Eager`
to both components and the spec's host component. The concern raised beforehand:
`Eager` is new in 22, so it would land in the published partial declarations and
push `minVersion` from 14.0.0 to 22.0.0, invalidating the
`>=14.2.0 <23.0.0` peer range. The agreed plan was to withhold it from the
library component if so.

**It did not happen, and no action was needed.** From Angular 22's own enum:

```ts
OnPush  = 0,
Eager   = 1,
Default = 1   // @deprecated Use `Eager` instead.
```

`Eager` is a **rename of `Default`**, numerically identical. The declaration
emits `changeDetection: 1` — exactly what `Default` emitted — so every older
linker reads it unchanged. `minVersion` stayed at 14.0.0.

The real change behind this migration is that **Angular 22 makes `OnPush` the
default strategy** ("NOTE: OnPush is enabled by default"), and the migration adds
`Eager` to preserve pre-22 CheckAlways behaviour. For 2.0.0 the `Eager` flag
should simply be dropped: the component is deleted, and anything new should take
the OnPush default rather than opt out of it.

### Diagnostics that were suppressed, not fixed

`strict-safe-navigation-narrow` added this to **five** tsconfigs
(`tsconfig.app.json`, `tsconfig.spec.json`, and the library's `lib`, `lib.prod`
and `spec`):

```json
"angularCompilerOptions": {
  "extendedDiagnostics": {
    "checks": {
      "nullishCoalescingNotNullable": "suppress",
      "optionalChainNotNullable": "suppress"
    }
  }
}
```

Angular 22 enables these two template diagnostics by default; the migration
suppresses them to preserve pre-22 behaviour. **This is an opt-out of new strict
checking, and it is worth reversing deliberately** — remove the suppressions and
fix whatever they surface. Deferred to 2.0.0 rather than done mid-step, and
logged here so it is not mistaken for intended configuration.

### Other migrations

`strict-templates-default` was a no-op (`strictTemplates: true` was already set).
`safe-optional-chaining` was a no-op (no optional chaining in templates).
`http-xhr-backend`, `incremental-hydration`, `model-output`,
`can-match-snapshot-required`, `trust-proxy-headers` and `update-workspace-config`
all no-ops.

### Verification

| Check | Result |
|---|---|
| `npm run build-lib` | ✅ on TypeScript 6.0.3 |
| `npm run build` (demo app) | ✅ 289.06 kB (was 285.40 kB) — known CSS warning only |
| `ng test` | ✅ 3/3 and 9/9 |
| `npm run check-version` | ✅ 1.6.0 |
| Library `peerDependencies` | ✅ unchanged |
| **`minVersion`** | ✅ **still 14.0.0** |
| P1 facade in published types | ✅ root import only |
| Node | ✅ v24.18.0 |

---

## Karma → Vitest — attempted at 22, blocked, deferred

Decided to take it (rather than decline as with the other optional migrations),
then ran it and found it **cannot run here yet**:

```
Project "ngx-bloomsight" cannot be migrated to Vitest yet. The project must
first be migrated to use the "@angular/build:application" builder.

Projects migrated: 0
Projects skipped (non-applications): 1
  - @bloomscorp/ngx-bloomsight
Projects skipped (missing application builder): 1
  - ngx-bloomsight
```

Two separate blockers, and the second is the more important one:

1. **The demo app** needs the `@angular/build:application` builder first — the
   `use-application-builder` migration declined at every step from 17 to 22.
2. **The library is skipped entirely, as a "non-application".** The CLI's Vitest
   migration only handles application projects, so it will **never** migrate the
   library's tests no matter what else changes.

Since **9 of the 12 tests live in the library**, taking this migration would
have moved only the demo app's 3 and left two test runners in one workspace —
while rewriting the build config of an app that is scheduled for replacement.

**Deferred by decision** to the demo app rebuild, where the application builder
is wanted anyway. No changes were made; the tree was clean afterwards. Karma
remains fully supported on 22 (the `karma` builder is present in build-angular
20, 21 and 22), so nothing is at risk, and it stays the safety net through the
2.0.0 rewrite.

**Recorded for whoever picks up A7:** getting the *library* off Karma is not a
migration, it is bespoke configuration. The CLI will not do it.

---

## The climb is complete — 14.3.0 → 22.2.2

Nine majors, nine commits, **no `--force` at any step**.

| | |
|---|---|
| Angular | 14.3.0 → **22.2.2** |
| TypeScript | 4.7.2 → **6.0.3** |
| zone.js | 0.11.4 → **0.15.1** |
| Node | 22.12.0 (pin said v20) → **24.18.0** |
| ng-packagr | ^14.2.0 → **^22.2.4** |
| Library tests | 2 → **9** |
| `minVersion` (compatibility floor) | 14.0.0 → **14.0.0**, unmoved |

**Steps that required nothing but `ng update`:** 14→15, 15→16, 16→17, 17→18,
19→20, 20→21.
**Steps that changed source:** 18→19 (standalone flag, then adopted properly),
21→22 (change detection, and the import fix).
**Steps with TypeScript errors:** 21→22 only.

What carried the whole thing: committing before every `ng update`, reading the
schematic collections directly instead of trusting the console, probing risky
migrations with a throwaway tsconfig beforehand, and tracking `minVersion` in the
built artifact rather than assuming the peer range still held.

---

## After the climb — the deferred migrations, taken

Two items deferred throughout the climb were taken deliberately on
2026-10-15, during the 2.0.0 work:

| Deferred migration | Outcome |
|---|---|
| `use-application-builder` (offered at every step, 17 to 22) | Applied. It was needed because Vitest's builder only drives `application` and `ng-packagr` builds. It also removed `@angular-devkit/build-angular` from the workspace |
| Karma → Vitest (`migrate-karma-to-vitest`, offered at 22) | Done by configuring `@angular/build:unit-test` directly. The schematic refuses library projects, but the builder handles them |

Zone.js went too: the Vitest builder's setup uses top-level `await`, which
Angular does not allow alongside Zone.js, so the demo app became zoneless
(decision D6 in RELEASE-2.0.0.md). The details are in RELEASE-2.0.0.md §1
Phase 3 and §4.
