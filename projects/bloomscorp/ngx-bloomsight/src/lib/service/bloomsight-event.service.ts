import {Inject, Injectable} from '@angular/core';
import {init} from '@bloomscorp/bloomsight.js';
import {pageViewObserver as pageView} from '@bloomscorp/bloomsight.js';
import {NavigationEnd, Router} from '@angular/router';
import {IConfig} from '@bloomscorp/bloomsight.js/dist/configuration/interface/config';
import {resolveSimpleEvent as simpleEvent} from '@bloomscorp/bloomsight.js';
import {resolveDataEvent as dataEvent} from '@bloomscorp/bloomsight.js';
import {sendEmail as mail} from '@bloomscorp/bloomsight.js';

@Injectable()
export class BloomsightEventService {

    init() {
        init(this._config);
    }

    constructor(
        @Inject('config') private _config: IConfig,
        private _router: Router
    ) {
        this.init();
        this.pageViewObserver();
    }

    public pageViewObserver(): void {
        this._router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                pageView();
            }
        })
    }


    public resolveSimpleEvent(eventToken: string, label: string = ''): void {
        simpleEvent(eventToken, label);
    }

    public resolveDataEvent(
        eventToken: string, 
        eventData: {[key: string]: any},
        label: string = ''
    ): void {
        dataEvent(eventToken, eventData, label);
    }
}
