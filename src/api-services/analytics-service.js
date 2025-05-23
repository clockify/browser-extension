class AnalyticsService extends ClockifyService {
	static events = {
		trackerStarted: {
			event: 'Time Tracker > Start',
			moduleName: 'Time Tracker',
			featureName: 'Start The Tracker',
		},
		trackerStopped: {
			event: 'Time Tracker > Stop',
			moduleName: 'Time Tracker',
			featureName: 'Stop The Tracker',
		},
		entryDiscard: {
			event: 'Time Tracker > Discard',
			moduleName: 'Time Tracker',
			featureName: 'Discard Time Entry',
		},
		entryContinued: {
			event: 'Time Entry > Continue',
			moduleName: 'Time Tracker',
			featureName: 'Continue Time Entry',
		},
		entryAdded: {
			event: 'Time Tracker > Manual Add > Add',
			moduleName: 'Time Tracker',
			featureName: 'Add Time Entry Manual',
		},
		projectAdded: {
			event: 'Time Entry > Projects > Add',
			moduleName: 'Time Entry',
			featureName: 'Add New Project',
		},
	};

	static async sendAnalyticsEvents({ forceClearEvents } = {}) {
		const isOnline = Boolean((await UserService.checkInternetConnection()).data);
		const isCurrentBrowserFirefox = typeof browser !== 'undefined';
		const isCurrentEnvironmentProduction = 'update_url' in chrome.runtime.getManifest();

		// If the browser is Firefox, exit early and don't send analytics
		if (isCurrentBrowserFirefox) return;

		// Disable analytics on non-production version of the extension
		if (!isCurrentEnvironmentProduction) return;

		const events = JSON.parse(await localStorage.getItem('AnalyticsEvents')) || [];

		if (events.length === 0) return;

		if (!isOnline) {
			forceClearEvents && this.clearAnalyticsEvents();

			return;
		}

		await localStorage.setItem('AnalyticsEvents', '[]');

		const userId = await this.userId;
		const token = await localStorage.getItem('token');
		const osType = await localStorage.getItem('osName');
		const osVersion = await localStorage.getItem('osVersion');
		const browserType = await localStorage.getItem('browserName');
		const browserVersion = await localStorage.getItem('browserVersion');
		const extensionVersion = chrome.runtime.getManifest().version;

		const homeUrl = await localStorage.getItem('permanent_homeUrl');

		const developmentAnalyticsEndpoint = `https://app.dev.ops.clockify.me/analytics/events/apps`;
		const stageAnalyticsEndpoint = `https://app.stage.ops.clockify.me/analytics/events/apps`;
		const productionAnalyticsEndpoint = `https://api.clockify.me/porcos/events/apps`;

		const aimDevelopment = homeUrl.includes('app.dev.ops.');
		const aimStage = homeUrl.includes('app.stage.ops.');

		// Disable analytics on non-production environment
		if (aimDevelopment || aimStage) return;

		const analyticsEndpoint = aimDevelopment
			? developmentAnalyticsEndpoint
			: aimStage
			? stageAnalyticsEndpoint
			: productionAnalyticsEndpoint;

		const body = events.map(event => ({
			...event,
			sessionId: token,
			platform: 'Extension',
			userId,
			osType,
			osVersion,
			browserType,
			browserVersion,
			extensionVersion,
		}));

		try {
			return await this.apiCall(analyticsEndpoint, 'POST', body);
		} catch (error) {
			console.error('Error sending analytics event:', error);
			throw error;
		}
	}

	static async clearAnalyticsEvents() {
		await localStorage.setItem('AnalyticsEvents', '[]');
	}

	static async sendAnalyticsEvent(options = {}) {
		const isCurrentBrowserFirefox = typeof browser !== 'undefined';
		const isCurrentEnvironmentProduction = 'update_url' in chrome.runtime.getManifest();

		// If the browser is not Chrome, exit early and don't send analytics
		if (isCurrentBrowserFirefox) return;

		// Disable analytics outside of production environment
		if (!isCurrentEnvironmentProduction) return;

		const userId = await this.userId;
		const clientId = await this.getClientId();
		const apiEndpoint = await this.apiWriteEndpoint();
		const workspaceId = await localStorage.getItem('activeWorkspaceId');

		const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/google-analytics`;

		const { analyticsEventName, eventParameters } = options;

		const body = {
			event_name: analyticsEventName,
			event_parameters: eventParameters,
			user_properties: {
				user_id: userId,
				workspace_id: workspaceId,
				client_id: clientId
			}
		};

		try {
			return await this.apiCall(
				endPoint,
				'POST',
				AnalyticsService.convertKeysToSnakeNotation(body)
			);
		} catch (error) {
			console.error('Error sending analytics event:', error);
			throw error;
		}
	}

	// Because all across our code base we use camelCase notation
	// and analytics specification requires snake case notation,
	// we use this function to be absolutely sure that body properties
	// will be snake case based
	static convertKeysToSnakeNotation(object) {
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
				object[keyNameWithSnakeNotation] = AnalyticsService.convertKeysToSnakeNotation(
					object[keyNameWithSnakeNotation]
				);
			}
		}
		return object;
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

	static async storeAnalyticsEvents(addedEvents = []) {
		const workspaceId = await localStorage.getItem('activeWorkspaceId');

		addedEvents = addedEvents.map(event => ({ ...event, workspaceId }));

		const existingEvents = JSON.parse(await localStorage.getItem('AnalyticsEvents'));

		const allEvents = Array.isArray(existingEvents)
			? JSON.stringify([...existingEvents, ...addedEvents])
			: JSON.stringify([...addedEvents]);

		await localStorage.setItem('AnalyticsEvents', allEvents);
	}
}
