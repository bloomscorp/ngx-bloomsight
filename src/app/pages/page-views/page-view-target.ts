import {Component, input} from '@angular/core';

/** A destination page. Its name comes from the route's data, bound as an input. */
@Component({
	selector: 'app-page-view-target',
	template: `<p class="callout" data-testid="landed">📍 You are on the <strong>{{ name() }}</strong>.</p>`
})
export class PageViewTarget {

	readonly name = input('');
}
