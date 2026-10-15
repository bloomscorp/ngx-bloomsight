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
> **Now:** §5a, review fixes. RV1–RV4 are done; RV5–RV9 next (test quality and config).
>
> **Done so far:** decisions (§0) · core P6 fix · Vitest trial run ·
> `bmx-pastebox@1.1.0` released · `bloomsight.js@0.9.2` released ·
> **Vitest in, Karma and Zone.js out** (§1 Phase 3, §4) ·
> **both services under test, library at 100% coverage** (§5)
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

### Phase 3 — Vitest in, Karma out — ✅ done 2026-10-15

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
| 3.11 | Sweep: no Karma or Jasmine references outside historical logs | ✅ | Clean, and none left in the lockfile. Removed a stale tip in environment.ts pointing at the deleted zone.js. One intentional history comment kept |
| 3.12 | Close out the docs: §4 here, **A6** and **A7** in MODERNISATION.md | ✅ | §4 here, A6 and A7 in MODERNISATION.md, and an 'after the climb' section in UPGRADE-LOG.md |

After Phase 3: §5 real tests, §2 API rewrite, §3 demo app, §6 CI and release,
§7 docs.

## 2. Library — the 2.0.0 API

### 2.0 Findings from §5 that the rewrite must address

Writing the tests surfaced these. Each is pinned by a test where possible, so
fixing one is a deliberate change that will flip that test.

| # | Finding | Where | Pinned by |
|---|---|---|---|
| **F1** | **`label` is a dead parameter.** Accepted by `resolveSimpleEvent` / `resolveDataEvent` at every layer — this wrapper, the core's public API, and both the B1 and B2 implementations — and put in **no** payload by either backend. Callers reasonably believe it is recorded. Decide: drop it from the 2.0.0 API, or have the core send it | wrapper, core B1 + B2 | `b2-events` "does not send the label" |
| **F2** | **Under `logOnly`, `sendMail` calls neither callback.** The core's `transferEmail` returns before sending, so a UI waiting on success or failure waits forever. The Observable-returning 2.0.0 `sendMail` should complete under `logOnly` | core `email-transmission.ts` | `b2-log-only` "never calls either mail callback" |
| **F3** | **The core calls `window.matchMedia` without a guard**, in platform detection, while the checks beside it use `?.`. Where `matchMedia` is missing, `init()` throws, and the throw escapes this library's service constructor and breaks injection | core `platform.ts:97` | the jsdom stub in `src/test-setup.ts` |
| **F4** | **A mail rejection with no `message` reports `undefined` instead of the intended fallback.** The core uses `isEmptyString(response.message)`, and `isEmptyString(undefined)` is `false` — the bmx-pastebox quirk documented and pinned there. This wrapper's `onError` takes no argument, so only direct core users see it | core `transmission.ts` + bmx-pastebox | — (masked by the wrapper) |
| **F5** | **`pageViewObserver()` is public and subscribes again on every call.** The constructor already calls it, so a consumer calling it too gets every page view twice. Belongs with **B4** (the subscription is never released) | wrapper event service | — |
| **F6** | **The mail service's `as unknown as` cast is now unnecessary, and its comment is out of date.** Core 0.9.2's `sendEmail` accepts plain `'GMAIL'` / `'CUSTOM_SMTP'` strings (the P6 fix), so the cast and the "enums are nominal" explanation can go — verify with the compiler when the file is rewritten | wrapper mail service | — |

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

## 4. Vitest in, Karma out — ✅ done 2026-10-15

Done as §1 Phase 3; the task table there has the per-step detail.

- Both projects test with `@angular/build:unit-test`, `runner: vitest`, `jsdom`.
  Library 9/9, demo app 3/3
- The demo app builds with `@angular/build:application` (**A6**), and
  `@angular-devkit/build-angular` is gone from the workspace
- Karma, Jasmine, `istanbul-lib-instrument`, **and Zone.js** are uninstalled, and
  the lockfile resolves none of them
- `npm run test:coverage` reports through the v8 provider. **Thresholds wait for
  §5**: today's library function coverage is 33%, the T1 gap, and enforcing a
  bar now would set it at the gap

Things this turned up, for whoever works on §3 and §5:

- **The demo app is zoneless** (D6). Vitest's generated setup uses top-level
  `await`, which Angular forbids in apps that load Zone.js, so going zoneless was
  required, not optional. It also cut the bundle from 291.56 kB to 253.94 kB.
  Verified in headless Chrome, not only in TestBed
- **Vitest compiles templates ahead of time**, so an NgModule-declared component
  cannot be tested without its module's scope. The demo's `AppComponent` became
  standalone for that reason. The §3 rewrite is standalone throughout anyway
- **Never assert on `Function.prototype.name`.** esbuild renames decorated
  classes (`_BloomsightEventService`), so compare classes by identity
- **Jasmine matchers fail at compile time**, not runtime — `toBeTrue()` is not on
  Vitest's `Assertion` type

## 5. Tests — close T1 — ✅ done 2026-10-15

Until now no test exercised the **behaviour** of the two services that do the
real work, which is why library function coverage sits at 33%. Two kinds of
test, because each proves something the other cannot:

- **Library unit tests** mock the core (`vi.mock`, confirmed working under the
  Angular builder) and assert that each service calls the right core function
  with the right arguments
