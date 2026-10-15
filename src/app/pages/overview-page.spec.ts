import {vi} from 'vitest';
import {RouterTestingHarness} from '@angular/router/testing';

import {stubNetwork} from '../bloomsight-integration/integration-harness';
import {configureDemo, LIVE_ON_BLOOMS_AI} from '../testing/demo-harness';
import {DEFAULT_SETTINGS} from '../demo-settings';
import {OverviewPage} from './overview-page';

describe('the overview page and the routes', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('is the landing page, and links to every part of the demo', async () => {
		stubNetwork();
		configureDemo(DEFAULT_SETTINGS);

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/', OverviewPage);
		const links = [...harness.routeNativeElement!.querySelectorAll('a.card')].map((a) => a.getAttribute('href'));

		expect(links).toEqual(['/events', '/page-views', '/mail', '/settings', '/settings', '/events']);
		expect(harness.routeNativeElement!.textContent).toContain('logOnly is on');
	});

	it('says when it is live, and where to', async () => {
		stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);

		const harness = await RouterTestingHarness.create('/');

		expect(harness.routeNativeElement!.textContent).toContain('Live. Events and mail are really sent, to blooms.ai');
	});

	it('sends an unknown URL back to the overview', async () => {
		stubNetwork();
		configureDemo(DEFAULT_SETTINGS);

		const harness = await RouterTestingHarness.create();
		// navigateByUrl(url, OverviewPage) itself throws if a different page loads.
		await harness.navigateByUrl('/no-such-page', OverviewPage);

		expect(harness.routeNativeElement!.textContent).toContain('ngx-bloomsight 2.0');
	});
});
