import {vi} from 'vitest';

import {Activity, describe as describeValue, installActivityCapture} from './activity';

/** A window stand-in: its own fetch and console, so nothing global is touched. */
function fakeWindow(respond: () => Promise<Response> = async () => new Response('{}', {status: 201})) {
	return {
		fetch: vi.fn(respond) as unknown as typeof fetch,
		console: {log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn()}
	};
}

/** Entries are recorded a microtask after the call. */
const flush = (): Promise<void> => new Promise((resolve) => queueMicrotask(resolve));

describe('Activity', () => {

	it('keeps entries newest first', () => {
		const activity = new Activity();

		activity.record('log', 'first');
		activity.record('log', 'second');

		expect(activity.entries().map((e) => e.summary)).toEqual(['second', 'first']);
	});

	it('keeps the most recent 200 entries', () => {
		const activity = new Activity();

		for (let i = 0; i < 205; i++) activity.record('log', `line ${i}`);

		expect(activity.entries()).toHaveLength(200);
		expect(activity.entries()[0]!.summary).toBe('line 204');
	});

	it('clears', () => {
		const activity = new Activity();
		activity.record('log', 'line');

		activity.clear();

		expect(activity.entries()).toEqual([]);
	});
});

describe('installActivityCapture', () => {

	it('records a request with its method, URL, status and body, and passes the response through', async () => {
		const activity = new Activity();
		const win = fakeWindow();
		installActivityCapture(activity, win);

		const response = await win.fetch('https://api.test/ingest', {method: 'post', body: '{"eventToken":"signup"}'});
		await flush();

		expect(response.status).toBe(201);
		expect(activity.entries()).toEqual([expect.objectContaining({
			kind: 'request',
			summary: 'POST https://api.test/ingest → 201',
			detail: '{"eventToken":"signup"}'
		})]);
	});

	it('reads the URL and method from a URL or a Request too', async () => {
		const activity = new Activity();
		const win = fakeWindow();
		installActivityCapture(activity, win);

		await win.fetch(new URL('https://api.test/a'));
		await win.fetch(new Request('https://api.test/b', {method: 'PUT'}));
		await flush();

		expect(activity.entries().map((e) => e.summary)).toEqual([
			'PUT https://api.test/b → 201',
			'GET https://api.test/a → 201'
		]);
	});

	it('records a request that never reached the server, and still fails it', async () => {
		const activity = new Activity();
		const win = fakeWindow(async () => {
			throw new TypeError('Failed to fetch');
		});
		installActivityCapture(activity, win);

		await expect(win.fetch('https://api.test/ingest', {method: 'POST'})).rejects.toThrow('Failed to fetch');
		await flush();

		expect(activity.entries()[0]!.summary).toBe('POST https://api.test/ingest → network error');
	});

	it('records console lines by level, and still writes them to the console', async () => {
		const activity = new Activity();
		const win = fakeWindow();
		const {log, warn, error, info} = win.console;
		installActivityCapture(activity, win);

		win.console.log('email data:', {name: 'Asha'});
		win.console.info('note');
		win.console.warn('careful');
		win.console.error('broken');
		await flush();

		expect(log).toHaveBeenCalledWith('email data:', {name: 'Asha'});
		expect(info).toHaveBeenCalledWith('note');
		expect(warn).toHaveBeenCalledWith('careful');
		expect(error).toHaveBeenCalledWith('broken');
		expect(activity.entries().map((e) => [e.kind, e.summary])).toEqual([
			['error', 'broken'],
			['warn', 'careful'],
			['log', 'note'],
			['log', 'email data: {\n  "name": "Asha"\n}']
		]);
	});

	it('records nothing inline, so a console call during rendering cannot write a signal', () => {
		const activity = new Activity();
		const win = fakeWindow();
		installActivityCapture(activity, win);

		win.console.log('during render');

		expect(activity.entries()).toEqual([]);
	});

	it('can be undone', async () => {
		const activity = new Activity();
		const win = fakeWindow();
		const {fetch: originalFetch, log: originalLog} = {...win, ...win.console};

		const uninstall = installActivityCapture(activity, win);
		uninstall();
		win.console.log('after');
		await flush();

		expect(win.fetch).toBe(originalFetch);
		expect(win.console.log).toBe(originalLog);
		expect(activity.entries()).toEqual([]);
	});
});

describe('describe', () => {

	it('shows form data as its fields, including files by name', () => {
		const data = new FormData();
		data.append('templateId', 't-1');
		data.append('attachment', new File(['x'], 'cv.pdf'));

		expect(JSON.parse(describeValue(data))).toEqual({templateId: 't-1', attachment: '[file cv.pdf]'});
	});

	it('shows nothing for nothing, strings as themselves, errors by message', () => {
		expect(describeValue(undefined)).toBe('');
		expect(describeValue(null)).toBe('');
		expect(describeValue('plain')).toBe('plain');
		expect(describeValue(new Error('boom'))).toBe('boom');
	});

	it('falls back to text for what JSON cannot show', () => {
		const circular: Record<string, unknown> = {};
		circular['self'] = circular;

		expect(describeValue(circular)).toBe('[object Object]');
		expect(describeValue(() => 1)).toContain('=>');
	});
});
