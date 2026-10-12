import {Inject, Injectable} from '@angular/core';
import {IConfig, sendEmail as mail} from '@bloomscorp/bloomsight.js';
import {BloomsightEmailEngine} from '../type/bloomsight-email-engine';
import {initOnce} from '../internal/bloomsight-init';

/**
 * The engine-type parameter of the core's `sendEmail`, derived from the
 * function itself rather than imported.
 *
 * The core types that parameter as `EmailEngineTypeEnum`, which lives at
 * `@bloomscorp/bloomsight.js/dist/email/enums/emailEngineTypeEnum` and is **not
 * exported from the package root in any published version**. Importing it by
 * path is the deep import that P1 is about, and it reached the published
 * `.d.ts`. Reading the parameter type off the root-exported function needs no
 * such import and cannot drift from the real signature.
 */
type CoreEmailEngineType = Parameters<typeof mail>[0];

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
        // TypeScript enums are nominal, so the literal union will not assign to
        // the core's enum directly. The SDK compares this value as a plain
        // string at runtime, so the assertion is safe. See P6: the core's enum
        // is type-only and yields `undefined` if imported as a value, which is
        // why this wrapper deals in string literals at its own boundary.
        mail(
            engineType as unknown as CoreEmailEngineType,
            engineId, templateId, templateOwnerId, emailMetaData, onSuccess, onError
        );
    }

}