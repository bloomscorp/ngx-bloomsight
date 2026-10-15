# `ngx-bloomsight` — audit and modernisation checklist

> **Audit date:** 2026-10-12, against `6fe2201` (v1.6.0, published on npm).
> **Baseline:** `npm run build-lib` succeeds today. Nothing here is blocking a
> build; everything here is wrong anyway.
>
> **Context.** `@bloomscorp/bloomsight.js` is the framework-agnostic core.
> `ngx-bloomsight` is meant to be a *proper* Angular wrapper over it — the first
> of a family (React, Svelte, …), so whatever API shape is settled here becomes
> the template for the rest.
>
> The core shipped **0.8.0** with a `target: 'blooms-ai'` flag for the
> blooms.ai migration. The wrapper needs **no release** for that to work (its
> peer range already allows 0.8.0, and it forwards the whole config object
> through), so this work is not on the migration's critical path and can be done
> properly rather than quickly.
>
> ## Status
>
> | | |
> |---|---|
> | **B1, B2, B3, B5** | ✅ **fixed 2026-10-12**, unreleased — see each entry |
> | **B4, B6, B7, B8** | ⏸️ **deferred by decision** — they are not patchable, see §1.1 |
> | Angular 14 → **22** | next up. `latest` is 22.2.2 |
> | Everything else | open |
>
> **Nothing has been published.** No 1.6.1 was cut: no project in the field is
> affected by these today, every consumer is ours, and the plan is to bump
> versions once, fix the whole flow, and migrate projects to blooms.ai directly.
> These fixes ride along with the Angular upgrade and the 2.0.0 rewrite.

---

## 1. Bugs — these misbehave today

### B1. `init()` runs twice — ✅ fixed

`BloomsightEventService` and `BloomsightMailService` **both** call
`init(this._config)` in their constructors. An app that injects both
initialises the SDK twice: two property pre-flight requests, `initConfig` run
twice, and under `target: 'blooms-ai'` two `inspectProperty` calls.

Whichever service is constructed second silently re-initialises the first one's
state.

**Fixed** by routing both through `initOnce()` in
`src/lib/internal/bloomsight-init.ts`: the first caller wins, the rest are
no-ops, whichever service the app injects first. Verified in the built bundle —
exactly one `init(config)` call site, behind the guard.

This is a **guard, not the real fix**: initialisation is still a constructor side
effect, which is what B7 and B8 are about. Those need `provideBloomsight()`.

### B2. Missing peer dependencies — ✅ fixed

The library imports `@angular/router` and `rxjs`, and declares neither:

```json
"peerDependencies": {
  "@angular/common": "^14.2.0",      // ← imported nowhere
  "@angular/core": "^14.2.0",
  "@bloomscorp/bloomsight.js": ">=0.7.0 <1.0.0"
}
```

npm hoists `@angular/router` from the consuming app so this appears to work, but
under pnpm, Yarn PnP or strict peer resolution the import fails. `@angular/common`
is declared and never used.

**Fixed:**

```json
"peerDependencies": {
  "@angular/common": ">=14.2.0 <23.0.0",
  "@angular/core":   ">=14.2.0 <23.0.0",
  "@angular/router": ">=14.2.0 <23.0.0",
  "rxjs":            ">=7.0.0 <9.0.0",
  "@bloomscorp/bloomsight.js": ">=0.7.0 <1.0.0"
}
```

Two deliberate choices. The Angular ranges **widened** from `^14.2.0`: adding
`@angular/router` at `^14.2.0` would have handed every consumer on Angular 15+ a
peer conflict they do not have today, so the fix would have made things worse for
modern apps. And `@angular/common` is **kept** despite being unused — `2.0.0`
needs `isPlatformBrowser` from it for SSR safety (A3).

The core's range was left at `>=0.7.0`: the wrapper uses nothing from 0.8.0, so
raising the floor would force an upgrade on consumers for no reason. These ranges
get finalised at the Angular 22 upgrade.

### B3. Page views use the pre-redirect URL — ✅ fixed

