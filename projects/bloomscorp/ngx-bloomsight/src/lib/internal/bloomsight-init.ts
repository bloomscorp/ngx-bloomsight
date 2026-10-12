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

export function initOnce(config: IConfig): void {
	if (initialised) return;
	initialised = true;
	init(config);
}

/** Test seam. Module-level state would otherwise leak between specs. */
export function resetInitGuard(): void {
	initialised = false;
}
