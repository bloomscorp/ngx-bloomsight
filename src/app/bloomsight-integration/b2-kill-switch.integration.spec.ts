import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';

import {
	API_BASE, INGEST_EVENT, PROPERTY_TOKEN,
	bootConsumerApp, settle, stubNetwork
} from './integration-harness';
import {
	BloomsightConfig, BloomsightEventService
} from '../../../projects/bloomscorp/ngx-bloomsight/src/public-api';

/**
 * The per-kind kill switches. `stopSimpleEvent` must stop simple events and
 * nothing else — a switch that also silenced data events would be a quiet,
 * expensive data loss.
 */
const config: BloomsightConfig = {
	propertyToken: PROPERTY_TOKEN,
	isDevelopmentMode: false,
	target: 'blooms-ai',
	apiBase: API_BASE,
	stopSimpleEvent: true
};

describe('integration: stopSimpleEvent', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('suppresses simple events and still sends data events', async () => {
		const net = stubNetwork();
		bootConsumerApp(config);
		const events = TestBed.inject(BloomsightEventService);

		events.resolveSimpleEvent('signup-clicked');
		events.resolveDataEvent('plan-selected', {plan: 'pro'});

		// The data event arriving proves the core is live; only then does the
		// absence of the simple event mean anything.
		await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(1));
		await settle();
		const tokens = net.to(INGEST_EVENT).map((r) => (r.body as {eventToken: string}).eventToken);
		expect(tokens).toEqual(['plan-selected']);
	});
});
