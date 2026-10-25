import {vi} from 'vitest';
import {PLATFORM_ID} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {firstValueFrom} from 'rxjs';

// The core is replaced wholesale, as in provide-bloomsight.spec.ts. What it
// then sends is covered by the demo app's integration tests, against the real
// core.
vi.mock('@bloomscorp/bloomsight.js', () => ({
	init: vi.fn(),
	configureEmail: vi.fn(),
	resolveSimpleEvent: vi.fn(),
	resolveDataEvent: vi.fn(),
	pageViewObserver: vi.fn(),
	sendEmail: vi.fn()
}));

import * as core from '@bloomscorp/bloomsight.js';
import {provideBloomsightMail} from './provide-bloomsight-mail';
import {provideBloomsight} from './provide-bloomsight';
import {BloomsightService} from './bloomsight.service';
import {BloomsightMailConfig} from './type/bloomsight-mail-config';
import {BloomsightMailRequest} from './type/bloomsight-mail-request';

/** Start an app the way a consumer does: the first inject runs the initializers. */
function startApp(...providers: Parameters<typeof TestBed.configureTestingModule>[0]['providers'] & unknown[]): BloomsightService {
	TestBed.configureTestingModule({providers});
	return TestBed.inject(BloomsightService);
}

/** What the core's configureEmail received on its only call. */
function handed(): BloomsightMailConfig {
	expect(core.configureEmail).toHaveBeenCalledTimes(1);
	return vi.mocked(core.configureEmail).mock.calls[0]![0]!;
}

const mail: BloomsightMailRequest = {engineId: 'engine-1', templateId: 'template-2', templateOwnerId: 'owner-3', data: new FormData()};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(core.sendEmail).mockReset();
});

describe('provideBloomsightMail', () => {

	it("hands the settings to the core's configureEmail, once, when the app starts", () => {
		const onError = vi.fn();
		startApp(provideBloomsightMail({target: 'blooms-ai', apiBase: 'https://staging.example.test', onError, debug: true}));

		expect(core.configureEmail).toHaveBeenCalledTimes(1);
		expect(handed()).toMatchObject({target: 'blooms-ai', apiBase: 'https://staging.example.test', debug: true});
	});

	it("reports the core's mail failures to errors$ and to the app's onError (D4)", () => {
		const onError = vi.fn();
		const bloomsight = startApp(provideBloomsightMail({target: 'blooms-ai', onError}));
		const reported: unknown[] = [];
		bloomsight.errors$.subscribe((e) => reported.push(e));
		const failure = {code: 'TEMPLATE_NOT_FOUND', message: 'Template not found', status: 404};

		handed().onError!(failure);

		expect(reported).toEqual([failure]);
		expect(onError).toHaveBeenCalledWith(failure);
	});

	it('still reports to errors$ when the app gave no onError', () => {
		const bloomsight = startApp(provideBloomsightMail({target: 'blooms-ai'}));
		const reported: unknown[] = [];
		bloomsight.errors$.subscribe((e) => reported.push(e));

		expect(() => handed().onError!({code: 'NETWORK_FAILURE', message: 'down'})).not.toThrow();
		expect(reported).toHaveLength(1);
	});

	it('starts no event tracking: no init(), no page views, nothing sent at startup', () => {
		startApp(provideBloomsightMail({target: 'blooms-ai'}));

		expect(core.init).not.toHaveBeenCalled();
		expect(core.pageViewObserver).not.toHaveBeenCalled();
		expect(core.sendEmail).not.toHaveBeenCalled();
	});

	it('works with no config at all: the core keeps its default, the standalone server', () => {
		startApp(provideBloomsightMail());

		expect(Object.keys(handed())).toEqual(['onError']);
	});

	it('needs no router', () => {
		// provideBloomsight() watches the router; a mail-only app may have none.
		expect(() => startApp(provideBloomsightMail({target: 'blooms-ai'}))).not.toThrow();
	});

	it('keeps logOnly to itself: the core is never told', () => {
		startApp(provideBloomsightMail({target: 'blooms-ai', logOnly: true}));

		expect(handed()).not.toHaveProperty('logOnly');
		expect(handed().target).toBe('blooms-ai');
	});

	it('does not touch the config object it was given', () => {
		const config: BloomsightMailConfig = Object.freeze({target: 'blooms-ai', logOnly: true});
		expect(() => startApp(provideBloomsightMail(config))).not.toThrow();
		expect(config).toEqual({target: 'blooms-ai', logOnly: true});
	});

	it('does nothing during server-side rendering (A3)', () => {
		startApp(provideBloomsightMail({target: 'blooms-ai'}), {provide: PLATFORM_ID, useValue: 'server'});

		expect(core.configureEmail).not.toHaveBeenCalled();
	});

	it('lets the app start even if the core throws (RV4)', () => {
		vi.mocked(core.configureEmail).mockImplementationOnce(() => {
			throw new Error('broken core');
		});
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		expect(() => startApp(provideBloomsightMail({target: 'blooms-ai'}))).not.toThrow();
		expect(error).toHaveBeenCalledWith(expect.stringContaining('refused the mail settings'), 'broken core');
		error.mockRestore();
	});

	it('reports a thrown value that is not an Error as itself', () => {
		vi.mocked(core.configureEmail).mockImplementationOnce(() => {
			throw 'no target';
		});
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		expect(() => startApp(provideBloomsightMail({target: 'blooms-ai'}))).not.toThrow();
		expect(error).toHaveBeenCalledWith(expect.any(String), 'no target');
		error.mockRestore();
	});
});

