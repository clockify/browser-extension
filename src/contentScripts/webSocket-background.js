const webSocketEventsEnums = {
	TIME_ENTRY_STARTED: 'TIME_ENTRY_STARTED',
	TIME_ENTRY_STOPPED: 'TIME_ENTRY_STOPPED',
	TIME_ENTRY_DELETED: 'TIME_ENTRY_DELETED',
	TIME_ENTRY_UPDATED: 'TIME_ENTRY_UPDATED',
	TIME_ENTRY_CREATED: 'TIME_ENTRY_CREATED',
	NEW_NOTIFICATIONS: 'NEW_NOTIFICATIONS',
	TIME_TRACKING_SETTINGS_UPDATED: 'TIME_TRACKING_SETTINGS_UPDATED',
	WORKSPACE_SETTINGS_UPDATED: 'WORKSPACE_SETTINGS_UPDATED',
	ACTIVE_WORKSPACE_CHANGED: 'ACTIVE_WORKSPACE_CHANGED',
	CHANGED_ADMIN_PERMISSION: 'CHANGED_ADMIN_PERMISSION',
	PROFILE_UPDATED: 'PROFILE_UPDATED',
	USER_SETTINGS_UPDATED: 'USER_SETTINGS_UPDATED',
	USER_EMAIL_VERIFIED: 'USER_EMAIL_VERIFIED',
	USER_LOGGEDOUT_FROM_WEB_APP: 'USER_LOGGEDOUT',
};
Object.freeze(webSocketEventsEnums);

let connection;
let reconnectIntervalId;

async function connectWebSocket() {
	const webSocketClientId = await localStorage.getItem(
		'permanent_webSocketClientId'
	);
	const userEmail = await localStorage.getItem('userEmail');
	const webSocketEndpoint = await localStorage.getItem(
		'permanent_webSocketEndpoint'
	);

	if (!webSocketClientId || !userEmail || !webSocketEndpoint || connection) {
		return;
	}
	const appName = `extension-${isChrome() ? 'chrome' : 'firefox'}`;

	const connectionId =
		`/${webSocketClientId}/` +
		`${userEmail}/` +
		`${Math.random().toString(36).substring(2, 10)}/${appName}`;

	connection = new WebSocket(`${webSocketEndpoint}${connectionId}`);

	connection.onopen = (event) => {
		if (event.type === 'open') {
			if (reconnectIntervalId) {
				clearInterval(reconnectIntervalId);
				reconnectIntervalId = null;
			}
			TokenService.getToken().then(async (token) => {
				if (!!token) {
					this.authenticate(token);
					await localStorage.setItem('wsConnectionId', connectionId);
				}
			});
		}
	};

	connection.onclose = (event) => {
		if (reconnectIntervalId) {
			clearInterval(reconnectIntervalId);
			reconnectIntervalId = null;
		}

		if (event.code === 4000) {
			connection = null;
			return;
		}

		// onCloseReconnectTimeout = setTimeout(() => this.connectWebSocket(document.token), getReconnectTimeout());
		reconnectIntervalId = setInterval(() => {
			TokenService.getToken().then(async (token) => {
				if (!!token) {
					this.connectWebSocket(token);
				}
			});
		}, 5000); //getReconnectTimeout());
	};

	connection.onmessage = (message) => {
		this.messageHandler(message);
	};

	connection.onerror = (error) => {
		//onErrorReconnectTimeout = setTimeout(() => this.connectWebSocket(document.token), getReconnectTimeout());
		connection.close();
	};
}

function disconnectWebSocket() {
	if (connection) {
		connection.close(4000, 'Closing connection permanent');
		localStorage.removeItem('wsConnectionId');
	}
}

