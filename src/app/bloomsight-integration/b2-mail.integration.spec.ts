import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';

import {
	API_BASE, B1_HOST, B2_MAIL_SEND, B2_MAIL_SEND_PRODUCTION,
	bootMailOnlyApp, settle, stubNetwork
} from './integration-harness';
import {BloomsightError, BloomsightMailRequest, BloomsightService} from '@bloomscorp/ngx-bloomsight';

/**
 * A mail-only app moved to blooms.ai with `provideBloomsightMail({ target:
 * 'blooms-ai' })` — thecropcircle.in's setup (RELEASE-2.1.0.md). The real core
 * builds and sends the request; only `fetch` is stubbed.
 */

function form(fields: Record<string, string>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.append(key, value);
	return data;
}

function mail(overrides: Partial<BloomsightMailRequest> = {}): BloomsightMailRequest {
	return {engineId: 'engine-1', templateId: 'template-2', templateOwnerId: 'owner-3', data: form({}), ...overrides};
}

describe('integration: mail-only app, moved to blooms.ai', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('sends nothing at startup: no property check, no events', async () => {
		const net = stubNetwork();
		bootMailOnlyApp({target: 'blooms-ai', apiBase: API_BASE});

		await settle();

		expect(net.requests).toEqual([]);
	});

	it("posts the multipart form to blooms.ai's mail endpoint, and nothing to the standalone server", async () => {
		const net = stubNetwork();
		bootMailOnlyApp({target: 'blooms-ai', apiBase: API_BASE});

		await firstValueFrom(TestBed.inject(BloomsightService).sendMail(
			mail({data: form({name: 'Asha', email: 'asha@example.com'})})
		));

		const sent = net.to(B2_MAIL_SEND);
		expect(sent).toHaveLength(1);
		expect(sent[0]!.method).toBe('POST');
		const body = sent[0]!.body as FormData;
		expect(body).toBeInstanceOf(FormData);
		expect(body.get('engineId')).toBe('engine-1');
		expect(body.get('templateId')).toBe('template-2');
		expect(body.get('userId')).toBe('owner-3');
		expect(body.get('metadata[name]')).toBe('Asha');
		expect(body.get('metadata[email]')).toBe('asha@example.com');
		expect(body.get('senderInfo[url]')).not.toBeNull();
		expect(net.toHost(B1_HOST)).toEqual([]);
	});

	it('sends CUSTOM_SMTP mail to the same endpoint: blooms.ai has one pipeline', async () => {
		const net = stubNetwork();
		bootMailOnlyApp({target: 'blooms-ai', apiBase: API_BASE});

		await firstValueFrom(TestBed.inject(BloomsightService).sendMail(mail({engine: 'CUSTOM_SMTP'})));

		expect(net.to(B2_MAIL_SEND)).toHaveLength(1);
	});

	it("errors with MAIL_FAILED when blooms.ai rejects the mail, and onError and errors$ get the server's code", async () => {
		stubNetwork(() => ({status: 404, body: {success: false, code: 'TEMPLATE_NOT_FOUND', message: 'Template not found'}}));
		const onError = vi.fn();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		bootMailOnlyApp({target: 'blooms-ai', apiBase: API_BASE, onError});
		const bloomsight = TestBed.inject(BloomsightService);
		const reported: BloomsightError[] = [];
		bloomsight.errors$.subscribe((e) => reported.push(e));

		const error = await firstValueFrom(bloomsight.sendMail(mail())).catch((e: BloomsightError) => e);

		expect(error).toMatchObject({code: 'MAIL_FAILED'});
		expect(onError).toHaveBeenCalledWith(expect.objectContaining({code: 'TEMPLATE_NOT_FOUND', status: 404}));
		expect(reported).toEqual([expect.objectContaining({code: 'TEMPLATE_NOT_FOUND'})]);
		warn.mockRestore();
	});

	it('errors with MAIL_FAILED when blooms.ai cannot be reached', async () => {
		stubNetwork(() => ({networkError: true}));
		const onError = vi.fn();
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		bootMailOnlyApp({target: 'blooms-ai', apiBase: API_BASE, onError});

		const error = await firstValueFrom(TestBed.inject(BloomsightService).sendMail(mail())).catch((e: BloomsightError) => e);

		expect(error).toMatchObject({code: 'MAIL_FAILED'});
		expect(onError).toHaveBeenCalledWith(expect.objectContaining({code: 'NETWORK_FAILURE'}));
		warn.mockRestore();
	});

	it('under logOnly sends nothing at all, and still succeeds', async () => {
		const net = stubNetwork();
		const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
		bootMailOnlyApp({target: 'blooms-ai', apiBase: API_BASE, logOnly: true});

		await firstValueFrom(TestBed.inject(BloomsightService).sendMail(mail()));
		await settle();

		expect(net.requests).toEqual([]);
		log.mockRestore();
	});

	it("moves back with target: 'bloomsight' — the switch works both ways", async () => {
		// The core's mail setting is page state; this app is started after the
		// ones above, as a reload with the setting changed would be.
		const net = stubNetwork();
		bootMailOnlyApp({target: 'bloomsight'});

		await firstValueFrom(TestBed.inject(BloomsightService).sendMail(mail()));

		expect(net.to(B2_MAIL_SEND)).toHaveLength(0);
		expect(net.to(B2_MAIL_SEND_PRODUCTION)).toHaveLength(0);
		expect(net.toHost(B1_HOST)).toHaveLength(1);
	});
});