```ts
if (this._previousUrl !== event.url) { pageView(); }
this._previousUrl = event.url;
```

`NavigationEnd` carries both `url` and `urlAfterRedirects`. Using `url` means a
route that redirects — a guard sending `/` to `/dashboard`, a `redirectTo`
— reports the URL the user asked for, not the one they landed on. It also
produces a spurious page view when two different requested URLs resolve to the
same destination.

**Fixed** — both the comparison and the stored value now use
`event.urlAfterRedirects`. Also removed a dead `sendEmail` import from the event
service, which never sends mail.

### B4. The router subscription is never released — ✅ fixed in 2.0.0

**Fixed 2026-10-15** by the rewrite (RELEASE-2.0.0.md §2). The subscription
now lives in the app initializer and ends with `takeUntilDestroyed` on the
application's injector. A test proves the router stream has no observers once
the app is destroyed.

`pageViewObserver()` subscribes to `Router.events` and nothing ever
unsubscribes. `OnInit` and `OnDestroy` are imported and the class implements
neither; `filter` and `take` are imported from rxjs and never used.

### B5. The published version is not the version that gets tagged — ✅ fixed

`release-it` bumps the **root** `package.json`. What actually gets published is
`projects/bloomscorp/ngx-bloomsight/package.json`, because that is what
`ng-packagr` copies into `dist/`. Nothing keeps them in sync.

So `npm run release` can tag `v1.7.0` while the tarball still says `1.6.0`. The
`1cf18b9 build: update version` commit in the history is someone doing that sync
by hand.

**Fixed** with `scripts/sync-library-version.js`, wired in as an `after:bump`
hook so it runs after the version is written and before `build-lib` copies it
into `dist/`. `npm run check-version` is the same script in assert mode and exits
non-zero on skew — that is what CI should run.

Two related things were wrong in the same config and are also fixed:

- `build-lib` ran in `before:init`, i.e. **before** the bump, so `dist/` was
  always built carrying the previous version. Moved to `after:bump`.
- `github.release` was `true` with no token configured, so `release-it` committed
  and tagged and *then* failed — the same half-finished state `bloomsight.js`
  had. Set to `false`; CI creates the release once the pipeline lands (R1–R4).
- `requireCleanWorkingDir: false` plus `git add --all` swept unrelated work into
  the release commit. Now `true`, with a targeted `git add`.

### B6. Importing the module without `forRoot()` provides nothing — ✅ fixed in 2.0.0

**Fixed 2026-10-15.** The module is gone (D7). `BloomsightService` is
`providedIn: 'root'`, so it always resolves, and if `provideBloomsight()` was
never called it throws an error that names it, rather than `NullInjectorError`.

`NgxBloomsightModule` declares and exports a component. The services and the
`'bloomsightConfig'` token exist **only** in `forRoot()`. Import the module
plainly and the first injection throws `NullInjectorError`, with no guard or
diagnostic.

**The demo app in this repo does exactly that** — `app.module.ts` imports
`NgxBloomsightModule`, not `.forRoot(...)`. It only "works" because nothing in
the demo ever injects a service, which means **the demo exercises none of the
library**.

### B7. `forRoot()` in a lazy module double-initialises — ✅ fixed in 2.0.0

**Fixed 2026-10-15.** There is no `forRoot()`. `provideBloomsight()` returns
`EnvironmentProviders` and starts the SDK from an app initializer, which runs
once per application.

Nothing stops `forRoot()` being imported again in a lazily-loaded module, which
creates a second set of services in the child injector — and therefore another
`init()`. The usual `@Optional() @SkipSelf()` guard is absent.

### B8. Nothing initialises unless a service happens to be injected — ✅ fixed in 2.0.0

**Fixed 2026-10-15.** The SDK starts when the app starts, whether or not
anything injects the service. Tested both ways: the initializer starts it with
no injection, and injecting the service alone starts nothing.

Initialisation is a constructor side effect, so an app that never injects
`BloomsightEventService` silently collects nothing. Tracking working depends on
injection order, which is not something a consumer should have to reason about.

---

