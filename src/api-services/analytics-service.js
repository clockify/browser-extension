class AnalyticsService extends ClockifyService {
	static async sendAnalyticsEvent(options = {}) {
		const isCurrentBrowserFirefox = typeof browser !== 'undefined';
		const isCurrentEnvironmentProduction = 'update_url' in chrome.runtime.getManifest();

		// If the browser is not Chrome, exit early and don't send analytics
		if (isCurrentBrowserFirefox) return;

		// Disable analytics outside of production environment
		if (!isCurrentEnvironmentProduction) return;

		const userId = await this.userId;
		const clientId = await this.getClientId();
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await localStorage.getItem('activeWorkspaceId');

		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/google-analytics`;

		const { analyticsEventName, eventParameters } = options;

		// Because all across our code base we use camelCase notation
		// and analytics specification requires snake case notation,
		// we use this function to be absolutely sure that body properties
		// will be snake case based
		function convertObjectKeysToSnakeCaseNotation(object) {
			if (typeof object != 'object') return object;

			for (const currentKeyName in object) {
				const keyNameWithSnakeNotation = currentKeyName.replace(
					/([A-Z])/g,
					$1 => '_' + $1.toLowerCase()
				);

				if (keyNameWithSnakeNotation != currentKeyName) {
					if (object.hasOwnProperty(currentKeyName)) {
						object[keyNameWithSnakeNotation] = object[currentKeyName];
						delete object[currentKeyName];
					}
				}

				if (typeof object[keyNameWithSnakeNotation] == 'object') {
					object[keyNameWithSnakeNotation] = convertObjectKeysToSnakeCaseNotation(
						object[keyNameWithSnakeNotation]
					);
				}
			}
			return object;
		}

		const body = {
			event_name: analyticsEventName,
			event_parameters: eventParameters,
			user_properties: {
				user_id: userId,
				workspace_id: workspaceId,
				client_id: clientId,
			},
		};

		try {
			return await this.apiCall(endPoint, 'POST', convertObjectKeysToSnakeCaseNotation(body));
		} catch (error) {
			console.error('Error sending analytics event:', error);
			throw error;
		}
	}

	static async getClientId() {
		const result = await chrome.storage.local.get('clientId');

		if (result?.clientId) return result.clientId;

		const clientId = await this.createAndSetClientId();

		return clientId;
	}

	static async createAndSetClientId() {
		const clientId = self.crypto.randomUUID();

		await chrome.storage.local.set({ clientId });

		return clientId;
	}
}
