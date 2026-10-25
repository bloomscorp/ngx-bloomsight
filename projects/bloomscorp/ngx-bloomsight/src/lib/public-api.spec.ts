import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';

vi.mock('@bloomscorp/bloomsight.js', () => ({
	init: vi.fn(),
	resolveSimpleEvent: vi.fn(),
	resolveDataEvent: vi.fn(),
	pageViewObserver: vi.fn(),
	configureEmail: vi.fn(),
	sendEmail: vi.fn()
}));

// Deliberately imported from the package's own public surface — the same way a
// consuming application would, and with no reference to
// `@bloomscorp/bloomsight.js`. If this file ever needs a core import to
// compile, the public API is incomplete again (P1).
import * as api from '../public-api';
import {
	BLOOMSIGHT_CONFIG,
	BloomsightConfig,
	BloomsightEmailEngine,
	BloomsightError,
	BloomsightEventData,
	BloomsightMailConfig,
	BloomsightMailRequest,
	BloomsightService,
	provideBloomsight,
	provideBloomsightMail
} from '../public-api';

describe('the public API', () => {

	it('exports exactly the 2.1.0 runtime surface', () => {
		// Pins the deletions as much as the additions: NgxBloomsightModule (D7),
		// the scaffolding component and empty service (P2), and the two 1.x
		// services must not come back by accident. 2.1.0 added
		// provideBloomsightMail; its token stays internal.
		expect(Object.keys(api).sort()).toEqual(['BLOOMSIGHT_CONFIG', 'BloomsightService', 'provideBloomsight', 'provideBloomsightMail']);
	});

	it('lets an email-only app move its mail to blooms.ai without importing the core', () => {
		// thecropcircle.in's setup: no property token, no events, mail only.
		const failures: BloomsightError[] = [];
		function recordFailure(error: BloomsightError): void {
			failures.push(error);
		}

		const mailOnly: BloomsightMailConfig = {target: 'blooms-ai', apiBase: 'https://z.bloomscorp.com', debug: false, logOnly: false, onError: recordFailure};
		TestBed.configureTestingModule({providers: [provideBloomsightMail(mailOnly)]});

		expect(TestBed.inject(BloomsightService)).toBeInstanceOf(BloomsightService);
		expect(failures).toEqual([]);
	});

	it('takes the mail switch in BloomsightConfig too, for apps that record events', () => {
		const config: BloomsightConfig = {propertyToken: 't', isDevelopmentMode: false, emailTarget: 'blooms-ai', emailApiBase: 'https://z.bloomscorp.com'};

		expect(config.emailTarget).toBe('blooms-ai');
	});

	it('rejects a mail target the core does not have, at compile time', () => {
		// @ts-expect-error 'blooms' is not a target.
		const config: BloomsightMailConfig = {target: 'blooms'};

		expect(config.target).toBe('blooms');
	});

	it('lets an app configure a blooms.ai migration without importing the core', () => {
		// The real B2 cutover, written the way a consuming project writes it,
		// using every field a migration touches — including a NAMED error
		// handler, which is the case that needs the error type by name rather
		// than by inference.
		const failures: BloomsightError[] = [];
		function recordFailure(error: BloomsightError): void {
			failures.push(error);
		}

		const migrated: BloomsightConfig = {
			propertyToken: '65d72f0b5e990c6028790156',
			isDevelopmentMode: false,
			target: 'blooms-ai',
			apiBase: 'https://z.bloomscorp.com',
			debug: true,
			logOnly: false,
			stopAll: false,
			stopSimpleEvent: false,
			stopDataEvent: false,
			stopPageViewEvent: false,
			onError: recordFailure
		};
		TestBed.configureTestingModule({providers: [provideBloomsight(migrated)]});

		expect(TestBed.inject(BLOOMSIGHT_CONFIG)).toBe(migrated);
		expect(TestBed.inject(BloomsightService)).toBeInstanceOf(BloomsightService);
		expect(failures).toEqual([]);
	});

	it('names every type a caller builds up before handing it over', () => {
		// Each annotation below compiles only while its type is reachable from
		// the public API.
		const engine: BloomsightEmailEngine = 'CUSTOM_SMTP';
		const payload: BloomsightEventData = {plan: 'pro', seats: 5};
		const mail: BloomsightMailRequest = {engineId: 'e', templateId: 't', templateOwnerId: 'o', data: new FormData(), engine};

		expect([engine, payload['plan'], mail.engine]).toEqual(['CUSTOM_SMTP', 'pro', 'CUSTOM_SMTP']);
	});

	it('rejects an engine name the core does not have, at compile time', () => {
		// @ts-expect-error 'SMTP' is not an engine. The 1.x cast would have let
		// this through and routed the mail to whichever endpoint the core
		// defaulted to.
		const engine: BloomsightEmailEngine = 'SMTP';

		expect(engine).toBe('SMTP');
	});
});
