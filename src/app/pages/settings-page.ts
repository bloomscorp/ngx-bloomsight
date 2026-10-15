import {Component, computed, inject, signal} from '@angular/core';

import {
	clearSettings, DEFAULT_SETTINGS, DEMO_SETTINGS, describeBackend, DemoSettings,
	PLACEHOLDER_TOKEN, RELOAD_PAGE, saveSettings
} from '../demo-settings';
import {checkedOf, valueOf} from './dom';

type Flag = 'logOnly' | 'isDevelopmentMode' | 'debug' | 'stopAll' | 'stopSimpleEvent' | 'stopDataEvent' | 'stopPageViewEvent';

/**
 * Every `BloomsightConfig` field. The SDK reads its configuration once, at
 * startup, so changes apply by reloading the page.
 */
@Component({
	selector: 'app-settings-page',
	template: `
		<h1>⚙️ Settings</h1>
		<p class="lead">Everything <code>provideBloomsight()</code> accepts. Saved in this browser only; applied by reloading.</p>

		<section class="card form">
			<h2>Where events go</h2>
			<label>Target
				<select data-testid="target" [value]="draft().target" (change)="set('target', $any(valueOf($event)))">
					<option value="bloomsight">bloomsight — the standalone server</option>
					<option value="blooms-ai">blooms-ai — Bloomsight inside blooms.ai</option>
				</select>
			</label>
			<label>apiBase <span class="muted">(blooms.ai only; blank for the default host)</span>
				<input data-testid="api-base" placeholder="https://staging.example.com" [disabled]="draft().target !== 'blooms-ai'"
					[value]="draft().apiBase" (input)="set('apiBase', valueOf($event))" />
			</label>
			<label>Property token
				<input data-testid="token" [value]="draft().propertyToken" (input)="set('propertyToken', valueOf($event))" />
			</label>
		</section>

		<section class="card form">
			<h2>Behaviour</h2>
			@for (flag of flags; track flag.key) {
				<label class="check">
					<input type="checkbox" [attr.data-testid]="flag.key" [checked]="draft()[flag.key]" (change)="set(flag.key, checkedOf($event))" />
					<span><code>{{ flag.key }}</code> — {{ flag.text }}</span>
				</label>
			}
		</section>

		@if (!draft().logOnly) {
			<p class="callout live">🔴 With logOnly off, events and mail are really sent, to {{ backend() }}.</p>
		}
		@if (blocked()) {
			<p class="field-error" data-testid="blocked">Enter a real property token before turning logOnly off.</p>
		}

		<div class="actions">
			<button type="button" class="primary" data-testid="apply" [disabled]="blocked()" (click)="apply()">💾 Save and reload</button>
			<button type="button" class="ghost" data-testid="reset" (click)="reset()">↩️ Back to safe defaults</button>
		</div>
		@if (saveFailed()) {
			<p class="field-error">This browser would not save the settings (is site data blocked?).</p>
		}
	`
})
export class SettingsPage {

	private readonly reload = inject(RELOAD_PAGE);

	protected readonly valueOf = valueOf;

	protected readonly checkedOf = checkedOf;

	protected readonly draft = signal<DemoSettings>({...inject(DEMO_SETTINGS)});

	protected readonly saveFailed = signal(false);

	protected readonly backend = computed(() => describeBackend(this.draft()));

	/** Going live with the placeholder token would send data nobody can find. */
	protected readonly blocked = computed(() =>
		!this.draft().logOnly && [PLACEHOLDER_TOKEN, ''].includes(this.draft().propertyToken.trim())
	);

	protected readonly flags: Array<{key: Flag; text: string}> = [
		{key: 'logOnly', text: 'log what would be sent, send nothing'},
		{key: 'isDevelopmentMode', text: 'log everything, skip the property check'},
		{key: 'debug', text: 'full blooms.ai logging, without development mode'},
		{key: 'stopAll', text: 'record nothing'},
		{key: 'stopSimpleEvent', text: 'no simple events'},
		{key: 'stopDataEvent', text: 'no data events'},
		{key: 'stopPageViewEvent', text: 'no page views'}
	];

	protected set<K extends keyof DemoSettings>(key: K, value: DemoSettings[K]): void {
		this.draft.update((draft) => ({...draft, [key]: value}));
	}

	protected apply(): void {
		if (this.blocked()) return;
		const saved = saveSettings(this.draft());
		this.saveFailed.set(!saved);
		if (saved) this.reload();
	}

	protected reset(): void {
		clearSettings();
		this.draft.set({...DEFAULT_SETTINGS});
		this.reload();
	}
}
