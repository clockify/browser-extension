import { Extension } from './application-types/extension';
import { ExtParameters } from './wrappers/ext-parameters';
import { getEnv } from './environment';
import { getLocalStorageEnums } from './enums/local-storage.enum';

const extension = new Extension();
const extParameters = new ExtParameters();
const environment = getEnv();

export class Application {
	constructor() {}

	afterLoad() {
		this.setWebSocketParamsToStorage();
		this.setBaseUrl();
		this.setHomeUrl();
		extension.afterLoad();
	}

	setIcon(iconStatus) {
		extension.setIcon(iconStatus);
	}

	async setWebSocketParamsToStorage() {
		if (!(await localStorage.getItem('webSocketEndpoint'))) {
			localStorage.setItem(
				'webSocketEndpoint',
				environment.webSocket.endpoint,
				getLocalStorageEnums().PERMANENT_PREFIX
			);
		}
		localStorage.setItem(
			'webSocketClientId',
			environment.webSocket.clientId,
			getLocalStorageEnums().PERMANENT_PREFIX
		);
	}

	async setBaseUrl() {
		const baseUrlFromStorage = await extParameters.getBaseUrl();
		if (!baseUrlFromStorage) {
			extParameters.setBaseUrl(environment.endpoint);
			extParameters.setSelfHosted(false);
		} else {
			if (baseUrlFromStorage.includes('api.clockify.me/api')) {
				extParameters.setBaseUrl(environment.endpoint);
				extParameters.setSelfHosted(false);
			} else {
				const selfHostedActive = baseUrlFromStorage !== environment.endpoint;
				extParameters.setSelfHosted(selfHostedActive);
			}
		}
	}

	async setHomeUrl() {
		const homeUrlFromStorage = await extParameters.getHomeUrl();
		if (!homeUrlFromStorage) {
			extParameters.setHomeUrl(environment.home);
		}
	}
}
