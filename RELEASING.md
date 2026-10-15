# Releasing `@bloomscorp/ngx-bloomsight`

## Releasing

```bash
npm run release
```

That is the whole local procedure. `release-it` will:

1. run every gate — `git pull`, `npm run build`, `npm run test:coverage`,
   `npm run check-version`, `npm run verify:facade`, `npm run verify:package`,
   `npm run verify:compat` — and stop at the first failure, before anything is
   tagged
2. work out the next version from the conventional commits since the last tag
   (`feat:` → minor, `fix:` → patch, `feat!:` or `BREAKING CHANGE:` → major)
3. write it to the root `package.json`, then copy it into the library's
   `package.json` (`sync-version`) and rebuild, so the tag and the published
   package can never disagree (B5)
4. update `CHANGELOG.md`
5. commit `chore: release vX.Y.Z`, tag `vX.Y.Z`, and push both

Pushing the tag triggers **`.github/workflows/release.yml`**, which does the
rest on a fresh checkout: every gate again, a check that the tag matches the
built package's version, `npm publish --provenance` from `dist/`, and the
GitHub release. A prerelease version (`2.1.0-rc.1`) is published under the
`next` dist-tag, never `latest`.

### Requirements

- You are on `main` and up to date, with a clean working tree. Commit or stash
  anything in progress first.
- Node from `.node-version`, and network access (`verify:compat` installs each
  Angular major).
- Nothing else. **There is no publish secret to manage.**

### What gets published

`dist/bloomscorp/ngx-bloomsight/` — ng-packagr's output, with the **library's**
`package.json` (`projects/bloomscorp/ngx-bloomsight/package.json`), not the
root one. The root `package.json` is the private workspace.

`npm run verify:package` packs that folder exactly as `npm publish` will and
checks the tarball: the files, every manifest pointer, the versions, the
provenance metadata, the published types and the declared dependencies. Its
header comment lists what each check guards against.

The library folder holds a **copy** of `LICENSE.md`, because ng-packagr cannot
copy files from outside it. `verify:package` fails if the copy drifts from the
repository's.

## Publishing credentials

Publishing uses an npm **trusted publisher** (OIDC), configured on the package
to accept this repository and the `release.yml` workflow. npm mints a
short-lived token per run from the workflow's `id-token: write` permission, so
there is no credential to store, rotate or have silently expire. The GitHub
release uses `GITHUB_TOKEN`, which Actions provides automatically.

That is also why releasing lives in CI and not on a laptop: locally there is no
OIDC identity and no `GITHUB_TOKEN`. Before 2.0.0 every release was a manual
`cd dist/bloomscorp/ngx-bloomsight && npm publish` (R1), and a `release-it` set
to create the GitHub release without a token committed and tagged, then failed
(R2).

**A trusted publisher mismatch looks like a 404.** If the organisation,
repository or workflow filename on npm differ from GitHub's in any way —
`release.yaml` for `release.yml` was enough, at 2.0.0 — npm answers the upload
with `E404 … could not be found or you do not have permission`, after the
provenance statement has already been signed. npm does not allow editing the
filename: delete the entry, create it again, then **Re-run failed jobs** on the
same Release run. No new tag is needed, because nothing was published.

**Provenance needs `repository` in the published manifest.** npm checks that
`repository.url` names the GitHub repository the workflow ran in, and rejects
the publish otherwise. `verify:package` checks it before publishing.

Trusted publishing needs **npm ≥ 11.5.1**. Node 24.18 bundles 11.16; the
release workflow asserts the version, so moving `.node-version` to a Node with
an older npm fails before the publish step rather than at it.

## Afterwards

```bash
npm view @bloomscorp/ngx-bloomsight version
```

`ETARGET` from `npm install` straight after a publish is the npm CDN catching
up, not a broken release. Poll `npm view` for a few minutes before concluding
anything.

## Known and accepted: `npm audit`

As of 2026-10-15, `npm audit` reports **6 high-severity issues, all one
chain**: `release-it` → `proxy-agent` → `pac-proxy-agent` → `get-uri` →
`basic-ftp` ≤ 6.2.0, a CPU denial of service in its FTP directory-listing
parser ([GHSA-c475-qrg2-pj4r](https://github.com/advisories/GHSA-c475-qrg2-pj4r)).

- **Dev-only.** It is release tooling; nothing a consumer installs is affected —
  `npm audit --omit=dev` reports **0**.
- **Unreachable here.** That code runs only when `release-it` fetches a proxy
  auto-config file over `ftp://`.
- **No upstream fix yet.** The newest `get-uri` (8.0.1) still requires
  `basic-ftp` 5, and npm's suggested fix is downgrading `release-it` to 15.
  Forcing `basic-ftp` 6 with an override would swap a major version under a
  code path nothing here exercises. Revisit when `get-uri` moves to `basic-ftp`
  6.

The same upgrade took the count from 19 (2 critical, 11 high) to these 6.
