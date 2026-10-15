# @bloomscorp/ngx-bloomsight

Bloomsight analytics for Angular: events, page views, mail and failure
reporting, through one provider and one service.

It wraps [`@bloomscorp/bloomsight.js`](https://www.npmjs.com/package/@bloomscorp/bloomsight.js)
and works with both backends: the standalone Bloomsight server, and Bloomsight
inside blooms.ai.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/bloomscorp/ngx-bloomsight/blob/main/LICENSE.md)

> **Upgrading from 1.x?** 2.0.0 replaces `NgxBloomsightModule.forRoot()` and the
> two services. See the [migration guide](https://github.com/bloomscorp/ngx-bloomsight/blob/main/MIGRATION.md).

## Requirements

| | Supported |
|---|---|
| Angular (`@angular/core`, `common`, `router`) | **19, 20, 21, 22**. CI compiles the published package with each of them |
| `@bloomscorp/bloomsight.js` | `>=0.9.2 <1.0.0` |
| RxJS | 7 or 8 |

## Install

```bash
npm install @bloomscorp/ngx-bloomsight @bloomscorp/bloomsight.js
```

`@bloomscorp/bloomsight.js` is a peer dependency: install it, but never import
it. Everything your app needs comes from `@bloomscorp/ngx-bloomsight` (see
[Types](#types)).

## Set up

Call `provideBloomsight()` once, in the application's root providers:

```ts
// app.config.ts
import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideBloomsight} from '@bloomscorp/ngx-bloomsight';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideBloomsight({
      propertyToken: '65d72f0b5e990c6028790156',
      isDevelopmentMode: false
    })
  ]
};
```

An app that still bootstraps an `AppModule` puts the same call in that module's
`providers`:

```ts
@NgModule({
  // …
  providers: [provideBloomsight({propertyToken: '…', isDevelopmentMode: false})]
})
export class AppModule {}
```

That is all the setup. The SDK starts when the app starts, page views are
recorded from the router, and `BloomsightService` can be injected anywhere,
including lazy-loaded routes.

Call it **once**, in the root providers: not in a lazy route's `providers`, and
not in a component.

## Configuration

| Field | Type | Default | What it does |
|---|---|---|---|
| `propertyToken` | `string` | **required** | The property's token. Never regenerate it: the token is how events are attributed |
| `isDevelopmentMode` | `boolean` | **required** | Logs everything to the console, and skips checking the property against the page's host. Never ship `true` to production |
| `target` | `'bloomsight'` \| `'blooms-ai'` | `'bloomsight'` | Which backend receives events. See [Moving to blooms.ai](#moving-to-bloomsai) |
| `apiBase` | `string` | `https://z.bloomscorp.com` | blooms.ai only: the API origin, for pointing a project at staging first |
| `logOnly` | `boolean` | `false` | Runs everything and sends nothing: each event and mail is logged instead. For demos, tests and dry runs |
| `debug` | `boolean` | `false` | blooms.ai only: full logging without `isDevelopmentMode` |
| `onError` | `(error: BloomsightError) => void` | — | Called for every failure the SDK reports. See [Errors](#errors) |
| `stopAll` | `boolean` | `false` | Records nothing |
| `stopSimpleEvent` | `boolean` | `false` | Records no simple events |
| `stopDataEvent` | `boolean` | `false` | Records no data events |
| `stopPageViewEvent` | `boolean` | `false` | Records no page views |

The SDK reads its configuration once, when the app starts.

## Events

```ts
import {Component, inject} from '@angular/core';
import {BloomsightService} from '@bloomscorp/ngx-bloomsight';

@Component({/* … */})
export class PricingComponent {
  private readonly bloomsight = inject(BloomsightService);

  contactUs(): void {
    this.bloomsight.track('65d735b122354c8ba6a489c2');
  }

  choosePlan(plan: string, seats: number): void {
    this.bloomsight.trackData('66d735b122355c8ba6a456f8', {plan, seats});
  }
}
```

| Method | Records |
|---|---|
| `track(eventToken)` | a simple event |
| `trackData(eventToken, data)` | a data event, with `data` as a JSON-serialisable object |

The event token comes from the Bloomsight dashboard, where the event is defined.

## Page views

Recorded automatically, with no code in your app:

- **Once per new destination.** A view is recorded each time a navigation lands
  somewhere new, by the URL the user ends up on after redirects. Following a
  link that redirects to the current page is not a new view
- **Standalone Bloomsight server only.** blooms.ai has no page-view endpoint, so
  with `target: 'blooms-ai'` the router is not watched at all
- **After two seconds.** The SDK records a view only once the visitor has spent
  two seconds on the page

`stopPageViewEvent: true` turns them off.

## Mail

```ts
import {BloomsightError, BloomsightService} from '@bloomscorp/ngx-bloomsight';

const data = new FormData();
data.append('name', form.name);
data.append('email', form.email);

this.bloomsight.sendMail({
  engineId: '66d735b122355c8ba6a456f8',
  templateId: '63d735h822355s6ba6a4556k',
  templateOwnerId: '61d895h922355b6ba6a4587a',
  data,
  engine: 'GMAIL'                      // or 'CUSTOM_SMTP'; defaults to 'GMAIL'
}).subscribe({
  next: () => this.sent.set(true),
  error: (error: BloomsightError) => this.failure.set(error.message)
});
```

| Field | Required | |
|---|---|---|
| `engineId` | ✅ | The mail engine, from the dashboard |
| `templateId` | ✅ | The template to render |
| `templateOwnerId` | ✅ | The user who owns the template |
| `data` | ✅ | The template's values; each field arrives as `metadata[<name>]` |
| `engine` | | `'GMAIL'` or `'CUSTOM_SMTP'`. Defaults to `'GMAIL'` |

The result behaves like `HttpClient`:

- **Nothing is sent until you subscribe**, and each subscription sends once
- It emits once and completes when the server accepts the mail
- It errors with a `BloomsightError` (`code: 'MAIL_FAILED'`) when the server
  rejects it or cannot be reached
- Under `logOnly` the mail is logged, not sent, and the result still emits and
  completes, so a "sending…" state is always released

Mail always goes to the standalone Bloomsight server, whatever `target` is set
to.

## Errors

On blooms.ai, every failed request is reported, with the server's own code
where there is one (`ORIGIN_REJECTED`, `UNKNOWN_PROPERTY`, `NETWORK_FAILURE`,
…). There are two ways to receive them:

```ts
// 1. In the configuration. Called for every failure, including at startup.
provideBloomsight({
  propertyToken: '…',
  isDevelopmentMode: false,
  target: 'blooms-ai',
  onError: (error) => monitoring.report(error)
});

// 2. As a stream, anywhere.
inject(BloomsightService).errors$.subscribe((error) => console.warn(error.code, error.message));

// …or the latest one as a signal, for a template.
readonly lastError = toSignal(inject(BloomsightService).errors$);
```

- **`errors$` only sees what comes after you subscribe.** It emits the failures
  that happen after that point, not earlier ones
- **A failed start doesn't stop your app.** If the SDK fails to start, the app
  keeps running without it. The failure (`INIT_FAILED`) is reported to `onError`
  and the console, on either target. It is not on `errors$`, because startup
  happens before anything can subscribe
- **Mail failures stay with the mail.** They are the error of that `sendMail()`
  call, not on `errors$`
- **The standalone server reports almost nothing.** There the SDK reports no
  request failures; only `INIT_FAILED` reaches `onError`

## Moving to blooms.ai

Change the target. The property token and every call site stay the same:

```ts
provideBloomsight({
  propertyToken: '65d72f0b5e990c6028790156',   // unchanged
  isDevelopmentMode: false,
  target: 'blooms-ai',
  apiBase: 'https://staging.example.com',      // optional: try staging first
  onError: (error) => monitoring.report(error)
});
```

On blooms.ai:

- events go to blooms.ai, and never to the standalone server
- page views are not collected
- mail is unchanged: it still goes to the standalone server
- failures are reported through `onError` and `errors$`

## Server-side rendering

Nothing runs on the server. The SDK starts in the browser, `track` and
`trackData` do nothing during server rendering, and `sendMail` completes without
sending.

## Types

Everything is exported from `@bloomscorp/ngx-bloomsight`:

| Export | |
|---|---|
| `provideBloomsight(config)` | Sets up the SDK |
| `BloomsightService` | `track`, `trackData`, `sendMail`, `errors$` |
| `BLOOMSIGHT_CONFIG` | Injection token holding the configuration the app started with |
| `BloomsightConfig` | The configuration |
| `BloomsightError` | `{code, message, status?, eventToken?}` |
| `BloomsightEmailEngine` | `'GMAIL' \| 'CUSTOM_SMTP'` |
| `BloomsightMailRequest` | What `sendMail` takes |
| `BloomsightEventData` | What `trackData` takes |

**Don't import `@bloomscorp/bloomsight.js` in your app.** If something you need
is not exported here, that's a gap in this library: please
[open an issue](https://github.com/bloomscorp/ngx-bloomsight/issues).

## Testing your app

Use `logOnly` in tests, so nothing is sent:

```ts
TestBed.configureTestingModule({
  providers: [provideBloomsight({propertyToken: 'test', isDevelopmentMode: false, logOnly: true})]
});
```

In a jsdom test environment (Vitest or Jest), the SDK reads `window.matchMedia`
at startup, and jsdom doesn't have it. Your tests still pass, but the SDK
reports `INIT_FAILED` and stays off. To run it for real, stub `matchMedia` in
your test setup file:

```ts
window.matchMedia ??= (query: string) => ({
  matches: false, media: query, onchange: null,
  addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false
}) as MediaQueryList;
```

## License

[MIT](https://github.com/bloomscorp/ngx-bloomsight/blob/main/LICENSE.md)
