const aBrowser = this.isChrome() ? chrome : { ...browser, action: browser.browserAction };

console.log('this.isChrome:', this.isChrome());

const windowIds = [];
const clockifyProd = 'https://app.clockify.me/tracker';
const iconPathEnded = '../assets/images/logo-16-gray.png';
const iconPathStarted = '../assets/images/logo-16.png';

aBrowser.alarms.create('sendAnalyticsEvents', { periodInMinutes: 20 });

aBrowser.alarms.onAlarm.addListener(alarm => {
	if (alarm.name === 'sendAnalyticsEvents') {
		AnalyticsService.sendAnalyticsEvents();
	}
});

aBrowser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	const hasUrlChanged = changeInfo.status === 'complete';
	const isIdentityRedirectUrl = tab.url.includes(aBrowser.identity.getRedirectURL());
	const isUserLoggedIn = await TokenService.isLoggedIn();
	const registeredIntegrations = await getRegisteredIntegrations();

	if (!isUserLoggedIn && registeredIntegrations.length) {
		await unregisterAllIntegrations();
	}

	if (hasUrlChanged) {
		if (isIdentityRedirectUrl) {
			if (!isUserLoggedIn) {
				try {
					await extractAndStoreTokens(tab.url);

					await aBrowser.tabs.remove(tabId);

					await setDataAfterLogin();
				} catch (error) {
					console.error(error);
				}
			}

			if (isUserLoggedIn) {
				const homeUrl = await localStorage.getItem('permanent_homeUrl');
				const url = homeUrl || 'https://app.clockify.me/';

				await aBrowser.tabs.update(tabId, { url });
			}
		}

		await aBrowser.tabs.sendMessage(tabId, { eventName: 'urlChanged' });

		setTimeout(() => backgroundWebSocketConnect(), 1000);

		IntegrationSelectors.fetchAndStore({ onlyIfPassedFollowingMinutesSinceLastFetch: 60 * 12 });
	}
});

aBrowser.runtime.onInstalled.addListener(async details => {
	console.log(`[Clockify] [onInstalled] 1: ${details.reason}`);

	if (details.reason === 'install') {
		aBrowser.tabs.create({ url: clockifyProd });
		aBrowser.action.setIcon({ path: iconPathEnded });
	}

	const localMessages = await localStorage.getItem('locale_messages');

	if (!localMessages || Object.keys(localMessages).length) {
		clockifyLocales.onProfileLangChange(null);
	}

	IntegrationSelectors.fetchAndStore({ onlyIfPassedFollowingMinutesSinceLastFetch: 1 });

	const isLoggedIn = await TokenService.isLoggedIn();
	const registeredIntegrations = await getRegisteredIntegrations();

	console.log(
		`[Clockify] [onInstalled] 2: ${details.reason}`,
		'| isLoggedIn:',
		isLoggedIn,
		'| alreadyRegisteredIntegrations:',
		registeredIntegrations.length
	);

	if (isLoggedIn) {
		console.log(`[Clockify] [onInstalled] 3: ${details.reason}`);

		await setIntegrationSettingsForCurrentUser();
		await unregisterAllIntegrations();
		await registerEnabledIntegrations();
	} else {
		console.error(`[Clockify] [onInstalled] 4: ${details.reason}, `);
	}
});

aBrowser.runtime.onStartup.addListener(async () => {
	const isLoggedIn = await TokenService.isLoggedIn();

	if (isLoggedIn) {
		const { entry, error } = await TimeEntry.getEntryInProgress();
		if (entry === null || error) {
			this.addReminderTimerOnStartingBrowser();
			aBrowser.runtime.sendMessage({ eventName: 'createStopTimerEvent' });
			TimeEntry.startTimerOnStartingBrowser();
			setTimeEntryInProgress(null);
			aBrowser.action.setIcon({ path: iconPathEnded });
		} else {
			setTimeEntryInProgress(entry);
			aBrowser.action.setIcon({ path: iconPathStarted });
		}
		this.connectWebSocket();
	}
});

