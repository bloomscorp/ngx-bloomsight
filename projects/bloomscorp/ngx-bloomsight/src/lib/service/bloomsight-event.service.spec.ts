import {vi} from 'vitest';
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {NavigationEnd, provideRouter, Router, Routes, withRouterConfig} from '@angular/router';

// The core is replaced wholesale, so these tests check what the service asks
// the core to do and nothing else. What the core then does over the network is
// covered by the demo app's integration tests, which run the real core.
vi.mock('@bloomscorp/bloomsight.js', () => ({
	init: vi.fn(),
	resolveSimpleEvent: vi.fn(),
	resolveDataEvent: vi.fn(),
	pageViewObserver: vi.fn(),
	sendEmail: vi.fn(),
	EmailEngineTypeEnum: {GMAIL: 'GMAIL', CUSTOM_SMTP: 'CUSTOM_SMTP'}
}));

import * as core from '@bloomscorp/bloomsight.js';
import {BloomsightEventService} from './bloomsight-event.service';
import {BloomsightConfig} from '../type/bloomsight-config';
import {resetInitGuard} from '../internal/bloomsight-init';

@Component({template: ''})
class Page {
}

const routes: Routes = [
	{path: 'home', component: Page},
	{path: 'about', component: Page},
	{path: 'old-home', redirectTo: 'home'},
	{path: 'locked', component: Page, canActivate: [() => false]}
];

const config: BloomsightConfig = {propertyToken: '65d72f0b5e990c6028790156', isDevelopmentMode: true};

describe('BloomsightEventService', () => {

	let router: Router;

	beforeEach(() => {
		vi.clearAllMocks();
		// The init-once guard is module state; without this, only the first test
		// in the file would ever see init() called.
		resetInitGuard();

		TestBed.configureTestingModule({
			providers: [
				provideRouter(routes),
				BloomsightEventService,
				{provide: 'bloomsightConfig', useValue: config}
			]
		});
		router = TestBed.inject(Router);
	});

	describe('initialisation', () => {

		it('initialises the core once, with exactly the injected config', () => {
			TestBed.inject(BloomsightEventService);

			expect(core.init).toHaveBeenCalledTimes(1);
			expect(core.init).toHaveBeenCalledWith(config);
		});
	});

	describe('page views', () => {

		it('records nothing until a navigation completes', () => {
			TestBed.inject(BloomsightEventService);

			expect(core.pageViewObserver).not.toHaveBeenCalled();
		});

		it('records a page view when a navigation completes', async () => {
			TestBed.inject(BloomsightEventService);

			await router.navigateByUrl('/home');

			expect(core.pageViewObserver).toHaveBeenCalledTimes(1);
		});

		it('records one page view per distinct destination', async () => {
			TestBed.inject(BloomsightEventService);

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
			// records one page view; comparing `url`, as the service did before B3
			// was fixed, sees '/home' then '/old-home' and records two.
			TestBed.inject(BloomsightEventService);
			const ends: NavigationEnd[] = [];
			router.events.subscribe((e) => e instanceof NavigationEnd && ends.push(e));

			await router.navigateByUrl('/home');
			await router.navigateByUrl('/old-home');

			// Guard against a vacuous pass: both navigations must actually have
			// completed, or this test proves nothing about the service.
			expect(ends.map((e) => [e.url, e.urlAfterRedirects])).toEqual([
				['/home', '/home'],
				['/old-home', '/home']
			]);
			expect(core.pageViewObserver).toHaveBeenCalledTimes(1);
		});

		it('ignores a navigation that a guard cancels', async () => {
			// NavigationCancel, not NavigationEnd — the user never reached the page.
			TestBed.inject(BloomsightEventService);

			const landed = await router.navigateByUrl('/locked');

			expect(landed).toBe(false);
			expect(core.pageViewObserver).not.toHaveBeenCalled();
		});
	});

	describe('events', () => {

		it('forwards a simple event with its label', () => {
			const service = TestBed.inject(BloomsightEventService);

			service.resolveSimpleEvent('signup-clicked', 'hero');

			expect(core.resolveSimpleEvent).toHaveBeenCalledExactlyOnceWith('signup-clicked', 'hero');
		});

		it('defaults a simple event label to an empty string', () => {
			const service = TestBed.inject(BloomsightEventService);

			service.resolveSimpleEvent('signup-clicked');

			expect(core.resolveSimpleEvent).toHaveBeenCalledExactlyOnceWith('signup-clicked', '');
		});

		it('forwards a data event with its payload and label', () => {
			const service = TestBed.inject(BloomsightEventService);
			const payload = {plan: 'pro', seats: 5, annual: true};

			service.resolveDataEvent('plan-selected', payload, 'pricing');

			expect(core.resolveDataEvent).toHaveBeenCalledExactlyOnceWith('plan-selected', payload, 'pricing');
		});

		it('defaults a data event label to an empty string', () => {
			const service = TestBed.inject(BloomsightEventService);

			service.resolveDataEvent('plan-selected', {plan: 'pro'});

			expect(core.resolveDataEvent).toHaveBeenCalledExactlyOnceWith('plan-selected', {plan: 'pro'}, '');
		});

		it('passes the payload through by reference, not as a copy', () => {
			const service = TestBed.inject(BloomsightEventService);
			const payload = {plan: 'pro'};

			service.resolveDataEvent('plan-selected', payload);

			expect(vi.mocked(core.resolveDataEvent).mock.calls[0]![1]).toBe(payload);
		});
	});

	describe('page views, with a router that re-emits same-URL navigations', () => {

		beforeEach(() => {
			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					provideRouter(routes, withRouterConfig({onSameUrlNavigation: 'reload'})),
					BloomsightEventService,
					{provide: 'bloomsightConfig', useValue: config}
				]
			});
			router = TestBed.inject(Router);
		});

		it('does not record the same destination twice in a row', async () => {
			// With the default router this test cannot fail: navigating to the
			// current URL is ignored and never emits NavigationEnd, so it measured
			// Angular's dedupe, not the service's. 'reload' makes both navigations
			// complete, so only the service can prevent the second page view.
			TestBed.inject(BloomsightEventService);
			const ends: NavigationEnd[] = [];
			router.events.subscribe((e) => e instanceof NavigationEnd && ends.push(e));

			await router.navigateByUrl('/home');
			await router.navigateByUrl('/home');

			expect(ends).toHaveLength(2);
			expect(core.pageViewObserver).toHaveBeenCalledTimes(1);
		});
	});
});
