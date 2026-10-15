import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    // Standalone, the Angular 22 default, so it declares its own template
    // dependencies. As an NgModule-declared component its template could only be
    // checked inside AppModule's scope, which the Vitest builder's ahead-of-time
    // test compilation does not have — 'router-outlet' came out unknown.
    imports: [RouterOutlet]
})
export class AppComponent {
  title = 'ngx-bloomsight';
}
