import {ModuleWithProviders, NgModule} from '@angular/core';
import {NgxBloomsightComponent} from './ngx-bloomsight.component';
import {BloomsightEventService} from './service/bloomsight-event.service';
import {IConfig} from '@bloomscorp/bloomsight.js/dist/configuration/interface/config';
import {BloomsightMailService} from './service/bloomsight-mail.service';



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
    
    static forRoot(bloomsightConfig: IConfig): ModuleWithProviders<NgxBloomsightModule> {

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