aBrowser.windows.onCreated.addListener(async window => {
	const isLoggedIn = await TokenService.isLoggedIn();

	if (isLoggedIn && windowIds.length === 0) {
		const { entry, error } = await TimeEntry.getEntryInProgress();

		if (entry === null || error) {
			this.addReminderTimerOnStartingBrowser();
			TimeEntry.startTimerOnStartingBrowser();
			setTimeEntryInProgress(null);
			aBrowser.action.setIcon({ path: iconPathEnded });
		} else {
			setTimeEntryInProgress(entry);
			aBrowser.action.setIcon({ path: iconPathStarted });
		}

		this.connectWebSocket();
	}

	windowIds.push(window.id);
});

aBrowser.windows.onRemoved.addListener(window => {
	if (windowIds.includes(window)) {
		windowIds.splice(windowIds.indexOf(window), 1);
	}

	if (windowIds.length === 0) {
		this.removeReminderTimer();
		TimeEntry.endInProgressOnClosingBrowser();
		this.disconnectWebSocket();
		this.restartPomodoro();
	}
});

(async () => {
	setTimeout(() => backgroundWebSocketConnect(), 1000);

	UserWorkspaceStorage.getSetWorkspaceSettings();
	UserWorkspaceStorage.getWasRegionalEverAllowed();

	updateRolesForUser();

	UserService.getSetUserRoles();
})();

async function extractAndStoreTokens(url) {
	const [webAccessToken, webRefreshToken] = url
		.split('?')[1]
		.replace('accessToken=', '')
		.replace('refreshToken=', '')
		.split('&');

	const userId = JSON.parse(atob(webAccessToken.split('.')[1])).sub;

	const exchangeToken = await TokenService.fetchExchangeToken(userId, webRefreshToken);
	const { token, refreshToken } = await TokenService.fetchTokens(exchangeToken);

	await localStorage.setItem('token', token);
	await localStorage.setItem('refreshToken', refreshToken);
}

async function setDataAfterLogin() {
	await UserService.getAndStoreUser();

	const isLoggedIn = await TokenService.isLoggedIn();

	const lang = await localStorage.getItem('lang');
	clockifyLocales.onProfileLangChange(lang);
	const inProgress = await TimeEntry.getEntryInProgress();

	if (isLoggedIn && inProgress.entry) {
		aBrowser.action.setIcon({ path: iconPathStarted });
	}

	ProjectTaskService.getProjectsWithFilter('', 1, 50).then(projects => {
		if (projects && projects.data) {
			localStorage.setItem('preProjectList', { projectList: projects.data });
		}
	});

	await TagService.getAllTagsWithFilter(1, 50).then(tags => {
		if (tags && tags.data && tags.data.length) {
			localStorage.setItem('preTagsList', tags.data);
		}
	});

	if (isLoggedIn) {
		await setIntegrationSettingsForCurrentUser();
		await unregisterAllIntegrations();
		await registerEnabledIntegrations();
	}
}

function setTimeEntryInProgress(entry) {
	if (entry?.timeInterval && entry.timeInterval.end !== null) {
		return;
	} else {
		aBrowser.storage.local.set({ timeEntryInProgress: entry });
	}
}

aBrowser.windows.getAll({ populate: true, windowTypes: ['normal'] }, windowInfoArray => {
	for (const windowInfo of windowInfoArray) {
		windowIds.push(windowInfo.id);
	}
});

async function getCurrentUserIntegrationSettings() {
	const integrationSettings = await getIntegrationSettings();
	const currentUserId = await localStorage.getItem('userId');

	if (!integrationSettings || !currentUserId) return [];

	return integrationSettings[currentUserId];
}

async function getDefaultIntegrationSettings() {
	const response = await fetch('./integrations/integrations.json');

	const integrations = await response.json();

	return integrations
		.toSorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
		.map(integration => ({ ...integration, customUrls: [], isEnabled: true }));
}

async function getIntegrationSettings() {
	return (await localStorage.getItem('integrations')) || null;
}

