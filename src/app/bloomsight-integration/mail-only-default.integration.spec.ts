import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';

import {B1_HOST, GMAIL_SEND, bootMailOnlyApp, settle, stubNetwork} from './integration-harness';
import {BloomsightService} from '@bloomscorp/ngx-bloomsight';

/**
 * `provideBloomsightMail()` with no settings: a mail-only app that has not
 * been moved. Its own file, because the core's mail setting is page state and
 * an earlier `target: 'blooms-ai'` would still be in force.
 */
describe('integration: mail-only app, not moved', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('sends to the standalone server, exactly as the script tag did, and nothing at startup', async () => {
		const net = stubNetwork();
		bootMailOnlyApp();
		await settle();
		expect(net.requests).toEqual([]);

		const data = new FormData();
		data.append('name', 'Asha');
		await firstValueFrom(TestBed.inject(BloomsightService).sendMail({engineId: 'engine-1', templateId: 'template-2', templateOwnerId: 'owner-3', data}));

		expect(net.to(GMAIL_SEND)).toHaveLength(1);
		expect(net.requests.filter((r) => !r.url.startsWith(B1_HOST))).toEqual([]);
		expect((net.to(GMAIL_SEND)[0]!.body as FormData).get('metadata[name]')).toBe('Asha');
	});
});
