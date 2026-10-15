import {InjectionToken} from '@angular/core';
import {BloomsightConfig} from './type/bloomsight-config';

/**
 * The configuration given to `provideBloomsight()`.
 *
 * A real `InjectionToken` (P3). 1.x used the string `'bloomsightConfig'`,
 * which carries no type — whatever was injected under it was trusted to be a
 * config — and which any other library could collide with.
 *
 * Inject it to read the configuration the app started with. Provide it through
 * `provideBloomsight()`, not directly: that is what also starts the SDK.
 *
 * The explicit annotation is deliberate. Inferred, the published declaration
 * comes out as `InjectionToken<import("@bloomscorp/bloomsight.js").IConfig>` —
 * the compiler expands the alias — and the core's name leaks into this
 * package's public types (§2.3).
 */
export const BLOOMSIGHT_CONFIG: InjectionToken<BloomsightConfig> =
	new InjectionToken<BloomsightConfig>('BLOOMSIGHT_CONFIG');
