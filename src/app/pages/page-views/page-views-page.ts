import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {filter, scan} from 'rxjs';

import {DEMO_SETTINGS} from '../../demo-settings';

interface Landing {
	url: string;
	landed: string;
	newPage: boolean;
}

/**
 * Page views need no code in the app: the library records them from the router.
 * This page lists what the router did, so it can be compared with what the
 * SDK sent in the activity panel.
 */
@Component({
	selector: 'app-page-views-page',
	imports: [RouterLink, RouterLinkActive, RouterOutlet],
	template: `
		<h1>🧭 Page views</h1>
		<p class="lead">
			Nothing on this page calls the service. Page views are recorded automatically, once each time you
			land somewhere new — by the URL you land on, after redirects.
		</p>

		@if (settings.target === 'blooms-ai') {
			<p class="callout warn">ℹ️ blooms.ai has no page-view endpoint, so on this target none are recorded and the router is not observed.</p>
		} @else if (settings.stopAll || settings.stopPageViewEvent) {
			<p class="callout warn">⛔ Page views are switched off in Settings.</p>
		} @else {
			<p class="callout">⏱️ The SDK waits two seconds on a page before recording the view.</p>
		}

		<nav class="chips" aria-label="Destinations">
			<a class="chip" routerLink="first" routerLinkActive="on">First page</a>
			<a class="chip" routerLink="second" routerLinkActive="on">Second page</a>
			<a class="chip" routerLink="old-first" data-testid="old-first">Old link → first</a>
			<a class="chip" routerLink="legacy-first">Legacy link → first</a>
		</nav>

		<router-outlet />

		<section class="card">
			<h2>What the router did</h2>
			<table class="table" data-testid="landings">
				<thead><tr><th>Requested</th><th>Landed on</th><th>Page view?</th></tr></thead>
				<tbody>
					@for (landing of landings(); track $index) {
						<tr>
							<td><code>{{ landing.url }}</code></td>
							<td><code>{{ landing.landed }}</code></td>
							<td>{{ landing.newPage ? '✅ new page' : '➖ same page, not counted' }}</td>
						</tr>
					}
				</tbody>
			</table>
		</section>
	`
})
export class PageViewsPage {

	protected readonly settings = inject(DEMO_SETTINGS);

	/**
	 * Mirrors the library's rule for display only: a landing counts when its
	 * destination differs from the previous one.
	 */
	protected readonly landings = toSignal(
		inject(Router).events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			scan((all: Landing[], event) => [{
				url: event.url,
				landed: event.urlAfterRedirects,
				newPage: all[0]?.landed !== event.urlAfterRedirects
			}, ...all], [])
		),
		{initialValue: []}
	);
}
