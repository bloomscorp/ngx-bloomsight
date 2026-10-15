/** The current value of the input, select or textarea an event came from. */
export function valueOf(event: Event): string {
	return (event.target as HTMLInputElement).value;
}

/** Whether the checkbox an event came from is now ticked. */
export function checkedOf(event: Event): boolean {
	return (event.target as HTMLInputElement).checked;
}
