import {Component, computed, inject, signal} from '@angular/core';

import {Activity, ActivityKind} from './activity';

type Filter = 'all' | 'request' | 'log';

const ICONS: Record<ActivityKind, string> = {
	'request': '🌐',
	'log': '📝',
	'warn': '⚠️',
	'error': '❌',
	'on-error': '🚨'
};

/** Every request the SDK made and every line it logged, newest first. */
@Component({
	selector: 'app-activity-panel',
	template: `
		<section class="panel">
			<header class="panel-head">
				<h2>📡 Activity</h2>
				<div class="chips" role="group" aria-label="Show">
					@for (option of filters; track option.value) {
						<button type="button" class="chip" [class.on]="filter() === option.value" (click)="filter.set(option.value)">
							{{ option.label }}
						</button>
					}
					<button type="button" class="chip" (click)="activity.clear()">🧹 Clear</button>
				</div>
			</header>

			@let entries = shown();
			@if (entries.length === 0) {
				<p class="muted">Nothing yet. Requests appear here as the SDK makes them; under logOnly, its log lines do.</p>
			} @else {
				<ol class="feed" data-testid="activity">
					@for (entry of entries; track entry.id) {
						<li [class]="'entry ' + entry.kind">
							@if (entry.detail) {
								<details>
									<summary><span class="time">{{ entry.time }}</span> {{ icon(entry.kind) }} {{ entry.summary }}</summary>
									<pre>{{ entry.detail }}</pre>
								</details>
							} @else {
								<span class="time">{{ entry.time }}</span> {{ icon(entry.kind) }} {{ entry.summary }}
							}
						</li>
					}
				</ol>
			}
		</section>
	`
})
export class ActivityPanel {

	protected readonly activity = inject(Activity);

	protected readonly filter = signal<Filter>('all');

	protected readonly filters: Array<{value: Filter; label: string}> = [
		{value: 'all', label: 'All'},
		{value: 'request', label: '🌐 Requests'},
		{value: 'log', label: '📝 Logs'}
	];

	protected readonly shown = computed(() => {
		const filter = this.filter();
		const entries = this.activity.entries();
		if (filter === 'all') return entries;
		if (filter === 'request') return entries.filter((e) => e.kind === 'request');
		return entries.filter((e) => e.kind !== 'request');
	});

	protected icon(kind: ActivityKind): string {
		return ICONS[kind];
	}
}
