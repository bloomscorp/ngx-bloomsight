import {EmailEngineType} from '@bloomscorp/bloomsight.js';

/**
 * Mail delivery engine, selecting the backend endpoint that handles the send:
 * `'GMAIL'` or `'CUSTOM_SMTP'`.
 *
 * An alias of the core's own `EmailEngineType`, the same way `BloomsightConfig`
 * aliases `IConfig`: the core owns the shape, this package owns the name.
 * Since bloomsight.js 0.9.2 — this package's peer floor — that type accepts the
 * plain strings as well as `EmailEngineTypeEnum`, and the enum is a real runtime
 * value exported from the core's root (P6).
 *
 * This used to be a separately declared string union, passed to the core
 * through `as unknown as`. That cast switched off the one compile-time check on
 * the engine: had the core ever renamed an engine, this package would still
 * have compiled and quietly sent mail to the wrong endpoint. Aliasing the core's
 * type means such a change now fails the build here instead.
 */
export type BloomsightEmailEngine = EmailEngineType;