describe('BloomsightService under provideBloomsightMail', () => {

	it('sends mail through the core, exactly as under provideBloomsight', async () => {
		vi.mocked(core.sendEmail).mockImplementation((...args: unknown[]) => (args[5] as () => void)());
		const bloomsight = startApp(provideBloomsightMail({target: 'blooms-ai'}));

		await firstValueFrom(bloomsight.sendMail(mail));

		expect(core.sendEmail).toHaveBeenCalledTimes(1);
		expect(vi.mocked(core.sendEmail).mock.calls[0]!.slice(0, 5)).toEqual(['GMAIL', 'engine-1', 'template-2', 'owner-3', mail.data]);
	});

	it('waits for the server: logOnly is not on unless the mail config says so', () => {
		const bloomsight = startApp(provideBloomsightMail({target: 'blooms-ai'}));
		const next = vi.fn();

		bloomsight.sendMail(mail).subscribe({next});

		expect(next).not.toHaveBeenCalled();
	});

	it('errors with MAIL_FAILED when the server does not accept it', async () => {
		vi.mocked(core.sendEmail).mockImplementation((...args: unknown[]) => (args[6] as () => void)());
		const bloomsight = startApp(provideBloomsightMail({target: 'blooms-ai'}));

		await expect(firstValueFrom(bloomsight.sendMail(mail))).rejects.toMatchObject({code: 'MAIL_FAILED'});
	});

	it('under logOnly, logs the mail, does not call the core, and still succeeds', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
		const bloomsight = startApp(provideBloomsightMail({logOnly: true}));
		const seen: string[] = [];

		await new Promise<void>((done) => bloomsight.sendMail(mail).subscribe({next: () => seen.push('next'), complete: () => { seen.push('complete'); done(); }}));

		expect(seen).toEqual(['next', 'complete']);
		expect(core.sendEmail).not.toHaveBeenCalled();
		expect(log).toHaveBeenCalledWith(expect.stringContaining('logOnly'), mail);
		log.mockRestore();
	});

	it('records no events, and warns once that none are set up', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const bloomsight = startApp(provideBloomsightMail());

		bloomsight.track('65d735b122354c8ba6a489c2');
		bloomsight.trackData('65d735b122354c8ba6a489c2', {plan: 'pro'});
		bloomsight.track('65d735b122354c8ba6a489c2');

		expect(core.resolveSimpleEvent).not.toHaveBeenCalled();
		expect(core.resolveDataEvent).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0]![0]).toContain('provideBloomsightMail()');
		warn.mockRestore();
	});

	it('sends no mail during server-side rendering, and completes', async () => {
		const bloomsight = startApp(provideBloomsightMail({target: 'blooms-ai'}), {provide: PLATFORM_ID, useValue: 'server'});
		const complete = vi.fn();

		bloomsight.sendMail(mail).subscribe({complete});

		expect(complete).toHaveBeenCalledTimes(1);
		expect(core.sendEmail).not.toHaveBeenCalled();
	});
});

describe('both providers in one app', () => {

	it('records events through provideBloomsight, and gives the mail settings to the core', () => {
		const bloomsight = startApp(
			provideBloomsight({propertyToken: '65d72f0b5e990c6028790156', isDevelopmentMode: false, stopPageViewEvent: true}),
			provideBloomsightMail({target: 'blooms-ai'})
		);

		bloomsight.track('65d735b122354c8ba6a489c2');

		expect(core.init).toHaveBeenCalledTimes(1);
		expect(handed().target).toBe('blooms-ai');
		expect(core.resolveSimpleEvent).toHaveBeenCalledWith('65d735b122354c8ba6a489c2');
	});
});
