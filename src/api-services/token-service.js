class TokenService extends ClockifyService {
	static async urlTokenRefresh() {
		const apiEndpoint = await this.apiEndpoint;
		return `${apiEndpoint}/auth/token/refresh`;
	}

	static async getToken() {
		const token = await localStorage.getItem('token');
		if (this.isTokenValid(token)) {
			return token;
		}

		const refreshToken = await localStorage.getItem('refreshToken');

		if (this.isTokenValid(refreshToken)) {
			const { data, error } = await this.refreshToken(refreshToken);
			if (!data || error) return null;

			aBrowser.storage.local.set({
				token: data.token,
				userId: data.userId,
				refreshToken: data.refreshToken,
				userEmail: data.userEmail,
			});

			await localStorage.setItem('token', data.token);
			await localStorage.setItem('refreshToken', data.refreshToken);
			await localStorage.setItem('userId', data.id);
			await localStorage.setItem('userEmail', data.email);

			return data.token;
		}

		return null;
	}

	static async refreshToken(token) {
		const endPoint = await this.urlTokenRefresh();
		const body = {
			refreshToken: token,
		};
		return await this.apiCall(endPoint, 'POST', body, /*withNoToken*/ true);
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
