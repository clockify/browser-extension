import {getAppTypes} from "../enums/applications-types.enum";
import {getBrowser} from "./browser-helper";
import {isOffline} from "../components/check-connection";
import {iconInactivePath} from "../../assets/assets";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";

const localStorageService = new LocalStorageService();

export function determineAppType() {
    try {
        getBrowser().browserAction.setIcon({
            path: iconInactivePath
        });
        localStorageService.set(
            'appType',
            getAppTypes().EXTENSION,
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        return getAppTypes().EXTENSION
    } catch (e) {
        changeTrayIcon(false);
        localStorageService.set(
            'appType',
            getAppTypes().DESKTOP,
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        return getAppTypes().DESKTOP
    }
}

export function isAppTypeExtension() {
    return localStorageService.get('appType') === getAppTypes().EXTENSION;
}

export function isAppTypeDesktop() {
    return localStorageService.get('appType') === getAppTypes().DESKTOP;
}

