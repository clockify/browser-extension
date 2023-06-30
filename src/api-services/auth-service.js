class AuthService extends ClockifyService {
	static async signup(email, password, timeZone) {
		const baseUrl = await this.apiEndpoint;
		const signupUrl = `${baseUrl}/auth/`;

		const body = {
			key: email,
			secret: password,
			timeZone: timeZone,
		};

		return this.apiCall(signupUrl, 'POST', body, true);
	}

	static async invalidateToken() {
		const baseUrl = await this.apiEndpoint;
		const invalidateTokenUrl = `${baseUrl}/auth/tokens`;
		const { token, refreshToken } = await localStorage.getItem([
			'token',
			'refreshToken',
		]);
		if (token && refreshToken) {
			const headers = await createHttpHeaders(token);

			const body = {
				token,
				refreshToken,
			};

			return this.apiCall(invalidateTokenUrl, 'DELETE', body, true, headers);
		}
		return Promise.resolve({ data: {}, status: 200 });
	}
}
