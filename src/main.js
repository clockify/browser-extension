import React from 'react';
import {Application} from "./application";
import {determineAppType} from "./helpers/app-types-helpers";
import {checkConnection} from "./components/check-connection";
import * as moment from 'moment-timezone';
import {getEnv} from "./environment";
import {MetricsService} from "./elastic-apm-rum/metrics-service";
import {LocalStorageService} from "./services/localStorage-service";
import {getBrowser} from "./helpers/browser-helpers";
import packageJson from '../package';

const localStorageService = new LocalStorageService();

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

    const isSelfHosted = JSON.parse(localStorageService.get('selfHosted', false));

    getBrowser().storage.local.get(['sendErrors'], (result) => {
        window.metricService = new MetricsService(
            {
                serviceName: 'clockify-prod-apps-' + appType,
                serverUrl: getEnv().apmServerUrl,
                serviceVersion: packageJson.version
            }
        );
        if (typeof result.sendErrors === "undefined") {
            aBrowser.storage.local.set({"sendErrors": true});
            window.metricService.init();
        } else if (result.sendErrors && !isSelfHosted) {
            window.metricService.init();
        } else {
            window.metricService.disable();
        }
    });

    application.afterLoad();
});


