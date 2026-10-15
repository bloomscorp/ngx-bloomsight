# `ngx-bloomsight` 2.0.0 — release checklist

> **Status: proposed, not started.** This is the plan for review before any work
> begins.
>
> Scope: resolve every item flagged in [MODERNISATION.md](./MODERNISATION.md),
> rewrite the public API, rewrite the demo app from scratch, replace Karma with
> Vitest, and remove everything dangling — using Angular 22 idioms throughout.
>
> Context: [UPGRADE-LOG.md](./UPGRADE-LOG.md) (the 14 → 22 climb, now complete).

## ▶ Current status

> **Live tracker.** Updated and committed as each task lands.
>
> **Now:** §1 Phase 3, task 3.11. Sweeping for leftover Karma, Jasmine and Zone references.
>
> **Done so far:** decisions (§0) · core P6 fix · Vitest trial run ·
> `bmx-pastebox@1.1.0` released · `bloomsight.js@0.9.2` released
>
> Legend: ✅ done · 🔄 in progress · ⬜ not started · ⛔ blocked

---

## 0. Decisions — settled 2026-10-12

| # | Decision | Outcome |
|---|---|---|
| **D1** | Version number | **`2.0.0`** — nothing shipped between 1.6.0 and now, so no phantom versions |
| **D2** | Angular peer range | **`>=19.0.0 <23.0.0`** — the true technical minimum for the APIs the rewrite needs. *Not* the wide range, which cannot be honoured, and not `>=22` either. **See §0.1 — this choice carries two obligations** |
| **D3** | Core peer range | **`>=0.9.0 <1.0.0`**, following D4 |
| **D4** | Fix P6 in the core | **Yes — release `bloomsight.js` 0.9.0 first.** Verified: `emailEngineTypeEnum.d.ts` exists with no `.js`, so importing it as a value yields `undefined` and silently routes mail to SMTP |
| **D5** | Demo app safety | **Default `logOnly: true`** with a visible toggle, so clicking a demo button cannot write to production analytics |
| **D6** | Zone or zoneless demo | **Zoneless** — the direction of travel, and it proves something we currently cannot claim. The library's own tests cover both modes |
| **D7** | Keep `NgxBloomsightModule`? | **Delete outright.** Keeping `forRoot()` alive would preserve B6 and B7 — the bugs the rewrite exists to remove |

### 0.1 What `>=19.0.0` obliges us to do

Choosing the true minimum rather than the tested one is only honest if two things
follow. Both are now mandatory tasks, not nice-to-haves — the alternative is
repeating exactly the untested-range problem this project has criticised twice.

**Obligation 1 — the library is capped at Angular 19 APIs.**

> This is in direct tension with "use the latest and greatest Angular 22
> features", so the line has to be drawn explicitly:
>
> | | API ceiling |
> |---|---|
> | **The library** (published) | **Angular 19 and older only** |
> | **The demo app** (not published) | **Anything Angular 22 offers** |
>
> Available under the cap and used by the rewrite: `inject()` (14),
> `makeEnvironmentProviders` (15), `takeUntilDestroyed` / `DestroyRef` (16),
> signals (16), `provideAppInitializer` (19).
>
> **Forbidden in the library:** anything introduced in 20, 21 or 22, and
> anything still experimental at 19. Every new library API must be checked
> against "when did this land" before use. A single Angular 20+ API makes the
> declared range false.

**Obligation 2 — compatibility must be proven, not declared.**

> Build the published tarball into a **real Angular 19 application** and compile
> it. This is the check that was never done for the old `>=14.2.0` claim, which
> is precisely why that claim stayed a liability for nine majors. Added to §8.
>
> `minVersion` in the built artifact must also come out **≤ 19.0.0**. It is the
> compiler's own statement of the floor and the only non-negotiable evidence.

## 1. Dependency release chain — do these in order

Three repositories, and the order is forced: each step's output is the next
step's input. Nothing in §2–§7 can finish until phase 3 lands.

