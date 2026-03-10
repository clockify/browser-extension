import { getBrowser as getBrowserLegacy } from '~/helpers/browser-helper-legacy';
import { UAParser } from 'ua-parser-js';

const MINIMAL_BROWSER_VERSION_THAT_REQUIRES_NEW_API = '144.0.0.0';

function getBrowserName() {
	return TARGET_BROWSER_FOR_CLOCKIFY_EXT;
}

function getBrowserVersion() {
	const { browser } = UAParser(navigator.useragent);

	return browser.version;
}

class ExtensionApi {
	constructor() {
		this.browserName = getBrowserName();
		this.browserVersion = getBrowserVersion();
		this.api = null;

		this.init();
	}

	init() {
		this.api = this.shouldLegacyApiBeUsed ? getBrowserLegacy() : chrome;
	}

	getBrowser() {
		return this.api;
	}

	isChrome() {
		return this.isBrowserChrome;
	}

	get shouldLegacyApiBeUsed() {
		const majorInstalledBrowserVersion = this.extractMajorPartOfVersion(this.browserVersion);
		const majorMinimalBrowserVersion = this.extractMajorPartOfVersion(
			MINIMAL_BROWSER_VERSION_THAT_REQUIRES_NEW_API
		);

		if (this.isBrowserFirefox) {
			return true;
		}

		if (
			this.isBrowserChrome &&
			parseInt(majorInstalledBrowserVersion) < parseInt(majorMinimalBrowserVersion)
		) {
			return true;
		}

		return false;
	}

	extractMajorPartOfVersion(version) {
		return version.split('.')[0];
	}

	get isBrowserChrome() {
		return this.browserName.toLowerCase() === 'chrome';
	}

	get isBrowserFirefox() {
		return this.browserName.toLowerCase() === 'firefox';
	}

	get isBrowserEdge() {
		return this.browserName.toLowerCase() === 'edge';
	}

	get isBrowserUnsupported() {
		return !this.isBrowserChrome && !this.isBrowserFirefox && !this.isBrowserEdge;
	}
}

const extensionApi = new ExtensionApi();

export const getBrowser = extensionApi.getBrowser.bind(extensionApi);
export const isChrome = extensionApi.isChrome.bind(extensionApi);