## 1.1 Deferred: B4, B6, B7, B8 — why these are not being patched

> **Resolved 2026-10-15**, as this section planned: all four went with the
> design choice that caused them, in the 2.0.0 rewrite.

**Decision, 2026-10-12.** These four stay open on purpose. They are not
independent defects; they are four symptoms of one design choice, and patching
them on the current architecture means writing code the rewrite deletes.

The design choice is this: **the wrapper initialises the SDK as a constructor
side effect of a service that is only provided by `NgModule.forRoot()`.**
Everything below follows from it.

| | Symptom | Root cause | What actually resolves it |
|---|---|---|---|
| **B4** | Router subscription never released | the subscription is owned by a service with no lifecycle | `takeUntilDestroyed(inject(DestroyRef))`, Angular 16+ |
| **B6** | `NullInjectorError` when the module is imported without `forRoot()` | providers live only in `forRoot()`, so there are two ways to import and one is broken | there is only one way in: `provideBloomsight()` |
| **B7** | `forRoot()` in a lazy module creates a second service set, hence a second init | module-scoped providers can be instantiated per injector | `EnvironmentProviders` are root-scoped by construction |
| **B8** | Nothing initialises unless a service happens to be injected | init is a constructor side effect | an app initializer runs it once, injection or not |

Patching them where they are would mean adding an `@Optional() @SkipSelf()`
guard for B7, a `Subject`-based teardown for B4, a runtime diagnostic for B6, and
some eager-instantiation trick for B8 — four workarounds, all of which
`provideBloomsight()` makes unnecessary. B1's `initOnce()` guard is the one
exception: it is two lines and it stops a real double-request happening today.

**Why not now:** the replacement is an architecture change to the wrapper's
public contract, and getting it right means understanding how Bloomsight is
actually consumed across the projects first — not guessing at an API and
discovering later it does not fit. That work is scheduled after the Angular 22
upgrade, as `2.0.0` (§6).

**Why it is safe to wait:** none of the four has caused a problem in the field.
Every consumer is ours, the projects using Bloomsight run without issues today,
and each of the four needs a specific shape of usage to bite — injecting the
mail service only (B8), importing the module plainly (B6), or putting `forRoot()`
in a lazy route (B7). No current project does any of those. B4 leaks one
subscription per app lifetime, which is bounded and harmless.

**What would change the urgency:** any project that lazy-loads a module
importing `forRoot()` (B7 → double init → duplicated page views), or that wants
mail without events (B8 → silent no-op). If either comes up before `2.0.0`,
revisit.

---

## 2. Packaging and API hygiene

> ### The facade rule
>
> **Nothing in a consuming Angular app should ever import
> `@bloomscorp/bloomsight.js`.** If it has to, `public-api.ts` is missing an
> export, and that is the bug — not the app's code.
>
> Three different things get confused here, so to be explicit:
>
> | | Correct? |
> |---|---|
> | `ngx-bloomsight` **imports** the core | ✅ Yes — that is what a wrapper is |
> | A consuming app **installs** the core | ✅ Unavoidable; it is a peer dependency, and installing is not coupling |
> | A consuming app **imports** the core | ❌ The thing this rule prevents |
>
> When something is missing, the fix is almost always to **export or alias it
> from this package** — not to release a new core. A core release is the last
> resort, needed only when the core does not expose the thing at all, and even
> then it can often be avoided (see the `Parameters<typeof sendEmail>[0]` trick
> used for the email engine type).
>
> Applying this rule is what found the `BloomsightError` gap: `onError` in the
> config takes a core type that this package was not re-exporting, so any app
> with a named error handler would have been forced to import the core.


