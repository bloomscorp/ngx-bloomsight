import {vi} from 'vitest';

vi.mock('@bloomscorp/bloomsight.js', () => ({init: vi.fn()}));

import * as core from '@bloomscorp/bloomsight.js';
import {initOnce, resetInitGuard} from './bloomsight-init';
import {BloomsightConfig} from '../type/bloomsight-config';

const base: BloomsightConfig = {propertyToken: '65d72f0b5e990c6028790156', isDevelopmentMode: true};

describe('initOnce', () => {

	beforeEach(() => {
		vi.clearAllMocks();
		resetInitGuard();
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.mocked(core.init).mockReset();
		vi.restoreAllMocks();
	});

	it('initialises once, however many times it is asked', () => {
		initOnce(base);
		initOnce(base);
		initOnce(base);

		expect(core.init).toHaveBeenCalledExactlyOnceWith(base);
	});

	it('logs a failure even when the app configured no onError', () => {
		// Most apps never set onError. The failure must still be visible, and
		// still must not throw.
		vi.mocked(core.init).mockImplementation(() => {
			throw new Error('boom');
		});

		expect(() => initOnce(base)).not.toThrow();
		expect(console.error).toHaveBeenCalledExactlyOnceWith(
			'ngx-bloomsight:', 'bloomsight.js failed to initialise: boom'
		);
	});

	it('reports a thrown value that is not an Error', () => {
		// Code can throw anything. A string must be reported as itself, not as
		// "undefined" from reading .message off it.
		const onError = vi.fn();
		vi.mocked(core.init).mockImplementation(() => {
			throw 'storage is unavailable';
		});

		initOnce({...base, onError});

		expect(onError).toHaveBeenCalledExactlyOnceWith({
			code: 'INIT_FAILED',
			message: 'bloomsight.js failed to initialise: storage is unavailable'
		});
	});
});
