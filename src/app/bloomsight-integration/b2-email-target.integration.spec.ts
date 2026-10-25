import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';

import {
	API_BASE, B1_HOST, B2_MAIL_SEND, GMAIL_SEND, PROPERTY_TOKEN,
	bootConsumerApp, settle, stubNetwork
} from './integration-harness';
import {BloomsightConfig, BloomsightService} from '@bloomscorp/ngx-bloomsight';

/**
 * An app that records events moves only its mail, with `emailTarget` in
 * `provideBloomsight()` (RELEASE-2.1.0.md, D3). Events stay on the standalone
 * server: the two switches are independent.
 */
const config: BloomsightConfig = {
	propertyToken: PROPERTY_TOKEN,
	isDevelopmentMode: false,
	stopPageViewEvent: true,
	emailTarget: 'blooms-ai',
	emailApiBase: API_BASE
};

describe('integration: emailTarget moves mail, not events', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('sends mail to blooms.ai, and keeps the events side on the standalone server', async () => {
		const net = stubNetwork(() => ({body: {success: true, message: 'ok', property: {name: 'localhost'}, data: {name: 'localhost'}}}));
		bootConsumerApp(config);
		const bloomsight = TestBed.inject(BloomsightService);
		await settle();

		await firstValueFrom(bloomsight.sendMail({engineId: 'engine-1', templateId: 'template-2', templateOwnerId: 'owner-3', data: new FormData()}));
		bloomsight.track('65d735b122354c8ba6a489c2');
		await settle();

		expect(net.to(B2_MAIL_SEND)).toHaveLength(1);
		expect(net.to(GMAIL_SEND)).toHaveLength(0);
		expect(net.toHost(API_BASE).filter((r) => r.url !== B2_MAIL_SEND)).toEqual([]);
		// init() talks to the standalone server — its property check is there.
		// (The event itself is held back: jsdom's user agent reads as a bot.)
		expect(net.toHost(B1_HOST).map((r) => r.url)).toEqual([`${B1_HOST}/api/v1/property/get/${PROPERTY_TOKEN}`]);
	});
});
