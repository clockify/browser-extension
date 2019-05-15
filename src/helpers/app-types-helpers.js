import {getAppTypes} from "../enums/applications-types.enum";
import {getBrowser} from "./browser-helpers";
import {checkConnection} from "../components/check-connection";
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
        try {
            changeTrayIcon(false);
            localStorageService.set(
                'appType',
                getAppTypes().DESKTOP,
                getLocalStorageEnums().PERMANENT_PREFIX
            );

            return getAppTypes().DESKTOP
        } catch (e) {
            localStorageService.set(
                'appType',
                getAppTypes().MOBILE,
                getLocalStorageEnums().PERMANENT_PREFIX
            );

            document.addEventListener('deviceready', () => {
                checkConnection();
            }, false);

            return getAppTypes().MOBILE;
        }
    }
}

export function isAppTypeExtension() {
    return localStorageService.get('appType') === getAppTypes().EXTENSION;
}

export function isAppTypeDesktop() {
    return localStorageService.get('appType') === getAppTypes().DESKTOP;
}

export function isAppTypeMobile() {
    return localStorageService.get('appType') === getAppTypes().MOBILE;
}

