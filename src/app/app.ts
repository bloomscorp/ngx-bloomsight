import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

import {ActivityPanel} from './activity/activity-panel';
import {ErrorsPanel} from './activity/errors-panel';
import {DEMO_SETTINGS, describeBackend, DemoSettings} from './demo-settings';

const KILL_SWITCHES: Array<[keyof DemoSettings, string]> = [
	['stopAll', 'stopAll'],
	['stopSimpleEvent', 'stopSimpleEvent'],
	['stopDataEvent', 'stopDataEvent'],
	['stopPageViewEvent', 'stopPageViewEvent']
];

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, RouterLink, RouterLinkActive, ActivityPanel, ErrorsPanel],
	template: `
		<header class="topbar">
			<a class="brand" routerLink="/">🌸 Bloomsight <span>ngx demo</span></a>

			<nav class="nav" aria-label="Pages">
				@for (link of links; track link.path) {
					<a [routerLink]="link.path" routerLinkActive="active" [routerLinkActiveOptions]="{exact: link.path === '/'}">
						{{ link.label }}
					</a>
				}
			</nav>

			<a class="status" routerLink="/settings" data-testid="status">
				@if (settings.logOnly) {
					<span class="badge safe">🟢 logOnly — nothing leaves the browser</span>
				} @else {
					<span class="badge live">🔴 Live — writing to {{ backend }}</span>
				}
				<span class="badge">🎯 {{ settings.target }}</span>
				@for (name of activeKillSwitches; track name) {
					<span class="badge warn">⛔ {{ name }}</span>
				}
			</a>
		</header>

		<main class="layout">
			<section class="page">
				<router-outlet />
			</section>
			<aside class="side">
				<app-errors-panel />
				<app-activity-panel />
			</aside>
		</main>
	`
})
export class App {

	protected readonly settings = inject(DEMO_SETTINGS);

	protected readonly backend = describeBackend(this.settings);

	protected readonly activeKillSwitches = KILL_SWITCHES
		.filter(([key]) => this.settings[key] === true)
		.map(([, name]) => name);

	protected readonly links = [
		{path: '/', label: '🏠 Overview'},
		{path: '/events', label: '⚡ Events'},
		{path: '/page-views', label: '🧭 Page views'},
		{path: '/mail', label: '📮 Mail'},
		{path: '/settings', label: '⚙️ Settings'}
	];
}
