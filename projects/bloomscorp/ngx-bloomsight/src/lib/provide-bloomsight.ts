import {EnvironmentProviders, makeEnvironmentProviders, provideAppInitializer} from '@angular/core';
import {BLOOMSIGHT_CONFIG} from './bloomsight-config.token';
import {startBloomsight} from './internal/start-bloomsight';
import {BloomsightConfig} from './type/bloomsight-config';

/**
 * Set up Bloomsight for an application. Call it once, in the root providers:
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideRouter(routes),
 *     provideBloomsight({ propertyToken: '…', isDevelopmentMode: false })
 *   ]
 * });
 * ```
 *
 * It provides the configuration and starts the SDK when the application starts.
 * Page views are then recorded from the router automatically, and
 * `BloomsightService` can be injected anywhere — including lazy-loaded routes,
 * and components that only send mail.
 *
 * Returns `EnvironmentProviders`, which Angular accepts only in an environment
 * injector — the application or a route — never in a component's `providers`.
 * That replaces 1.x's `NgxBloomsightModule.forRoot()`, whose services existed
 * only where the module was imported with `forRoot()` (B6), and twice if a
 * lazy module imported it again (B7).
 */
export function provideBloomsight(config: BloomsightConfig): EnvironmentProviders {
	return makeEnvironmentProviders([
		{provide: BLOOMSIGHT_CONFIG, useValue: config},
		provideAppInitializer(startBloomsight)
	]);
}
