import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';

import {DEMO_SETTINGS, describeBackend} from '../demo-settings';

interface Feature {
	icon: string;
	title: string;
	text: string;
	link: string;
}

/** What the demo covers, and where to try each part. */
@Component({
	selector: 'app-overview-page',
	imports: [RouterLink],
	template: `
		<h1>ngx-bloomsight 2.0 🌸</h1>
		<p class="lead">
			Every feature of the Angular wrapper, wired up the way an app would use it. This app imports
			nothing from <code>&#64;bloomscorp/bloomsight.js</code> — only from <code>&#64;bloomscorp/ngx-bloomsight</code>.
		</p>

		@if (settings.logOnly) {
			<p class="callout safe">🟢 <strong>logOnly is on.</strong> Click anything: the SDK logs what it would have sent, and nothing leaves the browser.</p>
		} @else {
			<p class="callout live">🔴 <strong>Live.</strong> Events and mail are really sent, to {{ backend }}.</p>
		}

		<div class="grid">
			@for (feature of features; track feature.title) {
				<a class="card" [routerLink]="feature.link">
					<span class="card-icon">{{ feature.icon }}</span>
					<strong>{{ feature.title }}</strong>
					<span class="muted">{{ feature.text }}</span>
				</a>
			}
		</div>
	`
})
export class OverviewPage {

	protected readonly settings = inject(DEMO_SETTINGS);

	protected readonly backend = describeBackend(this.settings);

	protected readonly features: Feature[] = [
		{icon: '⚡', title: 'Simple and data events', text: 'track() and trackData(), with a payload editor', link: '/events'},
		{icon: '🧭', title: 'Page views', text: 'Recorded from the router, by the URL you land on, once per destination', link: '/page-views'},
		{icon: '📮', title: 'Mail', text: 'GMAIL and CUSTOM_SMTP, always via the standalone server', link: '/mail'},
		{icon: '🔀', title: 'Bloomsight ↔ blooms.ai', text: 'Switch target, point apiBase at staging', link: '/settings'},
		{icon: '⛔', title: 'Kill switches', text: 'stopAll and the per-kind stops', link: '/settings'},
		{icon: '🚨', title: 'Errors', text: 'errors$ and onError, shown beside every page', link: '/events'}
	];
}
