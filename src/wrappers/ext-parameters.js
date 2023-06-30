import { getLocalStorageEnums } from '../enums/local-storage.enum';

export class ExtParameters {
	setBaseUrl(url) {
		localStorage.setItem(
			'baseUrl',
			url,
			getLocalStorageEnums().PERMANENT_PREFIX
		);
	}

	getBaseUrl() {
		return localStorage.getItem('baseUrl');
	}

	setWebSocketUrl(endPoint) {
		localStorage.setItem(
			'webSocketEndpoint',
			endPoint,
			getLocalStorageEnums().PERMANENT_PREFIX
		);
	}

	setSelfHosted(value) {
		localStorage.setItem(
			'selfHosted',
			value,
			getLocalStorageEnums().SELF_HOSTED_PREFIX
		);
	}

	setHomeUrl(value) {
		localStorage.setItem(
			'homeUrl',
			value,
			getLocalStorageEnums().PERMANENT_PREFIX
		);
	}

	getHomeUrl() {
		return localStorage.getItem('homeUrl');
	}

	setSubDomainName(value) {
		localStorage.setItem(
			'subDomainName',
			value,
			getLocalStorageEnums().SUB_DOMAIN_PREFIX
		);
	}
}
