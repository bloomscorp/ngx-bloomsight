# 2.1.0 — the email switch

Tracker and design record for 2.1.0. Same rules as `RELEASE-2.0.0.md`: written
before the code, then kept in step with what was built.

## Why

bloomsight.js 0.10.0 gave email its own switch, independent of the events
`target`: `configureEmail({ target: 'blooms-ai' })`, or `emailTarget` /
`emailApiBase` in `init`'s config (bloomsight.js MIGRATION.md, "Moving email").
Email is moved project by project, and separately from events, because it is
the riskier half: a wrong setting loses customers' mail, not page counts.

ngx-bloomsight 2.0.0 cannot use that switch for the apps that need it most.
`provideBloomsight()` always starts event tracking, so it needs a property
token and watches the router. **An app that only sends mail has no way in.**
thecropcircle.in is such an app: seven forms, no events. That is why it calls
the script-tag bundle through `window` instead of using this library (blooms-ai
`documentation/bloomsight/email-pilot.md`, D3).

## Rule: the core does the work

This package stays a wrapper. Where email goes, how the request is built, the
endpoint, and the error reporting all stay in bloomsight.js. 2.1.0 only gives
Angular apps a way to reach `configureEmail()` and the `init` fields, and keeps
the facade rule: an app imports nothing from `@bloomscorp/bloomsight.js`.

## Design

### D1. `provideBloomsightMail(config?)`: for apps that only send mail

```ts
// app.config.ts
providers: [
  provideRouter(routes),
  provideBloomsightMail({ target: 'blooms-ai' })   // remove, or 'bloomsight', to go back
]
```

- An app initializer calls the core's `configureEmail(config)` once, in the
  browser. It does not call `init()`, needs no property token, and does not
  watch the router. Nothing is sent at startup.
- `BloomsightService` works with it. `sendMail()` behaves exactly as under
  `provideBloomsight()`.
- `track()` and `trackData()` do nothing, and warn once in the console, since
  nothing was set up to receive events.
- With no config, or `target: 'bloomsight'`, mail goes to the standalone server,
  as it does today.

### D2. `BloomsightMailConfig`

The core's `IEmailConfig` (`target`, `apiBase`, `onError`, `debug`), under this
package's name, plus one field the wrapper handles itself:

| Field | Default | |
|---|---|---|
| `target` | `'bloomsight'` | `'blooms-ai'` sends mail to blooms.ai |
| `apiBase` | `https://z.bloomscorp.com` | blooms.ai only: the API origin |
| `onError` | — | blooms.ai only: every mail failure, with the server's code |
| `debug` | `false` | Full logging of sends |
| `logOnly` | `false` | The wrapper logs the mail and sends nothing, and `sendMail()` still succeeds. The core's `logOnly` exists only through `init()`, so a mail-only app needs this one for its tests |

### D3. Apps that use events too

No new API is needed. `BloomsightConfig` is the core's `IConfig`, which since
0.10.0 has `emailTarget` and `emailApiBase`. `provideBloomsight()` passes them
to `init()`:

```ts
provideBloomsight({ propertyToken: '…', isDevelopmentMode: false, emailTarget: 'blooms-ai' })
```

Events and mail stay independent, so `target` moves events and `emailTarget`
moves mail. Either can move first.

Use one provider, not both. If an app does call both, the core's precedence
applies: `configureEmail()` (here, `provideBloomsightMail`) wins over `init`'s
`emailTarget`.

### D4. Mail errors

- `sendMail()` errors with `code: 'MAIL_FAILED'`, as in 2.0.0, on both servers.
- On blooms.ai, the core also reports each mail failure to `onError`, with the
  server's own code (`TEMPLATE_NOT_FOUND`, `SUBSCRIPTION_SUSPENDED`,
  `NETWORK_FAILURE`, …), and so to `errors$`. 2.0.0's README said mail failures
  never reach `errors$`. That was true while mail could only go to the
  standalone server, which reports nothing. The README is corrected, not the
  behaviour: the code is the one thing that tells a failing cutover apart.

### D5. Version

- Peer `@bloomscorp/bloomsight.js` becomes `>=0.10.0 <1.0.0`, since `configureEmail`
  exists only from 0.10.0. The dev dependency moves to `^0.10.0`.
- A minor release: nothing in 2.0.0 is removed or changes for an app on the
  standalone server.
- Public runtime surface: `provideBloomsight`, `provideBloomsightMail`,
  `BLOOMSIGHT_CONFIG`, `BloomsightService`. New type: `BloomsightMailConfig`.

## Tests

- **Library unit tests** (core mocked): the initializer calls `configureEmail`
  once with the config, not `init`; nothing runs on the server; the service
  works without `provideBloomsight`; `track` is a no-op and warns once;
  `logOnly` succeeds without calling the core; the error when neither provider
  was called; the public surface pin.
- **Demo integration tests** (real core, `fetch` stubbed): with
  `provideBloomsightMail({ target: 'blooms-ai' })` the send posts the multipart
  form to `https://z.bloomscorp.com/api/bloomsight/email/send`; with no config
  it posts to the standalone Gmail endpoint; `emailTarget` through
  `provideBloomsight` moves mail and not events; a rejected send errors
  `MAIL_FAILED` and `onError` gets the server's code.
- **The existing gates**: `verify:facade`, `verify:package`, `verify:compat`
  (Angular 19–22).

## Moving thecropcircle.in

1. Install `@bloomscorp/ngx-bloomsight@^2.1.0` and `@bloomscorp/bloomsight.js@^0.10.0`.
2. `app.config.ts`: `provideBloomsightMail({ target: 'blooms-ai' })`.
3. Each form injects `BloomsightService` and calls `sendMail()`, keeping its
   own success and failure handling. The seven copies of `BloomsightWindow` go.
4. `index.html`: the script tag and the `configureEmail` line go. The library is
   bundled now, so a CDN outage no longer stops the forms.
5. Test locally with every outside request intercepted. Then a live
   `test-bloomscorp` submission after the deploy.

## Progress

| | Step | |
|---|---|---|
| 1 | This design | ✅ |
| 2 | Build + tests: library 72, demo 90, 100% coverage, 9 mutations caught, Angular 19–22 compat | ✅ |
| 3 | Docs: README, MIGRATION | ✅ |
| 4 | Release 2.1.0 | |
| 5 | thecropcircle.in moved and tested: with the packed build before release, production build in Chrome, all 7 forms and every Razorpay outcome, 115 checks, nothing leaving the machine | ✅ |
| 6 | Live | |
