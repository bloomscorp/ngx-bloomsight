import {InjectionToken} from '@angular/core';
import {BloomsightConfig, BloomsightError} from '@bloomscorp/ngx-bloomsight';

/**
 * The demo's configuration: every `BloomsightConfig` field except `onError`,
 * which the demo always wires to its activity panel.
 *
 * Stored in `localStorage` and applied by reloading the page. The SDK reads its
 * configuration once, when the app starts, so this is also how a real app
 * behaves: there is no changing the configuration of a running SDK.
 */
export interface DemoSettings {
	propertyToken: string;
	isDevelopmentMode: boolean;
	debug: boolean;
	logOnly: boolean;
	target: 'bloomsight' | 'blooms-ai';
	/** Blank means the SDK's default blooms.ai host. */
	apiBase: string;
	stopAll: boolean;
	stopSimpleEvent: boolean;
	stopDataEvent: boolean;
	stopPageViewEvent: boolean;
}

/** Stands in until a real property token is entered. Only usable under `logOnly`. */
export const PLACEHOLDER_TOKEN = 'demo-placeholder-token';

/**
 * Safe by default (D5): a fresh checkout records nothing and sends no mail.
 * Clicking around the demo must never write to production analytics by
 * accident; going live takes a deliberate change on the Settings page.
 */
export const DEFAULT_SETTINGS: Readonly<DemoSettings> = Object.freeze({
	propertyToken: PLACEHOLDER_TOKEN,
	isDevelopmentMode: true,
	debug: true,
	logOnly: true,
	target: 'bloomsight',
	apiBase: '',
	stopAll: false,
	stopSimpleEvent: false,
	stopDataEvent: false,
	stopPageViewEvent: false
});

const STORAGE_KEY = 'ngx-bloomsight-demo:settings';

/** The settings the app was started with. */
export const DEMO_SETTINGS = new InjectionToken<DemoSettings>('DEMO_SETTINGS');

/** Reload the page, which is how new settings take effect. A token so tests can replace it. */
export const RELOAD_PAGE = new InjectionToken<() => void>('RELOAD_PAGE', {
	providedIn: 'root',
	factory: () => () => location.reload()
});

/**
 * The browser's `localStorage`, or nothing. Reading the property itself can
 * throw — with site data blocked, for example — so it is guarded too.
 */
export function browserStorage(): Storage | undefined {
	try {
		return globalThis.localStorage;
	} catch {
		return undefined;
	}
}

/**
 * The saved settings, or the defaults. Anything unreadable falls back field by
 * field, so a stale or hand-edited entry can never stop the demo starting.
 */
export function loadSettings(storage: Storage | undefined = browserStorage()): DemoSettings {
	let saved: unknown;
	try {
		saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null');
	} catch {
		saved = null;
	}
	const record = (saved && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;

	const settings: DemoSettings = {...DEFAULT_SETTINGS};
	for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof DemoSettings>) {
		if (typeof record[key] === typeof DEFAULT_SETTINGS[key]) {
			(settings as unknown as Record<string, unknown>)[key] = record[key];
		}
	}
	if (settings.target !== 'bloomsight' && settings.target !== 'blooms-ai') settings.target = DEFAULT_SETTINGS.target;
	return settings;
}

/** Save settings for the next page load. Returns whether they were saved. */
export function saveSettings(settings: DemoSettings, storage: Storage | undefined = browserStorage()): boolean {
	try {
		storage!.setItem(STORAGE_KEY, JSON.stringify(settings));
		return true;
	} catch {
		return false;
	}
}

/** Forget saved settings, so the next page load uses the defaults. */
export function clearSettings(storage: Storage | undefined = browserStorage()): void {
	try {
		storage?.removeItem(STORAGE_KEY);
	} catch {
		// Nothing saved can be read back either, so the defaults apply anyway.
	}
}

/** The configuration handed to `provideBloomsight()`. */
export function toBloomsightConfig(settings: DemoSettings, onError: (error: BloomsightError) => void): BloomsightConfig {
	const {apiBase, ...rest} = settings;
	return {...rest, ...(apiBase.trim() ? {apiBase: apiBase.trim()} : {}), onError};
}

/** Where events would go, in words, for the header. */
export function describeBackend(settings: DemoSettings): string {
	if (settings.target === 'blooms-ai') return `blooms.ai (${settings.apiBase.trim() || 'default host'})`;
	return 'the standalone Bloomsight server';
}
