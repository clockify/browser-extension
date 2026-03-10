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
		if (!token) {
			return false;
		}

		const base64Url = token.split('.')[1];
		if (!base64Url) {
			return false;
		}
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const decodedToken = JSON.parse(atob(base64));
		const timeNow = new Date();

		return decodedToken.exp > timeNow / 1000;
	}

	static async isLoggedIn() {
		const token = await localStorage.getItem('token');
		return token !== null && token !== undefined;
	}
}
