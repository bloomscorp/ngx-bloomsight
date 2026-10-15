import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';

import {
	API_BASE, B1_HOST, INGEST_EVENT, PROPERTY_TOKEN,
	bootConsumerApp, settle, stubNetwork
} from './integration-harness';
import {
	BloomsightConfig, BloomsightMailRequest, BloomsightService
} from '@bloomscorp/ngx-bloomsight';

/**
 * `logOnly: true` — the switch for running a project against the SDK without
 * writing anything. It is what the rebuilt demo app will default to (D5), so
 * it has to genuinely send nothing.
 *
 * "Nothing was sent" is also exactly what a broken core looks like, so every
 * test here first proves the call reached the core, from the core's own logs,
 * and only then checks that nothing left it.
 */
const config: BloomsightConfig = {
	propertyToken: PROPERTY_TOKEN,
	// Development mode makes the core log the mail payload just before
	// transferEmail's logOnly return, and with debug it logs each event's send
	// decision. Those logs are the proof that calls reached the core.
	isDevelopmentMode: true,
	debug: true,
	target: 'blooms-ai',
	apiBase: API_BASE,
	logOnly: true
};

function mail(): BloomsightMailRequest {
	return {engineId: 'engine', templateId: 'template', templateOwnerId: 'owner', data: new FormData()};
}

/** Every console.log line the core has written, flattened to strings. */
function logLines(log: ReturnType<typeof vi.spyOn>): string[] {
	return log.mock.calls.map((args: unknown[]) => args.map(String).join(' '));
}

describe('integration: logOnly', () => {

	let log: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		// Restored even when an assertion fails, so a failing test does not leave
		// the core's debug output hidden for the rest of the file (review RV8).
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('sends no simple or data events', async () => {
		const net = stubNetwork();
		bootConsumerApp(config);
		const events = TestBed.inject(BloomsightService);

		events.track('signup-clicked');
		events.trackData('plan-selected', {plan: 'pro'});

		await vi.waitFor(() => {
			expect(logLines(log)).toContainEqual(expect.stringMatching(/logOnly: would have sent simple event.*signup-clicked/));
			expect(logLines(log)).toContainEqual(expect.stringMatching(/logOnly: would have sent data event.*plan-selected/));
		});
		await settle();
		expect(net.to(INGEST_EVENT)).toHaveLength(0);
	});

	it('sends no mail', async () => {
		const net = stubNetwork();
		bootConsumerApp(config);

		TestBed.inject(BloomsightService).sendMail(mail()).subscribe();

		// Proof sendMail reached the core: it logs the payload in development mode
		// immediately before transferEmail's logOnly early return (review RV5).
		await vi.waitFor(() => expect(logLines(log)).toContainEqual(expect.stringMatching(/^email data:/)));
		await settle();
		expect(net.toHost(B1_HOST)).toHaveLength(0);
	});

	it('still finishes the mail call, so a waiting UI is released (F2)', async () => {
		// The core's transferEmail returns before sending under logOnly and calls
		// neither of its callbacks. In 1.x that left any "sending…" state waiting
		// forever. The wrapper now finishes the call itself.
		stubNetwork();
		bootConsumerApp(config);
		const seen: string[] = [];

		TestBed.inject(BloomsightService).sendMail(mail()).subscribe({
			next: () => seen.push('next'),
			error: () => seen.push('error'),
			complete: () => seen.push('complete')
		});

		await vi.waitFor(() => expect(logLines(log)).toContainEqual(expect.stringMatching(/^email data:/)));
		expect(seen).toEqual(['next', 'complete']);
	});
});
