import {IEmailConfig} from '@bloomscorp/bloomsight.js';

/**
 * What `provideBloomsightMail()` accepts: where mail goes, for an app that only
 * sends mail (RELEASE-2.1.0.md, D2).
 *
 * The core's `IEmailConfig` — `target`, `apiBase`, `onError`, `debug` — under
 * this package's name, as `BloomsightConfig` is the core's `IConfig`. The core
 * owns those fields and does the work: they go to its `configureEmail()`
 * unchanged.
 *
 * `logOnly` is the one field the wrapper handles itself. The core's `logOnly`
 * exists only through `init()`, which a mail-only app never calls, so without
 * it such an app's tests would send real mail.
 */
export type BloomsightMailConfig = IEmailConfig & {
	/** Log each mail and send nothing; `sendMail()` still succeeds. For tests and dry runs. */
	logOnly?: boolean;
};
