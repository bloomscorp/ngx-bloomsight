import {vi} from 'vitest';
import {PLATFORM_ID, Provider} from '@angular/core';
import {TestBed} from '@angular/core/testing';

vi.mock('@bloomscorp/bloomsight.js', () => ({
	init: vi.fn(),
	resolveSimpleEvent: vi.fn(),
	resolveDataEvent: vi.fn(),
	pageViewObserver: vi.fn(),
	sendEmail: vi.fn()
}));

import * as core from '@bloomscorp/bloomsight.js';
import {BloomsightService} from './bloomsight.service';
import {BLOOMSIGHT_CONFIG} from './bloomsight-config.token';
import {BloomsightConfig} from './type/bloomsight-config';
import {BloomsightError} from './type/bloomsight-error';
import {BloomsightMailRequest} from './type/bloomsight-mail-request';

const config: BloomsightConfig = {propertyToken: '65d72f0b5e990c6028790156', isDevelopmentMode: false};

/**
 * The service on its own, with the config provided directly rather than
 * through `provideBloomsight()`. Starting the SDK is not the service's job, and
 * leaving the initializer out is what lets these tests prove that.
 */
function service(appConfig: BloomsightConfig = config, providers: Provider[] = []): BloomsightService {
	TestBed.configureTestingModule({providers: [{provide: BLOOMSIGHT_CONFIG, useValue: appConfig}, ...providers]});
	return TestBed.inject(BloomsightService);
}

function request(overrides: Partial<BloomsightMailRequest> = {}): BloomsightMailRequest {
	return {engineId: 'engine-1', templateId: 'template-2', templateOwnerId: 'owner-3', data: new FormData(), ...overrides};
}

/** The arguments the core's `sendEmail` received on its only call. */
function coreArgs(): unknown[] {
	expect(core.sendEmail).toHaveBeenCalledTimes(1);
	return vi.mocked(core.sendEmail).mock.calls[0]!;
}

/** Make the core's `sendEmail` answer the way the server would. */
function coreMailAnswers(outcome: 'success' | 'failure'): void {
	vi.mocked(core.sendEmail).mockImplementation((...args: unknown[]) => {
		(args[outcome === 'success' ? 5 : 6] as () => void)();
	});
}

/** Everything an Observable did, in order. */
function record(source: ReturnType<BloomsightService['sendMail']>) {
	const seen: string[] = [];
	let error: unknown;
	source.subscribe({
		next: () => seen.push('next'),
		error: (e) => {
			seen.push('error');
			error = e;
		},
		complete: () => seen.push('complete')
	});
	return {seen, error: () => error as BloomsightError};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(core.sendEmail).mockReset();
});

describe('BloomsightService', () => {

	it('refuses to work without provideBloomsight(), and says what is missing', () => {
		TestBed.configureTestingModule({});

		expect(() => TestBed.inject(BloomsightService)).toThrow(/never called provideBloomsight\(\)/);
	});

	it('does not start the SDK itself — injecting it has no side effects', () => {
		// 1.x started the SDK in the constructor (B1, B7, B8).
		service();

		expect(core.init).not.toHaveBeenCalled();
		expect(core.pageViewObserver).not.toHaveBeenCalled();
	});

	it('exposes errors$ read-only, so nothing outside the SDK can fake a failure', () => {
		expect('next' in service().errors$).toBe(false);
	});
});

describe('track', () => {

	it('records a simple event, with the token only', () => {
		service().track('signup-clicked');

		expect(core.resolveSimpleEvent).toHaveBeenCalledExactlyOnceWith('signup-clicked');
	});

	it('takes no label — no backend ever recorded one (F1)', () => {
		// @ts-expect-error The label was dropped in 2.0.0. If this line ever
		// compiles again, the parameter has come back.
		service().track('signup-clicked', 'hero-button');

		expect(core.resolveSimpleEvent).toHaveBeenCalledExactlyOnceWith('signup-clicked');
	});
});

describe('trackData', () => {

	it('records a data event with its payload, by reference', () => {
		const payload = {plan: 'pro', seats: 5, annual: true};

		service().trackData('plan-selected', payload);

		expect(core.resolveDataEvent).toHaveBeenCalledExactlyOnceWith('plan-selected', payload);
		expect(vi.mocked(core.resolveDataEvent).mock.calls[0]![1]).toBe(payload);
	});

	it('takes no label (F1)', () => {
		// @ts-expect-error The label was dropped in 2.0.0.
		service().trackData('plan-selected', {plan: 'pro'}, 'pricing');

		expect(core.resolveDataEvent).toHaveBeenCalledExactlyOnceWith('plan-selected', {plan: 'pro'});
	});
});

