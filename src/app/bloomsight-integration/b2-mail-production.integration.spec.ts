import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';

import {B1_HOST, B2_MAIL_SEND_PRODUCTION, bootMailOnlyApp, stubNetwork} from './integration-harness';
import {BloomsightService} from '@bloomscorp/ngx-bloomsight';

/**
 * `provideBloomsightMail({ target: 'blooms-ai' })` with no `apiBase`, exactly
 * as thecropcircle.in configures it. Its own file: the core's mail setting is
 * page state, so an `apiBase` set by another spec would still be in force.
 */
describe('integration: mail-only app on production blooms.ai', () => {

	afterEach(() => vi.unstubAllGlobals());

	it('goes to https://z.bloomscorp.com when no apiBase is given', async () => {
		const net = stubNetwork();
		bootMailOnlyApp({target: 'blooms-ai'});

		await firstValueFrom(TestBed.inject(BloomsightService).sendMail({engineId: 'engine-1', templateId: 'template-2', templateOwnerId: 'owner-3', data: new FormData()}));

		expect(net.requests.map((r) => r.url)).toEqual([B2_MAIL_SEND_PRODUCTION]);
		expect(net.toHost(B1_HOST)).toEqual([]);
	});
});