- **Demo app integration tests** run the **real** core and stub only `fetch`,
  so they assert on the actual network requests an app produces. They import
  nothing from `@bloomscorp/bloomsight.js`, which keeps to the facade rule, and
  they are written against the public API so they survive the §3 demo rewrite

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Turn on test isolation (`isolate: true`) for both projects | ✅ | Both projects. Existing 12 tests still green |
| 5.2 | `BloomsightEventService` unit tests | ✅ | 12 tests, mutation-tested. Two first drafts passed even with B3 reintroduced or the dedupe removed: Angular ignores navigation to the current URL, so they tested the router, not us. Rewritten so both mutations fail |
| 5.3 | `BloomsightMailService` unit tests | ✅ | 8 tests. Mutation-tested: swapped arguments, a changed default engine and swapped callbacks each fail their own test |
| 5.4 | Init runs once with both services injected (**B1**) | ✅ | Both injection orders. Removing the init-once guard fails both |
| 5.5 | Demo app integration tests, real core, `fetch` stubbed | ✅ | 20 tests across 4 files, real core, fetch stubbed. Needed a jsdom matchMedia stub. Every 'nothing was sent' test proves the core was alive. All wrapper mutations caught at request level. Found: label is never sent by any backend, and logOnly mail calls neither callback |
| 5.6 | Enforce coverage thresholds from the new baseline | ✅ | Library 52/67/33/33% → 100/100/100/100%. Enforced at 100% per file; one untested method fails with the file named. Applies under npm run test:coverage, which §6's CI must run |
| 5.7 | Close T1 in MODERNISATION.md | ✅ | T1 closed. Six findings, F1–F6, recorded in §2.0 as inputs to the API rewrite |

Then: code review of the branch, and push.

## 5a. Code review of the branch — 🔄 fixing findings

A high-effort review of `main...feat/2.0.0` (33 commits) returned ten findings.
The first overturned a conclusion from the Angular 22 step, so it was verified
against real old compilers before anything else.

| # | Finding | Status | Resolution |
|---|---|---|---|
| RV1 | **Critical.** The published component emitted `ChangeDetectionStrategy.Eager`. Linkers before Angular 22 have no `Eager` and fail with *"Unsupported change detection strategy"*. **Confirmed with Angular 19.2.25's real linker.** The 22 step's claim that this was safe was wrong: `minVersion` does not cover enum members | ✅ | `changeDetection` removed from the published component. New `npm run verify:compat` packs the library and, for **every** Angular major in the peer range, links it with that major's real linker and type-checks every public symbol with `skipLibCheck` off. All of 19.2.25, 20.3.34, 21.2.25 and 22.2.3 pass. With `Eager` put back it fails on 19 with the linker's reason |
| RV2 | The peer range still says `>=14.2.0`, which is unprovable: the `.d.ts` uses a 9-argument `ɵɵComponentDeclaration`, and Angular 14's takes 8 | ✅ | Peer range now `>=19.0.0 <23.0.0` (**D2**), and §0.1's obligation 2 is met: compatibility is proven per major by `verify:compat`, not declared |
| RV3 | The mail service's `as unknown as` cast switches off the compiler's check on the engine, and its comments have been false since core 0.9.2 (**F6**) | ✅ | `BloomsightEmailEngine` now aliases the core's `EmailEngineType`; no cast. Proven: the compiler rejects `'SMTP'` (TS2322) and accepts `'CUSTOM_SMTP'`. Closes **F6** |
| RV4 | If the core's `init()` throws, the error escapes the service constructor and breaks injection, and `initOnce` has already set its flag, so init never retries (the wrapper's half of **F3**) | ✅ | `initOnce` catches, reports `INIT_FAILED` through `onError` and the console, survives a throwing handler, and sets its flag only on success, so it retries. 7 new tests. Mutation-tested: removing the catch fails 6, setting the flag early fails the retry test. The coverage threshold caught two untested branches in this fix before it was committed |
| RV5 | The `logOnly` "sends no mail" test cannot fail: it never proves `sendMail` reached the core | ⬜ | Assert the core's development-mode mail log |
| RV6 | "honours apiBase" passes vacuously when nothing is sent | ⬜ | Require the ingest request |
| RV7 | `settle()` waits a fixed number of ticks, so tests could flake under load | ⬜ | `vi.waitFor` on the observed condition; `settle()` kept only after a positive signal |
| RV8 | A `console.log` spy is not restored if an assertion fails | ⬜ | `afterEach(vi.restoreAllMocks)` |
| RV9 | `tsconfig.lib.json` still excludes the deleted `src/test.ts` | ⬜ | Remove |
| RV10 | The same diagnostic suppressions are copied into five tsconfigs | ⏸️ | Deferred on purpose: §2.2 removes all five, so consolidating them first is double work |

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

1. ~~D1–D7 answered~~ ✅ (§0)
2. ~~Core P6 fix~~ ✅ `bloomsight.js@0.9.1`
3. ~~Vitest trial run~~ ✅
4. ~~§1 phase 1~~ ✅ `bmx-pastebox@1.1.0`
5. ~~§1 phase 2~~ ✅ `bloomsight.js@0.9.2`, with the consumer-load gate
6. ~~§1 phase 3 / §4~~ ✅ Vitest in, Karma and Zone.js out
7. ~~§5 real tests~~ ✅ 31 library + 20 integration tests, 100% library coverage
8. **Code review, then push** ← next. Then §2 API rewrite (F1–F6) → §3 demo
   app → §6 CI and release → §7 docs
9. Verification gate (§8), then publish 2.0.0