async function messageHandler(event) {
	switch (event.data) {
		case webSocketEventsEnums.PROFILE_UPDATED: {
			break;
		}

		case webSocketEventsEnums.TIME_ENTRY_STARTED: {
			const { entry, error } = await TimeEntry.getEntryInProgress();
			if (entry === null || error) {
			} else {
				setTimeEntryInProgress(entry);
				aBrowser.action.setIcon({
					path: iconPathStarted,
				});

				aBrowser.runtime.sendMessage({
					eventName: 'entryStarted',
					options: { entry },
				});
			}

			this.sendWebSocketEventToExtension(event.data);
			this.addIdleListenerIfIdleIsEnabled();
			this.removeReminderTimer();
			this.restartPomodoro();
			this.addPomodoroTimer();
			break;
		}

		case webSocketEventsEnums.TIME_ENTRY_CREATED:
			this.sendWebSocketEventToExtension(event.data);
			break;

		case webSocketEventsEnums.TIME_ENTRY_STOPPED:
			setTimeEntryInProgress(null);
			aBrowser.action.setIcon({
				path: iconPathEnded,
			});
			this.sendWebSocketEventToExtension(event.data);
			this.removeIdleListenerIfIdleIsEnabled();
			this.addReminderTimer();
			this.restartPomodoro();
			aBrowser.runtime.sendMessage({
				eventName: 'entryEnded',
			});
			break;

		case webSocketEventsEnums.TIME_ENTRY_UPDATED: {
			const { entry, error } = await TimeEntry.getEntryInProgress();
			if (entry === null || error) {
			} else {
				setTimeEntryInProgress(event.data);
			}
			this.sendWebSocketEventToExtension(event.data);
			break;
		}

		case webSocketEventsEnums.TIME_ENTRY_DELETED: {
			const { entry, error } = await TimeEntry.getEntryInProgress();
			if (entry === null || error) {
				setTimeEntryInProgress(null);
				aBrowser.action.setIcon({
					path: iconPathEnded,
				});
				this.removeIdleListenerIfIdleIsEnabled();
				this.addReminderTimer();
				this.restartPomodoro();
			} else {
				setTimeEntryInProgress(entry);
				aBrowser.action.setIcon({
					path: iconPathStarted,
				});
			}
			this.sendWebSocketEventToExtension(event.data);
			break;
		}

		case webSocketEventsEnums.USER_SETTINGS_UPDATED:
			UserService.getAndStoreUser();
			break;

		case webSocketEventsEnums.WORKSPACE_SETTINGS_UPDATED:
			this.sendWebSocketEventToExtension(event.data);
			UserWorkspaceStorage.getSetWorkspaceSettings();
			UserService.getSetUserRoles();
			break;
		case webSocketEventsEnums.ACTIVE_WORKSPACE_CHANGED:
			UserService.getAndStoreUser()
				.then(() => {
					this.sendWebSocketEventToExtension(event.data);
				})
				.catch((err) => console.log(err));
			this.restartPomodoro();
			break;

		case webSocketEventsEnums.CHANGED_ADMIN_PERMISSION:
			this.sendWebSocketEventToExtension(event.data);
			UserWorkspaceStorage.getSetWorkspaceSettings();
			UserService.getSetUserRoles();
			break;
		case webSocketEventsEnums.USER_EMAIL_VERIFIED:
			aBrowser.runtime.sendMessage({
				eventName: 'USER_EMAIL_VERIFIED',
			});
			break;
		case webSocketEventsEnums.USER_LOGGEDOUT_FROM_WEB_APP:
			aBrowser.action.setIcon({
				path: iconPathEnded,
			});
			break;
	}
}

function sendWebSocketEventToExtension(event) {
	aBrowser.runtime.sendMessage({ eventName: event });
}

function authenticate(token) {
	if (!connection || !token) return;

	connection.send(token);
}

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.eventName) {
		case 'webSocketConnect':
			if (!connection) {
				this.connectWebSocket();
			}
			break;
		case 'webSocketDisconnect':
			if (connection) {
				this.disconnectWebSocket();
			}
			break;
	}
});

function backgroundWebSocketConnect() {
	if (!connection) {
		this.connectWebSocket();
	}
}

function getReconnectTimeout() {
	const min = 5 * 1000;
	const max = 15 * 1000;

	return Math.floor(Math.random() * (max - min + 1)) + min;
}