async function setIntegrationSettingsForCurrentUser() {
	const currentUserId = await localStorage.getItem('userId');
	const currentIntegrationSettings = await getIntegrationSettings();
	const defaultIntegrationSettings = await getDefaultIntegrationSettings();
	const currentUserIntegrationSettings = await getCurrentUserIntegrationSettings();

	if (!currentUserId) return;

	if (!currentIntegrationSettings) {
		const defaultIntegrationSettingsForCurrentUser = {
			[currentUserId]: defaultIntegrationSettings,
		};
		const integrationSettingsUpdated = { ...defaultIntegrationSettingsForCurrentUser };

		await localStorage.setItem('integrations', integrationSettingsUpdated);

		return;
	}

	if (!currentUserIntegrationSettings) {
		const defaultIntegrationSettingsForCurrentUser = {
			[currentUserId]: defaultIntegrationSettings,
		};
		const integrationSettingsUpdated = {
			...currentIntegrationSettings,
			...defaultIntegrationSettingsForCurrentUser,
		};

		await localStorage.setItem('integrations', integrationSettingsUpdated);

		return;
	}

	const updatedIntegrationSettingsForCurrentUser =
		await getDefaultIntegrationSettingsWithPreservingCustomData(
			currentUserId,
			currentUserIntegrationSettings
		);

	const integrationSettingsUpdated = {
		...currentIntegrationSettings,
		...updatedIntegrationSettingsForCurrentUser,
	};

	await localStorage.setItem('integrations', integrationSettingsUpdated);
}

async function getDefaultIntegrationSettingsWithPreservingCustomData(
	userId,
	userIntegrationSettings
) {
	const defaultIntegrationSettings = await getDefaultIntegrationSettings();
	const updatedIntegrationSettings = [];

	for (const integration of defaultIntegrationSettings) {
		const { customUrls } = userIntegrationSettings.find(
			({ name }) => lower(name) === lower(integration.name)
		);
		const { isEnabled } = userIntegrationSettings.find(
			({ name }) => lower(name) === lower(integration.name)
		);

		updatedIntegrationSettings.push({ ...integration, customUrls, isEnabled });
	}

	return { [userId]: updatedIntegrationSettings };
}

function lower(string) {
	return string.toLowerCase();
}

function extractName(id) {
	const name = id.split(':').slice(1).join(':');

	return lower(name);
}

function generateId(name) {
	const id = `integration:${name}`;

	return lower(id);
}

async function registerIntegrationByIds(ids) {
	const names = ids.map(id => extractName(id));

	return await registerIntegrationByNames(names);
}

async function registerIntegrationByNames(names) {
	const loweredNames = names.map(name => lower(name));

	const userIntegrationSettings = await getCurrentUserIntegrationSettings();

	const integrations = userIntegrationSettings.filter(({ name }) =>
		loweredNames.includes(lower(name))
	);

	return await registerIntegrations(integrations);
}

async function unregisterIntegrationByNames(names) {
	const ids = names.map(name => generateId(name));

	return await unregisterIntegrationByIds(ids);
}

async function unregisterIntegrationByIds(ids) {
	await aBrowser.scripting.unregisterContentScripts({ ids });
}

async function getRegisteredIntegrations({ ids = [], names = [] } = {}) {
	const registeredContentScripts = await aBrowser.scripting.getRegisteredContentScripts();

	const registeredIntegrations = registeredContentScripts.filter(({ id }) =>
		id.startsWith('integration:')
	);

	const isFilteringSet = ids.length || names.length;

	if (!isFilteringSet) return registeredIntegrations;

	const filterByIdsAndNames = ({ id, name }) => ids.includes(id) || names.includes(name);

	return registeredIntegrations.filter(filterByIdsAndNames);
}

async function getUnregisteredIntegrations({ ids = [], names = [] } = {}) {
	const registeredIntegrations = await getRegisteredIntegrations();

	const registeredIntegrationNames = registeredIntegrations.map(({ name }) => lower(name));

	const allIntegrations = await getCurrentUserIntegrationSettings();

	const unregisteredIntegrations = allIntegrations.map(({ name }) =>
		registeredIntegrationNames.includes(lower(name))
	);

	const filterByIdsAndNames = ({ id, name }) => ids.includes(id) || names.includes(name);

	return unregisteredIntegrations.filter(filterByIdsAndNames);
}

