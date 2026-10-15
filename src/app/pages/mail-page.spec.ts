import {vi} from 'vitest';
import {RouterTestingHarness} from '@angular/router/testing';

import {B1_HOST, GMAIL_SEND, SMTP_SEND, StubbedResponse, stubNetwork} from '../bloomsight-integration/integration-harness';
import {byTestId, configureDemo, enter, LIVE_ON_BLOOMS_AI} from '../testing/demo-harness';
import {DEFAULT_SETTINGS} from '../demo-settings';

/** Open the mail page and fill in the three ids. */
async function openFilledIn() {
	const harness = await RouterTestingHarness.create('/mail');
	const root = harness.routeNativeElement!;
	enter(byTestId(root, 'engine-id'), 'engine-1');
	enter(byTestId(root, 'template-id'), 'template-2');
	enter(byTestId(root, 'owner-id'), 'owner-3');
	await harness.fixture.whenStable();
	return {harness, root};
}

/** The mail server answers; everything else gets the default success. */
const mailServer = (reply: StubbedResponse) => (url: string): StubbedResponse | undefined =>
	url.startsWith(B1_HOST) ? reply : undefined;

describe('the mail page', () => {

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('cannot send until the three ids are filled in', async () => {
		stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const harness = await RouterTestingHarness.create('/mail');
		const root = harness.routeNativeElement!;

		expect(byTestId<HTMLButtonElement>(root, 'send').disabled).toBe(true);

		enter(byTestId(root, 'engine-id'), 'engine-1');
		enter(byTestId(root, 'template-id'), 'template-2');
		await harness.fixture.whenStable();
		expect(byTestId<HTMLButtonElement>(root, 'send').disabled).toBe(true);

		enter(byTestId(root, 'owner-id'), 'owner-3');
		await harness.fixture.whenStable();
		expect(byTestId<HTMLButtonElement>(root, 'send').disabled).toBe(false);
	});

	it('sends the ids and the template fields to the standalone server, even on blooms.ai', async () => {
		const net = stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openFilledIn();

		byTestId<HTMLButtonElement>(root, 'send').click();

		await vi.waitFor(async () => {
			await harness.fixture.whenStable();
			expect(byTestId(root, 'mail-status').textContent).toContain('Sent.');
		});
		const body = net.to(GMAIL_SEND)[0]!.body as FormData;
		expect(body.get('engineId')).toBe('engine-1');
		expect(body.get('templateId')).toBe('template-2');
		expect(body.get('userId')).toBe('owner-3');
		expect(body.get('metadata[name]')).toBe('Asha');
		expect(body.get('metadata[email]')).toBe('asha@example.com');
	});

	it('sends the template fields as edited, added and removed', async () => {
		const net = stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openFilledIn();
		const names = () => [...root.querySelectorAll<HTMLInputElement>('[aria-label="Field name"]')];
		const values = () => [...root.querySelectorAll<HTMLInputElement>('[aria-label="Field value"]')];

		enter(values()[0]!, 'Ravi');                                                    // edit
		root.querySelectorAll<HTMLButtonElement>('[aria-label="Remove field"]')[1]!.click(); // remove email
		[...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes('Add a field'))!.click();
		await harness.fixture.whenStable();
		enter(names()[1]!, 'company');
		enter(values()[1]!, 'Bloomscorp');
		await harness.fixture.whenStable();
		byTestId<HTMLButtonElement>(root, 'send').click();

		await vi.waitFor(() => expect(net.to(GMAIL_SEND)).toHaveLength(1));
		const body = net.to(GMAIL_SEND)[0]!.body as FormData;
		expect(body.get('metadata[name]')).toBe('Ravi');
		expect(body.get('metadata[email]')).toBeNull();
		expect(body.get('metadata[company]')).toBe('Bloomscorp');
	});

	it('leaves out a field with no name', async () => {
		const net = stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openFilledIn();

		[...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes('Add a field'))!.click();
		await harness.fixture.whenStable();
		byTestId<HTMLButtonElement>(root, 'send').click();

		await vi.waitFor(() => expect(net.to(GMAIL_SEND)).toHaveLength(1));
		const keys = [...(net.to(GMAIL_SEND)[0]!.body as FormData).keys()].filter((k) => k.startsWith('metadata['));
		expect(keys).toEqual(['metadata[name]', 'metadata[email]']);
	});

	it('sends through the engine chosen', async () => {
		const net = stubNetwork();
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openFilledIn();

		enter(byTestId(root, 'engine'), 'CUSTOM_SMTP');
		await harness.fixture.whenStable();
		byTestId<HTMLButtonElement>(root, 'send').click();

		await vi.waitFor(() => expect(net.to(SMTP_SEND)).toHaveLength(1));
		expect(net.to(GMAIL_SEND)).toHaveLength(0);
	});

	it('shows the failure when the server rejects the mail', async () => {
		stubNetwork(mailServer({body: {success: false, message: 'template not found'}}));
		configureDemo(LIVE_ON_BLOOMS_AI);
		const {harness, root} = await openFilledIn();

		byTestId<HTMLButtonElement>(root, 'send').click();

		await vi.waitFor(async () => {
			await harness.fixture.whenStable();
			expect(byTestId(root, 'mail-status').textContent).toContain('The mail was not sent');
		});
		expect(byTestId<HTMLButtonElement>(root, 'send').disabled).toBe(false);
	});

	it('finishes under logOnly, without sending — the F2 fix, visible', async () => {
		// In 1.x this page would have stayed on "Sending…" forever.
		const net = stubNetwork();
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
		configureDemo(DEFAULT_SETTINGS);
		const {harness, root} = await openFilledIn();

		byTestId<HTMLButtonElement>(root, 'send').click();
		await harness.fixture.whenStable();

		expect(byTestId(root, 'mail-status').textContent).toContain('under logOnly the SDK logged the mail and sent nothing');
		expect(net.toHost(B1_HOST).filter((r) => r.method === 'POST')).toEqual([]);
	});
});
