/**
 * Mail delivery engine, selecting the backend endpoint that handles the send.
 *
 * Declared here rather than re-exported from `@bloomscorp/bloomsight.js`
 * deliberately: that package's `EmailEngineTypeEnum` is a type-only
 * declaration with no JavaScript emitted for it, so importing it as a value
 * yields `undefined` at runtime and silently routes mail to SMTP. The SDK
 * compares this value as a plain string, so a union of string literals is
 * both safer and exactly equivalent.
 */
export type BloomsightEmailEngine = 'GMAIL' | 'CUSTOM_SMTP';
