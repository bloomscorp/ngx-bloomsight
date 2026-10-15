import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';

import {
	API_BASE, B1_HOST, INGEST_EVENT, PROPERTY_TOKEN,
	bootConsumerApp, settle, stubNetwork
} from './integration-harness';
import {
	BloomsightConfig, BloomsightEventService, BloomsightMailService
} from '../../../projects/bloomscorp/ngx-bloomsight/src/public-api';

/**
 * `logOnly: true` — the switch for running a project against the SDK without
 * writing anything. It is what the rebuilt demo app will default to (D5), so
 * it has to genuinely send nothing.
 */
const config: BloomsightConfig = {
	propertyToken: PROPERTY_TOKEN,
	isDevelopmentMode: false,
	target: 'blooms-ai',
	apiBase: API_BASE,
	logOnly: true,
	// Makes the core log each decision, which is how these tests prove an event
	// reached the core and was held back on purpose rather than lost on the way.
	debug: true
};

describe('integration: logOnly', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('sends no simple or data events', async () => {
		const net = stubNetwork();
		const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
		bootConsumerApp(config);
		const events = TestBed.inject(BloomsightEventService);

		events.resolveSimpleEvent('signup-clicked');
		events.resolveDataEvent('plan-selected', {plan: 'pro'});
		await settle();

		expect(net.to(INGEST_EVENT)).toHaveLength(0);

		// "Nothing was sent" is also what a broken core looks like. These prove
		// both events reached the core's send decision and were withheld because
		// of logOnly specifically.
		const decisions = log.mock.calls.map((args) => args.map(String).join(' '));
		expect(decisions).toContainEqual(expect.stringMatching(/logOnly: would have sent simple event.*signup-clicked/));
		expect(decisions).toContainEqual(expect.stringMatching(/logOnly: would have sent data event.*plan-selected/));
		log.mockRestore();
	});

	it('sends no mail', async () => {
		const net = stubNetwork();
		bootConsumerApp(config);

		TestBed.inject(BloomsightMailService).sendMail('engine', 'template', 'owner', new FormData(), vi.fn(), vi.fn());
		await settle();

		expect(net.toHost(B1_HOST)).toHaveLength(0);
	});

	it('never calls either mail callback — a known gap, pinned', async () => {
		// Under logOnly the core's transferEmail returns before sending and calls
		// neither onSuccess nor onError. Any UI that waits on one of them — a
		// "sending…" state, a disabled submit button — waits forever. Pinned so a
		// fix is a deliberate change; the 2.0.0 sendMail returns an Observable
		// and should complete under logOnly instead.
		stubNetwork();
		bootConsumerApp(config);
		const onSuccess = vi.fn();
		const onError = vi.fn();

		TestBed.inject(BloomsightMailService).sendMail('engine', 'template', 'owner', new FormData(), onSuccess, onError);
		await settle();

		expect(onSuccess).not.toHaveBeenCalled();
		expect(onError).not.toHaveBeenCalled();
	});
});
