# `ngx-bloomsight` 2.0.0 — release checklist

> **Status: in progress** on `feat/2.0.0`. See the live tracker below.
>
> Scope: resolve every item flagged in [MODERNISATION.md](./MODERNISATION.md),
> rewrite the public API, rewrite the demo app from scratch, replace Karma with
> Vitest, and remove everything dangling — using Angular 22 idioms throughout.
>
> Context: [UPGRADE-LOG.md](./UPGRADE-LOG.md) (the 14 → 22 climb, now complete).

## ▶ Current status

> **Live tracker.** Updated and committed as each task lands.
>
> **Now:** §8 ✅ **passed**. 2.0.0 is ready to release. Waiting on the owner: merging `feat/2.0.0` into `main`, then `npm run release` (it pushes a release commit and tag to `main`). The npm trusted publisher validates on that first publish, which must happen before **2026-10-17 17:17 UTC** or be re-created. The npm trusted publisher is pending validation by the first publish, which must happen before **2026-10-17 17:17 UTC** or be re-created.
>
> **Done so far:** decisions (§0) · core P6 fix · Vitest trial run ·
> `bmx-pastebox@1.1.0` released · `bloomsight.js@0.9.2` released ·
> **Vitest in, Karma and Zone.js out** (§1 Phase 3, §4) ·
> **both services under test, library at 100% coverage** (§5) ·
> **code review: 9 findings fixed, Angular 19–22 proven** (§5a) ·
> **the 2.0.0 API: `provideBloomsight()` + one service, 1.x surface deleted** (§2) ·
> **demo app rebuilt: every feature on screen, safe by default, built package** (§3)
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

**Found while building it** — none is a library bug, all recorded:

- **The core's page-view timer outlives the app.** It waits two seconds before
  sending, and sends with whatever configuration is current *then*. A demo test
  that left a page view pending under `logOnly` had it sent by the next test's
  live configuration. Tests that depend on this get their own file. In a real
  app this needs a re-bootstrap within two seconds, so it is noted, not fixed
- **Headless Chrome is a bot to the core**, so it stops tracking — correctly.
  The activity panel made it visible ("tracking simple event is disabled!"). The
  browser check presents a normal Chrome user agent
- **The core reports `PROPERTY_PAUSED` for a property with no `status`**,
  saying *website 'undefined' is paused*. Only a malformed server reply
  triggers it; worth tightening to `status === 'paused'` in a later core release
| 3.12 | Close out the docs: §4 here, **A6** and **A7** in MODERNISATION.md | ✅ | §4 here, A6 and A7 in MODERNISATION.md, and an 'after the climb' section in UPGRADE-LOG.md |

After Phase 3: §5 real tests, §2 API rewrite, §3 demo app, §6 CI and release,
§7 docs.

## 2. Library — the 2.0.0 API — ✅ done 2026-10-15

### 2.0 Findings from §5 that the rewrite must address

Writing the tests surfaced these. Each is pinned by a test where possible, so
fixing one is a deliberate change that will flip that test.

