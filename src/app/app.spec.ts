import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';

import {App} from './app';
import {DEFAULT_SETTINGS} from './demo-settings';
import {ACTIVE_PROPERTY, INGEST_EVENT, PROPERTY_CHECK, stubNetwork} from './bloomsight-integration/integration-harness';
import {byTestId, configureDemo, LIVE_ON_BLOOMS_AI} from './testing/demo-harness';

async function render() {
	const fixture = TestBed.createComponent(App);
	await TestBed.inject(Router).navigateByUrl('/events');
	await fixture.whenStable();
	return fixture;
}

describe('the demo shell', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('says plainly when nothing leaves the browser', async () => {
		stubNetwork();
		configureDemo(DEFAULT_SETTINGS);

		const status = byTestId((await render()).nativeElement, 'status').textContent;

		expect(status).toContain('logOnly — nothing leaves the browser');
		expect(status).toContain('bloomsight');
	});

	it('says plainly when it is live, and where to', async () => {
		stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);

		const status = byTestId((await render()).nativeElement, 'status').textContent;

		expect(status).toContain('Live — writing to blooms.ai (https://staging.bloomsight.test)');
		expect(status).not.toContain('logOnly');
	});

	it('shows every kill switch that is on', async () => {
		stubNetwork();
		configureDemo({...DEFAULT_SETTINGS, stopAll: true, stopPageViewEvent: true});

		const status = byTestId((await render()).nativeElement, 'status').textContent;

		expect(status).toContain('stopAll');
		expect(status).toContain('stopPageViewEvent');
		expect(status).not.toContain('stopSimpleEvent');
	});

	it('renders a real server rejection from errors$, and logs onError in the activity panel', async () => {
		// The property check answers as the real server does for a healthy
		// property on this host, so the only failure is the one under test.
		stubNetwork((url) => url === INGEST_EVENT
			? {status: 403, body: {success: false, code: 'ORIGIN_REJECTED', message: 'origin not allowed'}}
			: url === PROPERTY_CHECK ? {body: {success: true, data: ACTIVE_PROPERTY}} : undefined);
		configureDemo(LIVE_ON_BLOOMS_AI);
		const fixture = await render();
		const root: HTMLElement = fixture.nativeElement;

		byTestId<HTMLButtonElement>(root, 'track').click();

		await vi.waitFor(async () => {
			await fixture.whenStable();
			expect(byTestId(root, 'errors').textContent).toContain('ORIGIN_REJECTED');
		});
		expect(byTestId(root, 'error-count').textContent).toBe('1');
		expect(byTestId(root, 'activity').textContent).toContain('onError: ORIGIN_REJECTED');
	});

	it('shows the requests the SDK made in the activity panel', async () => {
		// The capture is installed by main.ts, not by appConfig, so a test has to
		// record into the panel's store itself to see it render.
		stubNetwork();
		const {activity} = configureDemo(DEFAULT_SETTINGS);
		const fixture = await render();

		activity.record('request', 'POST https://api.test/ingest → 200', '{"eventToken":"x"}');
		await fixture.whenStable();

		expect(byTestId(fixture.nativeElement, 'activity').textContent).toContain('POST https://api.test/ingest → 200');
	});
});
