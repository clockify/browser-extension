const aBrowser = this.isChrome() ? chrome : { ...browser, action: browser.browserAction };

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
	// const isIdentityRedirectUrl = tab.url.includes(aBrowser.identity.getRedirectURL());
	const isUserLoggedIn = await TokenService.isLoggedIn();
	const registeredIntegrations = await getRegisteredIntegrations();

	if (!isUserLoggedIn && registeredIntegrations.length) {
		await unregisterAllIntegrations();
	}

	if (hasUrlChanged) {
		await aBrowser.tabs.sendMessage(tabId, { eventName: 'urlChanged' });

		setTimeout(() => backgroundWebSocketConnect(), 1000);

		IntegrationSelectors.fetchAndStore({ onlyIfPassedFollowingMinutesSinceLastFetch: 60 * 12 });
	}
});

aBrowser.runtime.onInstalled.addListener(async details => {
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

	if (isLoggedIn) {
		await setIntegrationSettingsForCurrentUser();
		await unregisterAllIntegrations();
		await registerEnabledIntegrations();
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

aBrowser.storage.onChanged.addListener(async changes => {
	if (changes['setIntDataForPlaywrightTestsSig']) {
		await setDataAfterLogin();
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
		) || { customUrls: [] };
		const { isEnabled } = userIntegrationSettings.find(
			({ name }) => lower(name) === lower(integration.name)
		) || { isEnabled: true };

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
		if (registered.length) {
			await aBrowser.scripting.updateContentScripts(registered);
		}

		if (unregistered.length) {
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
		const runAt = 'document_idle';
		const allFrames = true;
		const persistAcrossSessions = true;

		return { id, js, css, matches, runAt, allFrames, persistAcrossSessions };
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

async function startSigninFlow() {
	const url = await generateBaseAuthUrl();

	return authenticateCurrentUser(`${url}?type=login`);
}

async function startSignupFlow() {
	const url = await generateBaseAuthUrl();

	return authenticateCurrentUser(`${url}?type=signup`);
}

async function generateBaseAuthUrl() {
	const homeUrl = await localStorage.getItem('homeUrl');

	const firefoxRedirectNumber = 4;
	const chromeRedirectNumber = 3;

	const redirectNumber =
		TARGET_BROWSER_FOR_CLOCKIFY_EXT === 'firefox'
			? firefoxRedirectNumber
			: chromeRedirectNumber;

	return `${homeUrl}/redirect/${redirectNumber}`;
}

async function authenticateCurrentUser(url) {
	try {
		const { webAccessToken, webRefreshToken } = await extractWebTokens(url);
		const [, webAccessTokenPayload] = parseToken(webAccessToken);
		const userId = webAccessTokenPayload.sub;
		const { token, refreshToken } = await fetchExtensionTokens(userId, webRefreshToken);

		await storeExtensionTokens(token, refreshToken);

		await setDataAfterLogin();
	} catch (error) {
		console.error(error);
	}
}

function extractWebTokens(url) {
	return new Promise((resolve, reject) => {
		aBrowser.identity.launchWebAuthFlow({ url, interactive: true }, responseUrl => {
			if (!responseUrl) {
				return reject(new Error('Response URL is unavailable.'));
			}

			const responseUrlObject = new URL(responseUrl);
			const responseUrlParams = new URLSearchParams(responseUrlObject.search);

			const webAccessToken = responseUrlParams.get('accessToken');
			const webRefreshToken = responseUrlParams.get('refreshToken');

			if (!webAccessToken) {
				reject(new Error('Web access param is unavailable'));
			}

			if (!webRefreshToken) {
				reject(new Error('Web refresh param is unavailable'));
			}

			return resolve({ webAccessToken, webRefreshToken });
		});
	});
}

function parseToken(token) {
	if (typeof token !== 'string') {
		throw new TypeError('Invalid JWT: Token must be a string.');
	}

	const trimmedToken = token.trim();

	if (!trimmedToken) {
		throw new TypeError('Invalid JWT: Token cannot be empty.');
	}

	const segments = trimmedToken.split('.');

	if (segments.length !== 3) {
		throw new Error(
			'Malformed JWT: A valid token must consist of exactly three dot-separated segments.'
		);
	}

	const [encodedHeader, encodedPayload] = segments;

	try {
		const header = JSON.parse(decodeBase64Url(encodedHeader));
		const payload = JSON.parse(decodeBase64Url(encodedPayload));

		return [header, payload];
	} catch (error) {
		throw new Error(
			`Unparsable JWT: Failed to decode or parse token components. Internal detail: ${error.message}`
		);
	}
}

function decodeBase64Url(base64UrlString) {
	try {
		const base64 = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');

		const padLength = (4 - (base64.length % 4)) % 4;
		const paddedBase64 = base64.padEnd(base64.length + padLength, '=');

		const binaryString = atob(paddedBase64);

		const bytes = new Uint8Array(binaryString.length);

		for (let index = 0; index < binaryString.length; index++) {
			bytes[index] = binaryString.charCodeAt(index);
		}

		return new TextDecoder().decode(bytes);
	} catch (error) {
		throw new Error(`Base64 decoding failed: ${error.message}`);
	}
}

async function fetchExtensionTokens(userId, webRefreshToken) {
	const exchangeToken = await TokenService.fetchExchangeToken(userId, webRefreshToken);
	const { token, refreshToken } = await TokenService.fetchTokens(exchangeToken);

	return { token, refreshToken };
}

async function storeExtensionTokens(token, refreshToken) {
	await localStorage.setItem('token', token);
	await localStorage.setItem('refreshToken', refreshToken);
}

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.eventName) {
		case 'startSigninFlow':
			return startSigninFlow();
		case 'startSignupFlow':
			return startSignupFlow();
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
		case 'getOnboardingSurvey':
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
		case 'restoreTimeEntries':
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
		case 'submitOnboardingSurvey':
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
