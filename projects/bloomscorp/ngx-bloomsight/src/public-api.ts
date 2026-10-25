/*
 * Public API Surface of ngx-bloomsight
 *
 * Everything an Angular app needs to use Bloomsight should come from here.
 * Nothing in a consuming application should have to import
 * `@bloomscorp/bloomsight.js` directly — if it does, this surface is missing
 * something.
 */

export * from './lib/provide-bloomsight';
export * from './lib/provide-bloomsight-mail';
export * from './lib/bloomsight-config.token';
export * from './lib/bloomsight.service';
export * from './lib/type/bloomsight-config';
export * from './lib/type/bloomsight-error';
export * from './lib/type/bloomsight-email-engine';
export * from './lib/type/bloomsight-event-data';
export * from './lib/type/bloomsight-mail-request';
export * from './lib/type/bloomsight-mail-config';