| | Issue |
|---|---|
| **P1** | ✅ **Fixed 2026-10-12.** All five deep imports removed; every core import now goes through the package root, and the published `index.d.ts` no longer references `dist/`. Two halves: *inward*, four `IConfig` imports moved to the root (needs 0.8.0, so the core peer went `>=0.7.0` → `>=0.8.0`) and the fifth, `EmailEngineTypeEnum`, was eliminated entirely with `Parameters<typeof sendEmail>[0]` — deriving the parameter type from the root-exported function, so no core release was needed. *Outward*, `BloomsightConfig` is now exported from `public-api.ts`, so a consuming app never needs to import the core to type `forRoot()`. Guarded by `ngx-bloomsight.module.spec.ts`, which imports only from `../public-api` and fails to compile if the surface regresses. |
| **P2** | ✅ **Fixed 2026-10-15** — both deleted, and a test pins the runtime export list to `BLOOMSIGHT_CONFIG`, `BloomsightService`, `provideBloomsight`. *Was:* CLI scaffolding is public API: `NgxBloomsightComponent` renders *"ngx-bloomsight works!"*, `NgxBloomsightService` is an empty class. Both exported from `public-api.ts`. Still true — the component was made **standalone** at the Angular 19 step, but standalone scaffolding is still scaffolding. Delete both at 2.0.0. |
| **P3** | ✅ **Fixed 2026-10-15** — `BLOOMSIGHT_CONFIG` is an `InjectionToken<BloomsightConfig>`, annotated explicitly so the published type does not expand to the core's `IConfig`. *Was:* `@Inject('bloomsightConfig')` — a **string** token. No type safety, and it collides with anything else using that string. |
| **P4** | ✅ **Fixed 2026-10-15** — `sendMail(request)` takes named fields and returns a cold `Observable<void>`. **Correction:** `templateOwnerId` is *not* an internal — the standalone server needs it (it goes out as `userId`), so it stays, as a required field. *Was:* `sendMail()` takes seven positional arguments plus success/error callbacks rather than an `Observable`. |
| **P5** | ✅ **Fixed 2026-10-15** — `provideBloomsight()` is the only way in, and the library has no NgModule left. *Was:* No `provideBloomsight()`. `NgModule.forRoot()` is the only way in — and since the component went standalone at 19, this is now **the library's only remaining NgModule coupling**. A standalone app has to reach for `importProvidersFrom(NgxBloomsightModule.forRoot(config))`, which works but is the interop shim rather than the idiomatic path. |
| **P6** | ✅ **Fixed in `bloomsight.js` 2026-10-12** (`55ece65`), pending release as 0.9.0. The enum is now exported as a value from the core's root, and `sendEmail` accepts `EmailEngineTypeEnum | `${EmailEngineTypeEnum}`` so a plain `'GMAIL'` needs no cast. **Correction to what this entry used to claim:** it did *not* silently route mail to SMTP for the library itself — the minifier inlined the member comparison to a string literal, so internal routing was always correct. The breakage was entirely consumer-side: the enum was importable from nowhere. |

---

## 3. Angular currency

| | Current | Target |
|---|---|---|
| **A1** | ✅ **Done.** Angular **22.2.2**, TypeScript **6.0.3**, zone.js 0.15.1, Node 24.18.0 (was 14.2 / 4.7 / 0.11 / v20 pin). Nine majors, no `--force`, compatibility floor unmoved at 14.0.0 — see UPGRADE-LOG.md | — |
| **A2** | ✅ **Done 2026-10-15** — no component, no NgModule; configuration is `provideBloomsight()`. *Was:* 🟡 **Half done.** `NgxBloomsightComponent` is `standalone: true` as of the 19 step, verified not to raise the published compatibility floor, and covered by tests on both consumption paths. Configuration is still module-only — see P5 | standalone-first, `provideBloomsight()` |
| **A3** | ✅ **Done 2026-10-15** — on the server nothing starts and every method is a no-op; `sendMail` completes rather than erroring, since an unhandled RxJS error can take down a Node process. The library's tests run zoneless (the Angular 22 TestBed default) and the demo app is zoneless (D6). *Was:* No SSR guard | `isPlatformBrowser` — `init()` currently runs during server render. **Also verify under zoneless:** Angular 21's `bootstrap-options-migration` added an explicit `provideZoneChangeDetection()` to the demo app, which shows the framework default is moving away from zones. Nothing in the library depends on change detection, but 2.0.0 should be tested under `provideExperimentalZonelessChangeDetection()` rather than assumed |
| **A4** | ✅ **Done 2026-10-15** — `takeUntilDestroyed` (see B4). *Was:* Manual subscription handling | `takeUntilDestroyed` / `DestroyRef` |
| **A5** | ✅ **Done** at the Angular 17 step by the `update-workspace-config` migration | `buildTarget` |
| **A6** | ✅ **Done 2026-10-15.** The demo app builds with `@angular/build:application`, via the official `use-application-builder` migration, declined six times during the Angular upgrade and never forced. The library builds with `@angular/build:ng-packagr`. `@angular-devkit/build-angular` is removed from the workspace | — |
| **A7** | ✅ **Done 2026-10-15.** Both projects test with `@angular/build:unit-test` + Vitest + jsdom; Karma, Jasmine and Zone.js are uninstalled. The `migrate-karma-to-vitest` schematic refuses library projects; the builder itself handles them when configured directly. Coverage via `npm run test:coverage` (v8 provider) | — |
| **A8** | ✅ **Decided 2026-10-15: no signals in the library.** Nothing in it is state a template reads; `errors$` is a stream of events, and an app that wants a signal writes `toSignal(bloomsight.errors$)`. *Was:* No signals | signals where they earn their place |

