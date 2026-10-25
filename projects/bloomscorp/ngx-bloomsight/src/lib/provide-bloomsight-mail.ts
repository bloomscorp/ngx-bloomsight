import {EnvironmentProviders, makeEnvironmentProviders, provideAppInitializer} from '@angular/core';
import {BLOOMSIGHT_MAIL_CONFIG} from './internal/bloomsight-mail-config.token';
import {startBloomsightMail} from './internal/start-bloomsight-mail';
import {BloomsightMailConfig} from './type/bloomsight-mail-config';

/**
 * Set up Bloomsight for an application that only sends mail. Call it once, in
 * the root providers, instead of `provideBloomsight()`:
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideRouter(routes),
 *     provideBloomsightMail({ target: 'blooms-ai' })
 *   ]
 * });
 * ```
 *
 * It needs no property token and starts no event tracking: nothing is sent
 * until `BloomsightService.sendMail()` is called. `target` chooses the server —
 * `'blooms-ai'`, or `'bloomsight'` (the default) for the standalone server.
 *
 * An app that also records events uses `provideBloomsight()` and sets
 * `emailTarget` there instead (RELEASE-2.1.0.md, D3).
 */
export function provideBloomsightMail(config: BloomsightMailConfig = {}): EnvironmentProviders {
	return makeEnvironmentProviders([
		{provide: BLOOMSIGHT_MAIL_CONFIG, useValue: config},
		provideAppInitializer(startBloomsightMail)
	]);
}
