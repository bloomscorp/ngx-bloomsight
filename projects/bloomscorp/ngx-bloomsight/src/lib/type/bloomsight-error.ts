import {IBloomsightError} from '@bloomscorp/bloomsight.js';

/**
 * A failure reported by the SDK, as handed to `BloomsightConfig.onError`.
 *
 * Exported for the same reason as `BloomsightConfig`: without it, an app that
 * wants to route Bloomsight failures into its own monitoring has to import
 * `@bloomscorp/bloomsight.js` to type the handler — which defeats the point of
 * a wrapper. Inline arrow functions get the type by inference; a *named*
 * handler, or storing the error, needs the type by name.
 *
 * Alias rather than redeclaration, as with `BloomsightConfig`: the core owns
 * the shape, this package owns the name.
 *
 * The 2.0.0 `errors$` observable (MODERNISATION.md §6) will emit this type.
 */
export type BloomsightError = IBloomsightError;