describe('sendMail', () => {

	it('sends nothing until subscribed to', () => {
		service().sendMail(request());

		expect(core.sendEmail).not.toHaveBeenCalled();
	});

	it('maps every field to its position in the core signature', () => {
		// The core takes the engine first, then three strings in a row. A
		// mix-up there compiles cleanly, so every position is asserted.
		const data = new FormData();

		service().sendMail(request({engine: 'CUSTOM_SMTP', data})).subscribe();

		const [engine, engineId, templateId, ownerId, metaData] = coreArgs();
		expect(engine).toBe('CUSTOM_SMTP');
		expect(engineId).toBe('engine-1');
		expect(templateId).toBe('template-2');
		expect(ownerId).toBe('owner-3');
		expect(metaData).toBe(data);
	});

	it('defaults the engine to GMAIL, as the plain string the core compares against (P6)', () => {
		service().sendMail(request()).subscribe();

		expect(coreArgs()[0]).toBe('GMAIL');
	});

	it('passes the form data through untouched', () => {
		const data = new FormData();
		data.append('name', 'Asha');
		data.append('email', 'asha@example.com');

		service().sendMail(request({data})).subscribe();

		const sent = coreArgs()[4] as FormData;
		expect(sent).toBe(data);
		expect(sent.get('name')).toBe('Asha');
		expect(sent.get('email')).toBe('asha@example.com');
	});

	it('sends once per subscription, like HttpClient', () => {
		const mail = service().sendMail(request());

		mail.subscribe();
		mail.subscribe();

		expect(core.sendEmail).toHaveBeenCalledTimes(2);
	});

	it('emits once and completes when the server accepts the mail', () => {
		coreMailAnswers('success');

		expect(record(service().sendMail(request())).seen).toEqual(['next', 'complete']);
	});

	it('errors with MAIL_FAILED, and never emits, when the server does not', () => {
		coreMailAnswers('failure');

		const result = record(service().sendMail(request()));

		expect(result.seen).toEqual(['error']);
		expect(result.error()).toEqual({
			code: 'MAIL_FAILED',
			message: 'The mail was not sent: the server rejected it or could not be reached'
		});
	});

	it('errors with MAIL_FAILED, with the cause, when the core throws', () => {
		vi.mocked(core.sendEmail).mockImplementation(() => {
			throw new TypeError('emailMetaData.forEach is not a function');
		});

		const result = record(service().sendMail(request()));

		expect(result.seen).toEqual(['error']);
		expect(result.error()).toEqual({
			code: 'MAIL_FAILED',
			message: 'The mail was not sent: emailMetaData.forEach is not a function'
		});
	});

	it('reports a thrown value that is not an Error as itself', () => {
		vi.mocked(core.sendEmail).mockImplementation(() => {
			throw 'quota exceeded';
		});

		expect(record(service().sendMail(request())).error().message).toBe('The mail was not sent: quota exceeded');
	});

	it('waits for the server, when not under logOnly', () => {
		// The core has the mail and has not answered yet. Finishing early would
		// tell the caller a mail was sent before anyone knows.
		const result = record(service().sendMail(request()));

		expect(core.sendEmail).toHaveBeenCalledTimes(1);
		expect(result.seen).toEqual([]);
	});

	it('under logOnly, hands the mail to the core and then emits and completes (F2)', () => {
		// The core logs the mail and returns without calling either callback,
		// which in 1.x left a "sending…" UI waiting forever.
		const result = record(service({...config, logOnly: true}).sendMail(request()));

		expect(core.sendEmail).toHaveBeenCalledTimes(1);
		expect(result.seen).toEqual(['next', 'complete']);
	});
});

describe('during server-side rendering (A3)', () => {

	const onServer = (): BloomsightService => service(config, [{provide: PLATFORM_ID, useValue: 'server'}]);

	it('records no events', () => {
		const bloomsight = onServer();

		bloomsight.track('signup-clicked');
		bloomsight.trackData('plan-selected', {plan: 'pro'});

		expect(core.resolveSimpleEvent).not.toHaveBeenCalled();
		expect(core.resolveDataEvent).not.toHaveBeenCalled();
	});

	it('sends no mail, and completes rather than erroring', () => {
		// An unhandled RxJS error is rethrown asynchronously, which on a Node
		// server can take the process down.
		const result = record(onServer().sendMail(request()));

		expect(core.sendEmail).not.toHaveBeenCalled();
		expect(result.seen).toEqual(['complete']);
	});
});
