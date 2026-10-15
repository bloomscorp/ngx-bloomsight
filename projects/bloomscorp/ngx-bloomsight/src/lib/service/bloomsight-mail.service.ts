import {Inject, Injectable} from '@angular/core';
import {IConfig, sendEmail as mail} from '@bloomscorp/bloomsight.js';
import {BloomsightEmailEngine} from '../type/bloomsight-email-engine';
import {initOnce} from '../internal/bloomsight-init';

@Injectable()
export class BloomsightMailService {

    init() {
        initOnce(this._config);
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
        onError: () => void,
        engineType: BloomsightEmailEngine = 'GMAIL'
    ): void {
        // No cast: BloomsightEmailEngine is the core's own EmailEngineType, so
        // the compiler checks this argument against the real signature.
        mail(engineType, engineId, templateId, templateOwnerId, emailMetaData, onSuccess, onError);
    }

}