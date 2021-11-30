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

    setWebSocketUrl(endPoint) {
        localStorageService.set("webSocketEndpoint", endPoint, getLocalStorageEnums().PERMANENT_PREFIX);
    }

    setSelfHosted(value) {
        localStorageService.set('selfHosted', value, getLocalStorageEnums().SELF_HOSTED_PREFIX);
    }

    getLoginSettings() {
        const baseUrl = this.getBaseUrl() + '/system-settings/login-settings';
        return super.get(baseUrl).then(response => response.data);
    }

    setHomeUrl(value) {
        localStorageService.set('homeUrl', value, getLocalStorageEnums().PERMANENT_PREFIX);
    }

    getHomeUrl() {
        return localStorageService.get('homeUrl');
    }

    setSubDomainName(value) {
        localStorageService.set('subDomainName', value, getLocalStorageEnums().SUB_DOMAIN_PREFIX);
    }
}