import {vi} from 'vitest';
import {Component, PLATFORM_ID, Provider} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {NavigationEnd, provideRouter, Router, Routes, withRouterConfig} from '@angular/router';
import {Subject} from 'rxjs';

// The core is replaced wholesale, so these tests check what the library asks
// the core to do and nothing else. What the core then does over the network is
// covered by the demo app's integration tests, which run the real core.
vi.mock('@bloomscorp/bloomsight.js', () => ({
	init: vi.fn(),
	resolveSimpleEvent: vi.fn(),
	resolveDataEvent: vi.fn(),
	pageViewObserver: vi.fn(),
	sendEmail: vi.fn()
}));

import * as core from '@bloomscorp/bloomsight.js';
import {provideBloomsight} from './provide-bloomsight';
import {BLOOMSIGHT_CONFIG} from './bloomsight-config.token';
import {BloomsightService} from './bloomsight.service';
import {BloomsightConfig} from './type/bloomsight-config';
import {BloomsightError} from './type/bloomsight-error';

@Component({template: ''})
class Page {
}

const routes: Routes = [
	{path: 'home', component: Page},
	{path: 'about', component: Page},
	{path: 'old-home', redirectTo: 'home'},
	{path: 'locked', component: Page, canActivate: [() => false]}
];

const config: BloomsightConfig = {propertyToken: '65d72f0b5e990c6028790156', isDevelopmentMode: false};

/**
 * Start an app the way a consumer does. The first `inject` creates the test
 * module, which is when Angular runs the app initializers — exactly as
 * `bootstrapApplication` does before any component exists.
 */
function startApp(appConfig: BloomsightConfig = config, providers: Array<Provider | ReturnType<typeof provideRouter>> = [provideRouter(routes)]): void {
	TestBed.configureTestingModule({providers: [...providers, provideBloomsight(appConfig)]});
	TestBed.inject(BLOOMSIGHT_CONFIG);
}

/** The config the core's `init()` received on its only call. */
function initArg(): BloomsightConfig {
	expect(core.init).toHaveBeenCalledTimes(1);
	return vi.mocked(core.init).mock.calls[0]![0];
}

