class UserService extends ClockifyService {
	static async getUser() {
		const apiEndpoint = await this.apiEndpoint;
		const endPoint = `${apiEndpoint}/v1/user`;
		return await this.apiCall(endPoint);
	}

	static async getAndStoreUser() {
		if (await isNavigatorOffline()) return;
		const { data, error } = await this.getUser();
		if (data) {
			const { email, id, activeWorkspace, settings, profilePicture } = data;
			await localStorage.setItem('userEmail', email);
			await localStorage.setItem('userId', id);
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
}
