import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';

import {
	API_BASE, GMAIL_SEND, PROPERTY_TOKEN, SMTP_SEND,
	bootConsumerApp, settle, stubNetwork
} from './integration-harness';
import {
	BloomsightConfig, BloomsightMailService
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

describe('integration: mail', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('sends GMAIL mail to the GMAIL endpoint on the standalone server', async () => {
		const net = stubNetwork();
		bootConsumerApp(config);

		TestBed.inject(BloomsightMailService).sendMail('engine-1', 'template-2', 'owner-3', form({name: 'Asha'}), vi.fn(), vi.fn());
		await settle();

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

		TestBed.inject(BloomsightMailService).sendMail('engine-1', 'template-2', 'owner-3', form({}), vi.fn(), vi.fn(), 'CUSTOM_SMTP');
		await settle();

		expect(net.to(SMTP_SEND)).toHaveLength(1);
		expect(net.to(GMAIL_SEND)).toHaveLength(0);
	});

	it('puts the identifiers and the form fields in the right multipart fields', async () => {
		const net = stubNetwork();
		bootConsumerApp(config);

		TestBed.inject(BloomsightMailService).sendMail(
			'engine-1', 'template-2', 'owner-3',
			form({name: 'Asha', email: 'asha@example.com'}),
			vi.fn(), vi.fn()
		);
		await settle();

		const body = net.to(GMAIL_SEND)[0]!.body as FormData;
		expect(body).toBeInstanceOf(FormData);
		expect(body.get('engineId')).toBe('engine-1');
		expect(body.get('templateId')).toBe('template-2');
		// The core calls the template owner `userId` on the wire.
		expect(body.get('userId')).toBe('owner-3');
		expect(body.get('metadata[name]')).toBe('Asha');
		expect(body.get('metadata[email]')).toBe('asha@example.com');
	});

	it('calls onSuccess when the server accepts the mail', async () => {
		stubNetwork(() => ({body: {success: true}}));
		bootConsumerApp(config);
		const onSuccess = vi.fn();
		const onError = vi.fn();

		TestBed.inject(BloomsightMailService).sendMail('e', 't', 'o', form({}), onSuccess, onError);
		await settle();

		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(onError).not.toHaveBeenCalled();
	});

	it('calls onError when the server rejects the mail', async () => {
		stubNetwork(() => ({body: {success: false, message: 'template not found'}}));
		bootConsumerApp(config);
		const onSuccess = vi.fn();
		const onError = vi.fn();

		TestBed.inject(BloomsightMailService).sendMail('e', 't', 'o', form({}), onSuccess, onError);
		await settle();

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it('calls onError when the server cannot be reached', async () => {
		stubNetwork(() => ({networkError: true}));
		bootConsumerApp(config);
		const onSuccess = vi.fn();
		const onError = vi.fn();

		TestBed.inject(BloomsightMailService).sendMail('e', 't', 'o', form({}), onSuccess, onError);
		await settle();

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onSuccess).not.toHaveBeenCalled();
	});
});
