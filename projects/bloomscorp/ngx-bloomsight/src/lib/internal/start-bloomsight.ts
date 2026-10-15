import {DestroyRef, inject, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router} from '@angular/router';
import {distinctUntilChanged, filter, map} from 'rxjs';
import {init, pageViewObserver} from '@bloomscorp/bloomsight.js';
import {BLOOMSIGHT_CONFIG} from '../bloomsight-config.token';
import {BloomsightConfig} from '../type/bloomsight-config';
import {BloomsightErrors} from './bloomsight-errors';

/**
 * The app initializer `provideBloomsight()` registers: starts the SDK once,
 * when the application starts.
 *
 * In 1.x the services did this from their constructors, which is what B1, B7
 * and B8 all came from: the SDK started only if something happened to inject a
 * service, started twice if two did, and started again in a lazy-loaded module
 * that imported `forRoot()`. An initializer runs once per application, whether
 * or not anything injects anything.
 *
 * Nothing runs during server-side rendering (A3): there is no visitor to
 * measure, and the core's browser detection would only report blanks.
 */
export function startBloomsight(): void {
	if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

	const config = inject(BLOOMSIGHT_CONFIG);
	initialise(config, inject(BloomsightErrors));
	observePageViews(config, inject(Router), inject(DestroyRef));
}

/**
 * Start the core, and never let a failure escape.
 *
 * A throw here would abort the application's bootstrap, so a broken analytics
 * SDK would take the whole app down with it (RV4). The failure is reported
 * instead, and the app carries on without the SDK.
 *
 * The core is given a copy of the config with its own `onError`, which feeds
 * `errors$` and then calls the app's handler. The core copies the config it is
 * given, so the app's object is never touched either way.
 */
function initialise(config: BloomsightConfig, errors: BloomsightErrors): void {
	try {
		init({
			...config,
			onError: (error) => {
				errors.report(error);
				config.onError?.(error);
			}
		});
	} catch (cause) {
		reportInitFailure(config, cause);
	}
}

function reportInitFailure(config: BloomsightConfig, cause: unknown): void {
	const error = {
		code: 'INIT_FAILED',
		message: `bloomsight.js failed to initialise: ${cause instanceof Error ? cause.message : String(cause)}`
	};
	console.error('ngx-bloomsight:', error.message);
	try {
		config.onError?.(error);
	} catch {
		// A throwing handler must not turn a reported failure back into a crash.
	}
}

/**
 * Record a page view each time a navigation lands somewhere new.
 *
 * - `urlAfterRedirects`, not `url` (B3): a redirect or guard means the two
 *   differ, and only the first is where the user actually is.
 * - `distinctUntilChanged`: two requested URLs resolving to the same page are
 *   one page view, as is a same-URL reload.
 * - `takeUntilDestroyed` (B4): 1.x never unsubscribed. Here the subscription
 *   ends with the application's injector.
 *
 * Not observed at all on blooms.ai, which has no page-view endpoint: every call
 * would be a no-op in the core.
 */
function observePageViews(config: BloomsightConfig, router: Router, destroyRef: DestroyRef): void {
	if (config.target === 'blooms-ai') {
		if (config.debug || config.isDevelopmentMode) {
			console.log('ngx-bloomsight: page views are not collected on blooms.ai, so the router is not observed');
		}
		return;
	}

	router.events.pipe(
		filter((event): event is NavigationEnd => event instanceof NavigationEnd),
		map((event) => event.urlAfterRedirects),
		distinctUntilChanged(),
		takeUntilDestroyed(destroyRef)
	).subscribe(() => pageViewObserver());
}
