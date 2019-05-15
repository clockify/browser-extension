import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";

const localStorageService = new LocalStorageService();

export class SettingsService extends HttpWrapperService {

    constructor() {
        super();
    }

    setBaseUrl(url) {
        localStorageService.set('baseUrl', url, getLocalStorageEnums().PERMANENT_PREFIX);
    }

    getBaseUrl() {
        return localStorageService.get('baseUrl');
    }

    getLoginSettings(url) {
        const loginSettingsUrl =
            `${url}/system-settings/login-settings`;

        return super.get(loginSettingsUrl);
    }

    setSelfHosted(value) {
        localStorageService.set('selfHosted', value, getLocalStorageEnums().SELF_HOSTED_PREFIX);
    }

    setHomeUrl(value) {
        localStorageService.set('homeUrl', value, getLocalStorageEnums().PERMANENT_PREFIX);
    }

    getHomeUrl() {
        return localStorageService.get('homeUrl');
    }
}