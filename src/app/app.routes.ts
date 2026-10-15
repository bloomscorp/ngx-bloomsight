import {Routes} from '@angular/router';

/**
 * Every page is lazy-loaded. That is part of what the demo proves: the service
 * works from a lazy route, which 1.x could break by starting a second SDK there
 * (B7).
 */
export const routes: Routes = [
	{
		path: '',
		title: 'Overview · Bloomsight demo',
		loadComponent: () => import('./pages/overview-page').then((m) => m.OverviewPage)
	},
	{
		path: 'events',
		title: 'Events · Bloomsight demo',
		loadComponent: () => import('./pages/events-page').then((m) => m.EventsPage)
	},
	{
		path: 'page-views',
		loadChildren: () => import('./pages/page-views/page-views.routes').then((m) => m.pageViewRoutes)
	},
	{
		path: 'mail',
		title: 'Mail · Bloomsight demo',
		loadComponent: () => import('./pages/mail-page').then((m) => m.MailPage)
	},
	{
		path: 'settings',
		title: 'Settings · Bloomsight demo',
		loadComponent: () => import('./pages/settings-page').then((m) => m.SettingsPage)
	},
	{path: '**', redirectTo: ''}
];
