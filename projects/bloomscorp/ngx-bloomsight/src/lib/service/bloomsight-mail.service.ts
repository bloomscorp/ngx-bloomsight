import {Inject, Injectable} from '@angular/core';
import {init} from '@bloomscorp/bloomsight.js';
import {IConfig} from '@bloomscorp/bloomsight.js/dist/configuration/interface/config';
import {sendEmail as mail} from '@bloomscorp/bloomsight.js';
import {BloomsightEmailEngine} from '../type/bloomsight-email-engine';
import type {EmailEngineTypeEnum} from '@bloomscorp/bloomsight.js/dist/email/enums/emailEngineTypeEnum';

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
        onError: () => void,
        engineType: BloomsightEmailEngine = 'GMAIL'
    ): void {
        // TypeScript enums are nominal, so the literal union will not assign to
        // EmailEngineTypeEnum directly. The SDK compares this value as a plain
        // string at runtime, so the assertion is safe; the import above is
        // type-only and emits nothing.
        mail(
            engineType as unknown as EmailEngineTypeEnum,
            engineId, templateId, templateOwnerId, emailMetaData, onSuccess, onError
        );
    }

}