---

## 4. Testing

- **T1** ✅ **Closed 2026-10-15.** Both services are under test, two ways. 31
  library unit tests mock the core with `vi.mock` and check every call the
  services make. 20 demo app integration tests run the **real** core with only
  `fetch` stubbed and check the actual requests. Every test was
  mutation-checked: two first drafts passed with the bug they targeted
  reintroduced, because Angular's router ignores same-URL navigation, and were
  rewritten. Library coverage went from 33% to 100% of functions, enforced at
  100% per file. Six findings (F1–F6) are recorded in RELEASE-2.0.0.md §2.0
- **T2** ✅ **Closed 2026-10-15.** The demo app and all its tests import
  `@bloomscorp/ngx-bloomsight`, which `tsconfig` maps to `dist/`, and `build`,
  `start` and `test` run `build-lib` first. Proven both ways: with the library
  source broken and `dist/` left stale, all 80 demo tests pass; rebuilt from the
  broken source, the two that cover it fail. *Was:* The demo app imports the library by **source path**
  (`projects/bloomscorp/ngx-bloomsight/src/public-api`), not by package name, so
  the built and published artifact is never smoke-tested. The `tsconfig` path
  mapping to `dist/` exists and is bypassed.
- **T3** 🔄 **Built 2026-10-15** — `ci.yml` runs every gate on push to `main` and `feat/**` and on pull requests; green in a fresh-clone simulation, first real run pending a push. *Was:* No CI. Nothing runs on push.

---

## 5. Release pipeline

- **R1** ✅ **Built 2026-10-15** — `release.yml` publishes from CI on a `v*` tag, via npm trusted publishing with provenance, after every gate (RELEASE-2.0.0.md §6). *Was:* No workflows. Publishing is a manual `cd dist/bloomscorp/ngx-bloomsight && npm publish`.
- **R2** ✅ **Fixed** (`60ecc44`, with B5; the GitHub release moved to CI in §6). *Was:* `npm.publish: false` with `github.release: true` and no token — the same
  half-finished-release trap `bloomsight.js` had, where it commits and tags and
  then fails.
- **R3** ✅ **Fixed** (`60ecc44`). *Was:* `requireCleanWorkingDir: false` plus `git add --all` in `before:init`,
  which sweeps unrelated work into the release commit.
- **R4** ✅ **Fixed** with B5, and now also checked in CI and against the tag at release. *Was:* Plus **B5**: the version that gets published is not the one that gets
  tagged.

`bloomsight.js` has just been through all of this. Mirror what it ended up with:
local `release-it` bumps, tags and pushes; CI publishes via npm **trusted
publishing** (OIDC — no stored token) and cuts the GitHub release; a packaging
gate asserts the tarball contains what it should.

---

## 6. Target API

