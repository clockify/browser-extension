class AuthService extends ClockifyService {
	static async signup(email, password, timeZone) {
		const baseUrl = await this.apiWriteEndpoint();
		const signupUrl = `${baseUrl}/auth/`;

		const body = {
			key: email,
			secret: password,
			timeZone: timeZone,
		};

		return this.apiCall(signupUrl, 'POST', body, true);
	}

	static async invalidateToken() {
		const baseUrl = await this.apiWriteEndpoint();
		const invalidateTokenUrl = `${baseUrl}/auth/tokens`;

		const token = await localStorage.getItem('token');
		const refreshToken = await localStorage.getItem('refreshToken');

		const headers = await createHttpHeaders(token);

		const body = { token, refreshToken };

		const response = await this.apiCall(invalidateTokenUrl, 'DELETE', body, true, headers);

		await localStorage.removeItem('token');
		await localStorage.removeItem('refreshToken');

		return response;
	}
}
