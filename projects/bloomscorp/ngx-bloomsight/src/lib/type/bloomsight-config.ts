import {IConfig} from '@bloomscorp/bloomsight.js';

/**
 * The configuration object `NgxBloomsightModule.forRoot()` accepts.
 *
 * This exists so that **a consumer of this library never has to import
 * `@bloomscorp/bloomsight.js` itself**. Before this type was exported, typing
 * the argument to `forRoot()` meant reaching into the core package — which is
 * backwards for a wrapper: the whole point of `ngx-bloomsight` is to be the
 * only thing an Angular app talks to.
 *
 * It is an alias rather than a redeclaration on purpose. The core owns the
 * shape, this package owns the *name*, so the core can restructure its
 * internals without changing our public API, and we can narrow or extend the
 * contract later without a breaking rename.
 *
 * See P1 in MODERNISATION.md.
 */
export type BloomsightConfig = IConfig;
