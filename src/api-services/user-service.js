class UserService extends ClockifyService {
	static async getUser() {
		const apiEndpoint = await this.apiEndpoint;
		const jwt = await localStorage.getItem('token');
		const userId = this.extractUserFromToken(jwt);
		const endPoint = `${apiEndpoint}/users/${userId}`;
		return await this.apiCall(endPoint);
	}

	static extractUserFromToken(token) {
		const base64Url = token.split('.')[1]; // Split the token into an array and get the second element
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace URL-safe base64 with regular base64
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join('')
		);

		const payload = JSON.parse(jsonPayload);
		const sub = payload.sub; // This is the 'sub' property
		return sub;
	}

	static async getAndStoreUser() {
		if (await isNavigatorOffline()) return;
		const { data, error } = await this.getUser();
		if (data) {
			const { email, id, activeWorkspace, settings, profilePicture, status } =
				data;
			await localStorage.setItem('user', data);
			await localStorage.setItem('userEmail', email);
			await localStorage.setItem('userId', id);
			await localStorage.setItem('userStatus', status);
			await localStorage.setItem('activeWorkspaceId', activeWorkspace);
			await localStorage.setItem('userSettings', JSON.stringify(settings));
			await localStorage.setItem('profilePicture', profilePicture);
			if (settings.lang) {
				const lang = settings.lang.toLowerCase();
				await localStorage.setItem('lang', lang);
			}
			UserWorkspaceStorage.getSetWorkspaceSettings(
				settings.projectPickerTaskFilter
			);
			UserService.getSetUserRoles();
		}
	}

	static async getUserRoles() {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const userId = await this.userId;
		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/users/${userId}/roles`;
		return await this.apiCall(endPoint);
	}

	static async getMemberProfile(workspaceId, userId) {
		const apiEndpoint = await this.apiEndpoint;
		const memberProfileUrl = `${apiEndpoint}/workspaces/${workspaceId}/member-profile/${userId}`;

		return this.apiCall(memberProfileUrl);
	}

	static async getSetUserRoles() {
		// aBrowser.storage.local.set({
		//     userRoles: []
		// });
		const { data, error, status } = await UserService.getUserRoles();
		if (data) {
			const { userRoles } = data;
			aBrowser.storage.local.set({
				userRoles,
			});
		} else {
		}
	}

	static async getBoot() {
		const homeUrl = await localStorage.getItem('permanent_homeUrl');
		return await this.apiCall(`${homeUrl}/web/boot`);
	}

	static async setDefaultWorkspace(workspaceId) {
		const userId = await this.userId;
		const apiEndpoint = await this.apiEndpoint;
		const saveWorkspaceUrl = `${apiEndpoint}/users/${userId}/defaultWorkspace/${workspaceId}`;

		return await this.apiCall(saveWorkspaceUrl, 'POST', '');
	}

	static async resendVerificationEmail() {
		const apiEndpoint = await this.apiEndpoint;
		const userEmail = await this.userEmail;
		const user = await this.user;
		// workaround because firefox
		const email = userEmail || user.email;
		const resendVerificationEmailUrl = `${apiEndpoint}/auth/email-verification/resend/${email}`;
		return await this.apiCall(resendVerificationEmailUrl, 'PUT', {})
	}

	// we only use this because navigator.onLine is not reliable
	// and if it says we are offline, we are not sure if we are really offline
	// so we use this to check if we are really offline
	static async checkInternetConnection() {
		const apiEndpoint = await this.apiEndpoint;
		const endPoint = `${apiEndpoint}/health`;
		return await this.apiCall(endPoint);
	}

	static async sendEmailVerification() {
		const baseUrl = await this.apiEndpoint;
		const userId = await this.userId;
		const method = 'PUT';

		return this.apiCall(`${baseUrl}/auth/resendVerifyEmail/${userId}`, method);
	}

	static async subscribeToNewsletter() {
		const baseUrl = await this.apiEndpoint;
		const userId = await this.userId;
		const method = 'PUT';

		await this.getAndStoreUser();

		const userResponse = await localStorage.getItem('user');

		const user =
			typeof userResponse === 'string'
				? JSON.parse(userResponse)
				: userResponse;

		const { name, settings, profilePicture } = user;

		user.settings.sendNewsletter = true;

		await localStorage.setItem('user', JSON.stringify(user));
		await localStorage.setItem('userSettings', JSON.stringify(user.settings));

		const body = { name, profilePicture, settings };

		return this.apiCall(`${baseUrl}/users/${userId}/settings`, method, body);
	}

	static async removeDeclinedUserFromWorkspace(options) {
		const baseUrl = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const userId = await this.userId;

		const url = `${baseUrl}/invitations/workspaces/${workspaceId}/users/${userId}`;
		const method = 'PUT';
		const body = options;

		return this.apiCall(url, method, body);
	}

	static async changeWorkspaceStatus(options) {
		const baseUrl = await this.apiEndpoint;
		const user = await localStorage.getItem('user');
		const defaultWorkspaceId = user.defaultWorkspace;
		const userId = await this.userId;

		const url = `${baseUrl}/invitations/workspaces/${defaultWorkspaceId}/users/${userId}/status`;
		const method = 'PUT';
		const body = options;

		return this.apiCall(url, method, body);
	}

	static async setDefaultUserWorkspace({ targetWorkspaceId }) {
		const baseUrl = await this.apiEndpoint;
		const userId = await this.userId;

		const url = `${baseUrl}/users/${userId}/defaultWorkspace/${targetWorkspaceId}`;
		const method = 'POST';

		return this.apiCall(url, method);
	}

	static async changeTimezone({ newTimezone }) {
		const baseUrl = await this.apiEndpoint;
		const userId = await this.userId;
		const method = 'PUT';

		await this.getAndStoreUser();

		const userResponse = await localStorage.getItem('user');

		const user =
			typeof userResponse === 'string'
				? JSON.parse(userResponse)
				: userResponse;

		const { name, settings, profilePicture } = user;

		user.settings.timeZone = newTimezone;

		await localStorage.setItem('user', JSON.stringify(user));
		await localStorage.setItem('userSettings', JSON.stringify(user.settings));

		const body = { name, profilePicture, settings };

		return this.apiCall(`${baseUrl}/users/${userId}/settings`, method, body);
	}
}
