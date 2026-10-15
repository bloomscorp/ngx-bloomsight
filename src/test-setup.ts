/**
 * Browser APIs that jsdom does not implement, filled in so the demo app's
 * integration tests can run the **real** `@bloomscorp/bloomsight.js`.
 *
 * Only what the core actually calls, and answering as an ordinary browser tab
 * would. Wired in through `setupFiles` on the demo app's test target.
 */

// The core's platform detection calls
// `window.matchMedia('(display-mode: standalone)').matches` — "is this running
// as an installed PWA?" — and jsdom has no matchMedia at all, so init() threw a
// TypeError that escaped the service constructor and nothing was ever sent.
// In an ordinary tab the answer to every such query is "no".
if (typeof window.matchMedia !== 'function') {
	window.matchMedia = (query: string): MediaQueryList => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => undefined,
		removeListener: () => undefined,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
		dispatchEvent: () => false
	}) as MediaQueryList;
}
