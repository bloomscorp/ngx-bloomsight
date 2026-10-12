/*
 * Public API Surface of ngx-bloomsight
 *
 * Everything an Angular app needs to use Bloomsight should come from here.
 * Nothing in a consuming application should have to import
 * `@bloomscorp/bloomsight.js` directly — if it does, this surface is missing
 * something.
 */

export * from './lib/ngx-bloomsight.service';
export * from './lib/ngx-bloomsight.component';
export * from './lib/ngx-bloomsight.module';
export * from './lib/service/bloomsight-event.service';
export * from './lib/service/bloomsight-mail.service';
export * from './lib/type/bloomsight-email-engine';
export * from './lib/type/bloomsight-config';
export * from './lib/type/bloomsight-error';
