import {vi} from 'vitest';

import {
	browserStorage, clearSettings, DEFAULT_SETTINGS, describeBackend, loadSettings, PLACEHOLDER_TOKEN,
	saveSettings, toBloomsightConfig
} from './demo-settings';

/** An in-memory Storage, so each test starts empty. */
function memoryStorage(initial: Record<string, string> = {}): Storage {
	const data = new Map(Object.entries(initial));
	return {
		get length() { return data.size; },
		clear: () => data.clear(),
		getItem: (key) => data.get(key) ?? null,
		key: (i) => [...data.keys()][i] ?? null,
		removeItem: (key) => void data.delete(key),
		setItem: (key, value) => void data.set(key, String(value))
	};
}

const KEY = 'ngx-bloomsight-demo:settings';

describe('demo settings', () => {

	it('default to sending nothing (D5)', () => {
		// A fresh checkout must never write to production analytics.
		expect(DEFAULT_SETTINGS.logOnly).toBe(true);
		expect(DEFAULT_SETTINGS.propertyToken).toBe(PLACEHOLDER_TOKEN);
		expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
	});

	it('round-trip through storage', () => {
		const storage = memoryStorage();
		const custom = {...DEFAULT_SETTINGS, target: 'blooms-ai' as const, apiBase: 'https://staging.test', stopDataEvent: true};

		expect(saveSettings(custom, storage)).toBe(true);
		expect(loadSettings(storage)).toEqual(custom);
	});

	it('fall back to the defaults when the saved entry is not JSON', () => {
		expect(loadSettings(memoryStorage({[KEY]: '{not json'}))).toEqual(DEFAULT_SETTINGS);
	});

	it('fall back field by field when a value has the wrong type', () => {
		const storage = memoryStorage({[KEY]: JSON.stringify({logOnly: 'no', debug: false, target: 'somewhere-else', propertyToken: 42})});

		const settings = loadSettings(storage);

		expect(settings.logOnly).toBe(true);          // 'no' is not a boolean — default kept
		expect(settings.debug).toBe(false);           // valid — taken
		expect(settings.target).toBe('bloomsight');   // not a known target — default kept
		expect(settings.propertyToken).toBe(PLACEHOLDER_TOKEN);
	});

	it('fall back to the defaults when storage is unavailable', () => {
		const blocked = memoryStorage();
		blocked.getItem = () => {
			throw new DOMException('denied', 'SecurityError');
		};

		expect(loadSettings(blocked)).toEqual(DEFAULT_SETTINGS);
	});

	it('treat a browser that refuses localStorage itself as having none', () => {
		// Reading window.localStorage throws when site data is blocked.
		vi.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => {
			throw new DOMException('denied', 'SecurityError');
		});

		expect(browserStorage()).toBeUndefined();
		expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
		expect(saveSettings(DEFAULT_SETTINGS)).toBe(false);
		vi.restoreAllMocks();
	});

	it('report a save that the browser refused', () => {
		const full = memoryStorage();
		full.setItem = () => {
			throw new DOMException('full', 'QuotaExceededError');
		};

		expect(saveSettings(DEFAULT_SETTINGS, full)).toBe(false);
	});

	it('can be cleared, back to the defaults', () => {
		const storage = memoryStorage();
		saveSettings({...DEFAULT_SETTINGS, logOnly: false}, storage);

		clearSettings(storage);

		expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
	});

	it('survive clearing storage that refuses', () => {
		const blocked = memoryStorage();
		blocked.removeItem = () => {
			throw new DOMException('denied', 'SecurityError');
		};

		expect(() => clearSettings(blocked)).not.toThrow();
	});
});

describe('toBloomsightConfig', () => {

	it('passes every setting through, with the error handler', () => {
		const onError = vi.fn();

		const config = toBloomsightConfig({...DEFAULT_SETTINGS, apiBase: ' https://staging.test '}, onError);

		expect(config).toEqual({
			propertyToken: PLACEHOLDER_TOKEN,
			isDevelopmentMode: true,
			debug: true,
			logOnly: true,
			target: 'bloomsight',
			apiBase: 'https://staging.test',
			stopAll: false,
			stopSimpleEvent: false,
			stopDataEvent: false,
			stopPageViewEvent: false,
			onError
		});
	});

	it('leaves apiBase out when blank, so the SDK uses its default host', () => {
		expect(toBloomsightConfig({...DEFAULT_SETTINGS, apiBase: '  '}, vi.fn())).not.toHaveProperty('apiBase');
	});
});

describe('describeBackend', () => {

	it('names where events would go', () => {
		expect(describeBackend(DEFAULT_SETTINGS)).toBe('the standalone Bloomsight server');
		expect(describeBackend({...DEFAULT_SETTINGS, target: 'blooms-ai'})).toBe('blooms.ai (default host)');
		expect(describeBackend({...DEFAULT_SETTINGS, target: 'blooms-ai', apiBase: 'https://staging.test'}))
			.toBe('blooms.ai (https://staging.test)');
	});
});
