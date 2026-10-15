import {bootstrapApplication} from '@angular/platform-browser';

import {App} from './app/app';
import {appConfig} from './app/app.config';
import {Activity, installActivityCapture} from './app/activity/activity';
import {loadSettings} from './app/demo-settings';

// Installed before bootstrap: the SDK makes its first requests while the app
// is starting, and those belong in the activity panel too.
const activity = new Activity();
installActivityCapture(activity, window);

bootstrapApplication(App, appConfig(loadSettings(), activity))
	.catch((error) => console.error(error));
