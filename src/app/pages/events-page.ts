import {Component, computed, inject, signal} from '@angular/core';
import {BloomsightEventData, BloomsightService} from '@bloomscorp/ngx-bloomsight';

import {DEMO_SETTINGS} from '../demo-settings';
import {valueOf} from './dom';

type Parsed = {ok: true; data: BloomsightEventData} | {ok: false; reason: string};

/** `track()` and `trackData()`. */
@Component({
	selector: 'app-events-page',
	template: `
		<h1>⚡ Events</h1>
		<p class="lead">Each button calls the service once. The activity panel shows what the SDK did with it.</p>

		@if (settings.stopAll || settings.stopSimpleEvent || settings.stopDataEvent) {
			<p class="callout warn">⛔ A kill switch is on, so the SDK will refuse some of these. That is the point — try it.</p>
		}

		<section class="card form">
			<h2>Simple event</h2>
			<label>Event token
				<input data-testid="simple-token" [value]="simpleToken()" (input)="simpleToken.set(valueOf($event))" />
			</label>
			<button type="button" class="primary" data-testid="track" [disabled]="!simpleToken().trim()" (click)="track()">
				Track it
			</button>
			<code class="hint">bloomsight.track('{{ simpleToken() }}')</code>
		</section>

		<section class="card form">
			<h2>Data event</h2>
			<label>Event token
				<input data-testid="data-token" [value]="dataToken()" (input)="dataToken.set(valueOf($event))" />
			</label>
			<label>Payload (JSON object)
				<textarea data-testid="payload" rows="6" [value]="payloadText()" (input)="payloadText.set(valueOf($event))"></textarea>
			</label>
			@let payload = parsed();
			@if (!payload.ok) {
				<p class="field-error" data-testid="payload-error">{{ payload.reason }}</p>
			}
			<button type="button" class="primary" data-testid="track-data" [disabled]="!payload.ok || !dataToken().trim()" (click)="trackData()">
				Track it with data
			</button>
		</section>

		@if (history().length) {
			<section class="card">
				<h2>Sent from this page</h2>
				<ul class="plain" data-testid="history">
					@for (line of history(); track $index) { <li><code>{{ line }}</code></li> }
				</ul>
			</section>
		}
	`
})
export class EventsPage {

	private readonly bloomsight = inject(BloomsightService);

	protected readonly settings = inject(DEMO_SETTINGS);

	protected readonly valueOf = valueOf;

	protected readonly simpleToken = signal('signup-clicked');

	protected readonly dataToken = signal('plan-selected');

	protected readonly payloadText = signal('{\n  "plan": "pro",\n  "seats": 5,\n  "annual": true\n}');

	protected readonly history = signal<string[]>([]);

	protected readonly parsed = computed<Parsed>(() => {
		try {
			const value: unknown = JSON.parse(this.payloadText());
			if (!value || typeof value !== 'object' || Array.isArray(value)) {
				return {ok: false, reason: 'The payload has to be a JSON object, like {"plan": "pro"}.'};
			}
			return {ok: true, data: value as BloomsightEventData};
		} catch {
			return {ok: false, reason: 'That is not valid JSON yet.'};
		}
	});

	protected track(): void {
		const token = this.simpleToken().trim();
		this.bloomsight.track(token);
		this.history.update((lines) => [`track('${token}')`, ...lines]);
	}

	protected trackData(): void {
		const payload = this.parsed();
		if (!payload.ok) return;
		const token = this.dataToken().trim();
		this.bloomsight.trackData(token, payload.data);
		this.history.update((lines) => [`trackData('${token}', ${JSON.stringify(payload.data)})`, ...lines]);
	}
}