**Why there is a chain at all.** `bmx-pastebox` ships ESM syntax in `.js` files
with no `"type": "module"`, and its relative imports are extensionless. Node
rejects it in both module systems; only lenient bundlers like webpack load it.
`bloomsight.js` depends on it and does **not** bundle it
(`skipNodeModulesBundle: true`), so it inherits the fault, and `ngx-bloomsight`
inherits it in turn — which is what makes Vitest fail.

### Current state

| | version | published | state |
|---|---|---|---|
| `bmx-pastebox` | 1.0.17 | 1.0.17 | fixed on `master`, **1 commit unpushed** |
| `@bloomscorp/bloomsight.js` | 0.9.1 | 0.9.1 | published, still depends on `bmx-pastebox@^1.0.14` |
| `ngx-bloomsight` | 1.6.0 | 1.6.0 | on `feat/2.0.0`, core peer `>=0.8.0`, still on Karma |

> **`0.9.1` is fine for browser and bundler consumers** — the 15 customer sites,
> Angular app builds and the CDN `umd/` files all work. It is broken only for
> Node consumers: SSR, scripts, and native-ESM tooling such as Vitest.

---

### Phase 1 — release `bmx-pastebox` — ✅ done 2026-10-15

> **Outcome.** `bmx-pastebox@1.1.0` is `latest` with provenance, published
> through a validated trusted publisher. Its first CI run passed every gate.
> The published tarball installs cleanly and loads by package name via both
> `require` and `import`.

Code is done and committed (`e742f20`). What remains is publishing it.

- [ ] **You:** configure an npm **trusted publisher** for `bmx-pastebox` —
      npmjs.com → the package → Settings → Trusted Publishers → repository
      `bloomscorp/bmx-pastebox`, workflow `release.yml`. **Blocking:** the
      release workflow has no token and cannot publish without this
- [ ] Push `master` (1 commit)
- [ ] Confirm `ci.yml` goes green on the push — this is the repo's first CI run
      ever, so expect to iron out something
- [ ] `npm run release` → choose **minor → 1.1.0**. The packaging change is too
      substantial for a patch: the module format, entry points and `exports` map
      all changed
- [ ] Confirm `1.1.0` is on npm
- [ ] Verify the **published tarball**, not the local build:
      `npm pack bmx-pastebox@1.1.0`, then `require()` **and** `import` it by
      package name. This is the exact failure mode that shipped 17 times

Note: the git/npm version drift is already resolved — `package.json` said 1.0.15
in git while npm served 1.0.17; the committed file now says 1.0.17.

---

### Phase 2 — bump and release `bloomsight.js` — ✅ done 2026-10-15

> **Outcome.** `@bloomscorp/bloomsight.js@0.9.2` is `latest` with provenance,
> depending on `bmx-pastebox@^1.1.0`. The new `verify:package` gate passed on
> its first CI run. The published tarball (13 files) installs into a clean
> project and loads via both `require` and `import`. 0.9.1 could do neither.

- [ ] Push the 1 unpushed commit (`1a9ec3e`, the export-gate ordering fix)
- [ ] Bump the dependency to `bmx-pastebox: ^1.1.0`
- [ ] **Add the gate whose absence let 0.9.1 ship broken.** None of this repo's
      checks ever load the built package through Node:
      `lint` typechecks, the tests run from `src/` under Vitest **browser** mode
      (where Vite pre-bundles deps with esbuild and tolerates the bad imports),
      `build`/`bundle` only compile, and `verify:exports` is static **by
      design** — it was written that way *because* loading `dist/` failed on
      `bmx-pastebox`, treating the symptom as an obstacle instead of a finding.
      Copy `scripts/verify-package.js` from `bmx-pastebox`: it loads the built
      artifact by package name in CJS and ESM, and would have blocked 0.9.1
