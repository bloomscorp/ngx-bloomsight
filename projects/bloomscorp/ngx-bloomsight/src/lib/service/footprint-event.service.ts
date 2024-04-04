import {Inject, Injectable} from '@angular/core';
import {FootprintConfig} from '../interface/footprint-config';
import {init} from '@bloomscorp/bloomsight.js';
import {pageViewObserver as pageView} from '@bloomscorp/bloomsight.js';
import {NavigationEnd, Router} from '@angular/router';

@Injectable()
export class FootprintEventService {

    init() {
        init({
            propertyToken: this._config.propertyToken,
            isDevelopmentMode: this._config.developmentMode,
        });
    }

    constructor(
        @Inject('config') private _config: FootprintConfig,
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




}
