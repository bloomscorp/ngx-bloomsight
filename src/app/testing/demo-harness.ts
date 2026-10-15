import {vi} from 'vitest';
import {TestBed} from '@angular/core/testing';

import {appConfig} from '../app.config';
import {Activity} from '../activity/activity';
import {DEFAULT_SETTINGS, DemoSettings, RELOAD_PAGE} from '../demo-settings';
import {API_BASE, PROPERTY_TOKEN} from '../bloomsight-integration/integration-harness';

/**
 * Support for the demo's own tests. These boot the demo with its real
 * configuration — `appConfig()`, the built library, the real core — and stub
 * only the network, so a test drives the UI and asserts on what is sent.
 */

/** The demo pointed at a staging blooms.ai, actually sending. */
export const LIVE_ON_BLOOMS_AI: DemoSettings = {
	...DEFAULT_SETTINGS,
	propertyToken: PROPERTY_TOKEN,
	target: 'blooms-ai',
	apiBase: API_BASE,
	logOnly: false,
	isDevelopmentMode: false,
	debug: false
};

/** Configure TestBed exactly as `main.ts` configures the app. */
export function configureDemo(settings: DemoSettings = DEFAULT_SETTINGS): {activity: Activity; reload: ReturnType<typeof vi.fn>} {
	const activity = new Activity();
	const reload = vi.fn();
	TestBed.configureTestingModule({
		providers: [...appConfig(settings, activity).providers, {provide: RELOAD_PAGE, useValue: reload}]
	});
	return {activity, reload};
}

/** The element with this `data-testid`, which must exist. */
export function byTestId<T extends Element = HTMLElement>(root: Element, id: string): T {
	const element = root.querySelector<T>(`[data-testid="${id}"]`);
	if (!element) throw new Error(`no element with data-testid="${id}"`);
	return element;
}

/** Type into a field the way a user does: set the value, fire the event Angular listens for. */
export function enter(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
	field.value = value;
	field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
}

/** Tick or untick a checkbox. */
export function tick(box: HTMLInputElement, checked: boolean): void {
	box.checked = checked;
	box.dispatchEvent(new Event('change'));
}
