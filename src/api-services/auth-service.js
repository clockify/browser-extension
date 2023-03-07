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
}
