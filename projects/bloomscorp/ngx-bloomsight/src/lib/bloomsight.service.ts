import {inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {Observable} from 'rxjs';
import {resolveDataEvent, resolveSimpleEvent, sendEmail} from '@bloomscorp/bloomsight.js';
import {BLOOMSIGHT_CONFIG} from './bloomsight-config.token';
import {BloomsightErrors} from './internal/bloomsight-errors';
import {BloomsightConfig} from './type/bloomsight-config';
import {BloomsightError} from './type/bloomsight-error';
import {BloomsightEventData} from './type/bloomsight-event-data';
import {BloomsightMailRequest} from './type/bloomsight-mail-request';

/**
 * Everything an app does with Bloomsight: events, mail, and failures.
 *
 * One root service, replacing 1.x's `BloomsightEventService` and
 * `BloomsightMailService`. It does not start the SDK — `provideBloomsight()`
 * does that when the app starts — so injecting it has no side effects.
 *
 * During server-side rendering every method is a no-op (A3).
 */
@Injectable({providedIn: 'root'})
export class BloomsightService {

	private readonly config: BloomsightConfig = requireConfig();

	private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

	/**
	 * Every failure the SDK reports after you subscribe — rejected or
	 * unreachable requests, with the server's own code where there is one.
	 * The configured `onError` is called as well.
	 *
	 * Mail failures are not included: they are the error of that `sendMail()`
	 * call, where a caller is already waiting for them.
	 */
	readonly errors$: Observable<BloomsightError> = inject(BloomsightErrors).errors$;

	/** Record a simple event. */
	track(eventToken: string): void {
		if (this.isBrowser) resolveSimpleEvent(eventToken);
	}

	/** Record a data event, with its payload. */
	trackData(eventToken: string, data: BloomsightEventData): void {
		if (this.isBrowser) resolveDataEvent(eventToken, data);
	}

	/**
	 * Send a mail through the standalone Bloomsight server. Mail always goes
	 * there, whatever `target` is set to.
	 *
	 * Nothing is sent until the result is subscribed to, and it is sent once per
	 * subscription — the same as `HttpClient`. It emits once and completes when
	 * the server accepts the mail, and errors with a `BloomsightError`
	 * (`code: 'MAIL_FAILED'`) when it does not.
	 *
	 * Under `logOnly` the mail is handed to the core, which logs it and sends
	 * nothing, and the result still emits and completes, so a UI waiting on it
	 * is released (F2). During server-side rendering it completes without
	 * sending or emitting.
	 */
	sendMail(request: BloomsightMailRequest): Observable<void> {
		return new Observable<void>((subscriber) => {
			if (!this.isBrowser) {
				subscriber.complete();
				return;
			}

			const succeed = (): void => {
				subscriber.next();
				subscriber.complete();
			};
			const fail = (cause?: unknown): void => subscriber.error(mailFailure(cause));

			try {
				sendEmail(
					request.engine ?? 'GMAIL',
					request.engineId,
					request.templateId,
					request.templateOwnerId,
					request.data,
					succeed,
					() => fail()
				);
			} catch (cause) {
				fail(cause);
				return;
			}

			// The core returns before sending under logOnly, and calls neither
			// callback, so it is up to this wrapper to finish the call.
			if (this.config.logOnly) succeed();
		});
	}
}

function requireConfig(): BloomsightConfig {
	const config = inject(BLOOMSIGHT_CONFIG, {optional: true});
	if (!config) {
		throw new Error(
			'ngx-bloomsight: BloomsightService was injected, but the application never called provideBloomsight(). ' +
			'Add provideBloomsight({ propertyToken, isDevelopmentMode }) to the root providers.'
		);
	}
	return config;
}

function mailFailure(cause?: unknown): BloomsightError {
	if (cause === undefined) {
		return {code: 'MAIL_FAILED', message: 'The mail was not sent: the server rejected it or could not be reached'};
	}
	return {
		code: 'MAIL_FAILED',
		message: `The mail was not sent: ${cause instanceof Error ? cause.message : String(cause)}`
	};
}
