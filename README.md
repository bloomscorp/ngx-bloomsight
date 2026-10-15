# ngx-bloomsight

The Angular wrapper for [`@bloomscorp/bloomsight.js`](https://github.com/bloomscorp/bloomsight.js),
published as [`@bloomscorp/ngx-bloomsight`](https://www.npmjs.com/package/@bloomscorp/ngx-bloomsight).

[![CI](https://github.com/bloomscorp/ngx-bloomsight/actions/workflows/ci.yml/badge.svg)](https://github.com/bloomscorp/ngx-bloomsight/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE.md)

**Using the library?** Everything an app needs is in the
[package README](./projects/bloomscorp/ngx-bloomsight/README.md). Upgrading from
1.x: [MIGRATION.md](./MIGRATION.md).

This page is for working on the library itself.

## What is here

| Path | |
|---|---|
| `projects/bloomscorp/ngx-bloomsight/` | **The library**: the source, its own `package.json` (the one npm publishes) and the package README |
| `src/` | **The demo app**: every feature on screen, and the integration tests that run the real SDK |
| `scripts/` | The checks CI and releases run (see below) |
| `RELEASE-2.0.0.md` | The 2.0.0 plan and live tracker |
| `MODERNISATION.md` | The audit behind 2.0.0, item by item |
| `UPGRADE-LOG.md` | The Angular 14 → 22 upgrade, one major at a time |
| `RELEASING.md` | How a release is cut and published |

The root `package.json` is the private workspace. What npm publishes is
`dist/bloomscorp/ngx-bloomsight/`, built from the library folder.

## Setup

Node from `.node-version` (24.18.0). Angular 22's CLI refuses anything older than
22.22.3 or 24.15.0.

```bash
npm ci
```

## Everyday commands

| Command | |
|---|---|
| `npm start` | Builds the library, then serves the demo app at http://localhost:4200 |
| `npm test` | Builds the library, then runs both test suites (Vitest, jsdom) |
| `npm run test:coverage` | The same with coverage, and the library's **100% per file** threshold enforced |
| `npm run build` | Builds the library, then the demo app against it |
| `npm run build-lib` | Builds the library alone, into `dist/bloomscorp/ngx-bloomsight/` |

The demo app imports the library by its package name, which `tsconfig.json` maps
to `dist/`. So it, and its tests, always run the **built** package, as a real
app would. That is why `start`, `test` and `build` build the library first.

### The demo app

It starts in `logOnly`: it runs everything and sends nothing, and says so in the
header. Its Settings page edits every configuration field, saved in your
browser and applied by reloading. The activity panel shows every request the
SDK makes and every line it logs.

To send real events, turn `logOnly` off and enter a real property token on the
Settings page.

## Checks

Each runs in CI on every push, and again before a release is tagged.

| Command | Fails when |
|---|---|
| `npm run test:coverage` | a test fails, or a library file drops below 100% coverage |
| `npm run check-version` | the library's version differs from the workspace's |
| `npm run verify:facade` | any file in the demo app imports `@bloomscorp/bloomsight.js`. Apps talk to this library only |
| `npm run verify:package` | the packed tarball is wrong: missing files, broken manifest pointers, missing provenance metadata, the core's names leaking into the published types, an undeclared dependency |
| `npm run verify:compat` | any Angular major in the peer range (19–22) cannot link or type-check the packed library. Needs network |

## Tests

| Where | What they prove |
|---|---|
| `projects/…/src/lib/*.spec.ts` | Unit tests, with the SDK mocked: what the library asks the SDK to do |
| `src/app/bloomsight-integration/` | The real SDK, with only `fetch` stubbed: the actual requests an app sends |
| `src/app/**/*.spec.ts` | The demo app, driven through its UI against the built library |

The suites are mutation-checked: the bugs they guard against were put back,
one at a time, and each was caught. Hold new tests to the same bar: a test is
only done once breaking the code it covers makes it fail.

## Releasing

```bash
npm run release
```

From `main`, with a clean tree. CI does the publishing. See
[RELEASING.md](./RELEASING.md).

## Rules worth knowing

- **The facade rule.** An Angular app never imports `@bloomscorp/bloomsight.js`.
  If an app needs something from the SDK, export it, or an alias of it, from
  this library.
- **The library may only use Angular 19 APIs.** The peer range starts at 19, so
  anything newer breaks it for some supported apps. The demo app can use
  anything.
- **Annotate public constants with this library's own types.** Otherwise the
  published types can name the SDK's type instead. `verify:package` catches it.

## License

[MIT](./LICENSE.md)
