const localStorageEnums = {
    'PERMANENT_PREFIX': 'permanent_',
    'SELF_HOSTED_PREFIX': 'selfhosted_',
    'ALL': true
};
Object.freeze(localStorageEnums);

export function getLocalStorageEnums() {
    return localStorageEnums;
}