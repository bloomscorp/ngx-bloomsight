import {init} from '@bloomscorp/bloomsight.js';
import {IConfig} from '@bloomscorp/bloomsight.js';

/**
 * Single-initialisation guard for the core SDK.
 *
 * `BloomsightEventService` and `BloomsightMailService` each used to call
 * `init(this._config)` from their own constructor, so an app injecting both
 * initialised the SDK **twice**: two property pre-flight requests, `initConfig`
 * run twice, and under `target: 'blooms-ai'` two `inspectProperty` calls. The
 * service constructed second silently re-initialised the first one's state.
 *
 * Both now route through here instead, so the first caller wins and the rest
 * are no-ops, whichever service the consuming app happens to inject first.
 *
 * This is a **guard, not the real fix.** Initialisation is still a constructor
 * side effect, which means it does not happen at all unless something injects
 * one of the services, and `NgxBloomsightModule.forRoot()` imported a second
 * time in a lazy-loaded module still creates a second set of services. Both are
 * resolved properly by moving initialisation into `provideBloomsight()` and an
 * app initializer — see MODERNISATION.md (B7, B8).
 *
 * Module-level state is per bundle instance, which is what we want: one browser
 * document, one initialisation. Under server-side rendering the flag persists
 * across renders in the same process, but the core's own `isBrowser()` guards
 * make `init()` a no-op there anyway, and the browser bundle initialises
 * independently when it hydrates.
 */
let initialised = false;

/**
 * Initialise the core once, and never let a failure escape.
 *
 * Both rules came out of code review (RV4):
 *
 * - **A failure must not break the host app.** This runs inside the services'
 *   constructors, so an exception from the core's `init()` used to escape into
 *   Angular's dependency injection, and whatever injected the service failed
 *   to construct along with it. That is a real case, not a hypothetical one:
 *   the core calls `window.matchMedia` unguarded, so it throws wherever that is
 *   missing, as in jsdom-based tests (F3). An analytics SDK must never take down
 *   the page it is measuring, so the failure is reported instead.
 * - **The flag is set only once init has succeeded.** It used to be set before
 *   calling `init()`, so one failure disabled tracking for the rest of the page,
 *   permanently and silently. Now a later attempt, made by the next service
 *   constructed, retries.
 */
export function initOnce(config: IConfig): void {
	if (initialised) return;
	try {
		init(config);
		initialised = true;
	} catch (cause) {
		reportInitFailure(config, cause);
	}
}

function reportInitFailure(config: IConfig, cause: unknown): void {
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

/** Test seam. Module-level state would otherwise leak between specs. */
export function resetInitGuard(): void {
	initialised = false;
}
