import {inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {Observable} from 'rxjs';
import {resolveDataEvent, resolveSimpleEvent, sendEmail} from '@bloomscorp/bloomsight.js';
import {BLOOMSIGHT_CONFIG} from './bloomsight-config.token';
import {BLOOMSIGHT_MAIL_CONFIG} from './internal/bloomsight-mail-config.token';
import {BloomsightErrors} from './internal/bloomsight-errors';
import {BloomsightConfig} from './type/bloomsight-config';
import {BloomsightMailConfig} from './type/bloomsight-mail-config';
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
 * It works under either provider. Under `provideBloomsightMail()` there are no
 * events to record, so `track` and `trackData` do nothing (2.1.0, D1).
 *
 * During server-side rendering every method is a no-op (A3).
 */
@Injectable({providedIn: 'root'})
export class BloomsightService {

	private readonly setup: Setup = requireSetup();

	private warnedNoEvents: boolean = false;

	private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

	/**
	 * Every failure the SDK reports after you subscribe — rejected or
	 * unreachable requests, with the server's own code where there is one.
	 * The configured `onError` is called as well.
	 *
	 * A failed `sendMail()` errors that call. On blooms.ai the core also
	 * reports it here, with the server's own code, which the call's
	 * `MAIL_FAILED` does not carry (2.1.0, D4). The standalone server reports
	 * nothing.
	 */
	readonly errors$: Observable<BloomsightError> = inject(BloomsightErrors).errors$;

	/** Record a simple event. */
	track(eventToken: string): void {
		if (this.isBrowser && this.eventsSetUp()) resolveSimpleEvent(eventToken);
	}

	/** Record a data event, with its payload. */
	trackData(eventToken: string, data: BloomsightEventData): void {
		if (this.isBrowser && this.eventsSetUp()) resolveDataEvent(eventToken, data);
	}

	/**
	 * Send a mail. It goes to the standalone Bloomsight server unless mail was
	 * moved to blooms.ai — by `provideBloomsightMail({ target })` or
	 * `emailTarget` — and never because of the events `target`.
	 *
	 * Nothing is sent until the result is subscribed to, and it is sent once per
	 * subscription — the same as `HttpClient`. It emits once and completes when
	 * the server accepts the mail, and errors with a `BloomsightError`
	 * (`code: 'MAIL_FAILED'`) when it does not.
	 *
	 * Under `logOnly` the mail is handed to the core, which logs it and sends
	 * nothing, and the result still emits and completes, so a UI waiting on it
	 * is released (F2). The same goes for `logOnly` in `provideBloomsightMail()`,
	 * where the wrapper logs the mail itself and the core is not called. During
	 * server-side rendering it completes without sending or emitting.
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

			if (this.setup.mail?.logOnly) {
				console.log('ngx-bloomsight: logOnly, so this mail was not sent:', request);
				succeed();
				return;
			}

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
			if (this.setup.events?.logOnly) succeed();
		});
	}

	private eventsSetUp(): boolean {
		if (this.setup.events) return true;
		if (!this.warnedNoEvents) {
			this.warnedNoEvents = true;
			console.warn('ngx-bloomsight: the app was set up with provideBloomsightMail(), which records no events, so track() and trackData() do nothing. Use provideBloomsight() to record events.');
		}
		return false;
	}
}

/** Which provider set the app up. At least one of the two is there. */
interface Setup {
	events: BloomsightConfig | null;
	mail: BloomsightMailConfig | null;
}

function requireSetup(): Setup {
	const setup: Setup = {
		events: inject(BLOOMSIGHT_CONFIG, {optional: true}),
		mail: inject(BLOOMSIGHT_MAIL_CONFIG, {optional: true})
	};
	if (!setup.events && !setup.mail) {
		throw new Error(
			'ngx-bloomsight: BloomsightService was injected, but the application never called provideBloomsight() or provideBloomsightMail(). ' +
			'Add provideBloomsight({ propertyToken, isDevelopmentMode }) to the root providers, or provideBloomsightMail() if the app only sends mail.'
		);
	}
	return setup;
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
