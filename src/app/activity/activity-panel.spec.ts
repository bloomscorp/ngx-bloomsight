import {TestBed} from '@angular/core/testing';

import {Activity} from './activity';
import {ActivityPanel} from './activity-panel';

function render() {
	const activity = new Activity();
	TestBed.configureTestingModule({providers: [{provide: Activity, useValue: activity}]});
	const fixture = TestBed.createComponent(ActivityPanel);
	const root: HTMLElement = fixture.nativeElement;
	const button = (label: string) => [...root.querySelectorAll('button')].find((b) => b.textContent!.includes(label))!;
	const shown = () => [...root.querySelectorAll('.entry')].map((e) => e.textContent!.replace(/\s+/g, ' ').trim());
	return {activity, fixture, root, button, shown};
}

describe('the activity panel', () => {

	it('says so when there is nothing yet', async () => {
		const {fixture, root} = render();
		await fixture.whenStable();

		expect(root.textContent).toContain('Nothing yet');
	});

	it('filters to requests or to log lines', async () => {
		const {activity, fixture, button, shown} = render();
		activity.record('log', 'simple event data');
		activity.record('request', 'POST https://api.test/ingest → 200', '{"a":1}');
		activity.record('on-error', 'onError: ORIGIN_REJECTED');
		await fixture.whenStable();
		expect(shown()).toHaveLength(3);

		button('Requests').click();
		await fixture.whenStable();
		expect(shown()).toEqual([expect.stringContaining('POST https://api.test/ingest → 200')]);

		button('Logs').click();
		await fixture.whenStable();
		expect(shown()).toEqual([
			expect.stringContaining('onError: ORIGIN_REJECTED'),
			expect.stringContaining('simple event data')
		]);

		button('All').click();
		await fixture.whenStable();
		expect(shown()).toHaveLength(3);
	});

	it('shows a request body on demand', async () => {
		const {activity, fixture, root} = render();
		activity.record('request', 'POST https://api.test/ingest → 200', '{"eventToken":"x"}');
		await fixture.whenStable();

		expect(root.querySelector('details pre')!.textContent).toBe('{"eventToken":"x"}');
	});

	it('clears', async () => {
		const {activity, fixture, button, shown} = render();
		activity.record('log', 'line');
		await fixture.whenStable();

		button('Clear').click();
		await fixture.whenStable();

		expect(shown()).toEqual([]);
		expect(activity.entries()).toEqual([]);
	});
});