/** A router stand-in whose event stream the test controls and can inspect. */
function fakeRouter(): {events: Subject<unknown>; provider: Provider} {
	const events = new Subject<unknown>();
	return {events, provider: {provide: Router, useValue: {events}}};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('provideBloomsight', () => {

	it('provides the config under BLOOMSIGHT_CONFIG, as given', () => {
		startApp();

		expect(TestBed.inject(BLOOMSIGHT_CONFIG)).toBe(config);
	});

	it('starts the core when the app starts, before anything injects the service (B7, B8)', () => {
		// In 1.x the SDK started from the services' constructors, so an app that
		// injected neither — or injected one only in a lazy route — never started
		// it, or started it late.
		startApp();

		expect(core.init).toHaveBeenCalledTimes(1);
	});

	it("hands the core the app's config, with the library's own error hook", () => {
		startApp();

		expect(initArg()).toEqual({...config, onError: expect.any(Function)});
	});

	it("leaves the app's config object untouched", () => {
		startApp();

		expect(initArg()).not.toBe(config);
		expect(config).not.toHaveProperty('onError');
	});

	it('starts the core once, however much the service is used (B1)', () => {
		startApp();
		const service = TestBed.inject(BloomsightService);
		service.track('one');
		TestBed.inject(BloomsightService).track('two');

		expect(core.init).toHaveBeenCalledTimes(1);
	});

	it('starts in an app that has no router at all', () => {
		startApp(config, []);

		expect(core.init).toHaveBeenCalledTimes(1);
	});
});

describe('during server-side rendering (A3)', () => {

	it('does not start the core', () => {
		startApp(config, [provideRouter(routes), {provide: PLATFORM_ID, useValue: 'server'}]);

		expect(core.init).not.toHaveBeenCalled();
	});

	it('does not record page views', async () => {
		startApp(config, [provideRouter(routes), {provide: PLATFORM_ID, useValue: 'server'}]);

		const landed = await TestBed.inject(Router).navigateByUrl('/home');

		expect(landed).toBe(true);
		expect(core.pageViewObserver).not.toHaveBeenCalled();
	});
});

describe('failures the core reports', () => {

	const failure: BloomsightError = {code: 'ORIGIN_REJECTED', message: 'origin not allowed', status: 403, eventToken: 'signup'};

	it("reach errors$ and the app's own onError", () => {
		const onError = vi.fn();
		startApp({...config, onError});
		const seen: BloomsightError[] = [];
		TestBed.inject(BloomsightService).errors$.subscribe((e) => seen.push(e));

		initArg().onError!(failure);

		expect(seen).toEqual([failure]);
		expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
	});

	it('reach errors$ when the app configured no onError', () => {
		startApp();
		const seen: BloomsightError[] = [];
		TestBed.inject(BloomsightService).errors$.subscribe((e) => seen.push(e));

		initArg().onError!(failure);

		expect(seen).toEqual([failure]);
	});

	it('are reported every time, not once per kind', () => {
		startApp();
		const seen: BloomsightError[] = [];
		TestBed.inject(BloomsightService).errors$.subscribe((e) => seen.push(e));

		initArg().onError!(failure);
		initArg().onError!(failure);

		expect(seen).toHaveLength(2);
	});
});

describe('when the core fails to initialise (RV4)', () => {

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		vi.mocked(core.init).mockImplementation(() => {
			throw new TypeError('m.matchMedia is not a function');
		});
	});

	afterEach(() => {
		vi.mocked(core.init).mockReset();
		vi.restoreAllMocks();
	});

	it('still starts the app', () => {
		// A throwing app initializer aborts bootstrap, so this is the difference
		// between "no analytics" and "no app".
		expect(() => startApp()).not.toThrow();
		expect(TestBed.inject(BloomsightService)).toBeInstanceOf(BloomsightService);
	});

	it('reports the failure through onError and the console, with the cause', () => {
		const onError = vi.fn();
		startApp({...config, onError});

		expect(onError).toHaveBeenCalledExactlyOnceWith({
			code: 'INIT_FAILED',
			message: 'bloomsight.js failed to initialise: m.matchMedia is not a function'
		});
		expect(console.error).toHaveBeenCalledExactlyOnceWith(
			'ngx-bloomsight:', 'bloomsight.js failed to initialise: m.matchMedia is not a function'
		);
	});

	it('logs the failure even when the app configured no onError', () => {
		startApp();

		expect(console.error).toHaveBeenCalledTimes(1);
	});

	it('survives an onError handler that itself throws', () => {
		const onError = vi.fn(() => {
			throw new Error('monitoring is down too');
		});

		expect(() => startApp({...config, onError})).not.toThrow();
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it('reports a thrown value that is not an Error as itself', () => {
		// Code can throw anything. A string must be reported as itself, not as
		// "undefined" from reading .message off it.
		vi.mocked(core.init).mockImplementation(() => {
			throw 'storage is unavailable';
		});
		const onError = vi.fn();

		startApp({...config, onError});

		expect(onError).toHaveBeenCalledExactlyOnceWith({
			code: 'INIT_FAILED',
			message: 'bloomsight.js failed to initialise: storage is unavailable'
		});
	});
});

describe('page views', () => {

	it('records nothing until a navigation completes', () => {
		startApp();

		expect(core.pageViewObserver).not.toHaveBeenCalled();
	});

	it('records a page view when a navigation completes', async () => {
		startApp();

		await TestBed.inject(Router).navigateByUrl('/home');

		expect(core.pageViewObserver).toHaveBeenCalledTimes(1);
	});

	it('records one page view per distinct destination', async () => {
		startApp();
		const router = TestBed.inject(Router);

		await router.navigateByUrl('/home');
		await router.navigateByUrl('/about');
		await router.navigateByUrl('/home');

		expect(core.pageViewObserver).toHaveBeenCalledTimes(3);
	});

	it('counts the URL the user landed on, not the one requested (B3)', async () => {
		// On '/home', the user follows a link to '/old-home', which redirects
		// back to '/home'. The requested URL differs, so the router really does
		// navigate and emits a second NavigationEnd — but the user is on the
		// same page. Comparing `urlAfterRedirects` sees '/home' twice and
		// records one page view; comparing `url` sees '/home' then '/old-home'
		// and records two.
		startApp();
		const router = TestBed.inject(Router);
		const ends: NavigationEnd[] = [];
		router.events.subscribe((e) => e instanceof NavigationEnd && ends.push(e));

		await router.navigateByUrl('/home');
		await router.navigateByUrl('/old-home');

		// Guard against a vacuous pass: both navigations must actually have
		// completed, or this test proves nothing about the library.
		expect(ends.map((e) => [e.url, e.urlAfterRedirects])).toEqual([
			['/home', '/home'],
			['/old-home', '/home']
		]);
		expect(core.pageViewObserver).toHaveBeenCalledTimes(1);
	});

	it('does not record the same destination twice in a row', async () => {
		// With the default router this test cannot fail: navigating to the
		// current URL is ignored and never emits NavigationEnd, so it would
		// measure Angular's dedupe, not ours. 'reload' makes both navigations
		// complete, so only the library can prevent the second page view.
		startApp(config, [provideRouter(routes, withRouterConfig({onSameUrlNavigation: 'reload'}))]);
		const router = TestBed.inject(Router);
		const ends: NavigationEnd[] = [];
		router.events.subscribe((e) => e instanceof NavigationEnd && ends.push(e));

		await router.navigateByUrl('/home');
		await router.navigateByUrl('/home');

		expect(ends).toHaveLength(2);
		expect(core.pageViewObserver).toHaveBeenCalledTimes(1);
	});

	it('ignores a navigation that a guard cancels', async () => {
		// NavigationCancel, not NavigationEnd — the user never reached the page.
		startApp();

		const landed = await TestBed.inject(Router).navigateByUrl('/locked');

		expect(landed).toBe(false);
		expect(core.pageViewObserver).not.toHaveBeenCalled();
	});

	it('stops observing the router when the app is destroyed (B4)', () => {
		// 1.x subscribed to Router.events and never unsubscribed.
		const router = fakeRouter();
		startApp(config, [router.provider]);
		router.events.next(new NavigationEnd(1, '/home', '/home'));
		expect(core.pageViewObserver).toHaveBeenCalledTimes(1);
		expect(router.events.observed).toBe(true);

		TestBed.resetTestingModule();

		expect(router.events.observed).toBe(false);
		router.events.next(new NavigationEnd(2, '/about', '/about'));
		expect(core.pageViewObserver).toHaveBeenCalledTimes(1);
	});
});

describe('page views on blooms.ai', () => {

	const bloomsAi: BloomsightConfig = {...config, target: 'blooms-ai'};

	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('are not observed at all — blooms.ai has no page-view endpoint', () => {
		const router = fakeRouter();
		startApp(bloomsAi, [router.provider]);

		expect(router.events.observed).toBe(false);
	});

	it.each([
		['debug', {debug: true}],
		['isDevelopmentMode', {isDevelopmentMode: true}]
	])('are explained once in the console under %s', (_, flags) => {
		startApp({...bloomsAi, ...flags}, [fakeRouter().provider]);

		expect(console.log).toHaveBeenCalledExactlyOnceWith(
			'ngx-bloomsight: page views are not collected on blooms.ai, so the router is not observed'
		);
	});

	it('say nothing in production', () => {
		// A console message on every page load of every migrated site would be noise.
		startApp(bloomsAi, [fakeRouter().provider]);

		expect(console.log).not.toHaveBeenCalled();
	});
});
