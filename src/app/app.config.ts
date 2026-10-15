import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';
import {provideBloomsight} from '@bloomscorp/ngx-bloomsight';

import {routes} from './app.routes';
import {Activity} from './activity/activity';
import {DEMO_SETTINGS, DemoSettings, toBloomsightConfig} from './demo-settings';

/**
 * The whole app's configuration, built from the saved settings.
 *
 * `provideBloomsight()` is the only thing it takes from the library. The demo
 * imports nothing from `@bloomscorp/bloomsight.js` — `npm run verify:facade`
 * fails the build if it ever does.
 */
export function appConfig(settings: DemoSettings, activity: Activity): ApplicationConfig {
	return {
		providers: [
			provideBrowserGlobalErrorListeners(),
			provideZonelessChangeDetection(),
			provideRouter(routes, withComponentInputBinding()),
			{provide: Activity, useValue: activity},
			{provide: DEMO_SETTINGS, useValue: settings},
			provideBloomsight(toBloomsightConfig(settings, (error) =>
				activity.record('on-error', `onError: ${error.code}`, error.message)
			))
		]
	};
}
