import {InjectionToken} from '@angular/core';
import {BloomsightMailConfig} from '../type/bloomsight-mail-config';

/**
 * The configuration given to `provideBloomsightMail()`.
 *
 * Internal: an app reads nothing from it. It is how `BloomsightService` knows
 * the app was set up for mail only — that there is no `BLOOMSIGHT_CONFIG`
 * because none is needed, not because a provider was forgotten.
 */
export const BLOOMSIGHT_MAIL_CONFIG: InjectionToken<BloomsightMailConfig> =
	new InjectionToken<BloomsightMailConfig>('BLOOMSIGHT_MAIL_CONFIG');
