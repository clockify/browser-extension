import {getAppTypes} from "./enums/applications-types.enum";
import {Extension} from "./application-types/extension";
import {SettingsService} from "./services/settings-service";
import {getEnv} from "./environment";
import {LocalStorageService} from "./services/localStorage-service";
import {getLocalStorageEnums} from "./enums/local-storage.enum";

const extension = new Extension();
const settingsService = new SettingsService();
const environment = getEnv();
const localStorageService = new LocalStorageService();

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
        }
    }

    setIcon(iconStatus) {
        switch (this.appType) {
            case getAppTypes().EXTENSION:
                extension.setIcon(iconStatus);
                break;
        }
    }

    setWebSocketParamsToStorage() {
        localStorageService.set(
            "webSocketEndpoint",
            environment.webSocket.endpoint,
            getLocalStorageEnums().PERMANENT_PREFIX);
        localStorageService.set(
            "webSocketClientId",
            environment.webSocket.clientId,
            getLocalStorageEnums().PERMANENT_PREFIX);
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