# ngx-bloomsight

A client side angular library to work with bloomsight.io

## Badges

[![ License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE.md)

## Installation

Install using `npm` by running

```bash
npm install @bloomscorp/ngx-bloomsight
```

## Usage/Examples


### Configuration

Use the `app.module.ts` to configure the library.

```ts
import {NgxBloomsightModule} from '@bloomscorp/ngx-bloomsight';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgxBloomsightModule.forRoot({
            propertyToken: '65143f755c403e030c222340',
            developmentMode: true,
            stopService: false,
            ...
        }),
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

Below is the table with all the possible options that can be configured.

| Option                 | Type      | Description                                                                                                                                 | Mandatory | Default |
|:-----------------------|:----------|:--------------------------------------------------------------------------------------------------------------------------------------------|:----------|:--------|
| `propertyToken`        | `string`  | [bloomsight.io](https://bloomsight.io) property token                                                                                       | ✅         | NA      |
| `isDevelopmentMode`    | `boolean` | if `true`, then logs data in the browser console                                                                                            | ✅         | NA      |
| `observePageViaWebAPI` | `boolean` | if `true`, will detect page view event based on web APIs. However, if `false`, `pageViewObserver` should be used to trigger page view event | ❌         | `true`  |
| `stopSimpleEvent`      | `boolean` | stops only simple event tracking                                                                                                            | ❌         | `false` |
| `stopDataEvent`        | `boolean` | stops only data event tracking                                                                                                              | ❌         | `false` |
| `stopPageViewEvent`    | `boolean` | stops only page view event tracking                                                                                                         | ❌         | `false` |
| `stopAll`              | `boolean` | stops all event tracking                                                                                                                    | ❌         | `false` |
| `logOnly`              | `boolean` | tracks event but doesn't save to database. Should be used only when `isDevelopmentMode: true`                                               | ❌         | `false` |


## Page View Event
To tracking website visits for your angular application just initialize `BloomsightEventService` service in  `app.component.ts`.
```
import {BloomsightEventService} from '@bloomscorp/ngx-bloomsight';

constructor(public bloomsightService: BloomsightEventService) { }
```

### Simple Event

Use the `resolveSimpleEvent` method to log simple events

```ts
import {BloomsightEventService} from '@bloomscorp/ngx-bloomsight';

constructor(public bloomsightService: BloomsightEventService) { }

this.bloomsightService.resolveSimpleEvent('65d735b122354c8ba6a489c2');
```
| Option       | Type     | Description        | Mandatory | Default |
|:-------------|:---------|:-------------------|:----------|:--------|
| `eventToken` | `string` | Id of simple event | ✅         | NA      |


### Data Event

Use the `resolveDataEvent` method to log data events

```ts
import {BloomsightEventService} from '@bloomscorp/ngx-bloomsight';

constructor(public bloomsightService: BloomsightEventService) { }

this.bloomsightService.resolveDataEvent(
    '66d735b122355c8ba6a456f8', 
    {
        productId: 120,
        sku: 'PROD021298'
    }
);
```
| Option       | Type     | Description                              | Mandatory | Default |
|:-------------|:---------|:-----------------------------------------|:----------|:--------|
| `eventToken` | `string` | Id of data event                         | ✅         | NA      |
| `eventData`  | `Object` | additional metadata in key, value format | ✅         | NA      |


### Send Email

Use `sendEmail` method to send email

```ts
import {BloomsightEventService} from '@bloomscorp/ngx-bloomsight';

constructor(public bloomsightService: BloomsightEventService) { }

this.bloomsightService.sendEmail(
  '66d735b122355c8ba6a456f8', 
  '63d735h822355s6ba6a4556k',
  '61d895h922355b6ba6a4587a',
  ...
)
```

| Option            | Type       | Description                                                                                | Mandatory | Default |
|:------------------|:-----------|:-------------------------------------------------------------------------------------------|:----------|:--------|
| `engineId`        | `string`   | Id of the engine that will be used to send email                                           | ✅         | NA      |
| `templateId`      | `string`   | Id of the email template that will be used as email body                                   | ✅         | NA      |
| `templateOwnerId` | `string`   | Id of the user who has created the template                                                | ✅         | NA      |
| `emailMetaData`   | `FormData` | attachment & variables used in the template & their respective values in key, value format | ❌         | NA      |

## License

[MIT](./LICENSE.md)


## Support

Report issues or feature requests [here]()