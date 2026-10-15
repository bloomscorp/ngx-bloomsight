# Migrating from ngx-bloomsight 1.x to 2.0.0

2.0.0 replaces the module and the two services with one provider and one
service. The events, page views and mail your app records are the same; the way
your code asks for them changes.

Most apps need about ten minutes: one change to the setup, then a find-and-replace
over the call sites. The one change that needs care is
[mail](#4-mail-subscribe-or-nothing-is-sent), which now sends only when
subscribed.

## Before you start

| | 1.x | 2.0.0 |
|---|---|---|
| Angular | declared `^14.2.0` | **19, 20, 21 or 22** |
| `@bloomscorp/bloomsight.js` | `>=0.7.0 <1.0.0` | **`>=0.9.2 <1.0.0`** |

An app on Angular 18 or older has to upgrade Angular first.

**Do this upgrade on its own.** If the app is also moving to blooms.ai, upgrade
the library first while keeping `target` as it is, check events still arrive,
and only then change `target`. If something goes wrong, you will know which
change caused it.

To find everything that has to change:

```bash
grep -rnE "NgxBloomsightModule|BloomsightEventService|BloomsightMailService|lib-ngx-bloomsight|@bloomscorp/bloomsight.js" src/
```

## 1. Install

```bash
npm install @bloomscorp/ngx-bloomsight@^2.0.0 @bloomscorp/bloomsight.js@^0.9.2
```

## 2. Replace `forRoot()` with `provideBloomsight()`

The configuration object itself does not change: move it across as it is.

**An app with an `AppModule`:**

```ts
// before
@NgModule({
  imports: [
    NgxBloomsightModule.forRoot({propertyToken: '…', isDevelopmentMode: false})
  ]
})

// after
@NgModule({
  providers: [
    provideBloomsight({propertyToken: '…', isDevelopmentMode: false})
  ]
})
```

It moves from `imports` to `providers`.

**A standalone app (`bootstrapApplication`):**

```ts
// before
providers: [importProvidersFrom(NgxBloomsightModule.forRoot({propertyToken: '…', isDevelopmentMode: false}))]

// after
providers: [provideBloomsight({propertyToken: '…', isDevelopmentMode: false})]
```

Then:

- **Remove `NgxBloomsightModule.forRoot()` everywhere.** If a lazy-loaded module
  imported it as well, delete that import outright. In 1.x it started a second
  copy of the SDK.
- **Remove `<lib-ngx-bloomsight>` from your templates,** if it is anywhere.
  It rendered "ngx-bloomsight works!" and nothing else.

## 3. Events: two services become one

Inject `BloomsightService` wherever you injected `BloomsightEventService` or
`BloomsightMailService`.

| 1.x | 2.0.0 |
|---|---|
| `BloomsightEventService`, `BloomsightMailService` | `BloomsightService` |
| `resolveSimpleEvent(token)` | `track(token)` |
| `resolveSimpleEvent(token, label)` | `track(token)`: drop the label |
| `resolveDataEvent(token, data)` | `trackData(token, data)` |
| `resolveDataEvent(token, data, label)` | `trackData(token, data)`: drop the label |
| `pageViewObserver()` | delete the call |
| `init()` | delete the call |

```ts
// before
constructor(private bloomsight: BloomsightEventService) {}
this.bloomsight.resolveSimpleEvent('65d735b122354c8ba6a489c2', 'Contact Us CTA');

// after
private readonly bloomsight = inject(BloomsightService);
this.bloomsight.track('65d735b122354c8ba6a489c2');
```

**About the label.** No version of Bloomsight ever stored it. Neither backend
put it in what they sent. Dropping it loses no data.

**About `pageViewObserver()` and `init()`.** In 2.0.0 the SDK starts and
watches the router by itself. A 1.x app that called `pageViewObserver()` itself
was recording every page view twice.

## 4. Mail: subscribe, or nothing is sent

`sendMail` takes one object instead of seven arguments, and returns an
`Observable` instead of taking callbacks.

```ts
// before
this.mail.sendMail(
  engineId, templateId, templateOwnerId, formData,
  () => this.sent = true,
  () => this.failed = true,
  'CUSTOM_SMTP'
);

// after
this.bloomsight.sendMail({
  engineId,
  templateId,
  templateOwnerId,
  data: formData,
  engine: 'CUSTOM_SMTP'          // optional; defaults to 'GMAIL', as before
}).subscribe({
  next: () => this.sent = true,
  error: () => this.failed = true
});
```

> ⚠️ **Nothing is sent until you subscribe.** This is how `HttpClient` works
> too, and it is the easiest thing to miss in this migration: a `sendMail({…})`
> with no `.subscribe()` compiles, runs and sends nothing.

| 1.x argument | 2.0.0 field |
|---|---|
| `engineId` | `engineId` |
| `templateId` | `templateId` |
| `templateOwnerId` | `templateOwnerId` |
| `emailMetaData` | `data` |
| `onSuccess` | `next` in `subscribe` |
| `onError` | `error` in `subscribe`. It now receives a `BloomsightError` (`code: 'MAIL_FAILED'`) |
| `engineType` | `engine` |

Named fields also fix a 1.x hazard. The first three arguments were all strings,
so swapping two compiled cleanly and sent the wrong template.

## 5. Types

Import every type from `@bloomscorp/ngx-bloomsight`, and remove any import of
`@bloomscorp/bloomsight.js` from your app:

| If you imported this from `@bloomscorp/bloomsight.js` | Use this from `@bloomscorp/ngx-bloomsight` |
|---|---|
| `IConfig` | `BloomsightConfig` |
| `IBloomsightError` | `BloomsightError` |
| `EmailEngineTypeEnum.GMAIL` | `'GMAIL'`, typed as `BloomsightEmailEngine` |

The app still installs `@bloomscorp/bloomsight.js`, because the library needs
it. Only the imports go.

## What behaves differently

None of these needs a code change, but you may notice them:

- **Page-view counts may drop slightly.** A view is recorded by the URL the user
  lands on after redirects, and only when the destination changes. 1.x counted a
  link that redirected back to the current page as a new view.
- **Page views start with the app.** In 1.x they started only once something
  injected `BloomsightEventService`, so an app that injected it late, or only
  in a lazy route, missed views until then.
- **A startup failure no longer breaks the page.** In 1.x an error while the SDK
  started could stop the component that injected the service from being
  created. Now the app carries on without the SDK, and the failure goes to
  `onError` and the console.
- **`logOnly` mail completes.** In 1.x, under `logOnly`, neither callback was
  ever called, so a "sending…" state waited forever. The Observable now emits
  and completes.
- **Server-side rendering is safe.** Nothing runs on the server.
- **New: `errors$`.** On blooms.ai, every failed request is reported on
  `BloomsightService.errors$` as well as to `onError`.

## Checklist

- [ ] Angular 19 or newer, and `@bloomscorp/bloomsight.js` ≥ 0.9.2
- [ ] `provideBloomsight()` once, in the root providers; no `NgxBloomsightModule` left
- [ ] No `<lib-ngx-bloomsight>`
- [ ] `BloomsightService` everywhere; `track` / `trackData`; no labels
- [ ] No `pageViewObserver()` or `init()` calls
- [ ] Every `sendMail({…})` is subscribed
- [ ] No imports of `@bloomscorp/bloomsight.js` in `src/`
- [ ] Events and page views still arrive on the dashboard. Try it first with
      `logOnly: true` and `isDevelopmentMode: true`, which log instead of sending

The [README](https://github.com/bloomscorp/ngx-bloomsight/blob/main/projects/bloomscorp/ngx-bloomsight/README.md)
documents the full 2.0.0 API.
