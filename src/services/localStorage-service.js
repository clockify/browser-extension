import {getLocalStorageEnums} from "../enums/local-storage.enum";

export class LocalStorageService {
    constructor() {}

    get(key, optionalReturnValue) {
        const keys = Object.keys(localStorage);
        for (let i in keys) {
            if (keys[i].includes(key)) {
                key = keys[i];
                break;
            }
        }

        return localStorage.getItem(key) || optionalReturnValue;
    }

    set(key, value, optionalPrefix) {
        if (optionalPrefix) {
            key = optionalPrefix + key;
        }

        localStorage.setItem(key, value);
    }

    clear(all) {
        let keysToDelete = [];

        if (all) {
            keysToDelete = Object.keys(localStorage);
        } else {
            keysToDelete = Object.keys(localStorage)
                .filter(key =>
                    !key.includes(getLocalStorageEnums().PERMANENT_PREFIX) &&
                    !key.includes(getLocalStorageEnums().SELF_HOSTED_PREFIX) &&
                    !key.includes(getLocalStorageEnums().SUB_DOMAIN_PREFIX)
                );
        }

        for (let key in keysToDelete) {
            localStorage.removeItem(keysToDelete[key]);
        }
    }

    clearByPrefixes(prefixesToDelete) {
        const keysToDelete = Object.keys(localStorage).filter(key => {
            return prefixesToDelete.filter(prefixToDelete => key.includes(prefixToDelete)).length > 0
        });

        for (let key in keysToDelete) {
            localStorage.removeItem(keysToDelete[key]);
        }
    }

    removeItem(itemKey) {
        const keyToDelete = Object.keys(localStorage).filter(key => key.includes(itemKey))[0];

        if (keyToDelete) {
            localStorage.removeItem(keyToDelete);
        }

    }
}