const localStorageEnums = {
	PERMANENT_PREFIX: 'permanent_',
	SELF_HOSTED_PREFIX: 'selfhosted_',
	SUB_DOMAIN_PREFIX: 'sub-domain_',
	ALL: true,
};
Object.freeze(localStorageEnums);

export function getLocalStorageEnums() {
	return localStorageEnums;
}
