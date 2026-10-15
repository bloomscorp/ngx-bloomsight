import {Routes} from '@angular/router';

import {PageViewsPage} from './page-views-page';
import {PageViewTarget} from './page-view-target';

/**
 * Two real pages, and two old URLs that both redirect to the first. Following
 * either old link lands on a page you are already on, so the router completes a
 * navigation but no new page view is recorded — `urlAfterRedirects`, not `url`.
 */
export const pageViewRoutes: Routes = [
	{
		path: '',
		component: PageViewsPage,
		children: [
			{path: '', pathMatch: 'full', redirectTo: 'first'},
			{path: 'first', title: 'First page · Bloomsight demo', component: PageViewTarget, data: {name: 'First page'}},
			{path: 'second', title: 'Second page · Bloomsight demo', component: PageViewTarget, data: {name: 'Second page'}},
			{path: 'old-first', redirectTo: 'first'},
			{path: 'legacy-first', redirectTo: 'first'}
		]
	}
];
