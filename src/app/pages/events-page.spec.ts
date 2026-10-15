import {vi} from 'vitest';
import {RouterTestingHarness} from '@angular/router/testing';

import {INGEST_EVENT, stubNetwork} from '../bloomsight-integration/integration-harness';
import {byTestId, configureDemo, enter, LIVE_ON_BLOOMS_AI} from '../testing/demo-harness';
import {DEFAULT_SETTINGS} from '../demo-settings';

async function openEvents() {
	const harness = await RouterTestingHarness.create('/events');
	return {harness, root: harness.routeNativeElement!};
}

const tokens = (net: ReturnType<typeof stubNetwork>) =>
	net.to(INGEST_EVENT).map((r) => r.body as {eventToken: string; data?: unknown});

describe('the events page', () => {

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('sends a simple event with the token typed in', async () => {
		const net = stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openEvents();

		enter(byTestId(root, 'simple-token'), 'hero-cta');
		await harness.fixture.whenStable();
		byTestId<HTMLButtonElement>(root, 'track').click();

		await vi.waitFor(() => expect(tokens(net)).toEqual([expect.objectContaining({eventToken: 'hero-cta'})]));
	});

	it('sends a data event with the JSON payload as data', async () => {
		const net = stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openEvents();

		enter(byTestId(root, 'data-token'), 'plan-upgraded');
		enter(byTestId(root, 'payload'), '{"plan": "team", "seats": 12}');
		await harness.fixture.whenStable();
		byTestId<HTMLButtonElement>(root, 'track-data').click();

		await vi.waitFor(() => expect(tokens(net)).toEqual([
			expect.objectContaining({eventToken: 'plan-upgraded', data: {plan: 'team', seats: 12}})
		]));
	});

	it('will not send a payload that is not a JSON object, and says why', async () => {
		stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openEvents();
		const button = byTestId<HTMLButtonElement>(root, 'track-data');

		enter(byTestId(root, 'payload'), '{"plan": ');
		await harness.fixture.whenStable();
		expect(button.disabled).toBe(true);
		expect(byTestId(root, 'payload-error').textContent).toContain('not valid JSON');

		enter(byTestId(root, 'payload'), '[1, 2]');
		await harness.fixture.whenStable();
		expect(button.disabled).toBe(true);
		expect(byTestId(root, 'payload-error').textContent).toContain('has to be a JSON object');
	});

	it('lists what was sent from the page', async () => {
		stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openEvents();

		byTestId<HTMLButtonElement>(root, 'track').click();
		byTestId<HTMLButtonElement>(root, 'track-data').click();
		await harness.fixture.whenStable();

		expect(byTestId(root, 'history').textContent).toContain("track('signup-clicked')");
		expect(byTestId(root, 'history').textContent).toContain('trackData(\'plan-selected\', {"plan":"pro","seats":5,"annual":true})');
	});

	it('sends nothing under the default settings (D5)', async () => {
		const net = stubNetwork();
		const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
		configureDemo(DEFAULT_SETTINGS);
		const {root} = await openEvents();

		byTestId<HTMLButtonElement>(root, 'track').click();

		// The core logs what it would have sent: proof the click reached it, so
		// that the empty request list below means something.
		await vi.waitFor(() => expect(log.mock.calls.flat().map(String).join('\n')).toContain('simple event data'));
		expect(net.requests.filter((r) => r.method === 'POST')).toEqual([]);
	});
});
