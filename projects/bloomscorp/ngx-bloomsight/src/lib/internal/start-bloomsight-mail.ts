import {inject, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {configureEmail} from '@bloomscorp/bloomsight.js';
import {BLOOMSIGHT_MAIL_CONFIG} from './bloomsight-mail-config.token';
import {BloomsightErrors} from './bloomsight-errors';

/**
 * The app initializer `provideBloomsightMail()` registers: hands the mail
 * settings to the core's `configureEmail()`, once, when the application starts.
 *
 * Not `init()`: a mail-only app has no property, sends nothing at startup, and
 * has no page views to record. Nothing runs during server-side rendering (A3).
 *
 * `logOnly` is the wrapper's own and is not passed on; the core would only
 * ignore it. `onError` is wrapped, as `init`'s is, so that blooms.ai's mail
 * failures reach `errors$` too, with the server's code (D4). The app's object
 * is not touched.
 */
export function startBloomsightMail(): void {
	if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

	const {logOnly, ...settings} = inject(BLOOMSIGHT_MAIL_CONFIG);
	const errors = inject(BloomsightErrors);
	try {
		configureEmail({
			...settings,
			onError: (error) => {
				errors.report(error);
				settings.onError?.(error);
			}
		});
	} catch (cause) {
		// As with init (RV4): a broken SDK must not abort the app's bootstrap.
		console.error('ngx-bloomsight: bloomsight.js refused the mail settings:', cause instanceof Error ? cause.message : String(cause));
	}
}