/* async function getAllRegisteredIntegrations() {
	const registeredContentScripts = await aBrowser.scripting.getRegisteredContentScripts();

	const registeredIntegrations = registeredContentScripts.filter(({ id }) =>
		id.startsWith('integration:')
	);

	return registeredIntegrations;
} */

async function unregisterAllIntegrations() {
	const registeredIntegrations = await getRegisteredIntegrations();

	const registeredIntegrationsIds = registeredIntegrations.map(({ id }) => id);

	if (!registeredIntegrationsIds.length) return;

	await aBrowser.scripting.unregisterContentScripts({ ids: registeredIntegrationsIds });
}

async function registerEnabledIntegrations() {
	const integrations = await getCurrentUserIntegrationSettings();

	if (!integrations.length) return;

	const enabledIntegrations = integrations.filter(({ isEnabled }) => Boolean(isEnabled));

	await registerIntegrations(enabledIntegrations);
}

async function registerIntegrations(integrations) {
	const registrationData = generateIntegrationRegistrationData(integrations);

	const [registered, unregistered] =
		await splitIntegrationsByRegistrationStatus(registrationData);

	try {
		console.log(
			'Registered:',
			registered.length,
			'| Unregistered:',
			unregistered.length,
			'| of:',
			integrations.length
		);

		if (registered.length) {
			console.trace('Update the following integrations:', registered);
			await aBrowser.scripting.updateContentScripts(registered);
		}

		if (unregistered.length) {
			console.trace('Register the following integrations:', unregistered);
			await aBrowser.scripting.registerContentScripts(unregistered);
		}
	} catch (error) {
		console.error(error);
	}
}

function generateIntegrationRegistrationData(integrations) {
	return integrations.map(integration => {
		const { name, script, urls, customUrls } = integration;

		const id = generateId(name);
		const js = [
			'contentScripts/clockifyLocales.js',
			'contentScripts/service-localstorage.js',
			'vendors.bundle.js',
			'main.bundle.js',
			'popupDlg/clockifyButton.js',
			`integrations/${script}`,
		];
		const css = ['styles/main-integration.css', 'styles/react-datepicker.css'];
		const matches = [...urls, ...customUrls];

		return { id, js, css, matches, runAt: 'document_idle', allFrames: true };
	});
}

async function splitIntegrationsByRegistrationStatus(integrations) {
	const registered = [];
	const unregistered = [];

	const registeredIntegrations = await getRegisteredIntegrations();
	const registeredIntegrationIds = registeredIntegrations.map(({ id }) => id);

	integrations.forEach(integration => {
		if (registeredIntegrationIds.includes(integration.id)) {
			registered.push(integration);
		} else {
			unregistered.push(integration);
		}
	});

	return [registered, unregistered];
}

function updateRolesForUser() {
	UserWorkspaceStorage.getPermissionsForUser().then(({ data }) => {
		if (data && data.userRoles) {
			const isUserOwnerOrAdmin = !!data.userRoles.find(
				({ role }) => role === 'WORKSPACE_OWN' || role === 'WORKSPACE_ADMIN'
			);
			localStorage.setItem('isUserOwnerOrAdmin', isUserOwnerOrAdmin);
		}
	});
}

self.addEventListener('online', () => {
	localStorage.setItem('offline', 'false');
	aBrowser.runtime.sendMessage({ eventName: 'STATUS_CHANGED_ONLINE' });
});

self.addEventListener('offline', () => {
	localStorage.setItem('offline', 'true');
	aBrowser.runtime.sendMessage({ eventName: 'STATUS_CHANGED_OFFLINE' });
});

self.ononline = event => {
	localStorage.setItem('offline', 'false');
	aBrowser.runtime.sendMessage({ eventName: 'STATUS_CHANGED_ONLINE' });
};

self.onoffline = event => {
	localStorage.setItem('offline', 'true');
	aBrowser.runtime.sendMessage({ eventName: 'STATUS_CHANGED_OFFLINE' });
};

function workspaceChanged() {
	updateRolesForUser();
}

