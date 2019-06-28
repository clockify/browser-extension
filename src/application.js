import {getAppTypes} from "./enums/applications-types.enum";
import {Extension} from "./application-types/extension";
import {Desktop} from "./application-types/desktop";
import {SettingsService} from "./services/settings-service";
import {getEnv} from "./environment";

const extension = new Extension();
const desktop = new Desktop();
const settingsService = new SettingsService();
const environment = getEnv();

export class Application {

    constructor(appType) {
        this.appType = appType;
    }

    afterLoad() {
        this.setWebSocketParamsToStorage();
        this.setBaseUrl();
        this.setHomeUrl();
        switch (this.appType) {
            case getAppTypes().EXTENSION:
                extension.afterLoad();
                break;
            case getAppTypes().DESKTOP:
                desktop.afterLoad();
                break;
        }
    }

    setIcon(iconStatus) {
        switch (this.appType) {
            case getAppTypes().EXTENSION:
                extension.setIcon(iconStatus);
                break;
            case getAppTypes().DESKTOP:
                desktop.setIcon(iconStatus);
                break;
        }
    }

    setWebSocketParamsToStorage() {
        localStorage.setItem("webSocketEndpoint", environment.webSocket.endpoint);
        localStorage.setItem("webSocketClientId", environment.webSocket.clientId);
    }

    setBaseUrl() {
        const baseUrlFromStorage = settingsService.getBaseUrl();
        if (!baseUrlFromStorage) {
            settingsService.setBaseUrl(environment.endpoint);
            settingsService.setSelfHosted(false);
        } else {
            const selfHostedActive = baseUrlFromStorage !== environment.endpoint;
            settingsService.setSelfHosted(selfHostedActive);
        }
    }

    setHomeUrl() {
        const homeUrlFromStorage = settingsService.getHomeUrl();
        if (!homeUrlFromStorage) {
            settingsService.setHomeUrl(environment.home);
        }
    }
}