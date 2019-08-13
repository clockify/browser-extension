import React from 'react';
import {Application} from "./application";
import {determineAppType} from "./helpers/app-types-helper";
import {checkConnection} from "./components/check-connection";
import * as moment from 'moment-timezone';
import {LocalStorageService} from "./services/localStorage-service";

const localStorageService = new LocalStorageService();

document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    let appType;
    let application;
    if (!localStorageService.get('appType') || localStorageService.get('appType') === '') {
        appType = determineAppType();
        application = new Application(appType);
    } else {
        appType = localStorageService.get('appType');
        application = new Application(appType);
    }

    localStorage.setItem('timeZone', moment.tz.guess());

    application.afterLoad();
});
