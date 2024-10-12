aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.eventName === 'contextMenuEnabledToggle') {
		toggleBrowserContextMenu(request.enabled);
	} else if (request.eventName === 'updateContexMenu') {
		setContextMenuOnBrowserStart();
	}
});

function listener(info, tab) {
	switch (info.menuItemId) {
		case 'startTimerWithDescriptionCM':
		case 'startTimerCM':
			TimeEntry.startTimerWithDescription(info);
			break;
		default:
			break;
	}
}

function toggleBrowserContextMenu(isContextMenuEnabled) {
	const startTimerTranslation = clockifyLocales.START_TIMER
		? clockifyLocales.START_TIMER
		: 'Start timer';
	const startTimerWithDescriptionTranslation =
		clockifyLocales.START_TIMER_WITH_DESCRIPTION
			? clockifyLocales.START_TIMER_WITH_DESCRIPTION + " '%s'"
			: 'Start timer with description';
	aBrowser.contextMenus.removeAll();
	if (isContextMenuEnabled) {
		aBrowser.contextMenus.create({
			id: 'startTimerWithDescriptionCM',
			title: startTimerWithDescriptionTranslation,
			contexts: ['selection'],
		});
		aBrowser.contextMenus.create({
			id: 'startTimerCM',
			title: startTimerTranslation,
			contexts: ['page'],
		});
		aBrowser.contextMenus.onClicked.removeListener(listener);
		aBrowser.contextMenus.onClicked.addListener(listener);
	}
}

async function setContextMenuOnBrowserStart() {
	const appStore = await localStorage.getItem('appStore');
	let isContextMenuEnabled = JSON.parse(appStore).state.contextMenuEnabled;

	if (typeof isContextMenuEnabled !== 'boolean') {
		isContextMenuEnabled = true;
	}
	toggleBrowserContextMenu(isContextMenuEnabled);
}

this.setContextMenuOnBrowserStart();