| # | Finding | Where | Pinned by |
|---|---|---|---|
| **F1** | ✅ **Resolved:** dropped (owner's decision). **`label` is a dead parameter.** Accepted by `resolveSimpleEvent` / `resolveDataEvent` at every layer — this wrapper, the core's public API, and both the B1 and B2 implementations — and put in **no** payload by either backend. Callers reasonably believe it is recorded. Decide: drop it from the 2.0.0 API, or have the core send it | wrapper, core B1 + B2 | `b2-events` "does not send the label" |
| **F2** | ✅ **Resolved:** `sendMail` completes under `logOnly`. **Under `logOnly`, `sendMail` calls neither callback.** The core's `transferEmail` returns before sending, so a UI waiting on success or failure waits forever. The Observable-returning 2.0.0 `sendMail` should complete under `logOnly` | core `email-transmission.ts` | `b2-log-only` "never calls either mail callback" |
| **F3** | **The core calls `window.matchMedia` without a guard**, in platform detection, while the checks beside it use `?.`. Where `matchMedia` is missing, `init()` throws, and the throw escapes this library's service constructor and breaks injection | core `platform.ts:97` | the jsdom stub in `src/test-setup.ts` |
| **F4** | **A mail rejection with no `message` reports `undefined` instead of the intended fallback.** The core uses `isEmptyString(response.message)`, and `isEmptyString(undefined)` is `false` — the bmx-pastebox quirk documented and pinned there. This wrapper's `onError` takes no argument, so only direct core users see it | core `transmission.ts` + bmx-pastebox | — (masked by the wrapper) |
| **F5** | ✅ **Resolved:** no longer public; the subscription lives in the initializer. **`pageViewObserver()` is public and subscribes again on every call.** The constructor already calls it, so a consumer calling it too gets every page view twice. Belongs with **B4** (the subscription is never released) | wrapper event service | — |
| **F6** | **The mail service's `as unknown as` cast is now unnecessary, and its comment is out of date.** Core 0.9.2's `sendEmail` accepts plain `'GMAIL'` / `'CUSTOM_SMTP'` strings (the P6 fix), so the cast and the "enums are nominal" explanation can go — verify with the compiler when the file is rewritten | wrapper mail service | — |

### 2.1 The design — settled 2026-10-15

What a consuming app writes. Nothing here imports `@bloomscorp/bloomsight.js`.

```ts
// app.config.ts — once, in the application's root providers
providers: [
  provideRouter(routes),
  provideBloomsight({ propertyToken: '…', isDevelopmentMode: false, target: 'blooms-ai' })
]

// anywhere
private readonly bloomsight = inject(BloomsightService);

this.bloomsight.track('signup-clicked');
this.bloomsight.trackData('plan-selected', { plan: 'pro', seats: 5 });
this.bloomsight.sendMail({ engineId, templateId, templateOwnerId, data: formData, engine: 'CUSTOM_SMTP' })
  .subscribe({ next: () => …, error: (e: BloomsightError) => … });
this.bloomsight.errors$.subscribe((e) => monitoring.report(e));
```

**Public API, complete:** `provideBloomsight`, `BLOOMSIGHT_CONFIG`,
`BloomsightService`, and the types `BloomsightConfig`, `BloomsightError`,
`BloomsightEmailEngine`, `BloomsightMailRequest`, `BloomsightEventData`. A test
pins the runtime export list, so nothing reappears by accident.

How each open question was settled, and why:

| Question | Decision | Why |
|---|---|---|
| **F1** — `label` | **Dropped** from `track()` / `trackData()` (owner's decision, 2026-10-15) | No backend has ever recorded it. Adding it back later, if one ever does, breaks nobody |
| `templateOwnerId` | **Kept**, required | The B1 mail endpoint needs it: the core sends it as the `userId` form field |
| `sendMail` shape | Request object in, **cold** `Observable<void>` out: one emission then complete on success; errors with a `BloomsightError` (`code: 'MAIL_FAILED'`) on failure | Angular's convention (`HttpClient` is cold too), so nothing is sent until it is subscribed. Named fields remove the positional-string swap risk that §5 had to test for |
| **F2** — `logOnly` mail | The Observable **emits and completes** once the core has the mail | `logOnly` means "behave normally, transmit nothing". A UI written for the real thing must not hang |
| Server render (**A3**) | Nothing runs on the server: no `init()`, no router subscription, `track` is a no-op, `sendMail` completes without sending | There is no visitor on the server. Completing rather than erroring matters there: an unhandled RxJS error is rethrown asynchronously, which in Node can take down the server process |
| `errors$` (**A8**) | Every failure the core reports through `onError`, from the moment of subscribing — hot, like `Router.events`. The app's own `onError` is still called. Mail failures go to that call's Observable only. **`INIT_FAILED` is not on it** (changed while building): startup runs before any component exists to subscribe, so it goes to `onError` and the console | One stream for monitoring; mail errors already have a caller waiting for them, and reporting them twice would double-count. Replaying old failures to late subscribers was rejected: a second subscriber would re-report history |
| An `errors` signal | **Not added** | `toSignal(bloomsight.errors$)` is one line in the app. A second surface for the same data has to be kept in step forever |
| Page views on blooms.ai | The router is **not observed** at all. One log line, under `debug` or `isDevelopmentMode` only | blooms.ai has no page-view endpoint. A console *warning* on every page load of every migrated production site would be noise |
| Init failure (**RV4**) | Still caught and reported, never thrown. **No retry** — initialisation now happens once per app start | A throwing app initializer would abort bootstrap, which is far worse than the 1.x constructor failure RV4 fixed |
| Used without `provideBloomsight()` | Injecting the service throws, with a message naming `provideBloomsight()` | Rather than Angular's generic `NullInjectorError` for a token the app has never heard of |
| Called twice | Not guarded. Call it once, in the root providers | Each call is one app initializer, in the injector it is given. The 1.x module-level guard is what made tests need a reset seam |
| `inject-migration` schematic | **Not needed** | Every class it would touch is deleted, and the new code uses `inject()` from the start |

API ceiling check (§0.1, obligation 1) — every Angular API used, with the
stability tag read from `@angular/core@19.0.0`'s own declarations:
`provideAppInitializer` `@publicApi` · `makeEnvironmentProviders` `@publicApi` ·
`takeUntilDestroyed` `@publicApi` · `DestroyRef`, `InjectionToken`, `inject`,
`PLATFORM_ID`, `isPlatformBrowser` — all stable well before 19.

### 2.2 Tasks

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | `BLOOMSIGHT_CONFIG` `InjectionToken` — **P3** | ✅ | Annotated explicitly: inferred, the published type expanded to the core's `IConfig` (§2.3) |
| 2.2 | `provideBloomsight(config)` → `EnvironmentProviders` — **B6** | ✅ | |
| 2.3 | Init through `provideAppInitializer`, browser only — **B1, B7, B8, A3** | ✅ | A throwing initializer would abort bootstrap, so failures are caught and reported (RV4) |
| 2.4 | One root `BloomsightService`: `track`, `trackData`, `sendMail`, `errors$` — **P4, A8, F1, F2** | ✅ | `INIT_FAILED` left off `errors$` — see the table above |
| 2.5 | Page views: `urlAfterRedirects`, `takeUntilDestroyed`, not public, off on blooms.ai — **B3, B4, F5** | ✅ | |
| 2.6 | Delete `NgxBloomsightComponent`, `NgxBloomsightService` (**P2**), `NgxBloomsightModule` (**D7**), both 1.x services, `internal/bloomsight-init.ts` | ✅ | 12 files deleted |
| 2.7 | Library tests rewritten for the new API: 100% per file, mutation-tested | ✅ | 51 tests across 3 files, 100% per file. 18 deliberate bugs put back one at a time: every one fails a test (one first failed only to compile, so it was redone as a change that compiles; it was still caught) |
| 2.8 | Demo integration tests ported to the new API, F2 test flipped | ✅ | 25 tests. The F2 test now asserts the fix; new: `errors$` from a real server rejection, mail is cold, mail failures stay off `errors$`. 5 bugs put back against the real core: all caught |
| 2.9 | Demo app stops importing the deleted module (minimal; §3 rebuilds it) | ✅ | The demo no longer references the library at all until §3 wires it back in; its bundle fell from 254.15 to 235.66 kB |
| 2.10 | Remove the `Eager` flags and the five `extendedDiagnostics` suppressions; fix what surfaces — closes **RV10** | ✅ | Nothing surfaced: both checks look at templates, and the library has none left. Closes **RV10** |
| 2.11 | Gate: `build-lib`, demo build, `test:coverage`, `verify:compat` on 19–22 | ✅ | All green. `verify:compat`'s consumer moved to the 2.0.0 API and uses every public symbol: 19.2.25, 20.3.34, 21.2.25, 22.2.3 all link and type-check |
| 2.12 | Close the items in MODERNISATION.md | ✅ | B4, B6, B7, B8, P2–P5, A2–A4 closed; A8 decided (no signals) |

### 2.3 Invariants to preserve

- [x] **The facade rule** — nothing in a consuming app imports
      `@bloomscorp/bloomsight.js`. Keep `BloomsightConfig`, `BloomsightError`
      and `BloomsightEmailEngine` exported, and keep the test that imports only
      from the public API
- [x] Public signatures reference **our** type names, never the core's
- [x] No deep imports into the core, in source **or** in the published types

---

## 3. Demo app — complete rewrite — ✅ done 2026-10-15

Deleted and rebuilt. It currently proves nothing: it imports the module without
`forRoot()`, so it configures nothing, and it imports the library by source path
so it never exercises the published artifact.

### 3.1 Structure

- [x] `bootstrapApplication`, no `AppModule`, no `app-routing.module.ts`
- [x] Standalone components throughout, `inject()`, signals for state
- [x] `@if` / `@for` / `@switch` only — no `*ngIf` / `*ngFor` / `*ngSwitch`
- [x] Delete the stock Angular welcome page — **this also removes the CSS budget
      warning at its source** rather than raising the budget
- [x] Drop `src/polyfills.ts`, `src/test.ts` and `src/environments/*` if Angular
      22 no longer needs them
- [x] Zoneless per **D6**
- [x] **Consume the built package by name** (`@bloomscorp/ngx-bloomsight`), not
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

### 3.3 The design — settled 2026-10-15

**How it stays safe (D5).** The demo's configuration lives in the browser's
`localStorage`, edited on a Settings page and applied by reloading, because the
SDK reads its configuration once, at startup. The defaults are `logOnly: true`,
`isDevelopmentMode: true` and `debug: true`, so a fresh checkout sends no
events and no mail. The header always shows whether the demo is in `logOnly` or
live, and which backend it would write to. Turning `logOnly` off requires a real
property token; the default token is a placeholder.

**How you see what happened.** Before the app starts, the demo wraps `fetch`
and `console`, so every request the SDK makes and every line it logs appears in
an activity panel. Both are the demo's own instrumentation and import nothing
from the core. A separate errors panel shows `errors$`. The app's `onError` is
also wired to the activity panel, which is the only place an `INIT_FAILED`
can be seen.

| Route | Shows | Feature (§3.2) |
|---|---|---|
| `/` | What the demo covers, with links | — |
| `/events` | `track` and `trackData` with a JSON payload editor | simple and data events |
| `/page-views` | Navigation between two pages, plus two old URLs that redirect to one of them, with the router's own `url` → `urlAfterRedirects` beside each | page views, `urlAfterRedirects`, dedupe |
| `/mail` | Engine, ids and template fields; send status | GMAIL, CUSTOM_SMTP, B1-only mail, `logOnly` completes (F2), **mail without events (B6)** |
| `/settings` | Every `BloomsightConfig` field | B1 ↔ B2, `apiBase`, debug, kill switches, `logOnly` |

Every page is a lazy route, and the mail page injects the service only to send
mail, which covers **lazy route (B7)** and **mail without events (B6)**.

**Angular 22 in the demo, since the API cap applies to the library only:**
standalone components with no NgModule, `bootstrapApplication`, zoneless,
signals, `computed`, `input()`, `toSignal`, `@if` / `@for` / `@switch` / `@let`,
route `title`, `provideBrowserGlobalErrorListeners`, and the Angular 20 file
naming (`app.ts` rather than `app.component.ts`).

**T2.** The demo imports `@bloomscorp/ngx-bloomsight`, which `tsconfig` maps to
`dist/`. So the app, and its integration tests, run the **built** package
through Angular's linker, exactly as a consumer does. `build`, `start` and
`test` run `build-lib` first, so a clean checkout works.

### 3.4 Tasks

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Delete the old demo: `AppModule`, routing module, stock welcome page, `environments/`, `fileReplacements` | ✅ | 8 files, and `fileReplacements` in `angular.json` |
| 3.2 | Remove unused dependencies: `@angular/platform-browser-dynamic`, `@angular/animations`, `@angular/forms` | ✅ | All three unused once `main.ts` moved to `bootstrapApplication` |
| 3.3 | Settings store: defaults (D5), `localStorage` with a safe fallback, reload to apply | ✅ | A stored value of the wrong type falls back field by field; blocked storage falls back entirely |
| 3.4 | Activity capture: `fetch` and `console`, installed before bootstrap | ✅ | Recorded a microtask later: a console call during rendering must not write a signal |
| 3.5 | Shell: header with live/logOnly status, navigation, activity and `errors$` panels | ✅ | | |
| 3.6 | Pages: overview, events, page views, mail, settings, all lazy | ✅ | Each page is its own lazy chunk (2–5 kB) |
| 3.7 | T2: import the package by name; `build-lib` before `build`, `start` and `test` | ✅ | Proven: library source broken with `dist/` stale, 80/80 demo tests pass; rebuilt, the two that cover it fail |
| 3.8 | Facade check: `npm run verify:facade` fails if any demo file imports `@bloomscorp/bloomsight.js` | ✅ | Catches static, dynamic, subpath and type-only imports; ignores the rule being mentioned in a comment |
| 3.9 | Demo tests: settings, activity capture and each page, against the built library and the real core | ✅ | 80 demo tests (was 25), 99.4% of statements. 12 bugs put back in the demo one at a time: every one caught |
| 3.10 | Verified in a real browser: boots, every page works, and `logOnly` sends nothing | ✅ | Production build in headless Chrome, every non-localhost request intercepted: 13 checks pass, including **zero POSTs under the defaults** and no horizontal scroll at 390 px |
| 3.11 | Gate: CSS budget warning gone, build, tests, `verify:compat` | ✅ | CSS budget warning gone with the welcome page; build, `test:coverage`, `verify:facade`, `verify:compat` on 19–22 all green |

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

## 5a. Code review of the branch — ✅ done 2026-10-15

A high-effort review of `main...feat/2.0.0` (33 commits) returned ten findings.
The first overturned a conclusion from the Angular 22 step, so it was verified
against real old compilers before anything else.

| # | Finding | Status | Resolution |
|---|---|---|---|
| RV1 | **Critical.** The published component emitted `ChangeDetectionStrategy.Eager`. Linkers before Angular 22 have no `Eager` and fail with *"Unsupported change detection strategy"*. **Confirmed with Angular 19.2.25's real linker.** The 22 step's claim that this was safe was wrong: `minVersion` does not cover enum members | ✅ | `changeDetection` removed from the published component. New `npm run verify:compat` packs the library and, for **every** Angular major in the peer range, links it with that major's real linker and type-checks every public symbol with `skipLibCheck` off. All of 19.2.25, 20.3.34, 21.2.25 and 22.2.3 pass. With `Eager` put back it fails on 19 with the linker's reason |
| RV2 | The peer range still says `>=14.2.0`, which is unprovable: the `.d.ts` uses a 9-argument `ɵɵComponentDeclaration`, and Angular 14's takes 8 | ✅ | Peer range now `>=19.0.0 <23.0.0` (**D2**), and §0.1's obligation 2 is met: compatibility is proven per major by `verify:compat`, not declared |
| RV3 | The mail service's `as unknown as` cast switches off the compiler's check on the engine, and its comments have been false since core 0.9.2 (**F6**) | ✅ | `BloomsightEmailEngine` now aliases the core's `EmailEngineType`; no cast. Proven: the compiler rejects `'SMTP'` (TS2322) and accepts `'CUSTOM_SMTP'`. Closes **F6** |
| RV4 | If the core's `init()` throws, the error escapes the service constructor and breaks injection, and `initOnce` has already set its flag, so init never retries (the wrapper's half of **F3**) | ✅ | `initOnce` catches, reports `INIT_FAILED` through `onError` and the console, survives a throwing handler, and sets its flag only on success, so it retries. 7 new tests. Mutation-tested: removing the catch fails 6, setting the flag early fails the retry test. The coverage threshold caught two untested branches in this fix before it was committed |
| RV5 | The `logOnly` "sends no mail" test cannot fail: it never proves `sendMail` reached the core | ✅ | Proven from the core's own development-mode mail log. With `sendMail` cut off from the core, both logOnly mail tests now fail; before, they passed |
| RV6 | "honours apiBase" passes vacuously when nothing is sent | ✅ | The test now requires the ingest request before checking hosts |
| RV7 | `settle()` waits a fixed number of ticks, so tests could flake under load | ✅ | Positive checks wait on the observed condition with `vi.waitFor`. `settle()` is kept only for "nothing happened" checks, after a positive signal has proven the core is live. 10 consecutive runs: 10 passed |
| RV8 | A `console.log` spy is not restored if an assertion fails | ✅ | `afterEach(vi.restoreAllMocks)` |
| RV9 | `tsconfig.lib.json` still excludes the deleted `src/test.ts` | ✅ | Removed |
| RV10 | The same diagnostic suppressions are copied into five tsconfigs | ✅ | Removed from all five in §2 (task 2.10), rather than consolidated first |

## 6. CI and release pipeline — T3, R1–R4 — ✅ done 2026-10-15

Mirror what `bloomsight.js` ended up with: local `release-it` bumps, tags and
pushes; the tag triggers CI, which runs every gate again on a fresh checkout,
publishes through npm **trusted publishing** (OIDC, no stored token) and cuts
the GitHub release.

### 6.1 What is different here

- **The package is published from `dist/bloomscorp/ngx-bloomsight`**, ng-packagr's
  output, not from the repo root. The root `package.json` (`ngx-bloomsight`,
  private) is the workspace; the library's own `package.json` is what npm sees.
  `sync-version` keeps the two versions equal (B5)
- **The library's `package.json` has no `repository` field.** npm verifies a
  `--provenance` publish against it and **rejects** the publish if it does not
  match the GitHub repository the workflow ran in. So it is added, with
  `homepage`, `bugs`, `license` and `description`, which the npm page has never
  shown
- **R2 and R3 are already fixed** (`60ecc44`, with B5): `.release-it.json` has
  `npm.publish: false` and `github.release: false` — both move to CI — and
  `requireCleanWorkingDir: true` with no `git add --all`
- **Node 24.18 bundles npm 11.16**, past trusted publishing's 11.5.1 minimum, so
  the npm-upgrade step `bloomsight.js` needs on Node 20 is not needed. The
  workflow asserts the version instead of upgrading
- **CI runs on `feat/**` pushes too**, not only `main`, so the 2.0.0 branch is
  checked before it is merged

### 6.2 Tasks

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Library `package.json`: `repository` (provenance needs it), `homepage`, `bugs`, `license`, `description`, `keywords`, `sideEffects: false` | ✅ | Also ships `LICENSE.md` — a copy inside the library folder, since ng-packagr cannot reach outside it; the gate fails if it drifts |
| 6.2 | **Packaging gate** `npm run verify:package`, on the real tarball: required files present, every manifest pointer resolves, no core deep imports or `dist/` paths in the types, no specs shipped, peers and version as declared, `repository` matches | ✅ | Proven by sabotage: removing the §2 type annotation, deleting `repository`, breaking `module` and dropping a peer are each caught. Strips comments first: its first run flagged a doc comment quoting the forbidden form |
| 6.3 | `.github/workflows/ci.yml` — **T3**: Node from `.node-version`, build, `test:coverage`, `check-version`, `verify:facade`, `verify:package`, `verify:compat` | ✅ | |
| 6.4 | `.github/workflows/release.yml` — **R1**: on a `v*` tag, the same gates, tag = both versions, `npm publish --provenance` from `dist/`, GitHub release | ✅ | Also: a prerelease tag publishes to `next`, never `latest`, and the npm version is asserted, not upgraded |
| 6.5 | `.release-it.json`: run the gates in `before:init`, so a broken tree is never tagged | ✅ | |
| 6.6 | Upgrade the release tooling: `release-it` 17 → 21, `@release-it/conventional-changelog` 8 → 12, `@commitlint/*` 18 → 21. Target: `npm audit` 0 | ✅ | `npm audit` **19 → 6**, all one dev-only chain (`release-it` → … → `basic-ftp`, GHSA-c475-qrg2-pj4r) with **no upstream fix** — accepted and documented in RELEASING.md rather than forced with a major-version override. `--omit=dev`: 0 |
| 6.7 | `release-it --dry-run` computes **2.0.0** from the commits (the `feat!` / `BREAKING CHANGE`) | ✅ | `release-it` 21 computes **2.0.0** |
| 6.8 | `RELEASING.md` for this repo | ✅ | |
| 6.9 | Push; the first CI run on `feat/2.0.0` goes green | ✅ | **Passed first time**, run 38769659037 on `d64641a` — after the same steps had passed in a fresh clone with `npm ci` and `CI=true` |
| 6.10 | **You:** npm trusted publisher for `@bloomscorp/ngx-bloomsight` → `bloomscorp/ngx-bloomsight`, `release.yml` | ✅ | Created 2026-10-15, **pending validation** until the first OIDC publish — expected, as with `bmx-pastebox`. npm drops it if unused by **2026-10-17 17:17 UTC**; if the release is later, re-create it with the same values first |

## 7. Docs and consumer migration — ✅ done 2026-10-15 (7.5 after release)

Two audiences, two documents, plus the repository page:

| Document | Audience | Where it is read |
|---|---|---|
| **Library README** (`projects/bloomscorp/ngx-bloomsight/README.md`) | Developers adding Bloomsight to an Angular app | npmjs.com, and inside `node_modules` — so every link is absolute |
| **MIGRATION.md** | Developers of the Angular apps already on 1.x | GitHub, linked from the README |
| **Root README** | People working on this repository | GitHub's front page: what it is, then how to build, test, run the demo and release |

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | Library README for the 2.0.0 API — setup (standalone **and** NgModule apps), every config field, events, page views, mail, `errors$`, blooms.ai, SSR, the facade rule | ✅ | Includes a jsdom note for app tests: the SDK reads `matchMedia` at startup (F3), so without a stub it reports `INIT_FAILED` and stays off |
| 7.2 | MIGRATION.md 1.x → 2.0.0: requirements (Angular **19**–22, the core as a peer at `>=0.9.2`), `forRoot()` → `provideBloomsight()`, two services → one with a call-by-call table, `sendMail` must now be **subscribed**, page-view counting changes, types | ✅ | Every behaviour change listed traces to a fixed finding (B7, B8, F2, F5, RV4) |
| 7.3 | Root README for contributors, replacing the copy of the package README | ✅ | |
| 7.4 | MODERNISATION.md: every item closed with an outcome, or deferred with a reason | ✅ | Nothing left open: the only unticked rows are §1.1's explanatory table, already marked resolved |
| 7.5 | **After 2.0.0 is on npm:** the Angular notes in `bloomsight.js` MIGRATION.md and blooms-ai `documentation/bloomsight/migration-plan.md` — both say the wrapper needs no release, which stays true for 1.6.0 until 2.0.0 exists | ⬜ | Deliberately post-release, so neither names an unpublished version |

---

## 8. Final verification gate — ✅ passed 2026-10-15

| # | Check | Status | Evidence |
|---|---|---|---|
| 8.1 | Every B/P/A/T/R item in MODERNISATION.md ✅ or deferred with a reason | ✅ | Closed in §7 (7.4) |
| 8.2 | **A real Angular 19 app**, generated by Angular 19's own CLI, installs the packed tarball and passes `ng build` (§0.1, obligation 2) | ✅ | `@angular/cli@19` app (Angular **19.2.25**, Zone.js 0.15.1), packed tarball installed, a consumer using every public API: production `ng build` passes |
| 8.3 | The same for a real Angular 22 app | ✅ | `@angular/cli@22` app (Angular **22.2.3**): the same consumer, production `ng build` passes |
| 8.4 | **Zone.js at runtime.** The Angular 19 app is zone-based (its CLI default), so it runs in Chrome: the SDK starts, page views and an event fire, mail completes under `logOnly` | ✅ | Both apps in headless Chrome **under Zone.js**, all external requests intercepted, 8/8 each: boots, `Zone` present, SDK starts once, 2 page views for 3 navigations (redirect to the same page not counted), `track` and `trackData` reach the core, mail completes under `logOnly` and the view updates, zero POSTs, no page errors |
| 8.5 | No library API newer than Angular 19 (§0.1, obligation 1) | ✅ | `verify:compat` type-checks the public API against Angular 19's own declarations, and 8.2 builds a real 19 app. Every Angular API used was confirmed `@publicApi` in 19.0.0 (§2.1) |
| 8.6 | Published types: no `dist/` path, no core subpath, no inline core type | ✅ | `verify:package`, proven by sabotage (§6) |
| 8.7 | No Karma, Jasmine, `*ngIf`, `*ngFor` or `NgModule` in the code | ✅ | Swept `src/`, `projects/`, `scripts/` and the configs: none |
| 8.8 | The tarball inspected by hand | ✅ | 6 files: bundle, source map, types, manifest, README, LICENSE. Manifest complete, with `repository`. The 5 kB bundle read line by line: exactly the three runtime exports, no component, no `ChangeDetectionStrategy`, declarations only of kinds Angular 19 links. Version reads 1.6.0 until `release-it` bumps and rebuilds |
| 8.9 | `minVersion` in the built artifact ≤ 19.0.0 | ✅ | `12.0.0` on all six declarations |

## 9. Suggested order

1. ~~D1–D7 answered~~ ✅ (§0)
2. ~~Core P6 fix~~ ✅ `bloomsight.js@0.9.1`
3. ~~Vitest trial run~~ ✅
4. ~~§1 phase 1~~ ✅ `bmx-pastebox@1.1.0`
5. ~~§1 phase 2~~ ✅ `bloomsight.js@0.9.2`, with the consumer-load gate
6. ~~§1 phase 3 / §4~~ ✅ Vitest in, Karma and Zone.js out
7. ~~§5 real tests~~ ✅ 31 library + 20 integration tests, 100% library coverage
8. ~~Code review, then push~~ ✅ (§5a)
9. ~~§2 API rewrite~~ ✅
10. ~~§3 demo app~~ ✅
11. ~~§6 CI and release~~ ✅
12. ~~§7 docs~~ ✅
13. ~~§8 verification gate~~ ✅
14. **Merge to `main`, then publish 2.0.0** ← next (owner)
