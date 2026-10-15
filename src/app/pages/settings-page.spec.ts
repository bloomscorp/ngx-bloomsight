import {vi} from 'vitest';
import {RouterTestingHarness} from '@angular/router/testing';

import {stubNetwork} from '../bloomsight-integration/integration-harness';
import {byTestId, configureDemo, enter, tick} from '../testing/demo-harness';
import {DEFAULT_SETTINGS, loadSettings, saveSettings} from '../demo-settings';

async function openSettings() {
	const harness = await RouterTestingHarness.create('/settings');
	return {harness, root: harness.routeNativeElement!};
}

describe('the settings page', () => {

	beforeEach(() => {
		stubNetwork();
		localStorage.clear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		localStorage.clear();
	});

	it('starts from the settings the app is running with', async () => {
		configureDemo({...DEFAULT_SETTINGS, target: 'blooms-ai', apiBase: 'https://staging.test'});
		const {root} = await openSettings();

		expect(byTestId<HTMLSelectElement>(root, 'target').value).toBe('blooms-ai');
		expect(byTestId<HTMLInputElement>(root, 'api-base').value).toBe('https://staging.test');
		expect(byTestId<HTMLInputElement>(root, 'logOnly').checked).toBe(true);
	});

	it('saves the changes and reloads, which is how they take effect', async () => {
		const {reload} = configureDemo();
		const {harness, root} = await openSettings();

		enter(byTestId(root, 'target'), 'blooms-ai');
		await harness.fixture.whenStable();
		enter(byTestId(root, 'api-base'), 'https://staging.test');
		tick(byTestId(root, 'stopDataEvent'), true);
		await harness.fixture.whenStable();
		byTestId<HTMLButtonElement>(root, 'apply').click();

		expect(reload).toHaveBeenCalledTimes(1);
		expect(loadSettings()).toEqual({...DEFAULT_SETTINGS, target: 'blooms-ai', apiBase: 'https://staging.test', stopDataEvent: true});
	});

	it('only takes apiBase for blooms.ai', async () => {
		configureDemo();
		const {harness, root} = await openSettings();

		expect(byTestId<HTMLInputElement>(root, 'api-base').disabled).toBe(true);

		enter(byTestId(root, 'target'), 'blooms-ai');
		await harness.fixture.whenStable();
		expect(byTestId<HTMLInputElement>(root, 'api-base').disabled).toBe(false);
	});

	it('will not go live with the placeholder token', async () => {
		const {reload} = configureDemo();
		const {harness, root} = await openSettings();

		tick(byTestId(root, 'logOnly'), false);
		await harness.fixture.whenStable();

		expect(byTestId(root, 'blocked').textContent).toContain('real property token');
		expect(byTestId<HTMLButtonElement>(root, 'apply').disabled).toBe(true);

		enter(byTestId(root, 'token'), 'a-real-token');
		await harness.fixture.whenStable();
		expect(root.querySelector('[data-testid="blocked"]')).toBeNull();
		byTestId<HTMLButtonElement>(root, 'apply').click();
		expect(reload).toHaveBeenCalledTimes(1);
		expect(loadSettings()).toMatchObject({logOnly: false, propertyToken: 'a-real-token'});
	});

	it('goes back to the safe defaults', async () => {
		saveSettings({...DEFAULT_SETTINGS, logOnly: false, propertyToken: 'a-real-token'});
		const {reload} = configureDemo(loadSettings());
		const {root} = await openSettings();

		byTestId<HTMLButtonElement>(root, 'reset').click();

		expect(reload).toHaveBeenCalledTimes(1);
		expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
	});

	it('says so, and does not reload, when the browser will not save', async () => {
		const {reload} = configureDemo();
		const {harness, root} = await openSettings();
		// Refused only for the click. Blocking storage for longer would also
		// block the SDK's own writes, which happen asynchronously after startup.
		const refuse = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('full', 'QuotaExceededError');
		});

		byTestId<HTMLButtonElement>(root, 'apply').click();
		refuse.mockRestore();
		await harness.fixture.whenStable();

		expect(reload).not.toHaveBeenCalled();
		expect(root.textContent).toContain('would not save the settings');
	});

});
