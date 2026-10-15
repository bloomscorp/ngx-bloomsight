import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';

vi.mock('@bloomscorp/bloomsight.js', () => ({
	init: vi.fn(),
	resolveSimpleEvent: vi.fn(),
	resolveDataEvent: vi.fn(),
	pageViewObserver: vi.fn(),
	sendEmail: vi.fn(),
	EmailEngineTypeEnum: {GMAIL: 'GMAIL', CUSTOM_SMTP: 'CUSTOM_SMTP'}
}));

import * as core from '@bloomscorp/bloomsight.js';
import {BloomsightMailService} from './bloomsight-mail.service';
import {BloomsightEventService} from './bloomsight-event.service';
import {BloomsightConfig} from '../type/bloomsight-config';
import {resetInitGuard} from '../internal/bloomsight-init';

const config: BloomsightConfig = {propertyToken: '65d72f0b5e990c6028790156', isDevelopmentMode: true};

/** The arguments the core's sendEmail received on its only call. */
function coreArgs(): unknown[] {
	expect(core.sendEmail).toHaveBeenCalledTimes(1);
	return vi.mocked(core.sendEmail).mock.calls[0]!;
}

describe('BloomsightMailService', () => {

	beforeEach(() => {
		vi.clearAllMocks();
		resetInitGuard();
		TestBed.configureTestingModule({
			providers: [
				BloomsightMailService,
				{provide: 'bloomsightConfig', useValue: config}
			]
		});
	});

	it('initialises the core once, with exactly the injected config', () => {
		TestBed.inject(BloomsightMailService);

		expect(core.init).toHaveBeenCalledTimes(1);
		expect(core.init).toHaveBeenCalledWith(config);
	});

	describe('sendMail', () => {

		// The wrapper takes (engineId, templateId, ownerId, data, onSuccess,
		// onError, engine) and the core takes engine *first*. A reordering
		// mistake would not fail to compile — engineId, templateId and ownerId
		// are all strings — so every position is asserted individually.
		it('maps every argument to its position in the core signature', () => {
			const service = TestBed.inject(BloomsightMailService);
			const data = new FormData();
			const onSuccess = vi.fn();
			const onError = vi.fn();

			service.sendMail('engine-1', 'template-2', 'owner-3', data, onSuccess, onError, 'CUSTOM_SMTP');

			const [engine, engineId, templateId, ownerId, metaData, success, error] = coreArgs();
			expect(engine).toBe('CUSTOM_SMTP');
			expect(engineId).toBe('engine-1');
			expect(templateId).toBe('template-2');
			expect(ownerId).toBe('owner-3');
			expect(metaData).toBe(data);
			expect(success).toBe(onSuccess);
			expect(error).toBe(onError);
		});

		it('defaults the engine to GMAIL', () => {
			const service = TestBed.inject(BloomsightMailService);

			service.sendMail('e', 't', 'o', new FormData(), vi.fn(), vi.fn());

			expect(coreArgs()[0]).toBe('GMAIL');
		});

		it('hands the core the engine as its plain string value', () => {
			// What P6 was about. The core compares the engine to the string
			// 'GMAIL' to choose the endpoint, so the value must arrive as that
			// exact string — not undefined, which is what an enum missing at
			// runtime would yield.
			const service = TestBed.inject(BloomsightMailService);

			service.sendMail('e', 't', 'o', new FormData(), vi.fn(), vi.fn(), 'GMAIL');

			expect(coreArgs()[0]).toBe(core.EmailEngineTypeEnum.GMAIL);
			expect(typeof coreArgs()[0]).toBe('string');
		});

		it('passes the form data through untouched', () => {
			const service = TestBed.inject(BloomsightMailService);
			const data = new FormData();
			data.append('name', 'Asha');
			data.append('email', 'asha@example.com');

			service.sendMail('e', 't', 'o', data, vi.fn(), vi.fn());

			const sent = coreArgs()[4] as FormData;
			expect(sent).toBe(data);
			expect(sent.get('name')).toBe('Asha');
			expect(sent.get('email')).toBe('asha@example.com');
		});

		it("reports success to the caller when the core succeeds", () => {
			vi.mocked(core.sendEmail).mockImplementation((...args: unknown[]) => (args[5] as () => void)());
			const service = TestBed.inject(BloomsightMailService);
			const onSuccess = vi.fn();
			const onError = vi.fn();

			service.sendMail('e', 't', 'o', new FormData(), onSuccess, onError);

			expect(onSuccess).toHaveBeenCalledTimes(1);
			expect(onError).not.toHaveBeenCalled();
		});

		it('reports failure to the caller when the core fails', () => {
			vi.mocked(core.sendEmail).mockImplementation((...args: unknown[]) => (args[6] as () => void)());
			const service = TestBed.inject(BloomsightMailService);
			const onSuccess = vi.fn();
			const onError = vi.fn();

			service.sendMail('e', 't', 'o', new FormData(), onSuccess, onError);

			expect(onError).toHaveBeenCalledTimes(1);
			expect(onSuccess).not.toHaveBeenCalled();
		});

		it('sends nothing until asked', () => {
			TestBed.inject(BloomsightMailService);

			expect(core.sendEmail).not.toHaveBeenCalled();
		});
	});
});

describe('both services together', () => {

	beforeEach(() => {
		vi.clearAllMocks();
		resetInitGuard();
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				BloomsightEventService,
				BloomsightMailService,
				{provide: 'bloomsightConfig', useValue: config}
			]
		});
	});

	// B1: each service called init() from its own constructor, so an app that
	// injected both initialised the SDK twice — two property checks, and the
	// second constructor silently re-initialising the first one's state.
	it('initialise the core exactly once, events first (B1)', () => {
		TestBed.inject(BloomsightEventService);
		TestBed.inject(BloomsightMailService);

		expect(core.init).toHaveBeenCalledTimes(1);
	});

	it('initialise the core exactly once, mail first (B1)', () => {
		TestBed.inject(BloomsightMailService);
		TestBed.inject(BloomsightEventService);

		expect(core.init).toHaveBeenCalledTimes(1);
	});
});
