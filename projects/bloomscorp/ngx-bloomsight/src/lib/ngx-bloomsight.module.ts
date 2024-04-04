import {ModuleWithProviders, NgModule} from '@angular/core';
import {NgxBloomsightComponent} from './ngx-bloomsight.component';
import {FootprintConfig} from './interface/footprint-config';
import {FootprintEventService} from './service/footprint-event.service';



@NgModule({
    declarations: [
        NgxBloomsightComponent
    ],
    imports: [
    ],
    exports: [
        NgxBloomsightComponent
    ]
})
export class NgxBloomsightModule {
    
    static forRoot(config: FootprintConfig): ModuleWithProviders<NgxBloomsightModule> {

        return {
            ngModule: NgxBloomsightModule,
            providers: [FootprintEventService, {provide: 'config', useValue: config}]
        };
    }
}
