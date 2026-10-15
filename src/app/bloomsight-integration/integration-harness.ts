import {vi} from 'vitest';
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Routes} from '@angular/router';

// Imported exactly as the demo app imports the library, and never from
// '@bloomscorp/bloomsight.js': these tests are a consumer, and a consumer must
// not need the core (the facade rule, MODERNISATION.md §2).
import {BloomsightConfig, NgxBloomsightModule} from '../../../projects/bloomscorp/ngx-bloomsight/src/public-api';

/**
 * Shared support for the demo app's integration tests.
 *
 * Unlike the library's unit tests, which replace the core with mocks, these run
 * the **real** `@bloomscorp/bloomsight.js` and stub only the network. What they
 * assert is what an app actually sends — URLs, methods and payloads — so they
 * cover the wrapper and the core together, which neither unit suite can.
 *
 * Each scenario lives in its own spec file because the core holds its
 * configuration in module state and initialises once per page. `isolate: true`
 * in angular.json gives every file a fresh module graph, i.e. a fresh page.
 */

export const API_BASE = 'https://staging.bloomsight.test';
export const PROPERTY_TOKEN = '65d72f0b5e990c6028790156';
export const INGEST_EVENT = `${API_BASE}/api/bloomsight/ingest/event`;

/** The standalone Bloomsight server (B1). Mail always goes here. */
export const B1_HOST = 'https://footprint-api.bloomscorp.com';
export const GMAIL_SEND = `${B1_HOST}/api/v1/email-notifier/gmail/send`;
export const SMTP_SEND = `${B1_HOST}/api/v1/email-notifier/smtp/send`;

export interface RecordedRequest {
	url: string;
	method: string;
	/** Parsed JSON for JSON bodies; the FormData itself for multipart ones. */
	body: unknown;
}

export interface StubbedResponse {
	status?: number;
	body?: unknown;
	/** Reject instead of responding, as fetch does when the network is down. */
	networkError?: boolean;
}

/**
 * Replace global `fetch` and record every request the app makes.
 *
 * The default response is the shape both backends treat as success. Pass
 * `respond` to vary it per URL.
 */
export function stubNetwork(respond?: (url: string) => StubbedResponse | undefined) {
	const requests: RecordedRequest[] = [];

	vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		let body: unknown = init?.body;
		if (typeof body === 'string') {
			try {
				body = JSON.parse(body);
			} catch {
				/* leave non-JSON strings as they are */
			}
		}
		requests.push({url, method: (init?.method || 'GET').toUpperCase(), body});

		const reply = respond?.(url) ?? {};
		if (reply.networkError) throw new TypeError('Failed to fetch');
		return new Response(JSON.stringify(reply.body ?? {success: true, data: {}}), {
			status: reply.status ?? 200,
			headers: {'content-type': 'application/json'}
		});
	}));

	return {
		requests,
		/** Requests to a URL, in the order they were made. */
		to: (url: string): RecordedRequest[] => requests.filter((r) => r.url === url),
		/** Requests to any URL on a host. */
		toHost: (host: string): RecordedRequest[] => requests.filter((r) => r.url.startsWith(host))
	};
}

@Component({template: ''})
class Page {
}

export const routes: Routes = [
	{path: 'home', component: Page},
	{path: 'about', component: Page},
	{path: 'old-home', redirectTo: 'home'}
];

/** Configure TestBed the way a real app wires the library in. */
export function bootConsumerApp(config: BloomsightConfig): void {
	TestBed.configureTestingModule({
		imports: [NgxBloomsightModule.forRoot(config)],
		providers: [provideRouter(routes)]
	});
}

/** Let pending fetches and their promise chains settle. */
export async function settle(): Promise<void> {
	for (let i = 0; i < 10; i++) await Promise.resolve();
	await new Promise((resolve) => setTimeout(resolve, 0));
}
