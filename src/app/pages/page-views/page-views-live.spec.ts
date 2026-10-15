import {vi} from 'vitest';
import {RouterTestingHarness} from '@angular/router/testing';

import {B1_HOST, PROPERTY_TOKEN, stubNetwork} from '../../bloomsight-integration/integration-harness';
import {configureDemo} from '../../testing/demo-harness';
import {DEFAULT_SETTINGS, DemoSettings} from '../../demo-settings';

/**
 * Page views actually sent, from the demo's page-views page.
 *
 * In a file of its own on purpose. The core waits two seconds before sending a
 * page view, on a timer that outlives the app that started it, and it sends
 * with whatever configuration is current when the timer fires. A test sharing
 * this file would leak its pending page views into this one's count.
 * `isolate: true` gives each file a fresh page.
 */

/** The standalone server's page-view endpoint. */
const PAGE_VIEW = `${B1_HOST}/api/v1/page-view-data/add`;

/** Live on the standalone server — the only backend that records page views. */
const LIVE_ON_BLOOMSIGHT: DemoSettings = {
	...DEFAULT_SETTINGS,
	propertyToken: PROPERTY_TOKEN,
	logOnly: false,
	// Development mode makes the core accept the property without checking it
	// against this page's host, which in a test is not a real site.
	isDevelopmentMode: true,
	debug: false
};

describe('the page views page, live on the standalone server', () => {

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('records one page view per new destination, by where the user landed', async () => {
		// first → old-first (redirects to first) → second: three navigations,
		// two destinations, so two page views.
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		const net = stubNetwork();
		configureDemo(LIVE_ON_BLOOMSIGHT);
		const harness = await RouterTestingHarness.create('/page-views/first');

		await harness.navigateByUrl('/page-views/old-first');
		await harness.navigateByUrl('/page-views/second');

		await vi.waitFor(() => expect(net.to(PAGE_VIEW)).toHaveLength(2), {timeout: 5000, interval: 100});
		// And no third arriving late.
		await new Promise((resolve) => setTimeout(resolve, 2500));
		expect(net.to(PAGE_VIEW)).toHaveLength(2);
	}, 10000);
});
