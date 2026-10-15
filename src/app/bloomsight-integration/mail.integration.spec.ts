import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';

import {
	API_BASE, B1_HOST, GMAIL_SEND, PROPERTY_TOKEN, SMTP_SEND,
	bootConsumerApp, stubNetwork
} from './integration-harness';
import {
	BloomsightConfig, BloomsightError, BloomsightMailRequest, BloomsightService
} from '../../../projects/bloomscorp/ngx-bloomsight/src/public-api';

/**
 * Mail is not part of the blooms.ai migration: it always goes to the
 * standalone Bloomsight server. The config here deliberately sets
 * `target: 'blooms-ai'`, so these tests also prove that switching a project
 * over leaves its email untouched.
 */
const config: BloomsightConfig = {
	propertyToken: PROPERTY_TOKEN,
	isDevelopmentMode: false,
	target: 'blooms-ai',
	apiBase: API_BASE
};

function form(fields: Record<string, string>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.append(key, value);
	return data;
}

function mail(overrides: Partial<BloomsightMailRequest> = {}): BloomsightMailRequest {
	return {engineId: 'engine-1', templateId: 'template-2', templateOwnerId: 'owner-3', data: form({}), ...overrides};
}

describe('integration: mail', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('sends GMAIL mail to the GMAIL endpoint on the standalone server', async () => {
		const net = stubNetwork();
		bootConsumerApp(config);

		await firstValueFrom(TestBed.inject(BloomsightService).sendMail(mail()));

		const sent = net.to(GMAIL_SEND);
		expect(sent).toHaveLength(1);
		expect(sent[0]!.method).toBe('POST');
		expect(net.to(SMTP_SEND)).toHaveLength(0);
	});

	it('sends CUSTOM_SMTP mail to the SMTP endpoint', async () => {
		// P6 end to end: the engine has to arrive at the core as the plain string
		// 'CUSTOM_SMTP' for the endpoint choice to go this way.
		const net = stubNetwork();
		bootConsumerApp(config);

		await firstValueFrom(TestBed.inject(BloomsightService).sendMail(mail({engine: 'CUSTOM_SMTP'})));

		expect(net.to(SMTP_SEND)).toHaveLength(1);
		expect(net.to(GMAIL_SEND)).toHaveLength(0);
	});

	it('puts the identifiers and the form fields in the right multipart fields', async () => {
		const net = stubNetwork();
		bootConsumerApp(config);

		await firstValueFrom(TestBed.inject(BloomsightService).sendMail(
			mail({data: form({name: 'Asha', email: 'asha@example.com'})})
		));

		const body = net.to(GMAIL_SEND)[0]!.body as FormData;
		expect(body).toBeInstanceOf(FormData);
		expect(body.get('engineId')).toBe('engine-1');
		expect(body.get('templateId')).toBe('template-2');
		// The core calls the template owner `userId` on the wire.
		expect(body.get('userId')).toBe('owner-3');
		expect(body.get('metadata[name]')).toBe('Asha');
		expect(body.get('metadata[email]')).toBe('asha@example.com');
	});

	it('sends nothing until the caller subscribes', async () => {
		// Cold, like HttpClient. Proven against the network rather than a mock:
		// building the request must not send it.
		const net = stubNetwork();
		bootConsumerApp(config);
		const pending = TestBed.inject(BloomsightService).sendMail(mail());

		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(net.to(GMAIL_SEND)).toHaveLength(0);

		await firstValueFrom(pending);
		expect(net.to(GMAIL_SEND)).toHaveLength(1);
	});

	it('emits and completes when the server accepts the mail', async () => {
		stubNetwork(() => ({body: {success: true}}));
		bootConsumerApp(config);
		const complete = vi.fn();

		TestBed.inject(BloomsightService).sendMail(mail()).subscribe({complete});

		await vi.waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
	});

	it('errors with MAIL_FAILED when the server rejects the mail', async () => {
		stubNetwork(() => ({body: {success: false, message: 'template not found'}}));
		bootConsumerApp(config);

		const error = await firstValueFrom(TestBed.inject(BloomsightService).sendMail(mail())).catch((e: BloomsightError) => e);

		expect(error).toMatchObject({code: 'MAIL_FAILED'});
	});

	it('errors with MAIL_FAILED when the server cannot be reached', async () => {
		stubNetwork(() => ({networkError: true}));
		bootConsumerApp(config);

		const error = await firstValueFrom(TestBed.inject(BloomsightService).sendMail(mail())).catch((e: BloomsightError) => e);

		expect(error).toMatchObject({code: 'MAIL_FAILED'});
	});

	it('keeps mail failures off errors$, where they would be counted twice', async () => {
		// Only the mail server is down. Failing every URL would also fail the
		// SDK's own startup request, which does belong on errors$.
		stubNetwork((url) => url.startsWith(B1_HOST) ? {networkError: true} : undefined);
		bootConsumerApp(config);
		const bloomsight = TestBed.inject(BloomsightService);
		const reported: BloomsightError[] = [];
		bloomsight.errors$.subscribe((e) => reported.push(e));

		await firstValueFrom(bloomsight.sendMail(mail())).catch(() => undefined);

		expect(reported).toEqual([]);
	});
});
