import {vi} from 'vitest';
import {RouterTestingHarness} from '@angular/router/testing';

import {stubNetwork} from '../../bloomsight-integration/integration-harness';
import {configureDemo, LIVE_ON_BLOOMS_AI} from '../../testing/demo-harness';
import {DEFAULT_SETTINGS} from '../../demo-settings';

/** The router's landings, as the page's table shows them. */
function landings(root: Element): string[][] {
	return [...root.querySelectorAll('[data-testid="landings"] tbody tr')]
		.map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent!.trim()));
}

describe('the page views page', () => {

	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('shows where each link really landed', async () => {
		stubNetwork();
		configureDemo(DEFAULT_SETTINGS);
		const harness = await RouterTestingHarness.create('/page-views/first');

		await harness.navigateByUrl('/page-views/old-first');
		await harness.navigateByUrl('/page-views/second');

		expect(harness.routeNativeElement!.textContent).toContain('Second page');
		expect(landings(harness.routeNativeElement!)).toEqual([
			['/page-views/second', '/page-views/second', '✅ new page'],
			['/page-views/old-first', '/page-views/first', '➖ same page, not counted'],
			['/page-views/first', '/page-views/first', '✅ new page']
		]);
	});

	it('explains that blooms.ai records none', async () => {
		stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const harness = await RouterTestingHarness.create('/page-views/first');

		expect(harness.routeNativeElement!.textContent).toContain('blooms.ai has no page-view endpoint');
	});

	it('says when page views are switched off', async () => {
		stubNetwork();
		configureDemo({...DEFAULT_SETTINGS, stopPageViewEvent: true});
		const harness = await RouterTestingHarness.create('/page-views/first');

		expect(harness.routeNativeElement!.textContent).toContain('Page views are switched off');
	});
});
