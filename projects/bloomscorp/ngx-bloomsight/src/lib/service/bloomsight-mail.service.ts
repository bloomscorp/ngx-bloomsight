import {Inject, Injectable} from '@angular/core';
import {init} from '@bloomscorp/bloomsight.js';
import {IConfig} from '@bloomscorp/bloomsight.js/dist/configuration/interface/config';
import {sendEmail as mail} from '@bloomscorp/bloomsight.js';

@Injectable()
export class BloomsightMailService {

    init() {
        init(this._config);
    }

    constructor(
        @Inject('bloomsightConfig') private _config: IConfig,
    ) {
        this.init();
    }

    public sendMail(
        engineId: string,
        templateId: string,
        templateOwnerId: string,
        emailMetaData: FormData,
        onSuccess: () => void,
        onError: () => void
    ): void {
        mail(engineId, templateId, templateOwnerId, emailMetaData, onSuccess, onError);
    }

}