async function rerenderIntegrations() {
	const tabs = await aBrowser.tabs.query({});
	const tabIds = tabs.map(({ id }) => id);

	for (const tabId of tabIds) {
		aBrowser.tabs.sendMessage(tabId, { eventName: 'rerenderIntegrations' });
	}
}

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	request.eventName.toLowerCase().includes('integration') &&
		console.log('[Clockify] [New message] Message:', request);

	switch (request.eventName) {
		case 'workspaceChanged':
			return workspaceChanged();
		case 'rerenderIntegrations':
			return rerenderIntegrations();
		case 'refreshIntegrationsClicked':
			return IntegrationSelectors.fetchAndStore({
				onlyIfPassedFollowingMinutesSinceLastFetch: 1,
			});
		case 'updateIntegration':
			return registerIntegrationByNames([request.options.name]);
		case 'enableIntegration':
			return registerIntegrationByNames([request.options.name]);
		case 'disableIntegration':
			return unregisterIntegrationByNames([request.options.name]);
		case 'enableAllIntegrations':
			return registerEnabledIntegrations();
		case 'disableAllIntegrations':
			return unregisterAllIntegrations();
		case 'takeTimeEntryInProgress':
		case 'fetchEntryInProgress':
		case 'getDefaultProjectTask':
		case 'getRecentTimeEntries':
		case 'getUser':
		case 'getUserRoles':
		case 'getBoot':
		case 'getPermissionsForUser':
		case 'getNotificationsForUser':
		case 'getNewsForUser':
		case 'getVerificationNotificationsForUser':
		case 'getWorkspaceSettings':
		case 'getWorkspacesOfUser':
		case 'getWasRegionalEverAllowed':
		case 'invalidateToken':
		case 'checkInternetConnection':
		case 'resendVerificationEmail':
		case 'sendEmailVerification':
		case 'updateNewsSubscription':
		case 'clearAnalyticsEvents':
		case 'getFeedbackLocalizationKeys':
			return ClockifyIntegration.callFunction(request.eventName, null, sendResponse);
		case 'sendAnalyticsEvents':
		case 'endInProgress':
		case 'getMemberProfile':
		case 'getProjectsByIds':
		case 'startWithDescription':
		case 'getTimeEntries':
		case 'changeStart':
		case 'editTimeInterval':
		case 'getEntryInProgress':
		case 'setDescription':
		case 'removeProject':
		case 'getProjects':
		case 'readSingleOrMultipleNewsForUser':
		case 'readSingleNotificationForUser':
		case 'readSingleOrMultipleVerificationNotificationForUser':
		case 'readManyNotificationsForUser':
		case 'changeTimezone':
		case 'removeDeclinedUserFromWorkspace':
		case 'changeWorkspaceStatus':
		case 'setDefaultUserWorkspace':
		case 'getLastUsedProjectFromTimeEntries':
		case 'getProjectTasks':
		case 'getTaskOfProject':
		case 'submitDescription':
		case 'createProject':
		case 'editProject':
		case 'createTask':
		case 'editTask':
		case 'getTags':
		case 'createTag':
		case 'editTags':
		case 'discardTimeEntry':
		case 'deleteTimeEntry':
		case 'continueEntry':
		case 'searchEntries':
		case 'duplicateTimeEntry':
		case 'updateTimeEntryValues':
		case 'deleteTimeEntries':
		case 'removeProjectAsFavorite':
		case 'makeProjectFavorite':
		case 'editBillable':
		case 'submitTime':
		case 'getWSCustomField':
		case 'submitCustomField':
		case 'generateManualEntryData':
		case 'removeTask':
		case 'setDefaultWorkspace':
		case 'signup':
		case 'getClientsWithFilter':
		case 'createClient':
		case 'sendAnalyticsEvent':
		case 'makeFeedback':
			return ClockifyIntegration.callFunction(request.eventName, request, sendResponse);
		default:
			return false;
	}
});

function afterStartTimer() {
	addIdleListenerIfIdleIsEnabled();
	removeReminderTimer();
	// addPomodoroTimer();
}
