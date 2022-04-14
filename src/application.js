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

    constructor() {

    }

    afterLoad() {
        this.setWebSocketParamsToStorage();
        this.setBaseUrl();
        this.setHomeUrl();
        extension.afterLoad();
    }

    setIcon(iconStatus) {
        extension.setIcon(iconStatus);
    }

    async setWebSocketParamsToStorage() {
        if (!(await localStorageService.get("webSocketEndpoint"))) {
            localStorageService.set(
                "webSocketEndpoint",
                environment.webSocket.endpoint,
                getLocalStorageEnums().PERMANENT_PREFIX);
        }
        localStorageService.set(
            "webSocketClientId",
            environment.webSocket.clientId,
            getLocalStorageEnums().PERMANENT_PREFIX);
    }

    async setBaseUrl() {
        const baseUrlFromStorage = await settingsService.getBaseUrl();
        if (!baseUrlFromStorage) {
            settingsService.setBaseUrl(environment.endpoint);
            settingsService.setSelfHosted(false);
        } else {
            if (baseUrlFromStorage.includes('api.clockify.me/api')) {
                settingsService.setBaseUrl(environment.endpoint);
                settingsService.setSelfHosted(false);
            } else {
                const selfHostedActive = baseUrlFromStorage !== environment.endpoint;
                settingsService.setSelfHosted(selfHostedActive);
            }
        }
    }

    async setHomeUrl() {
        const homeUrlFromStorage = await settingsService.getHomeUrl();
        if (!homeUrlFromStorage) {
            settingsService.setHomeUrl(environment.home);
        }
    }
}