```ts
// app.config.ts
providers: [
  provideBloomsight({
    propertyToken: '65d72f0b5e990c6028790156',
    target: 'blooms-ai',
    trackPageViews: true,
  }),
]
```

```ts
private readonly bloomsight = inject(BloomsightService);

this.bloomsight.track(CHECKOUT_STARTED);
this.bloomsight.trackData(PLAN_SELECTED, { plan: 'pro' });
this.bloomsight.sendMail({ engineId, templateId, data }).subscribe();
this.bloomsight.errors$.subscribe(e => this.logger.warn(e));
```

- `BLOOMSIGHT_CONFIG`, a real `InjectionToken`
- `provideBloomsight()` returns `EnvironmentProviders` and initialises **once**,
  from an app initializer rather than a constructor (fixes B1, B7, B8)
- one root service; SSR-safe; `errors$` surfaces the core's `onError`
- page views use `urlAfterRedirects` and `takeUntilDestroyed` (B3, B4), and
  disable themselves with a single warning under `target: 'blooms-ai'`, which
  has no page-view endpoint
- the scaffolding component and empty service are deleted (P2)
- everything imported from the core's package root (P1)

> **Built 2026-10-15** (RELEASE-2.0.0.md §2.1 has the full decision table).
> Where the result differs from this sketch: there is no `trackPageViews`
> option — page views follow the router, and the existing `stopPageViewEvent`
> is the off switch; `label` is gone (F1); `templateOwnerId` is required (P4);
> and on blooms.ai the page-view notice is a debug-only log, not a warning.

**Clean break at 2.0.0.** Every consumer is ours, so carrying the old DI contract
costs more than it saves, and a major is honest about what changed.

### A tool the upgrade turned up

`@angular/core@18` ships an `inject-migration` schematic that did not exist at
17:

```bash
ng generate @angular/core:inject-migration
```

It rewrites constructor-based injection as `inject()` calls, which is precisely
the shape the API above wants. The four constructors it would touch are
`ngx-bloomsight.component.ts`, `ngx-bloomsight.service.ts` (both CLI
scaffolding, both deleted by this rewrite) and the two real services,
`bloomsight-mail.service.ts` and `bloomsight-event.service.ts`.

So it is worth running **during 2.0.0, after the scaffolding is deleted** — not
as part of the version climb, where it would rewrite code that is about to be
removed. Noted here rather than in UPGRADE-LOG.md's deferred-migrations table
because it is a tool for the rewrite, not a migration being skipped.

---

## 7. Order of work

0. ~~Cheap bug fixes~~ — ✅ done 2026-10-12: B1, B2, B3, B5. Unreleased.
1. **Workspace to Angular 22** — see below. Needs Node `^22.22.3 || ^24.15.0 ||
   >=26` first; `.node-version` in this repo still says `v20`.
2. **Core fixes** — P6 and confirming the root exports (P1's other half). Both
   are in `bloomsight.js` and independent of Angular.
3. **Rewrite the public API** — §6, which fixes B1, B3, B4, B6, B7, B8, P2–P5.
4. **Fix packaging** — B2 peers, B5 version sync.
5. **Tests** — real coverage for the services, and have the demo app consume the
   **built package** so the artifact is exercised (T1, T2).
6. **Pipeline** — CI, trusted publishing, packaging gate (R1–R4).

### On the upgrade itself

**Incremental `ng update`, 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22, one commit
per major.** The library code stays untouched throughout; the API rewrite is a
separate change on top, so if the rewrite goes badly there is still a working
library on Angular 22.

Regenerating the workspace at 22 and moving the sources across was considered and
rejected. It produces one enormous diff where a config regression hides easily,
and its main advantage — landing on current builder config with no deprecated
keys — mostly evaporates because the CLI's own migrations handle the
`browserTarget` → `buildTarget` rename and offer the application-builder move.

Expect the chain to stall somewhere on old peer ranges — `zone.js`, `rxjs 7.5`,
`typescript 4.7`, `ng-packagr`. Stop and look rather than reaching for
`--force`.
