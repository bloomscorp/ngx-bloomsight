/**
 * The payload of a data event, as `BloomsightService.trackData()` accepts it.
 *
 * The same shape the core's `resolveDataEvent` takes, given a name here so a
 * consumer can type a payload it builds up before sending — without importing
 * `@bloomscorp/bloomsight.js` (the facade rule).
 */
export type BloomsightEventData = {[key: string]: any};
