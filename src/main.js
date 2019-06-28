import React from 'react';
import {Application} from "./application";
import {determineAppType} from "./helpers/app-types-helper";
import {checkConnection} from "./components/check-connection";
import * as moment from 'moment-timezone';

document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    let appType;
    let application;
    if (!localStorage.getItem('appType') || localStorage.getItem('appType') === '') {
        appType = determineAppType();
        application = new Application(appType);
    } else {
        appType = localStorage.getItem('appType');
        application = new Application(appType);
    }

    localStorage.setItem('timeZone', moment.tz.guess());

    application.afterLoad();
});


