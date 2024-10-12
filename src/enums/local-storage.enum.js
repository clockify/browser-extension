const localStorageEnums = {
	PERMANENT_PREFIX: 'permanent_',
	SELF_HOSTED_PREFIX: 'selfhosted_',
	SUB_DOMAIN_PREFIX: 'sub-domain_',
	APP_STORE: 'appStore',
	ALL: true,
};
Object.freeze(localStorageEnums);

export function getLocalStorageEnums() {
	return localStorageEnums;
}
