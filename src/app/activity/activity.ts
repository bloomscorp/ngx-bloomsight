import {signal} from '@angular/core';

export type ActivityKind = 'request' | 'log' | 'warn' | 'error' | 'on-error';

export interface ActivityEntry {
	id: number;
	time: string;
	kind: ActivityKind;
	summary: string;
	detail: string;
}

/** The most recent entries kept. Older ones are dropped. */
const LIMIT = 200;

/**
 * What the SDK did: the requests it made and the lines it logged, newest first.
 *
 * A plain class rather than an injectable, because it has to exist **before**
 * the app starts — the SDK makes its first requests while the app is still
 * bootstrapping. `main.ts` creates it and provides it.
 */
export class Activity {

	private nextId = 1;

	private readonly list = signal<ActivityEntry[]>([]);

	readonly entries = this.list.asReadonly();

	record(kind: ActivityKind, summary: string, detail = ''): void {
		const entry: ActivityEntry = {id: this.nextId++, time: new Date().toLocaleTimeString(), kind, summary, detail};
		this.list.update((entries) => [entry, ...entries].slice(0, LIMIT));
	}

	clear(): void {
		this.list.set([]);
	}
}

/** Anything the SDK sends or logs, as readable text. */
export function describe(value: unknown): string {
	if (value === undefined || value === null) return '';
	if (typeof value === 'string') return value;
	if (value instanceof FormData) {
		const fields: Record<string, string> = {};
		value.forEach((field, key) => (fields[key] = typeof field === 'string' ? field : `[file ${field.name}]`));
		return JSON.stringify(fields, null, 2);
	}
	if (value instanceof Error) return value.message;
	try {
		return JSON.stringify(value, null, 2) ?? String(value);
	} catch {
		return String(value);
	}
}

interface CaptureTarget {
	fetch: typeof fetch;
	console: Pick<Console, 'log' | 'info' | 'warn' | 'error'>;
}

/**
 * Record every request made through `fetch` and every console line, while
 * passing both through unchanged. Returns a function that undoes it.
 *
 * This is the demo's own instrumentation, which is how it can show where events
 * go without importing anything from the core (the facade rule).
 *
 * Entries are recorded a microtask later rather than inline: console calls can
 * happen while Angular is rendering, where writing a signal is not allowed.
 */
export function installActivityCapture(activity: Activity, target: CaptureTarget): () => void {
	const later = (kind: ActivityKind, summary: string, detail = ''): void =>
		queueMicrotask(() => activity.record(kind, summary, detail));

	const originalFetch = target.fetch;
	target.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
		try {
			const response = await originalFetch.call(target, input, init);
			later('request', `${method} ${url} → ${response.status}`, describe(init?.body));
			return response;
		} catch (error) {
			later('request', `${method} ${url} → network error`, describe(init?.body));
			throw error;
		}
	};

	const levels = {log: 'log', info: 'log', warn: 'warn', error: 'error'} as const;
	const originals = {...target.console};
	for (const level of Object.keys(levels) as Array<keyof typeof levels>) {
		target.console[level] = (...args: unknown[]): void => {
			originals[level].apply(target.console, args);
			later(levels[level], args.map(describe).join(' '));
		};
	}

	return () => {
		target.fetch = originalFetch;
		Object.assign(target.console, originals);
	};
}
