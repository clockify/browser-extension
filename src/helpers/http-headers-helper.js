import { isChrome } from './browser-helper';

export class HttpHeadersHelper {
	constructor() {}

	async createHttpHeaders(token) {
		let headers = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		};

		if (token) {
			headers['X-Auth-Token'] = token;
		}

		const wsConnectionId = await localStorage.getItem('wsConnectionId');
		const subDomainName = await localStorage.getItem('subDomainName');

		if (wsConnectionId) {
			headers['socket-connection-id'] = wsConnectionId;
		}
		let appType = 'extension';
		if (isChrome()) {
			appType += '-chrome';
		} else {
			appType += '-firefox';
		}

		if (subDomainName) {
			headers['sub-domain-name'] = subDomainName;
		}

		headers['App-Name'] = appType;
		const lang = await localStorage.getItem('lang');
		if (lang) {
			headers['accept-language'] = lang;
		}

		return headers;
	}
}
