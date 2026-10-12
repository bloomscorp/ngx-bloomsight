import {ModuleWithProviders, NgModule} from '@angular/core';
import {NgxBloomsightComponent} from './ngx-bloomsight.component';
import {BloomsightEventService} from './service/bloomsight-event.service';
import {BloomsightConfig} from './type/bloomsight-config';
import {BloomsightMailService} from './service/bloomsight-mail.service';


/**
 * `NgxBloomsightComponent` is standalone, so this module no longer *declares*
 * anything — it imports the component and re-exports it. Consumers that do
 * `imports: [NgxBloomsightModule]` are unaffected; consumers on a standalone
 * app can import `NgxBloomsightComponent` directly and skip the module.
 *
 * The module survives for one reason only: `forRoot()` is still the sole way
 * to supply configuration and provide the two services. That is the real
 * NgModule coupling in this library, and it is what `provideBloomsight()`
 * replaces at 2.0.0 (MODERNISATION.md §6, and B6/B7/B8 in §1.1).
 */
@NgModule({
    imports: [
        NgxBloomsightComponent
    ],
    exports: [
        NgxBloomsightComponent
    ]
})
export class NgxBloomsightModule {
    
    static forRoot(bloomsightConfig: BloomsightConfig): ModuleWithProviders<NgxBloomsightModule> {

        return {
            ngModule: NgxBloomsightModule,
            providers: [
                BloomsightEventService, 
                BloomsightMailService, 
                {provide: 'bloomsightConfig', useValue: bloomsightConfig}
            ]
        };
    }
}
