import {getLocalStorageEnums} from "../enums/local-storage.enum";

export class LocalStorageService {
    constructor() {}

    async get(key, optionalReturnValue) {
        const keys = Object.values(getLocalStorageEnums()).filter(el => typeof el === 'string').map(el => {
            return el + key;
        })
        keys.push(key);
        const item  = await localStorage.getItem(keys);
        return item || optionalReturnValue || null;
    }

    set(key, value, optionalPrefix) {
        if (optionalPrefix) {
            key = optionalPrefix + key;
        }
        localStorage.setItem(key, value);
    }
    
    async clearByPrefixes(prefixesToDelete, inverse = false) {
        const allKeys = Object.keys(await localStorage.getItem(null));

        const keysToDelete = allKeys.filter(key => {
            const res = prefixesToDelete.filter(prefixToDelete => key.includes(prefixToDelete)).length > 0;
            return inverse ? !res : res;
        });

        return await localStorage.removeItem(keysToDelete);
        
    }

    removeItem(itemKey) {
        const keysToDelete = Object.values(getLocalStorageEnums()).filter(el => typeof el === 'string').map(el => {
            return el + itemKey;
        })
        keysToDelete.push(itemKey);

        if (keysToDelete) {
            localStorage.removeItem(keysToDelete);
        }

    }
}