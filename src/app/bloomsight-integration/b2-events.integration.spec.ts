import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';

import {
	API_BASE, B1_HOST, INGEST_EVENT, PROPERTY_TOKEN,
	bootConsumerApp, settle, stubNetwork
} from './integration-harness';
import {
	BloomsightConfig, BloomsightError, BloomsightService
} from '@bloomscorp/ngx-bloomsight';

/**
 * An app that has switched to blooms.ai: `target: 'blooms-ai'`, pointed at a
 * staging host. This is the migration path itself, so it gets the most cover.
 */
const errors: BloomsightError[] = [];
const config: BloomsightConfig = {
	propertyToken: PROPERTY_TOKEN,
	isDevelopmentMode: false,
	target: 'blooms-ai',
	apiBase: API_BASE,
	onError: (e) => errors.push(e)
};

describe('integration: an app on blooms.ai (target "blooms-ai")', () => {

	beforeEach(() => {
		errors.length = 0;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('events', () => {

		it('sends a simple event to the blooms.ai ingest endpoint', async () => {
			const net = stubNetwork();
			bootConsumerApp(config);

			TestBed.inject(BloomsightService).track('signup-clicked');

			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(1));
			const sent = net.to(INGEST_EVENT);
			expect(sent[0]!.method).toBe('POST');
			expect(sent[0]!.body).toMatchObject({
				property: PROPERTY_TOKEN,
				eventToken: 'signup-clicked'
			});
		});

		it('sends a data event with its payload', async () => {
			const net = stubNetwork();
			bootConsumerApp(config);

			TestBed.inject(BloomsightService).trackData('plan-selected', {plan: 'pro', seats: 5});

			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(1));
			const sent = net.to(INGEST_EVENT);
			expect(sent[0]!.body).toMatchObject({
				eventToken: 'plan-selected',
				data: {plan: 'pro', seats: 5}
			});
		});

		it('sends the visitor context the dashboard reports on', async () => {
			const net = stubNetwork();
			bootConsumerApp(config);

			TestBed.inject(BloomsightService).track('signup-clicked');

			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(1));
			const body = net.to(INGEST_EVENT)[0]!.body as Record<string, unknown>;
			for (const field of ['userId', 'sessionId', 'occurredAt', 'url', 'browserName', 'osName', 'deviceType']) {
				expect(body, `payload is missing ${field}`).toHaveProperty(field);
			}
			expect(Number.isNaN(Date.parse(body['occurredAt'] as string))).toBe(false);
		});

		it('honours apiBase, so a project can be pointed at staging first', async () => {
			const net = stubNetwork();
			bootConsumerApp(config);

			TestBed.inject(BloomsightService).track('signup-clicked');

			// `every` is true of an empty list, so first require that the event
			// was actually sent (review RV6).
			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(1));
			expect(net.requests.every((r) => r.url.startsWith(API_BASE))).toBe(true);
			expect(net.toHost('https://z.bloomscorp.com')).toHaveLength(0);
		});

		it('never contacts the standalone Bloomsight server for events', async () => {
			// The migration guarantee: once a project is on blooms.ai, nothing it
			// tracks may still reach the old server.
			const net = stubNetwork();
			bootConsumerApp(config);
			const events = TestBed.inject(BloomsightService);

			events.track('signup-clicked');
			events.trackData('plan-selected', {plan: 'pro'});

			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(2));
			await settle();
			expect(net.toHost(B1_HOST)).toHaveLength(0);
		});
	});

	describe('page views', () => {

		it('are not sent — blooms.ai has no page-view endpoint', async () => {
			// The wrapper does not observe the router under B2 at all; whatever the
			// reason, the request must never happen.
			const net = stubNetwork();
			bootConsumerApp(config);
			const events = TestBed.inject(BloomsightService);
			const router = TestBed.inject(Router);

			await router.navigateByUrl('/home');
			await router.navigateByUrl('/about');
			// Absence proves nothing unless the core is demonstrably alive in this
			// test, so an explicit event must get through, and be the only event
			// that does.
			events.track('liveness-check');

			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(1));
			await settle();
			expect(net.to(INGEST_EVENT).map((r) => (r.body as {eventToken: string}).eventToken)).toEqual(['liveness-check']);
			expect(net.requests.some((r) => r.url.includes('page-view'))).toBe(false);
			expect(net.toHost(B1_HOST)).toHaveLength(0);
		});
	});

	describe('failures reach the app through onError', () => {

		it("passes the server's own rejection code through", async () => {
			stubNetwork((url) => url === INGEST_EVENT
				? {status: 403, body: {success: false, code: 'ORIGIN_REJECTED', message: 'origin not allowed'}}
				: undefined);
			bootConsumerApp(config);

			TestBed.inject(BloomsightService).track('signup-clicked');

			await vi.waitFor(() => expect(errors).toContainEqual(expect.objectContaining({
				code: 'ORIGIN_REJECTED',
				status: 403,
				eventToken: 'signup-clicked'
			})));
		});

		it('reports an unreachable server as NETWORK_FAILURE', async () => {
			stubNetwork((url) => url === INGEST_EVENT ? {networkError: true} : undefined);
			bootConsumerApp(config);

			TestBed.inject(BloomsightService).track('signup-clicked');

			await vi.waitFor(() => expect(errors).toContainEqual(expect.objectContaining({
				code: 'NETWORK_FAILURE',
				eventToken: 'signup-clicked'
			})));
		});

		it('reach errors$ too, for an app that subscribes instead of configuring onError', async () => {
			stubNetwork((url) => url === INGEST_EVENT
				? {status: 403, body: {success: false, code: 'ORIGIN_REJECTED', message: 'origin not allowed'}}
				: undefined);
			bootConsumerApp(config);
			const bloomsight = TestBed.inject(BloomsightService);
			const reported: BloomsightError[] = [];
			bloomsight.errors$.subscribe((e) => reported.push(e));

			bloomsight.track('signup-clicked');

			await vi.waitFor(() => expect(reported).toContainEqual(expect.objectContaining({
				code: 'ORIGIN_REJECTED',
				status: 403,
				eventToken: 'signup-clicked'
			})));
		});

		it('reports every failure, not only the first of each kind', async () => {
			// The core deduplicates its console warning per code; the onError
			// callback must still fire every time, or an app's monitoring would see
			// one failure where there were many.
			stubNetwork((url) => url === INGEST_EVENT
				? {status: 403, body: {success: false, code: 'ORIGIN_REJECTED'}}
				: undefined);
			bootConsumerApp(config);
			const events = TestBed.inject(BloomsightService);

			events.track('first');
			events.track('second');

			await vi.waitFor(() => expect(
				errors.filter((e) => e.code === 'ORIGIN_REJECTED').map((e) => e.eventToken)
			).toEqual(['first', 'second']));
		});
	});
});
