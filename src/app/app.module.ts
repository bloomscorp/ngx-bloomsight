import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
// Relative on purpose. This used to be the non-relative
// 'projects/bloomscorp/ngx-bloomsight/src/public-api', which only resolved
// because tsconfig.json set `baseUrl: "./"`. TypeScript 6 made `baseUrl` a
// hard error, so it was removed — and a non-relative specifier without it is
// treated as a package name and fails to resolve.
//
// The *proper* fix is T2 in MODERNISATION.md: the demo app should import
// '@bloomscorp/ngx-bloomsight' and consume the built package, which is what the
// existing `paths` mapping points at. That needs `build-lib` to run before
// `build`, so it belongs with the demo app rebuild rather than here.
import {NgxBloomsightModule} from '../../projects/bloomscorp/ngx-bloomsight/src/public-api';

@NgModule({
    // AppComponent is standalone, so it is imported rather than declared.
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgxBloomsightModule,
        AppComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
