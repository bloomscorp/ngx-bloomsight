import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';

import {
	API_BASE, B1_HOST, INGEST_EVENT, PROPERTY_TOKEN,
	bootConsumerApp, settle, stubNetwork
} from './integration-harness';
import {
	BloomsightConfig, BloomsightError, BloomsightEventService
} from '../../../projects/bloomscorp/ngx-bloomsight/src/public-api';

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

			TestBed.inject(BloomsightEventService).resolveSimpleEvent('signup-clicked');

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

			TestBed.inject(BloomsightEventService).resolveDataEvent('plan-selected', {plan: 'pro', seats: 5});

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

			TestBed.inject(BloomsightEventService).resolveSimpleEvent('signup-clicked');

			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(1));
			const body = net.to(INGEST_EVENT)[0]!.body as Record<string, unknown>;
			for (const field of ['userId', 'sessionId', 'occurredAt', 'url', 'browserName', 'osName', 'deviceType']) {
				expect(body, `payload is missing ${field}`).toHaveProperty(field);
			}
			expect(Number.isNaN(Date.parse(body['occurredAt'] as string))).toBe(false);
		});

		it('does not send the label — no backend has ever recorded it', async () => {
			// Pinned, not endorsed. Both resolveSimpleEvent and resolveDataEvent
			// accept a label at every layer — ngx-bloomsight, the core's public
			// API, and both the B1 and B2 implementations — and none of them puts
			// it in a payload. A caller passing one reasonably believes it is
			// recorded. Whether to drop the parameter or start sending it is a
			// 2.0.0 decision; until then this fails loudly if it changes.
			const net = stubNetwork();
			bootConsumerApp(config);

			TestBed.inject(BloomsightEventService).resolveSimpleEvent('signup-clicked', 'hero-button');

			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(1));
			expect(JSON.stringify(net.to(INGEST_EVENT)[0]!.body)).not.toContain('hero-button');
		});

		it('honours apiBase, so a project can be pointed at staging first', async () => {
			const net = stubNetwork();
			bootConsumerApp(config);

			TestBed.inject(BloomsightEventService).resolveSimpleEvent('signup-clicked');

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
			const events = TestBed.inject(BloomsightEventService);

			events.resolveSimpleEvent('signup-clicked');
			events.resolveDataEvent('plan-selected', {plan: 'pro'});

			await vi.waitFor(() => expect(net.to(INGEST_EVENT)).toHaveLength(2));
			await settle();
			expect(net.toHost(B1_HOST)).toHaveLength(0);
		});
	});

	describe('page views', () => {

		it('are not sent — blooms.ai has no page-view endpoint', async () => {
			// The SDK turns pageViewObserver() into a no-op under B2. The wrapper
			// still subscribes to the router; the request must simply never happen.
			const net = stubNetwork();
			bootConsumerApp(config);
			const events = TestBed.inject(BloomsightEventService);
			const router = TestBed.inject(Router);

			await router.navigateByUrl('/home');
			await router.navigateByUrl('/about');
			// Absence proves nothing unless the core is demonstrably alive in this
			// test. (It initialises once per file, so its startup requests belong to
			// whichever test ran first.) An explicit event must get through, and be
			// the only thing that does.
			events.resolveSimpleEvent('liveness-check');

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

			TestBed.inject(BloomsightEventService).resolveSimpleEvent('signup-clicked');

			await vi.waitFor(() => expect(errors).toContainEqual(expect.objectContaining({
				code: 'ORIGIN_REJECTED',
				status: 403,
				eventToken: 'signup-clicked'
			})));
		});

		it('reports an unreachable server as NETWORK_FAILURE', async () => {
			stubNetwork((url) => url === INGEST_EVENT ? {networkError: true} : undefined);
			bootConsumerApp(config);

			TestBed.inject(BloomsightEventService).resolveSimpleEvent('signup-clicked');

			await vi.waitFor(() => expect(errors).toContainEqual(expect.objectContaining({
				code: 'NETWORK_FAILURE',
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
			const events = TestBed.inject(BloomsightEventService);

			events.resolveSimpleEvent('first');
			events.resolveSimpleEvent('second');

			await vi.waitFor(() => expect(
				errors.filter((e) => e.code === 'ORIGIN_REJECTED').map((e) => e.eventToken)
			).toEqual(['first', 'second']));
		});
	});
});
