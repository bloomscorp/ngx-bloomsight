import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {scan} from 'rxjs';
import {BloomsightError, BloomsightService} from '@bloomscorp/ngx-bloomsight';

/**
 * `errors$`, rendered. Failures are visible here rather than lost in the
 * console — the point of the 2.0.0 error surface.
 */
@Component({
	selector: 'app-errors-panel',
	template: `
		<section class="panel">
			<header class="panel-head">
				<h2>🚨 errors$</h2>
				<span class="count" data-testid="error-count">{{ errors().length }}</span>
			</header>
			@if (errors().length === 0) {
				<p class="muted">No failures reported. Point the demo at blooms.ai with logOnly off to see one.</p>
			} @else {
				<ul class="feed" data-testid="errors">
					@for (error of errors(); track $index) {
						<li class="entry error">
							<strong>{{ error.code }}</strong>
							@if (error.status) { <span class="badge">HTTP {{ error.status }}</span> }
							@if (error.eventToken) { <span class="badge">{{ error.eventToken }}</span> }
							<div class="muted">{{ error.message }}</div>
						</li>
					}
				</ul>
			}
		</section>
	`
})
export class ErrorsPanel {

	protected readonly errors = toSignal(
		inject(BloomsightService).errors$.pipe(scan((all: BloomsightError[], error) => [error, ...all], [])),
		{initialValue: []}
	);
}
