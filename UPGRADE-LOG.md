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
| 15 | `^14.20.0 \|\| ^16.13.0 \|\| >=18.10.0` | ✅ satisfies |
| 22 | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | ❌ needs bump |

`fnm` already has `v22.23.2` and `v24.18.0` installed, so it is a one-line
`.node-version` change when the time comes.

---

## Optional migrations — declined during the climb, revisit later

Recorded as they are offered. Nothing here has been applied.

| Angular | Migration | Why deferred |
|---|---|---|
| _(none yet)_ | | |

---

## 14 → 15

_In progress._
