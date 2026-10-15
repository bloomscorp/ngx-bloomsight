import {BloomsightEmailEngine} from './bloomsight-email-engine';

/**
 * One mail, as `BloomsightService.sendMail()` accepts it.
 *
 * Named fields replace 1.x's seven positional arguments (P4). Three of those
 * were plain strings in a row — engine id, template id, owner id — so swapping
 * two compiled cleanly and sent the mail with the wrong template. By name, they
 * cannot be swapped.
 */
export interface BloomsightMailRequest {
	/** The mail engine configured on the Bloomsight dashboard. */
	engineId: string;
	/** The template to render. */
	templateId: string;
	/**
	 * The user who owns the template. Required by the standalone Bloomsight
	 * server, which receives it as the `userId` form field.
	 */
	templateOwnerId: string;
	/**
	 * The values the template fills in. Each field arrives at the server as
	 * `metadata[<name>]`.
	 */
	data: FormData;
	/** Which endpoint delivers it. Defaults to `'GMAIL'`. */
	engine?: BloomsightEmailEngine;
}
