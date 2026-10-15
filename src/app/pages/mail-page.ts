import {Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {BloomsightEmailEngine, BloomsightError, BloomsightService} from '@bloomscorp/ngx-bloomsight';

import {DEMO_SETTINGS} from '../demo-settings';
import {valueOf} from './dom';

type Status =
	| {state: 'idle'}
	| {state: 'sending'}
	| {state: 'sent'}
	| {state: 'failed'; message: string};

interface Field {
	key: string;
	value: string;
}

/**
 * `sendMail()`. This page only sends mail and never touches events, which 1.x
 * could not do without its event service starting the SDK first (B6).
 */
@Component({
	selector: 'app-mail-page',
	template: `
		<h1>📮 Mail</h1>
		<p class="lead">
			Mail always goes to the standalone Bloomsight server, whatever <code>target</code> is set to —
			it is not part of the blooms.ai migration.
		</p>

		<section class="card form">
			<label>Engine
				<select data-testid="engine" [value]="engine()" (change)="engine.set($any(valueOf($event)))">
					<option value="GMAIL">GMAIL</option>
					<option value="CUSTOM_SMTP">CUSTOM_SMTP</option>
				</select>
			</label>
			<label>Engine id <input data-testid="engine-id" [value]="engineId()" (input)="engineId.set(valueOf($event))" /></label>
			<label>Template id <input data-testid="template-id" [value]="templateId()" (input)="templateId.set(valueOf($event))" /></label>
			<label>Template owner id <input data-testid="owner-id" [value]="ownerId()" (input)="ownerId.set(valueOf($event))" /></label>

			<fieldset>
				<legend>Template fields</legend>
				@for (field of fields(); track $index; let i = $index) {
					<div class="row">
						<input aria-label="Field name" [value]="field.key" (input)="setField(i, 'key', valueOf($event))" />
						<input aria-label="Field value" [value]="field.value" (input)="setField(i, 'value', valueOf($event))" />
						<button type="button" class="ghost" aria-label="Remove field" (click)="removeField(i)">✕</button>
					</div>
				}
				<button type="button" class="ghost" (click)="addField()">＋ Add a field</button>
			</fieldset>

			<button type="button" class="primary" data-testid="send" [disabled]="!canSend()" (click)="send()">
				{{ status().state === 'sending' ? 'Sending…' : 'Send mail' }}
			</button>

			@let current = status();
			@switch (current.state) {
				@case ('sent') {
					<p class="callout safe" data-testid="mail-status">
						@if (settings.logOnly) {
							✅ Done — under logOnly the SDK logged the mail and sent nothing.
						} @else {
							✅ Sent.
						}
					</p>
				}
				@case ('failed') {
					<p class="callout live" data-testid="mail-status">❌ {{ current.message }}</p>
				}
			}
		</section>
	`
})
export class MailPage {

	private readonly bloomsight = inject(BloomsightService);

	private readonly destroyRef = inject(DestroyRef);

	protected readonly settings = inject(DEMO_SETTINGS);

	protected readonly valueOf = valueOf;

	protected readonly engine = signal<BloomsightEmailEngine>('GMAIL');

	protected readonly engineId = signal('');

	protected readonly templateId = signal('');

	protected readonly ownerId = signal('');

	protected readonly fields = signal<Field[]>([
		{key: 'name', value: 'Asha'},
		{key: 'email', value: 'asha@example.com'}
	]);

	protected readonly status = signal<Status>({state: 'idle'});

	protected readonly canSend = computed(() =>
		this.status().state !== 'sending' &&
		[this.engineId(), this.templateId(), this.ownerId()].every((id) => id.trim() !== '')
	);

	protected setField(index: number, part: keyof Field, value: string): void {
		this.fields.update((fields) => fields.map((field, i) => (i === index ? {...field, [part]: value} : field)));
	}

	protected addField(): void {
		this.fields.update((fields) => [...fields, {key: '', value: ''}]);
	}

	protected removeField(index: number): void {
		this.fields.update((fields) => fields.filter((_, i) => i !== index));
	}

	protected send(): void {
		const data = new FormData();
		for (const field of this.fields()) {
			if (field.key.trim()) data.append(field.key.trim(), field.value);
		}

		this.status.set({state: 'sending'});
		this.bloomsight.sendMail({
			engine: this.engine(),
			engineId: this.engineId().trim(),
			templateId: this.templateId().trim(),
			templateOwnerId: this.ownerId().trim(),
			data
		}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: () => this.status.set({state: 'sent'}),
			error: (error: BloomsightError) => this.status.set({state: 'failed', message: error.message})
		});
	}
}
