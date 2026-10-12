import {Inject, Injectable} from '@angular/core';
import {pageViewObserver as pageView} from '@bloomscorp/bloomsight.js';
import {NavigationEnd, Router} from '@angular/router';
import {IConfig} from '@bloomscorp/bloomsight.js/dist/configuration/interface/config';
import {resolveSimpleEvent as simpleEvent} from '@bloomscorp/bloomsight.js';
import {resolveDataEvent as dataEvent} from '@bloomscorp/bloomsight.js';
import {initOnce} from '../internal/bloomsight-init';

@Injectable()
export class BloomsightEventService {

    private _previousUrl: string = '';

    init() {
        initOnce(this._config);
    }

    constructor(
        @Inject('bloomsightConfig') private _config: IConfig,
        private _router: Router
    ) {
        this.init();
        this.pageViewObserver();
    }

    public pageViewObserver(): void {
        
        this._router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {

                // `urlAfterRedirects`, not `url`: a guard or `redirectTo` means
                // the two differ, and `url` reports the URL the user asked for
                // rather than the one they actually landed on. It also logs a
                // spurious page view when two requested URLs resolve to the
                // same destination.
                if (this._previousUrl !== event.urlAfterRedirects) {
                    pageView();
                }

                this._previousUrl = event.urlAfterRedirects;
            }
        });
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
