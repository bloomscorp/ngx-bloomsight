import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {BloomsightError} from '../type/bloomsight-error';

/**
 * Collects the failures the core reports, for `BloomsightService.errors$`.
 *
 * Internal — not exported from the public API. The service hands out the
 * stream read-only, so only the SDK's own `onError` hook can push to it.
 *
 * Hot, like `Router.events`: a subscriber sees the failures that happen after
 * it subscribes. That is why `INIT_FAILED` is not emitted here — initialisation
 * runs while the app starts, before any component exists to subscribe. It goes
 * to the app's `onError` and the console instead.
 */
@Injectable({providedIn: 'root'})
export class BloomsightErrors {

	private readonly failures = new Subject<BloomsightError>();

	readonly errors$: Observable<BloomsightError> = this.failures.asObservable();

	report(error: BloomsightError): void {
		this.failures.next(error);
	}
}
