class TokenService extends ClockifyService {
	static async urlTokenRefresh() {
		const apiEndpoint = await this.apiWriteEndpoint();
		return `${apiEndpoint}/auth/token/refresh`;
	}

	static async getToken() {
		const token = await localStorage.getItem('token');
		const refreshToken = await localStorage.getItem('refreshToken');

		if (this.isTokenValid(token)) return token;

		if (this.isTokenValid(refreshToken)) {
			const { data, error } = await this.refreshToken(refreshToken);

			if (!data || error) return null;

			await localStorage.setItem('token', data.token);
			await localStorage.setItem('refreshToken', data.refreshToken);
			await localStorage.setItem('userId', data.id);
			await localStorage.setItem('userEmail', data.email);

			return data.token;
		}
	}

	static async fetchExchangeToken(userId, refreshToken) {
		const url = `${await this.apiWriteEndpoint()}/auth/token/exchange`;

		if (!this.isTokenValid(refreshToken)) throw new Error('Refresh token is invalid.');

		const body = { userId, refreshToken };

		const { data, error } = await this.apiCall(url, 'POST', body, true);

		if (error) {
			console.error(error);

			return;
		}

		return data.exchangeToken;
	}

	static async fetchTokens(exchangeToken) {
		const url = `${await this.apiWriteEndpoint()}/auth/exchange`;

		const body = { exchangeToken };

		const { data, error } = await this.apiCall(url, 'POST', body, true);

		if (error) {
			console.error(error);

			return;
		}

		const { token, refreshToken } = data;

		return { token, refreshToken };
	}

	/* static async getToken() {
		const token = await localStorage.getItem('token');
		const refreshToken = await localStorage.getItem('refreshToken');

		if (this.isTokenValid(token)) return token;

		if (this.isTokenValid(refreshToken)) {
			const { data, error } = await this.refreshToken(refreshToken);

			if (!data || error) return null;

			await localStorage.setItem('token', data.token);
			await localStorage.setItem('refreshToken', data.refreshToken);
			await localStorage.setItem('userId', data.id);
			await localStorage.setItem('userEmail', data.email);

			return data.token;
		}

		const exchangeToken = await this.getExchangeToken();

		const url = `${await this.apiWriteEndpoint()}/auth/exchange`;

		const body = { exchangeToken };

		const { data, error } = await this.apiCall(url, 'POST', body, true);

		if (error) {
			console.error(error);

			return;
		}

		await localStorage.setItem('token', data.token);
		await localStorage.setItem('refreshToken', data.refreshToken);

		return data.token;
	}

	static async getExchangeToken() {
		const url = `${await this.apiWriteEndpoint()}/auth/token/exchange`;

		const userId = await localStorage.getItem('userId');
		const refreshToken = await localStorage.getItem('refreshToken');

		if (!this.isTokenValid(refreshToken)) throw new Error('Refresh token is invalid.');

		const body = { userId, refreshToken };

		const { data, error } = await this.apiCall(url, 'POST', body, true);

		if (error) {
			console.error(error);

			return;
		}

		return data.exchangeToken;
	} */

	static async refreshToken(token) {
		const endPoint = await this.urlTokenRefresh();
		const body = { refreshToken: token };

		return await this.apiCall(endPoint, 'POST', body, true);
	}

	static isTokenValid(token) {
		if (!token) return false;

		const [, payload] = parseToken(token);

		const timeNow = new Date();

		return payload.exp > timeNow / 1000;
	}

	static async isLoggedIn() {
		const token = await localStorage.getItem('token');

		return token !== null && token !== undefined;
	}

	parseToken(token) {
		if (typeof token !== 'string') {
			throw new TypeError('Invalid JWT: Token must be a string.');
		}

		const trimmedToken = token.trim();

		if (!trimmedToken) {
			throw new TypeError('Invalid JWT: Token cannot be empty.');
		}

		const segments = trimmedToken.split('.');

		if (segments.length !== 3) {
			throw new Error(
				'Malformed JWT: A valid token must consist of exactly three dot-separated segments.'
			);
		}

		const [encodedHeader, encodedPayload] = segments;

		try {
			const header = decodeBase64Url(encodedHeader);
			const payload = decodeBase64Url(encodedPayload);

			return [header, payload];
		} catch (error) {
			throw new Error(
				`Unparsable JWT: Failed to decode or parse token components. Internal detail: ${error.message}`
			);
		}
	}

	decodeBase64Url(base64UrlString) {
		try {
			const base64 = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');

			const padLength = (4 - (base64.length % 4)) % 4;
			const paddedBase64 = base64.padEnd(base64.length + padLength, '=');

			const binaryString = atob(paddedBase64);

			const bytes = new Uint8Array(binaryString.length);

			for (let index = 0; index < binaryString.length; index++) {
				bytes[index] = binaryString.charCodeAt(index);
			}

			const decoded = new TextDecoder().decode(bytes);

			return JSON.parse(decoded);
		} catch (error) {
			throw new Error(`Base64 decoding failed: ${error.message}`);
		}
	}
}
