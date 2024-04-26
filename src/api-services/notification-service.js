class NotificationService extends ClockifyService {
	static async getNotificationsForUser() {
		const urlBase = await this.apiEndpoint;
		const userId = await this.userId;

		const url = `${urlBase}/users/${userId}/notifications`;

		return this.apiCall(url);
	}

	static async getVerificationNotificationsForUser() {
		const urlBase = await this.apiEndpoint;
		const userId = await this.userId;

		const url = `${urlBase}/users/${userId}/verification-notifications`;

		return this.apiCall(url);
	}

	static async getNewsForUser() {
		const urlBase = await this.apiEndpoint;
		const userId = await this.userId;

		const url = `${urlBase}/users/${userId}/news`;

		return this.apiCall(url);
	}

	static async readSingleNotificationForUser({ notificationId }) {
		const urlBase = await this.apiEndpoint;
		const userId = await this.userId;

		const url = `${urlBase}/users/${userId}/markAsRead`;
		const method = 'PUT';
		const body = { notificationId };

		return this.apiCall(url, method, body);
	}

	static async readSingleOrMultipleVerificationNotificationForUser({
		idOrIds,
	}) {
		const urlBase = await this.apiEndpoint;
		const userId = await this.userId;

		const url = `${urlBase}/users/${userId}/verification-notifications/read`;
		const method = 'POST';
		const body = { notifications: idOrIds };

		return this.apiCall(url, method, body);
	}

	static async readSingleOrMultipleNewsForUser({ newsIds }) {
		const urlBase = await this.apiEndpoint;
		const userId = await this.userId;

		const url = `${urlBase}/users/${userId}/news`;
		const method = 'PUT';
		const body = { newsIds };

		return this.apiCall(url, method, body);
	}

	static async readManyNotificationsForUser({ notificationIds }) {
		const urlBase = await this.apiEndpoint;
		const userId = await this.userId;

		const url = `${urlBase}/users/${userId}/markAsRead`;
		const method = 'POST';
		const body = { notifications: notificationIds };

		return this.apiCall(url, method, body);
	}
}