- [ ] Wire that gate into `before:init`, `ci.yml` and `release.yml`, **after**
      `bundle` (ordering matters — see the 0.9.0 post-mortem in this repo's log)
- [ ] Confirm a Node consumer can now load it:
      `npm install @bloomscorp/bloomsight.js` in a scratch dir, then `require`
      and `import`
- [ ] `npm run release` → **patch → 0.9.2**. No API change, only a dependency
      fix
- [ ] Verify the published tarball loads in Node

---

### Phase 3 — Vitest in, Karma out — 🔄 in progress

All local, on `feat/2.0.0`. Nothing is pushed or published in this phase.

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Bump the workspace's core dependency `^0.8.0` → `^0.9.2` | ✅ | Installed 0.9.2, which pulls in bmx-pastebox 1.1.0 |
| 3.2 | Raise the library peer `>=0.8.0` → `>=0.9.2 <1.0.0` (**D3**) | ✅ | 0.9.2 is the first core a Node consumer, such as Vitest, can load |
| 3.3 | Baseline: build-lib, demo build and **Karma** tests all green on 0.9.2 | ✅ | Green on 0.9.2: build-lib, demo build 289.14 kB, Karma 3/3 and 9/9 |
| 3.4 | Library `test` target → `@angular/build:unit-test`, `runner: vitest` | ✅ | Spec tsconfig now uses vitest/globals types and no Karma bootstrap |
| 3.5 | Convert Jasmine-only matchers | ✅ | toBeTrue() → toBe(true); the compiler caught it, as Vitest's Assertion type lacks it |
| 3.6 | All library tests green under Vitest | ✅ | 9/9. One fix along the way: a test compared class names as strings, and esbuild renames decorated classes, so it now compares the classes themselves |
| 3.7 | Demo app `build` → `@angular/build:application`, via the official `use-application-builder` migration (**A6**) | ✅ | Done with the official migration. It also removed @angular-devkit/build-angular entirely. Output moved to dist/ngx-bloomsight/browser |
| 3.8 | Demo app `test` target → Vitest, tests green | ✅ | 3/3. Needed two demo changes: zoneless (D6), since the builder's setup uses top-level await which Zone.js forbids, and a standalone AppComponent. Bundle 291.56 → 253.94 kB; verified booting in headless Chrome |
| 3.9 | Remove Karma: `karma`, `karma-*`, `jasmine-core`, `@types/jasmine`, `istanbul-lib-instrument`; both `karma.conf.js`; both `src/test.ts`; Jasmine types in the spec tsconfigs | ✅ | Removed 9 packages, including zone.js (an optional peer, now unused), both karma.conf.js and both src/test.ts. Everything still green |
| 3.10 | Coverage reporting under Vitest | ✅ | npm run test:coverage, v8 provider. Library baseline: 52% statements, 33% functions (T1, measured). Thresholds deliberately deferred to §5: set now, they would lock the bar at the known gap |
| 3.11 | Sweep: no Karma or Jasmine references outside historical logs | 🔄 |  |
| 3.12 | Close out the docs: §4 here, **A6** and **A7** in MODERNISATION.md | ⬜ | |

After Phase 3: §5 real tests, §2 API rewrite, §3 demo app, §6 CI and release,
§7 docs.

## 2. Library — the 2.0.0 API

### 2.1 New surface

- [ ] `BLOOMSIGHT_CONFIG` as a real `InjectionToken<BloomsightConfig>` — **P3**,
      replacing the `'bloomsightConfig'` string token
- [ ] `provideBloomsight(config)` returning `EnvironmentProviders` via
      `makeEnvironmentProviders` — root-scoped by construction, **B6**
- [ ] Initialisation through `provideAppInitializer`, not a constructor side
      effect — **B1, B7, B8** dissolve together
- [ ] One root `BloomsightService`, replacing `BloomsightEventService` +
      `BloomsightMailService`
- [ ] `track(token, label?)` / `trackData(token, data, label?)`
- [ ] `sendMail({ engineId, templateId, data, engine? })` returning an
      `Observable` — **P4**, replacing seven positional arguments and
      success/error callbacks
- [ ] Decide whether `templateOwnerId` is genuinely internal and can be dropped
      from the public signature, or must stay
- [ ] `errors$` surfacing the core's `onError`, plus an `errors` signal if it
      earns its place — **A8**
- [ ] Page views: `urlAfterRedirects`, `takeUntilDestroyed(inject(DestroyRef))`
      — **B3, B4**
- [ ] Page views self-disable with **one** warning under `target: 'blooms-ai'`
      (no page-view endpoint there)
- [ ] `isPlatformBrowser` guard so `init()` does not run during server render —
      **A3**
- [ ] `inject()` throughout — run `ng generate @angular/core:inject-migration`
      **after** the scaffolding is deleted

### 2.2 Deletions

- [ ] `NgxBloomsightComponent` — CLI scaffolding, renders *"ngx-bloomsight
      works!"* — **P2**
- [ ] `NgxBloomsightService` — empty class — **P2**
- [ ] `NgxBloomsightModule` and `forRoot()` — per **D7**
- [ ] `internal/bloomsight-init.ts` — the `initOnce` guard becomes unnecessary
      once an app initializer owns initialisation
- [ ] `changeDetection: ChangeDetectionStrategy.Eager` flags — added by the 22
      migration only to preserve pre-22 behaviour; new code should take the
      OnPush default
- [ ] The `extendedDiagnostics` suppressions
      (`nullishCoalescingNotNullable`, `optionalChainNotNullable`) that the 22
      migration wrote into **five** tsconfigs — remove them and fix whatever
      they surface. This is an opt-out of new strict checking, not intended
      configuration

### 2.3 Invariants to preserve

- [ ] **The facade rule** — nothing in a consuming app imports
      `@bloomscorp/bloomsight.js`. Keep `BloomsightConfig`, `BloomsightError`
      and `BloomsightEmailEngine` exported, and keep the test that imports only
      from the public API
- [ ] Public signatures reference **our** type names, never the core's
- [ ] No deep imports into the core, in source **or** in the published types

---

## 3. Demo app — complete rewrite

Deleted and rebuilt. It currently proves nothing: it imports the module without
`forRoot()`, so it configures nothing, and it imports the library by source path
so it never exercises the published artifact.

### 3.1 Structure

- [ ] `bootstrapApplication`, no `AppModule`, no `app-routing.module.ts`
- [ ] Standalone components throughout, `inject()`, signals for state
- [ ] `@if` / `@for` / `@switch` only — no `*ngIf` / `*ngFor` / `*ngSwitch`
- [ ] Delete the stock Angular welcome page — **this also removes the CSS budget
      warning at its source** rather than raising the budget
- [ ] Drop `src/polyfills.ts`, `src/test.ts` and `src/environments/*` if Angular
      22 no longer needs them
- [ ] Zoneless per **D6**
- [ ] **Consume the built package by name** (`@bloomscorp/ngx-bloomsight`), not
      by source path — **T2**. Requires `build-lib` to run before `build`;
      wire that into the scripts so a clean checkout works

### 3.2 Every feature exercised

The point of the rewrite: each of these needs a visible, clickable surface.

| Feature | What the demo must show |
|---|---|
| Configuration | `provideBloomsight()` with every field: `propertyToken`, `isDevelopmentMode`, `target`, `apiBase`, `debug`, `onError`, `logOnly`, `stopAll`, `stopSimpleEvent`, `stopDataEvent`, `stopPageViewEvent` |
| Simple events | `track(token, label?)` with and without a label |
| Data events | `trackData(token, data, label?)` with a non-trivial payload |
| Page views | Multi-route navigation, **including a redirecting route**, so `urlAfterRedirects` is visibly correct |
| Page-view dedupe | Two different requested URLs resolving to one destination must log **one** page view |
| Email — GMAIL | `sendMail` with the GMAIL engine |
| Email — CUSTOM_SMTP | the other engine, proving the string values reach the core correctly (**P6** in practice) |
| Email is B1-only | Visibly documented: email always goes to the standalone server regardless of `target` |
| B1 ↔ B2 switch | Toggle `target` between `bloomsight` and `blooms-ai` and show where events go |
| `apiBase` override | Point B2 at a staging host |
| Error surface | `errors$` rendered in the UI, so failures are observable rather than silent |
| Debug mode | `debug: true` output |
| Kill switches | `stopAll` / per-event stops demonstrably suppressing |
| **Lazy route** | A lazy-loaded feature that uses the service — proves **B7** is gone |
| **Mail without events** | A component that injects the service and only sends mail — proves **B6** is gone |
| **No core import** | The whole app compiles with zero imports of `@bloomscorp/bloomsight.js` — the facade rule, demonstrated |

---

## 4. Vitest in, Karma out — 🟡 spike done, blocked on one dependency

**The spike's question is answered: `@angular/build:unit-test` does drive a
library project.** The `migrate-karma-to-vitest` schematic's refusal
("skipped — non-application") is a limitation of the *schematic*, not the
builder. Wired by hand into `angular.json`, Vitest 4.1.11 ran, discovered all
three spec files and executed them.

- [x] Spike: `@angular/build:unit-test` with `runner: vitest` on the library
- [x] Install `@angular/build`, `vitest`, `jsdom` (the builder requires a DOM
      environment and names `jsdom` or `happy-dom`)
- [x] **Library build target moved to `@angular/build:ng-packagr`.** The
      unit-test builder warns that `@angular-devkit/build-angular:ng-packagr`
      "is not supported"; the `@angular/build` equivalent is. Verified the
      library still builds, and the warning is gone. Kept — it is a clean
      improvement regardless of the runner
- [ ] **Blocked until phase 3 of §1.** Then flip the test target
- [ ] Remove `karma`, `karma-*`, `jasmine-core`, `@types/jasmine`,
      `istanbul-lib-instrument`; delete both `karma.conf.js` and both
      `src/test.ts`
- [ ] Coverage thresholds
- [ ] Adopt `@angular/build:application` for the demo app (**A6**)

### The blocker — and it is ours

Two of the three suites fail, and not because of the builder or the library:

```
Error: Cannot find module '…/node_modules/bmx-pastebox/dist/pastebox'
       imported from …/node_modules/bmx-pastebox/dist/index.js
```

`bmx-pastebox@1.0.14` is a **Bloomscorp package** (authored
`debabrata@bloomscorp.com`) and a transitive dependency of
`@bloomscorp/bloomsight.js`. It is malformed:

- `main` is `dist/index.js`, whose entire content is
  `export * from './pastebox';`
- that is **ESM syntax** in a package with **no `"type": "module"`**, no
  `exports` map and no `module` field
- and the specifier is **extensionless**, which is invalid ESM

Webpack tolerated both, which is why Karma never complained for years. Vite and
Node do not. Any consumer on native-ESM tooling hits this today — it is not a
test-only problem, it was merely invisible until something stopped being lenient.

**Tried and rejected:** `test.server.deps.inline` in a `runnerConfig` vitest
config. Resolution fails before Vite can transform the package, so the
workaround does not help. Removed rather than left in place looking like it does.

**The right fix is to delete the dependency.** `bloomsight.js` imports exactly
**one** function from it — `isEmptyString`, in `src/transmission/transmission.ts`
— and it is a two-line predicate:

```js
export function isEmptyString(str) {
	return valueExists(str) && (str.trim() === '' || str.trim().length === 0);
}
```

Inlining that removes a runtime dependency from a browser SDK and fixes the
hazard for **every** consumer rather than papering over it for one test run.
Needs a core patch release after 0.9.0.

Until then the library stays on Karma, so the branch is green at every commit.

## 5. Tests — close T1 properly

Currently 9 tests, none of which exercise the **behaviour** of the two real
services. That is the gap, and it matters because these tests are the safety net
for everything above.

- [ ] Mock the core (`vi.mock('@bloomscorp/bloomsight.js')`) so service behaviour
      is testable at all — this is what blocked T1 before
- [ ] `init()` runs **exactly once** with the service injected many times, and
      from multiple injectors — **B1, B7**
- [ ] `init()` does **not** run on the server — **A3**
- [ ] Page views: fires on `NavigationEnd`, uses `urlAfterRedirects`, dedupes
      identical destinations, and **unsubscribes on destroy** — **B3, B4**
- [ ] Page views no-op with exactly one warning under `target: 'blooms-ai'`
- [ ] `sendMail` maps its object argument to the core's positional signature
      correctly, including engine string values
- [ ] `sendMail` Observable completes on success and errors on failure
- [ ] `errors$` emits what the core's `onError` reports
- [ ] Lazy-loaded providers do not re-initialise — **B7**
- [ ] Public API completeness guard retained (the P1 regression test)
- [ ] Demo app has its own tests, including a route-navigation page-view test
- [ ] Zoneless test run — **D6**

---

## 6. CI and release pipeline — T3, R1–R4

Mirror what `bloomsight.js` ended up with; it has already been through this.

- [ ] `.github/workflows/ci.yml` — Node 24, `build-lib`, demo build, tests,
      `check-version`, packaging gate. **T3** (nothing runs on push today)
- [ ] `.github/workflows/release.yml` — npm **trusted publishing** (OIDC, no
      stored token), GitHub release
- [ ] **Packaging gate** asserting, on the real tarball: expected files present,
      `module`/`typings` pointers resolve, **zero deep imports in the published
      types**, `minVersion` as expected, peer ranges as declared
- [ ] Fix `.release-it.json` — **R2** (`npm.publish: false` with
      `github.release: true` and no token = half-finished releases), **R3**
      (`requireCleanWorkingDir: false` plus `git add --all` sweeps unrelated work
      into the release commit)
- [ ] Keep the `sync-version` hook — **B5/R4**, the published version must be the
      tagged version
- [ ] `.node-version` (v24.18.0) respected in CI

---

## 7. Docs and consumer migration

- [ ] README rewritten for the new API — `provideBloomsight()`, the service,
      `errors$`, the facade rule
- [ ] **Migration guide 1.x → 2.0.0**, consumer-facing: `forRoot()` →
      `provideBloomsight()`, two services → one, `sendMail` positional → object,
      the Angular 22 floor, and the bloomsight.js floor
- [ ] MODERNISATION.md items closed out with outcomes, not just ticks
- [ ] Note in the migration plan docs that an Angular project cutting over to B2
      now does it through `provideBloomsight({ target: 'blooms-ai' })`

---

## 8. Final verification gate

- [ ] Every B/P/A/T/R item in MODERNISATION.md either ✅ or explicitly deferred
      with a reason
- [ ] **`minVersion` in the built artifact is ≤ 19.0.0** — the compiler's own
      statement of the floor, and the only hard evidence that
      `>=19.0.0 <23.0.0` is true
- [ ] **The published tarball installs and compiles in a real Angular 19 app.**
      Mandatory per §0.1, obligation 2 — a declared range that has never been
      exercised is the liability this project already carried for nine majors
- [ ] The same tarball compiles in an Angular 22 app
- [ ] No library source uses an API newer than Angular 19 — §0.1, obligation 1
- [ ] Published types contain no `dist/` path
- [ ] Demo app builds against the **published tarball**, not source
- [ ] Full test suite green under Vitest, in both zoneless and zone modes
- [ ] No Karma, no Jasmine, no `*ngIf`, no `NgModule` anywhere
- [ ] Tarball inspected by hand once before publishing

## 9. Suggested order

1. ~~D1–D7 answered~~ ✅ settled 2026-10-12 (§0)
2. ~~Core P6 fix~~ ✅ released as `bloomsight.js@0.9.1` — 12 files, 0 orphan
   declarations, enum present at runtime, verified against the published tarball
3. ~~Vitest spike~~ ✅ `@angular/build:unit-test` drives a library project
4. **§1 phase 1** — release `bmx-pastebox` 1.1.0 ← *needs the npm trusted
   publisher from you*
5. **§1 phase 2** — bump and release `bloomsight.js` 0.9.2, with the
   consumer-load gate added
6. **§1 phase 3** — bump the peer here, flip to Vitest, finish §4
7. §5 real tests → §2 API rewrite → §3 demo app → §6 CI and release → §7 docs
8. Verification gate (§8), then publish 2.0.0
