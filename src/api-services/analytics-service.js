class AnalyticsService extends ClockifyService {
	static async sendAnalyticsEvent(options = {}) {
		// If the browser is not Chrome, exit early and don't send analytics
		if (typeof browser !== 'undefined') return;
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await localStorage.getItem('activeWorkspaceId');
		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/google-analytics`;
		const body = {
			clientId: options.userId, // Replace with your own client ID
			userId: options.userId,
			events: [
				{
					eventName: options.name,
					params: {
						engagement_time_msec: '100',
						...options,
					},
				},
			],
		};

		try {
			return await this.apiCall(endPoint, 'POST', body);
		} catch (error) {
			console.error('Error sending analytics event:', error);
			throw error;
		}
	}
}
